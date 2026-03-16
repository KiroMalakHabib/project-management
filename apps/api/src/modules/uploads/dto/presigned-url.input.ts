import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsString, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class PresignedUrlInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field()
  @IsString()
  fileName: string;

  @Field()
  @IsString()
  mimeType: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10 MB max
  fileSize: number;
}
