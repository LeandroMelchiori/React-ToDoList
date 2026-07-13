import React, { ChangeEvent, FormEvent } from 'react';
import {
    TODO_DATE_TYPES,
    TODO_KINDS,
    TODO_REMINDERS,
    TODO_RECURRENCES,
    getAllowedRecurrencesForTodoKind,
    TodoKind,
    TodoPriority,
    TodoReminder,
    TodoRecurrence,
    TodoWeekday,
    TodoSubtask,
    TodoDetails,
} from '../../../App/todoModel';
import './TodoForm.css';

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

interface TodoFormProps {
    initialValue?: string;
    initialKind?: TodoKind;
    initialDescription?: string | null;
    initialPriority?: TodoPriority;
    initialDueDate?: string | null;
    initialStartDate?: string | null;
    initialEndDate?: string | null;
    initialStartTime?: string | null;
    initialEndTime?: string | null;
    initialRecurrence?: TodoRecurrence;
    initialRecurrenceDays?: TodoWeekday[];
    initialRecurrenceEndDate?: string | null;
    initialRecurrenceCount?: number | null;
    initialReminder?: TodoReminder;
    initialProject?: string | null;
    initialTags?: string[];
    initialSubtasks?: TodoSubtask[];
    label?: string;
    lockedProject?: string | null;
    mode?: 'create' | 'edit';
    onCancel: () => void;
    onSubmitTodo: (text: string, details: TodoDetails) => { ok: boolean; error?: string };
    submitLabel?: string;
}

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

