import './TodoViewToggle.css';

type TodoViewMode = 'list' | 'today' | 'calendar' | 'week';

interface TodoViewToggleProps {
  activeView: TodoViewMode;
  onChangeView: (view: TodoViewMode) => void;
}

function TodoViewToggle({ activeView, onChangeView }: TodoViewToggleProps) {
  return (
    <div className="TodoViewToggle" role="group" aria-label="Cambiar vista">
      <button
        type="button"
        aria-pressed={activeView === 'list'}
        className={activeView === 'list' ? 'TodoViewToggle-button TodoViewToggle-button--active' : 'TodoViewToggle-button'}
        onClick={() => onChangeView('list')}
      >
        Lista
      </button>
      <button
        type="button"
        aria-pressed={activeView === 'today'}
        className={activeView === 'today' ? 'TodoViewToggle-button TodoViewToggle-button--active' : 'TodoViewToggle-button'}
        onClick={() => onChangeView('today')}
      >
        Hoy
      </button>
      <button
        type="button"
        aria-pressed={activeView === 'calendar'}
        className={activeView === 'calendar' ? 'TodoViewToggle-button TodoViewToggle-button--active' : 'TodoViewToggle-button'}
        onClick={() => onChangeView('calendar')}
      >
        Calendario
      </button>
      <button
        type="button"
        aria-pressed={activeView === 'week'}
        className={activeView === 'week' ? 'TodoViewToggle-button TodoViewToggle-button--active' : 'TodoViewToggle-button'}
        onClick={() => onChangeView('week')}
      >
        Semana
      </button>
    </div>
  );
}

export { TodoViewToggle };
export type { TodoViewMode };
