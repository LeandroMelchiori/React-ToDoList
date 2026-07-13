import {
  formatHourSlot,
  getHourSlots,
  getTimedTodosForSlot,
  getUntimedTodosByDay,
  getUntimedWeekTodos,
  getWeekDays,
  getWeekStart,
} from './TodoWeekCalendar';

describe('TodoWeekCalendar helpers', () => {
  test('builds a Monday-first week from any anchor day', () => {
    const weekStart = getWeekStart(new Date(2026, 7, 12));
    const weekDays = getWeekDays(new Date(2026, 7, 12), new Date(2026, 7, 11));

    expect(weekStart).toEqual(new Date(2026, 7, 10));
    expect(weekDays.map(day => day.dateValue)).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
    expect(weekDays[1]).toEqual(expect.objectContaining({
      dayName: 'Mar',
      isToday: true,
    }));
  });

  test('expands hour slots to include scheduled tasks', () => {
    const weekDays = getWeekDays(new Date(2026, 7, 12));
    const todos = [
      {
        id: 'early',
        text: 'Practica temprano',
        dateType: 'event',
        startDate: '2026-08-12',
        startTime: '07:30',
      },
      {
        id: 'late',
        text: 'Cierre de cursada',
        dateType: 'event',
        startDate: '2026-08-12',
        startTime: '21:00',
      },
    ];

    expect(getHourSlots(todos, weekDays)[0]).toBe(7);
    expect(getHourSlots(todos, weekDays).at(-1)).toBe(21);
    expect(formatHourSlot(7)).toBe('07:00');
  });

  test('groups timed and untimed todos for the week grid', () => {
    const weekDays = getWeekDays(new Date(2026, 7, 12));
    const todos = [
      {
        id: 'exam',
        text: 'Rendir parcial',
        dateType: 'event',
        startDate: '2026-08-11',
        startTime: '10:00',
        order: 0,
      },
      {
        id: 'course',
        text: 'Cursar programacion',
        dateType: 'period',
        startDate: '2026-08-10',
        endDate: '2026-08-14',
        startTime: '10:00',
        endTime: '12:00',
        order: 1,
      },
      {
        id: 'reading',
        text: 'Leer capitulo',
        dateType: 'due',
        dueDate: '2026-08-11',
        order: 2,
      },
    ];

    expect(getTimedTodosForSlot(todos, '2026-08-11', 10).map(todo => todo.id)).toEqual([
      'exam',
      'course',
    ]);
    const untimedTodos = getUntimedWeekTodos(todos, weekDays);

    expect(untimedTodos).toEqual([
      expect.objectContaining({
        dateValue: '2026-08-11',
        dayLabel: 'Mar 11/08',
        todo: expect.objectContaining({ id: 'reading' }),
      }),
    ]);
    expect(getUntimedTodosByDay(untimedTodos, weekDays).find(day => day.dateValue === '2026-08-11').todos).toEqual([
      expect.objectContaining({ id: 'reading' }),
    ]);
  });
});
