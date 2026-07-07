import { TodoIcon } from './TodoIcon';

function MoveIcon({ direction, disabled, onMove }) {
    const isMovingUp = direction === 'up';

    return <TodoIcon
     type={isMovingUp ? 'moveUp' : 'moveDown'}
     color="#94a3b8"
     disabled={disabled}
     label={isMovingUp ? 'Subir tarea' : 'Bajar tarea'}
     onClick={onMove}
    />;
}

export { MoveIcon };
