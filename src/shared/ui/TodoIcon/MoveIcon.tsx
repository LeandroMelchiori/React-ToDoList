import { TodoIcon } from './TodoIcon';

interface MoveIconProps {
    direction: 'up' | 'down';
    disabled?: boolean;
    onMove: () => void;
}

function MoveIcon({ direction, disabled, onMove }: MoveIconProps) {
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
