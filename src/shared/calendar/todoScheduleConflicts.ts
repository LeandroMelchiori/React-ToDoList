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

type TodoScheduleConflictMatch = {
  firstDate: string;
  occurrences: number;
  text: string;
  todoId: string;
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

function getTodoTimeIntervals(todo: Todo, dateValue: string): TodoTimeInterval[] {
  const scheduledInterval = getTodoTimeInterval(todo, dateValue);
  const timeBlockIntervals = (todo.timeBlocks || []).flatMap((timeBlock) => {
    if (timeBlock.date !== dateValue) {
      return [];
    }

    const startMinutes = getTimeMinutes(timeBlock.startTime);
    const endMinutes = getTimeMinutes(timeBlock.endTime);

    return startMinutes !== null && endMinutes !== null && endMinutes > startMinutes
      ? [{ startMinutes, endMinutes, todoId: todo.id }]
      : [];
  });

  return scheduledInterval ? [scheduledInterval, ...timeBlockIntervals] : timeBlockIntervals;
}

function parseDateValue(dateValue: string): Date | null {
  const [year, month, day] = dateValue.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCandidateDateValues(todo: Todo, maximumDays = 366): string[] {
  const dateValues = new Set((todo.timeBlocks || []).map(timeBlock => timeBlock.date));
  const startDateValue = todo.dateType === TODO_DATE_TYPES.due
    ? todo.dueDate
    : todo.startDate;
  const startDate = startDateValue ? parseDateValue(startDateValue) : null;

  if (!startDate || !todo.startTime || !todo.endTime) {
    return [...dateValues].sort();
  }

  const explicitEndDateValue = todo.recurrence !== TODO_RECURRENCES.none
    ? todo.recurrenceEndDate || todo.endDate
    : todo.endDate || startDateValue;
  const explicitEndDate = explicitEndDateValue ? parseDateValue(explicitEndDateValue) : null;
  const fallbackEndDate = new Date(startDate);
  fallbackEndDate.setDate(fallbackEndDate.getDate() + maximumDays - 1);
  const endDate = explicitEndDate && explicitEndDate < fallbackEndDate
    ? explicitEndDate
    : todo.recurrence === TODO_RECURRENCES.none
      ? explicitEndDate || startDate
      : fallbackEndDate;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate && dateValues.size < maximumDays) {
    const dateValue = toDateValue(currentDate);

    if (isTodoScheduledOnDate(todo, dateValue)) {
      dateValues.add(dateValue);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return [...dateValues].sort();
}

function getTodoScheduleConflictMatches(
  todos: Todo[],
  candidate: Todo,
  excludedTodoId: string | null = null
): TodoScheduleConflictMatch[] {
  const matches = new Map<string, TodoScheduleConflictMatch>();

  getCandidateDateValues(candidate).forEach((dateValue) => {
    const candidateIntervals = getTodoTimeIntervals(candidate, dateValue);

    if (candidateIntervals.length === 0) {
      return;
    }

    todos.forEach((todo) => {
      if (todo.id === excludedTodoId || todo.id === candidate.id) {
        return;
      }

      const intervals = getTodoTimeIntervals(todo, dateValue);
      const overlaps = candidateIntervals.some(candidateInterval => intervals.some(interval => !(
        candidateInterval.startMinutes >= interval.endMinutes ||
        interval.startMinutes >= candidateInterval.endMinutes
      )));

      if (!overlaps) {
        return;
      }

      const currentMatch = matches.get(todo.id);

      matches.set(todo.id, currentMatch
        ? { ...currentMatch, occurrences: currentMatch.occurrences + 1 }
        : { firstDate: dateValue, occurrences: 1, text: todo.text, todoId: todo.id });
    });
  });

  return [...matches.values()];
}

function getTodoScheduleConflicts(todos: Todo[], dateValues: string[]): TodoScheduleConflict[] {
  return dateValues.flatMap((dateValue) => {
    const intervals = todos
      .flatMap(todo => getTodoTimeIntervals(todo, dateValue))
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

export { getTodoScheduleConflictMatches, getTodoScheduleConflicts };
export type { TodoScheduleConflict, TodoScheduleConflictMatch };
