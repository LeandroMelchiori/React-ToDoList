import { describe, expect, test } from 'vitest';
import { createTodo } from './todoModel';
import { createTodoWorkspaceBackup } from './todoWorkspaceBackup';
import {
  MAX_TODO_SNAPSHOTS,
  addTodoSnapshot,
  normalizeTodoSnapshots,
  removeTodoSnapshot,
} from './todoSnapshotHistory';
import type { TodoSnapshot } from './todoSnapshotHistory';

function createBackup(text = 'Preparar entrega') {
  return createTodoWorkspaceBackup({
    activeBoardId: 'personal',
    boards: [{ id: 'personal', name: 'Personal', todos: [], createdAt: null, updatedAt: null }],
    savedViews: [],
    todos: [{ ...createTodo(text), id: `todo-${text}` }],
  });
}

describe('todoSnapshotHistory', () => {
  test('keeps the newest automatic snapshots within the local limit', () => {
    let snapshots: TodoSnapshot[] = [];

    for (let index = 0; index < MAX_TODO_SNAPSHOTS + 2; index += 1) {
      snapshots = addTodoSnapshot(snapshots, createBackup(`Tarea ${index}`), `Cambio ${index}`);
    }

    expect(snapshots).toHaveLength(MAX_TODO_SNAPSHOTS);
    expect(snapshots[0].reason).toBe(`Cambio ${MAX_TODO_SNAPSHOTS + 1}`);
    expect(snapshots.at(-1)?.reason).toBe('Cambio 2');
  });

  test('normalizes valid snapshots and ignores malformed entries', () => {
    const backup = createBackup();
    const snapshots = normalizeTodoSnapshots([
      { id: 'snapshot-1', createdAt: 'invalid', reason: '  Antes de borrar  ', backup },
      { id: 'snapshot-2', backup: { kind: 'invalid' } },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual(expect.objectContaining({
      id: 'snapshot-1',
      reason: 'Antes de borrar',
      createdAt: backup.exportedAt,
    }));
  });

  test('removes only the selected snapshot', () => {
    const firstSnapshots = addTodoSnapshot([], createBackup('Primera'), 'Primera copia');
    const snapshots = addTodoSnapshot(firstSnapshots, createBackup('Segunda'), 'Segunda copia');

    expect(removeTodoSnapshot(snapshots, snapshots[0].id)).toEqual([snapshots[1]]);
  });
});
