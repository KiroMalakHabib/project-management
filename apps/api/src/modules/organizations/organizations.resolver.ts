import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationInvite } from './entities/organization-invite.entity';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { InviteMemberInput } from './dto/invite-member.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OrgRole } from '../../common/enums/role.enum';

@Resolver(() => Organization)
@UseGuards(JwtAuthGuard)
export class OrganizationsResolver {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Query(() => [Organization], { name: 'myOrganizations' })
  async myOrganizations(@CurrentUser() user: User): Promise<Organization[]> {
    return this.orgsService.findUserOrganizations(user.id);
  }

  @Query(() => Organization, { name: 'organization' })
  async organization(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Organization> {
    const org = await this.orgsService.findById(id);
    const membership = await this.orgsService.getMembership(id, user.id);
    if (!membership) throw new Error('Access denied');
    return org;
  }

  @Query(() => [OrganizationMember], { name: 'organizationMembers' })
  async organizationMembers(
    @Args('organizationId', { type: () => ID }) orgId: string,
    @CurrentUser() user: User,
  ): Promise<OrganizationMember[]> {
    const membership = await this.orgsService.getMembership(orgId, user.id);
    if (!membership) throw new Error('Access denied');
    return this.orgsService.getMembers(orgId);
  }

  @Mutation(() => Organization)
  async createOrganization(
    @Args('input') input: CreateOrganizationInput,
    @CurrentUser() user: User,
  ): Promise<Organization> {
    return this.orgsService.create(input, user.id);
  }

  @Mutation(() => OrganizationInvite)
  async inviteMember(
    @Args('organizationId', { type: () => ID }) orgId: string,
    @Args('input') input: InviteMemberInput,
    @CurrentUser() user: User,
  ): Promise<OrganizationInvite> {
    return this.orgsService.createInvite(orgId, input, user.id);
  }

  @Mutation(() => OrganizationMember)
  async acceptInvite(
    @Args('token') token: string,
    @CurrentUser() user: User,
  ): Promise<OrganizationMember> {
    return this.orgsService.acceptInvite(token, user.id, user.email);
  }

  @Mutation(() => OrganizationMember)
  async updateMemberRole(
    @Args('organizationId', { type: () => ID }) orgId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role', { type: () => OrgRole }) role: OrgRole,
    @CurrentUser() requester: User,
  ): Promise<OrganizationMember> {
    return this.orgsService.updateMemberRole(orgId, userId, role, requester.id);
  }

  @Mutation(() => Boolean)
  async removeMember(
    @Args('organizationId', { type: () => ID }) orgId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() requester: User,
  ): Promise<boolean> {
    return this.orgsService.removeMember(orgId, userId, requester.id);
  }
}
