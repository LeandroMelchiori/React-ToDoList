import { TodoIcon } from "./TodoIcon";

function CompleteIcon({ completed, onComplete }) {
    return <TodoIcon
        type="check"
        color={completed ? "#16a34a" : "#94a3b8"}
        label={completed ? "Marcar tarea como pendiente" : "Marcar tarea como completada"}
        onClick={onComplete}
    />;
}

export { CompleteIcon };
