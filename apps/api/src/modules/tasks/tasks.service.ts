import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskColumn } from './entities/task-column.entity';
import { Comment } from './entities/comment.entity';
import { Attachment } from './entities/attachment.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { CreateColumnInput } from './dto/create-column.input';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskColumn)
    private readonly columnRepo: Repository<TaskColumn>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly projectsService: ProjectsService,
  ) {}

  // ── Columns ──────────────────────────────────────────────────────────────

  async createColumn(input: CreateColumnInput, userId: string): Promise<TaskColumn> {
    const membership = await this.projectsService.getProjectMembership(input.projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    const lastCol = await this.columnRepo.findOne({
      where: { projectId: input.projectId },
      order: { position: 'DESC' },
    });
    const position = (lastCol?.position ?? -1) + 1;

    const col = this.columnRepo.create({
      ...input,
      position,
      color: input.color ?? '#6B7280',
    });
    return this.columnRepo.save(col);
  }

  async getColumns(projectId: string, userId: string): Promise<TaskColumn[]> {
    const membership = await this.projectsService.getProjectMembership(projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    return this.columnRepo.find({
      where: { projectId },
      order: { position: 'ASC' },
      relations: ['tasks'],
    });
  }

  async seedDefaultColumns(projectId: string): Promise<TaskColumn[]> {
    const defaults = [
      { name: 'To Do', color: '#6B7280', position: 0 },
      { name: 'In Progress', color: '#3B82F6', position: 1 },
      { name: 'In Review', color: '#F59E0B', position: 2 },
      { name: 'Done', color: '#10B981', position: 3 },
    ];

    const cols = this.columnRepo.create(
      defaults.map((d) => ({ ...d, projectId })),
    );
    return this.columnRepo.save(cols);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async createTask(input: CreateTaskInput, reporterId: string): Promise<Task> {
    const membership = await this.projectsService.getProjectMembership(input.projectId, reporterId);
    if (!membership) throw new ForbiddenException('Not a project member');

    const lastTask = await this.taskRepo.findOne({
      where: { columnId: input.columnId },
      order: { position: 'DESC' },
    });
    const position = (lastTask?.position ?? -1) + 1;

    const task = this.taskRepo.create({
      ...input,
      reporterId,
      position,
      priority: input.priority ?? 'MEDIUM',
    });
    return this.taskRepo.save(task);
  }

  async findTaskById(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['column', 'assignee', 'reporter', 'comments', 'comments.author', 'attachments'],
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async getProjectTasks(projectId: string, userId: string): Promise<Task[]> {
    const membership = await this.projectsService.getProjectMembership(projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    return this.taskRepo.find({
      where: { projectId },
      order: { position: 'ASC' },
      relations: ['assignee'],
    });
  }

  async updateTask(input: UpdateTaskInput, userId: string): Promise<Task> {
    const task = await this.findTaskById(input.id);
    const membership = await this.projectsService.getProjectMembership(task.projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    Object.assign(task, input);
    return this.taskRepo.save(task);
  }

  async moveTask(input: MoveTaskInput, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: input.taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const membership = await this.projectsService.getProjectMembership(task.projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    task.columnId = input.targetColumnId;
    task.position = input.position;
    return this.taskRepo.save(task);
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const membership = await this.projectsService.getProjectMembership(task.projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    await this.taskRepo.remove(task);
    return true;
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  async addComment(taskId: string, body: string, authorId: string): Promise<Comment> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const membership = await this.projectsService.getProjectMembership(task.projectId, authorId);
    if (!membership) throw new ForbiddenException('Not a project member');

    const comment = this.commentRepo.create({ taskId, body, authorId });
    return this.commentRepo.save(comment);
  }

  async updateComment(id: string, body: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Can only edit your own comments');

    comment.body = body;
    comment.isEdited = true;
    return this.commentRepo.save(comment);
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Can only delete your own comments');

    await this.commentRepo.remove(comment);
    return true;
  }

  async getTaskComments(taskId: string): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { taskId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }
}
