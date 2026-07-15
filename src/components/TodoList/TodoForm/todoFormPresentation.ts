import {
    TODO_KINDS,
    TODO_REMINDERS,
    TODO_RECURRENCES,
} from '../../../App/todoModel';
import type {
    TodoKind,
    TodoReminder,
    TodoRecurrence,
    TodoWeekday,
} from '../../../App/todoModel';

const TODO_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
];

const TODO_KIND_OPTIONS: Array<{ value: TodoKind; label: string; hint: string }> = [
    {
        value: TODO_KINDS.task,
        label: 'Tarea',
        hint: 'Algo que se completa y puede tener subtareas.',
    },
    {
        value: TODO_KINDS.event,
        label: 'Evento',
        hint: 'Algo que sucede en un dia y horario.',
    },
    {
        value: TODO_KINDS.schedule,
        label: 'Horario',
        hint: 'Un bloque fijo como cursada, taller o rutina de agenda.',
    },
    {
        value: TODO_KINDS.period,
        label: 'Periodo',
        hint: 'Un rango importante, como inscripciones o fechas abiertas.',
    },
];

const TODO_RECURRENCE_OPTIONS: Array<{ value: TodoRecurrence; label: string }> = [
    { value: TODO_RECURRENCES.none, label: 'No se repite' },
    { value: TODO_RECURRENCES.daily, label: 'Diaria' },
    { value: TODO_RECURRENCES.weekly, label: 'Semanal' },
    { value: TODO_RECURRENCES.monthly, label: 'Mensual' },
    { value: TODO_RECURRENCES.yearly, label: 'Anual' },
];

const TODO_REMINDER_OPTIONS: Array<{ value: TodoReminder; label: string }> = [
    { value: TODO_REMINDERS.none, label: 'Sin recordatorio' },
    { value: TODO_REMINDERS.atTime, label: 'Al momento' },
    { value: TODO_REMINDERS.tenMinutes, label: '10 minutos antes' },
    { value: TODO_REMINDERS.thirtyMinutes, label: '30 minutos antes' },
    { value: TODO_REMINDERS.oneDay, label: '1 dia antes' },
];

const TODO_WEEKDAY_OPTIONS: Array<{ value: TodoWeekday; label: string }> = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mie' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sab' },
    { value: 0, label: 'Dom' },
];

const TODO_RECURRENCE_HINTS: Record<TodoKind, string> = {
    [TODO_KINDS.task]: 'Se calcula desde la fecha limite.',
    [TODO_KINDS.event]: 'Util para eventos que vuelven semanal, mensual o anualmente.',
    [TODO_KINDS.schedule]: 'Ideal para cursadas o bloques fijos de agenda.',
    [TODO_KINDS.period]: 'Los periodos son rangos unicos y no se repiten.',
};

const TODO_KIND_PREVIEW_TITLES: Record<TodoKind, string> = {
    [TODO_KINDS.task]: 'Tarea completable',
    [TODO_KINDS.event]: 'Evento de agenda',
    [TODO_KINDS.schedule]: 'Bloque de horario',
    [TODO_KINDS.period]: 'Rango activo',
};

function formatDateValue(dateValue: string): string {
    const [year, month, day] = dateValue.split('-');

    return year && month && day ? `${day}/${month}/${year}` : dateValue;
}

function formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime) {
        return 'Sin horario definido';
    }

    return endTime ? `${startTime} a ${endTime}` : startTime;
}

function getRecurrenceLabel(recurrence: TodoRecurrence): string {
    return TODO_RECURRENCE_OPTIONS.find(option => option.value === recurrence)?.label || 'No se repite';
}

function getReminderLabel(reminder: TodoReminder): string {
    return TODO_REMINDER_OPTIONS.find(option => option.value === reminder)?.label || 'Sin recordatorio';
}

function getRecurrenceSummary(
    recurrence: TodoRecurrence,
    recurrenceDays: TodoWeekday[],
    recurrenceEndDate: string,
    recurrenceCount: string
): string {
    const recurrenceLabel = getRecurrenceLabel(recurrence);

    if (recurrence === TODO_RECURRENCES.none) {
        return recurrenceLabel;
    }

    const details = [];

    if (recurrence === TODO_RECURRENCES.weekly && recurrenceDays.length > 0) {
        const dayLabels = TODO_WEEKDAY_OPTIONS
            .filter(option => recurrenceDays.includes(option.value))
            .map(option => option.label)
            .join(', ');

        details.push(dayLabels);
    }

    if (recurrenceEndDate) {
        details.push(`hasta ${formatDateValue(recurrenceEndDate)}`);
    }

    if (recurrenceCount) {
        details.push(`${recurrenceCount} veces`);
    }

    return details.length ? `${recurrenceLabel}: ${details.join(' - ')}` : recurrenceLabel;
}

function getFormPreviewDetails({
    dueDate,
    endDate,
    endTime,
    kind,
    reminder,
    recurrence,
    recurrenceCount,
    recurrenceDays,
    recurrenceEndDate,
    startDate,
    startTime,
}: {
    dueDate: string;
    endDate: string;
    endTime: string;
    kind: TodoKind;
    reminder: TodoReminder;
    recurrence: TodoRecurrence;
    recurrenceCount: string;
    recurrenceDays: TodoWeekday[];
    recurrenceEndDate: string;
    startDate: string;
    startTime: string;
}): string[] {
    if (kind === TODO_KINDS.task) {
        return [
            dueDate ? `Limite ${formatDateValue(dueDate)}` : 'Sin fecha limite',
            startTime ? `Hora limite ${startTime}` : 'Sin hora limite',
            getRecurrenceSummary(recurrence, recurrenceDays, recurrenceEndDate, recurrenceCount),
            getReminderLabel(reminder),
        ];
    }

    if (kind === TODO_KINDS.event) {
        return [
            startDate ? `Dia ${formatDateValue(startDate)}` : 'Sin dia definido',
            startTime ? `Hora ${startTime}` : 'Sin horario definido',
            getRecurrenceSummary(recurrence, recurrenceDays, recurrenceEndDate, recurrenceCount),
            getReminderLabel(reminder),
        ];
    }

    if (kind === TODO_KINDS.schedule) {
        return [
            startDate ? `Desde ${formatDateValue(startDate)}` : 'Sin primer dia',
            endDate ? `Hasta ${formatDateValue(endDate)}` : 'Sin ultimo dia',
            formatTimeRange(startTime, endTime),
            getRecurrenceSummary(recurrence, recurrenceDays, recurrenceEndDate, recurrenceCount),
            getReminderLabel(reminder),
        ];
    }

    return [
        startDate ? `Desde ${formatDateValue(startDate)}` : 'Sin inicio',
        endDate ? `Hasta ${formatDateValue(endDate)}` : 'Sin fin',
        formatTimeRange(startTime, endTime),
        'No se repite',
        getReminderLabel(reminder),
    ];
}

export {
    TODO_KIND_OPTIONS,
    TODO_KIND_PREVIEW_TITLES,
    TODO_PRIORITY_OPTIONS,
    TODO_RECURRENCE_HINTS,
    TODO_RECURRENCE_OPTIONS,
    TODO_REMINDER_OPTIONS,
    TODO_WEEKDAY_OPTIONS,
    formatDateValue,
    getFormPreviewDetails,
};

