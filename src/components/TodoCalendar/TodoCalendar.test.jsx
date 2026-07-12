import {
  getCalendarDays,
  getTodoScheduleRange,
  getTodoTimeLabel,
  getUnscheduledTodos,
  isCompactRecurringTodo,
  isTodoVisibleOnDay,
} from './TodoCalendar';

describe('TodoCalendar helpers', () => {
  test('builds a six-week month grid starting on Monday', () => {
    const days = getCalendarDays(new Date(2026, 6, 1));

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual(expect.objectContaining({
      dateValue: '2026-06-29',
      isCurrentMonth: false,
    }));
    expect(days[2]).toEqual(expect.objectContaining({
      dateValue: '2026-07-01',
      isCurrentMonth: true,
    }));
  });

  test('maps due, event and period schedules to calendar ranges', () => {
    const dueTodo = {
      dateType: 'due',
      dueDate: '2026-07-20',
    };
    const eventTodo = {
      dateType: 'event',
      startDate: '2026-07-22',
    };
    const periodTodo = {
      dateType: 'period',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      startTime: '10:00',
      endTime: '12:00',
    };

    expect(getTodoScheduleRange(dueTodo)).toEqual({
      type: 'due',
      startDate: '2026-07-20',
      endDate: '2026-07-20',
      startTime: null,
      endTime: null,
    });
    expect(getTodoScheduleRange(eventTodo)).toEqual({
      type: 'event',
      startDate: '2026-07-22',
      endDate: '2026-07-22',
      startTime: null,
      endTime: null,
    });
    expect(getTodoScheduleRange(periodTodo)).toEqual({
      type: 'period',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      startTime: '10:00',
      endTime: '12:00',
    });
    expect(isTodoVisibleOnDay(periodTodo, '2026-07-05')).toBe(true);
    expect(isTodoVisibleOnDay(periodTodo, '2026-07-12')).toBe(false);
  });

  test('returns todos without calendar dates as unscheduled', () => {
    expect(getUnscheduledTodos([
      { id: 'todo-1', text: 'Sin fecha', dateType: 'due', dueDate: null },
      { id: 'todo-2', text: 'Con fecha', dateType: 'due', dueDate: '2026-07-20' },
    ])).toEqual([
      expect.objectContaining({ id: 'todo-1' }),
    ]);
  });

  test('projects recurring todos on matching calendar days', () => {
    const dailyTodo = {
      id: 'daily',
      text: 'Repasar vocabulario',
      dateType: 'due',
      dueDate: '2026-07-01',
      recurrence: 'daily',
    };
    const weeklyTodo = {
      id: 'weekly',
      text: 'Planificacion semanal',
      dateType: 'due',
      dueDate: '2026-07-06',
      recurrence: 'weekly',
    };
    const monthlyTodo = {
      id: 'monthly',
      text: 'Revisar presupuesto',
      dateType: 'due',
      dueDate: '2026-07-15',
      recurrence: 'monthly',
    };
    const yearlyTodo = {
      id: 'yearly',
      text: 'Renovar dominio',
      dateType: 'event',
      startDate: '2026-07-20',
      recurrence: 'yearly',
    };

    expect(isTodoVisibleOnDay(dailyTodo, '2026-07-10')).toBe(true);
    expect(isTodoVisibleOnDay(dailyTodo, '2026-06-30')).toBe(false);
    expect(isTodoVisibleOnDay(weeklyTodo, '2026-07-13')).toBe(true);
    expect(isTodoVisibleOnDay(weeklyTodo, '2026-07-14')).toBe(false);
    expect(isTodoVisibleOnDay(monthlyTodo, '2026-08-15')).toBe(true);
    expect(isTodoVisibleOnDay(monthlyTodo, '2026-08-16')).toBe(false);
    expect(isTodoVisibleOnDay(yearlyTodo, '2027-07-20')).toBe(true);
    expect(isTodoVisibleOnDay(yearlyTodo, '2027-07-21')).toBe(false);
  });

  test('compacts daily recurring todos in the calendar grid', () => {
    expect(isCompactRecurringTodo({ recurrence: 'daily' })).toBe(true);
    expect(isCompactRecurringTodo({ recurrence: 'weekly' })).toBe(false);
    expect(isCompactRecurringTodo({ recurrence: 'none' })).toBe(false);
  });

  test('formats calendar time labels for fixed times and ranges', () => {
    expect(getTodoTimeLabel({
      dateType: 'event',
      startTime: '10:00',
      endTime: null,
    })).toBe('10:00');
    expect(getTodoTimeLabel({
      dateType: 'period',
      startTime: '10:00',
      endTime: '12:00',
    })).toBe('10:00 a 12:00');
    expect(getTodoTimeLabel({
      dateType: 'due',
      startTime: null,
      endTime: null,
    })).toBe('');
  });
});
