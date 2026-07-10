import React from 'react';
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
  const [isOpen, setIsOpen] = React.useState(false);
  const activeOption = filterOptions.find(option => option.value === filter) || filterOptions[0];

  const closeMenu = () => {
    setIsOpen(false);
  };

  const selectFilter = (nextFilter: TodoFilter) => {
    setFilter(nextFilter);
    closeMenu();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      closeMenu();
      return;
    }

    handleButtonGroupNavigation(event);
  };

  return (
    <div
      className="TodoFilters"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`TodoFilters-trigger ${isOpen ? 'TodoFilters-trigger--open' : ''}`}
        aria-controls="todo-filters-menu"
        aria-expanded={isOpen}
        disabled={loading}
        onClick={() => setIsOpen(currentValue => !currentValue)}
      >
        <span className="TodoFilters-triggerIcon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="TodoFilters-triggerText">
          Filtros
        </span>
        <span className="TodoFilters-activeLabel">
          {activeOption.label}
        </span>
      </button>
      {isOpen && (
        <div
          className="TodoFilters-menu"
          id="todo-filters-menu"
          role="group"
          aria-label="Filtrar tareas"
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
                onClick={() => selectFilter(option.value)}
              >
                {option.label}
                {' '}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <span className="TodoFilters-total" aria-live="polite">
        {activeOption.label}
        {' '}
        <strong>
          {activeOption.getCount({
            totalTodos,
            completedTodos,
            pendingTodos,
            overdueTodos,
            todayTodos,
            upcomingTodos,
          })}
        </strong>
      </span>
    </div>
  );
}

export { TodoFilters };
