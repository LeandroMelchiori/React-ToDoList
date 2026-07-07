import React from 'react';
import './UndoToast.css';

const DEFAULT_DISMISS_MS = 8000;

function UndoToast({
  dismissAfterMs = DEFAULT_DISMISS_MS,
  message,
  onDismiss,
  onUndo,
  undoLabel = 'Deshacer',
}) {
  React.useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onDismiss, dismissAfterMs);

    return () => window.clearTimeout(timeoutId);
  }, [dismissAfterMs, message, onDismiss]);

  React.useEffect(() => {
    if (!message) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, [message, onDismiss]);

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
