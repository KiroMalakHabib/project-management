import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('attachments')
export class Attachment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  @Index()
  taskId: string;

  @Column({ name: 'uploader_id' })
  uploaderId: string;

  @Field()
  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Field()
  @Column({ name: 'file_url', length: 1000 })
  fileUrl: string;

  @Field()
  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Field(() => Int)
  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Task, (t) => t.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Field(() => User)
  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;
}
