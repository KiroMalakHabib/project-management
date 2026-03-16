import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Attachment } from '../tasks/entities/attachment.entity';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { PresignedUrlInput } from './dto/presigned-url.input';
import { PresignedUrlResponse } from './dto/presigned-url.type';
import { ConfirmAttachmentInput } from './dto/confirm-attachment.input';
import { createS3Client } from './s3.config';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
]);

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {
    this.s3 = createS3Client(config);
    this.bucket = config.get<string>('S3_BUCKET') || 'project-management';
    this.publicUrl = config.get<string>('S3_PUBLIC_URL') || '';
  }

  async generatePresignedUrl(
    input: PresignedUrlInput,
    userId: string,
  ): Promise<PresignedUrlResponse> {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException(`File type ${input.mimeType} is not allowed`);
    }

    // Verify user has access to this task's project
    const task = await this.tasksService.findTaskById(input.taskId);
    const membership = await this.projectsService.getProjectMembership(task.projectId, userId);
    if (!membership) throw new ForbiddenException('Not a project member');

    // Build a namespaced key: tasks/{taskId}/{uuid}/{filename}
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `tasks/${input.taskId}/${uuidv4()}/${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: input.mimeType,
      ContentLength: input.fileSize,
      Metadata: {
        'uploaded-by': userId,
        'task-id': input.taskId,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5 min
    const publicUrl = `${this.publicUrl}/${fileKey}`;

    return { uploadUrl, fileKey, publicUrl };
  }

  async confirmAttachment(
    input: ConfirmAttachmentInput,
    uploaderId: string,
  ): Promise<Attachment> {
    const task = await this.tasksService.findTaskById(input.taskId);
    const membership = await this.projectsService.getProjectMembership(task.projectId, uploaderId);
    if (!membership) throw new ForbiddenException('Not a project member');

    const publicUrl = `${this.publicUrl}/${input.fileKey}`;

    const attachment = this.attachmentRepo.create({
      taskId: input.taskId,
      uploaderId,
      fileName: input.fileName,
      fileUrl: publicUrl,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    });

    return this.attachmentRepo.save(attachment);
  }

  async deleteAttachment(id: string, userId: string): Promise<boolean> {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) throw new BadRequestException('Attachment not found');

    if (attachment.uploaderId !== userId) {
      throw new ForbiddenException('Only the uploader can delete this attachment');
    }

    // Extract key from URL
    const fileKey = attachment.fileUrl.replace(`${this.publicUrl}/`, '');

    // Delete from S3
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }),
      );
    } catch {
      // Don't fail if S3 delete fails — still remove DB record
    }

    await this.attachmentRepo.remove(attachment);
    return true;
  }

  async getTaskAttachments(taskId: string): Promise<Attachment[]> {
    return this.attachmentRepo.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });
  }
}
