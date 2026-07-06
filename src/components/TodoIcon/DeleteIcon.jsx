import { TodoIcon } from './TodoIcon';

function DeleteIcon({ onDelete }) {
    return <TodoIcon
     type="delete"
     color="#94a3b8"
     label="Eliminar tarea"
     onClick={onDelete}
    />;
}

export { DeleteIcon };
