import React, { ReactNode } from 'react';
import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_RECURRENCES,
  Todo,
  TodoDateType,
  TodoKind,
  TodoRecurrence,
  isTodoRecurringOnDate,
} from '../../App/todoModel';
import './TodoCalendar.css';

const WEEK_DAYS = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];

const TODO_DATE_TYPE_LABELS: Record<TodoDateType, string> = {
  [TODO_DATE_TYPES.due]: 'Limite',
  [TODO_DATE_TYPES.event]: 'Dia',
  [TODO_DATE_TYPES.period]: 'Periodo',
};

const TODO_KIND_LABELS: Record<TodoKind, string> = {
  [TODO_KINDS.task]: 'Tarea',
  [TODO_KINDS.event]: 'Evento',
  [TODO_KINDS.schedule]: 'Horario',
  [TODO_KINDS.period]: 'Periodo',
};

const TODO_RECURRENCE_LABELS: Record<TodoRecurrence, string> = {
  [TODO_RECURRENCES.none]: '',
  [TODO_RECURRENCES.daily]: 'Diaria',
  [TODO_RECURRENCES.weekly]: 'Semanal',
  [TODO_RECURRENCES.monthly]: 'Mensual',
  [TODO_RECURRENCES.yearly]: 'Anual',
};

type TodoScheduleRange = {
  endDate: string;
  endTime: string | null;
  startDate: string;
  startTime: string | null;
  type: TodoDateType;
};

interface TodoCalendarProps {
  error?: boolean;
  loading?: boolean;
  onEditTodo: (id: string, occurrenceDate?: string) => void;
  onCreateTodoForDate?: (dateValue: string) => void;
  onEmptySearchResults: () => ReactNode;
  onEmptyTodos: () => ReactNode;
  onError: () => ReactNode;
  onLoading: () => ReactNode;
  totalTodos: number;
  visibleTodos: Todo[];
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateValue(dateValue: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getTodoScheduleRange(todo: Todo): TodoScheduleRange | null {
  if (todo.dateType === TODO_DATE_TYPES.event) {
    return todo.startDate
      ? {
          startDate: todo.startDate,
          endDate: todo.startDate,
          startTime: todo.startTime || null,
          endTime: null,
          type: TODO_DATE_TYPES.event,
        }
      : null;
  }

  if (todo.dateType === TODO_DATE_TYPES.period) {
    if (!todo.startDate) {
      return null;
    }

    return {
      startDate: todo.startDate,
      endDate: todo.endDate || todo.startDate,
      startTime: todo.startTime || null,
      endTime: todo.endTime || null,
      type: TODO_DATE_TYPES.period,
    };
  }

  return todo.dueDate
    ? {
        startDate: todo.dueDate,
        endDate: todo.dueDate,
        startTime: todo.startTime || null,
        endTime: null,
        type: TODO_DATE_TYPES.due,
      }
    : null;
}

function isTodoVisibleOnDay(todo: Todo, dateValue: string): boolean {
  if (todo.recurrence && todo.recurrence !== TODO_RECURRENCES.none) {
    return isTodoRecurringOnDate(todo, dateValue);
  }

  const schedule = getTodoScheduleRange(todo);

  return Boolean(schedule && schedule.startDate <= dateValue && dateValue <= schedule.endDate);
}

function getCalendarDays(monthDate: Date) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekDay = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -firstWeekDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);

