import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { NotificationType } from './entities/notification.entity';

const mockUser = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };

const mockNotification = {
  id: 'notif-1',
  recipientId: 'user-1',
  type: NotificationType.TASK_ASSIGNED,
  title: 'Task assigned',
  body: 'You have been assigned a task',
  isRead: false,
  createdAt: new Date(),
};

const mockNotificationsService = {
  findForUser: jest.fn(),
  countUnread: jest.fn(),
  markRead: jest.fn(),
  markAllRead: jest.fn(),
  delete: jest.fn(),
};

const mockPubSub = {
  asyncIterator: jest.fn().mockReturnValue({}),
};

describe('NotificationsResolver', () => {
  let resolver: NotificationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsResolver,
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PUB_SUB, useValue: mockPubSub },
      ],
    }).compile();

    resolver = module.get<NotificationsResolver>(NotificationsResolver);
    jest.clearAllMocks();
  });

  describe('myNotifications', () => {
    it('should return notifications for current user', async () => {
      mockNotificationsService.findForUser.mockResolvedValue([mockNotification]);

      const result = await resolver.myNotifications(mockUser as any);

      expect(mockNotificationsService.findForUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockNotification]);
    });
  });

  describe('unreadNotificationCount', () => {
    it('should return unread count', async () => {
      mockNotificationsService.countUnread.mockResolvedValue(3);

      const result = await resolver.unreadNotificationCount(mockUser as any);

      expect(mockNotificationsService.countUnread).toHaveBeenCalledWith('user-1');
      expect(result).toBe(3);
    });
  });

  describe('markNotificationRead', () => {
    it('should mark notification as read', async () => {
      const readNotif = { ...mockNotification, isRead: true };
      mockNotificationsService.markRead.mockResolvedValue(readNotif);

      const result = await resolver.markNotificationRead('notif-1', mockUser as any);

      expect(mockNotificationsService.markRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationsService.markAllRead.mockResolvedValue(true);

      const result = await resolver.markAllNotificationsRead(mockUser as any);

      expect(mockNotificationsService.markAllRead).toHaveBeenCalledWith('user-1');
      expect(result).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockNotificationsService.delete.mockResolvedValue(true);

      const result = await resolver.deleteNotification('notif-1', mockUser as any);

      expect(mockNotificationsService.delete).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('notificationReceived (subscription)', () => {
    it('should subscribe to user notification channel', () => {
      mockPubSub.asyncIterator.mockReturnValue({});

      resolver.notificationReceived(mockUser as any);

      expect(mockPubSub.asyncIterator).toHaveBeenCalledWith('NOTIFICATIONS_user-1');
    });
  });
});
