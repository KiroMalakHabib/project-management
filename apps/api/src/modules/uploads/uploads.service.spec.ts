import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from './uploads.service';
import { Attachment } from '../tasks/entities/attachment.entity';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

const mockAttachmentRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const cfg: Record<string, string> = {
      S3_ENDPOINT: 'http://localhost:9000',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY: 'minioadmin',
      S3_SECRET_KEY: 'minioadmin123',
      S3_BUCKET: 'project-management',
      S3_PUBLIC_URL: 'http://localhost:9000/project-management',
    };
    return cfg[key];
  }),
};

const mockProjectsService = {
  getProjectMembership: jest.fn(),
};

const mockTasksService = {
  findTaskById: jest.fn(),
};

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(Attachment), useValue: mockAttachmentRepo },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    jest.clearAllMocks();
  });

  describe('generatePresignedUrl', () => {
    it('should throw BadRequestException for disallowed MIME types', async () => {
      await expect(
        service.generatePresignedUrl(
          {
            taskId: 't-1',
            fileName: 'malware.exe',
            mimeType: 'application/x-msdownload',
            fileSize: 1024,
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not a project member', async () => {
      mockTasksService.findTaskById.mockResolvedValue({ id: 't-1', projectId: 'p-1' });
      mockProjectsService.getProjectMembership.mockResolvedValue(null);

      await expect(
        service.generatePresignedUrl(
          { taskId: 't-1', fileName: 'doc.pdf', mimeType: 'application/pdf', fileSize: 1024 },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return presigned URL for valid request', async () => {
      mockTasksService.findTaskById.mockResolvedValue({ id: 't-1', projectId: 'p-1' });
      mockProjectsService.getProjectMembership.mockResolvedValue({ role: 'MEMBER' });

      const result = await service.generatePresignedUrl(
        { taskId: 't-1', fileName: 'report.pdf', mimeType: 'application/pdf', fileSize: 2048 },
        'user-1',
      );

      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
      expect(result.fileKey).toContain('tasks/t-1/');
      expect(result.publicUrl).toContain('report.pdf');
    });
  });

  describe('confirmAttachment', () => {
    it('should create and save attachment record', async () => {
      mockTasksService.findTaskById.mockResolvedValue({ id: 't-1', projectId: 'p-1' });
      mockProjectsService.getProjectMembership.mockResolvedValue({ role: 'MEMBER' });
      const mockAttachment = { id: 'a-1', taskId: 't-1', fileName: 'report.pdf' };
      mockAttachmentRepo.create.mockReturnValue(mockAttachment);
      mockAttachmentRepo.save.mockResolvedValue(mockAttachment);

      const result = await service.confirmAttachment(
        {
          taskId: 't-1',
          fileKey: 'tasks/t-1/uuid/report.pdf',
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          fileSize: 2048,
        },
        'user-1',
      );

      expect(result).toEqual(mockAttachment);
      expect(mockAttachmentRepo.save).toHaveBeenCalled();
    });
  });
});