    return {
      date,
      dateValue: toDateValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function getSortedTodosForDay(todos: Todo[], dateValue: string): Todo[] {
  return todos
    .filter(todo => isTodoVisibleOnDay(todo, dateValue))
    .sort((firstTodo, secondTodo) => firstTodo.order - secondTodo.order);
}

function getUnscheduledTodos(todos: Todo[]): Todo[] {
  return todos.filter(todo => !getTodoScheduleRange(todo));
}

function getTodoRecurrenceLabel(todo: Todo): string {
  return todo.recurrence && todo.recurrence !== TODO_RECURRENCES.none
    ? TODO_RECURRENCE_LABELS[todo.recurrence]
    : '';
}

function getTodoTimeLabel(todo: Pick<Todo, 'dateType' | 'startTime' | 'endTime'>): string {
  if (!todo.startTime) {
    return '';
  }

  return todo.dateType === TODO_DATE_TYPES.period && todo.endTime
    ? `${todo.startTime} a ${todo.endTime}`
    : todo.startTime;
}

function getTodoCalendarTypeLabel(todo: Todo): string {
  if (todo.kind && todo.kind !== TODO_KINDS.task) {
    return TODO_KIND_LABELS[todo.kind];
  }

  const schedule = getTodoScheduleRange(todo);

  return TODO_DATE_TYPE_LABELS[schedule?.type || TODO_DATE_TYPES.due];
}

function isCompactRecurringTodo(todo: Todo): boolean {
  return todo.kind === TODO_KINDS.task && todo.recurrence === TODO_RECURRENCES.daily;
}

function TodoCalendar({
  error,
  loading,
  onEditTodo,
  onCreateTodoForDate,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  totalTodos,
  visibleTodos,
}: TodoCalendarProps) {
  const todayDateValue = toDateValue(new Date());
  const [monthDate, setMonthDate] = React.useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const monthLabel = getMonthLabel(monthDate);
  const calendarDays = React.useMemo(() => getCalendarDays(monthDate), [monthDate]);
  const unscheduledTodos = React.useMemo(() => getUnscheduledTodos(visibleTodos), [visibleTodos]);
  const scheduledTodosInMonth = calendarDays.reduce((count, day) => (
    day.isCurrentMonth
      ? count + getSortedTodosForDay(visibleTodos, day.dateValue).length
      : count
  ), 0);

  return (
    <section
      className="TodoCalendar"
      id="todo-list"
      tabIndex={-1}
      aria-label="Calendario de agenda"
    >
      {error && onError()}
      {loading && onLoading()}

      {!loading && !totalTodos && onEmptyTodos()}

      {(!!totalTodos && !visibleTodos.length) && onEmptySearchResults()}

      {!loading && !error && !!visibleTodos.length && (
        <>
          <div className="TodoCalendar-header">
            <div>
              <p>Calendario</p>
              <h2>{monthLabel}</h2>
            </div>
            <div className="TodoCalendar-actions">
              <button type="button" onClick={() => setMonthDate(currentMonth => addMonths(currentMonth, -1))}>
                Mes anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();

                  setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
              >
                Hoy
              </button>
              <button type="button" onClick={() => setMonthDate(currentMonth => addMonths(currentMonth, 1))}>
                Mes siguiente
              </button>
            </div>
          </div>

          <div className="TodoCalendar-weekdays" aria-hidden="true">
            {WEEK_DAYS.map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="TodoCalendar-grid" role="grid" aria-label={`Calendario ${monthLabel}`}>
            {calendarDays.map(day => {
              const dayTodos = getSortedTodosForDay(visibleTodos, day.dateValue);
              const compactRecurringTodos = dayTodos.filter(isCompactRecurringTodo);
              const listedTodos = dayTodos.filter(todo => !isCompactRecurringTodo(todo));
              const className = [
                'TodoCalendar-day',
                day.isCurrentMonth ? '' : 'TodoCalendar-day--muted',
                day.dateValue === todayDateValue ? 'TodoCalendar-day--today' : '',
              ].filter(Boolean).join(' ');

              return (
                <div className={className} role="gridcell" key={day.dateValue} aria-label={day.dateValue}>
                  <div className="TodoCalendar-dayHeading">
                    <time dateTime={day.dateValue}>{day.dayNumber}</time>
                    {onCreateTodoForDate && (
                      <button
                        aria-label={`Crear elemento el ${day.dateValue}`}
                        className="TodoCalendar-add"
                        onClick={() => onCreateTodoForDate(day.dateValue)}
                        title="Crear elemento"
                        type="button"
                      >
                        +
                      </button>
                    )}
                  </div>
                  {listedTodos.length > 0 && (
                    <ul className="TodoCalendar-events" aria-label={`Elementos del ${day.dateValue}`}>
                      {listedTodos.map(todo => {
                        const schedule = getTodoScheduleRange(todo);
                        const type = schedule?.type || TODO_DATE_TYPES.due;
                        const typeLabel = getTodoCalendarTypeLabel(todo);
                        const recurrenceLabel = getTodoRecurrenceLabel(todo);
                        const timeLabel = getTodoTimeLabel(todo);
                        const eventLabel = [
                          typeLabel,
                          recurrenceLabel,
                          timeLabel,
                          todo.text,
                        ].filter(Boolean).join(' ');

                        return (
                          <li key={todo.id}>
                            <button
                              type="button"
                              aria-label={eventLabel}
                              className={[
                                'TodoCalendar-event',
                                `TodoCalendar-event--${type}`,
                                `TodoCalendar-event--kind-${todo.kind || TODO_KINDS.task}`,
                                recurrenceLabel ? 'TodoCalendar-event--recurring' : '',
                                todo.completed ? 'TodoCalendar-event--completed' : '',
                              ].filter(Boolean).join(' ')}
                              onClick={() => onEditTodo(todo.id, day.dateValue)}
                            >
                              <span>{typeLabel}</span>
                              {recurrenceLabel && <small>{recurrenceLabel}</small>}
                              {timeLabel && <small>{timeLabel}</small>}
                              {todo.text}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {compactRecurringTodos.length > 0 && (
                    <details className="TodoCalendar-dailyDetails">
                      <summary aria-label={`${compactRecurringTodos.length} tareas diarias`}>
                        {compactRecurringTodos.length === 1
                          ? '1 diaria'
                          : `${compactRecurringTodos.length} diarias`}
                      </summary>
                      <ul aria-label={`Rutinas diarias del ${day.dateValue}`}>
                        {compactRecurringTodos.map(todo => (
                          <li key={todo.id}>
                            {getTodoTimeLabel(todo) && (
                              <small className="TodoCalendar-dailyTime">
                                {getTodoTimeLabel(todo)}
                              </small>
                            )}
                            <button
                              type="button"
                              className={[
                                'TodoCalendar-dailyTodo',
                                todo.completed ? 'TodoCalendar-dailyTodo--completed' : '',
                              ].filter(Boolean).join(' ')}
                              onClick={() => onEditTodo(todo.id, day.dateValue)}
                            >
                              {todo.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>

          {scheduledTodosInMonth === 0 && (
            <p className="TodoCalendar-emptyMonth">
              No hay elementos con fecha en este mes.
            </p>
          )}

          {unscheduledTodos.length > 0 && (
            <aside className="TodoCalendar-unscheduled" aria-label="Elementos sin fecha">
              <h3>Sin fecha</h3>
              <ul>
                {unscheduledTodos.map(todo => (
                  <li key={todo.id}>
                    <button type="button" onClick={() => onEditTodo(todo.id)}>
                      {todo.text}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}

        </>
      )}
    </section>
  );
}

export { TodoCalendar };
export {
  getCalendarDays,
  getTodoCalendarTypeLabel,
  getTodoScheduleRange,
  getTodoTimeLabel,
  getUnscheduledTodos,
  isCompactRecurringTodo,
  isTodoVisibleOnDay,
};
