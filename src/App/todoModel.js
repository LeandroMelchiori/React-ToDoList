// @ts-check

/**
 * @typedef {'all' | 'active' | 'completed' | 'overdue' | 'today' | 'upcoming'} TodoFilter
 * @typedef {'low' | 'medium' | 'high'} TodoPriority
 * @typedef {'overdue' | 'today' | 'upcoming' | 'unscheduled' | 'completed'} TodoGroup
 * @typedef {{ id: string, text: string, completed: boolean }} TodoSubtask
 * @typedef {{
 *   id: string,
 *   text: string,
 *   completed: boolean,
 *   order: number,
 *   priority: TodoPriority,
 *   dueDate: string | null,
 *   project: string | null,
 *   tags: string[],
 *   subtasks: TodoSubtask[],
 *   createdAt: string | null,
 *   completedAt: string | null,
 * }} Todo
 * @typedef {{ id: TodoGroup, title: string, todos: Todo[] }} TodoGroupView
 * @typedef {{
 *   totalTodos: number,
 *   completedTodos: number,
 *   pendingTodos: number,
 *   completionRate: number,
 *   completedLast7Days: number,
 *   overdueTodos: number,
 *   highPriorityPendingTodos: number,
 * }} TodoInsights
 */

/** @type {{ all: TodoFilter, active: TodoFilter, completed: TodoFilter, overdue: TodoFilter, today: TodoFilter, upcoming: TodoFilter }} */
const TODO_FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed',
    overdue: 'overdue',
    today: 'today',
    upcoming: 'upcoming',
};

/** @type {{ low: TodoPriority, medium: TodoPriority, high: TodoPriority }} */
const TODO_PRIORITIES = {
    low: 'low',
    medium: 'medium',
    high: 'high',
};

/** @type {{ overdue: TodoGroup, today: TodoGroup, upcoming: TodoGroup, unscheduled: TodoGroup, completed: TodoGroup }} */
const TODO_GROUPS = {
    overdue: 'overdue',
    today: 'today',
    upcoming: 'upcoming',
    unscheduled: 'unscheduled',
    completed: 'completed',
};

/** @type {Record<TodoGroup, string>} */
const TODO_GROUP_LABELS = {
    [TODO_GROUPS.overdue]: 'Vencidas',
    [TODO_GROUPS.today]: 'Hoy',
    [TODO_GROUPS.upcoming]: 'Proximas',
    [TODO_GROUPS.unscheduled]: 'Sin fecha',
    [TODO_GROUPS.completed]: 'Completadas',
};

/** @type {TodoGroup[]} */
const TODO_GROUP_ORDER = [
    TODO_GROUPS.overdue,
    TODO_GROUPS.today,
    TODO_GROUPS.upcoming,
    TODO_GROUPS.unscheduled,
    TODO_GROUPS.completed,
];

const TODO_BACKUP_VERSION = 1;

/**
 * @param {unknown} priority
 * @returns {TodoPriority}
 */
function normalizePriority(priority) {
    const validPriority = Object.values(TODO_PRIORITIES).find(value => value === priority);

    return validPriority || TODO_PRIORITIES.medium;
}

/**
 * @param {unknown} dueDate
 * @returns {string | null}
 */
function normalizeDueDate(dueDate) {
    return typeof dueDate === 'string' && dueDate ? dueDate : null;
}

/**
 * @param {unknown} order
 * @param {number} [fallback]
 * @returns {number}
 */
function normalizeOrder(order, fallback = 0) {
    return typeof order === 'number' && Number.isFinite(order) && order >= 0 ? order : fallback;
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
function getTodayDateValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * @param {string} dateValue
 * @param {number} offsetDays
 * @returns {string}
 */
function getDateValueOffset(dateValue, offsetDays) {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);

    return getTodayDateValue(date);
}

/**
 * @param {unknown} dateValue
 * @returns {string | null}
 */
function normalizeDateTime(dateValue) {
    return typeof dateValue === 'string' && dateValue ? dateValue : null;
}

/**
 * @param {unknown} project
 * @returns {string | null}
 */
