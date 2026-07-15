type TodoFilter =
    | 'all'
    | 'active'
    | 'completed'
    | 'overdue'
    | 'today'
    | 'upcoming'
    | 'unscheduled'
    | 'highPriority'
    | 'pendingSubtasks'
    | 'recurring'
    | 'withReminder'
    | 'tasks'
    | 'events'
    | 'schedules'
    | 'periods'
    | 'archived';
type TodoDateStatus = 'overdue' | 'today' | 'upcoming';
type TodoPriority = 'low' | 'medium' | 'high';
type TodoDateType = 'due' | 'event' | 'period';
type TodoRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type TodoReminder = 'none' | 'at-time' | '10-minutes' | '30-minutes' | '1-day';
type TodoWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type TodoKind = 'task' | 'event' | 'schedule' | 'period';
type TodoGroup = 'overdue' | 'today' | 'upcoming' | 'unscheduled' | 'completed' | 'archived';
type ImportMode = 'merge' | 'replace';

type TodoSubtask = {
    id: string;
    text: string;
    completed: boolean;
};

type TodoTimeBlock = {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
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
    recurrenceDays: TodoWeekday[];
    recurrenceEndDate: string | null;
    recurrenceCount: number | null;
    completedOccurrences: string[];
    excludedOccurrences: string[];
    reminder: TodoReminder;
    project: string | null;
    tags: string[];
    timeBlocks: TodoTimeBlock[];
    subtasks: TodoSubtask[];
    createdAt: string | null;
    completedAt: string | null;
    archivedAt: string | null;
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

type TodoFilterCounts = Record<TodoFilter, number>;

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
    recurrenceDays?: unknown;
    recurrenceEndDate?: unknown;
    recurrenceCount?: unknown;
    completedOccurrences?: unknown;
    excludedOccurrences?: unknown;
    reminder?: unknown;
    project?: unknown;
    tags?: unknown;
    timeBlocks?: unknown;
    subtasks?: unknown;
};

type TodoInput = TodoDetails & {
    id?: unknown;
    text?: unknown;
    completed?: unknown;
    createdAt?: unknown;
    completedAt?: unknown;
    archivedAt?: unknown;
};
type TodoInputWithText = TodoInput & { text: string };
type TodoOccurrenceState = Pick<Todo,
    'kind' |
    'dateType' |
    'dueDate' |
    'startDate' |
    'endDate' |
    'recurrence' |
    'recurrenceDays' |
    'recurrenceEndDate' |
    'recurrenceCount' |
    'completedOccurrences' |
    'excludedOccurrences'
>;

const TODO_FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed',
    overdue: 'overdue',
    today: 'today',
    upcoming: 'upcoming',
    unscheduled: 'unscheduled',
    highPriority: 'highPriority',
    pendingSubtasks: 'pendingSubtasks',
    recurring: 'recurring',
    withReminder: 'withReminder',
    tasks: 'tasks',
    events: 'events',
    schedules: 'schedules',
    periods: 'periods',
    archived: 'archived',
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

const TODO_REMINDERS = {
    none: 'none',
    atTime: 'at-time',
    tenMinutes: '10-minutes',
    thirtyMinutes: '30-minutes',
    oneDay: '1-day',
} as const satisfies Record<string, TodoReminder>;

const TODO_REMINDER_OFFSETS_MINUTES: Record<Exclude<TodoReminder, 'none'>, number> = {
    [TODO_REMINDERS.atTime]: 0,
    [TODO_REMINDERS.tenMinutes]: 10,
    [TODO_REMINDERS.thirtyMinutes]: 30,
    [TODO_REMINDERS.oneDay]: 1440,
};

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
    archived: 'archived',
} as const satisfies Record<TodoGroup, TodoGroup>;

const TODO_GROUP_LABELS: Record<TodoGroup, string> = {
    [TODO_GROUPS.overdue]: 'Vencidas',
    [TODO_GROUPS.today]: 'Hoy',
    [TODO_GROUPS.upcoming]: 'Proximas',
    [TODO_GROUPS.unscheduled]: 'Sin fecha',
    [TODO_GROUPS.completed]: 'Completadas',
    [TODO_GROUPS.archived]: 'Archivadas',
};

