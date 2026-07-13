import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_REMINDERS,
  TODO_RECURRENCES,
  Todo,
  TodoKind,
  TodoPriority,
  TodoReminder,
  TodoRecurrence,
  TodoWeekday,
} from '../../../App/todoModel';
import './TodoDetail.css';

const TODO_KIND_LABELS: Record<TodoKind, string> = {
  [TODO_KINDS.task]: 'Tarea',
  [TODO_KINDS.event]: 'Evento',
  [TODO_KINDS.schedule]: 'Horario',
  [TODO_KINDS.period]: 'Periodo',
};

const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const TODO_RECURRENCE_LABELS: Record<TodoRecurrence, string> = {
  [TODO_RECURRENCES.none]: '',
  [TODO_RECURRENCES.daily]: 'Diaria',
  [TODO_RECURRENCES.weekly]: 'Semanal',
  [TODO_RECURRENCES.monthly]: 'Mensual',
  [TODO_RECURRENCES.yearly]: 'Anual',
};

const TODO_REMINDER_LABELS: Record<TodoReminder, string> = {
  [TODO_REMINDERS.none]: '',
  [TODO_REMINDERS.atTime]: 'Al momento',
  [TODO_REMINDERS.tenMinutes]: '10 minutos antes',
  [TODO_REMINDERS.thirtyMinutes]: '30 minutos antes',
  [TODO_REMINDERS.oneDay]: '1 dia antes',
};

const TODO_WEEKDAY_LABELS: Record<TodoWeekday, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mie',
  4: 'Jue',
  5: 'Vie',
  6: 'Sab',
};

interface TodoDetailProps {
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onToggleComplete: () => void;
  todo: Todo;
}

function formatDateValue(dateValue?: string | null): string | null {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.split('-');

  return year && month && day ? `${day}/${month}/${year}` : dateValue;
}

function formatTimeValue(startTime?: string | null, endTime?: string | null): string | null {
  if (!startTime) {
    return null;
  }

  return endTime ? `${startTime} a ${endTime}` : startTime;
}

function getScheduleLabel(todo: Todo): string | null {
  const timeLabel = formatTimeValue(todo.startTime, todo.endTime);

  if (todo.dateType === TODO_DATE_TYPES.event) {
    const eventDate = formatDateValue(todo.startDate);

    return [eventDate ? `Dia ${eventDate}` : null, timeLabel].filter(Boolean).join(' ') || null;
  }

  if (todo.dateType === TODO_DATE_TYPES.period) {
    const startDate = formatDateValue(todo.startDate);
    const endDate = formatDateValue(todo.endDate || todo.startDate);

    if (!startDate) {
      return timeLabel;
    }

    const dateLabel = endDate && endDate !== startDate
      ? `Periodo ${startDate} - ${endDate}`
      : `Periodo ${startDate}`;

    return [dateLabel, timeLabel].filter(Boolean).join(' ');
  }

  const dueDate = formatDateValue(todo.dueDate);

  return [dueDate ? `Limite ${dueDate}` : null, timeLabel].filter(Boolean).join(' ') || null;
}

function getRecurrenceLabel(todo: Todo): string | null {
  if (todo.recurrence === TODO_RECURRENCES.none) {
    return null;
  }

  const details = [];

  if (todo.recurrence === TODO_RECURRENCES.weekly && todo.recurrenceDays.length > 0) {
    details.push(todo.recurrenceDays.map(day => TODO_WEEKDAY_LABELS[day]).join(', '));
  }

  if (todo.recurrenceEndDate) {
    details.push(`hasta ${formatDateValue(todo.recurrenceEndDate)}`);
  }

  if (todo.recurrenceCount) {
    details.push(`${todo.recurrenceCount} veces`);
  }

  const baseLabel = TODO_RECURRENCE_LABELS[todo.recurrence];

  return details.length ? `${baseLabel}: ${details.join(' - ')}` : baseLabel;
}

function TodoDetail({ onClose, onDelete, onDuplicate, onEdit, onToggleComplete, todo }: TodoDetailProps) {
  const isTask = todo.kind === TODO_KINDS.task;
  const recurrenceLabel = getRecurrenceLabel(todo);
  const reminderLabel = todo.reminder !== TODO_REMINDERS.none
    ? TODO_REMINDER_LABELS[todo.reminder]
    : null;
  const scheduleLabel = getScheduleLabel(todo);
  const completedSubtasks = todo.subtasks.filter(subtask => subtask.completed).length;
  const hasSubtasks = isTask && todo.subtasks.length > 0;
  const isCompletedBySubtasks = todo.completed &&
    todo.subtasks.length > 0 &&
    todo.subtasks.every(subtask => subtask.completed);

  return (
    <article className="TodoDetail">
      <header className="TodoDetail-header">
        <span className={`TodoDetail-kind TodoDetail-kind--${todo.kind}`}>
          {TODO_KIND_LABELS[todo.kind]}
        </span>
        <h2>{todo.text}</h2>
        {todo.description && <p>{todo.description}</p>}
      </header>

      <dl className="TodoDetail-meta">
        {isTask && (
          <>
            <div>
              <dt>Estado</dt>
              <dd>{todo.completed ? 'Completada' : 'Pendiente'}</dd>
            </div>
            <div>
              <dt>Prioridad</dt>
              <dd>{TODO_PRIORITY_LABELS[todo.priority]}</dd>
            </div>
          </>
        )}
        {scheduleLabel && (
          <div>
            <dt>Agenda</dt>
            <dd>{scheduleLabel}</dd>
          </div>
        )}
        {recurrenceLabel && (
          <div>
            <dt>Repeticion</dt>
            <dd>{recurrenceLabel}</dd>
          </div>
        )}
        {reminderLabel && (
          <div>
            <dt>Recordatorio</dt>
            <dd>{reminderLabel}</dd>
          </div>
        )}
        {todo.project && (
          <div>
            <dt>Proyecto</dt>
            <dd>{todo.project}</dd>
          </div>
        )}
        {todo.tags.length > 0 && (
          <div>
            <dt>Etiquetas</dt>
            <dd>{todo.tags.map(tag => `#${tag}`).join(', ')}</dd>
          </div>
        )}
      </dl>

      {hasSubtasks && (
        <section className="TodoDetail-subtasks" aria-label="Subtareas">
          <div className="TodoDetail-subtasksHeader">
            <h3>Subtareas</h3>
            <span>{completedSubtasks} de {todo.subtasks.length}</span>
          </div>
          <progress
            max={todo.subtasks.length}
            value={completedSubtasks}
            aria-label={`Progreso de subtareas: ${completedSubtasks} de ${todo.subtasks.length}`}
          />
          <ul>
            {todo.subtasks.map(subtask => (
              <li key={subtask.id} className={subtask.completed ? 'TodoDetail-subtask--complete' : ''}>
                {subtask.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="TodoDetail-actions">
        {isTask && (
          <button
            type="button"
            className="TodoDetail-button TodoDetail-button--success"
            disabled={isCompletedBySubtasks}
            onClick={onToggleComplete}
          >
            {isCompletedBySubtasks
              ? 'Completada por subtareas'
              : todo.completed ? 'Marcar pendiente' : 'Completar'}
          </button>
        )}
        <button type="button" className="TodoDetail-button TodoDetail-button--primary" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="TodoDetail-button" onClick={onDuplicate}>
          Duplicar
        </button>
        <button type="button" className="TodoDetail-button TodoDetail-button--danger" onClick={onDelete}>
          Eliminar
        </button>
        <button type="button" className="TodoDetail-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </article>
  );
}

export { TodoDetail };
