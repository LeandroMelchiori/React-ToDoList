import './TodoCounter.css';

function TodoCounter( {totalTodos, completedTodos, loading} ) {

  return (
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
