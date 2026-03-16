import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateTaskInput } from './create-task.input';

@InputType()
export class UpdateTaskInput extends PartialType(CreateTaskInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
