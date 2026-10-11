import type { KeyboardEvent } from 'react';
import { handleButtonGroupNavigation } from '../../../../shared/ui/buttonGroupNavigation';
import './TodoViewToggle.css';
import { WorkspaceNavigation } from '../../../../shared/ui/WorkspaceNavigation/WorkspaceNavigation';

type TodoViewMode = 'list' | 'board' | 'today' | 'days' | 'agenda' | 'calendar' | 'week';

interface TodoViewToggleProps {
  activeView: TodoViewMode;
  onChangeView: (view: TodoViewMode) => void;
  onOpenOrders?: () => void;
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

function TodoViewToggle({ activeView, onChangeView, onOpenOrders }: TodoViewToggleProps) {
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
      <WorkspaceNavigation active={isPlanning ? 'planning' : 'tasks'} onPlanning={() => onChangeView('agenda')} onTasks={() => onChangeView('list')} onOrders={onOpenOrders} />
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
