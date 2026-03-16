import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Project } from '../../projects/entities/project.entity';
import { Task } from './task.entity';

@ObjectType()
@Entity('task_columns')
export class TaskColumn {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Field()
  @Column({ length: 100 })
  name: string;

  @Field(() => Int)
  @Column({ name: 'position', default: 0 })
  position: number;

  @Field()
  @Column({ name: 'color', length: 20, default: '#6B7280' })
  color: string;

  @Field(() => Int)
  @Column({ name: 'wip_limit', nullable: true })
  wipLimit?: number;

  @Field(() => Project)
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field(() => [Task])
  @OneToMany(() => Task, (t) => t.column, { cascade: ['remove'] })
  tasks: Task[];
}