function normalizeProject(project) {
    return typeof project === 'string' && project.trim() ? project.trim() : null;
}

/**
 * @param {unknown} tags
 * @returns {string[]}
 */
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

/**
 * @returns {string}
 */
function createTodoId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * @param {{ text?: unknown }} todo
 * @param {number} index
 * @returns {string}
 */
function createLegacyTodoId(todo, index) {
    const text = String(todo.text || 'todo')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `legacy-${index}-${text || 'item'}`;
}

/**
 * @param {{ text?: unknown }} subtask
 * @param {number} index
 * @returns {string}
 */
function createLegacySubtaskId(subtask, index) {
    const text = String(subtask.text || 'subtask')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `subtask-${index}-${text || 'item'}`;
}

/**
 * @param {unknown} subtasks
 * @returns {TodoSubtask[]}
 */
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

/**
 * @param {unknown} existingSubtasks
 * @param {unknown} nextSubtasks
 * @returns {TodoSubtask[]}
 */
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

/**
 * @param {string} text
 * @param {object} [details]
 * @returns {Todo}
 */
function createTodo(text, details = {}) {
    return {
        id: createTodoId(),
        text: text.trim(),
        completed: false,
        order: normalizeOrder('order' in details ? details.order : undefined),
        priority: normalizePriority('priority' in details ? details.priority : undefined),
        dueDate: normalizeDueDate('dueDate' in details ? details.dueDate : undefined),
        project: normalizeProject('project' in details ? details.project : undefined),
        tags: normalizeTags('tags' in details ? details.tags : undefined),
        subtasks: normalizeSubtasks('subtasks' in details ? details.subtasks : undefined),
        createdAt: new Date().toISOString(),
        completedAt: null,
    };
}

/**
 * @param {unknown} todos
 * @returns {Todo[]}
 */
function normalizeTodos(todos) {
    if (!Array.isArray(todos)) {
        return [];
    }

    const normalizedTodos = todos
        .filter(todo => typeof todo.text === 'string' && todo.text.trim())
        .map((todo, index) => ({
            id: todo.id || createLegacyTodoId(todo, index),
            text: todo.text.trim(),
            completed: Boolean(todo.completed),
            order: normalizeOrder(todo.order, index),
            priority: normalizePriority(todo.priority),
            dueDate: normalizeDueDate(todo.dueDate),
            project: normalizeProject(todo.project),
            tags: normalizeTags(todo.tags),
            subtasks: normalizeSubtasks(todo.subtasks),
            createdAt: todo.createdAt || null,
            completedAt: normalizeDateTime(todo.completedAt),
        }));

    return reindexTodos(normalizedTodos.sort((firstTodo, secondTodo) =>
        firstTodo.order - secondTodo.order
        ));
}

/**
 * @param {Todo[]} todos
 * @returns {Todo[]}
 */
function reindexTodos(todos) {
    return todos.map((todo, index) => ({
        ...todo,
        order: index,
    }));
}

/**
 * @param {Todo[]} todos
 * @param {string} sourceId
 * @param {string} targetId
 * @param {'before' | 'after'} [placement]
 * @returns {Todo[]}
 */
function moveTodoToPosition(todos, sourceId, targetId, placement = 'before') {
    const normalizedTodos = normalizeTodos(todos);

    if (!sourceId || !targetId || sourceId === targetId) {
        return normalizedTodos;
    }

    const sourceIndex = normalizedTodos.findIndex(todo => todo.id === sourceId);
    const targetIndex = normalizedTodos.findIndex(todo => todo.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
        return normalizedTodos;
    }

    const reorderedTodos = [...normalizedTodos];
    const [sourceTodo] = reorderedTodos.splice(sourceIndex, 1);
    const nextTargetIndex = reorderedTodos.findIndex(todo => todo.id === targetId);
    const insertIndex = placement === 'after' ? nextTargetIndex + 1 : nextTargetIndex;

    reorderedTodos.splice(insertIndex, 0, sourceTodo);

    return reindexTodos(reorderedTodos);
}

