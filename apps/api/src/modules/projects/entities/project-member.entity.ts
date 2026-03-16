import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';
import { ProjectRole } from '../../../common/enums/role.enum';

@ObjectType()
@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Field(() => ProjectRole)
  @Column({ type: 'enum', enum: ProjectRole, default: ProjectRole.MEMBER })
  role: ProjectRole;

  @Field()
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Field(() => Project)
  @ManyToOne(() => Project, (p) => p.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field(() => User)
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
