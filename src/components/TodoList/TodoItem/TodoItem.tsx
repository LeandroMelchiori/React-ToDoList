import './TodoItem.css';
import { CompleteIcon } from '../../TodoIcon/CompleteIcon';
import { DeleteIcon } from '../../TodoIcon/DeleteIcon';
import { EditIcon } from '../../TodoIcon/EditIcon';
import { MoveIcon } from '../../TodoIcon/MoveIcon';
import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';

import React from 'react';
import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_REMINDERS,
  TODO_RECURRENCES,
  TodoDateType,
  TodoKind,
  TodoPriority,
  TodoReminder,
  TodoRecurrence,
  TodoWeekday,
  TodoSubtask,
} from '../../../App/todoModel';

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
  [TODO_REMINDERS.atTime]: 'Recordatorio al momento',
  [TODO_REMINDERS.tenMinutes]: 'Recordatorio 10 min antes',
  [TODO_REMINDERS.thirtyMinutes]: 'Recordatorio 30 min antes',
  [TODO_REMINDERS.oneDay]: 'Recordatorio 1 dia antes',
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

const TODO_KIND_LABELS: Record<TodoKind, string> = {
  [TODO_KINDS.task]: 'Tarea',
  [TODO_KINDS.event]: 'Evento',
  [TODO_KINDS.schedule]: 'Horario',
  [TODO_KINDS.period]: 'Periodo',
};

function formatDateValue(dateValue?: string | null) {
    if (!dateValue) {
        return null;
    }

    const [year, month, day] = dateValue.split('-');

    if (!year || !month || !day) {
        return dateValue;
    }

    return `${day}/${month}/${year}`;
}

function formatTimeValue(startTime?: string | null, endTime?: string | null) {
  if (!startTime) {
    return null;
  }

  return endTime ? `${startTime} a ${endTime}` : startTime;
}

function formatRecurrenceLabel(
  recurrence?: TodoRecurrence,
  recurrenceDays: TodoWeekday[] = [],
  recurrenceEndDate?: string | null,
  recurrenceCount?: number | null
) {
  if (!recurrence || recurrence === TODO_RECURRENCES.none) {
    return null;
  }

  const details = [];

  if (recurrence === TODO_RECURRENCES.weekly && recurrenceDays.length) {
    details.push(recurrenceDays.map(day => TODO_WEEKDAY_LABELS[day]).join(', '));
  }

  if (recurrenceEndDate) {
    details.push(`hasta ${formatDateValue(recurrenceEndDate)}`);
  }

  if (recurrenceCount) {
    details.push(`${recurrenceCount} veces`);
  }

  const baseLabel = TODO_RECURRENCE_LABELS[recurrence];

  return details.length ? `${baseLabel}: ${details.join(' - ')}` : baseLabel;
}

function joinScheduleWithTime(schedule: string | null, startTime?: string | null, endTime?: string | null) {
  const timeLabel = formatTimeValue(startTime, endTime);

  if (!schedule) {
    return null;
  }

  return timeLabel ? `${schedule} ${timeLabel}` : schedule;
}

function getScheduleLabel(
  dateType: TodoDateType = TODO_DATE_TYPES.due,
  dueDate?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  startTime?: string | null,
  endTime?: string | null,
) {
  if (dateType === TODO_DATE_TYPES.event) {
    const eventDate = formatDateValue(startDate);

    return joinScheduleWithTime(eventDate ? `Dia ${eventDate}` : null, startTime);
  }

  if (dateType === TODO_DATE_TYPES.period) {
    const periodStart = formatDateValue(startDate);
    const periodEnd = formatDateValue(endDate || startDate);

    if (!periodStart) {
      return null;
    }

    const periodLabel = periodEnd && periodEnd !== periodStart
      ? `Periodo ${periodStart} - ${periodEnd}`
      : `Periodo ${periodStart}`;

    return joinScheduleWithTime(periodLabel, startTime, endTime);
  }

  const formattedDueDate = formatDateValue(dueDate);

  return joinScheduleWithTime(formattedDueDate ? `Limite ${formattedDueDate}` : null, startTime);
}

