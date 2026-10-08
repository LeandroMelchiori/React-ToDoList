import React, { ReactNode } from 'react';
import {
  TODO_KINDS,
  TODO_RECURRENCES,
  Todo,
  TodoKind,
  getTodoNextRecurringDate,
} from '../../App/todoModel';
import { getTodoScheduleRange } from '../TodoCalendar/TodoCalendar';
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
  error?: boolean;
  loading?: boolean;
  onEditTodo: (id: string, occurrenceDate?: string) => void;
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
    year: 'numeric',
  }).format(date);
}

function formatShortDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-');

  return year && month && day ? `${day}/${month}/${year}` : dateValue;
}

function getTodoAgendaEntries(todos: Todo[], todayDate = toDateValue(new Date())): TodoAgendaEntry[] {
  const entries = todos.flatMap<TodoAgendaEntry>(todo => {
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

function TodoAgenda({
  error,
  loading,
  onEditTodo,
  onEmptySearchResults,
  onEmptyTodos,
  onError,
  onLoading,
  totalTodos,
  visibleTodos,
}: TodoAgendaProps) {
  const entries = React.useMemo(() => getTodoAgendaEntries(visibleTodos), [visibleTodos]);
  const groupedEntries = React.useMemo(() => {
    const groups = new Map<string, TodoAgendaEntry[]>();

    entries.forEach(entry => {
      groups.set(entry.dateValue, [...(groups.get(entry.dateValue) || []), entry]);
    });

    return [...groups.entries()];
  }, [entries]);

  return (
    <section className="TodoAgenda" id="todo-list" tabIndex={-1} aria-label="Agenda cronologica">
      {error && onError()}
      {loading && onLoading()}
      {!loading && !totalTodos && onEmptyTodos()}
      {!!totalTodos && !visibleTodos.length && onEmptySearchResults()}

      {!loading && !error && !!visibleTodos.length && (
        <>
          <header className="TodoAgenda-header">
            <div>
              <p>Proximos compromisos</p>
              <h2>Agenda cronologica</h2>
            </div>
            <span>{entries.length === 1 ? '1 proximo' : `${entries.length} proximos`}</span>
          </header>

          {entries.length === 0 ? (
            <p className="TodoAgenda-empty">No hay proximos elementos con fecha.</p>
          ) : (
            <div className="TodoAgenda-groups">
              {groupedEntries.map(([dateValue, dayEntries]) => (
                <section className="TodoAgenda-day" key={dateValue}>
                  <h3><time dateTime={dateValue}>{formatAgendaDate(dateValue)}</time></h3>
                  <ul>
                    {dayEntries.map(entry => {
                      const isPeriod = entry.todo.kind === TODO_KINDS.period && entry.endDate && entry.endDate !== entry.dateValue;
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
        </>
      )}
    </section>
  );
}

export { TodoAgenda, getTodoAgendaEntries };
