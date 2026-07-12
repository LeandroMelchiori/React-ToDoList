import React, { ChangeEvent, FormEvent } from 'react';
import {
    TODO_DATE_TYPES,
    TODO_RECURRENCES,
    getAllowedRecurrencesForDateType,
    TodoDateType,
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

const TODO_DATE_TYPE_OPTIONS: Array<{ value: TodoDateType; label: string }> = [
    { value: TODO_DATE_TYPES.due, label: 'Fecha limite' },
    { value: TODO_DATE_TYPES.event, label: 'Dia especifico' },
    { value: TODO_DATE_TYPES.period, label: 'Periodo' },
];

const TODO_RECURRENCE_OPTIONS: Array<{ value: TodoRecurrence; label: string }> = [
    { value: TODO_RECURRENCES.none, label: 'No se repite' },
    { value: TODO_RECURRENCES.daily, label: 'Diaria' },
    { value: TODO_RECURRENCES.weekly, label: 'Semanal' },
    { value: TODO_RECURRENCES.monthly, label: 'Mensual' },
    { value: TODO_RECURRENCES.yearly, label: 'Anual' },
];

const TODO_RECURRENCE_HINTS: Record<TodoDateType, string> = {
    [TODO_DATE_TYPES.due]: 'Se calcula desde la fecha limite.',
    [TODO_DATE_TYPES.event]: 'Un dia especifico no puede ser rutina diaria.',
    [TODO_DATE_TYPES.period]: 'Los periodos se muestran como rangos unicos por ahora.',
};

interface TodoFormProps {
    initialValue?: string;
    initialDescription?: string | null;
    initialPriority?: TodoPriority;
    initialDateType?: TodoDateType;
    initialDueDate?: string | null;
    initialStartDate?: string | null;
    initialEndDate?: string | null;
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

function TodoForm({
    initialValue = '',
    initialDescription = '',
    initialPriority = 'medium',
    initialDateType = TODO_DATE_TYPES.due,
    initialDueDate = '',
    initialStartDate = '',
    initialEndDate = '',
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
    const [descriptionValue, setDescriptionValue] = React.useState(initialDescription || '');
    const [priorityValue, setPriorityValue] = React.useState<TodoPriority>(initialPriority || 'medium');
    const [dateTypeValue, setDateTypeValue] = React.useState<TodoDateType>(initialDateType || TODO_DATE_TYPES.due);
    const [dueDateValue, setDueDateValue] = React.useState(initialDueDate || '');
    const [startDateValue, setStartDateValue] = React.useState(initialStartDate || '');
    const [endDateValue, setEndDateValue] = React.useState(initialEndDate || '');
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
    const descriptionId = mode === 'edit' ? 'editTodoDescription' : 'newTodoDescription';
    const priorityId = mode === 'edit' ? 'editTodoPriority' : 'newTodoPriority';
    const dateTypeId = mode === 'edit' ? 'editTodoDateType' : 'newTodoDateType';
    const recurrenceId = mode === 'edit' ? 'editTodoRecurrence' : 'newTodoRecurrence';
    const dueDateId = mode === 'edit' ? 'editTodoDueDate' : 'newTodoDueDate';
    const startDateId = mode === 'edit' ? 'editTodoStartDate' : 'newTodoStartDate';
    const endDateId = mode === 'edit' ? 'editTodoEndDate' : 'newTodoEndDate';
    const projectId = mode === 'edit' ? 'editTodoProject' : 'newTodoProject';
    const tagsId = mode === 'edit' ? 'editTodoTags' : 'newTodoTags';
    const subtasksId = mode === 'edit' ? 'editTodoSubtasks' : 'newTodoSubtasks';
    const isProjectLocked = Boolean(lockedProject && mode === 'create');
    const recurrenceHintId = `${recurrenceId}-hint`;
    const recurrenceOptions = React.useMemo(() => (
        TODO_RECURRENCE_OPTIONS.filter(option =>
            getAllowedRecurrencesForDateType(dateTypeValue).includes(option.value)
        )
    ), [dateTypeValue]);
    const isRecurrenceDisabled = recurrenceOptions.length === 1;

    React.useEffect(() => {
        if (!recurrenceOptions.some(option => option.value === recurrenceValue)) {
            setRecurrenceValue(TODO_RECURRENCES.none);
        }
    }, [recurrenceOptions, recurrenceValue]);

    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

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
            dateTypeValue === TODO_DATE_TYPES.period &&
            startDateValue &&
            endDateValue &&
            endDateValue < startDateValue
        ) {
            setFormError('La fecha de fin no puede ser anterior al inicio.');
            return;
        }

        const recurrenceAnchorDate = dateTypeValue === TODO_DATE_TYPES.due
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

        const submittedSubtasks = getSubmittedSubtasks();

        if (!submittedSubtasks) {
            return;
        }

        const result = onSubmitTodo(newTodoValue, {
            description: descriptionValue,
            priority: priorityValue,
            dateType: dateTypeValue,
            dueDate: dueDateValue,
            startDate: startDateValue,
            endDate: endDateValue,
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
                <label htmlFor={dateTypeId}>
                    Tipo de fecha
                    <select
                        id={dateTypeId}
                        value={dateTypeValue}
                        onChange={event => setDateTypeValue(event.target.value as TodoDateType)}
                    >
                        {TODO_DATE_TYPE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                {dateTypeValue === TODO_DATE_TYPES.due && (
                    <label htmlFor={dueDateId}>
                        Fecha limite
                        <input
                            id={dueDateId}
                            type="date"
                            value={dueDateValue}
                            onChange={event => setDueDateValue(event.target.value)}
                        />
                    </label>
                )}
                {dateTypeValue === TODO_DATE_TYPES.event && (
                    <label htmlFor={startDateId}>
                        Dia de la tarea
                        <input
                            id={startDateId}
                            type="date"
                            value={startDateValue}
                            onChange={event => setStartDateValue(event.target.value)}
                        />
                    </label>
                )}
                {dateTypeValue === TODO_DATE_TYPES.period && (
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
                        {TODO_RECURRENCE_HINTS[dateTypeValue]}
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
