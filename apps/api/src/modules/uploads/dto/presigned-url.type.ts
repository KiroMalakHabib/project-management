import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class PresignedUrlResponse {
  @Field()
  uploadUrl: string;

  @Field()
  fileKey: string;

  @Field()
  publicUrl: string;
}
