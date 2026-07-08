import { TodoIcon } from './TodoIcon';

function DeleteIcon({ onDelete }) {
    return <TodoIcon
     type="delete"
     color="var(--color-icon-muted)"
     label="Eliminar tarea"
     onClick={onDelete}
    />;
}

export { DeleteIcon };
