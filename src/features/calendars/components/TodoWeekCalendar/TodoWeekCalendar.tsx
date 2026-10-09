import React, { ReactNode } from 'react';
import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_RECURRENCES,
  Todo,
  TodoDateType,
  TodoKind,
  TodoRecurrence,
  TodoTimeBlock,
  TodoScheduleChange,
  getTodoPlanningCategory,
} from '../../../../shared/calendar/todoModel';
import { getTodoScheduleConflicts } from '../../../../shared/calendar/todoScheduleConflicts';
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery';
import {
  getTodoScheduleRange,
  getTodoTimeLabel,
  isCompactRecurringTodo,
  isTodoVisibleOnDay,
} from '../../../../shared/calendar/calendarPresentation';
import './TodoWeekCalendar.css';
import '../TodoAgenda/TodoPlanningCategory.css';

const WEEK_DAYS = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;
const HOUR_SLOT_HEIGHT = 56;
// The timeline also includes the one-pixel divider between hour rows.
const HOUR_ROW_HEIGHT = HOUR_SLOT_HEIGHT + 1;
const TODO_PLANNING_DRAG_TYPE = 'application/x-taskflow-todo';
const TODO_RESCHEDULE_DRAG_TYPE = 'application/x-taskflow-schedule';

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

type TodoTimeBlockEntry = {
  timeBlock: TodoTimeBlock;
  todo: Todo;
};

type TodoTimedLayoutEntry = {
  endMinutes: number;
  endTime: string;
  id: string;
  lane: number;
  laneCount: number;
  source: 'agenda' | 'timeBlock';
  startMinutes: number;
  startTime: string;
  timeBlock: TodoTimeBlock | null;
  todo: Todo;
};

interface TodoWeekCalendarProps {
  calendarSpan?: 'week' | 'threeDays' | 'day';
  embedded?: boolean;
  error?: boolean;
  loading?: boolean;
  onEditTodo: (id: string, occurrenceDate?: string) => void;
  onCreateTodoForSlot?: (dateValue: string, hour: number) => void;
  onScheduleTodoForSlot?: (id: string, dateValue: string, hour: number, source?: Pick<TodoScheduleChange, 'timeBlockId' | 'occurrenceDate'>) => void;
  onEmptySearchResults: () => ReactNode;
  onEmptyTodos: () => ReactNode;
  onError: () => ReactNode;
  onLoading: () => ReactNode;
  renderWhenEmpty?: boolean;
  showUnscheduled?: boolean;
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

  return firstDay === lastDay ? formatShortDate(firstDay) : `${formatShortDate(firstDay)} - ${formatShortDate(lastDay)}`;
}

