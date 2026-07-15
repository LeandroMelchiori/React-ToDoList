import { render, screen } from '@testing-library/react';
import { TodoWeekCalendar } from './TodoWeekCalendar';
import {
  formatHourSlot,
  getHourSlots,
  getTimedTodosForSlot,
  getTimedTimeBlocksForSlot,
  getTimedLayoutEntriesForDay,
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

  test('places task work blocks in their weekly time slot', () => {
    const task = {
      id: 'task-1',
      text: 'Preparar entrega',
      order: 0,
      timeBlocks: [
        { id: 'block-1', date: '2026-08-11', startTime: '07:30', endTime: '09:00' },
      ],
    };
    const weekDays = getWeekDays(new Date(2026, 7, 12));

    expect(getHourSlots([task], weekDays)[0]).toBe(7);
    expect(getTimedTimeBlocksForSlot([task], '2026-08-11', 7)).toEqual([
      { todo: task, timeBlock: task.timeBlocks[0] },
    ]);
  });

  test('assigns side-by-side lanes to overlapping timed items', () => {
    const todos = [
      {
        id: 'course',
        text: 'Cursar algebra',
        order: 0,
        dateType: 'period',
        startDate: '2026-08-10',
        endDate: '2026-08-10',
        startTime: '10:00',
        endTime: '12:00',
      },
      {
        id: 'consultation',
        text: 'Consulta',
        order: 1,
        dateType: 'event',
        startDate: '2026-08-10',
        startTime: '11:00',
        endTime: '11:30',
      },
      {
        id: 'review',
        text: 'Repaso',
        order: 2,
        dateType: 'event',
        startDate: '2026-08-10',
        startTime: '11:30',
        endTime: '12:30',
      },
      {
        id: 'later',
        text: 'Actividad posterior',
        order: 3,
        dateType: 'event',
        startDate: '2026-08-10',
        startTime: '13:00',
        endTime: '14:00',
      },
    ];

    const entries = getTimedLayoutEntriesForDay(todos, '2026-08-10');

    expect(entries.map(entry => ({ id: entry.todo.id, lane: entry.lane, laneCount: entry.laneCount }))).toEqual([
      { id: 'course', lane: 0, laneCount: 2 },
      { id: 'consultation', lane: 1, laneCount: 2 },
      { id: 'review', lane: 1, laneCount: 2 },
      { id: 'later', lane: 0, laneCount: 1 },
    ]);
  });
});

describe('TodoWeekCalendar conflicts', () => {
  test('highlights overlapping schedule ranges in the visible week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0));
    const baseTodo = {
      kind: 'schedule',
      description: null,
      completed: false,
      order: 0,
      priority: 'medium',
      dateType: 'period',
      dueDate: null,
      startDate: '2026-08-10',
      endDate: '2026-08-10',
      recurrence: 'none',
      recurrenceDays: [],
      recurrenceEndDate: null,
      recurrenceCount: null,
      completedOccurrences: [],
      reminder: 'none',
      project: null,
      tags: [],
      subtasks: [],
      createdAt: null,
      completedAt: null,
      archivedAt: null,
    };

    render(
      <TodoWeekCalendar
        onEditTodo={vi.fn()}
        onEmptySearchResults={() => null}
        onEmptyTodos={() => null}
        onError={() => null}
        onLoading={() => null}
        totalTodos={2}
        visibleTodos={[
          { ...baseTodo, id: 'course', text: 'Cursar algebra', startTime: '10:00', endTime: '12:00' },
          { ...baseTodo, id: 'exam', text: 'Consulta previa', startTime: '11:00', endTime: '11:30' },
        ]}
      />
    );

    expect(screen.getByRole('status', { name: 'Conflictos de horario' })).toHaveTextContent('1 conflicto de horario');
    const courseButton = screen.getByRole('button', { name: /Cursar algebra Conflicto de horario/ });
    const consultationButton = screen.getByRole('button', { name: /Consulta previa Conflicto de horario/ });

    expect(courseButton).toHaveClass('TodoWeekCalendar-event--conflict');
    expect(consultationButton).toHaveClass('TodoWeekCalendar-event--conflict');
    expect(courseButton).toHaveStyle({ height: '150px', left: 'calc(0% + 4px)', width: 'calc(50% - 8px)' });
    expect(consultationButton).toHaveStyle({ height: '36px', left: 'calc(50% + 4px)', width: 'calc(50% - 8px)' });

    vi.useRealTimers();
  });
});
