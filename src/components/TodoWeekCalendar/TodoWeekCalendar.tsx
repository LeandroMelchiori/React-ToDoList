import React, { ReactNode } from 'react';
import {
  TODO_DATE_TYPES,
  TODO_RECURRENCES,
  Todo,
  TodoDateType,
  TodoRecurrence,
} from '../../App/todoModel';
import {
  getTodoScheduleRange,
  getTodoTimeLabel,
  isTodoVisibleOnDay,
} from '../TodoCalendar/TodoCalendar';
import './TodoWeekCalendar.css';

const WEEK_DAYS = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

const TODO_DATE_TYPE_LABELS: Record<TodoDateType, string> = {
  [TODO_DATE_TYPES.due]: 'Limite',
  [TODO_DATE_TYPES.event]: 'Dia',
  [TODO_DATE_TYPES.period]: 'Periodo',
};

const TODO_RECURRENCE_LABELS: Record<TodoRecurrence, string> = {
  [TODO_RECURRENCES.none]: '',
  [TODO_RECURRENCES.daily]: 'Diaria',
  [TODO_RECURRENCES.weekly]: 'Semanal',
  [TODO_RECURRENCES.monthly]: 'Mensual',
  [TODO_RECURRENCES.yearly]: 'Anual',
};

type WeekDay = {
  date: Date;
  dateValue: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
};

type UntimedWeekTodo = {
  dateValue: string;
  dayLabel: string;
  todo: Todo;
};

interface TodoWeekCalendarProps {
  error?: boolean;
  loading?: boolean;
  onEditTodo: (id: string) => void;
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

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getWeekStart(date: Date): Date {
  const startDate = new Date(date);
  const dayOffset = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - dayOffset);

  return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
}

function formatShortDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-');

  return year && month && day ? `${day}/${month}` : dateValue;
}

function getWeekDays(anchorDate: Date, today = new Date()): WeekDay[] {
  const weekStart = getWeekStart(anchorDate);
  const todayDateValue = toDateValue(today);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const dateValue = toDateValue(date);

    return {
      date,
      dateValue,
      dayName: WEEK_DAYS[index],
      dayNumber: date.getDate(),
      isToday: dateValue === todayDateValue,
    };
  });
}

function getWeekLabel(weekDays: WeekDay[]): string {
  const firstDay = weekDays[0]?.dateValue;
  const lastDay = weekDays[weekDays.length - 1]?.dateValue;

  if (!firstDay || !lastDay) {
    return '';
  }

  return `${formatShortDate(firstDay)} - ${formatShortDate(lastDay)}`;
}

function getTodoStartHour(todo: Pick<Todo, 'startTime'>): number | null {
  if (!todo.startTime) {
    return null;
  }

  const [hour] = todo.startTime.split(':').map(Number);

  return Number.isInteger(hour) ? hour : null;
}

function getTodoEndHour(todo: Pick<Todo, 'endTime' | 'startTime'>): number | null {
  const timeValue = todo.endTime || todo.startTime;

  if (!timeValue) {
    return null;
  }

  const [hour, minutes] = timeValue.split(':').map(Number);

  if (!Number.isInteger(hour)) {
    return null;
  }

  return minutes > 0 ? hour + 1 : hour;
}

function getWeekTimedTodos(todos: Todo[], weekDays: WeekDay[]): Todo[] {
  return todos.filter(todo =>
    Boolean(todo.startTime) &&
    weekDays.some(day => isTodoVisibleOnDay(todo, day.dateValue))
  );
}

function getHourSlots(todos: Todo[], weekDays: WeekDay[]): number[] {
  const timedTodos = getWeekTimedTodos(todos, weekDays);
  const startHours = timedTodos
    .map(getTodoStartHour)
    .filter((hour): hour is number => hour !== null);
  const endHours = timedTodos
    .map(getTodoEndHour)
    .filter((hour): hour is number => hour !== null);
  const startHour = Math.max(0, Math.min(DEFAULT_START_HOUR, ...startHours));
  const endHour = Math.min(23, Math.max(DEFAULT_END_HOUR, ...endHours));

  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
}

function getTimedTodosForSlot(todos: Todo[], dateValue: string, hour: number): Todo[] {
  return todos
    .filter(todo =>
      Boolean(todo.startTime) &&
      getTodoStartHour(todo) === hour &&
      isTodoVisibleOnDay(todo, dateValue)
    )
    .sort((firstTodo, secondTodo) => {
      const firstTime = firstTodo.startTime || '';
      const secondTime = secondTodo.startTime || '';

      return firstTime.localeCompare(secondTime) || firstTodo.order - secondTodo.order;
    });
}

function getUntimedWeekTodos(todos: Todo[], weekDays: WeekDay[]): UntimedWeekTodo[] {
  return weekDays.flatMap(day => (
    todos
      .filter(todo => !todo.startTime && isTodoVisibleOnDay(todo, day.dateValue))
      .sort((firstTodo, secondTodo) => firstTodo.order - secondTodo.order)
      .map(todo => ({
        dateValue: day.dateValue,
        dayLabel: `${day.dayName} ${formatShortDate(day.dateValue)}`,
        todo,
      }))
  ));
}

function getUnscheduledTodos(todos: Todo[]): Todo[] {
  return todos.filter(todo => !getTodoScheduleRange(todo));
}

function getTodoTypeLabel(todo: Todo): string {
  const schedule = getTodoScheduleRange(todo);

  return TODO_DATE_TYPE_LABELS[schedule?.type || TODO_DATE_TYPES.due];
}

