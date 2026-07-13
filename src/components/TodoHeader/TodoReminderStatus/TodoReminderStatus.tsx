import { ReminderPermission } from '../../../App/useTodoReminders';
import './TodoReminderStatus.css';

interface TodoReminderStatusProps {
  isSupported: boolean;
  permission: ReminderPermission;
  scheduledCount: number;
  onRequestPermission: () => Promise<ReminderPermission>;
}

function getReminderStatusText(permission: ReminderPermission, scheduledCount: number): string {
  if (permission === 'unsupported') {
    return 'Este navegador no soporta notificaciones locales.';
  }

  if (permission === 'denied') {
    return 'Permiso bloqueado. Activarlo requiere cambiar la configuracion del navegador.';
  }

  if (permission === 'granted') {
    return scheduledCount === 1
      ? '1 recordatorio programado.'
      : `${scheduledCount} recordatorios programados.`;
  }

  return 'Activa el permiso para recibir avisos locales mientras TaskFlow este abierto.';
}

function TodoReminderStatus({
  isSupported,
  permission,
  scheduledCount,
  onRequestPermission,
}: TodoReminderStatusProps) {
  const canRequestPermission = isSupported && permission === 'default';

  return (
    <section className="TodoReminderStatus" aria-label="Recordatorios">
      <div>
        <h3>Recordatorios</h3>
        <p>{getReminderStatusText(permission, scheduledCount)}</p>
      </div>
      <button
        type="button"
        disabled={!canRequestPermission}
        onClick={() => {
          void onRequestPermission();
        }}
      >
        {permission === 'granted' ? 'Activos' : 'Activar'}
      </button>
    </section>
  );
}

export { TodoReminderStatus };
