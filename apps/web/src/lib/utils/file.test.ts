import { describe, it, expect } from 'vitest';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
  getFileIcon,
} from './file';

describe('ALLOWED_MIME_TYPES', () => {
  it('should allow common image types', () => {
    expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/gif')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/webp')).toBe(true);
  });

  it('should allow document types', () => {
    expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('text/plain')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('text/csv')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('application/zip')).toBe(true);
  });

  it('should NOT allow executable types', () => {
    expect(ALLOWED_MIME_TYPES.has('application/x-executable')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('application/x-sh')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('text/javascript')).toBe(false);
  });
});

describe('MAX_FILE_SIZE', () => {
  it('should be 10 MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('should format exactly 1 KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('should handle 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});

describe('getFileIcon', () => {
  it('should return image icon for image types', () => {
    expect(getFileIcon('image/jpeg')).toBe('🖼️');
    expect(getFileIcon('image/png')).toBe('🖼️');
  });

  it('should return PDF icon for PDFs', () => {
    expect(getFileIcon('application/pdf')).toBe('📄');
  });

  it('should return word icon for Word docs', () => {
    expect(getFileIcon('application/msword')).toBe('📝');
    expect(getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('📝');
  });

  it('should return spreadsheet icon for Excel', () => {
    expect(getFileIcon('application/vnd.ms-excel')).toBe('📊');
    expect(getFileIcon('text/csv')).toBe('📊');
  });

  it('should return zip icon for archives', () => {
    expect(getFileIcon('application/zip')).toBe('🗜️');
  });

  it('should return generic icon for unknown types', () => {
    expect(getFileIcon('application/octet-stream')).toBe('📎');
  });
});
