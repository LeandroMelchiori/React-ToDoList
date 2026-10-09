import React from 'react';
import type { ReactNode } from 'react';
import {
  TODO_KINDS,
  TODO_RECURRENCES,
  getTodoNextRecurringDate,
} from '../../App/todoModel';
import type { Todo, TodoKind, TodoScheduleChange } from '../../App/todoModel';
import { getTodoScheduleRange } from '../TodoCalendar/TodoCalendar';
import { TodoWeekCalendar, TODO_PLANNING_DRAG_TYPE } from '../TodoWeekCalendar/TodoWeekCalendar';
import './TodoAgenda.css';

type TodoAgendaEntry = {
  dateValue: string;
  endDate: string | null;
  endTime: string | null;
  id: string;
  occurrenceDate: string | null;
  source: 'schedule' | 'timeBlock';
  startTime: string | null;
  todo: Todo;
};

interface TodoAgendaProps {
  calendarSpan?: 'week' | 'threeDays' | 'day';
  error?: boolean;
  loading?: boolean;
  onCreateTodoForSlot?: (dateValue: string, hour: number) => void;
  onEditTodo: (id: string, occurrenceDate?: string) => void;
  onCompleteTodo?: (id: string) => void;
  onScheduleTodo?: (id: string) => void;
  onScheduleTodoForSlot?: (id: string, dateValue: string, hour: number, source?: Pick<TodoScheduleChange, 'timeBlockId' | 'occurrenceDate'>) => void;
  onEmptySearchResults: () => ReactNode;
  onEmptyTodos: () => ReactNode;
  onError: () => ReactNode;
  onLoading: () => ReactNode;
  totalTodos: number;
  visibleTodos: Todo[];
}

const TODO_KIND_LABELS: Record<TodoKind, string> = {
  [TODO_KINDS.task]: 'Tarea',
  [TODO_KINDS.event]: 'Evento',
  [TODO_KINDS.schedule]: 'Horario',
  [TODO_KINDS.period]: 'Periodo',
};

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatAgendaDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatShortDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-');

  return year && month && day ? `${day}/${month}/${year}` : dateValue;
}

function getTodoAgendaEntries(todos: Todo[], todayDate = toDateValue(new Date())): TodoAgendaEntry[] {
  const entries = todos.flatMap<TodoAgendaEntry>(todo => {
    if (todo.archivedAt || (todo.kind === TODO_KINDS.task && todo.completed)) {
      return [];
    }

    const todoEntries: TodoAgendaEntry[] = [];

    (todo.timeBlocks || [])
      .filter(timeBlock => timeBlock.date >= todayDate)
      .forEach(timeBlock => {
        todoEntries.push({
          dateValue: timeBlock.date,
          endDate: null,
          endTime: timeBlock.endTime,
          id: `${todo.id}:block:${timeBlock.id}`,
          occurrenceDate: null,
          source: 'timeBlock',
          startTime: timeBlock.startTime,
          todo,
        });
      });

    const isRecurring = todo.recurrence && todo.recurrence !== TODO_RECURRENCES.none;
    const recurringDate = isRecurring ? getTodoNextRecurringDate(todo, todayDate) : null;
    const schedule = getTodoScheduleRange(todo);

    if (recurringDate) {
      todoEntries.push({
        dateValue: recurringDate,
        endDate: recurringDate,
        endTime: schedule?.endTime || null,
        id: `${todo.id}:recurrence:${recurringDate}`,
        occurrenceDate: recurringDate,
        source: 'schedule',
        startTime: schedule?.startTime || null,
        todo,
      });
    } else if (schedule && schedule.endDate >= todayDate) {
      todoEntries.push({
        dateValue: schedule.startDate < todayDate ? todayDate : schedule.startDate,
        endDate: schedule.endDate,
        endTime: schedule.endTime,
        id: `${todo.id}:schedule`,
        occurrenceDate: null,
        source: 'schedule',
        startTime: schedule.startTime,
        todo,
      });
    }

    return todoEntries;
  });

  return entries.sort((first, second) => {
    const dateComparison = first.dateValue.localeCompare(second.dateValue);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const firstTime = first.startTime || '23:59';
    const secondTime = second.startTime || '23:59';

    return firstTime.localeCompare(secondTime) || first.todo.order - second.todo.order;
  });
}

function getUnscheduledAgendaTodos(todos: Todo[], todayDate = toDateValue(new Date())): Todo[] {
  return todos
    .filter(todo => {
      const hasFutureTimeBlock = (todo.timeBlocks || []).some(timeBlock => timeBlock.date >= todayDate);

      return (
        todo.kind === TODO_KINDS.task &&
        !todo.completed &&
        !todo.archivedAt &&
        !getTodoScheduleRange(todo) &&
        !hasFutureTimeBlock
      );
    })
    .sort((first, second) => first.order - second.order);
}

