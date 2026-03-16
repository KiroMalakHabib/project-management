import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength, IsUUID, IsOptional } from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsUUID()
  organizationId: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
