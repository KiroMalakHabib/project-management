import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { TaskColumn } from './task-column.entity';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { TaskPriority } from '../../../common/enums/task.enum';

@ObjectType()
@Entity('tasks')
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'column_id' })
  @Index()
  columnId: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Field()
  @Column({ length: 255 })
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => TaskPriority)
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  position: number;

  @Field({ nullable: true })
  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  @Column({ name: 'reporter_id', nullable: true })
  reporterId?: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => TaskColumn)
  @ManyToOne(() => TaskColumn, (c) => c.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column: TaskColumn;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reporter_id' })
  reporter?: User;

  @Field(() => [Comment])
  @OneToMany(() => Comment, (c) => c.task)
  comments: Comment[];

  @Field(() => [Attachment])
  @OneToMany(() => Attachment, (a) => a.task)
  attachments: Attachment[];
}
