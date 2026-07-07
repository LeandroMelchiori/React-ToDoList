const TODO_FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed',
    overdue: 'overdue',
    today: 'today',
    upcoming: 'upcoming',
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

function getTodayDateValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function normalizeProject(project) {
    return typeof project === 'string' && project.trim() ? project.trim() : null;
}

function normalizeTags(tags) {
    const rawTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
            ? tags.split(',')
            : [];
    const seenTags = new Set();

    return rawTags
        .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(tag => {
            const normalizedTag = tag.toLowerCase();

            if (!normalizedTag || seenTags.has(normalizedTag)) {
                return false;
            }

            seenTags.add(normalizedTag);
            return true;
        })
        .slice(0, 8);
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

function createLegacySubtaskId(subtask, index) {
    const text = String(subtask.text || 'subtask')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `subtask-${index}-${text || 'item'}`;
}

function normalizeSubtasks(subtasks) {
    const rawSubtasks = Array.isArray(subtasks)
        ? subtasks
        : typeof subtasks === 'string'
            ? subtasks.split(/\r?\n/)
            : [];

    return rawSubtasks
        .map((subtask, index) => {
            const text = typeof subtask === 'string'
                ? subtask.trim()
                : typeof subtask?.text === 'string'
                    ? subtask.text.trim()
                    : '';

            if (!text) {
                return null;
            }

            return {
                id: typeof subtask === 'object' && subtask?.id
                    ? subtask.id
                    : createLegacySubtaskId({ text }, index),
                text,
                completed: typeof subtask === 'object' ? Boolean(subtask.completed) : false,
            };
        })
        .filter(Boolean);
}

function mergeSubtasks(existingSubtasks, nextSubtasks) {
    const normalizedExistingSubtasks = normalizeSubtasks(existingSubtasks);

    return normalizeSubtasks(nextSubtasks).map(subtask => {
        const existingSubtask = normalizedExistingSubtasks.find(item =>
            item.text.toLowerCase() === subtask.text.toLowerCase()
        );

        if (!existingSubtask) {
            return subtask;
        }

        return {
            ...subtask,
            id: existingSubtask.id,
            completed: existingSubtask.completed,
        };
    });
}

function createTodo(text, details = {}) {
    return {
        id: createTodoId(),
        text: text.trim(),
        completed: false,
        priority: normalizePriority(details.priority),
        dueDate: normalizeDueDate(details.dueDate),
        project: normalizeProject(details.project),
        tags: normalizeTags(details.tags),
        subtasks: normalizeSubtasks(details.subtasks),
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
            project: normalizeProject(todo.project),
            tags: normalizeTags(todo.tags),
            subtasks: normalizeSubtasks(todo.subtasks),
            createdAt: todo.createdAt || null,
        }));
}

function getVisibleTodos(todos, searchValue, filter, todayDate = getTodayDateValue()) {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return todos.filter(todo => {
        const searchableText = [
            todo.text,
            todo.project,
            ...(Array.isArray(todo.tags) ? todo.tags : []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const matchesSearch = searchableText.includes(normalizedSearch);
        const dateStatus = getTodoDateStatus(todo, todayDate);
        const matchesFilter =
            filter === TODO_FILTERS.completed ? todo.completed :
            filter === TODO_FILTERS.active ? !todo.completed :
            filter === TODO_FILTERS.overdue ? dateStatus === TODO_FILTERS.overdue :
            filter === TODO_FILTERS.today ? dateStatus === TODO_FILTERS.today :
            filter === TODO_FILTERS.upcoming ? dateStatus === TODO_FILTERS.upcoming :
            true;

        return matchesSearch && matchesFilter;
    });
}

function getTodoDateStatus(todo, todayDate = getTodayDateValue()) {
    if (todo.completed || !todo.dueDate) {
        return null;
    }

    if (todo.dueDate < todayDate) {
        return TODO_FILTERS.overdue;
    }

    if (todo.dueDate === todayDate) {
        return TODO_FILTERS.today;
    }

    return TODO_FILTERS.upcoming;
}

function getTodosDateCounts(todos, todayDate = getTodayDateValue()) {
    return todos.reduce((counts, todo) => {
        const dateStatus = getTodoDateStatus(todo, todayDate);

        if (dateStatus) {
            counts[dateStatus] += 1;
        }

        return counts;
    }, {
        [TODO_FILTERS.overdue]: 0,
        [TODO_FILTERS.today]: 0,
        [TODO_FILTERS.upcoming]: 0,
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
    getTodayDateValue,
    getTodoDateStatus,
    getTodosDateCounts,
    getVisibleTodos,
    mergeSubtasks,
    normalizeDueDate,
    normalizePriority,
    normalizeProject,
    normalizeSubtasks,
    normalizeTags,
    normalizeTodos,
    readTodosBackup,
};
