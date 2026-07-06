import React from 'react';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'TODOS_V1';
const DEFAULT_TODOS = [];

const TODO_FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed',
};

function createTodoId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLegacyTodoId(todo, index) {
    const text = String(todo.text || 'todo')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `legacy-${index}-${text || 'item'}`;
}

function createTodo(text) {
    return {
        id: createTodoId(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
    };
}

function normalizeTodos(todos) {
    if (!Array.isArray(todos)) {
        return [];
    }

    return todos
        .filter(todo => typeof todo.text === 'string' && todo.text.trim())
        .map((todo, index) => ({
            id: todo.id || createLegacyTodoId(todo, index),
            text: todo.text.trim(),
            completed: Boolean(todo.completed),
            createdAt: todo.createdAt || null,
        }));
}

function getVisibleTodos(todos, searchValue, filter) {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return todos.filter(todo => {
        const matchesSearch = todo.text.toLowerCase().includes(normalizedSearch);
        const matchesFilter =
            filter === TODO_FILTERS.completed ? todo.completed :
            filter === TODO_FILTERS.active ? !todo.completed :
            true;

        return matchesSearch && matchesFilter;
    });
}

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

    const addTodo = (text) => {
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

        const newTodos = [...normalizedTodos, createTodo(trimmedText)];
        saveTodos(newTodos);
        setSearchValue('');
        setFilter(TODO_FILTERS.all);
        return { ok: true };
    }

    const updateTodo = (id, text) => {
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
            todo.id === id ? { ...todo, text: trimmedText } : todo
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
        syncTodos
    }

    return { states, stateUpdaters };
}

export { TODO_FILTERS, createTodo, getVisibleTodos, normalizeTodos, useTodos }; 
