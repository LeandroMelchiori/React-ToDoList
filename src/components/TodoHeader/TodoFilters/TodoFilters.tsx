import { TODO_FILTERS, TodoFilter } from '../../../App/todoModel';
import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';
import './TodoFilters.css';

const filterOptions: Array<{ value: TodoFilter, label: string, getCount: (props: any) => number }> = [
  { value: TODO_FILTERS.all, label: 'Todas', getCount: ({ totalTodos }) => totalTodos },
  { value: TODO_FILTERS.active, label: 'Pendientes', getCount: ({ pendingTodos }) => pendingTodos },
  { value: TODO_FILTERS.completed, label: 'Completadas', getCount: ({ completedTodos }) => completedTodos },
  { value: TODO_FILTERS.overdue, label: 'Vencidas', getCount: ({ overdueTodos }) => overdueTodos },
  { value: TODO_FILTERS.today, label: 'Hoy', getCount: ({ todayTodos }) => todayTodos },
  { value: TODO_FILTERS.upcoming, label: 'Proximas', getCount: ({ upcomingTodos }) => upcomingTodos },
];

interface TodoFiltersProps {
  filter: TodoFilter;
  setFilter: (filter: TodoFilter) => void;
  loading?: boolean;
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  overdueTodos: number;
  todayTodos: number;
  upcomingTodos: number;
}

function TodoFilters({
  filter,
  setFilter,
  loading,
  totalTodos,
  completedTodos,
  pendingTodos,
  overdueTodos,
  todayTodos,
  upcomingTodos,
}: TodoFiltersProps) {
  return (
    <div
      className="TodoFilters"
      role="group"
      aria-label="Filtrar tareas"
      onKeyDown={handleButtonGroupNavigation}
    >
      {filterOptions.map(option => {
        const isActive = filter === option.value;
        const count = option.getCount({
          totalTodos,
          completedTodos,
          pendingTodos,
          overdueTodos,
          todayTodos,
          upcomingTodos,
        });

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
            {' '}
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export { TodoFilters };
