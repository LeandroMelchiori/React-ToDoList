import React from 'react';
import './TodoForm.css';


function TodoForm({ addTodo, toogleModal }) {
    const [newTodoValue, setNewTodoValue] = React.useState('');

    const onChange = (event) => {
        setNewTodoValue(event.target.value);
    }

    const onSubmit = (event) => {
        event.preventDefault();
        addTodo(newTodoValue);
        toogleModal();
    }

    return (
        <form onSubmit={onSubmit}>
            <label>Escribe tu nuevo TODO</label>
            <textarea
                placeholder='Cortar cebolla para el almuerzo'
                value={newTodoValue}
                onChange={onChange}
            />
            <div className='TodoForm-buttonContainer'>
                <button 
                    type='submit'
                    className='TodoForm-button TodoForm-button-add'
                >
                    Agregar</button>

                <button
                    type='button'
                    className='TodoForm-button TodoForm-button-cancel'
                    onClick={() => toogleModal()}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}

export { TodoForm };