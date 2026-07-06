import React from 'react';
import './TodoForm.css';


function TodoForm({
    initialValue = '',
    label = 'Nueva tarea',
    mode = 'create',
    onCancel,
    onSubmitTodo,
    submitLabel = 'Agregar',
}) {
    const [newTodoValue, setNewTodoValue] = React.useState(initialValue);
    const [formError, setFormError] = React.useState('');
    const inputId = mode === 'edit' ? 'editTodo' : 'newTodo';

    const onChange = (event) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

    const onSubmit = (event) => {
        event.preventDefault();
        const result = onSubmitTodo(newTodoValue);

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
