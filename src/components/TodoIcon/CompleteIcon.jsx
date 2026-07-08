import { TodoIcon } from "./TodoIcon";

function CompleteIcon({ completed, onComplete }) {
    return <TodoIcon
        type="check"
        color={completed ? 'var(--color-success)' : 'var(--color-icon-muted)'}
        label={completed ? "Marcar tarea como pendiente" : "Marcar tarea como completada"}
        onClick={onComplete}
    />;
}

export { CompleteIcon };
