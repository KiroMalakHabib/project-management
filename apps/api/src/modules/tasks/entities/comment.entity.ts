import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('comments')
export class Comment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  @Index()
  taskId: string;

  @Column({ name: 'author_id' })
  @Index()
  authorId: string;

  @Field()
  @Column({ type: 'text' })
  body: string;

  @Field()
  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Task, (t) => t.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Field(() => User)
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
