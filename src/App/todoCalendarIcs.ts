import {
    TODO_DATE_TYPES,
    TODO_KINDS,
    TODO_RECURRENCES,
    getDateValueOffset,
    isTaskTodo,
    normalizeRecurrence,
    normalizeRecurrenceCount,
    normalizeRecurrenceDays,
    normalizeTimeValue,
    normalizeTodos,
} from './todoModel';
import type {
    Todo,
    TodoInput,
    TodoKind,
    TodoRecurrence,
    TodoWeekday,
} from './todoModel';

type TodoCalendarExport = {
    content: string;
    count: number;
};

type CalendarImportReadResult =
    { ok: true; todos: Todo[]; totalCount: number } |
    { ok: false; error: string };

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
    recurrenceCount: number | null;
    recurrenceDays: TodoWeekday[];
    untilDate: string | null;
};

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
    const weekdayByDay: Record<TodoWeekday, string> = {
        0: 'SU',
        1: 'MO',
        2: 'TU',
        3: 'WE',
        4: 'TH',
        5: 'FR',
        6: 'SA',
    };
    const frequency = frequencyByRecurrence[recurrence];
    const recurrenceDays = recurrence === TODO_RECURRENCES.weekly
        ? normalizeRecurrenceDays(todo.recurrenceDays)
        : [];
    const byDay = recurrenceDays.length
        ? `;BYDAY=${recurrenceDays.map(day => weekdayByDay[day]).join(',')}`
        : '';
    const count = todo.recurrenceCount ? `;COUNT=${todo.recurrenceCount}` : '';
    const recurrenceEndDate = todo.recurrenceEndDate || todo.endDate;
    const until = !count && recurrenceEndDate ? `;UNTIL=${formatIcsDate(recurrenceEndDate)}T235959` : '';

    return `RRULE:FREQ=${frequency}${byDay}${count}${until}`;
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
            recurrenceCount: null,
            recurrenceDays: [],
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
    const dayByWeekday: Record<string, TodoWeekday> = {
        SU: 0,
        MO: 1,
        TU: 2,
        WE: 3,
        TH: 4,
        FR: 5,
        SA: 6,
    };
    const recurrenceDays = typeof rruleParts.BYDAY === 'string'
        ? rruleParts.BYDAY
            .split(',')
            .map(day => dayByWeekday[day.toUpperCase()])
            .filter((day): day is TodoWeekday => typeof day === 'number')
        : [];

    return {
        recurrence: recurrenceByFrequency[rruleParts.FREQ] || TODO_RECURRENCES.none,
        recurrenceCount: normalizeRecurrenceCount(rruleParts.COUNT),
        recurrenceDays: normalizeRecurrenceDays(recurrenceDays),
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
        recurrenceDays: recurrence.recurrenceDays,
        recurrenceEndDate: recurrence.untilDate,
        recurrenceCount: recurrence.recurrenceCount,
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

export {
    createTodosCalendarExport,
    readTodosCalendarImport,
};

export type {
    TodoCalendarExport,
};
