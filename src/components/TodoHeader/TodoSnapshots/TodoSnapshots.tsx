import React from 'react';
import type { TodoSnapshot } from '../../../App/todoSnapshotHistory';
import './TodoSnapshots.css';

interface TodoSnapshotsProps {
  loading?: boolean;
  snapshots: TodoSnapshot[];
  onDeleteSnapshot: (snapshotId: string) => boolean;
  onRestoreSnapshot: (snapshotId: string) => { ok: boolean; error?: string };
}

function formatSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function TodoSnapshots({
  loading = false,
  snapshots,
  onDeleteSnapshot,
  onRestoreSnapshot,
}: TodoSnapshotsProps) {
  const [statusMessage, setStatusMessage] = React.useState('');

  const handleRestore = (snapshot: TodoSnapshot) => {
    const confirmed = window.confirm(
      'Se reemplazara el workspace actual. Antes se guardara otra copia automatica.'
    );

    if (!confirmed) {
      return;
    }

    const result = onRestoreSnapshot(snapshot.id);
    setStatusMessage(result.ok ? 'Copia restaurada.' : result.error || 'No se pudo restaurar la copia.');
  };

  const handleDelete = (snapshotId: string) => {
    if (onDeleteSnapshot(snapshotId)) {
      setStatusMessage('Copia eliminada.');
    }
  };

  return (
    <section className="TodoSnapshots" aria-labelledby="todo-snapshots-title">
      <div className="TodoSnapshots-heading">
        <h3 id="todo-snapshots-title">Copias automaticas</h3>
        <span>Se conservan las 5 mas recientes antes de cambios destructivos</span>
      </div>

      {snapshots.length === 0 ? (
        <p className="TodoSnapshots-empty">Todavia no fue necesario crear una copia.</p>
      ) : (
        <ul className="TodoSnapshots-list">
          {snapshots.map(snapshot => (
            <li key={snapshot.id}>
              <div>
                <strong>{snapshot.reason}</strong>
                <time dateTime={snapshot.createdAt}>{formatSnapshotDate(snapshot.createdAt)}</time>
              </div>
              <div className="TodoSnapshots-actions">
                <button disabled={loading} onClick={() => handleRestore(snapshot)} type="button">
                  Restaurar
                </button>
                <button
                  className="TodoSnapshots-delete"
                  disabled={loading}
                  onClick={() => handleDelete(snapshot.id)}
                  type="button"
                >
                  Eliminar copia
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {statusMessage && <p className="TodoSnapshots-status" role="status">{statusMessage}</p>}
    </section>
  );
}

export { TodoSnapshots };
