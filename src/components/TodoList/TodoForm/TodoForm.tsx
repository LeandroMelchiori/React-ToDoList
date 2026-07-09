import React, { ChangeEvent, FormEvent } from 'react';
import { TodoPriority, TodoSubtask, TodoDetails } from '../../../App/todoModel';
import './TodoForm.css';

const TODO_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
];

interface TodoFormProps {
    initialValue?: string;
    initialPriority?: TodoPriority;
    initialDueDate?: string | null;
    initialProject?: string | null;
    initialTags?: string[];
    initialSubtasks?: TodoSubtask[];
    label?: string;
    mode?: 'create' | 'edit';
    onCancel: () => void;
    onSubmitTodo: (text: string, details: TodoDetails) => { ok: boolean; error?: string };
    submitLabel?: string;
}

function TodoForm({
    initialValue = '',
    initialPriority = 'medium',
    initialDueDate = '',
    initialProject = '',
    initialTags = [],
    initialSubtasks = [],
    label = 'Nueva tarea',
    mode = 'create',
    onCancel,
    onSubmitTodo,
    submitLabel = 'Agregar',
}: TodoFormProps) {
    const [newTodoValue, setNewTodoValue] = React.useState(initialValue);
    const [priorityValue, setPriorityValue] = React.useState<TodoPriority>(initialPriority || 'medium');
    const [dueDateValue, setDueDateValue] = React.useState(initialDueDate || '');
    const [projectValue, setProjectValue] = React.useState(initialProject || '');
    const [tagsValue, setTagsValue] = React.useState(Array.isArray(initialTags) ? initialTags.join(', ') : '');
    const [subtasksValue, setSubtasksValue] = React.useState(
        Array.isArray(initialSubtasks)
            ? initialSubtasks.map(subtask => subtask.text).join('\n')
            : ''
    );
    const [formError, setFormError] = React.useState('');
    const inputId = mode === 'edit' ? 'editTodo' : 'newTodo';
    const priorityId = mode === 'edit' ? 'editTodoPriority' : 'newTodoPriority';
    const dueDateId = mode === 'edit' ? 'editTodoDueDate' : 'newTodoDueDate';
    const projectId = mode === 'edit' ? 'editTodoProject' : 'newTodoProject';
    const tagsId = mode === 'edit' ? 'editTodoTags' : 'newTodoTags';
    const subtasksId = mode === 'edit' ? 'editTodoSubtasks' : 'newTodoSubtasks';

    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const result = onSubmitTodo(newTodoValue, {
            priority: priorityValue,
            dueDate: dueDateValue,
            project: projectValue,
            tags: tagsValue,
            subtasks: subtasksValue,
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
                <label htmlFor={dueDateId}>
                    Fecha limite
                    <input
                        id={dueDateId}
                        type="date"
                        value={dueDateValue}
                        onChange={event => setDueDateValue(event.target.value)}
                    />
                </label>
                <label htmlFor={projectId}>
                    Proyecto
                    <input
                        id={projectId}
                        type="text"
                        placeholder="Ej: TaskFlow"
                        value={projectValue}
                        onChange={event => setProjectValue(event.target.value)}
                    />
                </label>
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
            <label className="TodoForm-subtasks" htmlFor={subtasksId}>
                Subtareas
                <textarea
                    id={subtasksId}
                    placeholder="Una subtarea por linea"
                    value={subtasksValue}
                    onChange={event => setSubtasksValue(event.target.value)}
                />
            </label>
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
