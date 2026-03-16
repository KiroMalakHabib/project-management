import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsUUID, IsNumber } from 'class-validator';

@InputType()
export class MoveTaskInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field(() => ID)
  @IsUUID()
  targetColumnId: string;

  @Field(() => Float)
  @IsNumber()
  position: number;
}
