import { Test, TestingModule } from '@nestjs/testing';
import { TasksResolver } from './tasks.resolver';
import { TasksService } from './tasks.service';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { TaskPriority } from '../../common/enums/task.enum';

const mockUser = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };

const mockTask = {
  id: 'task-1',
  columnId: 'col-1',
  projectId: 'proj-1',
  title: 'Fix bug',
  priority: TaskPriority.MEDIUM,
  position: 1.0,
};

const mockColumn = { id: 'col-1', projectId: 'proj-1', name: 'To Do', position: 0 };
const mockComment = {
  id: 'cmt-1',
  taskId: 'task-1',
  body: 'Looks good',
  authorId: 'user-1',
  isEdited: false,
  createdAt: new Date(),
};

const mockTasksService = {
  getColumns: jest.fn(),
  createColumn: jest.fn(),
  seedDefaultColumns: jest.fn(),
  getProjectTasks: jest.fn(),
  findTaskById: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  moveTask: jest.fn(),
  deleteTask: jest.fn(),
  addComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
  getTaskComments: jest.fn(),
};

const mockPubSub = {
  publish: jest.fn().mockResolvedValue(undefined),
  asyncIterator: jest.fn(),
};

describe('TasksResolver', () => {
  let resolver: TasksResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksResolver,
        { provide: TasksService, useValue: mockTasksService },
        { provide: PUB_SUB, useValue: mockPubSub },
      ],
    }).compile();

    resolver = module.get<TasksResolver>(TasksResolver);
    jest.clearAllMocks();
  });

  describe('projectColumns', () => {
    it('should return columns for a project', async () => {
      mockTasksService.getColumns.mockResolvedValue([mockColumn]);

      const result = await resolver.projectColumns('proj-1', mockUser as any);

      expect(mockTasksService.getColumns).toHaveBeenCalledWith('proj-1', 'user-1');
      expect(result).toEqual([mockColumn]);
    });
  });

  describe('task', () => {
    it('should return task by id', async () => {
      mockTasksService.findTaskById.mockResolvedValue(mockTask);

      const result = await resolver.task('task-1');

      expect(mockTasksService.findTaskById).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('createTask', () => {
    it('should create task and publish TASK_CREATED event', async () => {
      mockTasksService.createTask.mockResolvedValue(mockTask);

      const input = { columnId: 'col-1', projectId: 'proj-1', title: 'Fix bug', priority: TaskPriority.MEDIUM };
      const result = await resolver.createTask(input as any, mockUser as any);

      expect(mockTasksService.createTask).toHaveBeenCalledWith(input, 'user-1');
      expect(mockPubSub.publish).toHaveBeenCalledWith(
        'TASK_EVENTS_proj-1',
        expect.objectContaining({ taskEvents: { event: 'TASK_CREATED', task: mockTask } }),
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('moveTask', () => {
    it('should move task and publish TASK_MOVED event', async () => {
      const movedTask = { ...mockTask, columnId: 'col-2' };
      mockTasksService.moveTask.mockResolvedValue(movedTask);

      const input = { taskId: 'task-1', columnId: 'col-2', position: 0.5 };
      await resolver.moveTask(input as any, mockUser as any);

      expect(mockPubSub.publish).toHaveBeenCalledWith(
        'TASK_EVENTS_proj-1',
        expect.objectContaining({ taskEvents: { event: 'TASK_MOVED', task: movedTask } }),
      );
    });
  });

  describe('deleteTask', () => {
    it('should delegate to service', async () => {
      mockTasksService.deleteTask.mockResolvedValue(true);

      const result = await resolver.deleteTask('task-1', mockUser as any);

      expect(mockTasksService.deleteTask).toHaveBeenCalledWith('task-1', 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('addComment', () => {
    it('should add comment and publish to comment channel', async () => {
      mockTasksService.addComment.mockResolvedValue(mockComment);

      const result = await resolver.addComment('task-1', 'Looks good', mockUser as any);

      expect(mockTasksService.addComment).toHaveBeenCalledWith('task-1', 'Looks good', 'user-1');
      expect(mockPubSub.publish).toHaveBeenCalledWith(
        'COMMENTS_task-1',
        expect.objectContaining({ commentAdded: mockComment }),
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('deleteComment', () => {
    it('should delegate to service', async () => {
      mockTasksService.deleteComment.mockResolvedValue(true);

      const result = await resolver.deleteComment('cmt-1', mockUser as any);

      expect(mockTasksService.deleteComment).toHaveBeenCalledWith('cmt-1', 'user-1');
      expect(result).toBe(true);
    });
  });
});