function getCalendarDays(anchorDate: Date, span: 'week' | 'threeDays' | 'day', today = new Date()): WeekDay[] {
  if (span === 'week') return getWeekDays(anchorDate, today);

  return Array.from({ length: span === 'day' ? 1 : 3 }, (_, index) => {
    const date = addDays(anchorDate, index);
    const dateValue = toDateValue(date);
    return {
      date,
      dateValue,
      dayName: WEEK_DAYS[(date.getDay() + 6) % 7],
      dayNumber: date.getDate(),
      isToday: dateValue === toDateValue(today),
    };
  });
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

function getWeekTimeBlockEntries(todos: Todo[], weekDays: WeekDay[]): TodoTimeBlockEntry[] {
  const weekDateValues = new Set(weekDays.map(day => day.dateValue));

  return todos.flatMap(todo => (todo.timeBlocks || [])
    .filter(timeBlock => weekDateValues.has(timeBlock.date))
    .map(timeBlock => ({ timeBlock, todo })));
}

function getHourSlots(todos: Todo[], weekDays: WeekDay[], currentHour: number | null = null): number[] {
  const timedTodos = getWeekTimedTodos(todos, weekDays);
  const timeBlockEntries = getWeekTimeBlockEntries(todos, weekDays);
  const startHours = timedTodos
    .map(getTodoStartHour)
    .filter((hour): hour is number => hour !== null)
    .concat(timeBlockEntries
      .map(entry => getTodoStartHour(entry.timeBlock))
      .filter((hour): hour is number => hour !== null));
  const endHours = timedTodos
    .map(getTodoEndHour)
    .filter((hour): hour is number => hour !== null)
    .concat(timeBlockEntries
      .map(entry => getTodoEndHour(entry.timeBlock))
      .filter((hour): hour is number => hour !== null));
  const startHour = Math.max(0, Math.min(DEFAULT_START_HOUR, currentHour ?? DEFAULT_START_HOUR, ...startHours));
  const endHour = Math.min(23, Math.max(DEFAULT_END_HOUR, currentHour ?? DEFAULT_END_HOUR, ...endHours));

  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
}

function getTimedTimeBlocksForSlot(todos: Todo[], dateValue: string, hour: number): TodoTimeBlockEntry[] {
  return todos
    .flatMap(todo => (todo.timeBlocks || [])
      .filter(timeBlock => timeBlock.date === dateValue && getTodoStartHour(timeBlock) === hour)
      .map(timeBlock => ({ timeBlock, todo })))
    .sort((firstEntry, secondEntry) =>
      firstEntry.timeBlock.startTime.localeCompare(secondEntry.timeBlock.startTime) ||
      firstEntry.todo.order - secondEntry.todo.order
    );
}

function getTimeMinutes(timeValue: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) {
    return null;
  }

  const [hour, minute] = timeValue.split(':').map(Number);

  return (hour * 60) + minute;
}

