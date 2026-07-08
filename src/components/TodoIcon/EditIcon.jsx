import { TodoIcon } from './TodoIcon';

function EditIcon({ onEdit }) {
    return <TodoIcon
     type="edit"
     color="var(--color-icon-muted)"
     label="Editar tarea"
     onClick={onEdit}
    />;
}

export { EditIcon };
