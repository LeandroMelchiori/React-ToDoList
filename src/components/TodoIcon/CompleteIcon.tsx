import { TodoIcon } from "./TodoIcon";

interface CompleteIconProps {
    completed: boolean;
    disabled?: boolean;
    label?: string;
    onComplete: () => void;
}

function CompleteIcon({ completed, disabled = false, label, onComplete }: CompleteIconProps) {
    const accessibleLabel = label || (disabled
        ? 'Tarea completa porque todas sus subtareas estan completas'
        : completed
            ? 'Marcar tarea como pendiente'
            : 'Marcar tarea como completada');

    return <TodoIcon
        type="check"
        color={completed ? 'var(--color-success)' : 'var(--color-icon-muted)'}
        disabled={disabled}
        label={accessibleLabel}
        onClick={onComplete}
    />;
}

export { CompleteIcon };
