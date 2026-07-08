import { normalizeTodos } from './todoModel';
import type { Todo } from './todoModel';

type TodoBoard = {
    id: string;
    name: string;
    todos: Todo[];
    createdAt: string | null;
    updatedAt: string | null;
};

type TodoBoardActionResult =
    | { ok: true; board: TodoBoard; boards: TodoBoard[] }
    | { ok: false; error: string };

type TodoBoardDeleteResult =
    | { ok: true; deletedBoard: TodoBoard; nextBoard: TodoBoard; boards: TodoBoard[] }
    | { ok: false; error: string };

const DEFAULT_TODO_BOARD_ID = 'personal';
const DEFAULT_TODO_BOARD_NAME = 'Personal';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeBoardName(name: unknown, fallback = ''): string {
    const normalizedName = typeof name === 'string'
        ? name.replace(/\s+/g, ' ').trim()
        : '';

    return (normalizedName || fallback).slice(0, 40);
}

function createTodoBoardId(name: string): string {
    const slug = normalizeBoardName(name, 'tablero')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `board-${slug || 'local'}-${crypto.randomUUID()}`;
    }

    return `board-${slug || 'local'}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTodoBoard(
    name: string,
    options: { id?: string; todos?: unknown; now?: string | null } = {}
): TodoBoard {
    const now = options.now === undefined ? new Date().toISOString() : options.now;

    return {
        id: options.id || createTodoBoardId(name),
        name: normalizeBoardName(name, DEFAULT_TODO_BOARD_NAME),
        todos: normalizeTodos(options.todos),
        createdAt: now,
        updatedAt: now,
    };
}

function normalizeTodoBoards(boards: unknown): TodoBoard[] {
    if (!Array.isArray(boards)) {
        return [];
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    return boards
        .filter(isRecord)
        .map((board, index) => {
            const id = typeof board.id === 'string' && board.id
                ? board.id
                : `board-${index + 1}`;
            const name = normalizeBoardName(board.name, `Tablero ${index + 1}`);
            const nameKey = name.toLowerCase();

            if (seenIds.has(id) || seenNames.has(nameKey)) {
                return null;
            }

            seenIds.add(id);
            seenNames.add(nameKey);

            return {
                id,
                name,
                todos: normalizeTodos(board.todos),
                createdAt: typeof board.createdAt === 'string' ? board.createdAt : null,
                updatedAt: typeof board.updatedAt === 'string' ? board.updatedAt : null,
            };
        })
        .filter((board): board is TodoBoard => Boolean(board));
}

function ensureDefaultTodoBoard(boards: TodoBoard[], todos: Todo[] = []): TodoBoard[] {
    if (boards.length > 0) {
        return boards;
    }

    return [
        createTodoBoard(DEFAULT_TODO_BOARD_NAME, {
            id: DEFAULT_TODO_BOARD_ID,
            todos,
        }),
    ];
}

function getActiveTodoBoardId(boards: TodoBoard[], activeBoardId: unknown): string {
    const normalizedBoards = ensureDefaultTodoBoard(boards);
    const activeBoard = normalizedBoards.find(board => board.id === activeBoardId);

    return activeBoard?.id || normalizedBoards[0].id;
}

function getActiveTodoBoard(boards: TodoBoard[], activeBoardId: unknown): TodoBoard | null {
    const boardId = getActiveTodoBoardId(boards, activeBoardId);

    return ensureDefaultTodoBoard(boards).find(board => board.id === boardId) || null;
}

function upsertTodoBoardTodos(
    boards: TodoBoard[],
    boardId: string,
    todos: Todo[],
    now = new Date().toISOString()
): TodoBoard[] {
    const normalizedBoards = ensureDefaultTodoBoard(boards, normalizeTodos(todos));

    return normalizedBoards.map(board =>
        board.id === boardId
            ? {
                ...board,
                todos: normalizeTodos(todos),
                updatedAt: now,
            }
            : board
    );
}

function addTodoBoard(boards: TodoBoard[], name: string): TodoBoardActionResult {
    const boardName = normalizeBoardName(name);

    if (!boardName) {
        return { ok: false, error: 'Escribe un nombre para el tablero.' };
    }

    const normalizedBoards = ensureDefaultTodoBoard(boards);
    const alreadyExists = normalizedBoards.some(board =>
        board.name.toLowerCase() === boardName.toLowerCase()
    );

    if (alreadyExists) {
        return { ok: false, error: 'Ya existe un tablero con ese nombre.' };
    }

    const board = createTodoBoard(boardName);

    return {
        ok: true,
        board,
        boards: [...normalizedBoards, board],
    };
}

function renameTodoBoard(boards: TodoBoard[], boardId: string, name: string): TodoBoardActionResult {
    const boardName = normalizeBoardName(name);

    if (!boardName) {
        return { ok: false, error: 'Escribe un nombre para el tablero.' };
    }

    const normalizedBoards = ensureDefaultTodoBoard(boards);
    const currentBoard = normalizedBoards.find(board => board.id === boardId);

    if (!currentBoard) {
        return { ok: false, error: 'No encontramos ese tablero.' };
    }

    const alreadyExists = normalizedBoards.some(board =>
        board.id !== boardId && board.name.toLowerCase() === boardName.toLowerCase()
    );

    if (alreadyExists) {
        return { ok: false, error: 'Ya existe un tablero con ese nombre.' };
    }

    const now = new Date().toISOString();
    const renamedBoards = normalizedBoards.map(board =>
        board.id === boardId
            ? {
                ...board,
                name: boardName,
                updatedAt: now,
            }
            : board
    );
    const board = renamedBoards.find(item => item.id === boardId) as TodoBoard;

    return {
        ok: true,
        board,
        boards: renamedBoards,
    };
}

function removeTodoBoard(boards: TodoBoard[], boardId: string): TodoBoardDeleteResult {
    const normalizedBoards = ensureDefaultTodoBoard(boards);

    if (normalizedBoards.length <= 1) {
        return { ok: false, error: 'Necesitas al menos un tablero.' };
    }

    const boardIndex = normalizedBoards.findIndex(board => board.id === boardId);

    if (boardIndex < 0) {
        return { ok: false, error: 'No encontramos ese tablero.' };
    }

    const deletedBoard = normalizedBoards[boardIndex];
    const boardsWithoutDeleted = normalizedBoards.filter(board => board.id !== boardId);
    const nextBoard = boardsWithoutDeleted[Math.min(boardIndex, boardsWithoutDeleted.length - 1)];

    return {
        ok: true,
        deletedBoard,
        nextBoard,
        boards: boardsWithoutDeleted,
    };
}

export {
    DEFAULT_TODO_BOARD_ID,
    DEFAULT_TODO_BOARD_NAME,
    addTodoBoard,
    createTodoBoard,
    ensureDefaultTodoBoard,
    getActiveTodoBoard,
    getActiveTodoBoardId,
    normalizeTodoBoards,
    removeTodoBoard,
    renameTodoBoard,
    upsertTodoBoardTodos,
};

export type {
    TodoBoard,
    TodoBoardActionResult,
    TodoBoardDeleteResult,
};
