import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';
import { OrgRole } from '../../common/enums/role.enum';

const mockUser = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };
const mockOrg = { id: 'org-1', name: 'Acme', slug: 'acme', description: null };
const mockMembership = { id: 'mem-1', userId: 'user-1', organizationId: 'org-1', role: OrgRole.ADMIN };

const mockOrgsService = {
  findUserOrganizations: jest.fn(),
  findById: jest.fn(),
  getMembership: jest.fn(),
  getMembers: jest.fn(),
  create: jest.fn(),
  createInvite: jest.fn(),
  acceptInvite: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
};

describe('OrganizationsResolver', () => {
  let resolver: OrganizationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsResolver,
        { provide: OrganizationsService, useValue: mockOrgsService },
      ],
    }).compile();

    resolver = module.get<OrganizationsResolver>(OrganizationsResolver);
    jest.clearAllMocks();
  });

  describe('myOrganizations', () => {
    it('should return organizations for current user', async () => {
      mockOrgsService.findUserOrganizations.mockResolvedValue([mockOrg]);

      const result = await resolver.myOrganizations(mockUser as any);

      expect(mockOrgsService.findUserOrganizations).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockOrg]);
    });
  });

  describe('organization', () => {
    it('should return org when user is a member', async () => {
      mockOrgsService.findById.mockResolvedValue(mockOrg);
      mockOrgsService.getMembership.mockResolvedValue(mockMembership);

      const result = await resolver.organization('org-1', mockUser as any);

      expect(result).toEqual(mockOrg);
    });

    it('should throw when user is not a member', async () => {
      mockOrgsService.findById.mockResolvedValue(mockOrg);
      mockOrgsService.getMembership.mockResolvedValue(null);

      await expect(resolver.organization('org-1', mockUser as any)).rejects.toThrow('Access denied');
    });
  });

  describe('createOrganization', () => {
    it('should delegate to service and return created org', async () => {
      mockOrgsService.create.mockResolvedValue(mockOrg);
      const input = { name: 'Acme', slug: 'acme' };

      const result = await resolver.createOrganization(input as any, mockUser as any);

      expect(mockOrgsService.create).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockOrg);
    });
  });

  describe('updateMemberRole', () => {
    it('should delegate to service', async () => {
      mockOrgsService.updateMemberRole.mockResolvedValue({ ...mockMembership, role: OrgRole.MEMBER });

      const result = await resolver.updateMemberRole('org-1', 'user-2', OrgRole.MEMBER, mockUser as any);

      expect(mockOrgsService.updateMemberRole).toHaveBeenCalledWith('org-1', 'user-2', OrgRole.MEMBER, 'user-1');
      expect(result.role).toBe(OrgRole.MEMBER);
    });
  });

  describe('removeMember', () => {
    it('should delegate to service and return true', async () => {
      mockOrgsService.removeMember.mockResolvedValue(true);

      const result = await resolver.removeMember('org-1', 'user-2', mockUser as any);

      expect(mockOrgsService.removeMember).toHaveBeenCalledWith('org-1', 'user-2', 'user-1');
      expect(result).toBe(true);
    });
  });
});
