import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from './entities/project.entity';
import { ProjectRole } from '../../common/enums/role.enum';

const mockUser = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };
const mockProject = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Alpha',
  status: ProjectStatus.ACTIVE,
};
const mockMembership = { id: 'pm-1', projectId: 'proj-1', userId: 'user-1', role: ProjectRole.LEAD };

const mockProjectsService = {
  findByOrganization: jest.fn(),
  findById: jest.fn(),
  getProjectMembership: jest.fn(),
  getProjectMembers: jest.fn(),
  create: jest.fn(),
  addMember: jest.fn(),
  archiveProject: jest.fn(),
};

describe('ProjectsResolver', () => {
  let resolver: ProjectsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsResolver,
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    }).compile();

    resolver = module.get<ProjectsResolver>(ProjectsResolver);
    jest.clearAllMocks();
  });

  describe('projects', () => {
    it('should return projects for org members', async () => {
      mockProjectsService.findByOrganization.mockResolvedValue([mockProject]);

      const result = await resolver.projects('org-1', mockUser as any);

      expect(mockProjectsService.findByOrganization).toHaveBeenCalledWith('org-1', 'user-1');
      expect(result).toEqual([mockProject]);
    });
  });

  describe('project', () => {
    it('should return project when user is a member', async () => {
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockProjectsService.getProjectMembership.mockResolvedValue(mockMembership);

      const result = await resolver.project('proj-1', mockUser as any);

      expect(result).toEqual(mockProject);
    });

    it('should throw when user is not a project member', async () => {
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockProjectsService.getProjectMembership.mockResolvedValue(null);

      await expect(resolver.project('proj-1', mockUser as any)).rejects.toThrow('Access denied');
    });
  });

  describe('createProject', () => {
    it('should delegate to service', async () => {
      mockProjectsService.create.mockResolvedValue(mockProject);
      const input = { organizationId: 'org-1', name: 'Alpha' };

      const result = await resolver.createProject(input as any, mockUser as any);

      expect(mockProjectsService.create).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockProject);
    });
  });

  describe('archiveProject', () => {
    it('should delegate to service', async () => {
      const archived = { ...mockProject, status: ProjectStatus.ARCHIVED };
      mockProjectsService.archiveProject.mockResolvedValue(archived);

      const result = await resolver.archiveProject('proj-1', mockUser as any);

      expect(mockProjectsService.archiveProject).toHaveBeenCalledWith('proj-1', 'user-1');
      expect(result.status).toBe(ProjectStatus.ARCHIVED);
    });
  });
});
