import React, { ChangeEvent, FormEvent } from 'react';
import {
    TODO_DATE_TYPES,
    TODO_KINDS,
    TODO_RECURRENCES,
    getAllowedRecurrencesForTodoKind,
    TodoKind,
    TodoPriority,
    TodoRecurrence,
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

function getFormPreviewDetails({
    dueDate,
    endDate,
    endTime,
    kind,
    recurrence,
    startDate,
    startTime,
}: {
    dueDate: string;
    endDate: string;
    endTime: string;
    kind: TodoKind;
    recurrence: TodoRecurrence;
    startDate: string;
    startTime: string;
}): string[] {
    if (kind === TODO_KINDS.task) {
        return [
            dueDate ? `Limite ${formatDateValue(dueDate)}` : 'Sin fecha limite',
            startTime ? `Hora limite ${startTime}` : 'Sin hora limite',
            getRecurrenceLabel(recurrence),
        ];
    }

    if (kind === TODO_KINDS.event) {
        return [
            startDate ? `Dia ${formatDateValue(startDate)}` : 'Sin dia definido',
            startTime ? `Hora ${startTime}` : 'Sin horario definido',
            getRecurrenceLabel(recurrence),
        ];
    }

    if (kind === TODO_KINDS.schedule) {
        return [
            startDate ? `Desde ${formatDateValue(startDate)}` : 'Sin primer dia',
            endDate ? `Hasta ${formatDateValue(endDate)}` : 'Sin ultimo dia',
            formatTimeRange(startTime, endTime),
            getRecurrenceLabel(recurrence),
        ];
    }

    return [
        startDate ? `Desde ${formatDateValue(startDate)}` : 'Sin inicio',
        endDate ? `Hasta ${formatDateValue(endDate)}` : 'Sin fin',
        formatTimeRange(startTime, endTime),
        'No se repite',
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
    const kindId = mode === 'edit' ? 'editTodoKind' : 'newTodoKind';
    const descriptionId = mode === 'edit' ? 'editTodoDescription' : 'newTodoDescription';
    const priorityId = mode === 'edit' ? 'editTodoPriority' : 'newTodoPriority';
    const recurrenceId = mode === 'edit' ? 'editTodoRecurrence' : 'newTodoRecurrence';
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
    const kindHint = TODO_KIND_OPTIONS.find(option => option.value === kindValue)?.hint || '';
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
    const previewDetails = getFormPreviewDetails({
        dueDate: dueDateValue,
        endDate: endDateValue,
        endTime: endTimeValue,
        kind: kindValue,
        recurrence: recurrenceValue,
        startDate: startDateValue,
        startTime: startTimeValue,
    });

    React.useEffect(() => {
        if (!recurrenceOptions.some(option => option.value === recurrenceValue)) {
            setRecurrenceValue(TODO_RECURRENCES.none);
        }
    }, [recurrenceOptions, recurrenceValue]);

    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

    const handleKindChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextKind = event.target.value as TodoKind;

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
            <div className="TodoForm-field TodoForm-kindField">
                <label htmlFor={kindId}>
                    Tipo de elemento
                </label>
                <select
                    id={kindId}
                    value={kindValue}
                    onChange={handleKindChange}
                >
                    {TODO_KIND_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <span className="TodoForm-fieldHint">
                    {kindHint}
                </span>
                <span className="TodoForm-kindDecision">
                    {isTaskKind
                        ? 'Puede completarse y usar subtareas.'
                        : 'Se agenda, pero no se marca como completado.'}
                </span>
            </div>
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
