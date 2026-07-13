import {
  readTodoWorkspaceBackup,
} from './todoWorkspaceBackup';
import type { TodoWorkspaceBackup } from './todoWorkspaceBackup';

const MAX_TODO_SNAPSHOTS = 5;

type TodoSnapshot = {
  id: string;
  createdAt: string;
  reason: string;
  backup: TodoWorkspaceBackup;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createSnapshotId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTodoSnapshots(value: unknown): TodoSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const backupResult = readTodoWorkspaceBackup(item.backup);

    if (!backupResult.ok) {
      return [];
    }

    const createdAt = typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
      ? item.createdAt
      : backupResult.backup.exportedAt;
    const reason = typeof item.reason === 'string' && item.reason.trim()
      ? item.reason.trim()
      : 'Copia automatica';

    return [{
      id: typeof item.id === 'string' && item.id.trim() ? item.id : createSnapshotId(),
      createdAt,
      reason,
      backup: backupResult.backup,
    }];
  }).slice(0, MAX_TODO_SNAPSHOTS);
}

function hasWorkspaceContent(backup: TodoWorkspaceBackup): boolean {
  return backup.boards.some(board => board.todos.length > 0) ||
    backup.boards.length > 1 ||
    backup.savedViews.length > 0;
}

function addTodoSnapshot(
  snapshots: TodoSnapshot[],
  backup: TodoWorkspaceBackup,
  reason: string
): TodoSnapshot[] {
  if (!hasWorkspaceContent(backup)) {
    return normalizeTodoSnapshots(snapshots);
  }

  const snapshot: TodoSnapshot = {
    id: createSnapshotId(),
    createdAt: new Date().toISOString(),
    reason: reason.trim() || 'Copia automatica',
    backup,
  };

  return [snapshot, ...normalizeTodoSnapshots(snapshots)].slice(0, MAX_TODO_SNAPSHOTS);
}

function removeTodoSnapshot(snapshots: TodoSnapshot[], snapshotId: string): TodoSnapshot[] {
  return normalizeTodoSnapshots(snapshots).filter(snapshot => snapshot.id !== snapshotId);
}

export {
  MAX_TODO_SNAPSHOTS,
  addTodoSnapshot,
  hasWorkspaceContent,
  normalizeTodoSnapshots,
  removeTodoSnapshot,
};

export type { TodoSnapshot };
