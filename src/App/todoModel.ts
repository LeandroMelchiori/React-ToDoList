type TodoFilter = 'all' | 'active' | 'completed' | 'overdue' | 'today' | 'upcoming';
type TodoDateStatus = 'overdue' | 'today' | 'upcoming';
type TodoPriority = 'low' | 'medium' | 'high';
type TodoDateType = 'due' | 'event' | 'period';
type TodoRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type TodoKind = 'task' | 'event' | 'schedule' | 'period';
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
    kind: TodoKind;
    description: string | null;
    completed: boolean;
    order: number;
    priority: TodoPriority;
    dateType: TodoDateType;
    dueDate: string | null;
    startDate: string | null;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    recurrence: TodoRecurrence;
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

type TodoCalendarExport = {
    content: string;
    count: number;
};

type BackupReadResult = { ok: true; todos: Todo[] } | { ok: false; error: string };
type CalendarImportReadResult = { ok: true; todos: Todo[]; totalCount: number } | { ok: false; error: string };
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

type IcsProperty = {
    name: string;
    params: Record<string, string>;
    value: string;
};

type IcsDateValue = {
    date: string;
    isDateOnly: boolean;
    time: string | null;
};

type IcsRecurrence = {
    recurrence: TodoRecurrence;
    untilDate: string | null;
};

type TodoDetails = {
    order?: unknown;
    kind?: unknown;
    description?: unknown;
    priority?: unknown;
    dateType?: unknown;
    dueDate?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    startTime?: unknown;
    endTime?: unknown;
    recurrence?: unknown;
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

const TODO_DATE_TYPES = {
    due: 'due',
    event: 'event',
    period: 'period',
} as const satisfies Record<TodoDateType, TodoDateType>;

const TODO_RECURRENCES = {
    none: 'none',
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
    yearly: 'yearly',
} as const satisfies Record<TodoRecurrence, TodoRecurrence>;

const TODO_KINDS = {
    task: 'task',
    event: 'event',
    schedule: 'schedule',
    period: 'period',
} as const satisfies Record<TodoKind, TodoKind>;

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
const UNSUPPORTED_BACKUP_VERSION_ERROR = 'El backup usa una version de datos mas nueva que esta app.';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizePriority(priority: unknown): TodoPriority {
    const validPriority = Object.values(TODO_PRIORITIES).find(value => value === priority);

    return validPriority || TODO_PRIORITIES.medium;
}

function normalizeDescription(description: unknown): string | null {
    return typeof description === 'string' && description.trim()
        ? description.trim()
        : null;
}

function normalizeDateType(dateType: unknown): TodoDateType {
    const validDateType = Object.values(TODO_DATE_TYPES).find(value => value === dateType);

    return validDateType || TODO_DATE_TYPES.due;
}

function normalizeTodoKind(kind: unknown, dateType?: unknown): TodoKind {
    const validKind = Object.values(TODO_KINDS).find(value => value === kind);

    if (validKind) {
        return validKind;
    }

    const normalizedDateType = normalizeDateType(dateType);

    if (normalizedDateType === TODO_DATE_TYPES.event) {
        return TODO_KINDS.event;
    }

    if (normalizedDateType === TODO_DATE_TYPES.period) {
        return TODO_KINDS.period;
    }

    return TODO_KINDS.task;
}

function isTaskTodo(todo: { kind?: unknown; dateType?: unknown }): boolean {
    return normalizeTodoKind(todo.kind, todo.dateType) === TODO_KINDS.task;
}

function normalizeDateTypeForTodoKind(kind: unknown, dateType?: unknown): TodoDateType {
    const normalizedKind = normalizeTodoKind(kind, dateType);

    if (normalizedKind === TODO_KINDS.event) {
        return TODO_DATE_TYPES.event;
    }

    if (normalizedKind === TODO_KINDS.schedule || normalizedKind === TODO_KINDS.period) {
        return TODO_DATE_TYPES.period;
    }

    return normalizeDateType(dateType);
}

function normalizeRecurrence(recurrence: unknown): TodoRecurrence {
    const validRecurrence = Object.values(TODO_RECURRENCES).find(value => value === recurrence);

    return validRecurrence || TODO_RECURRENCES.none;
}

function getAllowedRecurrencesForDateType(dateType: unknown): TodoRecurrence[] {
    const normalizedDateType = normalizeDateType(dateType);

    if (normalizedDateType === TODO_DATE_TYPES.event) {
        return [
            TODO_RECURRENCES.none,
            TODO_RECURRENCES.weekly,
            TODO_RECURRENCES.monthly,
            TODO_RECURRENCES.yearly,
        ];
    }

    if (normalizedDateType === TODO_DATE_TYPES.period) {
        return [TODO_RECURRENCES.none];
    }

    return Object.values(TODO_RECURRENCES);
}

function getAllowedRecurrencesForTodoKind(kind: unknown, dateType: unknown): TodoRecurrence[] {
    const normalizedKind = normalizeTodoKind(kind, dateType);

    if (normalizedKind === TODO_KINDS.period) {
        return [TODO_RECURRENCES.none];
    }

    if (normalizedKind === TODO_KINDS.schedule) {
        return Object.values(TODO_RECURRENCES);
    }

    if (normalizedKind === TODO_KINDS.event) {
        return [
            TODO_RECURRENCES.none,
            TODO_RECURRENCES.weekly,
            TODO_RECURRENCES.monthly,
            TODO_RECURRENCES.yearly,
        ];
    }

    return getAllowedRecurrencesForDateType(dateType);
}

function normalizeTodoRecurrence(dateType: unknown, recurrence: unknown): TodoRecurrence {
    const normalizedRecurrence = normalizeRecurrence(recurrence);
    const allowedRecurrences = getAllowedRecurrencesForDateType(dateType);

    return allowedRecurrences.includes(normalizedRecurrence)
        ? normalizedRecurrence
        : TODO_RECURRENCES.none;
}

function normalizeTodoRecurrenceForKind(kind: unknown, dateType: unknown, recurrence: unknown): TodoRecurrence {
    const normalizedRecurrence = normalizeRecurrence(recurrence);
    const allowedRecurrences = getAllowedRecurrencesForTodoKind(kind, dateType);

    return allowedRecurrences.includes(normalizedRecurrence)
        ? normalizedRecurrence
        : TODO_RECURRENCES.none;
}

function normalizeDueDate(dueDate: unknown): string | null {
    return typeof dueDate === 'string' && dueDate ? dueDate : null;
}

function normalizeTimeValue(timeValue: unknown): string | null {
    if (typeof timeValue !== 'string') {
        return null;
    }

    const trimmedTimeValue = timeValue.trim();
    const isValidTimeValue = /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmedTimeValue);

    return isValidTimeValue ? trimmedTimeValue : null;
}

