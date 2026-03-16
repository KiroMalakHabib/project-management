'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Avatar } from '../ui/Avatar';
import { FileUploadZone } from '../uploads/FileUploadZone';
import { AttachmentList } from '../uploads/AttachmentList';
import { TASK_QUERY } from '@/graphql/queries/task.queries';
import { TASK_ATTACHMENTS_QUERY } from '@/graphql/queries/upload.queries';
import { ADD_COMMENT_MUTATION, DELETE_COMMENT_MUTATION, UPDATE_TASK_MUTATION } from '@/graphql/mutations/task.mutations';
import { COMMENT_ADDED_SUBSCRIPTION } from '@/graphql/subscriptions/task.subscriptions';
import { priorityConfig } from '@/lib/utils/priority';
import { useAuthStore } from '@/stores/auth.store';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { user } = useAuthStore();
  const [commentBody, setCommentBody] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const { data, loading, refetch } = useQuery(TASK_QUERY, {
    variables: { id: taskId },
    skip: !taskId,
  });

  const { data: attachmentsData, refetch: refetchAttachments } = useQuery(
    TASK_ATTACHMENTS_QUERY,
    { variables: { taskId }, skip: !taskId },
  );

  const [addComment, { loading: addingComment }] = useMutation(ADD_COMMENT_MUTATION);
  const [deleteComment] = useMutation(DELETE_COMMENT_MUTATION);
  const [updateTask] = useMutation(UPDATE_TASK_MUTATION);

  useSubscription(COMMENT_ADDED_SUBSCRIPTION, {
    variables: { taskId },
    skip: !taskId,
    onData: () => refetch(),
  });

  useEffect(() => {
    if (data?.task) setEditDesc(data.task.description || '');
  }, [data?.task]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!taskId) return null;

  const task = data?.task;
  const attachments = attachmentsData?.taskAttachments ?? [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    await addComment({ variables: { taskId, body: commentBody.trim() } });
    setCommentBody('');
    refetch();
  };

  const handleDeleteComment = async (id: string) => {
    await deleteComment({ variables: { id } });
    refetch();
  };

  const handleSaveDescription = async () => {
    await updateTask({ variables: { input: { id: taskId, description: editDesc } } });
    setIsEditingDesc(false);
    refetch();
  };

  const priority = task ? priorityConfig[task.priority as keyof typeof priorityConfig] : null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-6">
        {loading || !task ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  {priority && (
                    <span className={`flex items-center gap-1 text-xs ${priority.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                      {priority.label}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-gray-500">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-1">✕</button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-6">
              {/* Main content */}
              <div className="col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
                  {isEditingDesc ? (
                    <div>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Add a description..."
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleSaveDescription} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Save</button>
                        <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1.5 border text-xs rounded-lg text-gray-600">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDesc(true)}
                      className="text-sm text-gray-600 min-h-12 cursor-text p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {task.description || <span className="text-gray-300 italic">Click to add description...</span>}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Attachments ({attachments.length})
                  </h3>
                  <div className="space-y-3">
                    <AttachmentList
                      attachments={attachments}
                      onDeleted={refetchAttachments}
                    />
                    <FileUploadZone
                      taskId={taskId}
                      onUploaded={refetchAttachments}
                    />
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Comments ({task.comments?.length || 0})
                  </h3>
                  <div className="space-y-4 mb-4">
                    {task.comments?.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar name={comment.author.fullName} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-gray-700">{comment.author.fullName}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {comment.isEdited && <span className="text-xs text-gray-300">(edited)</span>}
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.body}</p>
                          {comment.author.id === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs text-gray-400 hover:text-red-500 mt-1"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    {user && <Avatar name={user.fullName} size="sm" />}
                    <div className="flex-1 flex gap-2">
                      <input
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Write a comment... (@email to mention)"
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!commentBody.trim() || addingComment}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assignee</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignee.fullName} avatarUrl={task.assignee.avatarUrl} size="sm" />
                      <span className="text-sm text-gray-700">{task.assignee.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reporter</p>
                  {task.reporter ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={task.reporter.fullName} avatarUrl={task.reporter.avatarUrl} size="sm" />
                      <span className="text-sm text-gray-700">{task.reporter.fullName}</span>
                    </div>
                  ) : <span className="text-sm text-gray-400">–</span>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-gray-600">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
