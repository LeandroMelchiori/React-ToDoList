type TodoFilter = 'all' | 'active' | 'completed' | 'overdue' | 'today' | 'upcoming';
type TodoDateStatus = 'overdue' | 'today' | 'upcoming';
type TodoPriority = 'low' | 'medium' | 'high';
type TodoGroup = 'overdue' | 'today' | 'upcoming' | 'unscheduled' | 'completed';
type ImportMode = 'merge' | 'replace';

type TodoSubtask = {
    id: string;
    text: string;
    completed: boolean;
};

type Todo = {
    id: string;
    text: string;
    completed: boolean;
    order: number;
    priority: TodoPriority;
    dueDate: string | null;
    project: string | null;
    tags: string[];
    subtasks: TodoSubtask[];
    createdAt: string | null;
    completedAt: string | null;
};

type TodoGroupView = {
    id: TodoGroup;
    title: string;
    todos: Todo[];
};

type TodoInsights = {
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
    completionRate: number;
    completedLast7Days: number;
    overdueTodos: number;
    highPriorityPendingTodos: number;
};

type TodoBackup = {
    version: number;
    exportedAt: string;
    todos: Todo[];
};

type BackupReadResult = { ok: true; todos: Todo[] } | { ok: false; error: string };
type ImportPreviewResult = (
    { ok: true; todos: Todo[]; totalCount: number; newCount: number; duplicateCount: number } |
    { ok: false; error: string }
);
type ImportApplyResult = (
    { ok: true; todos: Todo[]; totalCount: number; importedCount: number; skippedDuplicates: number } |
    { ok: false; error: string }
);
type SplitImportResult = {
    newTodos: Todo[];
    duplicateTodos: Todo[];
};

type TodoDetails = {
    order?: unknown;
    priority?: unknown;
    dueDate?: unknown;
    project?: unknown;
    tags?: unknown;
    subtasks?: unknown;
};

type TodoInput = TodoDetails & {
    id?: unknown;
    text?: unknown;
    completed?: unknown;
    createdAt?: unknown;
    completedAt?: unknown;
};
type TodoInputWithText = TodoInput & { text: string };

const TODO_FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed',
    overdue: 'overdue',
    today: 'today',
    upcoming: 'upcoming',
} as const satisfies Record<TodoFilter, TodoFilter>;

const TODO_PRIORITIES = {
    low: 'low',
    medium: 'medium',
    high: 'high',
} as const satisfies Record<TodoPriority, TodoPriority>;

const TODO_GROUPS = {
    overdue: 'overdue',
    today: 'today',
    upcoming: 'upcoming',
    unscheduled: 'unscheduled',
    completed: 'completed',
} as const satisfies Record<TodoGroup, TodoGroup>;

const TODO_GROUP_LABELS: Record<TodoGroup, string> = {
    [TODO_GROUPS.overdue]: 'Vencidas',
    [TODO_GROUPS.today]: 'Hoy',
    [TODO_GROUPS.upcoming]: 'Proximas',
    [TODO_GROUPS.unscheduled]: 'Sin fecha',
    [TODO_GROUPS.completed]: 'Completadas',
};

const TODO_GROUP_ORDER: TodoGroup[] = [
    TODO_GROUPS.overdue,
    TODO_GROUPS.today,
    TODO_GROUPS.upcoming,
    TODO_GROUPS.unscheduled,
    TODO_GROUPS.completed,
];

const TODO_BACKUP_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizePriority(priority: unknown): TodoPriority {
    const validPriority = Object.values(TODO_PRIORITIES).find(value => value === priority);

    return validPriority || TODO_PRIORITIES.medium;
}

function normalizeDueDate(dueDate: unknown): string | null {
    return typeof dueDate === 'string' && dueDate ? dueDate : null;
}

function normalizeOrder(order: unknown, fallback = 0): number {
    return typeof order === 'number' && Number.isFinite(order) && order >= 0 ? order : fallback;
}

function getTodayDateValue(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getDateValueOffset(dateValue: string, offsetDays: number): string {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);

    return getTodayDateValue(date);
}

function normalizeDateTime(dateValue: unknown): string | null {
    return typeof dateValue === 'string' && dateValue ? dateValue : null;
}

function normalizeProject(project: unknown): string | null {
    return typeof project === 'string' && project.trim() ? project.trim() : null;
}

