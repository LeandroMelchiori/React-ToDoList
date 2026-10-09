import './TodoBulkActions.css';

interface TodoBulkActionsProps {
  allVisibleSelected: boolean;
  isSelectionMode: boolean;
  message?: string;
  onArchive: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onStart: () => void;
  selectedCount: number;
  visibleCount: number;
}

function TodoBulkActions({
  allVisibleSelected,
  isSelectionMode,
  message = '',
  onArchive,
  onCancel,
  onComplete,
  onDelete,
  onSelectAll,
  onStart,
  selectedCount,
  visibleCount,
}: TodoBulkActionsProps) {
  if (!isSelectionMode && visibleCount === 0) {
    return null;
  }

  if (!isSelectionMode) {
    return (
      <div className="TodoBulkActions TodoBulkActions--idle">
        <button type="button" onClick={onStart}>Seleccionar tareas</button>
      </div>
    );
  }

  return (
    <section className="TodoBulkActions TodoBulkActions--active" aria-label="Acciones masivas">
      <div className="TodoBulkActions-summary">
        <strong>{selectedCount} seleccionadas</strong>
        {message && <span aria-live="polite">{message}</span>}
      </div>
      <div className="TodoBulkActions-buttons">
        <button type="button" onClick={onSelectAll} disabled={visibleCount === 0}>
          {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
        </button>
        <button type="button" onClick={onComplete} disabled={selectedCount === 0}>Completar</button>
        <button type="button" onClick={onArchive} disabled={selectedCount === 0}>Archivar completadas</button>
        <button
          type="button"
          className="TodoBulkActions-danger"
          onClick={onDelete}
          disabled={selectedCount === 0}
        >
          Eliminar
        </button>
        <button type="button" onClick={onCancel}>Cerrar seleccion</button>
      </div>
    </section>
  );
}

export { TodoBulkActions };
