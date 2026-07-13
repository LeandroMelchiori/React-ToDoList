import {
  TODO_DATE_TYPES,
  TODO_RECURRENCES,
  isTodoRecurringOnDate,
} from './todoModel';
import type { Todo } from './todoModel';

type TodoScheduleConflict = {
  dateValue: string;
  todoIds: string[];
};

type TodoTimeInterval = {
  endMinutes: number;
  startMinutes: number;
  todoId: string;
};

function getTimeMinutes(timeValue: string | null): number | null {
  if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) {
    return null;
  }

  const [hours, minutes] = timeValue.split(':').map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return (hours * 60) + minutes;
}

function isTodoScheduledOnDate(todo: Todo, dateValue: string): boolean {
  if (todo.recurrence !== TODO_RECURRENCES.none) {
    return isTodoRecurringOnDate(todo, dateValue);
  }

  if (todo.dateType === TODO_DATE_TYPES.event) {
    return todo.startDate === dateValue;
  }

  if (todo.dateType === TODO_DATE_TYPES.period) {
    return Boolean(
      todo.startDate &&
      todo.startDate <= dateValue &&
      dateValue <= (todo.endDate || todo.startDate)
    );
  }

  return todo.dueDate === dateValue;
}

function getTodoTimeInterval(todo: Todo, dateValue: string): TodoTimeInterval | null {
  if (!isTodoScheduledOnDate(todo, dateValue)) {
    return null;
  }

  const startMinutes = getTimeMinutes(todo.startTime);
  const endMinutes = getTimeMinutes(todo.endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return { startMinutes, endMinutes, todoId: todo.id };
}

function getTodoScheduleConflicts(todos: Todo[], dateValues: string[]): TodoScheduleConflict[] {
  return dateValues.flatMap((dateValue) => {
    const intervals = todos
      .map(todo => getTodoTimeInterval(todo, dateValue))
      .filter((interval): interval is TodoTimeInterval => interval !== null)
      .sort((first, second) => (
        first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes
      ));
    const conflicts: TodoScheduleConflict[] = [];
    let currentGroup: TodoTimeInterval[] = [];
    let currentEnd = -1;

    const closeGroup = () => {
      if (currentGroup.length > 1) {
        conflicts.push({
          dateValue,
          todoIds: currentGroup.map(interval => interval.todoId),
        });
      }
    };

    intervals.forEach((interval) => {
      if (currentGroup.length === 0 || interval.startMinutes < currentEnd) {
        currentGroup.push(interval);
        currentEnd = Math.max(currentEnd, interval.endMinutes);
        return;
      }

      closeGroup();
      currentGroup = [interval];
      currentEnd = interval.endMinutes;
    });

    closeGroup();
    return conflicts;
  });
}

export { getTodoScheduleConflicts };
export type { TodoScheduleConflict };
