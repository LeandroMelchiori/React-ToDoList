import './CreateTodoButton.css';

function CreateTodoButton({ toggleModal, loading }) {
  return (
    <button
      type="button"
      className="CreateTodoButton"
      aria-label="Crear nueva tarea"
      disabled={loading}
      onClick={toggleModal}
    >
      +
    </button>
  );
}

export { CreateTodoButton };
