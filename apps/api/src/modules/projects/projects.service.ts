import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrgRole, ProjectRole } from '../../common/enums/role.enum';
import { CreateProjectInput } from './dto/create-project.input';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(input: CreateProjectInput, userId: string): Promise<Project> {
    // Verify user is an org member with at least ADMIN role
    const membership = await this.orgsService.getMembership(input.organizationId, userId);
    if (!membership) throw new ForbiddenException('Not a member of this organization');
    if (membership.role === OrgRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot create projects');
    }

    const project = this.projectRepo.create({ ...input });
    const savedProject = await this.projectRepo.save(project);

    // Auto-add creator as LEAD
    const member = this.projectMemberRepo.create({
      projectId: savedProject.id,
      userId,
      role: ProjectRole.LEAD,
    });
    await this.projectMemberRepo.save(member);

    return savedProject;
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id }, relations: ['organization'] });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findByOrganization(orgId: string, userId: string): Promise<Project[]> {
    const membership = await this.orgsService.getMembership(orgId, userId);
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    return this.projectRepo.find({
      where: { organizationId: orgId, status: ProjectStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async getProjectMembership(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.projectMemberRepo.findOne({
      where: { projectId, userId },
      relations: ['user'],
    });
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return this.projectMemberRepo.find({
      where: { projectId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async addMember(projectId: string, targetUserId: string, role: ProjectRole, requesterId: string): Promise<ProjectMember> {
    const requesterMembership = await this.getProjectMembership(projectId, requesterId);
    if (!requesterMembership || requesterMembership.role !== ProjectRole.LEAD) {
      throw new ForbiddenException('Only project leads can add members');
    }

    const existing = await this.getProjectMembership(projectId, targetUserId);
    if (existing) throw new Error('User is already a project member');

    const member = this.projectMemberRepo.create({ projectId, userId: targetUserId, role });
    return this.projectMemberRepo.save(member);
  }

  async archiveProject(id: string, userId: string): Promise<Project> {
    const project = await this.findById(id);
    const membership = await this.orgsService.getMembership(project.organizationId, userId);
    if (!membership || membership.role === OrgRole.VIEWER || membership.role === OrgRole.MEMBER) {
      throw new ForbiddenException('Insufficient permissions to archive project');
    }

    project.status = ProjectStatus.ARCHIVED;
    return this.projectRepo.save(project);
  }
}
