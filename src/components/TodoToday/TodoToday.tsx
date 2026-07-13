import { ReactNode } from 'react';
import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_RECURRENCES,
  Todo,
  TodoKind,
  TodoRecurrence,
  getTodayDateValue,
} from '../../App/todoModel';
import {
  getTodoCalendarTypeLabel,
  getTodoScheduleRange,
  getTodoTimeLabel,
  isTodoVisibleOnDay,
} from '../TodoCalendar/TodoCalendar';
import './TodoToday.css';

type TodoTodaySectionKey = 'tasks' | 'events' | 'schedules' | 'periods';

type TodoTodaySections = Record<TodoTodaySectionKey, Todo[]>;

type TodoTodayReminder = {
  id: string;
  kind: 'now' | 'next';
  label: string;
  meta: string;
  text: string;
};

const TODO_RECURRENCE_LABELS: Record<TodoRecurrence, string> = {
  [TODO_RECURRENCES.none]: '',
  [TODO_RECURRENCES.daily]: 'Diaria',
  [TODO_RECURRENCES.weekly]: 'Semanal',
  [TODO_RECURRENCES.monthly]: 'Mensual',
  [TODO_RECURRENCES.yearly]: 'Anual',
};

const TODAY_SECTIONS: Array<{
  emptyText: string;
  id: TodoTodaySectionKey;
  kind: TodoKind;
  title: string;
}> = [
  {
    id: 'tasks',
    kind: TODO_KINDS.task,
    title: 'Tareas para completar',
    emptyText: 'No hay tareas pendientes para hoy.',
  },
  {
    id: 'events',
    kind: TODO_KINDS.event,
    title: 'Eventos del dia',
    emptyText: 'No hay eventos para hoy.',
  },
  {
    id: 'schedules',
    kind: TODO_KINDS.schedule,
    title: 'Horarios y cursadas',
    emptyText: 'No hay horarios activos hoy.',
  },
  {
    id: 'periods',
    kind: TODO_KINDS.period,
    title: 'Periodos activos',
    emptyText: 'No hay periodos activos hoy.',
  },
];

