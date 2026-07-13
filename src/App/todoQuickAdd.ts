import {
    TODO_PRIORITIES,
    TODO_RECURRENCES,
    TodoDetails,
    TodoPriority,
    TodoRecurrence,
} from './todoModel';

type TodoQuickAddResult = {
    details: TodoDetails;
    summary: string[];
    text: string;
};

const PRIORITY_BY_TOKEN: Record<string, TodoPriority> = {
    alta: TODO_PRIORITIES.high,
    media: TODO_PRIORITIES.medium,
    baja: TODO_PRIORITIES.low,
};

const PRIORITY_LABELS: Record<TodoPriority, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
};

const RECURRENCE_RULES: Array<{ pattern: RegExp; value: TodoRecurrence; label: string }> = [
    { pattern: /\bcada\s+dia\b/i, value: TODO_RECURRENCES.daily, label: 'Diaria' },
    { pattern: /\bcada\s+semana\b/i, value: TODO_RECURRENCES.weekly, label: 'Semanal' },
    { pattern: /\bcada\s+mes\b/i, value: TODO_RECURRENCES.monthly, label: 'Mensual' },
    { pattern: /\bcada\s+(?:ano|año)\b/i, value: TODO_RECURRENCES.yearly, label: 'Anual' },
];

function toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function offsetDateValue(now: Date, offsetDays: number): string {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() + offsetDays);

    return toDateValue(date);
}

function parseSlashDate(dayValue: string, monthValue: string, yearValue: string | undefined, now: Date): string | null {
    const day = Number(dayValue);
    const month = Number(monthValue);
    let year = yearValue ? Number(yearValue) : now.getFullYear();
    let date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    if (!yearValue && toDateValue(date) < toDateValue(now)) {
        year += 1;
        date = new Date(year, month - 1, day);
    }

    return toDateValue(date);
}

function formatDateValue(dateValue: string): string {
    const [year, month, day] = dateValue.split('-');

    return `${day}/${month}/${year}`;
}

function cleanQuickAddText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function parseTodoQuickAdd(input: string, now = new Date()): TodoQuickAddResult {
    let remainingText = input.trim();
    const summary: string[] = [];
    const details: TodoDetails = {};
    const tags: string[] = [];

    remainingText = remainingText.replace(/(^|\s)#([\p{L}\d_-]+)/gu, (_match, prefix: string, tag: string) => {
        const normalizedTag = tag.trim();

        if (normalizedTag && !tags.some(currentTag => currentTag.toLowerCase() === normalizedTag.toLowerCase())) {
            tags.push(normalizedTag);
        }

        return prefix;
    });

    if (tags.length) {
        details.tags = tags;
        summary.push(...tags.map(tag => `#${tag}`));
    }

    remainingText = remainingText.replace(/(^|\s)!(alta|media|baja)\b/i, (_match, prefix: string, token: string) => {
        const priority = PRIORITY_BY_TOKEN[token.toLowerCase()];
        details.priority = priority;
        summary.unshift(PRIORITY_LABELS[priority]);

        return prefix;
    });

    for (const rule of RECURRENCE_RULES) {
        if (!rule.pattern.test(remainingText)) {
            continue;
        }

        remainingText = remainingText.replace(rule.pattern, ' ');
        details.recurrence = rule.value;
        summary.push(rule.label);
        break;
    }

    let dueDate: string | null = null;
    remainingText = remainingText.replace(/\b(hoy|manana|mañana)\b/i, (_match, token: string) => {
        dueDate = offsetDateValue(now, token.toLowerCase() === 'hoy' ? 0 : 1);
        return ' ';
    });

    if (!dueDate) {
        remainingText = remainingText.replace(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/, (match, day, month, year) => {
            const parsedDate = parseSlashDate(day, month, year, now);

            if (!parsedDate) {
                return match;
            }

            dueDate = parsedDate;
            return ' ';
        });
    }

    if (!dueDate) {
        remainingText = remainingText.replace(/\b(\d{4}-\d{2}-\d{2})\b/, (match, dateValue) => {
            const [year, month, day] = dateValue.split('-').map(Number);
            const date = new Date(year, month - 1, day);

            if (toDateValue(date) !== dateValue) {
                return match;
            }

            dueDate = dateValue;
            return ' ';
        });
    }

    if (details.recurrence && !dueDate) {
        dueDate = offsetDateValue(now, 0);
    }

    if (dueDate) {
        details.dueDate = dueDate;
        summary.push(formatDateValue(dueDate));
    }

    remainingText = remainingText.replace(/\b([01]\d|2[0-3]):([0-5]\d)\b/, (_match, hour, minute) => {
        const timeValue = `${hour}:${minute}`;
        details.startTime = timeValue;
        summary.push(timeValue);

        return ' ';
    });

    return {
        details,
        summary,
        text: cleanQuickAddText(remainingText),
    };
}

export { parseTodoQuickAdd };
export type { TodoQuickAddResult };
