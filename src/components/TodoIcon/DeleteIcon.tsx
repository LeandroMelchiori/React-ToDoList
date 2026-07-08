import { TodoIcon } from './TodoIcon';

interface DeleteIconProps {
    onDelete: () => void;
}

function DeleteIcon({ onDelete }: DeleteIconProps) {
    return <TodoIcon
     type="delete"
     color="var(--color-icon-muted)"
     label="Eliminar tarea"
     onClick={onDelete}
    />;
}

export { DeleteIcon };
