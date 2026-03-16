'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Modal } from '../ui/Modal';
import { CREATE_TASK_MUTATION } from '@/graphql/mutations/task.mutations';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  projectId: string;
  onCreated: () => void;
}

export function CreateTaskModal({ isOpen, onClose, columnId, projectId, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [error, setError] = useState('');

  const [createTask, { loading }] = useMutation(CREATE_TASK_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createTask({
        variables: { input: { columnId, projectId, title: title.trim(), priority } },
      });
      setTitle('');
      setPriority('MEDIUM');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="What needs to be done?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading || !title.trim()} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
