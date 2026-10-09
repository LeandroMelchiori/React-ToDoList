import type { KeyboardEvent } from 'react';
import { handleButtonGroupNavigation } from '../buttonGroupNavigation';
import './TodoViewToggle.css';

type TodoViewMode = 'list' | 'board' | 'today' | 'days' | 'agenda' | 'calendar' | 'week';

interface TodoViewToggleProps {
  activeView: TodoViewMode;
  onChangeView: (view: TodoViewMode) => void;
}

const TASK_VIEWS: Array<{ label: string; value: TodoViewMode }> = [
  { label: 'Lista', value: 'list' },
  { label: 'Tablero', value: 'board' },
];
const PLANNING_VIEWS: Array<{ label: string; value: TodoViewMode }> = [
  { label: 'Hoy', value: 'today' },
  { label: '3 días', value: 'days' },
  { label: 'Semana', value: 'agenda' },
  { label: 'Mes', value: 'calendar' },
];

function TodoViewToggle({ activeView, onChangeView }: TodoViewToggleProps) {
  const isPlanning = !['list', 'board'].includes(activeView);
  const selectedView = activeView === 'week' ? 'agenda' : activeView;
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isNavigationKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key);

    handleButtonGroupNavigation(event);

    if (isNavigationKey && document.activeElement instanceof HTMLButtonElement) {
      document.activeElement.click();
    }
  };

  return (
    <div className="TodoViewNavigation">
      <nav aria-label="Espacios de trabajo" className="TodoViewNavigation-primary">
        <button aria-pressed={isPlanning} onClick={() => onChangeView('agenda')} type="button">
          Planificación
        </button>
        <button aria-pressed={!isPlanning} onClick={() => onChangeView('list')} type="button">
          Tareas
        </button>
      </nav>
    <div
      aria-label="Cambiar vista"
      aria-orientation="horizontal"
      className="TodoViewToggle"
      onKeyDown={handleKeyDown}
      role="tablist"
    >
      {(isPlanning ? PLANNING_VIEWS : TASK_VIEWS).map(({ label, value }) => {
        const isActive = selectedView === value;

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
    </div>
  );
}

export { TodoViewToggle };
export type { TodoViewMode };
