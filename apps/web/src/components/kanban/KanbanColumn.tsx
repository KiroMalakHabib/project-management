'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

interface Task {
  id: string;
  title: string;
  priority: string;
  position: number;
  columnId: string;
  dueDate?: string | null;
  assignee?: { fullName: string; avatarUrl?: string | null } | null;
}

interface Column {
  id: string;
  name: string;
  color: string;
  wipLimit?: number | null;
  tasks: Task[];
}

interface KanbanColumnProps {
  column: Column;
  onAddTask: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
}

export function KanbanColumn({ column, onAddTask, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const sorted = [...column.tasks].sort((a, b) => a.position - b.position);
  const atWipLimit = column.wipLimit != null && sorted.length >= column.wipLimit;

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-sm font-semibold text-gray-700">{column.name}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {sorted.length}{column.wipLimit ? `/${column.wipLimit}` : ''}
          </span>
        </div>
        <button
          onClick={() => !atWipLimit && onAddTask(column.id)}
          disabled={atWipLimit}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={atWipLimit ? 'WIP limit reached' : 'Add task'}
        >
          +
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-16 rounded-xl p-2 transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-gray-50'
        }`}
      >
        <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sorted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task.id)}
              />
            ))}
          </div>
        </SortableContext>

        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-gray-300">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
