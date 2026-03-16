import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationInvite } from './entities/organization-invite.entity';
import { OrgRole } from '../../common/enums/role.enum';

const mockOrgRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
const mockMemberRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn(), remove: jest.fn(), find: jest.fn() };
const mockInviteRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: getRepositoryToken(OrganizationMember), useValue: mockMemberRepo },
        { provide: getRepositoryToken(OrganizationInvite), useValue: mockInviteRepo },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization and add owner', async () => {
      mockOrgRepo.findOne.mockResolvedValue(null);
      const mockOrg = { id: 'org-1', name: 'Test Org', slug: 'test-org' };
      mockOrgRepo.create.mockReturnValue(mockOrg);
      mockOrgRepo.save.mockResolvedValue(mockOrg);
      mockMemberRepo.create.mockReturnValue({ organizationId: 'org-1', userId: 'user-1', role: OrgRole.OWNER });
      mockMemberRepo.save.mockResolvedValue({});

      const result = await service.create({ name: 'Test Org', slug: 'test-org' }, 'user-1');

      expect(result).toEqual(mockOrg);
      expect(mockMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: OrgRole.OWNER }),
      );
    });

    it('should throw ConflictException if slug taken', async () => {
      mockOrgRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ name: 'Org', slug: 'taken' }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMemberRole', () => {
    it('should throw ForbiddenException if requester is not OWNER', async () => {
      mockMemberRepo.findOne.mockResolvedValue({ role: OrgRole.ADMIN });
      await expect(
        service.updateMemberRole('org-1', 'user-2', OrgRole.MEMBER, 'requester-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