interface TodoTodayProps {
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

function createEmptyTodaySections(): TodoTodaySections {
  return {
    tasks: [],
    events: [],
    schedules: [],
    periods: [],
  };
}

function formatTodayDate(date = new Date()): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatDateValue(dateValue?: string | null): string | null {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.split('-');

  return year && month && day ? `${day}/${month}/${year}` : dateValue;
}

function getTodoRecurrenceLabel(todo: Todo): string {
  return todo.recurrence && todo.recurrence !== TODO_RECURRENCES.none
    ? TODO_RECURRENCE_LABELS[todo.recurrence]
    : '';
}

function isOverdueTask(todo: Todo, dateValue: string): boolean {
  const schedule = getTodoScheduleRange(todo);

  return Boolean(
    todo.kind === TODO_KINDS.task &&
    !todo.completed &&
    schedule?.type === TODO_DATE_TYPES.due &&
    schedule.endDate < dateValue
  );
}

function isTaskRelevantToday(todo: Todo, dateValue: string): boolean {
  return todo.kind === TODO_KINDS.task &&
    !todo.completed &&
    (isTodoVisibleOnDay(todo, dateValue) || isOverdueTask(todo, dateValue));
}

function compareTodayTodos(firstTodo: Todo, secondTodo: Todo): number {
  const firstTime = firstTodo.startTime || '99:99';
  const secondTime = secondTodo.startTime || '99:99';

  return firstTime.localeCompare(secondTime) || firstTodo.order - secondTodo.order;
}

function getMinutesFromTime(timeValue?: string | null): number | null {
  if (!timeValue) {
    return null;
  }

  const [hour, minute] = timeValue.split(':').map(Number);

  return Number.isFinite(hour) && Number.isFinite(minute)
    ? hour * 60 + minute
    : null;
}

function getNowMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

function getTodoEndMinutes(todo: Todo, startMinutes: number): number {
  const endMinutes = getMinutesFromTime(todo.endTime);

  return endMinutes !== null && endMinutes > startMinutes
    ? endMinutes
    : startMinutes + 60;
}

function getTodaySections(todos: Todo[], dateValue = getTodayDateValue()): TodoTodaySections {
  const sections = createEmptyTodaySections();

  todos.forEach(todo => {
    if (isTaskRelevantToday(todo, dateValue)) {
      sections.tasks.push(todo);
      return;
    }

    if (!isTodoVisibleOnDay(todo, dateValue)) {
      return;
    }

    if (todo.kind === TODO_KINDS.event) {
      sections.events.push(todo);
      return;
    }

    if (todo.kind === TODO_KINDS.schedule) {
      sections.schedules.push(todo);
      return;
    }

    if (todo.kind === TODO_KINDS.period) {
      sections.periods.push(todo);
    }
  });

  return {
    tasks: sections.tasks.sort(compareTodayTodos),
    events: sections.events.sort(compareTodayTodos),
    schedules: sections.schedules.sort(compareTodayTodos),
    periods: sections.periods.sort(compareTodayTodos),
  };
}

function getTodoTodayMeta(todo: Todo, dateValue = getTodayDateValue()): string {
  const schedule = getTodoScheduleRange(todo);
  const recurrenceLabel = getTodoRecurrenceLabel(todo);
  const timeLabel = getTodoTimeLabel(todo);
  const dateLabel = schedule ? formatDateValue(schedule.startDate) : null;
  const metaParts = [
    isOverdueTask(todo, dateValue) ? 'Vencida' : getTodoCalendarTypeLabel(todo),
    timeLabel,
    recurrenceLabel,
    dateLabel,
    todo.project,
  ];

  return metaParts.filter(Boolean).join(' - ');
}

function getTodaySummary(sections: TodoTodaySections): string {
  const taskCount = sections.tasks.length;
  const agendaCount = sections.events.length + sections.schedules.length + sections.periods.length;

  if (!taskCount && !agendaCount) {
    return 'Sin elementos para hoy';
  }

  const taskLabel = taskCount === 1 ? '1 tarea' : `${taskCount} tareas`;
  const agendaLabel = agendaCount === 1 ? '1 elemento de agenda' : `${agendaCount} elementos de agenda`;

  return `${taskLabel} - ${agendaLabel}`;
}

function getReminderCandidates(sections: TodoTodaySections): Todo[] {
  return [
    ...sections.tasks,
    ...sections.events,
    ...sections.schedules,
  ].filter(todo => Boolean(todo.startTime));
}

function getTodayReminder(sections: TodoTodaySections, now = new Date()): TodoTodayReminder | null {
  const nowMinutes = getNowMinutes(now);
  const candidates = getReminderCandidates(sections)
    .map(todo => {
      const startMinutes = getMinutesFromTime(todo.startTime);

      if (startMinutes === null) {
        return null;
      }

      return {
        todo,
        startMinutes,
        endMinutes: getTodoEndMinutes(todo, startMinutes),
      };
    })
    .filter((candidate): candidate is { todo: Todo; startMinutes: number; endMinutes: number } => Boolean(candidate))
    .sort((first, second) => first.startMinutes - second.startMinutes || first.todo.order - second.todo.order);

  const current = candidates.find(candidate =>
    candidate.startMinutes <= nowMinutes && nowMinutes < candidate.endMinutes
  );

  if (current) {
    return {
      id: current.todo.id,
      kind: 'now',
      label: 'Ahora',
      meta: getTodoTimeLabel(current.todo) || getTodoTodayMeta(current.todo),
      text: current.todo.text,
    };
  }

  const next = candidates.find(candidate => candidate.startMinutes > nowMinutes);

  if (!next) {
    return null;
  }

  return {
    id: next.todo.id,
    kind: 'next',
    label: 'Proximo',
    meta: getTodoTimeLabel(next.todo) || getTodoTodayMeta(next.todo),
    text: next.todo.text,
  };
}

function TodoToday({
  error,
  loading,
  onEditTodo,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  totalTodos,
  visibleTodos,
}: TodoTodayProps) {
  const todayDateValue = getTodayDateValue();
  const sections = getTodaySections(visibleTodos, todayDateValue);
  const todayReminder = getTodayReminder(sections);
  const totalTodayItems = Object.values(sections).reduce((count, sectionTodos) => count + sectionTodos.length, 0);

  return (
    <section
      className="TodoToday"
      id="todo-list"
      tabIndex={-1}
      aria-label="Vista de hoy"
    >
      {error && onError()}
      {loading && onLoading()}

      {!loading && !totalTodos && onEmptyTodos()}

      {(!!totalTodos && !visibleTodos.length) && onEmptySearchResults()}

      {!loading && !error && !!visibleTodos.length && (
        <>
          <header className="TodoToday-header">
            <div>
              <p>Hoy</p>
              <h2>Tu dia en foco</h2>
              <span>{formatTodayDate()}</span>
            </div>
            <strong>{getTodaySummary(sections)}</strong>
          </header>

          {todayReminder && (
            <button
              type="button"
              className={`TodoToday-reminder TodoToday-reminder--${todayReminder.kind}`}
              aria-label={`${todayReminder.label}: ${todayReminder.meta} ${todayReminder.text}`}
              onClick={() => onEditTodo(todayReminder.id)}
            >
              <span>{todayReminder.label}</span>
              <strong>{todayReminder.text}</strong>
              <small>{todayReminder.meta}</small>
            </button>
          )}

          {!totalTodayItems && (
            <p className="TodoToday-empty">
              No hay elementos para hoy con los filtros actuales.
            </p>
          )}

          {!!totalTodayItems && (
            <div className="TodoToday-grid">
              {TODAY_SECTIONS.map(section => {
                const sectionTodos = sections[section.id];

                return (
                  <section
                    className={`TodoToday-section TodoToday-section--${section.kind}`}
                    aria-label={section.title}
                    key={section.id}
                  >
                    <div className="TodoToday-sectionHeader">
                      <h3>{section.title}</h3>
                      <span>{sectionTodos.length}</span>
                    </div>

                    {sectionTodos.length === 0 ? (
                      <p className="TodoToday-sectionEmpty">{section.emptyText}</p>
                    ) : (
                      <ul className="TodoToday-list">
                        {sectionTodos.map(todo => {
                          const metaLabel = getTodoTodayMeta(todo, todayDateValue);

                          return (
                            <li key={todo.id}>
                              <button
                                type="button"
                                className={`TodoToday-item TodoToday-item--${todo.kind}`}
                                aria-label={`${section.title}: ${metaLabel} ${todo.text}`}
                                onClick={() => onEditTodo(todo.id)}
                              >
                                <span>{metaLabel}</span>
                                <strong>{todo.text}</strong>
                                {todo.description && <small>{todo.description}</small>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export { TodoToday };
export {
  getTodaySections,
  getTodayReminder,
  getTodaySummary,
  getTodoTodayMeta,
};
