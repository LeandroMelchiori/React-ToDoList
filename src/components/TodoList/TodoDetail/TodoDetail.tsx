import React from 'react';
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
  getTodoNextOccurrenceDate,
  isTodoOccurrenceCompleted,
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
  occurrenceDate?: string | null;
  onArchive: () => void;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onEditOccurrence?: () => void;
  onRestoreOccurrence?: (dateValue: string) => void;
  onSkipOccurrence?: () => void;
  onToggleComplete: () => void;
  onUnarchive: () => void;
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

function TodoDetail({
  occurrenceDate: selectedOccurrenceDate,
  onArchive,
  onClose,
  onDelete,
  onDuplicate,
  onEdit,
  onEditOccurrence,
  onRestoreOccurrence,
  onSkipOccurrence,
  onToggleComplete,
  onUnarchive,
  todo,
}: TodoDetailProps) {
  const isTask = todo.kind === TODO_KINDS.task;
  const isArchived = Boolean(todo.archivedAt);
  const recurrenceLabel = getRecurrenceLabel(todo);
  const reminderLabel = todo.reminder !== TODO_REMINDERS.none
    ? TODO_REMINDER_LABELS[todo.reminder]
    : null;
  const scheduleLabel = getScheduleLabel(todo);
  const isRecurring = todo.recurrence !== TODO_RECURRENCES.none;
  const occurrenceDate = selectedOccurrenceDate || getTodoNextOccurrenceDate(todo);
  const occurrenceCompleted = isTodoOccurrenceCompleted(todo, occurrenceDate);
  const isRecurringTask = isTask && isRecurring;
  const completedOccurrences = [...todo.completedOccurrences].sort().reverse();
  const sortedTimeBlocks = [...todo.timeBlocks].sort((firstBlock, secondBlock) =>
    firstBlock.date.localeCompare(secondBlock.date) || firstBlock.startTime.localeCompare(secondBlock.startTime)
  );
  const [areSubtasksOpen, setAreSubtasksOpen] = React.useState(todo.subtasks.length <= 5);
  const completedSubtasks = todo.subtasks.filter(subtask => subtask.completed).length;
  const hasSubtasks = isTask && todo.subtasks.length > 0;
  const isCompletedBySubtasks = !isRecurringTask && todo.completed &&
    todo.subtasks.length > 0 &&
    todo.subtasks.every(subtask => subtask.completed);

  return (
    <article className="TodoDetail">
      <header className="TodoDetail-header">
        <button
          type="button"
          className="TodoDetail-close"
          aria-label="Cerrar detalle"
          onClick={onClose}
        >
          ×
        </button>
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
              <dd>{isArchived ? 'Archivada' : isRecurringTask ? 'Serie activa' : todo.completed ? 'Completada' : 'Pendiente'}</dd>
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
        {occurrenceDate && (
          <div>
            <dt>{selectedOccurrenceDate ? 'Fecha seleccionada' : 'Proxima ocurrencia'}</dt>
            <dd>
              {formatDateValue(occurrenceDate)} · {occurrenceCompleted ? 'Realizada' : 'Pendiente'}
            </dd>
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
        {todo.archivedAt && (
          <div>
            <dt>Archivada</dt>
            <dd>{formatDateValue(todo.archivedAt.slice(0, 10))}</dd>
          </div>
        )}
        {todo.createdAt && (
          <div>
            <dt>Creada</dt>
            <dd>{formatDateValue(todo.createdAt.slice(0, 10))}</dd>
          </div>
        )}
        {completedOccurrences.length > 0 && (
          <div>
            <dt>Realizaciones</dt>
            <dd>
              {completedOccurrences.length} · Ultima {formatDateValue(completedOccurrences[0])}
            </dd>
          </div>
        )}
        {todo.tags.length > 0 && (
          <div>
            <dt>Etiquetas</dt>
            <dd>{todo.tags.map(tag => `#${tag}`).join(', ')}</dd>
          </div>
        )}
      </dl>

      {isTask && sortedTimeBlocks.length > 0 && (
        <section className="TodoDetail-timeBlocks" aria-labelledby="todo-detail-time-blocks-title">
          <h3 id="todo-detail-time-blocks-title">Bloques de trabajo</h3>
          <ul>
            {sortedTimeBlocks.map(timeBlock => (
              <li key={timeBlock.id}>
                <time dateTime={`${timeBlock.date}T${timeBlock.startTime}`}>
                  {formatDateValue(timeBlock.date)}
                </time>
                <span>{timeBlock.startTime} a {timeBlock.endTime}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {todo.excludedOccurrences.length > 0 && (
        <section className="TodoDetail-exceptions" aria-labelledby="todo-detail-exceptions-title">
          <h3 id="todo-detail-exceptions-title">Fechas omitidas</h3>
          <ul>
            {todo.excludedOccurrences.map(dateValue => (
              <li key={dateValue}>
                <span>{formatDateValue(dateValue)}</span>
                <button type="button" onClick={() => onRestoreOccurrence?.(dateValue)}>
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasSubtasks && (
        <details
          className="TodoDetail-subtasks"
          aria-label="Subtareas"
          open={areSubtasksOpen}
          onToggle={(event) => setAreSubtasksOpen(event.currentTarget.open)}
        >
          <summary className="TodoDetail-subtasksHeader">
            <span>Subtareas</span>
            <span>{completedSubtasks} de {todo.subtasks.length}</span>
          </summary>
          <div className="TodoDetail-subtasksBody">
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
          </div>
        </details>
      )}

      <div className="TodoDetail-actions">
        {isTask && !isArchived && (
          <button
            type="button"
            className="TodoDetail-button TodoDetail-button--success"
            disabled={isCompletedBySubtasks}
            onClick={onToggleComplete}
          >
            {isRecurringTask && occurrenceDate
              ? `${occurrenceCompleted ? 'Marcar pendiente' : 'Completar'} ${formatDateValue(occurrenceDate)}`
              : isCompletedBySubtasks
              ? 'Completada por subtareas'
              : todo.completed ? 'Marcar pendiente' : 'Completar'}
          </button>
        )}
        {isTask && !isRecurringTask && todo.completed && !isArchived && (
          <button type="button" className="TodoDetail-button" onClick={onArchive}>
            Archivar
          </button>
        )}
        {isArchived && (
          <button type="button" className="TodoDetail-button TodoDetail-button--primary" onClick={onUnarchive}>
            Restaurar
          </button>
        )}
        {isRecurring && occurrenceDate && onEditOccurrence && (
          <button type="button" className="TodoDetail-button TodoDetail-button--primary" onClick={onEditOccurrence}>
            Editar esta fecha
          </button>
        )}
        {isRecurring && occurrenceDate && onSkipOccurrence && (
          <button type="button" className="TodoDetail-button" onClick={onSkipOccurrence}>
            Omitir {formatDateValue(occurrenceDate)}
          </button>
        )}
        <button type="button" className="TodoDetail-button TodoDetail-button--primary" onClick={onEdit}>
          {isRecurring ? 'Editar serie' : 'Editar'}
        </button>
        <button type="button" className="TodoDetail-button" onClick={onDuplicate}>
          Duplicar
        </button>
        <button type="button" className="TodoDetail-button TodoDetail-button--danger" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </article>
  );
}

export { TodoDetail };
