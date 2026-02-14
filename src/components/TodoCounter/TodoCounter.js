import React from 'react';
import './TodoCounter.css';
import { TodoContext } from '../../TodoContext/TodoContext';

function TodoCounter() {

  const { totalTodos, completedTodos, loading } = React.useContext(TodoContext);

  return (
      
    loading ? <h1 className="TodoCounter">Cargando...</h1> 
      :
    totalTodos === 0 ?
      <h1 className="TodoCounter">¡No tienes TODOs agendados!</h1>
      :
    completedTodos === totalTodos ?
     <h1 className="TodoCounter">¡Has completado todos tus TODOs!</h1>
      :
    <h1 className="TodoCounter">
      Has completado <span>{completedTodos}</span> de <span>{totalTodos}</span> TODOs
      </h1>
  );
}

export { TodoCounter };
