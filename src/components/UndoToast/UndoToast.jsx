import './UndoToast.css';

function UndoToast({ message, onDismiss, onUndo, undoLabel = 'Deshacer' }) {
  if (!message) {
    return null;
  }

  return (
    <div className="UndoToast" role="status" aria-live="polite">
      <p>{message}</p>
      <div className="UndoToast-actions">
        <button type="button" className="UndoToast-undo" onClick={onUndo}>
          {undoLabel}
        </button>
        <button
          type="button"
          className="UndoToast-dismiss"
          aria-label="Cerrar aviso"
          onClick={onDismiss}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export { UndoToast };
