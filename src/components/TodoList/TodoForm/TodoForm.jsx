import React from 'react';
import './TodoForm.css';

const TODO_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
];

function TodoForm({
    initialValue = '',
    initialPriority = 'medium',
    initialDueDate = '',
    initialProject = '',
    initialTags = [],
    label = 'Nueva tarea',
    mode = 'create',
    onCancel,
    onSubmitTodo,
    submitLabel = 'Agregar',
}) {
    const [newTodoValue, setNewTodoValue] = React.useState(initialValue);
    const [priorityValue, setPriorityValue] = React.useState(initialPriority || 'medium');
    const [dueDateValue, setDueDateValue] = React.useState(initialDueDate || '');
    const [projectValue, setProjectValue] = React.useState(initialProject || '');
    const [tagsValue, setTagsValue] = React.useState(Array.isArray(initialTags) ? initialTags.join(', ') : '');
    const [formError, setFormError] = React.useState('');
    const inputId = mode === 'edit' ? 'editTodo' : 'newTodo';
    const priorityId = mode === 'edit' ? 'editTodoPriority' : 'newTodoPriority';
    const dueDateId = mode === 'edit' ? 'editTodoDueDate' : 'newTodoDueDate';
    const projectId = mode === 'edit' ? 'editTodoProject' : 'newTodoProject';
    const tagsId = mode === 'edit' ? 'editTodoTags' : 'newTodoTags';

    const onChange = (event) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

    const onSubmit = (event) => {
        event.preventDefault();
        const result = onSubmitTodo(newTodoValue, {
            priority: priorityValue,
            dueDate: dueDateValue,
            project: projectValue,
            tags: tagsValue,
        });

        if (!result.ok) {
            setFormError(result.error);
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
                        onChange={event => setPriorityValue(event.target.value)}
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
