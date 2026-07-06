const TODO_FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed',
};

const TODO_PRIORITIES = {
    low: 'low',
    medium: 'medium',
    high: 'high',
};

const TODO_BACKUP_VERSION = 1;

function normalizePriority(priority) {
    return Object.values(TODO_PRIORITIES).includes(priority)
        ? priority
        : TODO_PRIORITIES.medium;
}

function normalizeDueDate(dueDate) {
    return typeof dueDate === 'string' && dueDate ? dueDate : null;
}

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

function createTodo(text, details = {}) {
    return {
        id: createTodoId(),
        text: text.trim(),
        completed: false,
        priority: normalizePriority(details.priority),
        dueDate: normalizeDueDate(details.dueDate),
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
            priority: normalizePriority(todo.priority),
            dueDate: normalizeDueDate(todo.dueDate),
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

function createTodosBackup(todos) {
    return {
        version: TODO_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        todos: normalizeTodos(todos),
    };
}

function readTodosBackup(backup) {
    const backupTodos = Array.isArray(backup) ? backup : backup?.todos;

    if (!Array.isArray(backupTodos)) {
        return {
            ok: false,
            error: 'El archivo no contiene una lista de tareas valida.',
        };
    }

    return {
        ok: true,
        todos: normalizeTodos(backupTodos),
    };
}

export {
    TODO_FILTERS,
    TODO_PRIORITIES,
    createTodosBackup,
    createTodo,
    getVisibleTodos,
    normalizeDueDate,
    normalizePriority,
    normalizeTodos,
    readTodosBackup,
};
