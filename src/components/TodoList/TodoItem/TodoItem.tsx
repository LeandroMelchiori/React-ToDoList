import './TodoItem.css';
import { CompleteIcon } from '../../TodoIcon/CompleteIcon';
import { DeleteIcon } from '../../TodoIcon/DeleteIcon';
import { EditIcon } from '../../TodoIcon/EditIcon';
import { MoveIcon } from '../../TodoIcon/MoveIcon';
import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';

import React from 'react';
import { TodoPriority, TodoSubtask } from '../../../App/todoModel';

const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
};

function formatDueDate(dueDate?: string | null) {
    if (!dueDate) {
        return null;
    }

    const [year, month, day] = dueDate.split('-');

    if (!year || !month || !day) {
        return dueDate;
    }

    return `${day}/${month}/${year}`;
}

interface TodoItemProps {
  text: string;
  completed: boolean;
  priority?: TodoPriority;
  dueDate?: string | null;
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
  const dueDateLabel = formatDueDate(props.dueDate);
  const priorityLabel = props.priority ? TODO_PRIORITY_LABELS[props.priority] : TODO_PRIORITY_LABELS.medium;
  const tags = Array.isArray(props.tags) ? props.tags : [];
  const subtasks = Array.isArray(props.subtasks) ? props.subtasks : [];
  const itemClassName = [
    'TodoItem',
    props.completed ? 'TodoItem--complete' : '',
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
      <CompleteIcon 
        completed={props.completed}
        onComplete={props.onComplete}
      />
      <div className="TodoItem-main">
        <div className="TodoItem-content">
          <p className={`TodoItem-p ${props.completed ? 'TodoItem-p--complete' : ''}`}>
            {props.text}
          </p>
          {subtasks.length > 0 && (
            <div className="TodoItem-checklist">
              <span className="TodoItem-checklistLabel">
                Subtareas
              </span>
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
          )}
        </div>
        <div className="TodoItem-meta" aria-label="Detalles de la tarea">
          <span className={`TodoItem-priority TodoItem-priority--${props.priority || 'medium'}`}>
            {priorityLabel}
          </span>
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
          {dueDateLabel && (
            <span className="TodoItem-dueDate">
              {dueDateLabel}
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
