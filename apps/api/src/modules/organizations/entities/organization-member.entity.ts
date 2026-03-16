import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Organization } from './organization.entity';
import { User } from '../../users/entities/user.entity';
import { OrgRole } from '../../../common/enums/role.enum';

@ObjectType()
@Entity('organization_members')
@Unique(['organizationId', 'userId'])
export class OrganizationMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  @Index()
  organizationId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Field(() => OrgRole)
  @Column({ type: 'enum', enum: OrgRole, default: OrgRole.MEMBER })
  role: OrgRole;

  @Field()
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Field(() => Organization)
  @ManyToOne(() => Organization, (o) => o.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => User)
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
