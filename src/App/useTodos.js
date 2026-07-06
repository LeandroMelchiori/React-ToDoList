import React from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
    TODO_FILTERS,
    createTodosBackup,
    createTodo,
    getVisibleTodos,
    normalizeDueDate,
    normalizePriority,
    normalizeTodos,
    readTodosBackup,
} from './todoModel';

const STORAGE_KEY = 'TODOS_V1';
const DEFAULT_TODOS = [];

function useTodos() {
    const { 
        item: todos,
        saveItem: saveTodos,
        synchronizeItem: syncTodos,
        loading,
        error
        } = useLocalStorage(STORAGE_KEY, DEFAULT_TODOS, Array.isArray);
  
    const [searchValue, setSearchValue] =
     React.useState('');

    const [filter, setFilter] =
     React.useState(TODO_FILTERS.all);

    const [openModal, setOpenModal] =
     React.useState(false);

    const [editingTodoId, setEditingTodoId] =
     React.useState(null);

    const [deletingTodoId, setDeletingTodoId] =
     React.useState(null);

    const normalizedTodos = normalizeTodos(todos);
    const editingTodo = normalizedTodos.find(todo => todo.id === editingTodoId) || null;
    const deletingTodo = normalizedTodos.find(todo => todo.id === deletingTodoId) || null;

    const completedTodos = normalizedTodos.filter(todo => todo.completed).length;
    const totalTodos = normalizedTodos.length;
    const pendingTodos = totalTodos - completedTodos;

    const visibleTodos = getVisibleTodos(normalizedTodos, searchValue, filter);

    const completeTodo = (id) => {
        const newTodos = normalizedTodos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos(newTodos);
    }

    const deleteTodo = (id) => {
        const newTodos = normalizedTodos.filter(todo => todo.id !== id);
        saveTodos(newTodos)
    }

    const addTodo = (text, details = {}) => {
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

        const newTodos = [...normalizedTodos, createTodo(trimmedText, details)];
        saveTodos(newTodos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);
        return { ok: true };
    }

    const updateTodo = (id, text, details = {}) => {
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
                }
                : todo
        );
        saveTodos(newTodos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);
        setEditingTodoId(null);
        return { ok: true };
    }

    const openCreateModal = () => {
        setEditingTodoId(null);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startEditingTodo = (id) => {
        setEditingTodoId(id);
        setDeletingTodoId(null);
        setOpenModal(true);
    }

    const startDeletingTodo = (id) => {
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

    const closeModal = () => {
        setOpenModal(false);
        setEditingTodoId(null);
        setDeletingTodoId(null);
    }

    const exportTodos = () => createTodosBackup(normalizedTodos);

    const importTodos = (backup) => {
        const result = readTodosBackup(backup);

        if (!result.ok) {
            return result;
        }

        saveTodos(result.todos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);

        return {
            ok: true,
            count: result.todos.length,
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
        visibleTodos,
        openModal,
        editingTodo,
        deletingTodo,
    }

    const stateUpdaters = {
        setSearchValue,
        setFilter,
        completeTodo,
        deleteTodo,
        openCreateModal,
        startEditingTodo,
        startDeletingTodo,
        confirmDeleteTodo,
        closeModal,
        addTodo,
        updateTodo,
        exportTodos,
        importTodos,
        syncTodos
    }

    return { states, stateUpdaters };
}

export { useTodos }; 
