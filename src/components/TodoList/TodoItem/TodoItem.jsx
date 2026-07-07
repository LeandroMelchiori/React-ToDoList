import './TodoItem.css';
import { CompleteIcon } from '../../TodoIcon/CompleteIcon';
import { DeleteIcon } from '../../TodoIcon/DeleteIcon';
import { EditIcon } from '../../TodoIcon/EditIcon';
import { MoveIcon } from '../../TodoIcon/MoveIcon';

const TODO_PRIORITY_LABELS = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
};

function formatDueDate(dueDate) {
    if (!dueDate) {
        return null;
    }

    const [year, month, day] = dueDate.split('-');

    if (!year || !month || !day) {
        return dueDate;
    }

    return `${day}/${month}/${year}`;
}

function TodoItem(props) {
  const dueDateLabel = formatDueDate(props.dueDate);
  const priorityLabel = TODO_PRIORITY_LABELS[props.priority] || TODO_PRIORITY_LABELS.medium;
  const tags = Array.isArray(props.tags) ? props.tags : [];
  const subtasks = Array.isArray(props.subtasks) ? props.subtasks : [];

  return (
    <li className="TodoItem">
      <div className="TodoItem-orderActions" aria-label="Ordenar tarea">
        <MoveIcon
          direction="up"
          disabled={!props.canMoveUp}
          onMove={props.onMoveUp}
        />
        <MoveIcon
          direction="down"
          disabled={!props.canMoveDown}
          onMove={props.onMoveDown}
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
              onClick={props.onFilterProject}
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
              onClick={() => props.onFilterTag(tag)}
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
