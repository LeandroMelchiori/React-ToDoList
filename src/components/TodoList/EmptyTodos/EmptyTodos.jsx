import './EmptyTodos.css';

function EmptyTodos() {
  return (
    <div className="EmptyTodo-container">
        <p className="EmptyTodo-completeIcon" aria-hidden="true"></p>
        <div>
          <p className="EmptyTodo-title">Todavia no hay tareas</p>
          <p className="EmptyTodo-text">Crea una tarea para empezar a organizar tu dia.</p>
        </div>
    </div>
  )
}

export { EmptyTodos };
