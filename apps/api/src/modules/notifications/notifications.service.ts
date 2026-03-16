import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Notification, NotificationType } from './entities/notification.entity';
import { PUB_SUB } from '../pubsub/pubsub.module';

export interface CreateNotificationDto {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceId?: string;
  resourceType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create(dto);
    const saved = await this.notificationRepo.save(notification);

    // Push real-time to recipient
    await this.pubSub.publish(`NOTIFICATIONS_${dto.recipientId}`, {
      notificationReceived: saved,
    });

    return saved;
  }

  async createBulk(dtos: CreateNotificationDto[]): Promise<void> {
    if (!dtos.length) return;
    const entities = this.notificationRepo.create(dtos);
    const saved = await this.notificationRepo.save(entities);
    // Push to each recipient
    for (const notification of saved) {
      await this.pubSub.publish(`NOTIFICATIONS_${notification.recipientId}`, {
        notificationReceived: notification,
      });
    }
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, recipientId: userId },
    });
    if (!notification) throw new Error('Notification not found');
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string): Promise<boolean> {
    await this.notificationRepo.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return true;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    await this.notificationRepo.delete({ id, recipientId: userId });
    return true;
  }

  // ── Domain helpers called by other services ───────────────────────────────

  async notifyTaskAssigned(params: {
    taskId: string;
    taskTitle: string;
    assigneeId: string;
    assignerName: string;
    projectId: string;
  }): Promise<void> {
    await this.create({
      recipientId: params.assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task assigned to you',
      body: `${params.assignerName} assigned you to "${params.taskTitle}"`,
      resourceId: params.taskId,
      resourceType: 'task',
    });
  }

  async notifyComment(params: {
    taskId: string;
    taskTitle: string;
    commentAuthorName: string;
    recipientId: string;
  }): Promise<void> {
    await this.create({
      recipientId: params.recipientId,
      type: NotificationType.TASK_COMMENTED,
      title: 'New comment on your task',
      body: `${params.commentAuthorName} commented on "${params.taskTitle}"`,
      resourceId: params.taskId,
      resourceType: 'task',
    });
  }

  async notifyMentions(params: {
    body: string;
    taskId: string;
    taskTitle: string;
    authorName: string;
    authorId: string;
    lookupUserByEmail: (email: string) => Promise<{ id: string } | null>;
  }): Promise<void> {
    // Parse @email mentions from comment body
    const mentionRegex = /@([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(params.body)) !== null) {
      mentions.push(match[1]);
    }
    if (!mentions.length) return;

    const dtos: CreateNotificationDto[] = [];
    for (const email of [...new Set(mentions)]) {
      const user = await params.lookupUserByEmail(email);
      if (!user || user.id === params.authorId) continue;
      dtos.push({
        recipientId: user.id,
        type: NotificationType.TASK_MENTIONED,
        title: 'You were mentioned in a comment',
        body: `${params.authorName} mentioned you in "${params.taskTitle}"`,
        resourceId: params.taskId,
        resourceType: 'task',
      });
    }
    await this.createBulk(dtos);
  }

  async notifyMemberInvited(params: {
    recipientId: string;
    orgName: string;
    inviterName: string;
    orgId: string;
  }): Promise<void> {
    await this.create({
      recipientId: params.recipientId,
      type: NotificationType.MEMBER_INVITED,
      title: `You've been invited to ${params.orgName}`,
      body: `${params.inviterName} invited you to join "${params.orgName}"`,
      resourceId: params.orgId,
      resourceType: 'organization',
    });
  }
}
