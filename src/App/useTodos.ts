import React from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
    TODO_FILTERS,
    analyzeTodosImport,
    applyTodosImport,
    createTodosBackup,
    createTodo,
    getTodoFacets,
    getTodoGroups,
    getTodoInsights,
    getTodosDateCounts,
    getVisibleTodos,
    mergeSubtasks,
    moveTodoToPosition as reorderTodoToPosition,
    normalizeDueDate,
    normalizePriority,
    normalizeProject,
    normalizeTags,
    normalizeTodos,
    reindexTodos,
} from './todoModel';
import type {
    ImportMode,
    Todo,
    TodoDetails,
    TodoFilter,
} from './todoModel';

const STORAGE_KEY = 'TODOS_V1';
const DEFAULT_TODOS: Todo[] = [];

type TodoActionResult = { ok: true } | { ok: false; error: string };
type TodoImportOptions = { mode?: ImportMode };

function isTodoList(item: unknown): boolean {
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

    const [recentlyDeletedTodo, setRecentlyDeletedTodo] =
     React.useState<Todo | null>(null);

    const normalizedTodos = normalizeTodos(todos);
    const editingTodo = normalizedTodos.find(todo => todo.id === editingTodoId) || null;
    const deletingTodo = normalizedTodos.find(todo => todo.id === deletingTodoId) || null;

    const completedTodos = normalizedTodos.filter(todo => todo.completed).length;
    const totalTodos = normalizedTodos.length;
    const pendingTodos = totalTodos - completedTodos;
    const dateCounts = getTodosDateCounts(normalizedTodos);
    const insights = getTodoInsights(normalizedTodos);
    const facets = getTodoFacets(normalizedTodos);

    const visibleTodos = getVisibleTodos(normalizedTodos, searchValue, filter, undefined, {
        project: activeProject,
        tag: activeTag,
    });
    const visibleTodoGroups = getTodoGroups(visibleTodos);

    const completeTodo = (id: string) => {
        const newTodos = normalizedTodos.map(todo =>
            todo.id === id
                ? {
                    ...todo,
                    completed: !todo.completed,
                    completedAt: todo.completed ? null : new Date().toISOString(),
                }
                : todo
        );
        saveTodos(newTodos);
    }

    const deleteTodo = (id: string) => {
        const todoToDelete = normalizedTodos.find(todo => todo.id === id);

        if (!todoToDelete) {
            return;
        }

        const newTodos = reindexTodos(normalizedTodos.filter(todo => todo.id !== id));
        saveTodos(newTodos);
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

        const newTodos = [
            ...normalizedTodos,
            createTodo(trimmedText, { ...details, order: normalizedTodos.length }),
        ];
        saveTodos(newTodos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);
        clearFacetFilters();
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

        const newTodos = normalizedTodos.map(todo =>
            todo.id === id
                ? {
                    ...todo,
                    text: trimmedText,
                    priority: normalizePriority(details.priority),
                    dueDate: normalizeDueDate(details.dueDate),
                    project: normalizeProject(details.project),
                    tags: normalizeTags(details.tags),
                    subtasks: mergeSubtasks(todo.subtasks, details.subtasks),
                }
                : todo
        );
        saveTodos(newTodos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);
        clearFacetFilters();
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
            todo.id === todoId
                ? {
                    ...todo,
                    subtasks: todo.subtasks.map(subtask =>
                        subtask.id === subtaskId
                            ? { ...subtask, completed: !subtask.completed }
                            : subtask
                    ),
                }
                : todo
        );

        saveTodos(newTodos);
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

        saveTodos(reindexTodos(reorderedTodos));
    }

    const moveTodoToPosition = (sourceId: string, targetId: string, placement: 'before' | 'after') => {
        const reorderedTodos = reorderTodoToPosition(normalizedTodos, sourceId, targetId, placement);
        const didChangeOrder = reorderedTodos.some((todo, index) =>
            todo.id !== normalizedTodos[index]?.id
        );

        if (didChangeOrder) {
            saveTodos(reorderedTodos);
        }
    }

    const openCreateModal = () => {
        setEditingTodoId(null);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startEditingTodo = (id: string) => {
        setEditingTodoId(id);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startDeletingTodo = (id: string) => {
        setDeletingTodoId(id);
        setEditingTodoId(null);
        setOpenModal(true);
    }

    const confirmDeleteTodo = () => {
        if (!deletingTodoId) {
            return;
        }

        deleteTodo(deletingTodoId);
        setDeletingTodoId(null);
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
        saveTodos(reindexTodos(restoredTodos));
        setRecentlyDeletedTodo(null);
    }

    const dismissUndoDelete = () => {
        setRecentlyDeletedTodo(null);
    }

    const closeModal = () => {
        setOpenModal(false);
        setEditingTodoId(null);
        setDeletingTodoId(null);
    }

    const exportTodos = () => createTodosBackup(normalizedTodos);

    const previewTodosImport = (backup: unknown) => analyzeTodosImport(normalizedTodos, backup);

    const importTodos = (backup: unknown, options: TodoImportOptions = {}) => {
        const mode = options.mode === 'merge' ? 'merge' : 'replace';
        const result = applyTodosImport(normalizedTodos, backup, mode);

        if (!result.ok) {
            return result;
        }

        saveTodos(result.todos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);
        clearFacetFilters();

        return {
            ok: true,
            count: result.importedCount,
            skippedDuplicates: result.skippedDuplicates,
            totalCount: result.totalCount,
            mode,
        };
    }

    const states = {
        loading,
        error,
        searchValue,
        filter,
        totalTodos,
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
        visibleTodos,
        visibleTodoGroups,
        openModal,
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
        completeTodo,
        deleteTodo,
        toggleSubtask,
        moveTodo,
        moveTodoToPosition,
        openCreateModal,
        startEditingTodo,
        startDeletingTodo,
        confirmDeleteTodo,
        undoDeleteTodo,
        dismissUndoDelete,
        closeModal,
        addTodo,
        updateTodo,
        exportTodos,
        previewTodosImport,
        importTodos,
        syncTodos
    }

    return { states, stateUpdaters };
}

export { useTodos }; 