function normalizeTags(tags: unknown): string[] {
    const rawTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
            ? tags.split(',')
            : [];
    const seenTags = new Set();

    return rawTags
        .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
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

function createTodoId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLegacyTodoId(todo: { text?: unknown }, index: number): string {
    const text = String(todo.text || 'todo')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `legacy-${index}-${text || 'item'}`;
}

function createLegacySubtaskId(subtask: { text?: unknown }, index: number): string {
    const text = String(subtask.text || 'subtask')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `subtask-${index}-${text || 'item'}`;
}

function normalizeSubtasks(subtasks: unknown): TodoSubtask[] {
    const rawSubtasks = Array.isArray(subtasks)
        ? subtasks
        : typeof subtasks === 'string'
            ? subtasks.split(/\r?\n/)
            : [];

    return rawSubtasks
        .map((subtask: unknown, index: number) => {
            const text = typeof subtask === 'string'
                ? subtask.trim()
                : isRecord(subtask) && typeof subtask.text === 'string'
                    ? subtask.text.trim()
                    : '';

            if (!text) {
                return null;
            }

            return {
                id: isRecord(subtask) && typeof subtask.id === 'string' && subtask.id
                    ? subtask.id
                    : createLegacySubtaskId({ text }, index),
                text,
                completed: isRecord(subtask) ? Boolean(subtask.completed) : false,
            };
        })
        .filter((subtask): subtask is TodoSubtask => Boolean(subtask));
}

function mergeSubtasks(existingSubtasks: unknown, nextSubtasks: unknown): TodoSubtask[] {
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

function createTodo(text: string, details: TodoDetails = {}): Todo {
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

function normalizeTodos(todos: unknown): Todo[] {
    if (!Array.isArray(todos)) {
        return [];
    }

    const normalizedTodos = todos
        .filter((todo): todo is TodoInputWithText => isRecord(todo) && typeof todo.text === 'string' && Boolean(todo.text.trim()))
        .map((todo, index) => ({
            id: typeof todo.id === 'string' && todo.id ? todo.id : createLegacyTodoId(todo, index),
            text: todo.text.trim(),
            completed: Boolean(todo.completed),
            order: normalizeOrder(todo.order, index),
            priority: normalizePriority(todo.priority),
            dueDate: normalizeDueDate(todo.dueDate),
            project: normalizeProject(todo.project),
            tags: normalizeTags(todo.tags),
            subtasks: normalizeSubtasks(todo.subtasks),
            createdAt: normalizeDateTime(todo.createdAt),
            completedAt: normalizeDateTime(todo.completedAt),
        }));

    return reindexTodos(normalizedTodos.sort((firstTodo, secondTodo) =>
        firstTodo.order - secondTodo.order
        ));
}

function reindexTodos(todos: Todo[]): Todo[] {
    return todos.map((todo, index) => ({
        ...todo,
        order: index,
    }));
}

function moveTodoToPosition(
    todos: Todo[],
    sourceId: string,
    targetId: string,
    placement: 'before' | 'after' = 'before'
): Todo[] {
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

function getVisibleTodos(
    todos: Todo[],
    searchValue: string,
    filter: TodoFilter,
    todayDate = getTodayDateValue(),
    facetFilters: { project?: unknown; tag?: unknown } = {}
): Todo[] {
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

function mapFacetCounts(values: Array<string | null>): Array<{ name: string; count: number }> {
    const facets = new Map<string, { name: string; count: number }>();

    values.forEach(value => {
        if (!value) {
            return;
        }

        const key = value.toLowerCase();
        const currentFacet = facets.get(key);

        facets.set(key, {
            name: currentFacet?.name || value,
            count: (currentFacet?.count || 0) + 1,
        });
    });

    return [...facets.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function getTodoFacets(todos: Todo[]): {
    projects: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
} {
    return {
        projects: mapFacetCounts(todos.map(todo => todo.project)),
        tags: mapFacetCounts(todos.flatMap(todo => todo.tags)),
    };
}

function getTodoDateStatus(todo: Todo, todayDate = getTodayDateValue()): TodoDateStatus | null {
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

function getTodosDateCounts(
    todos: Todo[],
    todayDate = getTodayDateValue()
): Record<'overdue' | 'today' | 'upcoming', number> {
    return todos.reduce<Record<TodoDateStatus, number>>((counts, todo) => {
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

function getTodoInsights(todos: Todo[], todayDate = getTodayDateValue()): TodoInsights {
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

function getTodoGroupId(todo: Todo, todayDate: string): TodoGroup {
    if (todo.completed) {
        return TODO_GROUPS.completed;
    }

    return getTodoDateStatus(todo, todayDate) || TODO_GROUPS.unscheduled;
}

function getTodoGroups(todos: Todo[], todayDate = getTodayDateValue()): TodoGroupView[] {
    const groupsById = new Map<TodoGroup, TodoGroupView>(TODO_GROUP_ORDER.map(groupId => [
        groupId,
        {
            id: groupId,
            title: TODO_GROUP_LABELS[groupId],
            todos: [],
        },
    ]));

    todos.forEach(todo => {
        groupsById.get(getTodoGroupId(todo, todayDate))?.todos.push(todo);
    });

    return TODO_GROUP_ORDER
        .map(groupId => groupsById.get(groupId))
        .filter((group): group is TodoGroupView => Boolean(group && group.todos.length > 0));
}

function createTodosBackup(todos: Todo[]): TodoBackup {
    return {
        version: TODO_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        todos: normalizeTodos(todos),
    };
}

function readTodosBackup(backup: unknown): BackupReadResult {
    const backupTodos = Array.isArray(backup)
        ? backup
        : isRecord(backup)
            ? backup.todos
            : null;

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

function getTodoDuplicateKeys(todo: Todo): string[] {
    return [
        todo.id ? `id:${todo.id}` : null,
        `text:${todo.text.toLowerCase()}`,
    ].filter((key): key is string => Boolean(key));
}

function splitImportedTodos(existingTodos: Todo[], importedTodos: Todo[]): SplitImportResult {
    const seenKeys = new Set(normalizeTodos(existingTodos).flatMap(getTodoDuplicateKeys));

    return normalizeTodos(importedTodos).reduce<SplitImportResult>((result, todo) => {
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

function analyzeTodosImport(existingTodos: Todo[], backup: unknown): ImportPreviewResult {
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

function applyTodosImport(existingTodos: Todo[], backup: unknown, mode: ImportMode = 'replace'): ImportApplyResult {
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

export type {
    ImportMode,
    Todo,
    TodoBackup,
    TodoDetails,
    TodoFilter,
    TodoGroupView,
    TodoInsights,
    TodoPriority,
    TodoSubtask,
};
