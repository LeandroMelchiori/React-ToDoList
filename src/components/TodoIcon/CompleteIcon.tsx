import { TodoIcon } from "./TodoIcon";

interface CompleteIconProps {
    completed: boolean;
    onComplete: () => void;
}

function CompleteIcon({ completed, onComplete }: CompleteIconProps) {
    return <TodoIcon
        type="check"
        color={completed ? 'var(--color-success)' : 'var(--color-icon-muted)'}
        label={completed ? "Marcar tarea como pendiente" : "Marcar tarea como completada"}
        onClick={onComplete}
    />;
}

export { CompleteIcon };
