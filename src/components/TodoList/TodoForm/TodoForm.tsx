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
    TodoTimeBlock,
    TodoDetails,
} from '../../../App/todoModel';
import type { TodoScheduleConflictMatch } from '../../../App/todoScheduleConflicts';
import {
    TODO_KIND_OPTIONS,
    TODO_KIND_PREVIEW_TITLES,
    TODO_PRIORITY_OPTIONS,
    TODO_RECURRENCE_HINTS,
    TODO_RECURRENCE_OPTIONS,
    TODO_REMINDER_OPTIONS,
    TODO_WEEKDAY_OPTIONS,
    formatDateValue,
    getFormPreviewDetails,
} from './todoFormPresentation';
import './TodoForm.css';

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
    initialTimeBlocks?: TodoTimeBlock[];
    label?: string;
    lockedProject?: string | null;
    lockRecurrence?: boolean;
    mode?: 'create' | 'edit';
    onCancel: () => void;
    onCheckConflicts?: (text: string, details: TodoDetails) => TodoScheduleConflictMatch[];
    onSubmitTodo: (text: string, details: TodoDetails) => { ok: boolean; error?: string };
    submitLabel?: string;
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
    initialTimeBlocks = [],
    label = 'Nueva tarea',
    lockedProject = null,
    lockRecurrence = false,
    mode = 'create',
    onCancel,
    onCheckConflicts,
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
    const [timeBlocksValue, setTimeBlocksValue] = React.useState<TodoTimeBlock[]>(
        Array.isArray(initialTimeBlocks) ? initialTimeBlocks.map(timeBlock => ({ ...timeBlock })) : []
    );
    const [timeBlockDate, setTimeBlockDate] = React.useState('');
    const [timeBlockStartTime, setTimeBlockStartTime] = React.useState('');
    const [timeBlockEndTime, setTimeBlockEndTime] = React.useState('');
    const [formError, setFormError] = React.useState('');
    const [conflictMatches, setConflictMatches] = React.useState<TodoScheduleConflictMatch[]>([]);
    const [pendingConflictDetails, setPendingConflictDetails] = React.useState<TodoDetails | null>(null);
    const startTimeInputRef = React.useRef<HTMLInputElement>(null);
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
    const timeBlockDateId = mode === 'edit' ? 'editTodoTimeBlockDate' : 'newTodoTimeBlockDate';
    const timeBlockStartId = mode === 'edit' ? 'editTodoTimeBlockStart' : 'newTodoTimeBlockStart';
    const timeBlockEndId = mode === 'edit' ? 'editTodoTimeBlockEnd' : 'newTodoTimeBlockEnd';
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
        lockRecurrence
            ? TODO_RECURRENCE_OPTIONS.filter(option => option.value === TODO_RECURRENCES.none)
            : TODO_RECURRENCE_OPTIONS.filter(option =>
            getAllowedRecurrencesForTodoKind(kindValue, dateTypeForKind).includes(option.value)
        )
    ), [dateTypeForKind, kindValue, lockRecurrence]);
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

    React.useEffect(() => {
        setConflictMatches([]);
        setPendingConflictDetails(null);
    }, [
        dueDateValue,
        endDateValue,
        endTimeValue,
        kindValue,
        recurrenceDaysValue,
        recurrenceEndDateValue,
        recurrenceValue,
        startDateValue,
        startTimeValue,
    ]);

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
            setTimeBlocksValue([]);
            setRecurrenceValue(TODO_RECURRENCES.none);
            return;
        }

        if (nextKind === TODO_KINDS.schedule) {
            setDueDateValue('');
            setSubtasksValue([]);
            setSubtaskDraft('');
            setTimeBlocksValue([]);
            setRecurrenceValue(lockRecurrence ? TODO_RECURRENCES.none : TODO_RECURRENCES.weekly);
            return;
        }

        setDueDateValue('');
        setSubtasksValue([]);
        setSubtaskDraft('');
        setTimeBlocksValue([]);
        setRecurrenceValue(TODO_RECURRENCES.none);
    };

    const addTimeBlock = () => {
        if (!timeBlockDate || !timeBlockStartTime || !timeBlockEndTime) {
            setFormError('Completa la fecha, el inicio y el fin del bloque de trabajo.');
            return;
        }

        if (timeBlockEndTime <= timeBlockStartTime) {
            setFormError('El bloque de trabajo debe terminar despues de comenzar.');
            return;
        }

        const alreadyExists = timeBlocksValue.some(timeBlock =>
            timeBlock.date === timeBlockDate &&
            timeBlock.startTime === timeBlockStartTime &&
            timeBlock.endTime === timeBlockEndTime
        );

        if (alreadyExists) {
            setFormError('Ese bloque de trabajo ya esta agregado.');
            return;
        }

        setTimeBlocksValue(currentTimeBlocks => [
            ...currentTimeBlocks,
            {
                id: `time-block-${Date.now()}-${currentTimeBlocks.length}`,
                date: timeBlockDate,
                startTime: timeBlockStartTime,
                endTime: timeBlockEndTime,
            },
        ]);
        setTimeBlockDate('');
        setTimeBlockStartTime('');
        setTimeBlockEndTime('');
        setFormError('');
    };

    const removeTimeBlock = (timeBlockId: string) => {
        setTimeBlocksValue(currentTimeBlocks =>
            currentTimeBlocks.filter(timeBlock => timeBlock.id !== timeBlockId)
        );
        setFormError('');
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

    const saveTodo = (details: TodoDetails) => {
        const result = onSubmitTodo(newTodoValue, details);

        if (!result.ok) {
            setFormError(result.error || 'Error al guardar');
            return;
        }

        onCancel();
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

        if (isTaskKind && (timeBlockDate || timeBlockStartTime || timeBlockEndTime)) {
            setFormError('Agrega o limpia el bloque de trabajo que esta en preparacion.');
            return;
        }

        const submittedSubtasks = isTaskKind ? getSubmittedSubtasks() : [];

        if (!submittedSubtasks) {
            return;
        }

        const details: TodoDetails = {
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
            timeBlocks: isTaskKind ? timeBlocksValue : [],
            subtasks: submittedSubtasks,
        };
        const conflicts = onCheckConflicts?.(newTodoValue, details) || [];

        if (conflicts.length > 0) {
            setConflictMatches(conflicts);
            setPendingConflictDetails(details);
            return;
        }

        saveTodo(details);
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
                                ref={startTimeInputRef}
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
                                ref={startTimeInputRef}
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
                                ref={startTimeInputRef}
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
                                ref={startTimeInputRef}
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
                        {lockRecurrence
                            ? 'Esta fecha sera independiente de la serie.'
                            : TODO_RECURRENCE_HINTS[kindValue]}
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
            {isTaskKind && (
                <fieldset className="TodoForm-timeBlocks">
                    <legend>Bloques de trabajo</legend>
                    <p>Reserva tiempo para avanzar. La tarea sigue siendo una sola y se completa por separado.</p>
                    <div className="TodoForm-timeBlockFields">
                        <label htmlFor={timeBlockDateId}>
                            Fecha
                            <input
                                id={timeBlockDateId}
                                type="date"
                                value={timeBlockDate}
                                onChange={event => setTimeBlockDate(event.target.value)}
                            />
                        </label>
                        <label htmlFor={timeBlockStartId}>
                            Inicio
                            <input
                                id={timeBlockStartId}
                                type="time"
                                value={timeBlockStartTime}
                                onChange={event => setTimeBlockStartTime(event.target.value)}
                            />
                        </label>
                        <label htmlFor={timeBlockEndId}>
                            Fin
                            <input
                                id={timeBlockEndId}
                                type="time"
                                value={timeBlockEndTime}
                                onChange={event => setTimeBlockEndTime(event.target.value)}
                            />
                        </label>
                        <button type="button" onClick={addTimeBlock}>Agregar bloque</button>
                    </div>
                    {timeBlocksValue.length > 0 && (
                        <ul aria-label="Bloques de trabajo agregados">
                            {timeBlocksValue.map(timeBlock => (
                                <li key={timeBlock.id}>
                                    <span>
                                        {formatDateValue(timeBlock.date)} · {timeBlock.startTime} a {timeBlock.endTime}
                                    </span>
                                    <button
                                        aria-label={`Quitar bloque del ${formatDateValue(timeBlock.date)} de ${timeBlock.startTime} a ${timeBlock.endTime}`}
                                        onClick={() => removeTimeBlock(timeBlock.id)}
                                        type="button"
                                    >
                                        x
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </fieldset>
            )}
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
            {conflictMatches.length > 0 && pendingConflictDetails && (
                <section className="TodoForm-conflict" role="alert" aria-labelledby="todo-form-conflict-title">
                    <strong id="todo-form-conflict-title">Este horario se superpone</strong>
                    <p>Coincide con:</p>
                    <ul>
                        {conflictMatches.map(match => (
                            <li key={match.todoId}>
                                {match.text} desde {formatDateValue(match.firstDate)}
                                {match.occurrences > 1 ? ` (${match.occurrences} coincidencias)` : ''}
                            </li>
                        ))}
                    </ul>
                    <div>
                        <button
                            type="button"
                            onClick={() => startTimeInputRef.current?.focus()}
                        >
                            Cambiar horario
                        </button>
                        <button
                            className="TodoForm-conflictConfirm"
                            type="button"
                            onClick={() => saveTodo(pendingConflictDetails)}
                        >
                            Guardar de todos modos
                        </button>
                    </div>
                </section>
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