function getTimedLayoutEntriesForDay(todos: Todo[], dateValue: string): TodoTimedLayoutEntry[] {
  const rawEntries = todos.flatMap(todo => {
    const agendaEntries: Omit<TodoTimedLayoutEntry, 'lane' | 'laneCount'>[] = [];

    if (todo.startTime && isTodoVisibleOnDay(todo, dateValue)) {
      const startMinutes = getTimeMinutes(todo.startTime);
      const parsedEndMinutes = todo.endTime ? getTimeMinutes(todo.endTime) : null;

      if (startMinutes !== null) {
        const endMinutes = parsedEndMinutes !== null && parsedEndMinutes > startMinutes
          ? parsedEndMinutes
          : Math.min(startMinutes + 60, 24 * 60);

        agendaEntries.push({
          endMinutes,
          endTime: todo.endTime || '',
          id: `${todo.id}:agenda`,
          source: 'agenda',
          startMinutes,
          startTime: todo.startTime,
          timeBlock: null,
          todo,
        });
      }
    }

    const timeBlockEntries = (todo.timeBlocks || []).flatMap(timeBlock => {
      if (timeBlock.date !== dateValue) {
        return [];
      }

      const startMinutes = getTimeMinutes(timeBlock.startTime);
      const endMinutes = getTimeMinutes(timeBlock.endTime);

      return startMinutes !== null && endMinutes !== null && endMinutes > startMinutes
        ? [{
            endMinutes,
            endTime: timeBlock.endTime,
            id: `${todo.id}:${timeBlock.id}`,
            source: 'timeBlock' as const,
            startMinutes,
            startTime: timeBlock.startTime,
            timeBlock,
            todo,
          }]
        : [];
    });

    return [...agendaEntries, ...timeBlockEntries];
  }).sort((firstEntry, secondEntry) =>
    firstEntry.startMinutes - secondEntry.startMinutes ||
    firstEntry.endMinutes - secondEntry.endMinutes ||
    firstEntry.todo.order - secondEntry.todo.order
  );
  const positionedEntries: TodoTimedLayoutEntry[] = [];
  let currentGroup: typeof rawEntries = [];
  let currentGroupEnd = -1;

  const closeGroup = () => {
    if (currentGroup.length === 0) {
      return;
    }

    const laneEnds: number[] = [];
    const assignedEntries = currentGroup.map(entry => {
      const reusableLane = laneEnds.findIndex(laneEnd => laneEnd <= entry.startMinutes);
      const lane = reusableLane >= 0 ? reusableLane : laneEnds.length;

      laneEnds[lane] = entry.endMinutes;

      return { ...entry, lane };
    });
    const laneCount = laneEnds.length;

    positionedEntries.push(...assignedEntries.map(entry => ({ ...entry, laneCount })));
    currentGroup = [];
    currentGroupEnd = -1;
  };

  rawEntries.forEach(entry => {
    if (currentGroup.length > 0 && entry.startMinutes >= currentGroupEnd) {
      closeGroup();
    }

    currentGroup.push(entry);
    currentGroupEnd = Math.max(currentGroupEnd, entry.endMinutes);
  });
  closeGroup();

  return positionedEntries;
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
  calendarSpan = 'week',
  embedded = false,
  error,
  loading,
  onEditTodo,
  onCreateTodoForSlot,
  onScheduleTodoForSlot,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  renderWhenEmpty = false,
  showUnscheduled = true,
  totalTodos,
  visibleTodos,
}: TodoWeekCalendarProps) {
  const [anchorDate, setAnchorDate] = React.useState(() => new Date());
  const [now, setNow] = React.useState(() => new Date());
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const autoScrolledKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', tick); };
  }, []);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  React.useEffect(() => {
    const clearDropTarget = () => setDropTarget(null);
    window.addEventListener('dragend', clearDropTarget);
    return () => window.removeEventListener('dragend', clearDropTarget);
  }, []);
  const isMobile = useMediaQuery('(max-width: 760px)');
  const todayDate = toDateValue(now);
  const weekDays = React.useMemo(() => getCalendarDays(anchorDate, calendarSpan, new Date(`${todayDate}T12:00:00`)), [anchorDate, calendarSpan, todayDate]);
  const displayedDays = isMobile && calendarSpan === 'week'
    ? weekDays.filter(day => day.dateValue === toDateValue(anchorDate))
    : weekDays;
  const currentHour = displayedDays.some(day => day.dateValue === todayDate) ? now.getHours() : null;
  const hourSlots = React.useMemo(() => getHourSlots(visibleTodos, weekDays, currentHour), [visibleTodos, weekDays, currentHour]);
  const timedTodos = React.useMemo(() => getWeekTimedTodos(visibleTodos, weekDays), [visibleTodos, weekDays]);
  const timedTimeBlocks = React.useMemo(
    () => getWeekTimeBlockEntries(visibleTodos, weekDays),
    [visibleTodos, weekDays]
  );
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
  const navigationStep = calendarSpan === 'day' ? 1 : calendarSpan === 'threeDays' ? 3 : 7;
  const previousLabel = calendarSpan === 'day' ? 'Día anterior' : calendarSpan === 'threeDays' ? 'Tres días anteriores' : 'Semana anterior';
  const nextLabel = calendarSpan === 'day' ? 'Día siguiente' : calendarSpan === 'threeDays' ? 'Tres días siguientes' : 'Semana siguiente';
  const calendarLabel = calendarSpan === 'day' ? 'Agenda diaria' : calendarSpan === 'threeDays' ? 'Agenda de tres días' : 'Agenda semanal';
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayCountStyle = { '--week-day-count': displayedDays.length } as React.CSSProperties;
  React.useEffect(() => {
    const key = `${toDateValue(anchorDate)}:${calendarSpan}:${isMobile}`;
    if (!scrollerRef.current || loading || error || autoScrolledKeyRef.current === key) return;
    autoScrolledKeyRef.current = key;
    if (displayedDays.some(day => day.dateValue === todayDate)) {
      scrollerRef.current.scrollTop = Math.max(0, (now.getHours() + now.getMinutes() / 60 - (hourSlots[0] || 0) - 1) * HOUR_ROW_HEIGHT);
      scrollerRef.current.style.setProperty('--planning-scroll-top', `${scrollerRef.current.scrollTop}px`);
    }
  }, [anchorDate, calendarSpan, isMobile, loading, error, todayDate, hourSlots, displayedDays, now]);
  const timedEntriesByDay = React.useMemo(() => new Map(
    weekDays.map(day => [day.dateValue, getTimedLayoutEntriesForDay(visibleTodos, day.dateValue)])
  ), [visibleTodos, weekDays]);

  return (
    <section
      className={embedded ? 'TodoWeekCalendar TodoWeekCalendar--embedded' : 'TodoWeekCalendar'}
      id={embedded ? undefined : 'todo-list'}
      tabIndex={embedded ? undefined : -1}
      aria-label={calendarLabel}
    >
      {error && onError()}
      {loading && onLoading()}

      {!renderWhenEmpty && !loading && !totalTodos && onEmptyTodos()}

      {!renderWhenEmpty && (!!totalTodos && !visibleTodos.length) && onEmptySearchResults()}

      {!loading && !error && (renderWhenEmpty || !!visibleTodos.length) && (
        <>
          <div className="TodoWeekCalendar-header">
            <div>
              <p>{calendarSpan === 'day' ? 'Tu día' : calendarSpan === 'threeDays' ? 'Tres días' : embedded ? 'Esta semana' : 'Agenda semanal'}</p>
              <h2>{calendarSpan === 'day' ? new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(anchorDate) : weekLabel}</h2>
            </div>
            <div className="TodoWeekCalendar-actions">
              <button aria-label={previousLabel} type="button" onClick={() => setAnchorDate(currentDate => addDays(currentDate, -navigationStep))}>
                <span className="TodoWeekCalendar-navArrow" aria-hidden="true">‹</span><span className="TodoWeekCalendar-navLabel">{previousLabel}</span>
              </button>
              <button type="button" onClick={() => { autoScrolledKeyRef.current = null; setAnchorDate(new Date()); }}>
                Hoy
              </button>
              <button aria-label={nextLabel} type="button" onClick={() => setAnchorDate(currentDate => addDays(currentDate, navigationStep))}>
                <span className="TodoWeekCalendar-navLabel">{nextLabel}</span><span className="TodoWeekCalendar-navArrow" aria-hidden="true">›</span>
              </button>
            </div>
          </div>

          {isMobile && calendarSpan === 'week' && (
            <div className="TodoWeekCalendar-dayPicker" role="group" aria-label="Elegir dia">
              {weekDays.map(day => (
                <button key={day.dateValue} type="button"
                  aria-pressed={day.dateValue === toDateValue(anchorDate)}
                  aria-label={`${day.dayName} ${formatShortDate(day.dateValue)}${day.isToday ? ', hoy' : ''}`}
                  onClick={() => setAnchorDate(day.date)}>
                  <span>{day.dayName}</span><strong>{day.dayNumber}</strong>
                </button>
              ))}
            </div>
          )}

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
            <div className="TodoWeekCalendar-allDay" style={dayCountStyle} role="group" aria-label="Elementos sin horario por dia">
              {untimedTodosByDay.filter(group => displayedDays.some(day => day.dateValue === group.dateValue)).map(group => {
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

          <div className="TodoPlanning-legend" aria-label="Categorías">
            <span data-category="work">Trabajo</span><span data-category="study">Estudio</span><span data-category="personal">Personal</span>
          </div>
          <div className="TodoWeekCalendar-scroller" ref={scrollerRef}
            onScroll={event => event.currentTarget.style.setProperty('--planning-scroll-top', `${event.currentTarget.scrollTop}px`)}>
            <div className="TodoWeekCalendar-grid" style={dayCountStyle} role="grid" aria-label={`${calendarLabel} ${weekLabel}`}>
              <div className="TodoWeekCalendar-row" role="row">
                <div className="TodoWeekCalendar-corner" role="columnheader" aria-label="Hora" />
                {displayedDays.map(day => (
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
              </div>

              {hourSlots.map(hour => (
                <div className="TodoWeekCalendar-row" role="row" key={hour}>
                  <div className="TodoWeekCalendar-hour" role="rowheader">
                    {formatHourSlot(hour)}
                  </div>
                  {displayedDays.map(day => {
                    const slotEntries = (timedEntriesByDay.get(day.dateValue) || [])
                      .filter(entry => Math.floor(entry.startMinutes / 60) === hour);

                    return (
                      <div
                        className={`TodoWeekCalendar-slot${dropTarget === `${day.dateValue}:${hour}` ? ' TodoWeekCalendar-slot--dropTarget' : ''}`}
                        role="gridcell"
                        aria-label={`${day.dayName} ${formatShortDate(day.dateValue)} ${formatHourSlot(hour)}`}
                        key={`${day.dateValue}-${hour}`}
                        onDragOver={event => {
                          if (!onScheduleTodoForSlot || !event.dataTransfer.types.some(type => [TODO_PLANNING_DRAG_TYPE, TODO_RESCHEDULE_DRAG_TYPE].includes(type))) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = event.dataTransfer.types.includes(TODO_RESCHEDULE_DRAG_TYPE) ? 'move' : 'copy';
                          setDropTarget(`${day.dateValue}:${hour}`);
                        }}
                        onDragLeave={event => {
                          if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
                        }}
                        onDrop={event => {
                          if (!onScheduleTodoForSlot) return;
                          if (event.dataTransfer.types.includes(TODO_RESCHEDULE_DRAG_TYPE)) {
                            event.preventDefault();
                            setDropTarget(null);
                            try {
                              const source = JSON.parse(event.dataTransfer.getData(TODO_RESCHEDULE_DRAG_TYPE));
                              const todo = visibleTodos.find(item => item.id === source.todoId && !item.archivedAt && !item.completed);
                              if (todo && (todo.kind === 'event' || todo.kind === 'schedule' ||
                                  (todo.kind === 'task' && todo.timeBlocks.some(block => block.id === source.timeBlockId)))) {
                                onScheduleTodoForSlot(todo.id, day.dateValue, hour, { timeBlockId: source.timeBlockId, occurrenceDate: source.occurrenceDate });
                              }
                            } catch { /* Ignore unrelated drag payloads. */ }
                            return;
                          }
                          if (!event.dataTransfer.types.includes(TODO_PLANNING_DRAG_TYPE)) return;
                          event.preventDefault();
                          setDropTarget(null);
                          const id = event.dataTransfer.getData(TODO_PLANNING_DRAG_TYPE);
                          const task = visibleTodos.find(todo => todo.id === id && todo.kind === TODO_KINDS.task && !todo.completed && !todo.archivedAt);
                          if (task) onScheduleTodoForSlot(id, day.dateValue, hour);
                        }}
                      >
                        {day.dateValue === todayDate && hour === now.getHours() && (
                          <div className="TodoWeekCalendar-now" role="img" aria-label={`Hora actual ${nowTime}`}
                            style={{ top: (now.getMinutes() / 60) * HOUR_ROW_HEIGHT }}><span>Ahora {nowTime}</span></div>
                        )}
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
                        {slotEntries.map(entry => {
                          const { timeBlock, todo } = entry;
                          const hasConflict = conflictingTodoKeys.has(`${day.dateValue}:${todo.id}`);
                          const eventStyle: React.CSSProperties = {
                            height: Math.max(36, ((entry.endMinutes - entry.startMinutes) / 60) * HOUR_ROW_HEIGHT - 6),
                            left: `calc(${(entry.lane * 100) / entry.laneCount}% + 4px)`,
                            top: ((entry.startMinutes % 60) / 60) * HOUR_ROW_HEIGHT + 3,
                            width: `calc(${100 / entry.laneCount}% - 8px)`,
                            ...({
                              '--planning-event-y': `${59 + ((entry.startMinutes / 60) - (hourSlots[0] || 0)) * HOUR_ROW_HEIGHT + 3}px`,
                              '--planning-label-max-offset': `${Math.max(0, ((entry.endMinutes - entry.startMinutes) / 60) * HOUR_ROW_HEIGHT - 62)}px`,
                            } as React.CSSProperties),
                          };

                          if (entry.source === 'timeBlock' && timeBlock) {
                            return (
                              <button
                                aria-label={`${timeBlock.startTime} a ${timeBlock.endTime} Trabajo ${todo.text}${todo.project ? ` ${todo.project}` : ''}${hasConflict ? ' Conflicto de horario' : ''}`}
                                className={[
                                  'TodoWeekCalendar-event',
                                  'TodoWeekCalendar-event--positioned',
                                  'TodoWeekCalendar-event--timeBlock',
                                  hasConflict ? 'TodoWeekCalendar-event--conflict' : '',
                                ].filter(Boolean).join(' ')}
                                key={entry.id}
                                data-category={getTodoPlanningCategory(todo)}
                                draggable={Boolean(onScheduleTodoForSlot && !todo.completed && !todo.archivedAt)}
                                onDragStart={event => {
                                  event.dataTransfer.effectAllowed = 'move';
                                  event.dataTransfer.setData(TODO_RESCHEDULE_DRAG_TYPE, JSON.stringify({ todoId: todo.id, timeBlockId: timeBlock.id }));
                                }}
                                onClick={() => onEditTodo(todo.id)}
                                style={eventStyle}
                                type="button"
                              >
                                <span className="TodoWeekCalendar-eventContent">
                                <small>{timeBlock.startTime} a {timeBlock.endTime} · {todo.project || 'Personal'}</small>
                                <span className="TodoWeekCalendar-blockLabel">Bloque</span>
                                {hasConflict && <span className="TodoWeekCalendar-conflictBadge">Conflicto</span>}
                                {todo.text}
                                </span>
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              className={[
                                'TodoWeekCalendar-event',
                                'TodoWeekCalendar-event--positioned',
                                `TodoWeekCalendar-event--${getTodoScheduleRange(todo)?.type || TODO_DATE_TYPES.due}`,
                                `TodoWeekCalendar-event--kind-${todo.kind || TODO_KINDS.task}`,
                                todo.completed ? 'TodoWeekCalendar-event--completed' : '',
                                hasConflict ? 'TodoWeekCalendar-event--conflict' : '',
                              ].filter(Boolean).join(' ')}
                              aria-label={`${getTodoWeekAriaLabel(todo)}${todo.project ? ` ${todo.project}` : ''}${hasConflict ? ' Conflicto de horario' : ''}`}
                              key={entry.id}
                              data-category={getTodoPlanningCategory(todo)}
                              draggable={Boolean(onScheduleTodoForSlot && !todo.completed && !todo.archivedAt && ['event', 'schedule'].includes(todo.kind))}
                              onDragStart={event => {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData(TODO_RESCHEDULE_DRAG_TYPE, JSON.stringify({ todoId: todo.id,
                                  occurrenceDate: todo.recurrence !== 'none' ? day.dateValue : undefined }));
                              }}
                              onClick={() => onEditTodo(todo.id, day.dateValue)}
                              style={eventStyle}
                            >
                              <span className="TodoWeekCalendar-eventContent">
                              <small>{getTodoTimeLabel(todo)} · {todo.project || 'Personal'}</small>
                              {hasConflict && <span className="TodoWeekCalendar-conflictBadge">Conflicto</span>}
                              {todo.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {timedTodos.length === 0 && timedTimeBlocks.length === 0 && (
            <p className="TodoWeekCalendar-emptyWeek">
              No hay elementos con horario esta semana.
            </p>
          )}

          {showUnscheduled && unscheduledTodos.length > 0 && (
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
  TODO_PLANNING_DRAG_TYPE,
  getCalendarDays,
  formatHourSlot,
  getHourSlots,
  getTimedTodosForSlot,
  getTimedTimeBlocksForSlot,
  getTimedLayoutEntriesForDay,
  getUntimedTodosByDay,
  getUntimedWeekTodos,
  getWeekDays,
  getWeekStart,
};
