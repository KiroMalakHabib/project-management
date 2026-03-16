import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, MaxLength, IsOptional } from 'class-validator';

@InputType()
export class CreateColumnInput {
  @Field(() => ID)
  @IsUUID()
  projectId: string;

  @Field()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;
}
