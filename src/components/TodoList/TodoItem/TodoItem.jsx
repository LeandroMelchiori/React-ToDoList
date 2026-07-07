import './TodoItem.css';
import { CompleteIcon } from '../../TodoIcon/CompleteIcon';
import { DeleteIcon } from '../../TodoIcon/DeleteIcon';
import { EditIcon } from '../../TodoIcon/EditIcon';

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
      <CompleteIcon 
        completed={props.completed}
        onComplete={props.onComplete}
      />
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
          <span className="TodoItem-project">
            {props.project}
          </span>
        )}
        {tags.map(tag => (
          <span className="TodoItem-tag" key={tag}>
            #{tag}
          </span>
        ))}
        {dueDateLabel && (
          <span className="TodoItem-dueDate">
            {dueDateLabel}
          </span>
        )}
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
