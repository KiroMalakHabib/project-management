'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { GENERATE_PRESIGNED_URL_MUTATION, CONFIRM_ATTACHMENT_MUTATION } from '@/graphql/mutations/upload.mutations';
import { formatFileSize, getFileIcon, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, uploadFileToS3 } from '@/lib/utils/file';

interface UploadingFile {
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface FileUploadZoneProps {
  taskId: string;
  onUploaded: () => void;
}

export function FileUploadZone({ taskId, onUploaded }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL_MUTATION);
  const [confirmAttachment] = useMutation(CONFIRM_ATTACHMENT_MUTATION);

  const updateUpload = (index: number, update: Partial<UploadingFile>) => {
    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...update } : u)),
    );
  };

  const processFile = useCallback(
    async (file: File) => {
      const index = uploads.length;

      // Validate
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        setUploads((prev) => [
          ...prev,
          { name: file.name, size: file.size, mimeType: file.type, progress: 0, status: 'error', error: 'File type not allowed' },
        ]);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploads((prev) => [
          ...prev,
          { name: file.name, size: file.size, mimeType: file.type, progress: 0, status: 'error', error: 'File exceeds 10 MB limit' },
        ]);
        return;
      }

      setUploads((prev) => [
        ...prev,
        { name: file.name, size: file.size, mimeType: file.type, progress: 0, status: 'uploading' },
      ]);

      try {
        // Step 1: Get presigned URL
        const { data } = await generatePresignedUrl({
          variables: {
            input: { taskId, fileName: file.name, mimeType: file.type, fileSize: file.size },
          },
        });

        const { uploadUrl, fileKey } = data.generatePresignedUrl;

        // Step 2: Upload directly to S3
        await uploadFileToS3(file, uploadUrl, (percent) =>
          updateUpload(index, { progress: percent }),
        );

        // Step 3: Confirm with backend
        await confirmAttachment({
          variables: {
            input: {
              taskId,
              fileKey,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
            },
          },
        });

        updateUpload(index, { status: 'done', progress: 100 });
        onUploaded();
      } catch (err: any) {
        updateUpload(index, { status: 'error', error: err.message });
      }
    },
    [taskId, uploads.length, generatePresignedUrl, confirmAttachment, onUploaded],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(processFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={[...ALLOWED_MIME_TYPES].join(',')}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-gray-500">
          <span className="text-blue-600 font-medium">Click to upload</span>
          {' '}or drag and drop
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Images, PDF, Office docs, CSV, ZIP — max 10 MB each
        </p>
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border">
              <span className="text-lg">{getFileIcon(upload.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700 truncate">{upload.name}</p>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatFileSize(upload.size)}</span>
                </div>
                {upload.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-150"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{upload.progress}%</p>
                  </div>
                )}
                {upload.status === 'done' && (
                  <p className="text-[10px] text-green-600 mt-0.5">✓ Uploaded</p>
                )}
                {upload.status === 'error' && (
                  <p className="text-[10px] text-red-500 mt-0.5">{upload.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
