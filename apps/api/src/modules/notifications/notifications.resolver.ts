import { Resolver, Query, Mutation, Subscription, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PUB_SUB } from '../pubsub/pubsub.module';

@Resolver(() => Notification)
@UseGuards(JwtAuthGuard)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => [Notification], { name: 'myNotifications' })
  async myNotifications(@CurrentUser() user: User): Promise<Notification[]> {
    return this.notificationsService.findForUser(user.id);
  }

  @Query(() => Int, { name: 'unreadNotificationCount' })
  async unreadNotificationCount(@CurrentUser() user: User): Promise<number> {
    return this.notificationsService.countUnread(user.id);
  }

  @Mutation(() => Notification)
  async markNotificationRead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Notification> {
    return this.notificationsService.markRead(id, user.id);
  }

  @Mutation(() => Boolean)
  async markAllNotificationsRead(@CurrentUser() user: User): Promise<boolean> {
    return this.notificationsService.markAllRead(user.id);
  }

  @Mutation(() => Boolean)
  async deleteNotification(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.notificationsService.delete(id, user.id);
  }

  @Subscription(() => Notification, {
    resolve: (payload) => payload.notificationReceived,
  })
  notificationReceived(@CurrentUser() user: User) {
    return this.pubSub.asyncIterator(`NOTIFICATIONS_${user.id}`);
  }
}
