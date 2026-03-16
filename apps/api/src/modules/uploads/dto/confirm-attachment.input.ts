import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsString, IsNumber } from 'class-validator';

@InputType()
export class ConfirmAttachmentInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field()
  @IsString()
  fileKey: string;

  @Field()
  @IsString()
  fileName: string;

  @Field()
  @IsString()
  mimeType: string;

  @Field(() => Int)
  @IsNumber()
  fileSize: number;
}
