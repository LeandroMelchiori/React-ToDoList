import './PwaStatus.css';

function PwaStatus({ hasUpdate, isOfflineReady, isOnline, onApplyUpdate }) {
  if (!hasUpdate && isOnline && !isOfflineReady) {
    return null;
  }

  const message = hasUpdate
    ? 'Hay una nueva version disponible.'
    : !isOnline
      ? 'Sin conexion. TaskFlow sigue disponible offline.'
      : 'TaskFlow esta listo para usarse offline.';

  return (
    <div className="PwaStatus" role="status" aria-live="polite">
      <span>{message}</span>
      {hasUpdate && (
        <button type="button" onClick={onApplyUpdate}>
          Actualizar app
        </button>
      )}
    </div>
  );
}

export { PwaStatus };
