import './PwaStatus.css';

interface PwaStatusProps {
  hasUpdate?: boolean;
  isOfflineReady?: boolean;
  isOnline?: boolean;
  onApplyUpdate: () => void;
}

function PwaStatus({ hasUpdate, isOfflineReady, isOnline, onApplyUpdate }: PwaStatusProps) {
  const shouldShowStatus = hasUpdate || !isOnline || isOfflineReady;

  const message = hasUpdate
    ? 'Hay una nueva version disponible.'
    : !isOnline
      ? 'Sin conexion. TaskFlow sigue disponible offline.'
      : 'TaskFlow esta listo para usarse offline.';

  return (
    <div className="PwaStatusSlot" aria-hidden={shouldShowStatus ? undefined : 'true'}>
      {shouldShowStatus && (
        <div className="PwaStatus" role="status" aria-live="polite">
          <span>{message}</span>
          {hasUpdate && (
            <button type="button" onClick={onApplyUpdate}>
              Actualizar app
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { PwaStatus };
