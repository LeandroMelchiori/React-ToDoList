import './TodoCounter.css';

function TodoCounter({ totalTodos, completedTodos, loading }) {
  if (loading) {
    return <h1 className="TodoCounter TodoCounter--loading" id="app-title">Cargando...</h1>;
  }

  if (totalTodos === 0) {
    return <h1 className="TodoCounter" id="app-title">Organiza tu dia con una primera tarea</h1>;
  }

  if (completedTodos === totalTodos) {
    return <h1 className="TodoCounter" id="app-title">Completaste todas tus tareas</h1>;
  }

  return (
    <h1 className="TodoCounter" id="app-title">
      Completaste <span>{completedTodos}</span> de <span>{totalTodos}</span> tareas
    </h1>
  );
}

export { TodoCounter };
