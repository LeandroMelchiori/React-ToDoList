import React from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
    TODO_FILTERS,
    TODO_KINDS,
    TODO_RECURRENCES,
    analyzeTodosImport,
    applyTodosImport,
    createTodo,
    createTodosCalendarExport,
    getTodoFacets,
    getTodoGroups,
    getTodoInsights,
    getTodosDateCounts,
    getVisibleTodos,
    isTaskTodo,
    mergeSubtasks,
    moveTodoToPosition as reorderTodoToPosition,
    normalizeDateTypeForTodoKind,
    normalizeDescription,
    normalizeDueDate,
    normalizePriority,
    normalizeProject,
    normalizeRecurrenceCount,
    normalizeRecurrenceDays,
    normalizeReminder,
    normalizeTags,
    normalizeTodoKind,
    normalizeTodoRecurrenceForKind,
    normalizeTodoSchedule,
    normalizeTodoTimes,
    normalizeTodos,
    readTodosCalendarImport,
    reindexTodos,
} from './todoModel';
import {
    DEFAULT_TODO_BOARD_ID,
    addTodoBoard,
    ensureDefaultTodoBoard,
    getActiveTodoBoard,
    getActiveTodoBoardId,
    normalizeTodoBoards,
    removeTodoBoard,
    renameTodoBoard,
    upsertTodoBoardTodos,
} from './todoBoards';
import {
    addTodoSavedView,
    normalizeTodoSavedViews,
    removeTodoSavedView,
} from './todoSavedViews';
import {
    createTodoWorkspaceBackup,
    readTodoWorkspaceBackup,
} from './todoWorkspaceBackup';
import type {
    ImportMode,
    Todo,
    TodoDetails,
    TodoFilter,
} from './todoModel';
import type { TodoBoard } from './todoBoards';
import type { TodoSavedView } from './todoSavedViews';

const STORAGE_KEY = 'TODOS_V1';
const BOARD_STORAGE_KEY = 'TODO_BOARDS_V1';
const ACTIVE_BOARD_STORAGE_KEY = 'ACTIVE_TODO_BOARD_V1';
const SAVED_VIEWS_STORAGE_KEY = 'TODO_SAVED_VIEWS_V1';
const DEFAULT_TODOS: Todo[] = [];
const DEFAULT_TODO_BOARDS: TodoBoard[] = [];
const DEFAULT_TODO_SAVED_VIEWS: TodoSavedView[] = [];

type TodoActionResult = { ok: true } | { ok: false; error: string };
type TodoImportOptions = { mode?: ImportMode };

function getDuplicateTodoText(todos: Todo[], text: string): string {
    const existingTexts = new Set(todos.map(todo => todo.text.toLowerCase()));
    const baseText = `Copia de ${text}`;

    if (!existingTexts.has(baseText.toLowerCase())) {
        return baseText;
    }

    let copyNumber = 2;
    let nextText = `Copia ${copyNumber} de ${text}`;

    while (existingTexts.has(nextText.toLowerCase())) {
        copyNumber += 1;
        nextText = `Copia ${copyNumber} de ${text}`;
    }

    return nextText;
}

function isTodoList(item: unknown): boolean {
    return Array.isArray(item);
}

function isTodoBoardList(item: unknown): boolean {
    return Array.isArray(item);
}

function isActiveBoardId(item: unknown): boolean {
    return typeof item === 'string';
}

function isSavedViewList(item: unknown): boolean {
    return Array.isArray(item);
}

