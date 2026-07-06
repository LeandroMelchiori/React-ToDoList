import { TODO_FILTERS } from '../../../App/useTodos';
import './TodoFilters.css';

const filterOptions = [
  { value: TODO_FILTERS.all, label: 'Todas', getCount: ({ totalTodos }) => totalTodos },
  { value: TODO_FILTERS.active, label: 'Pendientes', getCount: ({ pendingTodos }) => pendingTodos },
  { value: TODO_FILTERS.completed, label: 'Completadas', getCount: ({ completedTodos }) => completedTodos },
];

function TodoFilters({
  filter,
  setFilter,
  loading,
  totalTodos,
  completedTodos,
  pendingTodos,
}) {
  return (
    <div className="TodoFilters" role="group" aria-label="Filtrar tareas">
      {filterOptions.map(option => {
        const isActive = filter === option.value;
        const count = option.getCount({ totalTodos, completedTodos, pendingTodos });

        return (
          <button
            key={option.value}
            type="button"
            className={`TodoFilters-button ${isActive ? 'TodoFilters-button--active' : ''}`}
            aria-pressed={isActive}
            disabled={loading}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export { TodoFilters };
