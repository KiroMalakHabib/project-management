import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { PresignedUrlInput } from './dto/presigned-url.input';
import { PresignedUrlResponse } from './dto/presigned-url.type';
import { ConfirmAttachmentInput } from './dto/confirm-attachment.input';
import { Attachment } from '../tasks/entities/attachment.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver()
@UseGuards(JwtAuthGuard)
export class UploadsResolver {
  constructor(private readonly uploadsService: UploadsService) {}

  @Mutation(() => PresignedUrlResponse)
  async generatePresignedUrl(
    @Args('input') input: PresignedUrlInput,
    @CurrentUser() user: User,
  ): Promise<PresignedUrlResponse> {
    return this.uploadsService.generatePresignedUrl(input, user.id);
  }

  @Mutation(() => Attachment)
  async confirmAttachment(
    @Args('input') input: ConfirmAttachmentInput,
    @CurrentUser() user: User,
  ): Promise<Attachment> {
    return this.uploadsService.confirmAttachment(input, user.id);
  }

  @Mutation(() => Boolean)
  async deleteAttachment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.uploadsService.deleteAttachment(id, user.id);
  }

  @Query(() => [Attachment], { name: 'taskAttachments' })
  async taskAttachments(
    @Args('taskId', { type: () => ID }) taskId: string,
  ): Promise<Attachment[]> {
    return this.uploadsService.getTaskAttachments(taskId);
  }
}
