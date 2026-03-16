import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { OrganizationMember } from './organization-member.entity';
import { Project } from '../../projects/entities/project.entity';

@ObjectType()
@Entity('organizations')
export class Organization {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 100 })
  name: string;

  @Field({ nullable: true })
  @Column({ length: 500, nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl?: string;

  @Field()
  @Column({ unique: true, length: 50 })
  @Index()
  slug: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrganizationMember, (m) => m.organization, { cascade: true })
  members: OrganizationMember[];

  @OneToMany(() => Project, (p) => p.organization)
  projects: Project[];
}
