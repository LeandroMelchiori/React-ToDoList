import React from 'react';
import './TodoForm.css';


function TodoForm({ addTodo, toggleModal }) {
    const [newTodoValue, setNewTodoValue] = React.useState('');
    const [formError, setFormError] = React.useState('');

    const onChange = (event) => {
        setNewTodoValue(event.target.value);
        setFormError('');
    }

    const onSubmit = (event) => {
        event.preventDefault();
        const result = addTodo(newTodoValue);

        if (!result.ok) {
            setFormError(result.error);
            return;
        }

        toggleModal();
    }

    return (
        <form className="TodoForm" onSubmit={onSubmit}>
            <label htmlFor="newTodo">Nueva tarea</label>
            <textarea
                id="newTodo"
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
                    onClick={toggleModal}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    className="TodoForm-button TodoForm-button-add"
                >
                    Agregar
                </button>
            </div>
        </form>
    );
}

export { TodoForm };
