import { describe, expect, test } from 'vitest';
import type { Todo } from '../../../../shared/calendar/todoModel';
import { getTodoAgendaEntries, getUnscheduledAgendaTodos } from './TodoAgenda';

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
  text: 'Tarea base',
  kind: 'task',
  dateType: 'due',
  dueDate: null,
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

  test('keeps only pending tasks without dates in the unscheduled column', () => {
    const todos = [
      { ...baseTodo, id: 'unscheduled', text: 'Actualizar portfolio' },
      { ...baseTodo, id: 'dated', text: 'Parcial', dueDate: '2026-10-12' },
      { ...baseTodo, id: 'done', text: 'Finalizada', completed: true },
      {
        ...baseTodo,
        id: 'blocked',
        text: 'Preparar demo',
        timeBlocks: [{
          id: 'block-1',
          date: '2026-10-10',
          startTime: '18:00',
          endTime: '19:00',
        }],
      },
    ];

    expect(getUnscheduledAgendaTodos(todos, '2026-10-08').map(todo => todo.id)).toEqual(['unscheduled']);
  });

  test('projects the next weekly due date for a recurring task', () => {
    const entries = getTodoAgendaEntries([
      {
        ...baseTodo,
        id: 'weekly-task',
        text: 'Preparar demo',
        dueDate: '2026-07-20',
        recurrence: 'weekly',
      },
    ], '2026-10-09');

    expect(entries).toHaveLength(1);
    expect(entries[0].dateValue).toBe('2026-10-12');
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
