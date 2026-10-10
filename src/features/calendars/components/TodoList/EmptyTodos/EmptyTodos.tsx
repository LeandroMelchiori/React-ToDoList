import './EmptyTodos.css';

function EmptyTodos() {
  return (
    <div className="EmptyTodo-container">
      <div className="EmptyTodo-content">
        <p className="EmptyTodo-title" id="emptyTodos-title">Todavia no hay tareas</p>
        <p className="EmptyTodo-text">Agrega tu primera tarea con el botón + o importa un backup de tu agenda.</p>
      </div>
    </div>
  );
}

export { EmptyTodos };
