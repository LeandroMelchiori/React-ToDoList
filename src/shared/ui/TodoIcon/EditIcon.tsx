import { TodoIcon } from './TodoIcon';

interface EditIconProps {
    onEdit: () => void;
}

function EditIcon({ onEdit }: EditIconProps) {
    return <TodoIcon
     type="edit"
     color="var(--color-icon-muted)"
     label="Ver detalle"
     onClick={onEdit}
    />;
}

export { EditIcon };
