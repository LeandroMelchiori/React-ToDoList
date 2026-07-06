import './TodoCounter.css';

function TodoCounter({ totalTodos, completedTodos, loading }) {
  if (loading) {
    return <h1 className="TodoCounter TodoCounter--loading">Cargando...</h1>;
  }

  if (totalTodos === 0) {
    return <h1 className="TodoCounter">Organiza tu dia con una primera tarea</h1>;
  }

  if (completedTodos === totalTodos) {
    return <h1 className="TodoCounter">Completaste todas tus tareas</h1>;
  }

  return (
    <h1 className="TodoCounter">
      Completaste <span>{completedTodos}</span> de <span>{totalTodos}</span> tareas
    </h1>
  );
}

export { TodoCounter };
