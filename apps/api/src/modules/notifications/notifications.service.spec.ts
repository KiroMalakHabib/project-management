import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { PUB_SUB } from '../pubsub/pubsub.module';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPubSub = {
  publish: jest.fn().mockResolvedValue(undefined),
  asyncIterator: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
        { provide: PUB_SUB, useValue: mockPubSub },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should save a notification and publish to pubsub', async () => {
      const dto = {
        recipientId: 'user-1',
        type: NotificationType.TASK_ASSIGNED,
        title: 'Test',
        body: 'Test body',
      };
      const mockNotif = { id: 'n-1', ...dto };
      mockRepo.create.mockReturnValue(mockNotif);
      mockRepo.save.mockResolvedValue(mockNotif);

      const result = await service.create(dto);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockPubSub.publish).toHaveBeenCalledWith(
        `NOTIFICATIONS_user-1`,
        { notificationReceived: mockNotif },
      );
      expect(result).toEqual(mockNotif);
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotif = { id: 'n-1', recipientId: 'user-1', isRead: false };
      mockRepo.findOne.mockResolvedValue(mockNotif);
      mockRepo.save.mockResolvedValue({ ...mockNotif, isRead: true });

      const result = await service.markRead('n-1', 'user-1');
      expect(result.isRead).toBe(true);
    });

    it('should throw if notification not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.markRead('bad-id', 'user-1')).rejects.toThrow();
    });
  });

  describe('countUnread', () => {
    it('should return unread count', async () => {
      mockRepo.count.mockResolvedValue(5);
      const result = await service.countUnread('user-1');
      expect(result).toBe(5);
    });
  });

  describe('notifyMentions', () => {
    it('should skip mentions of the author themselves', async () => {
      const createSpy = jest.spyOn(service, 'createBulk').mockResolvedValue(undefined);

      await service.notifyMentions({
        body: 'Hey @author@example.com check this out',
        taskId: 't-1',
        taskTitle: 'Task',
        authorName: 'Author',
        authorId: 'author-id',
        lookupUserByEmail: async () => ({ id: 'author-id' }), // same as authorId
      });

      // createBulk should be called with empty array (author skipped)
      expect(createSpy).toHaveBeenCalledWith([]);
    });
  });
});
