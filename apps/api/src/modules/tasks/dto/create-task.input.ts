import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsUUID, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { TaskPriority } from '../../../common/enums/task.enum';

@InputType()
export class CreateTaskInput {
  @Field(() => ID)
  @IsUUID()
  columnId: string;

  @Field(() => ID)
  @IsUUID()
  projectId: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
