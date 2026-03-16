import { Resolver, Query, Mutation, Subscription, Args, ID } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskColumn } from './entities/task-column.entity';
import { Comment } from './entities/comment.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { CreateColumnInput } from './dto/create-column.input';
import { TaskSubscriptionPayload } from './dto/task-subscription.type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PUB_SUB } from '../pubsub/pubsub.module';

@Resolver(() => Task)
@UseGuards(JwtAuthGuard)
export class TasksResolver {
  constructor(
    private readonly tasksService: TasksService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  // ── Columns ──────────────────────────────────────────────────────────────

  @Query(() => [TaskColumn], { name: 'projectColumns' })
  async projectColumns(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: User,
  ): Promise<TaskColumn[]> {
    return this.tasksService.getColumns(projectId, user.id);
  }

  @Mutation(() => TaskColumn)
  async createColumn(
    @Args('input') input: CreateColumnInput,
    @CurrentUser() user: User,
  ): Promise<TaskColumn> {
    return this.tasksService.createColumn(input, user.id);
  }

  @Mutation(() => [TaskColumn])
  async seedDefaultColumns(
    @Args('projectId', { type: () => ID }) projectId: string,
  ): Promise<TaskColumn[]> {
    return this.tasksService.seedDefaultColumns(projectId);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  @Query(() => [Task], { name: 'projectTasks' })
  async projectTasks(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: User,
  ): Promise<Task[]> {
    return this.tasksService.getProjectTasks(projectId, user.id);
  }

  @Query(() => Task, { name: 'task' })
  async task(@Args('id', { type: () => ID }) id: string): Promise<Task> {
    return this.tasksService.findTaskById(id);
  }

  @Mutation(() => Task)
  async createTask(
    @Args('input') input: CreateTaskInput,
    @CurrentUser() user: User,
  ): Promise<Task> {
    const task = await this.tasksService.createTask(input, user.id);
    await this.pubSub.publish(`TASK_EVENTS_${input.projectId}`, {
      taskEvents: { event: 'TASK_CREATED', task },
    });
    return task;
  }

  @Mutation(() => Task)
  async updateTask(
    @Args('input') input: UpdateTaskInput,
    @CurrentUser() user: User,
  ): Promise<Task> {
    const task = await this.tasksService.updateTask(input, user.id);
    await this.pubSub.publish(`TASK_EVENTS_${task.projectId}`, {
      taskEvents: { event: 'TASK_UPDATED', task },
    });
    return task;
  }

  @Mutation(() => Task)
  async moveTask(
    @Args('input') input: MoveTaskInput,
    @CurrentUser() user: User,
  ): Promise<Task> {
    const task = await this.tasksService.moveTask(input, user.id);
    await this.pubSub.publish(`TASK_EVENTS_${task.projectId}`, {
      taskEvents: { event: 'TASK_MOVED', task },
    });
    return task;
  }

  @Mutation(() => Boolean)
  async deleteTask(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tasksService.deleteTask(id, user.id);
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  @Mutation(() => Comment)
  async addComment(
    @Args('taskId', { type: () => ID }) taskId: string,
    @Args('body') body: string,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    const comment = await this.tasksService.addComment(taskId, body, user.id);
    await this.pubSub.publish(`COMMENTS_${taskId}`, {
      commentAdded: comment,
    });
    return comment;
  }

  @Mutation(() => Comment)
  async updateComment(
    @Args('id', { type: () => ID }) id: string,
    @Args('body') body: string,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.tasksService.updateComment(id, body, user.id);
  }

  @Mutation(() => Boolean)
  async deleteComment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tasksService.deleteComment(id, user.id);
  }

  @Query(() => [Comment], { name: 'taskComments' })
  async taskComments(
    @Args('taskId', { type: () => ID }) taskId: string,
  ): Promise<Comment[]> {
    return this.tasksService.getTaskComments(taskId);
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  @Subscription(() => TaskSubscriptionPayload, {
    filter: (payload, variables) =>
      payload.taskEvents !== undefined,
    resolve: (payload) => payload.taskEvents,
  })
  taskEvents(
    @Args('projectId', { type: () => ID }) projectId: string,
  ) {
    return this.pubSub.asyncIterator(`TASK_EVENTS_${projectId}`);
  }

  @Subscription(() => Comment, {
    resolve: (payload) => payload.commentAdded,
  })
  commentAdded(@Args('taskId', { type: () => ID }) taskId: string) {
    return this.pubSub.asyncIterator(`COMMENTS_${taskId}`);
  }
}
