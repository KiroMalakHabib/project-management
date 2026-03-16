import { Test, TestingModule } from '@nestjs/testing';
import { UploadsResolver } from './uploads.resolver';
import { UploadsService } from './uploads.service';

const mockUser = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };

const mockPresignedResponse = {
  uploadUrl: 'https://s3.example.com/upload?sig=abc',
  fileKey: 'tasks/task-1/uuid/file.png',
  publicUrl: 'https://s3.example.com/tasks/task-1/uuid/file.png',
};

const mockAttachment = {
  id: 'att-1',
  taskId: 'task-1',
  uploaderId: 'user-1',
  fileName: 'file.png',
  fileUrl: 'https://s3.example.com/tasks/task-1/uuid/file.png',
  mimeType: 'image/png',
  fileSize: 204800,
};

const mockUploadsService = {
  generatePresignedUrl: jest.fn(),
  confirmAttachment: jest.fn(),
  deleteAttachment: jest.fn(),
  getTaskAttachments: jest.fn(),
};

describe('UploadsResolver', () => {
  let resolver: UploadsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsResolver,
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    resolver = module.get<UploadsResolver>(UploadsResolver);
    jest.clearAllMocks();
  });

  describe('generatePresignedUrl', () => {
    it('should delegate to service and return presigned URL response', async () => {
      mockUploadsService.generatePresignedUrl.mockResolvedValue(mockPresignedResponse);
      const input = { taskId: 'task-1', fileName: 'file.png', mimeType: 'image/png', fileSize: 204800 };

      const result = await resolver.generatePresignedUrl(input as any, mockUser as any);

      expect(mockUploadsService.generatePresignedUrl).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockPresignedResponse);
    });
  });

  describe('confirmAttachment', () => {
    it('should delegate to service and return attachment', async () => {
      mockUploadsService.confirmAttachment.mockResolvedValue(mockAttachment);
      const input = {
        taskId: 'task-1',
        fileKey: 'tasks/task-1/uuid/file.png',
        fileName: 'file.png',
        mimeType: 'image/png',
        fileSize: 204800,
      };

      const result = await resolver.confirmAttachment(input as any, mockUser as any);

      expect(mockUploadsService.confirmAttachment).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockAttachment);
    });
  });

  describe('deleteAttachment', () => {
    it('should delegate to service and return true', async () => {
      mockUploadsService.deleteAttachment.mockResolvedValue(true);

      const result = await resolver.deleteAttachment('att-1', mockUser as any);

      expect(mockUploadsService.deleteAttachment).toHaveBeenCalledWith('att-1', 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('taskAttachments', () => {
    it('should return attachments for a task', async () => {
      mockUploadsService.getTaskAttachments.mockResolvedValue([mockAttachment]);

      const result = await resolver.taskAttachments('task-1');

      expect(mockUploadsService.getTaskAttachments).toHaveBeenCalledWith('task-1');
      expect(result).toEqual([mockAttachment]);
    });
  });
});