/**
 * @param {Todo[]} todos
 * @param {string} searchValue
 * @param {TodoFilter} filter
 * @param {string} [todayDate]
 * @param {{ project?: unknown, tag?: unknown }} [facetFilters]
 * @returns {Todo[]}
 */
function getVisibleTodos(todos, searchValue, filter, todayDate = getTodayDateValue(), facetFilters = {}) {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const projectFilter = normalizeProject(facetFilters.project);
    const tagFilter = normalizeProject(facetFilters.tag);

    return todos.filter(todo => {
        const todoTags = Array.isArray(todo.tags) ? todo.tags : [];
        const searchableText = [
            todo.text,
            todo.project,
            ...todoTags,
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
        const matchesProject = !projectFilter ||
            todo.project?.toLowerCase() === projectFilter.toLowerCase();
        const matchesTag = !tagFilter ||
            todoTags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase());

        return matchesSearch && matchesFilter && matchesProject && matchesTag;
    });
}

/**
 * @param {(string | null)[]} values
 * @returns {{ name: string, count: number }[]}
 */
function mapFacetCounts(values) {
    const facets = new Map();

    values.filter(Boolean).forEach(value => {
        const key = value.toLowerCase();
        const currentFacet = facets.get(key);

        facets.set(key, {
            name: currentFacet?.name || value,
            count: (currentFacet?.count || 0) + 1,
        });
    });

    return [...facets.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {Todo[]} todos
 * @returns {{ projects: { name: string, count: number }[], tags: { name: string, count: number }[] }}
 */
function getTodoFacets(todos) {
    return {
        projects: mapFacetCounts(todos.map(todo => todo.project)),
        tags: mapFacetCounts(todos.flatMap(todo => todo.tags)),
    };
}

/**
 * @param {Todo} todo
 * @param {string} [todayDate]
 * @returns {TodoFilter | null}
 */
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

/**
 * @param {Todo[]} todos
 * @param {string} [todayDate]
 * @returns {Record<'overdue' | 'today' | 'upcoming', number>}
 */
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

/**
 * @param {Todo[]} todos
 * @param {string} [todayDate]
 * @returns {TodoInsights}
 */
function getTodoInsights(todos, todayDate = getTodayDateValue()) {
    const normalizedTodos = normalizeTodos(todos);
    const totalTodos = normalizedTodos.length;
    const completedTodos = normalizedTodos.filter(todo => todo.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const dateCounts = getTodosDateCounts(normalizedTodos, todayDate);
    const sevenDaysAgo = getDateValueOffset(todayDate, -6);
    const completedLast7Days = normalizedTodos.filter(todo => {
        const completedDate = todo.completedAt?.slice(0, 10);

        return completedDate && completedDate >= sevenDaysAgo && completedDate <= todayDate;
    }).length;

    return {
        totalTodos,
        completedTodos,
        pendingTodos,
        completionRate: totalTodos ? Math.round((completedTodos / totalTodos) * 100) : 0,
        completedLast7Days,
        overdueTodos: dateCounts[TODO_FILTERS.overdue],
        highPriorityPendingTodos: normalizedTodos.filter(todo =>
            !todo.completed && todo.priority === TODO_PRIORITIES.high
        ).length,
    };
}

/**
 * @param {Todo} todo
 * @param {string} todayDate
 * @returns {TodoGroup}
 */
function getTodoGroupId(todo, todayDate) {
    if (todo.completed) {
        return TODO_GROUPS.completed;
    }

    return getTodoDateStatus(todo, todayDate) || TODO_GROUPS.unscheduled;
}

/**
 * @param {Todo[]} todos
 * @param {string} [todayDate]
 * @returns {TodoGroupView[]}
 */
function getTodoGroups(todos, todayDate = getTodayDateValue()) {
    const groupsById = new Map(TODO_GROUP_ORDER.map(groupId => [
        groupId,
        {
            id: groupId,
            title: TODO_GROUP_LABELS[groupId],
            todos: [],
        },
    ]));

    todos.forEach(todo => {
        groupsById.get(getTodoGroupId(todo, todayDate)).todos.push(todo);
    });

    return TODO_GROUP_ORDER
        .map(groupId => groupsById.get(groupId))
        .filter(group => group.todos.length > 0);
}

/**
 * @param {Todo[]} todos
 * @returns {{ version: number, exportedAt: string, todos: Todo[] }}
 */
function createTodosBackup(todos) {
    return {
        version: TODO_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        todos: normalizeTodos(todos),
    };
}

/**
 * @param {unknown} backup
 * @returns {{ ok: true, todos: Todo[] } | { ok: false, error: string }}
 */
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

/**
 * @param {Todo} todo
 * @returns {string[]}
 */
function getTodoDuplicateKeys(todo) {
    return [
        todo.id ? `id:${todo.id}` : null,
        `text:${todo.text.toLowerCase()}`,
    ].filter(Boolean);
}

/**
 * @param {Todo[]} existingTodos
 * @param {Todo[]} importedTodos
 * @returns {{ newTodos: Todo[], duplicateTodos: Todo[] }}
 */
function splitImportedTodos(existingTodos, importedTodos) {
    const seenKeys = new Set(normalizeTodos(existingTodos).flatMap(getTodoDuplicateKeys));

    return normalizeTodos(importedTodos).reduce((result, todo) => {
        const todoKeys = getTodoDuplicateKeys(todo);
        const isDuplicate = todoKeys.some(key => seenKeys.has(key));

        todoKeys.forEach(key => seenKeys.add(key));

        if (isDuplicate) {
            result.duplicateTodos.push(todo);
        } else {
            result.newTodos.push(todo);
        }

        return result;
    }, {
        newTodos: [],
        duplicateTodos: [],
    });
}

/**
 * @param {Todo[]} existingTodos
 * @param {unknown} backup
 * @returns {{ ok: true, todos: Todo[], totalCount: number, newCount: number, duplicateCount: number } | { ok: false, error: string }}
 */
function analyzeTodosImport(existingTodos, backup) {
    const result = readTodosBackup(backup);

    if (!result.ok) {
        return result;
    }

    const { newTodos, duplicateTodos } = splitImportedTodos(existingTodos, result.todos);

    return {
        ok: true,
        todos: result.todos,
        totalCount: result.todos.length,
        newCount: newTodos.length,
        duplicateCount: duplicateTodos.length,
    };
}

/**
 * @param {Todo[]} existingTodos
 * @param {unknown} backup
 * @param {'merge' | 'replace'} [mode]
 * @returns {{ ok: true, todos: Todo[], totalCount: number, importedCount: number, skippedDuplicates: number } | { ok: false, error: string }}
 */
function applyTodosImport(existingTodos, backup, mode = 'replace') {
    const result = readTodosBackup(backup);

    if (!result.ok) {
        return result;
    }

    if (mode !== 'merge') {
        return {
            ok: true,
            todos: result.todos,
            totalCount: result.todos.length,
            importedCount: result.todos.length,
            skippedDuplicates: 0,
        };
    }

    const normalizedExistingTodos = normalizeTodos(existingTodos);
    const { newTodos, duplicateTodos } = splitImportedTodos(normalizedExistingTodos, result.todos);

    return {
        ok: true,
        todos: reindexTodos([...normalizedExistingTodos, ...newTodos]),
        totalCount: result.todos.length,
        importedCount: newTodos.length,
        skippedDuplicates: duplicateTodos.length,
    };
}

export {
    TODO_FILTERS,
    TODO_GROUPS,
    TODO_PRIORITIES,
    analyzeTodosImport,
    applyTodosImport,
    createTodosBackup,
    createTodo,
    getTodayDateValue,
    getTodoFacets,
    getTodoDateStatus,
    getTodoGroups,
    getTodoInsights,
    getTodosDateCounts,
    getVisibleTodos,
    mergeSubtasks,
    moveTodoToPosition,
    normalizeDueDate,
    normalizeOrder,
    normalizePriority,
    normalizeProject,
    normalizeSubtasks,
    normalizeTags,
    normalizeTodos,
    readTodosBackup,
    reindexTodos,
};
