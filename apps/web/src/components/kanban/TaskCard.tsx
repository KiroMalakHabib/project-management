'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../ui/Avatar';
import { priorityConfig } from '@/lib/utils/priority';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    priority: string;
    dueDate?: string | null;
    assignee?: { fullName: string; avatarUrl?: string | null } | null;
  };
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{task.title}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`flex items-center gap-1 text-xs ${priority.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
          )}
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar name={task.assignee.fullName} avatarUrl={task.assignee.avatarUrl} size="sm" />
        )}
      </div>
    </div>
  );
}
