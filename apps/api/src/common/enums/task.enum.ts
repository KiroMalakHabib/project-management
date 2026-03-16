import { registerEnumType } from '@nestjs/graphql';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SubscriptionEvent {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_MOVED = 'TASK_MOVED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

registerEnumType(TaskPriority, { name: 'TaskPriority' });
