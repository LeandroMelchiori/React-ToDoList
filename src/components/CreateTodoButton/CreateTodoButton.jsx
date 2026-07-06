import './CreateTodoButton.css';

function CreateTodoButton({ onCreateTodo, loading }) {
  return (
    <button
      type="button"
      className="CreateTodoButton"
      aria-label="Crear nueva tarea"
      disabled={loading}
      onClick={onCreateTodo}
    >
      +
    </button>
  );
}

export { CreateTodoButton };
