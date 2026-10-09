import { describe, expect, test } from 'vitest';
import { applyTodoScheduleChange, undoTodoScheduleChange, normalizeTodos, getTodoPlanningSlot,
  getTodoPlanningCategory, createTodosBackup, readTodosBackup } from './todoModel';
import type { TodoScheduleChange } from './todoModel';

const todos = () => normalizeTodos([
  { id: 'event', text: 'Examen', kind: 'event', startDate: '2026-10-09', startTime: '10:00', endTime: '12:30', project: 'Estudio' },
  { id: 'task', text: 'Preparar material', kind: 'task', description: 'Conservar notas', priority: 'high', tags: ['trabajo'],
    timeBlocks: [{ id: 'block', date: '2026-10-09', startTime: '09:15', endTime: '10:45' }] },
  { id: 'series', text: 'Clase', kind: 'schedule', startDate: '2026-10-05', endDate: '2026-12-31',
    startTime: '18:00', endTime: '20:00', recurrence: 'weekly', recurrenceDays: [1, 3, 5] },
]);
const change: TodoScheduleChange = { todoId: 'task', timeBlockId: 'block', date: '2026-10-12', startTime: '11:00', endTime: '12:30' };

describe('planning model', () => {
  test('preserves event duration through JSON backups', () => {
    const event = todos()[0];
    expect(event.endTime).toBe('12:30');
    const imported = readTodosBackup(JSON.parse(JSON.stringify(createTodosBackup([event]))));
    expect(imported.ok && imported.todos[0].endTime).toBe('12:30');
  });

  test('moves a task block while preserving its identity and task metadata', () => {
    const result = applyTodoScheduleChange(todos(), change);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos[1]).toMatchObject({ description: 'Conservar notas', priority: 'high', tags: ['trabajo'],
      timeBlocks: [{ id: 'block', date: '2026-10-12', startTime: '11:00', endTime: '12:30' }] });
    const edited = result.todos.map(todo => todo.id === 'task' ? { ...todo, description: 'Notas nuevas', completed: true } : todo);
    const restored = undoTodoScheduleChange(edited, result.undo);
    expect(restored.ok && restored.todos[1]).toMatchObject({ description: 'Notas nuevas', completed: true,
      timeBlocks: [{ id: 'block', date: '2026-10-09', startTime: '09:15', endTime: '10:45' }] });
  });

  test('moves one recurring date and restores the series with undo', () => {
    const initial = todos();
    const result = applyTodoScheduleChange(initial, { todoId: 'series', occurrenceDate: '2026-10-09',
      date: '2026-10-10', startTime: '15:00', endTime: '17:30' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.todos[2]).toMatchObject({ recurrenceDays: [1, 3, 5], startTime: '18:00', excludedOccurrences: ['2026-10-09'] });
    expect(result.todos[3]).toMatchObject({ text: 'Clase', recurrence: 'none', startDate: '2026-10-10', startTime: '15:00', endTime: '17:30' });
    expect(undoTodoScheduleChange(result.todos, result.undo)).toEqual({ ok: true, todos: initial });
  });

  test('rejects invalid intervals, missing blocks, duplicates and stale undo', () => {
    expect(applyTodoScheduleChange(todos(), { ...change, endTime: '10:00' }).ok).toBe(false);
    expect(applyTodoScheduleChange(todos(), { ...change, date: 'invalid' }).ok).toBe(false);
    expect(applyTodoScheduleChange(todos(), { ...change, date: '2026-02-30' }).ok).toBe(false);
    expect(applyTodoScheduleChange(todos(), { ...change, timeBlockId: 'missing' }).ok).toBe(false);
    expect(applyTodoScheduleChange(todos(), { ...change, timeBlockId: undefined, date: '2026-10-09', startTime: '09:15', endTime: '10:45' }).ok).toBe(false);
    const result = applyTodoScheduleChange(todos(), change);
    if (!result.ok) throw new Error(result.error);
    const edited = result.todos.map(todo => todo.id === 'task' ? { ...todo, timeBlocks: [] } : todo);
    expect(undoTodoScheduleChange(edited, result.undo).ok).toBe(false);
  });

  test('keeps the original duration when selecting a new time', () => {
    expect(getTodoPlanningSlot(todos()[1], { date: '2026-10-12', startTime: '15:00', timeBlockId: 'block' }))
      .toEqual({ date: '2026-10-12', startTime: '15:00', endTime: '16:30' });
    expect(getTodoPlanningSlot(todos()[0], { date: '2026-10-12', startTime: '14:00' })?.endTime).toBe('16:30');
  });

  test('uses existing projects for consistent visual categories', () => {
    expect(getTodoPlanningCategory({ project: 'Trabajo' })).toBe('work');
    expect(getTodoPlanningCategory({ project: 'Universidad' })).toBe('study');
    expect(getTodoPlanningCategory({ project: null })).toBe('personal');
    expect(getTodoPlanningCategory({ project: 'TaskFlow' })).toBe('other');
  });
});
