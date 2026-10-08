import { describe, expect, test } from 'vitest';
import type { Todo } from '../../App/todoModel';
import { getTodoAgendaEntries } from './TodoAgenda';

const baseTodo: Todo = {
  completed: false,
  completedAt: null,
  archivedAt: null,
  createdAt: null,
  description: null,
  endDate: null,
  endTime: null,
  excludedOccurrences: [],
  completedOccurrences: [],
  id: 'todo-1',
  kind: 'task',
  order: 0,
  priority: 'medium',
  project: null,
  recurrence: 'none',
  recurrenceCount: null,
  recurrenceDays: [],
  recurrenceEndDate: null,
  reminder: 'none',
  startDate: null,
  startTime: null,
  subtasks: [],
  tags: [],
  timeBlocks: [],
};

describe('getTodoAgendaEntries', () => {
  test('excludes unscheduled todos and sorts future items chronologically', () => {
    const entries = getTodoAgendaEntries([
      { ...baseTodo, id: 'later', text: 'Parcial 2', dueDate: '2026-10-22', dateType: 'due' },
      { ...baseTodo, id: 'none', text: 'Pendiente sin fecha', dueDate: null, dateType: 'due' },
      { ...baseTodo, id: 'first', text: 'Parcial 1', dueDate: '2026-10-09', dateType: 'due' },
    ], '2026-10-08');

    expect(entries.map(entry => entry.todo.text)).toEqual(['Parcial 1', 'Parcial 2']);
  });

  test('includes the next occurrence of recurring todos', () => {
    const entries = getTodoAgendaEntries([
      {
        ...baseTodo,
        id: 'weekly',
        text: 'Clase',
        dateType: 'period',
        kind: 'schedule',
        startDate: '2026-10-05',
        endDate: '2026-12-31',
        startTime: '18:00',
        endTime: '20:00',
        recurrence: 'weekly',
        recurrenceDays: [4],
      },
    ], '2026-10-08');

    expect(entries).toHaveLength(1);
    expect(entries[0].dateValue).toBe('2026-10-08');
  });
});
