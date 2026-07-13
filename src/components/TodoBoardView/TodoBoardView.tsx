import { ReactNode } from 'react';
import {
  TODO_GROUPS,
  TODO_KINDS,
  TODO_PRIORITIES,
  TODO_RECURRENCES,
  Todo,
  TodoGroupView,
  TodoPriority,
  TodoRecurrence,
} from '../../App/todoModel';
import {
  getTodoCalendarTypeLabel,
  getTodoScheduleRange,
  getTodoTimeLabel,
} from '../TodoCalendar/TodoCalendar';
import './TodoBoardView.css';

const BOARD_COLUMNS = [
  { id: TODO_GROUPS.overdue, title: 'Vencidas', emptyText: 'Sin urgencias vencidas.' },
  { id: TODO_GROUPS.today, title: 'Hoy', emptyText: 'Nada para hoy.' },
  { id: TODO_GROUPS.upcoming, title: 'Proximas', emptyText: 'Sin proximas fechas.' },
  { id: TODO_GROUPS.unscheduled, title: 'Sin fecha', emptyText: 'Sin elementos sueltos.' },
  { id: TODO_GROUPS.completed, title: 'Completadas', emptyText: 'Todavia no hay completadas.' },
];

const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  [TODO_PRIORITIES.low]: 'Baja',
  [TODO_PRIORITIES.medium]: 'Media',
  [TODO_PRIORITIES.high]: 'Alta',
};

const TODO_RECURRENCE_LABELS: Record<TodoRecurrence, string> = {
  [TODO_RECURRENCES.none]: '',
  [TODO_RECURRENCES.daily]: 'Diaria',
  [TODO_RECURRENCES.weekly]: 'Semanal',
  [TODO_RECURRENCES.monthly]: 'Mensual',
  [TODO_RECURRENCES.yearly]: 'Anual',
};

interface TodoBoardViewProps {
  error?: boolean;
  loading?: boolean;
  onEmptySearchResults: () => ReactNode;
  onEmptyTodos: () => ReactNode;
  onError: () => ReactNode;
  onLoading: () => ReactNode;
  onOpenTodo: (id: string) => void;
  totalTodos: number;
  visibleTodoGroups: TodoGroupView[];
  visibleTodos: Todo[];
}

function getTodoCountLabel(count: number) {
  return count === 1 ? '1 elemento' : `${count} elementos`;
}

function formatDateValue(dateValue?: string | null): string {
  if (!dateValue) {
    return '';
  }

  const [year, month, day] = dateValue.split('-');

  return year && month && day ? `${day}/${month}/${year}` : dateValue;
}

function getTodoScheduleLabel(todo: Todo): string {
  const schedule = getTodoScheduleRange(todo);

  if (!schedule) {
    return '';
  }

  const timeLabel = getTodoTimeLabel(todo);
  const dateLabel = schedule.startDate === schedule.endDate
    ? formatDateValue(schedule.startDate)
    : `${formatDateValue(schedule.startDate)} - ${formatDateValue(schedule.endDate)}`;

  return [getTodoCalendarTypeLabel(todo), dateLabel, timeLabel].filter(Boolean).join(' ');
}

function getTodoRecurrenceLabel(todo: Todo): string {
  return todo.recurrence && todo.recurrence !== TODO_RECURRENCES.none
    ? TODO_RECURRENCE_LABELS[todo.recurrence]
    : '';
}

function getTodoSubtaskProgress(todo: Todo): string {
  if (todo.kind !== TODO_KINDS.task || !todo.subtasks.length) {
    return '';
  }

  const completedSubtasks = todo.subtasks.filter(subtask => subtask.completed).length;

  return `${completedSubtasks}/${todo.subtasks.length} subtareas`;
}

function getBoardColumns(groups: TodoGroupView[]) {
  const groupsById = new Map(groups.map(group => [group.id, group]));

  return BOARD_COLUMNS.map(column => ({
    ...column,
    todos: groupsById.get(column.id)?.todos || [],
  }));
}

function TodoBoardView({
  error,
  loading,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  onOpenTodo,
  totalTodos,
  visibleTodoGroups,
  visibleTodos,
}: TodoBoardViewProps) {
  const columns = getBoardColumns(visibleTodoGroups);

  return (
    <section
      className="TodoBoardView"
      id="todo-list"
      tabIndex={-1}
      aria-label="Tablero de planificacion"
    >
      {error && onError()}
      {loading && onLoading()}

      {!loading && !totalTodos && onEmptyTodos()}

      {(!!totalTodos && !visibleTodos.length) && onEmptySearchResults()}

      {!loading && !error && !!visibleTodos.length && (
        <>
          <header className="TodoBoardView-header">
            <div>
              <p>Tablero</p>
              <h2>Planificacion por estado</h2>
            </div>
            <strong>{getTodoCountLabel(visibleTodos.length)}</strong>
          </header>

          <div className="TodoBoardView-columns" role="list" aria-label="Columnas del tablero">
            {columns.map(column => (
              <section
                className={`TodoBoardView-column TodoBoardView-column--${column.id}`}
                aria-label={`Columna ${column.title}`}
                key={column.id}
              >
                <div className="TodoBoardView-columnHeader">
                  <h3>{column.title}</h3>
                  <span>{column.todos.length}</span>
                </div>

                {column.todos.length === 0 ? (
                  <p className="TodoBoardView-emptyColumn">{column.emptyText}</p>
                ) : (
                  <ul className="TodoBoardView-cards">
                    {column.todos.map(todo => {
                      const scheduleLabel = getTodoScheduleLabel(todo);
                      const recurrenceLabel = getTodoRecurrenceLabel(todo);
                      const subtaskProgress = getTodoSubtaskProgress(todo);

                      return (
                        <li key={todo.id}>
                          <button
                            type="button"
                            className={`TodoBoardView-card TodoBoardView-card--${todo.kind}`}
                            aria-label={`Abrir detalle ${todo.text}`}
                            onClick={() => onOpenTodo(todo.id)}
                          >
                            <strong>{todo.text}</strong>
                            {todo.description && <small>{todo.description}</small>}
                            <span className="TodoBoardView-cardMeta">
                              {todo.kind === TODO_KINDS.task && (
                                <mark className={`TodoBoardView-priority TodoBoardView-priority--${todo.priority}`}>
                                  {TODO_PRIORITY_LABELS[todo.priority]}
                                </mark>
                              )}
                              {scheduleLabel && <mark>{scheduleLabel}</mark>}
                              {recurrenceLabel && <mark>{recurrenceLabel}</mark>}
                              {todo.project && <mark>{todo.project}</mark>}
                              {subtaskProgress && <mark>{subtaskProgress}</mark>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export { TodoBoardView };
export {
  getBoardColumns,
  getTodoScheduleLabel,
  getTodoSubtaskProgress,
};
