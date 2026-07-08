import './CreateTodoButton.css';

function CreateTodoButton({ onCreateTodo, loading }) {
  return (
    <button
      type="button"
      className="CreateTodoButton"
      aria-label="Crear nueva tarea"
      aria-keyshortcuts="N"
      disabled={loading}
      onClick={onCreateTodo}
    >
      <span className="CreateTodoButton-symbol" aria-hidden="true">+</span>
      <span className="CreateTodoButton-label">Nueva tarea</span>
    </button>
  );
}

export { CreateTodoButton };