function TodoAgenda({
  calendarSpan = 'week',
  error,
  loading,
  onCreateTodoForSlot,
  onEditTodo,
  onCompleteTodo,
  onScheduleTodo,
  onScheduleTodoForSlot,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  totalTodos,
  visibleTodos,
}: TodoAgendaProps) {
  const [mobilePanel, setMobilePanel] = React.useState<'calendar' | 'tasks'>('calendar');
  const entries = React.useMemo(() => getTodoAgendaEntries(visibleTodos), [visibleTodos]);
  const unscheduledTodos = React.useMemo(
    () => getUnscheduledAgendaTodos(visibleTodos),
    [visibleTodos],
  );
  const groupedEntries = React.useMemo(() => {
    const groups = new Map<string, TodoAgendaEntry[]>();

    entries.forEach(entry => {
      groups.set(entry.dateValue, [...(groups.get(entry.dateValue) || []), entry]);
    });

    return [...groups.entries()];
  }, [entries]);

  return (
    <section className="TodoAgenda" id="todo-list" tabIndex={-1} aria-label="Planificacion personal">
      {error && onError()}
      {loading && onLoading()}

      {!loading && !error && (
        <>
          <div className="TodoAgenda-mobilePanels" role="group" aria-label="Contenido de planificacion">
            <button type="button" aria-pressed={mobilePanel === 'calendar'} onClick={() => setMobilePanel('calendar')}>Calendario</button>
            <button type="button" aria-pressed={mobilePanel === 'tasks'} onClick={() => setMobilePanel('tasks')}>Sin fecha ({unscheduledTodos.length})</button>
          </div>

          {!!totalTodos && !visibleTodos.length && (
            <div className="TodoAgenda-filterEmpty">{onEmptySearchResults()}</div>
          )}

          <div className={`TodoAgenda-mainGrid TodoAgenda-mainGrid--${mobilePanel}`}>
          <section className="TodoAgenda-weekPanel" aria-label={calendarSpan === 'day' ? 'Plan diario' : calendarSpan === 'threeDays' ? 'Plan de tres días' : 'Plan semanal'}>
            <TodoWeekCalendar
              calendarSpan={calendarSpan}
              embedded
              error={false}
              loading={false}
              onCreateTodoForSlot={onCreateTodoForSlot}
              onScheduleTodoForSlot={onScheduleTodoForSlot}
              onEditTodo={onEditTodo}
              onEmptySearchResults={() => null}
              onEmptyTodos={() => null}
              onError={() => null}
              onLoading={() => null}
              renderWhenEmpty
              showUnscheduled={false}
              totalTodos={totalTodos}
              visibleTodos={visibleTodos}
            />
          </section>

          <div className="TodoAgenda-dashboardGrid">
            <aside className="TodoAgenda-panel TodoAgenda-unscheduled" aria-labelledby="todo-agenda-unscheduled-title">
              <header className="TodoAgenda-panelHeader">
                <div>
                  <p>Sin calendario</p>
                  <h3 id="todo-agenda-unscheduled-title">Pendientes sin fecha</h3>
                </div>
                <span>{unscheduledTodos.length}</span>
              </header>

              {onScheduleTodoForSlot && <p className="TodoAgenda-dragHint">Arrastrá una tarea al calendario o elegí Programar.</p>}

              {unscheduledTodos.length === 0 ? (
                <p className="TodoAgenda-empty">
                  No tenés pendientes sin fecha. Lo que tenga día u horario aparecerá en la planificación.
                </p>
              ) : (
                <ul className="TodoAgenda-unscheduledList">
                  {unscheduledTodos.map(todo => (
                    <li key={todo.id}>
                      {onCompleteTodo && <input type="checkbox" aria-label={`Completar ${todo.text}`} onChange={() => onCompleteTodo(todo.id)} />}
                      <button type="button" onClick={() => onEditTodo(todo.id)}
                        draggable={Boolean(onScheduleTodoForSlot)}
                        onDragStart={event => {
                          event.dataTransfer.effectAllowed = 'copy';
                          event.dataTransfer.setData(TODO_PLANNING_DRAG_TYPE, todo.id);
                        }}>
                        <span>
                          <strong>{todo.text}</strong>
                          <small>Sin fecha asignada</small>
                        </span>
                        <span aria-hidden="true">→</span>
                      </button>
                      {onScheduleTodo && <button className="TodoAgenda-scheduleAction" type="button" aria-label={`Programar ${todo.text}`} onClick={() => onScheduleTodo(todo.id)}>Programar</button>}
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <details className="TodoAgenda-panel TodoAgenda-upcoming">
              <summary>Próximos compromisos ({entries.length})</summary>

              {groupedEntries.length === 0 ? (
                <p className="TodoAgenda-empty">No hay próximos elementos con fecha.</p>
              ) : (
                <div className="TodoAgenda-groups">
                  {groupedEntries.map(([dateValue, dayEntries]) => (
                    <section className="TodoAgenda-day" key={dateValue}>
                      <h4><time dateTime={dateValue}>{formatAgendaDate(dateValue)}</time></h4>
                      <ul>
                        {dayEntries.map(entry => {
                          const isPeriod = (
                            entry.todo.kind === TODO_KINDS.period &&
                            entry.endDate &&
                            entry.endDate !== entry.dateValue
                          );
                          const timeLabel = entry.startTime
                            ? entry.endTime
                              ? `${entry.startTime} - ${entry.endTime}`
                              : entry.startTime
                            : 'Sin horario';

                          return (
                            <li key={entry.id}>
                              <button
                                className="TodoAgenda-item"
                                type="button"
                                onClick={() => onEditTodo(entry.todo.id, entry.occurrenceDate || undefined)}
                              >
                                <span className="TodoAgenda-time">{timeLabel}</span>
                                <span className="TodoAgenda-content">
                                  <strong>{entry.todo.text}</strong>
                                  <small>
                                    {entry.source === 'timeBlock'
                                      ? 'Bloque de trabajo'
                                      : TODO_KIND_LABELS[entry.todo.kind]}
                                    {isPeriod && entry.endDate ? ` · hasta ${formatShortDate(entry.endDate)}` : ''}
                                  </small>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </details>
          </div>
          </div>

          {!totalTodos && (
            <div className="TodoAgenda-onboarding">
              {onEmptyTodos()}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export { TodoAgenda, getTodoAgendaEntries, getUnscheduledAgendaTodos };