function normalizeTodoSchedule(details: {
    dateType?: unknown;
    dueDate?: unknown;
    startDate?: unknown;
    endDate?: unknown;
}): {
    dateType: TodoDateType;
    dueDate: string | null;
    startDate: string | null;
    endDate: string | null;
} {
    const dateType = normalizeDateType(details.dateType);
    const dueDate = normalizeDueDate(details.dueDate);
    const startDate = normalizeDueDate(details.startDate);
    const endDate = normalizeDueDate(details.endDate);

    if (dateType === TODO_DATE_TYPES.event) {
        return {
            dateType,
            dueDate: null,
            startDate: startDate || dueDate,
            endDate: null,
        };
    }

    if (dateType === TODO_DATE_TYPES.period) {
        const normalizedStartDate = startDate || dueDate || endDate;
        const normalizedEndDate = endDate || normalizedStartDate;

        return {
            dateType,
            dueDate: null,
            startDate: normalizedStartDate,
            endDate: normalizedStartDate && normalizedEndDate && normalizedEndDate < normalizedStartDate
                ? normalizedStartDate
                : normalizedEndDate,
        };
    }

    return {
        dateType: TODO_DATE_TYPES.due,
        dueDate: dueDate || endDate || startDate,
        startDate: null,
        endDate: null,
    };
}

