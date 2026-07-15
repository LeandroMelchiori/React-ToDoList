import type { KeyboardEvent } from 'react';
import { handleButtonGroupNavigation } from '../buttonGroupNavigation';
import './TodoViewToggle.css';

type TodoViewMode = 'list' | 'board' | 'today' | 'calendar' | 'week';

interface TodoViewToggleProps {
  activeView: TodoViewMode;
  onChangeView: (view: TodoViewMode) => void;
}

const VIEW_OPTIONS: Array<{ label: string; value: TodoViewMode }> = [
  { label: 'Lista', value: 'list' },
  { label: 'Hoy', value: 'today' },
  { label: 'Tablero', value: 'board' },
  { label: 'Calendario', value: 'calendar' },
  { label: 'Semana', value: 'week' },
];

function TodoViewToggle({ activeView, onChangeView }: TodoViewToggleProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isNavigationKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key);

    handleButtonGroupNavigation(event);

    if (isNavigationKey && document.activeElement instanceof HTMLButtonElement) {
      document.activeElement.click();
    }
  };

  return (
    <div
      aria-label="Cambiar vista"
      aria-orientation="horizontal"
      className="TodoViewToggle"
      onKeyDown={handleKeyDown}
      role="tablist"
    >
      {VIEW_OPTIONS.map(({ label, value }) => {
        const isActive = activeView === value;

        return (
          <button
            aria-controls="todo-view-panel"
            aria-selected={isActive}
            className={isActive ? 'TodoViewToggle-button TodoViewToggle-button--active' : 'TodoViewToggle-button'}
            id={`todo-view-tab-${value}`}
            key={value}
            onClick={() => onChangeView(value)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { TodoViewToggle };
export type { TodoViewMode };
