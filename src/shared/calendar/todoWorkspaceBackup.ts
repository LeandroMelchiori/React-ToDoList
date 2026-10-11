import {
    TODO_BACKUP_VERSION,
    normalizeTodos,
} from './todoModel';
import type { Todo } from './todoModel';
import {
    ensureDefaultTodoBoard,
    getActiveTodoBoard,
    getActiveTodoBoardId,
    normalizeTodoBoards,
    upsertTodoBoardTodos,
} from './todoBoards';
import type { TodoBoard } from './todoBoards';
import { normalizeTodoSavedViews } from './todoSavedViews';
import type { TodoSavedView } from './todoSavedViews';
import { readOrders } from '../orders/orderModel';
import type { Order } from '../orders/orderModel';

type TodoWorkspaceBackup = {
    version: number;
    kind: typeof TODO_WORKSPACE_BACKUP_KIND;
    exportedAt: string;
    todos: Todo[];
    boards: TodoBoard[];
    activeBoardId: string;
    savedViews: TodoSavedView[];
    orders?: Order[];
};

type CreateTodoWorkspaceBackupOptions = {
    todos: Todo[];
    boards: TodoBoard[];
    activeBoardId: string;
    savedViews: TodoSavedView[];
    orders?: Order[];
};

type TodoWorkspaceBackupReadResult =
    | { ok: true; backup: TodoWorkspaceBackup; totalTodos: number; isWorkspaceBackup: true }
    | { ok: false; error: string; isWorkspaceBackup: boolean };

const TODO_WORKSPACE_BACKUP_KIND = 'taskflow-workspace';
const UNSUPPORTED_WORKSPACE_BACKUP_VERSION_ERROR = 'El backup usa una version de datos mas nueva que esta app.';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isTodoWorkspaceBackup(backup: unknown): boolean {
    return isRecord(backup) && (
        backup.kind === TODO_WORKSPACE_BACKUP_KIND ||
        Array.isArray(backup.boards) ||
        Array.isArray(backup.savedViews)
    );
}

function getBoardTodoCount(boards: TodoBoard[]): number {
    return boards.reduce((totalTodos, board) => totalTodos + normalizeTodos(board.todos).length, 0);
}

function createTodoWorkspaceBackup({
    activeBoardId,
    boards,
    savedViews,
    todos,
    orders,
}: CreateTodoWorkspaceBackupOptions): TodoWorkspaceBackup {
    const orderResult = orders === undefined ? undefined : readOrders(orders);
    if (orderResult && !orderResult.ok) throw new Error(orderResult.error);
    const normalizedTodos = normalizeTodos(todos);
    const normalizedBoards = ensureDefaultTodoBoard(normalizeTodoBoards(boards), normalizedTodos);
    const nextActiveBoardId = getActiveTodoBoardId(normalizedBoards, activeBoardId);
    const boardsWithCurrentTodos = upsertTodoBoardTodos(normalizedBoards, nextActiveBoardId, normalizedTodos);
    const activeBoard = getActiveTodoBoard(boardsWithCurrentTodos, nextActiveBoardId);

    return {
        version: orderResult ? 2 : TODO_BACKUP_VERSION,
        kind: TODO_WORKSPACE_BACKUP_KIND,
        exportedAt: new Date().toISOString(),
        todos: activeBoard?.todos || normalizedTodos,
        boards: boardsWithCurrentTodos,
        activeBoardId: nextActiveBoardId,
        savedViews: normalizeTodoSavedViews(savedViews),
        ...(orderResult?.ok ? { orders: orderResult.orders } : {}),
    };
}

function readTodoWorkspaceBackup(backup: unknown): TodoWorkspaceBackupReadResult {
    const isWorkspaceBackup = isTodoWorkspaceBackup(backup);

    if (!isWorkspaceBackup) {
        return {
            ok: false,
            error: 'El archivo no contiene un backup completo valido.',
            isWorkspaceBackup: false,
        };
    }

    if (
        isRecord(backup) &&
        typeof backup.version === 'number' &&
        backup.version > 2
    ) {
        return {
            ok: false,
            error: UNSUPPORTED_WORKSPACE_BACKUP_VERSION_ERROR,
            isWorkspaceBackup: true,
        };
    }

    const fallbackTodos = isRecord(backup) ? normalizeTodos(backup.todos) : [];
    if (isRecord(backup) && backup.version === 2 && (backup.kind !== TODO_WORKSPACE_BACKUP_KIND ||
        !Array.isArray(backup.todos) || !Array.isArray(backup.boards) || !Array.isArray(backup.savedViews) || typeof backup.activeBoardId !== 'string')) {
        return { ok: false, error: 'El backup completo versión 2 no tiene una estructura válida.', isWorkspaceBackup: true };
    }
    const orderResult = isRecord(backup) && backup.version === 2 ? readOrders(backup.orders) : undefined;
    if (orderResult && !orderResult.ok) return { ...orderResult, isWorkspaceBackup: true };
    const boards = ensureDefaultTodoBoard(
        normalizeTodoBoards(isRecord(backup) ? backup.boards : []),
        fallbackTodos
    );
    const activeBoardId = getActiveTodoBoardId(
        boards,
        isRecord(backup) ? backup.activeBoardId : undefined
    );
    const activeBoard = getActiveTodoBoard(boards, activeBoardId);
    const workspaceBackup: TodoWorkspaceBackup = {
        version: isRecord(backup) && typeof backup.version === 'number'
            ? backup.version
            : TODO_BACKUP_VERSION,
        kind: TODO_WORKSPACE_BACKUP_KIND,
        exportedAt: isRecord(backup) && typeof backup.exportedAt === 'string'
            ? backup.exportedAt
            : new Date().toISOString(),
        todos: activeBoard?.todos || fallbackTodos,
        boards,
        activeBoardId,
        savedViews: normalizeTodoSavedViews(isRecord(backup) ? backup.savedViews : []),
        ...(orderResult?.ok ? { orders: orderResult.orders } : {}),
    };

    return {
        ok: true,
        backup: workspaceBackup,
        totalTodos: getBoardTodoCount(workspaceBackup.boards),
        isWorkspaceBackup: true,
    };
}

export {
    TODO_WORKSPACE_BACKUP_KIND,
    createTodoWorkspaceBackup,
    readTodoWorkspaceBackup,
};

export type {
    TodoWorkspaceBackup,
    TodoWorkspaceBackupReadResult,
};
