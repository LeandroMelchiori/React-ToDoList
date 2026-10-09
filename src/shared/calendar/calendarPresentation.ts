import { TODO_DATE_TYPES, TODO_KINDS, TODO_RECURRENCES, isTodoRecurringOnDate } from './todoModel';
import type { Todo, TodoDateType, TodoKind } from './todoModel';

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

type TodoScheduleRange = {
  endDate: string;
  endTime: string | null;
  startDate: string;
  startTime: string | null;
  type: TodoDateType;
};

function getTodoScheduleRange(todo: Todo): TodoScheduleRange | null {
  if (todo.dateType === TODO_DATE_TYPES.event) {
    return todo.startDate
      ? {
          startDate: todo.startDate,
          endDate: todo.startDate,
          startTime: todo.startTime || null,
          endTime: todo.endTime || null,
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

function getTodoTimeLabel(todo: Pick<Todo, 'dateType' | 'startTime' | 'endTime'>): string {
  if (!todo.startTime) {
    return '';
  }

  return todo.dateType !== TODO_DATE_TYPES.due && todo.endTime
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

export { getTodoScheduleRange, isTodoVisibleOnDay, getTodoTimeLabel, getTodoCalendarTypeLabel, isCompactRecurringTodo };
export type { TodoScheduleRange };
