import './BulkDeleteDialog.css';

interface BulkDeleteDialogProps {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

function BulkDeleteDialog({ count, onCancel, onConfirm }: BulkDeleteDialogProps) {
  return (
    <section className="BulkDeleteDialog">
      <h2>Eliminar seleccion</h2>
      <p>Se eliminaran {count} elementos de este tablero.</p>
      <div>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="button" className="BulkDeleteDialog-danger" onClick={onConfirm}>
          Eliminar {count}
        </button>
      </div>
    </section>
  );
}

export { BulkDeleteDialog };
