'use client';

import { useMutation } from '@apollo/client';
import { DELETE_ATTACHMENT_MUTATION } from '@/graphql/mutations/upload.mutations';
import { formatFileSize, getFileIcon } from '@/lib/utils/file';
import { useAuthStore } from '@/stores/auth.store';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploader: { id: string; fullName: string };
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDeleted: () => void;
}

export function AttachmentList({ attachments, onDeleted }: AttachmentListProps) {
  const { user } = useAuthStore();
  const [deleteAttachment] = useMutation(DELETE_ATTACHMENT_MUTATION);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attachment?')) return;
    await deleteAttachment({ variables: { id } });
    onDeleted();
  };

  if (attachments.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">No attachments yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-gray-50 group transition-colors"
        >
          <span className="text-lg flex-shrink-0">{getFileIcon(att.mimeType)}</span>
          <div className="flex-1 min-w-0">
            <a
              href={att.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline truncate block"
            >
              {att.fileName}
            </a>
            <p className="text-xs text-gray-400">
              {formatFileSize(att.fileSize)} · {att.uploader.fullName} ·{' '}
              {new Date(att.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={att.fileUrl}
              download={att.fileName}
              className="text-xs text-gray-400 hover:text-blue-600 p-1 rounded"
              title="Download"
            >
              ↓
            </a>
            {att.uploader.id === user?.id && (
              <button
                onClick={() => handleDelete(att.id)}
                className="text-xs text-gray-400 hover:text-red-500 p-1 rounded"
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
