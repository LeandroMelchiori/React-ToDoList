import { TodoIcon } from './TodoIcon';

function EditIcon({ onEdit }) {
    return <TodoIcon
     type="edit"
     color="#94a3b8"
     label="Editar tarea"
     onClick={onEdit}
    />;
}

export { EditIcon };
