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

  return (
    <li className="TodoItem">
      <CompleteIcon 
        completed={props.completed}
        onComplete={props.onComplete}
      />
      <p className={`TodoItem-p ${props.completed ? 'TodoItem-p--complete' : ''}`}>
        {props.text}
      </p>
      <div className="TodoItem-meta" aria-label="Detalles de la tarea">
        <span className={`TodoItem-priority TodoItem-priority--${props.priority || 'medium'}`}>
          {priorityLabel}
        </span>
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
