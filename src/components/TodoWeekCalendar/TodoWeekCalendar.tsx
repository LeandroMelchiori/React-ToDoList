import React, { ReactNode } from 'react';
import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_RECURRENCES,
  Todo,
  TodoDateType,
  TodoKind,
  TodoRecurrence,
} from '../../App/todoModel';
import { getTodoScheduleConflicts } from '../../App/todoScheduleConflicts';
import {
  getTodoScheduleRange,
  getTodoTimeLabel,
  isCompactRecurringTodo,
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

type UntimedWeekDayGroup = {
  dateValue: string;
  dayLabel: string;
  isToday: boolean;
  todos: Todo[];
};

interface TodoWeekCalendarProps {
  error?: boolean;
  loading?: boolean;
  onEditTodo: (id: string, occurrenceDate?: string) => void;
  onCreateTodoForSlot?: (dateValue: string, hour: number) => void;
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

function getUntimedTodosByDay(untimedTodos: UntimedWeekTodo[], weekDays: WeekDay[]): UntimedWeekDayGroup[] {
  return weekDays.map(day => ({
    dateValue: day.dateValue,
    dayLabel: `${day.dayName} ${formatShortDate(day.dateValue)}`,
    isToday: day.isToday,
    todos: untimedTodos
      .filter(item => item.dateValue === day.dateValue)
      .map(item => item.todo),
  }));
}

function getUnscheduledTodos(todos: Todo[]): Todo[] {
  return todos.filter(todo => !getTodoScheduleRange(todo));
}

function getTodoTypeLabel(todo: Todo): string {
  if (todo.kind && todo.kind !== TODO_KINDS.task) {
    return TODO_KIND_LABELS[todo.kind];
  }

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
  onCreateTodoForSlot,
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
  const untimedTodosByDay = React.useMemo(() => getUntimedTodosByDay(untimedTodos, weekDays), [untimedTodos, weekDays]);
  const unscheduledTodos = React.useMemo(() => getUnscheduledTodos(visibleTodos), [visibleTodos]);
  const scheduleConflicts = React.useMemo(
    () => getTodoScheduleConflicts(visibleTodos, weekDays.map(day => day.dateValue)),
    [visibleTodos, weekDays]
  );
  const conflictingTodoKeys = React.useMemo(() => new Set(
    scheduleConflicts.flatMap(conflict => (
      conflict.todoIds.map(todoId => `${conflict.dateValue}:${todoId}`)
    ))
  ), [scheduleConflicts]);
  const conflictDayLabels = scheduleConflicts.map(conflict => (
    weekDays.find(day => day.dateValue === conflict.dateValue)
  )).filter((day): day is WeekDay => Boolean(day));
  const weekLabel = getWeekLabel(weekDays);

  return (
    <section
      className="TodoWeekCalendar"
      id="todo-list"
      tabIndex={-1}
      aria-label="Agenda semanal"
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

          {scheduleConflicts.length > 0 && (
            <aside className="TodoWeekCalendar-conflicts" role="status" aria-label="Conflictos de horario">
              <strong>
                {scheduleConflicts.length === 1
                  ? '1 conflicto de horario'
                  : `${scheduleConflicts.length} conflictos de horario`}
              </strong>
              <span>
                Revisa {conflictDayLabels.map(day => `${day.dayName} ${formatShortDate(day.dateValue)}`).join(', ')}.
              </span>
            </aside>
          )}

          {untimedTodos.length > 0 && (
            <div className="TodoWeekCalendar-allDay" role="group" aria-label="Elementos sin horario por dia">
              {untimedTodosByDay.map(group => {
                const compactRecurringTodos = group.todos.filter(isCompactRecurringTodo);
                const listedTodos = group.todos.filter(todo => !isCompactRecurringTodo(todo));

                return (
                  <section
                    className={[
                      'TodoWeekCalendar-allDayColumn',
                      group.isToday ? 'TodoWeekCalendar-allDayColumn--today' : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={`Sin horario ${group.dayLabel}`}
                    key={group.dateValue}
                  >
                    <span>{group.dayLabel}</span>
                    {group.todos.length === 0 ? (
                      <small>Libre</small>
                    ) : (
                      <>
                        {listedTodos.length > 0 && (
                          <ul>
                            {listedTodos.map(todo => (
                              <li key={todo.id}>
                                <button
                                  type="button"
                                  className={`TodoWeekCalendar-allDayItem TodoWeekCalendar-allDayItem--${todo.kind || TODO_KINDS.task}`}
                                  aria-label={[
                                    getTodoTypeLabel(todo),
                                    getTodoRecurrenceLabel(todo),
                                    todo.text,
                                  ].filter(Boolean).join(' ')}
                                  onClick={() => onEditTodo(todo.id, group.dateValue)}
                                >
                                  <small>{getTodoTypeLabel(todo)}</small>
                                  {todo.text}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {compactRecurringTodos.length > 0 && (
                          <details className="TodoWeekCalendar-dailyDetails">
                            <summary>
                              {compactRecurringTodos.length === 1
                                ? '1 diaria'
                                : `${compactRecurringTodos.length} diarias`}
                            </summary>
                            <ul aria-label={`Rutinas diarias de ${group.dayLabel}`}>
                              {compactRecurringTodos.map(todo => (
                                <li key={todo.id}>
                                  <button
                                    type="button"
                                    className="TodoWeekCalendar-allDayItem"
                                    onClick={() => onEditTodo(todo.id, group.dateValue)}
                                  >
                                    {todo.text}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          )}

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
                        {onCreateTodoForSlot && (
                          <button
                            aria-label={`Crear bloque el ${day.dateValue} a las ${formatHourSlot(hour)}`}
                            className="TodoWeekCalendar-add"
                            onClick={() => onCreateTodoForSlot(day.dateValue, hour)}
                            title="Crear bloque"
                            type="button"
                          >
                            +
                          </button>
                        )}
                        {slotTodos.map(todo => {
                          const hasConflict = conflictingTodoKeys.has(`${day.dateValue}:${todo.id}`);

                          return (
                            <button
                              type="button"
                              className={[
                                'TodoWeekCalendar-event',
                                `TodoWeekCalendar-event--${getTodoScheduleRange(todo)?.type || TODO_DATE_TYPES.due}`,
                                `TodoWeekCalendar-event--kind-${todo.kind || TODO_KINDS.task}`,
                                todo.completed ? 'TodoWeekCalendar-event--completed' : '',
                                hasConflict ? 'TodoWeekCalendar-event--conflict' : '',
                              ].filter(Boolean).join(' ')}
                              aria-label={`${getTodoWeekAriaLabel(todo)}${hasConflict ? ' Conflicto de horario' : ''}`}
                              key={todo.id}
                              onClick={() => onEditTodo(todo.id, day.dateValue)}
                            >
                              <small>{getTodoTimeLabel(todo)}</small>
                              {hasConflict && <span className="TodoWeekCalendar-conflictBadge">Conflicto</span>}
                              {todo.text}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {timedTodos.length === 0 && (
            <p className="TodoWeekCalendar-emptyWeek">
              No hay elementos con horario esta semana.
            </p>
          )}

          {unscheduledTodos.length > 0 && (
            <aside className="TodoWeekCalendar-sideList" aria-label="Elementos sin fecha">
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
  getUntimedTodosByDay,
  getUntimedWeekTodos,
  getWeekDays,
  getWeekStart,
};