const TODO_GROUP_ORDER: TodoGroup[] = [
    TODO_GROUPS.overdue,
    TODO_GROUPS.today,
    TODO_GROUPS.upcoming,
    TODO_GROUPS.unscheduled,
    TODO_GROUPS.completed,
    TODO_GROUPS.archived,
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

function isTodoArchived(todo: { archivedAt?: unknown }): boolean {
    return Boolean(normalizeDateTime(todo.archivedAt));
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

function normalizeReminder(reminder: unknown): TodoReminder {
    const validReminder = Object.values(TODO_REMINDERS).find(value => value === reminder);

    return validReminder || TODO_REMINDERS.none;
}

function normalizeRecurrenceDays(recurrenceDays: unknown): TodoWeekday[] {
    const rawDays = Array.isArray(recurrenceDays)
        ? recurrenceDays
        : typeof recurrenceDays === 'string'
            ? recurrenceDays.split(',')
            : [];
    const uniqueDays = new Set<TodoWeekday>();

    rawDays.forEach(day => {
        const numericDay = typeof day === 'number'
            ? day
            : typeof day === 'string'
                ? Number(day.trim())
                : Number.NaN;

        if (
            Number.isInteger(numericDay) &&
            numericDay >= 0 &&
            numericDay <= 6
        ) {
            uniqueDays.add(numericDay as TodoWeekday);
        }
    });

    return [...uniqueDays].sort((firstDay, secondDay) => firstDay - secondDay);
}

function normalizeRecurrenceCount(recurrenceCount: unknown): number | null {
    const numericCount = typeof recurrenceCount === 'number'
        ? recurrenceCount
        : typeof recurrenceCount === 'string' && recurrenceCount.trim()
            ? Number(recurrenceCount)
            : Number.NaN;

    return Number.isInteger(numericCount) && numericCount > 0
        ? Math.min(numericCount, 999)
        : null;
}

function normalizeCompletedOccurrences(completedOccurrences: unknown): string[] {
    if (!Array.isArray(completedOccurrences)) {
        return [];
    }

    return Array.from(new Set(completedOccurrences
        .map(normalizeDueDate)
        .filter((dateValue): dateValue is string => Boolean(dateValue))))
        .sort();
}

function normalizeExcludedOccurrences(excludedOccurrences: unknown): string[] {
    return normalizeCompletedOccurrences(excludedOccurrences);
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

function createLegacyTimeBlockId(date: string, startTime: string, index: number): string {
    return `time-block-${index}-${date}-${startTime.replace(':', '')}`;
}

function normalizeTimeBlocks(timeBlocks: unknown): TodoTimeBlock[] {
    if (!Array.isArray(timeBlocks)) {
        return [];
    }

    const seenBlocks = new Set<string>();

    return timeBlocks
        .map((timeBlock, index) => {
            if (!isRecord(timeBlock)) {
                return null;
            }

            const date = normalizeDueDate(timeBlock.date);
            const startTime = normalizeTimeValue(timeBlock.startTime);
            const endTime = normalizeTimeValue(timeBlock.endTime);

            if (!date || !startTime || !endTime || endTime <= startTime) {
                return null;
            }

            const blockKey = `${date}:${startTime}:${endTime}`;

            if (seenBlocks.has(blockKey)) {
                return null;
            }

            seenBlocks.add(blockKey);

            return {
                id: typeof timeBlock.id === 'string' && timeBlock.id
                    ? timeBlock.id
                    : createLegacyTimeBlockId(date, startTime, index),
                date,
                startTime,
                endTime,
            };
        })
        .filter((timeBlock): timeBlock is TodoTimeBlock => Boolean(timeBlock));
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
    const recurrence = normalizeTodoRecurrenceForKind(
        kind,
        schedule.dateType,
        'recurrence' in details ? details.recurrence : undefined
    );

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
        recurrence,
        recurrenceDays: recurrence === TODO_RECURRENCES.weekly
            ? normalizeRecurrenceDays('recurrenceDays' in details ? details.recurrenceDays : undefined)
            : [],
        recurrenceEndDate: recurrence !== TODO_RECURRENCES.none
            ? normalizeDueDate('recurrenceEndDate' in details ? details.recurrenceEndDate : undefined)
            : null,
        recurrenceCount: recurrence !== TODO_RECURRENCES.none
            ? normalizeRecurrenceCount('recurrenceCount' in details ? details.recurrenceCount : undefined)
            : null,
        completedOccurrences: [],
        excludedOccurrences: recurrence !== TODO_RECURRENCES.none
            ? normalizeExcludedOccurrences('excludedOccurrences' in details ? details.excludedOccurrences : undefined)
            : [],
        reminder: normalizeReminder('reminder' in details ? details.reminder : undefined),
        project: normalizeProject('project' in details ? details.project : undefined),
        tags: normalizeTags('tags' in details ? details.tags : undefined),
        timeBlocks: kind === TODO_KINDS.task
            ? normalizeTimeBlocks('timeBlocks' in details ? details.timeBlocks : undefined)
            : [],
        subtasks: kind === TODO_KINDS.task
            ? normalizeSubtasks('subtasks' in details ? details.subtasks : undefined)
            : [],
        createdAt: new Date().toISOString(),
        completedAt: null,
        archivedAt: null,
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
            const recurrence = normalizeTodoRecurrenceForKind(kind, schedule.dateType, todo.recurrence);
            const completedAt = normalizeDateTime(todo.completedAt);
            const legacyOccurrence = kind === TODO_KINDS.task &&
                recurrence !== TODO_RECURRENCES.none &&
                Boolean(todo.completed) &&
                completedAt
                ? completedAt.slice(0, 10)
                : null;

            return {
                id: typeof todo.id === 'string' && todo.id ? todo.id : createLegacyTodoId(todo, index),
                text: todo.text.trim(),
                kind,
                description: normalizeDescription(todo.description),
                completed: kind === TODO_KINDS.task && recurrence === TODO_RECURRENCES.none
                    ? Boolean(todo.completed)
                    : false,
                order: normalizeOrder(todo.order, index),
                priority: normalizePriority(todo.priority),
                dateType: schedule.dateType,
                dueDate: schedule.dueDate,
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                startTime: times.startTime,
                endTime: times.endTime,
                recurrence,
                recurrenceDays: recurrence === TODO_RECURRENCES.weekly
                    ? normalizeRecurrenceDays(todo.recurrenceDays)
                    : [],
                recurrenceEndDate: recurrence !== TODO_RECURRENCES.none
                    ? normalizeDueDate(todo.recurrenceEndDate)
                    : null,
                recurrenceCount: recurrence !== TODO_RECURRENCES.none
                    ? normalizeRecurrenceCount(todo.recurrenceCount)
                    : null,
                completedOccurrences: recurrence !== TODO_RECURRENCES.none && kind === TODO_KINDS.task
                    ? normalizeCompletedOccurrences([
                        ...(Array.isArray(todo.completedOccurrences) ? todo.completedOccurrences : []),
                        legacyOccurrence,
                    ])
                    : [],
                excludedOccurrences: recurrence !== TODO_RECURRENCES.none
                    ? normalizeExcludedOccurrences(todo.excludedOccurrences)
                    : [],
                reminder: normalizeReminder(todo.reminder),
                project: normalizeProject(todo.project),
                tags: normalizeTags(todo.tags),
                timeBlocks: kind === TODO_KINDS.task ? normalizeTimeBlocks(todo.timeBlocks) : [],
                subtasks: kind === TODO_KINDS.task ? normalizeSubtasks(todo.subtasks) : [],
                createdAt: normalizeDateTime(todo.createdAt),
                completedAt: kind === TODO_KINDS.task && recurrence === TODO_RECURRENCES.none
                    ? completedAt
                    : null,
                archivedAt: normalizeDateTime(todo.archivedAt),
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
        const matchesFilter = doesTodoMatchFilter(todo, filter, todayDate);
        const matchesProject = !projectFilter ||
            todo.project?.toLowerCase() === projectFilter.toLowerCase();
        const matchesTag = !tagFilter ||
            todoTags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase());

        return matchesSearch && matchesFilter && matchesProject && matchesTag;
    });
}

function doesTodoMatchFilter(todo: Todo, filter: TodoFilter, todayDate = getTodayDateValue()): boolean {
    if (filter === TODO_FILTERS.archived) {
        return isTodoArchived(todo);
    }

    if (isTodoArchived(todo)) {
        return false;
    }

    const dateStatus = getTodoDateStatus(todo, todayDate);

    if (filter === TODO_FILTERS.completed) {
        return isTaskTodo(todo) && todo.completed;
    }

    if (filter === TODO_FILTERS.active) {
        return isTaskTodo(todo) && !todo.completed;
    }

    if (filter === TODO_FILTERS.overdue) {
        return dateStatus === TODO_FILTERS.overdue;
    }

    if (filter === TODO_FILTERS.today) {
        return dateStatus === TODO_FILTERS.today;
    }

    if (filter === TODO_FILTERS.upcoming) {
        return dateStatus === TODO_FILTERS.upcoming;
    }

    if (filter === TODO_FILTERS.unscheduled) {
        return !todo.completed && !dateStatus;
    }

    if (filter === TODO_FILTERS.highPriority) {
        return isTaskTodo(todo) && !todo.completed && todo.priority === TODO_PRIORITIES.high;
    }

    if (filter === TODO_FILTERS.pendingSubtasks) {
        return isTaskTodo(todo) &&
            !todo.completed &&
            todo.subtasks.some(subtask => !subtask.completed);
    }

    if (filter === TODO_FILTERS.recurring) {
        return normalizeRecurrence(todo.recurrence) !== TODO_RECURRENCES.none;
    }

    if (filter === TODO_FILTERS.withReminder) {
        return normalizeReminder(todo.reminder) !== TODO_REMINDERS.none;
    }

    if (filter === TODO_FILTERS.tasks) {
        return todo.kind === TODO_KINDS.task;
    }

    if (filter === TODO_FILTERS.events) {
        return todo.kind === TODO_KINDS.event;
    }

    if (filter === TODO_FILTERS.schedules) {
        return todo.kind === TODO_KINDS.schedule;
    }

    if (filter === TODO_FILTERS.periods) {
        return todo.kind === TODO_KINDS.period;
    }

    return true;
}

function getTodoFilterCounts(todos: Todo[], todayDate = getTodayDateValue()): TodoFilterCounts {
    const normalizedTodos = normalizeTodos(todos);

    return Object.values(TODO_FILTERS).reduce<TodoFilterCounts>((counts, filter) => {
        counts[filter] = normalizedTodos.filter(todo => doesTodoMatchFilter(todo, filter, todayDate)).length;

        return counts;
    }, {} as TodoFilterCounts);
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
    if (todo.completed || isTodoArchived(todo)) {
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


function getTodoRecurrenceAnchorDate(todo: Pick<Todo, 'dateType' | 'dueDate' | 'startDate'>): string | null {
    return todo.dateType === TODO_DATE_TYPES.event || todo.dateType === TODO_DATE_TYPES.period
        ? todo.startDate
        : todo.dueDate;
}

function getDateWeekday(dateValue: string): TodoWeekday | null {
    const dateParts = getDateParts(dateValue);

    if (!dateParts) {
        return null;
    }

    return new Date(dateParts.year, dateParts.month - 1, dateParts.day).getDay() as TodoWeekday;
}

function isTodoRecurrenceBaseMatch(
    todo: Pick<Todo, 'dateType' | 'dueDate' | 'startDate' | 'recurrence'> & {
        recurrenceDays?: TodoWeekday[];
    },
    anchorDate: string,
    dateValue: string
): boolean {
    const recurrence = normalizeRecurrence(todo.recurrence);
    const differenceInDays = getDateDiffInDays(anchorDate, dateValue);

    if (!Number.isFinite(differenceInDays) || differenceInDays < 0) {
        return false;
    }

    if (recurrence === TODO_RECURRENCES.daily) {
        return true;
    }

    if (recurrence === TODO_RECURRENCES.weekly) {
        const recurrenceDays = normalizeRecurrenceDays(todo.recurrenceDays);

        if (recurrenceDays.length) {
            const weekday = getDateWeekday(dateValue);

            return weekday !== null && recurrenceDays.includes(weekday);
        }

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

function getTodoRecurrenceOccurrenceNumber(
    todo: Pick<Todo, 'dateType' | 'dueDate' | 'startDate' | 'recurrence'> & {
        recurrenceDays?: TodoWeekday[];
    },
    anchorDate: string,
    dateValue: string
): number | null {
    if (!isTodoRecurrenceBaseMatch(todo, anchorDate, dateValue)) {
        return null;
    }

    let occurrenceNumber = 0;
    const differenceInDays = getDateDiffInDays(anchorDate, dateValue);

    for (let dayOffset = 0; dayOffset <= differenceInDays; dayOffset += 1) {
        const currentDate = getDateValueOffset(anchorDate, dayOffset);

        if (isTodoRecurrenceBaseMatch(todo, anchorDate, currentDate)) {
            occurrenceNumber += 1;
        }
    }

    return occurrenceNumber;
}

function getLocalDateTime(dateValue: string, timeValue: string): Date | null {
    const dateParts = getDateParts(dateValue);
    const [hour = Number.NaN, minute = Number.NaN] = timeValue.split(':').map(Number);

    if (!dateParts || !Number.isFinite(hour) || !Number.isFinite(minute)) {
        return null;
    }

    return new Date(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute, 0, 0);
}

function getTodoReminderBaseTime(todo: Pick<Todo, 'startTime'>): string {
    return todo.startTime || '09:00';
}

function getReminderTargetForDate(
    todo: Pick<Todo, 'reminder' | 'startTime'>,
    dateValue: string
): Date | null {
    const reminder = normalizeReminder(todo.reminder);

    if (reminder === TODO_REMINDERS.none) {
        return null;
    }

    const dateTime = getLocalDateTime(dateValue, getTodoReminderBaseTime(todo));

    if (!dateTime) {
        return null;
    }

    const offsetMinutes = TODO_REMINDER_OFFSETS_MINUTES[reminder];

    return new Date(dateTime.getTime() - offsetMinutes * 60_000);
}

function getTodoReminderTarget(todo: Todo, now = new Date()): Date | null {
    if (normalizeReminder(todo.reminder) === TODO_REMINDERS.none || (isTaskTodo(todo) && todo.completed)) {
        return null;
    }

    const todayDate = getTodayDateValue(now);
    const recurrence = normalizeRecurrence(todo.recurrence);

    if (recurrence === TODO_RECURRENCES.none) {
        const anchorDate = getTodoRecurrenceAnchorDate(todo);
        const reminderTarget = anchorDate ? getReminderTargetForDate(todo, anchorDate) : null;

        return reminderTarget && reminderTarget.getTime() > now.getTime()
            ? reminderTarget
            : null;
    }

    for (let dayOffset = 0; dayOffset <= 370; dayOffset += 1) {
        const dateValue = getDateValueOffset(todayDate, dayOffset);

        if (!isTodoRecurringOnDate(todo, dateValue)) {
            continue;
        }

        if (isTaskTodo(todo) && isTodoOccurrenceCompleted(todo, dateValue)) {
            continue;
        }

        const reminderTarget = getReminderTargetForDate(todo, dateValue);

        if (reminderTarget && reminderTarget.getTime() > now.getTime()) {
            return reminderTarget;
        }
    }

    return null;
}

function isTodoRecurringOnDate(
    todo: Pick<Todo, 'dateType' | 'dueDate' | 'startDate' | 'recurrence'> & {
        endDate?: string | null;
        excludedOccurrences?: string[];
        recurrenceCount?: number | null;
        recurrenceDays?: TodoWeekday[];
        recurrenceEndDate?: string | null;
    },
    dateValue: string
): boolean {
    const recurrence = normalizeRecurrence(todo.recurrence);

    if (recurrence === TODO_RECURRENCES.none) {
        return false;
    }

    if (normalizeExcludedOccurrences(todo.excludedOccurrences).includes(dateValue)) {
        return false;
    }

    const anchorDate = getTodoRecurrenceAnchorDate(todo);
    const recurrenceEndDate = normalizeDueDate(todo.recurrenceEndDate) || todo.endDate;

    if (!anchorDate || dateValue < anchorDate || (recurrenceEndDate && dateValue > recurrenceEndDate)) {
        return false;
    }

    const occurrenceNumber = getTodoRecurrenceOccurrenceNumber(todo, anchorDate, dateValue);

    if (!occurrenceNumber) {
        return false;
    }

    const recurrenceCount = normalizeRecurrenceCount(todo.recurrenceCount);

    if (recurrenceCount && occurrenceNumber > recurrenceCount) {
        return false;
    }

    return true;
}

function getTodoNextRecurringDate(todo: TodoOccurrenceState, fromDate = getTodayDateValue()): string | null {
    if (normalizeRecurrence(todo.recurrence) === TODO_RECURRENCES.none) {
        return null;
    }

    const normalizedFromDate = normalizeDueDate(fromDate) || getTodayDateValue();

    for (let dayOffset = 0; dayOffset <= 3660; dayOffset += 1) {
        const dateValue = getDateValueOffset(normalizedFromDate, dayOffset);

        if (isTodoRecurringOnDate(todo, dateValue)) {
            return dateValue;
        }
    }

    return null;
}

function getTodoNextOccurrenceDate(todo: TodoOccurrenceState, fromDate = getTodayDateValue()): string | null {
    return todo.kind === TODO_KINDS.task
        ? getTodoNextRecurringDate(todo, fromDate)
        : null;
}

function isTodoOccurrenceCompleted(todo: Pick<TodoOccurrenceState, 'completedOccurrences'>, dateValue: string | null): boolean {
    return Boolean(dateValue) && normalizeCompletedOccurrences(todo.completedOccurrences).includes(dateValue as string);
}

function setTodoOccurrenceCompletion(todo: Todo, dateValue: string | null, completed: boolean): Todo {
    if (!dateValue || !isTaskTodo(todo) || !isTodoRecurringOnDate(todo, dateValue)) {
        return todo;
    }

    const completedOccurrences = normalizeCompletedOccurrences(todo.completedOccurrences);

    return {
        ...todo,
        completed: false,
        completedAt: null,
        completedOccurrences: completed
            ? normalizeCompletedOccurrences([...completedOccurrences, dateValue])
            : completedOccurrences.filter(occurrence => occurrence !== dateValue),
    };
}

function toggleTodoOccurrence(todo: Todo, dateValue = getTodoNextOccurrenceDate(todo)): Todo {
    return setTodoOccurrenceCompletion(
        todo,
        dateValue,
        !isTodoOccurrenceCompleted(todo, dateValue)
    );
}

function setTodoOccurrenceExcluded(todo: Todo, dateValue: string | null, excluded = true): Todo {
    const normalizedDate = normalizeDueDate(dateValue);

    if (!normalizedDate || normalizeRecurrence(todo.recurrence) === TODO_RECURRENCES.none) {
        return todo;
    }

    const excludedOccurrences = normalizeExcludedOccurrences(todo.excludedOccurrences);

    return {
        ...todo,
        excludedOccurrences: excluded
            ? normalizeExcludedOccurrences([...excludedOccurrences, normalizedDate])
            : excludedOccurrences.filter(occurrence => occurrence !== normalizedDate),
    };
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
    const normalizedTodos = normalizeTodos(todos).filter(todo => !isTodoArchived(todo));
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
    if (isTodoArchived(todo)) {
        return TODO_GROUPS.archived;
    }

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
    TODO_REMINDERS,
    TODO_RECURRENCES,
    analyzeTodosImport,
    applyTodosImport,
    createTodosBackup,
    createTodo,
    getAllowedRecurrencesForDateType,
    getAllowedRecurrencesForTodoKind,
    getDateValueOffset,
    getTodayDateValue,
    getTodoFacets,
    getTodoDateStatus,
    getTodoFilterCounts,
    getTodoGroups,
    getTodoInsights,
    getTodoReminderTarget,
    getTodoNextOccurrenceDate,
    getTodoNextRecurringDate,
    getTodoRecurrenceAnchorDate,
    getTodosDateCounts,
    getVisibleTodos,
    isTodoArchived,
    isTodoOccurrenceCompleted,
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
    normalizeRecurrenceCount,
    normalizeRecurrenceDays,
    normalizeCompletedOccurrences,
    normalizeExcludedOccurrences,
    normalizeReminder,
    normalizeTodoKind,
    normalizeTodoRecurrence,
    normalizeTodoRecurrenceForKind,
    normalizeSubtasks,
    normalizeTags,
    normalizeTimeBlocks,
    normalizeTodoSchedule,
    normalizeTodoTimes,
    normalizeTodos,
    normalizeTimeValue,
    readTodosBackup,
    reindexTodos,
    setTodoOccurrenceCompletion,
    setTodoOccurrenceExcluded,
    toggleTodoOccurrence,
};

export type {
    ImportMode,
    Todo,
    TodoBackup,
    TodoDateType,
    TodoDetails,
    TodoFilter,
    TodoFilterCounts,
    TodoGroupView,
    TodoInsights,
    TodoInput,
    TodoKind,
    TodoPriority,
    TodoReminder,
    TodoRecurrence,
    TodoSubtask,
    TodoTimeBlock,
    TodoWeekday,
};
