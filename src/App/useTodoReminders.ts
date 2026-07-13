import React from 'react';
import {
  TODO_KINDS,
  TODO_REMINDERS,
  Todo,
  getTodoReminderTarget,
} from './todoModel';

type ReminderPermission = NotificationPermission | 'unsupported';

const MAX_TIMEOUT_MS = 2_147_483_647;

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function getInitialPermission(): ReminderPermission {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  return window.Notification.permission;
}

function getReminderBody(todo: Todo, target: Date): string {
  const timeLabel = target.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateLabel = target.toLocaleDateString();
  const scheduleLabel = `${dateLabel} ${timeLabel}`;

  if (todo.kind === TODO_KINDS.task) {
    return `Tenes pendiente "${todo.text}". Aviso programado para ${scheduleLabel}.`;
  }

  return `${todo.text}. Aviso programado para ${scheduleLabel}.`;
}

function useTodoReminders(todos: Todo[]) {
  const [permission, setPermission] = React.useState<ReminderPermission>(getInitialPermission);
  const [clockTick, setClockTick] = React.useState(() => Date.now());
  const notifiedRemindersRef = React.useRef(new Set<string>());
  const isSupported = permission !== 'unsupported';

  React.useEffect(() => {
    if (!isSupported) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [isSupported]);

  const scheduledReminders = React.useMemo(() => {
    const now = new Date(clockTick);

    return todos
      .filter(todo => todo.reminder && todo.reminder !== TODO_REMINDERS.none)
      .map(todo => ({
        todo,
        target: getTodoReminderTarget(todo, now),
      }))
      .filter((item): item is { todo: Todo; target: Date } => Boolean(item.target));
  }, [clockTick, todos]);

  React.useEffect(() => {
    if (permission !== 'granted' || !isNotificationSupported()) {
      return undefined;
    }

    const timeoutIds = scheduledReminders.map(({ todo, target }) => {
      const reminderKey = `${todo.id}-${target.toISOString()}`;
      const timeoutMs = target.getTime() - Date.now();

      if (
        timeoutMs <= 0 ||
        timeoutMs > MAX_TIMEOUT_MS ||
        notifiedRemindersRef.current.has(reminderKey)
      ) {
        return null;
      }

      return window.setTimeout(() => {
        if (notifiedRemindersRef.current.has(reminderKey)) {
          return;
        }

        notifiedRemindersRef.current.add(reminderKey);

        new window.Notification('TaskFlow', {
          body: getReminderBody(todo, target),
          tag: reminderKey,
        });
      }, timeoutMs);
    });

    return () => {
      timeoutIds.forEach(timeoutId => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      });
    };
  }, [permission, scheduledReminders]);

  const requestPermission = React.useCallback(async () => {
    if (!isNotificationSupported()) {
      setPermission('unsupported');
      return 'unsupported' as const;
    }

    const nextPermission = await window.Notification.requestPermission();
    setPermission(nextPermission);

    return nextPermission;
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    scheduledCount: scheduledReminders.length,
  };
}

export { useTodoReminders };
export type { ReminderPermission };
