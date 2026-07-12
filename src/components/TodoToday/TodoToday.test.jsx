import {
  getTodaySections,
  getTodaySummary,
  getTodoTodayMeta,
} from './TodoToday';

describe('TodoToday helpers', () => {
  test('groups today work by task and agenda kind', () => {
    const sections = getTodaySections([
      {
        id: 'task-today',
        text: 'Resolver guia',
        kind: 'task',
        completed: false,
        dateType: 'due',
        dueDate: '2026-07-12',
        recurrence: 'none',
        order: 1,
      },
      {
        id: 'task-overdue',
        text: 'Enviar formulario',
        kind: 'task',
        completed: false,
        dateType: 'due',
        dueDate: '2026-07-10',
        recurrence: 'none',
        order: 0,
      },
      {
        id: 'task-done',
        text: 'Tarea cerrada',
        kind: 'task',
        completed: true,
        dateType: 'due',
        dueDate: '2026-07-12',
        recurrence: 'none',
        order: 2,
      },
      {
        id: 'exam',
        text: 'Rendir parcial',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: '2026-07-12',
        startTime: '10:00',
        recurrence: 'none',
        order: 3,
      },
      {
        id: 'course',
        text: 'Cursar programacion',
        kind: 'schedule',
        completed: false,
        dateType: 'period',
        startDate: '2026-07-05',
        endDate: '2026-07-30',
        startTime: '14:00',
        endTime: '16:00',
        recurrence: 'weekly',
        order: 4,
      },
      {
        id: 'period',
        text: 'Inscripcion a finales',
        kind: 'period',
        completed: false,
        dateType: 'period',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        recurrence: 'none',
        order: 5,
      },
      {
        id: 'tomorrow',
        text: 'Evento de manana',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: '2026-07-13',
        recurrence: 'none',
        order: 6,
      },
    ], '2026-07-12');

    expect(sections.tasks.map(todo => todo.id)).toEqual(['task-overdue', 'task-today']);
    expect(sections.events.map(todo => todo.id)).toEqual(['exam']);
    expect(sections.schedules.map(todo => todo.id)).toEqual(['course']);
    expect(sections.periods.map(todo => todo.id)).toEqual(['period']);
  });

  test('describes today metadata and summary', () => {
    const overdueTask = {
      id: 'task-overdue',
      text: 'Enviar formulario',
      kind: 'task',
      completed: false,
      dateType: 'due',
      dueDate: '2026-07-10',
      recurrence: 'none',
      project: 'Facultad',
      order: 0,
    };
    const sections = {
      tasks: [overdueTask],
      events: [],
      schedules: [{ id: 'course' }],
      periods: [],
    };

    expect(getTodoTodayMeta(overdueTask, '2026-07-12')).toBe('Vencida - 10/07/2026 - Facultad');
    expect(getTodaySummary(sections)).toBe('1 tarea - 1 elemento de agenda');
  });
});
