import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrgRole, ProjectRole } from '../../common/enums/role.enum';

const mockOrg = { id: 'org-1', name: 'Acme', slug: 'acme' };

const mockProject: Project = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Alpha',
  description: null,
  status: ProjectStatus.ACTIVE,
  organization: mockOrg as any,
  members: [],
  columns: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMember = (role: ProjectRole): ProjectMember =>
  ({ id: 'pm-1', projectId: 'proj-1', userId: 'user-1', role, joinedAt: new Date() } as any);

const mockProjectRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockProjectMemberRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockOrgsService = {
  getMembership: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: mockProjectMemberRepo },
        { provide: OrganizationsService, useValue: mockOrgsService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const input = { organizationId: 'org-1', name: 'Alpha', description: null };

    it('should create project and auto-add creator as LEAD', async () => {
      mockOrgsService.getMembership.mockResolvedValue({ role: OrgRole.ADMIN });
      mockProjectRepo.create.mockReturnValue(mockProject);
      mockProjectRepo.save.mockResolvedValue(mockProject);
      mockProjectMemberRepo.create.mockReturnValue({ projectId: 'proj-1', userId: 'user-1', role: ProjectRole.LEAD });
      mockProjectMemberRepo.save.mockResolvedValue({});

      const result = await service.create(input as any, 'user-1');

      expect(mockProjectRepo.save).toHaveBeenCalled();
      expect(mockProjectMemberRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'proj-1', name: 'Alpha' });
    });

    it('should throw ForbiddenException when user is not an org member', async () => {
      mockOrgsService.getMembership.mockResolvedValue(null);

      await expect(service.create(input as any, 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has VIEWER role', async () => {
      mockOrgsService.getMembership.mockResolvedValue({ role: OrgRole.VIEWER });

      await expect(service.create(input as any, 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return project when found', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);

      const result = await service.findById('proj-1');

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByOrganization ──────────────────────────────────────────────────────

  describe('findByOrganization', () => {
    it('should return active projects for org members', async () => {
      mockOrgsService.getMembership.mockResolvedValue({ role: OrgRole.MEMBER });
      mockProjectRepo.find.mockResolvedValue([mockProject]);

      const result = await service.findByOrganization('org-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(mockProjectRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1', status: ProjectStatus.ACTIVE } }),
      );
    });

    it('should throw ForbiddenException for non-members', async () => {
      mockOrgsService.getMembership.mockResolvedValue(null);

      await expect(service.findByOrganization('org-1', 'outsider')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── addMember ───────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('should add member when requester is LEAD', async () => {
      mockProjectMemberRepo.findOne
        .mockResolvedValueOnce(mockMember(ProjectRole.LEAD))  // requester
        .mockResolvedValueOnce(null);                          // target not yet member
      mockProjectMemberRepo.create.mockReturnValue({ projectId: 'proj-1', userId: 'user-2', role: ProjectRole.MEMBER });
      mockProjectMemberRepo.save.mockResolvedValue({});

      await service.addMember('proj-1', 'user-2', ProjectRole.MEMBER, 'user-1');

      expect(mockProjectMemberRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when requester is not LEAD', async () => {
      mockProjectMemberRepo.findOne.mockResolvedValueOnce(mockMember(ProjectRole.MEMBER));

      await expect(
        service.addMember('proj-1', 'user-2', ProjectRole.MEMBER, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw when target user is already a member', async () => {
      mockProjectMemberRepo.findOne
        .mockResolvedValueOnce(mockMember(ProjectRole.LEAD))
        .mockResolvedValueOnce(mockMember(ProjectRole.MEMBER)); // already a member

      await expect(
        service.addMember('proj-1', 'user-2', ProjectRole.MEMBER, 'user-1'),
      ).rejects.toThrow('already a project member');
    });
  });

  // ── archiveProject ──────────────────────────────────────────────────────────

  describe('archiveProject', () => {
    it('should archive project when requester is ADMIN', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ ...mockProject });
      mockOrgsService.getMembership.mockResolvedValue({ role: OrgRole.ADMIN });
      mockProjectRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.archiveProject('proj-1', 'user-1');

      expect(result.status).toBe(ProjectStatus.ARCHIVED);
    });

    it('should throw ForbiddenException when requester is MEMBER', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ ...mockProject });
      mockOrgsService.getMembership.mockResolvedValue({ role: OrgRole.MEMBER });

      await expect(service.archiveProject('proj-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
