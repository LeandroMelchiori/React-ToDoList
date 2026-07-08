import { TodoIcon } from './TodoIcon';

function MoveIcon({ direction, disabled, onMove }) {
    const isMovingUp = direction === 'up';

    return <TodoIcon
     type={isMovingUp ? 'moveUp' : 'moveDown'}
     color="var(--color-icon-muted)"
     disabled={disabled}
     label={isMovingUp ? 'Subir tarea' : 'Bajar tarea'}
     onClick={onMove}
    />;
}

export { MoveIcon };
