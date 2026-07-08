import { TodoIcon } from './TodoIcon';

interface EditIconProps {
    onEdit: () => void;
}

function EditIcon({ onEdit }: EditIconProps) {
    return <TodoIcon
     type="edit"
     color="var(--color-icon-muted)"
     label="Editar tarea"
     onClick={onEdit}
    />;
}

export { EditIcon };