interface TodoItemProps {
  text: string;
  kind?: TodoKind;
  description?: string | null;
  completed: boolean;
  priority?: TodoPriority;
  dateType?: TodoDateType;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  recurrence?: TodoRecurrence;
  recurrenceDays?: TodoWeekday[];
  recurrenceEndDate?: string | null;
  recurrenceCount?: number | null;
  reminder?: TodoReminder;
  archivedAt?: string | null;
  project?: string | null;
  tags?: string[];
  subtasks?: TodoSubtask[];
  isDragging?: boolean;
  dropPosition?: 'before' | 'after' | null;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleSubtask: (id: string) => void;
  onFilterProject?: () => void;
  onFilterTag?: (tag: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

function TodoItem(props: TodoItemProps) {
  const kind = props.kind || TODO_KINDS.task;
  const isTaskKind = kind === TODO_KINDS.task;
  const scheduleLabel = getScheduleLabel(
    props.dateType,
    props.dueDate,
    props.startDate,
    props.endDate,
    props.startTime,
    props.endTime
  );
  const priorityLabel = props.priority ? TODO_PRIORITY_LABELS[props.priority] : TODO_PRIORITY_LABELS.medium;
  const recurrenceLabel = formatRecurrenceLabel(
    props.recurrence,
    props.recurrenceDays,
    props.recurrenceEndDate,
    props.recurrenceCount
  );
  const reminderLabel = props.reminder && props.reminder !== TODO_REMINDERS.none
    ? TODO_REMINDER_LABELS[props.reminder]
    : null;
  const isArchived = Boolean(props.archivedAt);
  const tags = Array.isArray(props.tags) ? props.tags : [];
  const subtasks = Array.isArray(props.subtasks) ? props.subtasks : [];
  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const hasSubtasks = isTaskKind && subtasks.length > 0;
  const [isChecklistExpanded, setIsChecklistExpanded] = React.useState(() => subtasks.length <= 3);
  const checklistId = React.useId();
  const subtaskProgressLabel = `${completedSubtasks} de ${subtasks.length}`;
  const isCompletedBySubtasks = props.completed &&
    subtasks.length > 0 &&
    subtasks.every(subtask => subtask.completed);
  const itemClassName = [
    'TodoItem',
    `TodoItem--${kind}`,
    props.completed ? 'TodoItem--complete' : '',
    isArchived ? 'TodoItem--archived' : '',
    props.isDragging ? 'TodoItem--dragging' : '',
    props.dropPosition === 'before' ? 'TodoItem--dropBefore' : '',
    props.dropPosition === 'after' ? 'TodoItem--dropAfter' : '',
  ].filter(Boolean).join(' ');

  return (
    <li
      className={itemClassName}
      draggable={Boolean(props.onDragStart)}
      onDragStart={props.onDragStart}
      onDragOver={props.onDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
      onDragEnd={props.onDragEnd}
    >
      <div
        className="TodoItem-orderActions"
        role="group"
        aria-label={`Ordenar tarea ${props.text}`}
        onKeyDown={handleButtonGroupNavigation}
      >
        <MoveIcon
          direction="up"
          disabled={!props.canMoveUp}
          onMove={props.onMoveUp || (() => {})}
        />
        <MoveIcon
          direction="down"
          disabled={!props.canMoveDown}
          onMove={props.onMoveDown || (() => {})}
        />
      </div>
      {isTaskKind && (
        <CompleteIcon
          completed={props.completed}
          disabled={isCompletedBySubtasks}
          onComplete={props.onComplete}
        />
      )}
      <div className="TodoItem-main">
        <div className="TodoItem-content">
          <p className={`TodoItem-p ${props.completed ? 'TodoItem-p--complete' : ''}`}>
            {props.text}
          </p>
          {props.description && (
            <p className="TodoItem-description">
              {props.description}
            </p>
          )}
          {hasSubtasks && (
            <div className="TodoItem-checklist">
              <button
                type="button"
                className="TodoItem-checklistSummary"
                aria-controls={checklistId}
                aria-expanded={isChecklistExpanded}
                aria-label={`${isChecklistExpanded ? 'Ocultar' : 'Ver'} subtareas de ${props.text}: ${subtaskProgressLabel}`}
                onClick={() => setIsChecklistExpanded(currentValue => !currentValue)}
              >
                <span className="TodoItem-checklistTitle">
                  Subtareas
                </span>
                <span className="TodoItem-checklistCount">
                  {subtaskProgressLabel}
                </span>
                <span className="TodoItem-checklistToggle" aria-hidden="true">
                  {isChecklistExpanded ? 'Ocultar' : 'Ver'}
                </span>
              </button>
              <progress
                className="TodoItem-checklistProgress"
                max={subtasks.length}
                value={completedSubtasks}
                aria-label={`Progreso de subtareas de ${props.text}: ${subtaskProgressLabel}`}
              />
              <div id={checklistId} hidden={!isChecklistExpanded}>
                <ul className="TodoItem-subtasks" aria-label={`Checklist de ${props.text}`}>
                  {subtasks.map(subtask => (
                    <li className="TodoItem-subtask" key={subtask.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => props.onToggleSubtask(subtask.id)}
                        />
                        <span className={subtask.completed ? 'TodoItem-subtaskText--complete' : ''}>
                          {subtask.text}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="TodoItem-meta" aria-label="Detalles de la tarea">
          {!isTaskKind && (
            <span className={`TodoItem-kind TodoItem-kind--${kind}`}>
              {TODO_KIND_LABELS[kind]}
            </span>
          )}
          {isTaskKind && (
            <span className={`TodoItem-priority TodoItem-priority--${props.priority || 'medium'}`}>
              {priorityLabel}
            </span>
          )}
          {props.project && (
            <button
              type="button"
              className="TodoItem-project"
              aria-label={`Filtrar por proyecto ${props.project}`}
              onClick={props.onFilterProject || (() => {})}
            >
              {props.project}
            </button>
          )}
          {tags.map(tag => (
            <button
              type="button"
              className="TodoItem-tag"
              key={tag}
              aria-label={`Filtrar por etiqueta ${tag}`}
              onClick={() => props.onFilterTag?.(tag)}
            >
              #{tag}
            </button>
          ))}
          {scheduleLabel && (
            <span className="TodoItem-dueDate">
              {scheduleLabel}
            </span>
          )}
          {recurrenceLabel && (
            <span className="TodoItem-recurrence">
              {recurrenceLabel}
            </span>
          )}
          {reminderLabel && (
            <span className="TodoItem-reminder">
              {reminderLabel}
            </span>
          )}
          {isArchived && (
            <span className="TodoItem-archive">
              Archivada
            </span>
          )}
        </div>
      </div>
      <EditIcon 
        onEdit={props.onEdit}
      />
      <DeleteIcon 
        onDelete={props.onDelete}
      />
    </li>
  );
}

export { TodoItem };