function useTodos() {
    const { 
        item: todos,
        saveItem: saveTodos,
        synchronizeItem: syncTodos,
        loading,
        error
        } = useLocalStorage<Todo[]>(STORAGE_KEY, DEFAULT_TODOS, isTodoList);

    const {
        item: storedBoards,
        saveItem: saveBoards,
        loading: boardsLoading,
        error: boardsError,
    } = useLocalStorage<TodoBoard[]>(BOARD_STORAGE_KEY, DEFAULT_TODO_BOARDS, isTodoBoardList);

    const {
        item: storedActiveBoardId,
        saveItem: saveActiveBoardId,
        loading: activeBoardLoading,
        error: activeBoardError,
    } = useLocalStorage<string>(ACTIVE_BOARD_STORAGE_KEY, DEFAULT_TODO_BOARD_ID, isActiveBoardId);

    const {
        item: storedSavedViews,
        saveItem: saveSavedViews,
        loading: savedViewsLoading,
        error: savedViewsError,
    } = useLocalStorage<TodoSavedView[]>(SAVED_VIEWS_STORAGE_KEY, DEFAULT_TODO_SAVED_VIEWS, isSavedViewList);

    const initializedBoardsRef = React.useRef(false);
    const hydratedActiveBoardRef = React.useRef(false);
  
    const [searchValue, setSearchValue] =
     React.useState('');

    const [filter, setFilter] =
     React.useState<TodoFilter>(TODO_FILTERS.all);

    const [activeProject, setActiveProject] =
     React.useState<string | null>(null);

    const [activeTag, setActiveTag] =
     React.useState<string | null>(null);

    const [openModal, setOpenModal] =
     React.useState(false);

    const [editingTodoId, setEditingTodoId] =
     React.useState<string | null>(null);

    const [deletingTodoId, setDeletingTodoId] =
     React.useState<string | null>(null);

    const [detailTodoId, setDetailTodoId] =
     React.useState<string | null>(null);

    const [recentlyDeletedTodo, setRecentlyDeletedTodo] =
     React.useState<Todo | null>(null);

    const normalizedTodos = normalizeTodos(todos);
    const normalizedStoredBoards = normalizeTodoBoards(storedBoards);
    const savedViews = normalizeTodoSavedViews(storedSavedViews);
    const todoBoards = ensureDefaultTodoBoard(normalizedStoredBoards, normalizedTodos);
    const activeBoardId = getActiveTodoBoardId(todoBoards, storedActiveBoardId);
    const activeBoard = getActiveTodoBoard(todoBoards, activeBoardId);
    const editingTodo = normalizedTodos.find(todo => todo.id === editingTodoId) || null;
    const deletingTodo = normalizedTodos.find(todo => todo.id === deletingTodoId) || null;
    const detailTodo = normalizedTodos.find(todo => todo.id === detailTodoId) || null;

    const taskTodos = normalizedTodos.filter(isTaskTodo);
    const completedTodos = taskTodos.filter(todo => todo.completed).length;
    const totalTasks = taskTodos.length;
    const totalTodos = normalizedTodos.length;
    const pendingTodos = totalTasks - completedTodos;
    const dateCounts = getTodosDateCounts(normalizedTodos);
    const insights = getTodoInsights(normalizedTodos);
    const facets = getTodoFacets(normalizedTodos);

    const visibleTodos = getVisibleTodos(normalizedTodos, searchValue, filter, undefined, {
        project: activeProject,
        tag: activeTag,
    });
    const visibleTodoGroups = getTodoGroups(visibleTodos);

    React.useEffect(() => {
        if (
            initializedBoardsRef.current ||
            loading ||
            boardsLoading ||
            activeBoardLoading ||
            normalizedStoredBoards.length > 0
        ) {
            return;
        }

        initializedBoardsRef.current = true;
        saveBoards(todoBoards);
        saveActiveBoardId(activeBoardId);
    }, [
        activeBoardId,
        activeBoardLoading,
        boardsLoading,
        loading,
        normalizedStoredBoards.length,
        saveActiveBoardId,
        saveBoards,
        todoBoards,
    ]);

    React.useEffect(() => {
        if (
            hydratedActiveBoardRef.current ||
            loading ||
            boardsLoading ||
            activeBoardLoading ||
            normalizedStoredBoards.length === 0 ||
            !activeBoard
        ) {
            return;
        }

        hydratedActiveBoardRef.current = true;

        if (JSON.stringify(activeBoard.todos) !== JSON.stringify(normalizedTodos)) {
            saveTodos(activeBoard.todos);
        }

        if (activeBoard.id !== storedActiveBoardId) {
            saveActiveBoardId(activeBoard.id);
        }
    }, [
        activeBoard,
        activeBoardLoading,
        boardsLoading,
        loading,
        normalizedStoredBoards.length,
        normalizedTodos,
        saveActiveBoardId,
        saveTodos,
        storedActiveBoardId,
    ]);

    const saveActiveTodos = React.useCallback((newTodos: Todo[]) => {
        const nextTodos = normalizeTodos(newTodos);

        saveTodos(nextTodos);
        saveBoards(upsertTodoBoardTodos(todoBoards, activeBoardId, nextTodos));
    }, [activeBoardId, saveBoards, saveTodos, todoBoards]);

    const resetTodoView = ({ preserveProject = false }: { preserveProject?: boolean } = {}) => {
        setSearchValue('');
        setFilter(TODO_FILTERS.all);

        if (preserveProject) {
            setActiveTag(null);
        } else {
            clearFacetFilters();
        }

        setDetailTodoId(null);
        setEditingTodoId(null);
        setDeletingTodoId(null);
        setRecentlyDeletedTodo(null);
    }

    const selectTodoBoard = (boardId: string): TodoActionResult => {
        if (boardId === activeBoardId) {
            return { ok: true };
        }

        const boardsWithCurrentTodos = upsertTodoBoardTodos(todoBoards, activeBoardId, normalizedTodos);
        const nextBoard = getActiveTodoBoard(boardsWithCurrentTodos, boardId);

        if (!nextBoard) {
            return { ok: false, error: 'No encontramos ese tablero.' };
        }

        saveBoards(boardsWithCurrentTodos);
        saveActiveBoardId(nextBoard.id);
        saveTodos(nextBoard.todos);
        resetTodoView();

        return { ok: true };
    }

    const createBoard = (name: string): TodoActionResult => {
        const boardsWithCurrentTodos = upsertTodoBoardTodos(todoBoards, activeBoardId, normalizedTodos);
        const result = addTodoBoard(boardsWithCurrentTodos, name);

        if (!result.ok) {
            return result;
        }

        saveBoards(result.boards);
        saveActiveBoardId(result.board.id);
        saveTodos(result.board.todos);
        resetTodoView();

        return { ok: true };
    }

    const renameBoard = (boardId: string, name: string): TodoActionResult => {
        const boardsWithCurrentTodos = upsertTodoBoardTodos(todoBoards, activeBoardId, normalizedTodos);
        const result = renameTodoBoard(boardsWithCurrentTodos, boardId, name);

        if (!result.ok) {
            return result;
        }

        saveBoards(result.boards);

        return { ok: true };
    }

    const deleteBoard = (boardId: string): TodoActionResult => {
        const boardsWithCurrentTodos = upsertTodoBoardTodos(todoBoards, activeBoardId, normalizedTodos);
        const result = removeTodoBoard(boardsWithCurrentTodos, boardId);

        if (!result.ok) {
            return result;
        }

        const nextActiveBoard = boardId === activeBoardId
            ? result.nextBoard
            : getActiveTodoBoard(result.boards, activeBoardId);

        saveBoards(result.boards);

        if (nextActiveBoard) {
            saveActiveBoardId(nextActiveBoard.id);
            saveTodos(nextActiveBoard.todos);
        }

        resetTodoView();

        return { ok: true };
    }

    const saveCurrentView = (name: string): TodoActionResult => {
        const result = addTodoSavedView(savedViews, name, {
            searchValue,
            filter,
            project: activeProject,
            tag: activeTag,
        });

        if (!result.ok) {
            return result;
        }

        saveSavedViews(result.views);

        return { ok: true };
    }

    const applySavedView = (viewId: string): TodoActionResult => {
        const savedView = savedViews.find(view => view.id === viewId);

        if (!savedView) {
            return { ok: false, error: 'No encontramos esos filtros guardados.' };
        }

        setSearchValue(savedView.searchValue);
        setFilter(savedView.filter);
        setActiveProject(savedView.project);
        setActiveTag(savedView.tag);

        return { ok: true };
    }

    const deleteSavedView = (viewId: string) => {
        saveSavedViews(removeTodoSavedView(savedViews, viewId));
    }

    const completeTodo = (id: string) => {
        const newTodos = normalizedTodos.map(todo =>
            {
                if (todo.id !== id) {
                    return todo;
                }

                if (!isTaskTodo(todo)) {
                    return todo;
                }

                const isCompletedBySubtasks = todo.completed &&
                    todo.subtasks.length > 0 &&
                    todo.subtasks.every(subtask => subtask.completed);

                if (isCompletedBySubtasks) {
                    return todo;
                }

                const nextCompleted = !todo.completed;

                return {
                    ...todo,
                    completed: nextCompleted,
                    completedAt: nextCompleted ? new Date().toISOString() : null,
                    subtasks: nextCompleted
                        ? todo.subtasks.map(subtask => ({ ...subtask, completed: true }))
                        : todo.subtasks,
                };
            }
        );
        saveActiveTodos(newTodos);
    }

    const deleteTodo = (id: string) => {
        const todoToDelete = normalizedTodos.find(todo => todo.id === id);

        if (!todoToDelete) {
            return;
        }

        const newTodos = reindexTodos(normalizedTodos.filter(todo => todo.id !== id));
        saveActiveTodos(newTodos);
        setRecentlyDeletedTodo(todoToDelete);
    }

    const addTodo = (text: string, details: TodoDetails = {}): TodoActionResult => {
        const trimmedText = text.trim();

        if (!trimmedText) {
            return { ok: false, error: 'Escribe una tarea antes de agregarla.' };
        }

        const alreadyExists = normalizedTodos.some(todo =>
            todo.text.toLowerCase() === trimmedText.toLowerCase()
        );

        if (alreadyExists) {
            return { ok: false, error: 'Esa tarea ya existe.' };
        }

        const project = activeProject || normalizeProject(details.project);
        const newTodos = [
            ...normalizedTodos,
            createTodo(trimmedText, { ...details, project, order: normalizedTodos.length }),
        ];
        saveActiveTodos(newTodos);
        resetTodoView({ preserveProject: Boolean(activeProject) });
        return { ok: true };
    }

    const duplicateTodo = (id: string): TodoActionResult => {
        const todoToDuplicate = normalizedTodos.find(todo => todo.id === id);

        if (!todoToDuplicate) {
            return { ok: false, error: 'No encontramos ese elemento.' };
        }

        const newTodo = createTodo(getDuplicateTodoText(normalizedTodos, todoToDuplicate.text), {
            kind: todoToDuplicate.kind,
            description: todoToDuplicate.description,
            priority: todoToDuplicate.priority,
            dateType: todoToDuplicate.dateType,
            dueDate: todoToDuplicate.dueDate,
            startDate: todoToDuplicate.startDate,
            endDate: todoToDuplicate.endDate,
            startTime: todoToDuplicate.startTime,
            endTime: todoToDuplicate.endTime,
            recurrence: todoToDuplicate.recurrence,
            recurrenceDays: todoToDuplicate.recurrenceDays,
            recurrenceEndDate: todoToDuplicate.recurrenceEndDate,
            recurrenceCount: todoToDuplicate.recurrenceCount,
            reminder: todoToDuplicate.reminder,
                    project: todoToDuplicate.project,
            tags: todoToDuplicate.tags,
            subtasks: todoToDuplicate.subtasks.map(subtask => subtask.text),
            order: normalizedTodos.length,
        });

        saveActiveTodos([...normalizedTodos, newTodo]);
        resetTodoView({ preserveProject: Boolean(activeProject) });
        setOpenModal(false);

        return { ok: true };
    }

    const updateTodo = (id: string, text: string, details: TodoDetails = {}): TodoActionResult => {
        const trimmedText = text.trim();

        if (!trimmedText) {
            return { ok: false, error: 'Escribe una tarea antes de guardar los cambios.' };
        }

        const todoExists = normalizedTodos.some(todo => todo.id === id);

        if (!todoExists) {
            return { ok: false, error: 'No encontramos esa tarea.' };
        }

        const alreadyExists = normalizedTodos.some(todo =>
            todo.id !== id && todo.text.toLowerCase() === trimmedText.toLowerCase()
        );

        if (alreadyExists) {
            return { ok: false, error: 'Ya existe otra tarea con ese texto.' };
        }

        const kind = normalizeTodoKind(details.kind, details.dateType);
        const dateType = normalizeDateTypeForTodoKind(kind, details.dateType);
        const schedule = normalizeTodoSchedule({
            dateType,
            dueDate: details.dueDate,
            startDate: details.startDate,
            endDate: details.endDate,
        });
        const times = normalizeTodoTimes({
            kind,
            dateType: schedule.dateType,
            startTime: details.startTime,
            endTime: details.endTime,
        });
        const recurrence = normalizeTodoRecurrenceForKind(kind, schedule.dateType, details.recurrence);
        const newTodos = normalizedTodos.map(todo =>
            todo.id === id
                ? {
                    ...todo,
                    text: trimmedText,
                    kind,
                    description: normalizeDescription(details.description),
                    priority: normalizePriority(details.priority),
                    dateType: schedule.dateType,
                    dueDate: schedule.dueDate,
                    startDate: schedule.startDate,
                    endDate: schedule.endDate,
                    startTime: times.startTime,
                    endTime: times.endTime,
                    recurrence,
                    recurrenceDays: recurrence === TODO_RECURRENCES.weekly
                        ? normalizeRecurrenceDays(details.recurrenceDays)
                        : [],
                    recurrenceEndDate: recurrence !== TODO_RECURRENCES.none
                        ? normalizeDueDate(details.recurrenceEndDate)
                        : null,
                    recurrenceCount: recurrence !== TODO_RECURRENCES.none
                        ? normalizeRecurrenceCount(details.recurrenceCount)
                        : null,
                    reminder: normalizeReminder(details.reminder),
                    project: normalizeProject(details.project),
                    tags: normalizeTags(details.tags),
                    subtasks: kind === TODO_KINDS.task ? mergeSubtasks(todo.subtasks, details.subtasks) : [],
                    completed: kind === TODO_KINDS.task ? todo.completed : false,
                    completedAt: kind === TODO_KINDS.task ? todo.completedAt : null,
                }
                : todo
        );
        saveActiveTodos(newTodos);
        resetTodoView();
        setEditingTodoId(null);
        return { ok: true };
    }

    const selectProjectFilter = (project: string | null) => {
        setActiveProject(currentProject => currentProject === project ? null : project);
    }

    const selectTagFilter = (tag: string | null) => {
        setActiveTag(currentTag => currentTag === tag ? null : tag);
    }

    const clearFacetFilters = () => {
        setActiveProject(null);
        setActiveTag(null);
    }

    const toggleSubtask = (todoId: string, subtaskId: string) => {
        const newTodos = normalizedTodos.map(todo =>
            {
                if (todo.id !== todoId) {
                    return todo;
                }

                if (!isTaskTodo(todo)) {
                    return todo;
                }

                const subtasks = todo.subtasks.map(subtask =>
                    subtask.id === subtaskId
                        ? { ...subtask, completed: !subtask.completed }
                        : subtask
                );
                const allSubtasksCompleted = subtasks.length > 0 &&
                    subtasks.every(subtask => subtask.completed);
                const nextCompleted = allSubtasksCompleted
                    ? true
                    : todo.completed && subtasks.some(subtask => !subtask.completed)
                        ? false
                        : todo.completed;

                return {
                    ...todo,
                    completed: nextCompleted,
                    completedAt: nextCompleted && !todo.completed
                        ? new Date().toISOString()
                        : !nextCompleted
                            ? null
                            : todo.completedAt,
                    subtasks,
                };
            }
        );

        saveActiveTodos(newTodos);
    }

    const moveTodo = (id: string, direction: 'up' | 'down') => {
        const currentIndex = normalizedTodos.findIndex(todo => todo.id === id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= normalizedTodos.length) {
            return;
        }

        const reorderedTodos = [...normalizedTodos];
        const currentTodo = reorderedTodos[currentIndex];
        reorderedTodos[currentIndex] = reorderedTodos[targetIndex];
        reorderedTodos[targetIndex] = currentTodo;

        saveActiveTodos(reindexTodos(reorderedTodos));
    }

    const moveTodoToPosition = (sourceId: string, targetId: string, placement: 'before' | 'after') => {
        const reorderedTodos = reorderTodoToPosition(normalizedTodos, sourceId, targetId, placement);
        const didChangeOrder = reorderedTodos.some((todo, index) =>
            todo.id !== normalizedTodos[index]?.id
        );

        if (didChangeOrder) {
            saveActiveTodos(reorderedTodos);
        }
    }

    const openCreateModal = () => {
        setDetailTodoId(null);
        setEditingTodoId(null);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startViewingTodo = (id: string) => {
        setDetailTodoId(id);
        setEditingTodoId(null);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startEditingTodo = (id: string) => {
        setEditingTodoId(id);
        setDetailTodoId(null);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startDeletingTodo = (id: string) => {
        setDeletingTodoId(id);
        setDetailTodoId(null);
        setEditingTodoId(null);
        setOpenModal(true);
    }

    const confirmDeleteTodo = () => {
        if (!deletingTodoId) {
            return;
        }

        deleteTodo(deletingTodoId);
        setDeletingTodoId(null);
        setDetailTodoId(null);
        setOpenModal(false);
    }

    const undoDeleteTodo = () => {
        if (!recentlyDeletedTodo) {
            return;
        }

        if (normalizedTodos.some(todo => todo.id === recentlyDeletedTodo.id)) {
            setRecentlyDeletedTodo(null);
            return;
        }

        const restoredTodos = [...normalizedTodos];
        const restoredIndex = Math.min(recentlyDeletedTodo.order, restoredTodos.length);
        restoredTodos.splice(restoredIndex, 0, recentlyDeletedTodo);
        saveActiveTodos(reindexTodos(restoredTodos));
        setRecentlyDeletedTodo(null);
    }

    const dismissUndoDelete = () => {
        setRecentlyDeletedTodo(null);
    }

    const closeModal = () => {
        setOpenModal(false);
        setDetailTodoId(null);
        setEditingTodoId(null);
        setDeletingTodoId(null);
    }

    const exportTodos = () => createTodoWorkspaceBackup({
        activeBoardId,
        boards: todoBoards,
        savedViews,
        todos: normalizedTodos,
    });

    const exportCalendar = () => createTodosCalendarExport(normalizedTodos);

    const previewTodosImport = (backup: unknown) => {
        const workspaceResult = readTodoWorkspaceBackup(backup);

        if (workspaceResult.ok) {
            const activeImportedBoard = getActiveTodoBoard(
                workspaceResult.backup.boards,
                workspaceResult.backup.activeBoardId
            );
            const activeImportedTodos = activeImportedBoard?.todos || workspaceResult.backup.todos;
            const activeTodoPreview = analyzeTodosImport(normalizedTodos, { todos: activeImportedTodos });

            return {
                ok: true,
                kind: 'workspace',
                todos: workspaceResult.backup.todos,
                totalCount: workspaceResult.totalTodos,
                newCount: activeTodoPreview.ok ? activeTodoPreview.newCount : activeImportedTodos.length,
                duplicateCount: activeTodoPreview.ok ? activeTodoPreview.duplicateCount : 0,
                boardCount: workspaceResult.backup.boards.length,
                savedViewCount: workspaceResult.backup.savedViews.length,
            };
        }

        if (workspaceResult.isWorkspaceBackup) {
            return workspaceResult;
        }

        const result = analyzeTodosImport(normalizedTodos, backup);

        return result.ok
            ? { ...result, kind: 'todos' }
            : result;
    };

    const previewCalendarImport = (content: unknown) => {
        const calendarResult = readTodosCalendarImport(content);

        if (!calendarResult.ok) {
            return calendarResult;
        }

        const result = analyzeTodosImport(normalizedTodos, { todos: calendarResult.todos });

        return result.ok
            ? { ...result, kind: 'calendar' }
            : result;
    };

    const importTodos = (backup: unknown, options: TodoImportOptions = {}) => {
        const mode = options.mode === 'merge' ? 'merge' : 'replace';
        const workspaceResult = readTodoWorkspaceBackup(backup);

        if (workspaceResult.ok) {
            if (mode === 'merge') {
                return {
                    ok: false,
                    error: 'El backup completo debe restaurarse para conservar tableros y filtros guardados.',
                };
            }

            const activeImportedBoard = getActiveTodoBoard(
                workspaceResult.backup.boards,
                workspaceResult.backup.activeBoardId
            );

            saveBoards(workspaceResult.backup.boards);
            saveActiveBoardId(workspaceResult.backup.activeBoardId);
            saveTodos(activeImportedBoard?.todos || workspaceResult.backup.todos);
            saveSavedViews(workspaceResult.backup.savedViews);
            resetTodoView();

            return {
                ok: true,
                mode: 'workspace',
                count: workspaceResult.totalTodos,
                boardCount: workspaceResult.backup.boards.length,
                savedViewCount: workspaceResult.backup.savedViews.length,
            };
        }

        if (workspaceResult.isWorkspaceBackup) {
            return workspaceResult;
        }

        const result = applyTodosImport(normalizedTodos, backup, mode);

        if (!result.ok) {
            return result;
        }

        saveActiveTodos(result.todos);
        resetTodoView();

        return {
            ok: true,
            count: result.importedCount,
            skippedDuplicates: result.skippedDuplicates,
            totalCount: result.totalCount,
            mode,
        };
    }

    const importCalendar = (content: unknown) => {
        const calendarResult = readTodosCalendarImport(content);

        if (!calendarResult.ok) {
            return calendarResult;
        }

        const result = applyTodosImport(normalizedTodos, { todos: calendarResult.todos }, 'merge');

        if (!result.ok) {
            return result;
        }

        saveActiveTodos(result.todos);
        resetTodoView();

        return {
            ok: true,
            count: result.importedCount,
            skippedDuplicates: result.skippedDuplicates,
            totalCount: result.totalCount,
            mode: 'calendar',
        };
    }

    const states = {
        loading: loading || boardsLoading || activeBoardLoading || savedViewsLoading,
        error: error || boardsError || activeBoardError || savedViewsError,
        searchValue,
        filter,
        todoBoards: todoBoards.map(board => ({
            id: board.id,
            name: board.name,
            totalTodos: normalizeTodos(board.todos).length,
        })),
        activeBoardId,
        activeBoardName: activeBoard?.name || '',
        savedViews,
        totalTodos,
        totalTasks,
        completedTodos,
        pendingTodos,
        overdueTodos: dateCounts[TODO_FILTERS.overdue],
        todayTodos: dateCounts[TODO_FILTERS.today],
        upcomingTodos: dateCounts[TODO_FILTERS.upcoming],
        insights,
        projectOptions: facets.projects,
        tagOptions: facets.tags,
        activeProject,
        activeTag,
        reminderTodos: normalizedTodos,
        visibleTodos,
        visibleTodoGroups,
        openModal,
        detailTodo,
        editingTodo,
        deletingTodo,
        recentlyDeletedTodo,
    }

    const stateUpdaters = {
        setSearchValue,
        setFilter,
        selectProjectFilter,
        selectTagFilter,
        clearFacetFilters,
        selectTodoBoard,
        createBoard,
        renameBoard,
        deleteBoard,
        saveCurrentView,
        applySavedView,
        deleteSavedView,
        completeTodo,
        deleteTodo,
        duplicateTodo,
        toggleSubtask,
        moveTodo,
        moveTodoToPosition,
        openCreateModal,
        startViewingTodo,
        startEditingTodo,
        startDeletingTodo,
        confirmDeleteTodo,
        undoDeleteTodo,
        dismissUndoDelete,
        closeModal,
        addTodo,
        updateTodo,
        exportTodos,
        exportCalendar,
        previewTodosImport,
        previewCalendarImport,
        importTodos,
        importCalendar,
        syncTodos
    }

    return { states, stateUpdaters };
}

export { useTodos }; 
