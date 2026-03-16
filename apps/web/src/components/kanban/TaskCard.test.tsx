import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

// Wrap with required DnD context
function renderCard(task: Parameters<typeof TaskCard>[0]['task'], onClick = vi.fn()) {
  return render(
    <DndContext>
      <SortableContext items={[task.id]}>
        <TaskCard task={task} onClick={onClick} />
      </SortableContext>
    </DndContext>,
  );
}

const baseTask = {
  id: 'task-1',
  title: 'Fix the login bug',
  priority: 'HIGH',
};

describe('TaskCard', () => {
  it('should render the task title', () => {
    renderCard(baseTask);
    expect(screen.getByText('Fix the login bug')).toBeTruthy();
  });

  it('should render the priority label', () => {
    renderCard(baseTask);
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn();
    renderCard(baseTask, onClick);

    fireEvent.click(screen.getByText('Fix the login bug'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should render due date when provided', () => {
    const task = { ...baseTask, dueDate: '2026-12-31T00:00:00Z' };
    renderCard(task);

    // The date should appear in some formatted form
    const container = document.body;
    expect(container.textContent).toContain('Dec');
  });

  it('should apply red color for overdue dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const task = { ...baseTask, dueDate: pastDate.toISOString() };

    const { container } = renderCard(task);
    const dateEl = container.querySelector('.text-red-500');
    expect(dateEl).toBeTruthy();
  });

  it('should NOT apply red color for future due dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const task = { ...baseTask, dueDate: futureDate.toISOString() };

    const { container } = renderCard(task);
    expect(container.querySelector('.text-red-500')).toBeNull();
  });

  it('should render assignee avatar when provided', () => {
    const task = {
      ...baseTask,
      assignee: { fullName: 'Alice Smith', avatarUrl: null },
    };
    renderCard(task);

    // Avatar renders initials
    expect(screen.getByText('AS')).toBeTruthy();
  });

  it('should NOT render assignee section when assignee is null', () => {
    const task = { ...baseTask, assignee: null };
    renderCard(task);

    expect(screen.queryByText('AS')).toBeNull();
  });

  it('should render URGENT priority correctly', () => {
    renderCard({ ...baseTask, priority: 'URGENT' });
    expect(screen.getByText('Urgent')).toBeTruthy();
  });

  it('should render MEDIUM priority correctly', () => {
    renderCard({ ...baseTask, priority: 'MEDIUM' });
    expect(screen.getByText('Medium')).toBeTruthy();
  });
});
