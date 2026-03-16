import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationInvite, InviteStatus } from './entities/organization-invite.entity';
import { OrgRole } from '../../common/enums/role.enum';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { InviteMemberInput } from './dto/invite-member.input';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepo: Repository<OrganizationMember>,
    @InjectRepository(OrganizationInvite)
    private readonly inviteRepo: Repository<OrganizationInvite>,
  ) {}

  async create(input: CreateOrganizationInput, ownerId: string): Promise<Organization> {
    const existing = await this.orgRepo.findOne({ where: { slug: input.slug } });
    if (existing) throw new ConflictException('Slug already taken');

    const org = this.orgRepo.create({ ...input });
    const savedOrg = await this.orgRepo.save(org);

    // Auto-add creator as OWNER
    const member = this.memberRepo.create({
      organizationId: savedOrg.id,
      userId: ownerId,
      role: OrgRole.OWNER,
    });
    await this.memberRepo.save(member);

    return savedOrg;
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findUserOrganizations(userId: string): Promise<Organization[]> {
    return this.orgRepo
      .createQueryBuilder('org')
      .innerJoin('org.members', 'member', 'member.userId = :userId', { userId })
      .orderBy('org.name', 'ASC')
      .getMany();
  }

  async getMembership(orgId: string, userId: string): Promise<OrganizationMember | null> {
    return this.memberRepo.findOne({
      where: { organizationId: orgId, userId },
      relations: ['user'],
    });
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    return this.memberRepo.find({
      where: { organizationId: orgId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    newRole: OrgRole,
    requesterId: string,
  ): Promise<OrganizationMember> {
    const requesterMembership = await this.getMembership(orgId, requesterId);
    if (!requesterMembership || requesterMembership.role !== OrgRole.OWNER) {
      throw new ForbiddenException('Only owners can change roles');
    }

    const membership = await this.getMembership(orgId, targetUserId);
    if (!membership) throw new NotFoundException('Member not found');

    // Cannot demote the last owner
    if (membership.role === OrgRole.OWNER && newRole !== OrgRole.OWNER) {
      const ownerCount = await this.memberRepo.count({
        where: { organizationId: orgId, role: OrgRole.OWNER },
      });
      if (ownerCount <= 1) throw new ForbiddenException('Cannot remove the last owner');
    }

    membership.role = newRole;
    return this.memberRepo.save(membership);
  }

  async removeMember(orgId: string, targetUserId: string, requesterId: string): Promise<boolean> {
    const requesterMembership = await this.getMembership(orgId, requesterId);
    if (
      !requesterMembership ||
      (requesterMembership.role !== OrgRole.OWNER && requesterMembership.role !== OrgRole.ADMIN)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const membership = await this.getMembership(orgId, targetUserId);
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove the owner');
    }

    await this.memberRepo.remove(membership);
    return true;
  }

  async createInvite(
    orgId: string,
    input: InviteMemberInput,
    inviterId: string,
  ): Promise<OrganizationInvite> {
    const membership = await this.getMembership(orgId, inviterId);
    if (
      !membership ||
      (membership.role !== OrgRole.OWNER && membership.role !== OrgRole.ADMIN)
    ) {
      throw new ForbiddenException('Only owners and admins can invite members');
    }

    // Invalidate existing pending invite for same email
    const existing = await this.inviteRepo.findOne({
      where: { organizationId: orgId, invitedEmail: input.email.toLowerCase(), status: InviteStatus.PENDING },
    });
    if (existing) {
      existing.status = InviteStatus.EXPIRED;
      await this.inviteRepo.save(existing);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const invite = this.inviteRepo.create({
      organizationId: orgId,
      invitedEmail: input.email.toLowerCase(),
      role: input.role,
      token: uuidv4(),
      expiresAt,
    });
    return this.inviteRepo.save(invite);
  }

  async acceptInvite(token: string, userId: string, userEmail: string): Promise<OrganizationMember> {
    const invite = await this.inviteRepo.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== InviteStatus.PENDING) throw new ForbiddenException('Invite is no longer valid');
    if (new Date() > invite.expiresAt) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepo.save(invite);
      throw new ForbiddenException('Invite has expired');
    }
    if (invite.invitedEmail !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Invite email does not match your account');
    }

    // Check if already a member
    const existing = await this.getMembership(invite.organizationId, userId);
    if (existing) throw new ConflictException('Already a member of this organization');

    const member = this.memberRepo.create({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    });
    const savedMember = await this.memberRepo.save(member);

    invite.status = InviteStatus.ACCEPTED;
    await this.inviteRepo.save(invite);

    return savedMember;
  }
}
