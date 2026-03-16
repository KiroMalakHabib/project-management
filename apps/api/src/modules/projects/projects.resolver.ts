import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProjectRole } from '../../common/enums/role.enum';

@Resolver(() => Project)
@UseGuards(JwtAuthGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Query(() => [Project], { name: 'projects' })
  async projects(
    @Args('organizationId', { type: () => ID }) orgId: string,
    @CurrentUser() user: User,
  ): Promise<Project[]> {
    return this.projectsService.findByOrganization(orgId, user.id);
  }

  @Query(() => Project, { name: 'project' })
  async project(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Project> {
    const project = await this.projectsService.findById(id);
    const membership = await this.projectsService.getProjectMembership(id, user.id);
    if (!membership) throw new Error('Access denied');
    return project;
  }

  @Query(() => [ProjectMember], { name: 'projectMembers' })
  async projectMembers(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: User,
  ): Promise<ProjectMember[]> {
    const membership = await this.projectsService.getProjectMembership(projectId, user.id);
    if (!membership) throw new Error('Access denied');
    return this.projectsService.getProjectMembers(projectId);
  }

  @Mutation(() => Project)
  async createProject(
    @Args('input') input: CreateProjectInput,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.projectsService.create(input, user.id);
  }

  @Mutation(() => ProjectMember)
  async addProjectMember(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role', { type: () => ProjectRole }) role: ProjectRole,
    @CurrentUser() requester: User,
  ): Promise<ProjectMember> {
    return this.projectsService.addMember(projectId, userId, role, requester.id);
  }

  @Mutation(() => Project)
  async archiveProject(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.projectsService.archiveProject(id, user.id);
  }
}