function normalizeTodoTimes(details: {
    kind?: unknown;
    dateType?: unknown;
    startTime?: unknown;
    endTime?: unknown;
}): {
    startTime: string | null;
    endTime: string | null;
} {
    const kind = normalizeTodoKind(details.kind, details.dateType);
    const dateType = normalizeDateType(details.dateType);
    const startTime = normalizeTimeValue(details.startTime);
    const endTime = normalizeTimeValue(details.endTime);

    if (kind === TODO_KINDS.schedule || dateType === TODO_DATE_TYPES.period) {
        return {
            startTime,
            endTime: startTime ? endTime : null,
        };
    }

    return {
        startTime,
        endTime: null,
    };
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

function getDateParts(dateValue: string): { year: number; month: number; day: number } | null {
    const [year, month, day] = dateValue.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return { year, month, day };
}

function getDateDiffInDays(startDate: string, endDate: string): number {
    const start = getDateParts(startDate);
    const end = getDateParts(endDate);

    if (!start || !end) {
        return Number.NaN;
    }

    const startTime = Date.UTC(start.year, start.month - 1, start.day);
    const endTime = Date.UTC(end.year, end.month - 1, end.day);

    return Math.floor((endTime - startTime) / 86_400_000);
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
    const kind = normalizeTodoKind(
        'kind' in details ? details.kind : undefined,
        'dateType' in details ? details.dateType : undefined
    );
    const dateType = normalizeDateTypeForTodoKind(kind, 'dateType' in details ? details.dateType : undefined);
    const schedule = normalizeTodoSchedule({
        dateType,
        dueDate: 'dueDate' in details ? details.dueDate : undefined,
        startDate: 'startDate' in details ? details.startDate : undefined,
        endDate: 'endDate' in details ? details.endDate : undefined,
    });
    const times = normalizeTodoTimes({
        kind,
        dateType: schedule.dateType,
        startTime: 'startTime' in details ? details.startTime : undefined,
        endTime: 'endTime' in details ? details.endTime : undefined,
    });

    return {
        id: createTodoId(),
        text: text.trim(),
        kind,
        description: normalizeDescription('description' in details ? details.description : undefined),
        completed: false,
        order: normalizeOrder('order' in details ? details.order : undefined),
        priority: normalizePriority('priority' in details ? details.priority : undefined),
        dateType: schedule.dateType,
        dueDate: schedule.dueDate,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        startTime: times.startTime,
        endTime: times.endTime,
        recurrence: normalizeTodoRecurrenceForKind(kind, schedule.dateType, 'recurrence' in details ? details.recurrence : undefined),
        project: normalizeProject('project' in details ? details.project : undefined),
        tags: normalizeTags('tags' in details ? details.tags : undefined),
        subtasks: kind === TODO_KINDS.task
            ? normalizeSubtasks('subtasks' in details ? details.subtasks : undefined)
            : [],
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
        .map((todo, index) => {
            const kind = normalizeTodoKind(todo.kind, todo.dateType);
            const dateType = normalizeDateTypeForTodoKind(kind, todo.dateType);
            const schedule = normalizeTodoSchedule({
                dateType,
                dueDate: todo.dueDate,
                startDate: todo.startDate,
                endDate: todo.endDate,
            });
            const times = normalizeTodoTimes({
                kind,
                dateType: schedule.dateType,
                startTime: todo.startTime,
                endTime: todo.endTime,
            });

            return {
                id: typeof todo.id === 'string' && todo.id ? todo.id : createLegacyTodoId(todo, index),
                text: todo.text.trim(),
                kind,
                description: normalizeDescription(todo.description),
                completed: kind === TODO_KINDS.task ? Boolean(todo.completed) : false,
                order: normalizeOrder(todo.order, index),
                priority: normalizePriority(todo.priority),
                dateType: schedule.dateType,
                dueDate: schedule.dueDate,
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                startTime: times.startTime,
                endTime: times.endTime,
                recurrence: normalizeTodoRecurrenceForKind(kind, schedule.dateType, todo.recurrence),
                project: normalizeProject(todo.project),
                tags: normalizeTags(todo.tags),
                subtasks: kind === TODO_KINDS.task ? normalizeSubtasks(todo.subtasks) : [],
                createdAt: normalizeDateTime(todo.createdAt),
                completedAt: kind === TODO_KINDS.task ? normalizeDateTime(todo.completedAt) : null,
            };
        });

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
            todo.description,
            todo.project,
            ...todoTags,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const matchesSearch = searchableText.includes(normalizedSearch);
        const dateStatus = getTodoDateStatus(todo, todayDate);
        const matchesFilter =
            filter === TODO_FILTERS.completed ? isTaskTodo(todo) && todo.completed :
            filter === TODO_FILTERS.active ? isTaskTodo(todo) && !todo.completed :
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
    if (todo.completed) {
        return null;
    }

    if (normalizeRecurrence(todo.recurrence) !== TODO_RECURRENCES.none) {
        const anchorDate = getTodoRecurrenceAnchorDate(todo);

        if (!anchorDate) {
            return null;
        }

        return isTodoRecurringOnDate(todo, todayDate) ? TODO_FILTERS.today : TODO_FILTERS.upcoming;
    }

    if (todo.dateType === TODO_DATE_TYPES.period) {
        if (!todo.startDate) {
            return null;
        }

        const endDate = todo.endDate || todo.startDate;

        if (endDate < todayDate) {
            return TODO_FILTERS.overdue;
        }

        if (todo.startDate <= todayDate && todayDate <= endDate) {
            return TODO_FILTERS.today;
        }

        return TODO_FILTERS.upcoming;
    }

    const dateValue = todo.dateType === TODO_DATE_TYPES.event
        ? todo.startDate
        : todo.dueDate;

    if (!dateValue) {
        return null;
    }

    if (dateValue < todayDate) {
        return TODO_FILTERS.overdue;
    }

    if (dateValue === todayDate) {
        return TODO_FILTERS.today;
    }

    return TODO_FILTERS.upcoming;
}

function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

function foldIcsLine(line: string): string {
    if (line.length <= 75) {
        return line;
    }

    const chunks: string[] = [];
    let currentLine = line;

    while (currentLine.length > 75) {
        chunks.push(currentLine.slice(0, 75));
        currentLine = ` ${currentLine.slice(75)}`;
    }

    chunks.push(currentLine);

    return chunks.join('\r\n');
}

function formatIcsDate(dateValue: string): string {
    return dateValue.replace(/-/g, '');
}

function formatIcsDateTime(dateValue: string, timeValue: string): string {
    return `${formatIcsDate(dateValue)}T${timeValue.replace(':', '')}00`;
}

function formatIcsUtcDateTime(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function getDateValueFromDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getNextDateValue(dateValue: string): string {
    return getDateValueOffset(dateValue, 1);
}

function getTodoCalendarStartDate(todo: Todo): string | null {
    return todo.dateType === TODO_DATE_TYPES.event || todo.dateType === TODO_DATE_TYPES.period
        ? todo.startDate
        : todo.dueDate;
}

function getTodoCalendarEndDate(todo: Todo, startDate: string): string {
    if (todo.dateType === TODO_DATE_TYPES.period && todo.endDate) {
        return todo.endDate;
    }

    return startDate;
}

function getTodoIcsDescription(todo: Todo): string {
    const details = [
        todo.description,
        todo.project ? `Proyecto: ${todo.project}` : null,
        todo.tags.length ? `Etiquetas: ${todo.tags.join(', ')}` : null,
        todo.subtasks.length
            ? `Subtareas: ${todo.subtasks.map(subtask => `${subtask.completed ? '[x]' : '[ ]'} ${subtask.text}`).join('; ')}`
            : null,
    ].filter((detail): detail is string => Boolean(detail));

    return details.join('\n');
}

function getDefaultTodoEndDateTime(startDate: string, startTime: string): { date: string; time: string } {
    const [hour = 0, minute = 0] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + 60;
    const nextHour = Math.floor((totalMinutes % 1440) / 60);
    const nextMinute = totalMinutes % 60;

    return {
        date: totalMinutes >= 1440 ? getNextDateValue(startDate) : startDate,
        time: `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`,
    };
}

function getTodoIcsEndDateTime(todo: Todo, startDate: string): { date: string; time: string } | null {
    if (!todo.startTime) {
        return null;
    }

    if (todo.endTime) {
        return {
            date: getTodoCalendarEndDate(todo, startDate),
            time: todo.endTime,
        };
    }

    return getDefaultTodoEndDateTime(startDate, todo.startTime);
}

function getTodoIcsRrule(todo: Todo): string | null {
    const recurrence = normalizeRecurrence(todo.recurrence);

    if (recurrence === TODO_RECURRENCES.none) {
        return null;
    }

    const frequencyByRecurrence: Record<Exclude<TodoRecurrence, 'none'>, string> = {
        [TODO_RECURRENCES.daily]: 'DAILY',
        [TODO_RECURRENCES.weekly]: 'WEEKLY',
        [TODO_RECURRENCES.monthly]: 'MONTHLY',
        [TODO_RECURRENCES.yearly]: 'YEARLY',
    };
    const frequency = frequencyByRecurrence[recurrence];
    const until = todo.endDate ? `;UNTIL=${formatIcsDate(todo.endDate)}T235959` : '';

    return `RRULE:FREQ=${frequency}${until}`;
}

function getTodoIcsLines(todo: Todo, dtstamp: string): string[] | null {
    if (isTaskTodo(todo) && todo.completed) {
        return null;
    }

    const startDate = getTodoCalendarStartDate(todo);

    if (!startDate) {
        return null;
    }

    const endDate = getTodoCalendarEndDate(todo, startDate);
    const hasTime = Boolean(todo.startTime);
    const summaryPrefix = todo.kind === TODO_KINDS.task ? 'Tarea: ' : '';
    const description = getTodoIcsDescription(todo);
    const lines = [
        'BEGIN:VEVENT',
        `UID:taskflow-${escapeIcsText(todo.id)}@sachadev.me`,
        `DTSTAMP:${dtstamp}`,
        `SUMMARY:${escapeIcsText(`${summaryPrefix}${todo.text}`)}`,
    ];

    if (description) {
        lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    }

    if (hasTime && todo.startTime) {
        const endDateTime = getTodoIcsEndDateTime(todo, startDate);

        lines.push(`DTSTART:${formatIcsDateTime(startDate, todo.startTime)}`);
        lines.push(`DTEND:${formatIcsDateTime(endDateTime?.date || endDate, endDateTime?.time || todo.startTime)}`);
    } else {
        lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(startDate)}`);
        lines.push(`DTEND;VALUE=DATE:${formatIcsDate(getNextDateValue(endDate))}`);
    }

    const rrule = getTodoIcsRrule(todo);

    if (rrule) {
        lines.push(rrule);
    }

    lines.push('END:VEVENT');

    return lines;
}

function createTodosCalendarExport(todos: Todo[], now = new Date()): TodoCalendarExport {
    const dtstamp = formatIcsUtcDateTime(now);
    const eventLines = normalizeTodos(todos)
        .map(todo => getTodoIcsLines(todo, dtstamp))
        .filter((lines): lines is string[] => Boolean(lines));
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TaskFlow//TaskFlow Local Calendar//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:TaskFlow ${getDateValueFromDate(now)}`,
        ...eventLines.flat(),
        'END:VCALENDAR',
    ];

    return {
        content: `${lines.map(foldIcsLine).join('\r\n')}\r\n`,
        count: eventLines.length,
    };
}

function unfoldIcsLines(content: string): string[] {
    return content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .reduce<string[]>((lines, line) => {
            if (/^[ \t]/.test(line) && lines.length) {
                lines[lines.length - 1] += line.slice(1);
            } else {
                lines.push(line);
            }

            return lines;
        }, [])
        .map(line => line.trimEnd())
        .filter(Boolean);
}

function parseIcsProperty(line: string): IcsProperty | null {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex < 0) {
        return null;
    }

    const rawName = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [name = '', ...rawParams] = rawName.split(';');
    const params = rawParams.reduce<Record<string, string>>((result, param) => {
        const [paramName, ...paramValueParts] = param.split('=');

        if (paramName) {
            result[paramName.toUpperCase()] = paramValueParts.join('=');
        }

        return result;
    }, {});

    return name
        ? {
            name: name.toUpperCase(),
            params,
            value,
        }
        : null;
}

function unescapeIcsText(value: string): string {
    return value
        .replace(/\\n/gi, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}

function getIcsDateValue(dateValue: string): string | null {
    const match = dateValue.match(/^(\d{4})(\d{2})(\d{2})/);

    return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function getIcsTimeValue(dateValue: string): string | null {
    const match = dateValue.match(/T(\d{2})(\d{2})(\d{2})?/);

    return match ? normalizeTimeValue(`${match[1]}:${match[2]}`) : null;
}

function parseIcsDateProperty(property?: IcsProperty): IcsDateValue | null {
    if (!property) {
        return null;
    }

    const date = getIcsDateValue(property.value);

    if (!date) {
        return null;
    }

    const isDateOnly = property.params.VALUE === 'DATE' || !property.value.includes('T');

    return {
        date,
        isDateOnly,
        time: isDateOnly ? null : getIcsTimeValue(property.value),
    };
}

function parseIcsRecurrence(property?: IcsProperty): IcsRecurrence {
    if (!property) {
        return {
            recurrence: TODO_RECURRENCES.none,
            untilDate: null,
        };
    }

    const rruleParts = property.value.split(';').reduce<Record<string, string>>((result, part) => {
        const [key, value] = part.split('=');

        if (key && value) {
            result[key.toUpperCase()] = value;
        }

        return result;
    }, {});
    const recurrenceByFrequency: Record<string, TodoRecurrence> = {
        DAILY: TODO_RECURRENCES.daily,
        WEEKLY: TODO_RECURRENCES.weekly,
        MONTHLY: TODO_RECURRENCES.monthly,
        YEARLY: TODO_RECURRENCES.yearly,
    };

    return {
        recurrence: recurrenceByFrequency[rruleParts.FREQ] || TODO_RECURRENCES.none,
        untilDate: rruleParts.UNTIL ? getIcsDateValue(rruleParts.UNTIL) : null,
    };
}

function getIcsEventId(properties: Map<string, IcsProperty>, index: number): string {
    const uid = properties.get('UID')?.value || `event-${index}`;
    const normalizedUid = uid
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `ics-${normalizedUid || index}`;
}

function getIcsEventEndDate(start: IcsDateValue, end: IcsDateValue | null): string | null {
    if (!end) {
        return null;
    }

    if (start.isDateOnly && end.isDateOnly && end.date > start.date) {
        return getDateValueOffset(end.date, -1);
    }

    return end.date;
}

function getIcsEventKind(details: {
    end: IcsDateValue | null;
    endDate: string | null;
    recurrence: TodoRecurrence;
    start: IcsDateValue;
    untilDate: string | null;
}): TodoKind {
    if (details.start.isDateOnly && details.endDate && details.endDate > details.start.date) {
        return TODO_KINDS.period;
    }

    if (
        !details.start.isDateOnly &&
        details.end?.time &&
        details.untilDate &&
        (
            details.recurrence === TODO_RECURRENCES.daily ||
            details.recurrence === TODO_RECURRENCES.weekly
        )
    ) {
        return TODO_KINDS.schedule;
    }

    return TODO_KINDS.event;
}

function readTodoFromIcsProperties(properties: Map<string, IcsProperty>, index: number): TodoInput | null {
    const summary = unescapeIcsText(properties.get('SUMMARY')?.value || '');
    const start = parseIcsDateProperty(properties.get('DTSTART'));
    const end = parseIcsDateProperty(properties.get('DTEND'));

    if (!summary || !start) {
        return null;
    }

    const recurrence = parseIcsRecurrence(properties.get('RRULE'));
    const endDate = getIcsEventEndDate(start, end);
    const kind = getIcsEventKind({
        end,
        endDate,
        recurrence: recurrence.recurrence,
        start,
        untilDate: recurrence.untilDate,
    });
    const dateType = kind === TODO_KINDS.period || kind === TODO_KINDS.schedule
        ? TODO_DATE_TYPES.period
        : TODO_DATE_TYPES.event;
    const description = unescapeIcsText(properties.get('DESCRIPTION')?.value || '');

    return {
        id: getIcsEventId(properties, index),
        text: summary,
        kind,
        description,
        completed: false,
        dateType,
        startDate: start.date,
        endDate: kind === TODO_KINDS.schedule
            ? recurrence.untilDate || endDate
            : endDate,
        startTime: start.time,
        endTime: kind === TODO_KINDS.schedule ? end?.time : null,
        recurrence: recurrence.recurrence,
        order: index,
    };
}

function readTodosCalendarImport(content: unknown): CalendarImportReadResult {
    if (typeof content !== 'string' || !content.trim()) {
        return {
            ok: false,
            error: 'El archivo ICS esta vacio o no se pudo leer.',
        };
    }

    const lines = unfoldIcsLines(content);
    const todos: TodoInput[] = [];
    let activeEvent: Map<string, IcsProperty> | null = null;

    lines.forEach(line => {
        const property = parseIcsProperty(line);

        if (!property) {
            return;
        }

        if (property.name === 'BEGIN' && property.value.toUpperCase() === 'VEVENT') {
            activeEvent = new Map();
            return;
        }

        if (property.name === 'END' && property.value.toUpperCase() === 'VEVENT') {
            if (activeEvent) {
                const todo = readTodoFromIcsProperties(activeEvent, todos.length);

                if (todo) {
                    todos.push(todo);
                }
            }

            activeEvent = null;
            return;
        }

        if (activeEvent) {
            activeEvent.set(property.name, property);
        }
    });

    const normalizedTodos = normalizeTodos(todos);

    if (!normalizedTodos.length) {
        return {
            ok: false,
            error: 'El calendario no contiene eventos importables.',
        };
    }

    return {
        ok: true,
        todos: normalizedTodos,
        totalCount: normalizedTodos.length,
    };
}

function getTodoRecurrenceAnchorDate(todo: Pick<Todo, 'dateType' | 'dueDate' | 'startDate'>): string | null {
    return todo.dateType === TODO_DATE_TYPES.event || todo.dateType === TODO_DATE_TYPES.period
        ? todo.startDate
        : todo.dueDate;
}

function isTodoRecurringOnDate(
    todo: Pick<Todo, 'dateType' | 'dueDate' | 'startDate' | 'recurrence'> & { endDate?: string | null },
    dateValue: string
): boolean {
    const recurrence = normalizeRecurrence(todo.recurrence);

    if (recurrence === TODO_RECURRENCES.none) {
        return false;
    }

    const anchorDate = getTodoRecurrenceAnchorDate(todo);

    if (!anchorDate || dateValue < anchorDate || (todo.endDate && dateValue > todo.endDate)) {
        return false;
    }

    const differenceInDays = getDateDiffInDays(anchorDate, dateValue);

    if (!Number.isFinite(differenceInDays)) {
        return false;
    }

    if (recurrence === TODO_RECURRENCES.daily) {
        return true;
    }

    if (recurrence === TODO_RECURRENCES.weekly) {
        return differenceInDays % 7 === 0;
    }

    const anchorParts = getDateParts(anchorDate);
    const dateParts = getDateParts(dateValue);

    if (!anchorParts || !dateParts) {
        return false;
    }

    if (recurrence === TODO_RECURRENCES.monthly) {
        return anchorParts.day === dateParts.day;
    }

    return anchorParts.month === dateParts.month && anchorParts.day === dateParts.day;
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
    const taskTodos = normalizedTodos.filter(isTaskTodo);
    const totalTodos = taskTodos.length;
    const completedTodos = taskTodos.filter(todo => todo.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const dateCounts = getTodosDateCounts(taskTodos, todayDate);
    const sevenDaysAgo = getDateValueOffset(todayDate, -6);
    const completedLast7Days = taskTodos.filter(todo => {
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
        highPriorityPendingTodos: taskTodos.filter(todo =>
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

function isUnsupportedBackupVersion(backup: unknown): boolean {
    return isRecord(backup) &&
        typeof backup.version === 'number' &&
        backup.version > TODO_BACKUP_VERSION;
}

function readTodosBackup(backup: unknown): BackupReadResult {
    if (isUnsupportedBackupVersion(backup)) {
        return {
            ok: false,
            error: UNSUPPORTED_BACKUP_VERSION_ERROR,
        };
    }

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
    TODO_DATE_TYPES,
    TODO_FILTERS,
    TODO_BACKUP_VERSION,
    TODO_GROUPS,
    TODO_KINDS,
    TODO_PRIORITIES,
    TODO_RECURRENCES,
    analyzeTodosImport,
    applyTodosImport,
    createTodosBackup,
    createTodosCalendarExport,
    createTodo,
    getAllowedRecurrencesForDateType,
    getAllowedRecurrencesForTodoKind,
    getTodayDateValue,
    getTodoFacets,
    getTodoDateStatus,
    getTodoGroups,
    getTodoInsights,
    getTodoRecurrenceAnchorDate,
    getTodosDateCounts,
    getVisibleTodos,
    isTodoRecurringOnDate,
    isTaskTodo,
    mergeSubtasks,
    moveTodoToPosition,
    normalizeDueDate,
    normalizeDateType,
    normalizeDateTypeForTodoKind,
    normalizeDescription,
    normalizeOrder,
    normalizePriority,
    normalizeProject,
    normalizeRecurrence,
    normalizeTodoKind,
    normalizeTodoRecurrence,
    normalizeTodoRecurrenceForKind,
    normalizeSubtasks,
    normalizeTags,
    normalizeTodoSchedule,
    normalizeTodoTimes,
    normalizeTodos,
    normalizeTimeValue,
    readTodosCalendarImport,
    readTodosBackup,
    reindexTodos,
};

export type {
    ImportMode,
    Todo,
    TodoBackup,
    TodoCalendarExport,
    TodoDateType,
    TodoDetails,
    TodoFilter,
    TodoGroupView,
    TodoInsights,
    TodoKind,
    TodoPriority,
    TodoRecurrence,
    TodoSubtask,
};
