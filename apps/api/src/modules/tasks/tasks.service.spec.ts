import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskColumn } from './entities/task-column.entity';
import { Comment } from './entities/comment.entity';
import { Attachment } from './entities/attachment.entity';
import { ProjectsService } from '../projects/projects.service';
import { TaskPriority } from '../../common/enums/task.enum';

const mockTaskRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};
const mockColumnRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};
const mockCommentRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};
const mockAttachmentRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockProjectsService = {
  getProjectMembership: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: getRepositoryToken(TaskColumn), useValue: mockColumnRepo },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(Attachment), useValue: mockAttachmentRepo },
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task for a project member', async () => {
      mockProjectsService.getProjectMembership.mockResolvedValue({ role: 'MEMBER' });
      mockTaskRepo.findOne.mockResolvedValue(null);
      const mockTask = { id: 't-1', title: 'Fix bug', priority: TaskPriority.HIGH };
      mockTaskRepo.create.mockReturnValue(mockTask);
      mockTaskRepo.save.mockResolvedValue(mockTask);

      const result = await service.createTask(
        { columnId: 'col-1', projectId: 'proj-1', title: 'Fix bug', priority: TaskPriority.HIGH },
        'user-1',
      );
      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException if not a project member', async () => {
      mockProjectsService.getProjectMembership.mockResolvedValue(null);
      await expect(
        service.createTask({ columnId: 'col-1', projectId: 'proj-1', title: 'Task' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('moveTask', () => {
    it('should move a task to a new column', async () => {
      const mockTask = { id: 't-1', projectId: 'proj-1', columnId: 'col-1', position: 0 };
      mockTaskRepo.findOne.mockResolvedValue(mockTask);
      mockProjectsService.getProjectMembership.mockResolvedValue({ role: 'MEMBER' });
      mockTaskRepo.save.mockResolvedValue({ ...mockTask, columnId: 'col-2', position: 1 });

      const result = await service.moveTask(
        { taskId: 't-1', targetColumnId: 'col-2', position: 1 },
        'user-1',
      );
      expect(result.columnId).toBe('col-2');
    });
  });

  describe('addComment', () => {
    it('should add a comment to a task', async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: 't-1', projectId: 'proj-1' });
      mockProjectsService.getProjectMembership.mockResolvedValue({ role: 'MEMBER' });
      const mockComment = { id: 'c-1', body: 'Great work!', taskId: 't-1' };
      mockCommentRepo.create.mockReturnValue(mockComment);
      mockCommentRepo.save.mockResolvedValue(mockComment);

      const result = await service.addComment('t-1', 'Great work!', 'user-1');
      expect(result.body).toBe('Great work!');
    });
  });

  describe('deleteComment', () => {
    it('should throw ForbiddenException if not comment author', async () => {
      mockCommentRepo.findOne.mockResolvedValue({ id: 'c-1', authorId: 'other-user' });
      await expect(service.deleteComment('c-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
