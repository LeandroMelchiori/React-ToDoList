import React from 'react';
import type { TodoSnapshot } from '../../../App/todoSnapshotHistory';
import './TodoDataCenter.css';

type StorageEstimate = {
  quota: number;
  usage: number;
};

interface TodoDataCenterProps {
  agendaCount: number;
  archivedCount: number;
  boardCount: number;
  lastSnapshot?: TodoSnapshot | null;
  loading?: boolean;
  onCreateSnapshot: () => { ok: boolean; error?: string };
  savedViewCount: number;
  snapshotCount: number;
  taskCount: number;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 MB';
  }

  const megabytes = value / (1024 * 1024);

  return megabytes >= 1024
    ? `${(megabytes / 1024).toFixed(1)} GB`
    : `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function formatSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function TodoDataCenter({
  agendaCount,
  archivedCount,
  boardCount,
  lastSnapshot = null,
  loading = false,
  onCreateSnapshot,
  savedViewCount,
  snapshotCount,
  taskCount,
}: TodoDataCenterProps) {
  const [storageEstimate, setStorageEstimate] = React.useState<StorageEstimate | null>(null);
  const [statusMessage, setStatusMessage] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;

    if (!navigator.storage?.estimate) {
      return undefined;
    }

    navigator.storage.estimate()
      .then((estimate) => {
        if (isMounted && typeof estimate.usage === 'number' && typeof estimate.quota === 'number') {
          setStorageEstimate({ usage: estimate.usage, quota: estimate.quota });
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateSnapshot = () => {
    const result = onCreateSnapshot();

    setStatusMessage(result.ok
      ? 'Copia local creada.'
      : result.error || 'No se pudo crear la copia local.');
  };

  const metrics = [
    { label: 'Tareas', value: taskCount },
    { label: 'Agenda', value: agendaCount },
    { label: 'Archivadas', value: archivedCount },
    { label: 'Tableros', value: boardCount },
    { label: 'Filtros guardados', value: savedViewCount },
    { label: 'Copias locales', value: snapshotCount },
  ];

  return (
    <section className="TodoDataCenter" aria-labelledby="todo-data-center-title">
      <div className="TodoDataCenter-heading">
        <div>
          <h3 id="todo-data-center-title">Datos locales</h3>
          <p>La informacion se guarda en este navegador. IndexedDB es la base principal y localStorage mantiene compatibilidad.</p>
        </div>
        <span className="TodoDataCenter-localBadge">Sin backend</span>
      </div>

      <dl className="TodoDataCenter-metrics">
        {metrics.map(metric => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="TodoDataCenter-storage">
        <div>
          <strong>Almacenamiento del sitio</strong>
          <span>
            {storageEstimate
              ? `${formatBytes(storageEstimate.usage)} usados de ${formatBytes(storageEstimate.quota)}`
              : 'El navegador no informa la capacidad disponible.'}
          </span>
        </div>
        {storageEstimate && storageEstimate.quota > 0 && (
          <progress
            aria-label="Uso del almacenamiento local"
            max={storageEstimate.quota}
            value={storageEstimate.usage}
          />
        )}
      </div>

      <div className="TodoDataCenter-snapshot">
        <div>
          <strong>Ultima copia local</strong>
          <span>
            {lastSnapshot
              ? `${lastSnapshot.reason} - ${formatSnapshotDate(lastSnapshot.createdAt)}`
              : 'Todavia no hay copias disponibles.'}
          </span>
        </div>
        <button disabled={loading} onClick={handleCreateSnapshot} type="button">
          Crear copia ahora
        </button>
      </div>

      {statusMessage && <p className="TodoDataCenter-status" role="status">{statusMessage}</p>}
    </section>
  );
}

export { TodoDataCenter, formatBytes };