function TodoForm({
    initialValue = '',
    initialKind = TODO_KINDS.task,
    initialDescription = '',
    initialPriority = 'medium',
    initialDueDate = '',
    initialStartDate = '',
    initialEndDate = '',
    initialStartTime = '',
    initialEndTime = '',
    initialRecurrence = TODO_RECURRENCES.none,
    initialRecurrenceDays = [],
    initialRecurrenceEndDate = '',
    initialRecurrenceCount = null,
    initialReminder = TODO_REMINDERS.none,
    initialProject = '',
    initialTags = [],
    initialSubtasks = [],
    label = 'Nueva tarea',
    lockedProject = null,
    mode = 'create',
    onCancel,
    onSubmitTodo,
    submitLabel = 'Agregar',
}: TodoFormProps) {
    const [newTodoValue, setNewTodoValue] = React.useState(initialValue);
    const [kindValue, setKindValue] = React.useState<TodoKind>(initialKind || TODO_KINDS.task);
    const [descriptionValue, setDescriptionValue] = React.useState(initialDescription || '');
    const [priorityValue, setPriorityValue] = React.useState<TodoPriority>(initialPriority || 'medium');
    const [dueDateValue, setDueDateValue] = React.useState(initialDueDate || '');
    const [startDateValue, setStartDateValue] = React.useState(initialStartDate || '');
    const [endDateValue, setEndDateValue] = React.useState(initialEndDate || '');
    const [startTimeValue, setStartTimeValue] = React.useState(initialStartTime || '');
    const [endTimeValue, setEndTimeValue] = React.useState(initialEndTime || '');
    const [recurrenceValue, setRecurrenceValue] = React.useState<TodoRecurrence>(initialRecurrence || TODO_RECURRENCES.none);
    const [recurrenceDaysValue, setRecurrenceDaysValue] = React.useState<TodoWeekday[]>(
        Array.isArray(initialRecurrenceDays) ? initialRecurrenceDays : []
    );
    const [recurrenceEndDateValue, setRecurrenceEndDateValue] = React.useState(initialRecurrenceEndDate || '');
    const [recurrenceCountValue, setRecurrenceCountValue] = React.useState(
        initialRecurrenceCount ? String(initialRecurrenceCount) : ''
    );
    const [reminderValue, setReminderValue] = React.useState<TodoReminder>(initialReminder || TODO_REMINDERS.none);
    const [projectValue, setProjectValue] = React.useState(lockedProject || initialProject || '');
    const [tagsValue, setTagsValue] = React.useState(Array.isArray(initialTags) ? initialTags.join(', ') : '');
    const [subtasksValue, setSubtasksValue] = React.useState<string[]>(
        Array.isArray(initialSubtasks)
            ? initialSubtasks.map(subtask => subtask.text)
            : []
    );
    const [subtaskDraft, setSubtaskDraft] = React.useState('');
    const [formError, setFormError] = React.useState('');
    const inputId = mode === 'edit' ? 'editTodo' : 'newTodo';
    const descriptionId = mode === 'edit' ? 'editTodoDescription' : 'newTodoDescription';
    const priorityId = mode === 'edit' ? 'editTodoPriority' : 'newTodoPriority';
    const recurrenceId = mode === 'edit' ? 'editTodoRecurrence' : 'newTodoRecurrence';
    const recurrenceEndDateId = mode === 'edit' ? 'editTodoRecurrenceEndDate' : 'newTodoRecurrenceEndDate';
    const recurrenceCountId = mode === 'edit' ? 'editTodoRecurrenceCount' : 'newTodoRecurrenceCount';
    const reminderId = mode === 'edit' ? 'editTodoReminder' : 'newTodoReminder';
    const dueDateId = mode === 'edit' ? 'editTodoDueDate' : 'newTodoDueDate';
    const startDateId = mode === 'edit' ? 'editTodoStartDate' : 'newTodoStartDate';
    const endDateId = mode === 'edit' ? 'editTodoEndDate' : 'newTodoEndDate';
    const startTimeId = mode === 'edit' ? 'editTodoStartTime' : 'newTodoStartTime';
    const endTimeId = mode === 'edit' ? 'editTodoEndTime' : 'newTodoEndTime';
    const projectId = mode === 'edit' ? 'editTodoProject' : 'newTodoProject';
    const tagsId = mode === 'edit' ? 'editTodoTags' : 'newTodoTags';
    const subtasksId = mode === 'edit' ? 'editTodoSubtasks' : 'newTodoSubtasks';
    const isProjectLocked = Boolean(lockedProject && mode === 'create');
    const isTaskKind = kindValue === TODO_KINDS.task;
    const isEventKind = kindValue === TODO_KINDS.event;
    const isScheduleKind = kindValue === TODO_KINDS.schedule;
    const isPeriodKind = kindValue === TODO_KINDS.period;
    const dateTypeForKind = isEventKind
        ? TODO_DATE_TYPES.event
        : isScheduleKind || isPeriodKind
            ? TODO_DATE_TYPES.period
            : TODO_DATE_TYPES.due;
    const recurrenceHintId = `${recurrenceId}-hint`;
    const recurrenceOptions = React.useMemo(() => (
        TODO_RECURRENCE_OPTIONS.filter(option =>
            getAllowedRecurrencesForTodoKind(kindValue, dateTypeForKind).includes(option.value)
        )
    ), [dateTypeForKind, kindValue]);
    const isRecurrenceDisabled = recurrenceOptions.length === 1;
    const hasRecurrence = recurrenceValue !== TODO_RECURRENCES.none;
    const isWeeklyRecurrence = recurrenceValue === TODO_RECURRENCES.weekly;
    const previewDetails = getFormPreviewDetails({
        dueDate: dueDateValue,
        endDate: endDateValue,
        endTime: endTimeValue,
        kind: kindValue,
        reminder: reminderValue,
        recurrence: recurrenceValue,
        recurrenceCount: recurrenceCountValue,
        recurrenceDays: recurrenceDaysValue,
        recurrenceEndDate: recurrenceEndDateValue,
        startDate: startDateValue,
        startTime: startTimeValue,
    });

    React.useEffect(() => {
        if (!recurrenceOptions.some(option => option.value === recurrenceValue)) {
            setRecurrenceValue(TODO_RECURRENCES.none);
        }
    }, [recurrenceOptions, recurrenceValue]);

    React.useEffect(() => {
        if (recurrenceValue !== TODO_RECURRENCES.weekly && recurrenceDaysValue.length > 0) {
            setRecurrenceDaysValue([]);
        }

        if (recurrenceValue === TODO_RECURRENCES.none) {
            setRecurrenceEndDateValue('');
            setRecurrenceCountValue('');
        }
    }, [recurrenceDaysValue.length, recurrenceValue]);

    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

    const handleKindChange = (nextKind: TodoKind) => {
        setKindValue(nextKind);
        setFormError('');

        if (nextKind === TODO_KINDS.task) {
            setEndDateValue('');
            setEndTimeValue('');
            return;
        }

        if (nextKind === TODO_KINDS.event) {
            setDueDateValue('');
            setEndDateValue('');
            setEndTimeValue('');
            setSubtasksValue([]);
            setSubtaskDraft('');
            setRecurrenceValue(TODO_RECURRENCES.none);
            return;
        }

        if (nextKind === TODO_KINDS.schedule) {
            setDueDateValue('');
            setSubtasksValue([]);
            setSubtaskDraft('');
            setRecurrenceValue(TODO_RECURRENCES.weekly);
            return;
        }

        setDueDateValue('');
        setSubtasksValue([]);
        setSubtaskDraft('');
        setRecurrenceValue(TODO_RECURRENCES.none);
    };

    const addSubtask = () => {
        const subtask = subtaskDraft.trim();

        if (!subtask) {
            return;
        }

        const alreadyExists = subtasksValue.some(item =>
            item.toLowerCase() === subtask.toLowerCase()
        );

        if (alreadyExists) {
            setFormError('Esa subtarea ya esta agregada.');
            return;
        }

        setSubtasksValue(currentSubtasks => [...currentSubtasks, subtask]);
        setSubtaskDraft('');
        setFormError('');
    };

    const removeSubtask = (subtask: string) => {
        setSubtasksValue(currentSubtasks =>
            currentSubtasks.filter(item => item !== subtask)
        );
        setFormError('');
    };

    const handleSubtaskKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        addSubtask();
    };

    const toggleRecurrenceDay = (day: TodoWeekday) => {
        setRecurrenceDaysValue(currentDays =>
            currentDays.includes(day)
                ? currentDays.filter(currentDay => currentDay !== day)
                : [...currentDays, day].sort((firstDay, secondDay) => firstDay - secondDay)
        );
        setFormError('');
    };

    const getSubmittedSubtasks = () => {
        const draftSubtask = subtaskDraft.trim();

        if (!draftSubtask) {
            return subtasksValue;
        }

        const alreadyExists = subtasksValue.some(item =>
            item.toLowerCase() === draftSubtask.toLowerCase()
        );

        if (alreadyExists) {
            setFormError('Esa subtarea ya esta agregada.');
            return null;
        }

        return [...subtasksValue, draftSubtask];
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            (isScheduleKind || isPeriodKind) &&
            startDateValue &&
            endDateValue &&
            endDateValue < startDateValue
        ) {
            setFormError('La fecha de fin no puede ser anterior al inicio.');
            return;
        }

        if (endTimeValue && !startTimeValue) {
            setFormError('Agrega una hora de inicio para usar hora de fin.');
            return;
        }

        if (
            (isScheduleKind || isPeriodKind) &&
            startTimeValue &&
            endTimeValue &&
            endTimeValue <= startTimeValue
        ) {
            setFormError('La hora de fin debe ser posterior al inicio.');
            return;
        }

        const recurrenceAnchorDate = isTaskKind
            ? dueDateValue
            : startDateValue;

        if (recurrenceValue !== TODO_RECURRENCES.none && !recurrenceAnchorDate) {
            setFormError('Agrega una fecha para poder repetir la tarea.');
            return;
        }

        if (
            recurrenceValue !== TODO_RECURRENCES.none &&
            recurrenceEndDateValue &&
            recurrenceAnchorDate &&
            recurrenceEndDateValue < recurrenceAnchorDate
        ) {
            setFormError('El fin de repeticion no puede ser anterior a la fecha base.');
            return;
        }

        if (
            recurrenceCountValue &&
            (!Number.isInteger(Number(recurrenceCountValue)) || Number(recurrenceCountValue) < 1)
        ) {
            setFormError('La cantidad de repeticiones debe ser un numero mayor a 0.');
            return;
        }

        if (reminderValue !== TODO_REMINDERS.none && !recurrenceAnchorDate) {
            setFormError('Agrega una fecha para poder usar recordatorios.');
            return;
        }

        if (!recurrenceOptions.some(option => option.value === recurrenceValue)) {
            setFormError('Esa repeticion no corresponde al tipo de fecha elegido.');
            return;
        }

        const submittedSubtasks = isTaskKind ? getSubmittedSubtasks() : [];

        if (!submittedSubtasks) {
            return;
        }

        const result = onSubmitTodo(newTodoValue, {
            kind: kindValue,
            description: descriptionValue,
            priority: priorityValue,
            dateType: dateTypeForKind,
            dueDate: isTaskKind ? dueDateValue : '',
            startDate: isTaskKind ? '' : startDateValue,
            endDate: isScheduleKind || isPeriodKind ? endDateValue : '',
            startTime: startTimeValue,
            endTime: isScheduleKind || isPeriodKind ? endTimeValue : '',
            recurrence: recurrenceValue,
            recurrenceDays: isWeeklyRecurrence ? recurrenceDaysValue : [],
            recurrenceEndDate: hasRecurrence ? recurrenceEndDateValue : '',
            recurrenceCount: hasRecurrence ? recurrenceCountValue : '',
            reminder: reminderValue,
            project: isProjectLocked ? lockedProject : projectValue,
            tags: tagsValue,
            subtasks: submittedSubtasks,
        });

        if (!result.ok) {
            setFormError(result.error || 'Error al guardar');
            return;
        }

        onCancel();
    }

    return (
        <form className="TodoForm" onSubmit={onSubmit}>
            <label htmlFor={inputId}>{label}</label>
            <textarea
                className="TodoForm-mainInput"
                id={inputId}
                placeholder="Ej: repasar preguntas tecnicas"
                value={newTodoValue}
                onChange={onChange}
                aria-invalid={Boolean(formError)}
                aria-describedby={formError ? 'newTodo-error' : undefined}
            />
            {formError && (
                <p className="TodoForm-error" id="newTodo-error">
                    {formError}
                </p>
            )}
            <fieldset className="TodoForm-kindField">
                <legend>{mode === 'create' ? 'Que queres agregar?' : 'Tipo de elemento'}</legend>
                <div className="TodoForm-kindOptions">
                    {TODO_KIND_OPTIONS.map(option => (
                        <label
                            className={kindValue === option.value ? 'TodoForm-kindOption--selected' : ''}
                            key={option.value}
                        >
                            <input
                                checked={kindValue === option.value}
                                name={`${inputId}-kind`}
                                onChange={() => handleKindChange(option.value)}
                                type="radio"
                                value={option.value}
                            />
                            <span>
                                <strong>{option.label}</strong>
                                <small>{option.hint}</small>
                            </span>
                        </label>
                    ))}
                </div>
                <p className="TodoForm-kindDecision">
                    {isTaskKind
                        ? 'Se completa y puede dividirse en subtareas.'
                        : 'Se organiza en la agenda y no modifica el progreso de tareas.'}
                </p>
            </fieldset>
            <label className="TodoForm-description" htmlFor={descriptionId}>
                Descripcion
                <textarea
                    id={descriptionId}
                    placeholder="Agrega contexto, enlaces o notas utiles"
                    value={descriptionValue}
                    onChange={event => setDescriptionValue(event.target.value)}
                />
            </label>
            <div className="TodoForm-fields">
                {isTaskKind && (
                    <>
                        <label htmlFor={priorityId}>
                            Prioridad
                            <select
                                id={priorityId}
                                value={priorityValue}
                                onChange={event => setPriorityValue(event.target.value as TodoPriority)}
                            >
                                {TODO_PRIORITY_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label htmlFor={dueDateId}>
                            Fecha limite
                            <input
                                id={dueDateId}
                                type="date"
                                value={dueDateValue}
                                onChange={event => setDueDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={startTimeId}>
                            Hora limite
                            <input
                                id={startTimeId}
                                type="time"
                                value={startTimeValue}
                                onChange={event => setStartTimeValue(event.target.value)}
                            />
                        </label>
                    </>
                )}
                {isEventKind && (
                    <>
                        <label htmlFor={startDateId}>
                            Dia del evento
                            <input
                                id={startDateId}
                                type="date"
                                value={startDateValue}
                                onChange={event => setStartDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={startTimeId}>
                            Hora del evento
                            <input
                                id={startTimeId}
                                type="time"
                                value={startTimeValue}
                                onChange={event => setStartTimeValue(event.target.value)}
                            />
                        </label>
                    </>
                )}
                {isScheduleKind && (
                    <>
                        <label htmlFor={startDateId}>
                            Primer dia
                            <input
                                id={startDateId}
                                type="date"
                                value={startDateValue}
                                onChange={event => setStartDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={endDateId}>
                            Ultimo dia
                            <input
                                id={endDateId}
                                type="date"
                                value={endDateValue}
                                onChange={event => setEndDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={startTimeId}>
                            Hora de inicio
                            <input
                                id={startTimeId}
                                type="time"
                                value={startTimeValue}
                                onChange={event => setStartTimeValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={endTimeId}>
                            Hora de fin
                            <input
                                id={endTimeId}
                                type="time"
                                value={endTimeValue}
                                onChange={event => setEndTimeValue(event.target.value)}
                            />
                        </label>
                    </>
                )}
                {isPeriodKind && (
                    <>
                        <label htmlFor={startDateId}>
                            Inicio del periodo
                            <input
                                id={startDateId}
                                type="date"
                                value={startDateValue}
                                onChange={event => setStartDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={endDateId}>
                            Fin del periodo
                            <input
                                id={endDateId}
                                type="date"
                                value={endDateValue}
                                onChange={event => setEndDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={startTimeId}>
                            Hora de inicio
                            <input
                                id={startTimeId}
                                type="time"
                                value={startTimeValue}
                                onChange={event => setStartTimeValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={endTimeId}>
                            Hora de fin
                            <input
                                id={endTimeId}
                                type="time"
                                value={endTimeValue}
                                onChange={event => setEndTimeValue(event.target.value)}
                            />
                        </label>
                    </>
                )}
                <div className="TodoForm-field">
                    <label htmlFor={recurrenceId}>
                        Repeticion
                    </label>
                    <select
                        id={recurrenceId}
                        value={recurrenceValue}
                        disabled={isRecurrenceDisabled}
                        aria-describedby={recurrenceHintId}
                        onChange={event => setRecurrenceValue(event.target.value as TodoRecurrence)}
                    >
                        {recurrenceOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <span className="TodoForm-fieldHint" id={recurrenceHintId}>
                        {TODO_RECURRENCE_HINTS[kindValue]}
                    </span>
                </div>
                {isWeeklyRecurrence && (
                    <fieldset className="TodoForm-field TodoForm-weekdayField">
                        <legend>Dias de repeticion</legend>
                        <div className="TodoForm-weekdays">
                            {TODO_WEEKDAY_OPTIONS.map(option => (
                                <label key={option.value}>
                                    <input
                                        type="checkbox"
                                        checked={recurrenceDaysValue.includes(option.value)}
                                        onChange={() => toggleRecurrenceDay(option.value)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                        <span className="TodoForm-fieldHint">
                            Si no elegis dias, se usa el dia de la fecha base.
                        </span>
                    </fieldset>
                )}
                {hasRecurrence && (
                    <>
                        <label htmlFor={recurrenceEndDateId}>
                            Finaliza el
                            <input
                                id={recurrenceEndDateId}
                                type="date"
                                value={recurrenceEndDateValue}
                                onChange={event => setRecurrenceEndDateValue(event.target.value)}
                            />
                        </label>
                        <label htmlFor={recurrenceCountId}>
                            Cantidad maxima
                            <input
                                id={recurrenceCountId}
                                type="number"
                                min="1"
                                max="999"
                                inputMode="numeric"
                                placeholder="Ej: 12"
                                value={recurrenceCountValue}
                                onChange={event => setRecurrenceCountValue(event.target.value)}
                            />
                        </label>
                    </>
                )}
                <div className="TodoForm-field">
                    <label htmlFor={reminderId}>
                        Recordatorio
                    </label>
                    <select
                        id={reminderId}
                        value={reminderValue}
                        onChange={event => setReminderValue(event.target.value as TodoReminder)}
                    >
                        {TODO_REMINDER_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <span className="TodoForm-fieldHint">
                        Usa la hora indicada o 09:00 si solo hay fecha.
                    </span>
                </div>
                <div className="TodoForm-field">
                    <label htmlFor={projectId}>
                        Proyecto
                    </label>
                    <input
                        id={projectId}
                        type="text"
                        placeholder="Ej: TaskFlow"
                        value={projectValue}
                        readOnly={isProjectLocked}
                        aria-describedby={isProjectLocked ? `${projectId}-hint` : undefined}
                        onChange={event => setProjectValue(event.target.value)}
                    />
                    {isProjectLocked && (
                        <span className="TodoForm-fieldHint" id={`${projectId}-hint`}>
                            Fijado por el proyecto filtrado actualmente.
                        </span>
                    )}
                </div>
                <label htmlFor={tagsId}>
                    Etiquetas
                    <input
                        id={tagsId}
                        type="text"
                        placeholder="react, testing"
                        value={tagsValue}
                        onChange={event => setTagsValue(event.target.value)}
                    />
                </label>
            </div>
            <aside className="TodoForm-preview" aria-label="Vista previa del elemento" aria-live="polite">
                <span>Vista previa</span>
                <strong>{TODO_KIND_PREVIEW_TITLES[kindValue]}</strong>
                <ul>
                    {previewDetails.map(detail => (
                        <li key={detail}>{detail}</li>
                    ))}
                </ul>
            </aside>
            {isTaskKind && (
                <div className="TodoForm-subtasks">
                    <label htmlFor={subtasksId}>
                        Subtareas
                    </label>
                    <div className="TodoForm-subtaskControls">
                        <input
                            id={subtasksId}
                            type="text"
                            placeholder="Ej: leer apunte"
                            value={subtaskDraft}
                            onChange={event => setSubtaskDraft(event.target.value)}
                            onKeyDown={handleSubtaskKeyDown}
                        />
                        <button type="button" onClick={addSubtask}>
                            Agregar subtarea
                        </button>
                    </div>
                    {subtasksValue.length > 0 && (
                        <ul className="TodoForm-subtaskList" aria-label="Subtareas agregadas">
                            {subtasksValue.map(subtask => (
                                <li key={subtask}>
                                    <span>{subtask}</span>
                                    <button
                                        type="button"
                                        aria-label={`Quitar subtarea ${subtask}`}
                                        onClick={() => removeSubtask(subtask)}
                                    >
                                        x
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <div className='TodoForm-buttonContainer'>
                <button
                    type="button"
                    className="TodoForm-button TodoForm-button-cancel"
                    onClick={onCancel}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    className="TodoForm-button TodoForm-button-add"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

export { TodoForm };
