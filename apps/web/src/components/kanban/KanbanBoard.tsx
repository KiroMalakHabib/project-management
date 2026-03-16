'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useMutation } from '@apollo/client';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { MOVE_TASK_MUTATION } from '@/graphql/mutations/task.mutations';

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

interface KanbanBoardProps {
  columns: Column[];
  projectId: string;
  onRefresh: () => void;
}

export function KanbanBoard({ columns: initialColumns, projectId, onRefresh }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [moveTask] = useMutation(MOVE_TASK_MUTATION);

  // Sync when parent re-fetches
  if (JSON.stringify(initialColumns) !== JSON.stringify(columns) && !activeTask) {
    setColumns(initialColumns);
  }

  const findColumn = (taskId: string) =>
    columns.find((col) => col.tasks.some((t) => t.id === taskId));

  const handleDragStart = ({ active }: DragStartEvent) => {
    const col = findColumn(active.id as string);
    const task = col?.tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeColId = findColumn(active.id as string)?.id;
    const overColId = columns.find((c) => c.id === over.id)?.id
      ?? findColumn(over.id as string)?.id;

    if (!activeColId || !overColId || activeColId === overColId) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === activeColId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
        }
        if (col.id === overColId) {
          const task = prev
            .find((c) => c.id === activeColId)
            ?.tasks.find((t) => t.id === active.id);
          if (!task) return col;
          return { ...col, tasks: [...col.tasks, { ...task, columnId: overColId }] };
        }
        return col;
      }),
    );
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const col = findColumn(active.id as string) ?? columns.find((c) => c.id === over.id);
    if (!col) return;

    const overColId = columns.find((c) => c.id === over.id)?.id
      ?? findColumn(over.id as string)?.id
      ?? col.id;

    const targetCol = columns.find((c) => c.id === overColId);
    if (!targetCol) return;

    const overIndex = targetCol.tasks.findIndex((t) => t.id === over.id);
    const activeIndex = targetCol.tasks.findIndex((t) => t.id === active.id);

    const newTasks = overIndex !== -1 && activeIndex !== -1
      ? arrayMove(targetCol.tasks, activeIndex, overIndex)
      : targetCol.tasks;

    const position = overIndex >= 0 ? overIndex : newTasks.length - 1;

    try {
      await moveTask({
        variables: {
          input: { taskId: active.id, targetColumnId: overColId, position },
        },
      });
      onRefresh();
    } catch {
      onRefresh(); // revert on error
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4 h-full">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              onAddTask={(colId) => setCreateColumnId(colId)}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 opacity-90">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      <CreateTaskModal
        isOpen={!!createColumnId}
        onClose={() => setCreateColumnId(null)}
        columnId={createColumnId ?? ''}
        projectId={projectId}
        onCreated={onRefresh}
      />
    </>
  );
}
