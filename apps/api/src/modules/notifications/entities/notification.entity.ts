import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMMENTED = 'TASK_COMMENTED',
  TASK_MENTIONED = 'TASK_MENTIONED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  MEMBER_INVITED = 'MEMBER_INVITED',
  MEMBER_JOINED = 'MEMBER_JOINED',
}

registerEnumType(NotificationType, { name: 'NotificationType' });

@ObjectType()
@Entity('notifications')
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id' })
  @Index()
  recipientId: string;

  @Field(() => NotificationType)
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Field()
  @Column({ length: 255 })
  title: string;

  @Field()
  @Column({ type: 'text' })
  body: string;

  @Field({ nullable: true })
  @Column({ name: 'resource_id', nullable: true, length: 100 })
  resourceId?: string;

  @Field({ nullable: true })
  @Column({ name: 'resource_type', nullable: true, length: 50 })
  resourceType?: string;

  @Field()
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;
}
