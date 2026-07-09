import './DeleteTodoDialog.css';

interface DeleteTodoDialogProps {
  todoText: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteTodoDialog({ todoText, onCancel, onConfirm }: DeleteTodoDialogProps) {
  return (
    <div className="DeleteTodoDialog">
      <h2>Eliminar tarea</h2>
      <p>
        Vas a eliminar <strong>{todoText}</strong>. Esta accion no se puede deshacer.
      </p>
      <div className="DeleteTodoDialog-buttonContainer">
        <button
          type="button"
          className="DeleteTodoDialog-button DeleteTodoDialog-button-cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="DeleteTodoDialog-button DeleteTodoDialog-button-delete"
          onClick={onConfirm}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

export { DeleteTodoDialog };