function getTodoRecurrenceLabel(todo: Todo): string {
  return todo.recurrence && todo.recurrence !== TODO_RECURRENCES.none
    ? TODO_RECURRENCE_LABELS[todo.recurrence]
    : '';
}

function getTodoWeekAriaLabel(todo: Todo): string {
  return [
    getTodoTimeLabel(todo),
    getTodoTypeLabel(todo),
    getTodoRecurrenceLabel(todo),
    todo.text,
  ].filter(Boolean).join(' ');
}

function formatHourSlot(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function TodoWeekCalendar({
  error,
  loading,
  onEditTodo,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  totalTodos,
  visibleTodos,
}: TodoWeekCalendarProps) {
  const [anchorDate, setAnchorDate] = React.useState(() => new Date());
  const weekDays = React.useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const hourSlots = React.useMemo(() => getHourSlots(visibleTodos, weekDays), [visibleTodos, weekDays]);
  const timedTodos = React.useMemo(() => getWeekTimedTodos(visibleTodos, weekDays), [visibleTodos, weekDays]);
  const untimedTodos = React.useMemo(() => getUntimedWeekTodos(visibleTodos, weekDays), [visibleTodos, weekDays]);
  const unscheduledTodos = React.useMemo(() => getUnscheduledTodos(visibleTodos), [visibleTodos]);
  const weekLabel = getWeekLabel(weekDays);

  return (
    <section
      className="TodoWeekCalendar"
      id="todo-list"
      tabIndex={-1}
      aria-label="Tareas"
    >
      {error && onError()}
      {loading && onLoading()}

      {!loading && !totalTodos && onEmptyTodos()}

      {(!!totalTodos && !visibleTodos.length) && onEmptySearchResults()}

      {!loading && !error && !!visibleTodos.length && (
        <>
          <div className="TodoWeekCalendar-header">
            <div>
              <p>Agenda semanal</p>
              <h2>{weekLabel}</h2>
            </div>
            <div className="TodoWeekCalendar-actions">
              <button type="button" onClick={() => setAnchorDate(currentDate => addDays(currentDate, -7))}>
                Semana anterior
              </button>
              <button type="button" onClick={() => setAnchorDate(new Date())}>
                Hoy
              </button>
              <button type="button" onClick={() => setAnchorDate(currentDate => addDays(currentDate, 7))}>
                Semana siguiente
              </button>
            </div>
          </div>

          <div className="TodoWeekCalendar-scroller">
            <div className="TodoWeekCalendar-grid" role="grid" aria-label={`Agenda semanal ${weekLabel}`}>
              <div className="TodoWeekCalendar-corner" aria-hidden="true" />
              {weekDays.map(day => (
                <div
                  className={[
                    'TodoWeekCalendar-dayHeader',
                    day.isToday ? 'TodoWeekCalendar-dayHeader--today' : '',
                  ].filter(Boolean).join(' ')}
                  role="columnheader"
                  key={day.dateValue}
                >
                  <span>{day.dayName}</span>
                  <time dateTime={day.dateValue}>{formatShortDate(day.dateValue)}</time>
                </div>
              ))}

              {hourSlots.map(hour => (
                <React.Fragment key={hour}>
                  <div className="TodoWeekCalendar-hour" role="rowheader">
                    {formatHourSlot(hour)}
                  </div>
                  {weekDays.map(day => {
                    const slotTodos = getTimedTodosForSlot(visibleTodos, day.dateValue, hour);

                    return (
                      <div
                        className="TodoWeekCalendar-slot"
                        role="gridcell"
                        aria-label={`${day.dayName} ${formatShortDate(day.dateValue)} ${formatHourSlot(hour)}`}
                        key={`${day.dateValue}-${hour}`}
                      >
                        {slotTodos.map(todo => (
                          <button
                            type="button"
                            className={[
                              'TodoWeekCalendar-event',
                              `TodoWeekCalendar-event--${getTodoScheduleRange(todo)?.type || TODO_DATE_TYPES.due}`,
                              todo.completed ? 'TodoWeekCalendar-event--completed' : '',
                            ].filter(Boolean).join(' ')}
                            aria-label={getTodoWeekAriaLabel(todo)}
                            key={todo.id}
                            onClick={() => onEditTodo(todo.id)}
                          >
                            <small>{getTodoTimeLabel(todo)}</small>
                            {todo.text}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {timedTodos.length === 0 && (
            <p className="TodoWeekCalendar-emptyWeek">
              No hay tareas con horario esta semana.
            </p>
          )}

          {untimedTodos.length > 0 && (
            <aside className="TodoWeekCalendar-sideList" aria-label="Tareas sin horario esta semana">
              <h3>Sin horario esta semana</h3>
              <ul>
                {untimedTodos.map(({ dateValue, dayLabel, todo }) => (
                  <li key={`${dateValue}-${todo.id}`}>
                    <span>{dayLabel}</span>
                    <button type="button" onClick={() => onEditTodo(todo.id)}>
                      {todo.text}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {unscheduledTodos.length > 0 && (
            <aside className="TodoWeekCalendar-sideList" aria-label="Tareas sin fecha">
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

export { TodoWeekCalendar };
export {
  formatHourSlot,
  getHourSlots,
  getTimedTodosForSlot,
  getUntimedWeekTodos,
  getWeekDays,
  getWeekStart,
};
