import {
  TODO_DATE_TYPES,
  TODO_FILTERS,
  TODO_BACKUP_VERSION,
  TODO_GROUPS,
  TODO_KINDS,
  TODO_PRIORITIES,
  TODO_REMINDERS,
  TODO_RECURRENCES,
  analyzeTodosImport,
  applyTodosImport,
  createTodosBackup,
  createTodosCalendarExport,
  createTodo,
  getAllowedRecurrencesForDateType,
  getAllowedRecurrencesForTodoKind,
  getTodoFacets,
  getTodoDateStatus,
  getTodoFilterCounts,
  getTodoGroups,
  getTodoInsights,
  getTodoNextOccurrenceDate,
  getTodoReminderTarget,
  getTodosDateCounts,
  getVisibleTodos,
  isTodoArchived,
  isTodoOccurrenceCompleted,
  isTodoRecurringOnDate,
  isTaskTodo,
  moveTodoToPosition,
  normalizeDueDate,
  normalizeTodoSchedule,
  normalizePriority,
  normalizeProject,
  normalizeRecurrence,
  normalizeRecurrenceCount,
  normalizeRecurrenceDays,
  normalizeReminder,
  normalizeSubtasks,
  normalizeTags,
  normalizeTimeValue,
  normalizeTodoKind,
  normalizeTodoRecurrence,
  normalizeTodos,
  readTodosCalendarImport,
  readTodosBackup,
  toggleTodoOccurrence,
} from './todoModel';
import {
  DEFAULT_TODO_BOARD_ID,
  addTodoBoard,
  ensureDefaultTodoBoard,
  getActiveTodoBoardId,
  normalizeTodoBoards,
  removeTodoBoard,
  renameTodoBoard,
  upsertTodoBoardTodos,
} from './todoBoards';
import {
  addTodoSavedView,
  normalizeTodoSavedViews,
  removeTodoSavedView,
} from './todoSavedViews';
import {
  TODO_WORKSPACE_BACKUP_KIND,
  createTodoWorkspaceBackup,
  readTodoWorkspaceBackup,
} from './todoWorkspaceBackup';

describe('todo helpers', () => {
  test('normalizes legacy todos with stable ids and clean text', () => {
    const todos = normalizeTodos([
      { text: '  Preparar entrevista  ', completed: 1 },
      { text: '' },
      { text: 'Actualizar CV', completed: false, id: 'todo-2' },
    ]);

    expect(todos).toEqual([
      {
        id: 'legacy-0-preparar-entrevista',
        text: 'Preparar entrevista',
        kind: TODO_KINDS.task,
        description: null,
        completed: true,
        order: 0,
        priority: TODO_PRIORITIES.medium,
        dateType: TODO_DATE_TYPES.due,
        dueDate: null,
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        recurrence: TODO_RECURRENCES.none,
        recurrenceDays: [],
        recurrenceEndDate: null,
        recurrenceCount: null,
        completedOccurrences: [],
        reminder: TODO_REMINDERS.none,
        project: null,
        tags: [],
        subtasks: [],
        createdAt: null,
        completedAt: null,
        archivedAt: null,
      },
      {
        id: 'todo-2',
        text: 'Actualizar CV',
        kind: TODO_KINDS.task,
        description: null,
        completed: false,
        order: 1,
        priority: TODO_PRIORITIES.medium,
        dateType: TODO_DATE_TYPES.due,
        dueDate: null,
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        recurrence: TODO_RECURRENCES.none,
        recurrenceDays: [],
        recurrenceEndDate: null,
        recurrenceCount: null,
        completedOccurrences: [],
        reminder: TODO_REMINDERS.none,
        project: null,
        tags: [],
        subtasks: [],
        createdAt: null,
        completedAt: null,
        archivedAt: null,
      },
    ]);
  });

  test('normalizes invalid todo collections as an empty list', () => {
    expect(normalizeTodos(null)).toEqual([]);
    expect(normalizeTodos({ text: 'No es una lista' })).toEqual([]);
  });

  test('sorts and reindexes todos by manual order', () => {
    expect(normalizeTodos([
      { id: 'todo-2', text: 'Segunda', order: 1 },
      { id: 'todo-1', text: 'Primera', order: 0 },
      { id: 'todo-3', text: 'Tercera' },
    ])).toEqual([
      expect.objectContaining({ id: 'todo-1', text: 'Primera', order: 0 }),
      expect.objectContaining({ id: 'todo-2', text: 'Segunda', order: 1 }),
      expect.objectContaining({ id: 'todo-3', text: 'Tercera', order: 2 }),
    ]);
  });

  test('moves a todo before or after another todo and reindexes the list', () => {
    const todos = [
      { id: 'todo-1', text: 'Primera', order: 0 },
      { id: 'todo-2', text: 'Segunda', order: 1 },
      { id: 'todo-3', text: 'Tercera', order: 2 },
    ];

    expect(moveTodoToPosition(todos, 'todo-3', 'todo-1')).toEqual([
      expect.objectContaining({ id: 'todo-3', order: 0 }),
      expect.objectContaining({ id: 'todo-1', order: 1 }),
      expect.objectContaining({ id: 'todo-2', order: 2 }),
    ]);

    expect(moveTodoToPosition(todos, 'todo-1', 'todo-3', 'after')).toEqual([
      expect.objectContaining({ id: 'todo-2', order: 0 }),
      expect.objectContaining({ id: 'todo-3', order: 1 }),
      expect.objectContaining({ id: 'todo-1', order: 2 }),
    ]);
  });

  test('creates a new todo with a generated id, priority, due date and trimmed text', () => {
    const todo = createTodo('  Practicar React  ', {
      priority: TODO_PRIORITIES.high,
      dueDate: '2026-07-20',
      startTime: '10:30',
      recurrence: TODO_RECURRENCES.weekly,
      completedOccurrences: [],
      description: 'Caso tecnico para entrevista',
      project: 'TaskFlow',
      tags: 'React, testing, React',
      subtasks: 'Armar caso\nValidar UI',
    });

    expect(todo).toMatchObject({
      text: 'Practicar React',
      kind: TODO_KINDS.task,
      completed: false,
      order: 0,
      description: 'Caso tecnico para entrevista',
      priority: TODO_PRIORITIES.high,
      dateType: TODO_DATE_TYPES.due,
      dueDate: '2026-07-20',
      startDate: null,
      endDate: null,
      startTime: '10:30',
      endTime: null,
      recurrence: TODO_RECURRENCES.weekly,
      project: 'TaskFlow',
      tags: ['React', 'testing'],
      subtasks: [
        { id: 'subtask-0-armar-caso', text: 'Armar caso', completed: false },
        { id: 'subtask-1-validar-ui', text: 'Validar UI', completed: false },
      ],
      completedAt: null,
    });
    expect(todo.id).toEqual(expect.any(String));
    expect(todo.createdAt).toEqual(expect.any(String));
  });

  test('normalizes invalid priority and due date values', () => {
    expect(normalizePriority('urgent')).toBe(TODO_PRIORITIES.medium);
    expect(normalizePriority(TODO_PRIORITIES.low)).toBe(TODO_PRIORITIES.low);
    expect(normalizeTodoKind('schedule')).toBe(TODO_KINDS.schedule);
    expect(normalizeTodoKind('note')).toBe(TODO_KINDS.task);
    expect(normalizeTodoKind(undefined, TODO_DATE_TYPES.event)).toBe(TODO_KINDS.event);
    expect(normalizeTodoKind(undefined, TODO_DATE_TYPES.period)).toBe(TODO_KINDS.period);
    expect(normalizeRecurrence('quarterly')).toBe(TODO_RECURRENCES.none);
    expect(normalizeRecurrence(TODO_RECURRENCES.monthly)).toBe(TODO_RECURRENCES.monthly);
    expect(getAllowedRecurrencesForDateType(TODO_DATE_TYPES.event)).not.toContain(TODO_RECURRENCES.daily);
    expect(getAllowedRecurrencesForDateType(TODO_DATE_TYPES.period)).toEqual([TODO_RECURRENCES.none]);
    expect(getAllowedRecurrencesForTodoKind(TODO_KINDS.schedule, TODO_DATE_TYPES.period)).toContain(TODO_RECURRENCES.weekly);
    expect(normalizeTodoRecurrence(TODO_DATE_TYPES.event, TODO_RECURRENCES.daily)).toBe(TODO_RECURRENCES.none);
    expect(normalizeTodoRecurrence(TODO_DATE_TYPES.event, TODO_RECURRENCES.yearly)).toBe(TODO_RECURRENCES.yearly);
    expect(normalizeTodoRecurrence(TODO_DATE_TYPES.period, TODO_RECURRENCES.yearly)).toBe(TODO_RECURRENCES.none);
    expect(normalizeRecurrenceDays([1, '3', 8, 1, 'lunes'])).toEqual([1, 3]);
    expect(normalizeRecurrenceCount('12')).toBe(12);
    expect(normalizeRecurrenceCount('0')).toBeNull();
    expect(normalizeReminder('30-minutes')).toBe(TODO_REMINDERS.thirtyMinutes);
    expect(normalizeReminder('tomorrow')).toBe(TODO_REMINDERS.none);
    expect(normalizeDueDate('2026-07-20')).toBe('2026-07-20');
    expect(normalizeDueDate(null)).toBeNull();
    expect(normalizeTimeValue('10:30')).toBe('10:30');
    expect(normalizeTimeValue('25:00')).toBeNull();
  });

  test('calculates the next browser reminder target', () => {
    const exam = createTodo('Examen final', {
      kind: TODO_KINDS.event,
      dateType: TODO_DATE_TYPES.event,
      startDate: '2026-08-08',
      startTime: '10:00',
      reminder: TODO_REMINDERS.thirtyMinutes,
    });

    expect(getTodoReminderTarget(exam, new Date(2026, 7, 8, 8, 0))?.getTime())
      .toBe(new Date(2026, 7, 8, 9, 30).getTime());

    const dailyTask = createTodo('Repasar ingles', {
      dueDate: '2026-08-01',
      recurrence: TODO_RECURRENCES.daily,
      reminder: TODO_REMINDERS.oneDay,
    });

    expect(getTodoReminderTarget(dailyTask, new Date(2026, 7, 8, 10, 0))?.getTime())
      .toBe(new Date(2026, 7, 9, 9, 0).getTime());

    expect(getTodoReminderTarget({
      ...dailyTask,
      completed: true,
    }, new Date(2026, 7, 8, 10, 0))).toBeNull();
  });

  test('matches advanced weekly recurrence rules', () => {
    const todo = createTodo('Cursar algebra', {
      kind: TODO_KINDS.schedule,
      dateType: TODO_DATE_TYPES.period,
      startDate: '2026-08-03',
      startTime: '10:00',
      endTime: '12:00',
      recurrence: TODO_RECURRENCES.weekly,
      recurrenceDays: [1, 3],
      recurrenceCount: 4,
      recurrenceEndDate: '2026-08-31',
    });

    expect(isTodoRecurringOnDate(todo, '2026-08-03')).toBe(true);
    expect(isTodoRecurringOnDate(todo, '2026-08-05')).toBe(true);
    expect(isTodoRecurringOnDate(todo, '2026-08-10')).toBe(true);
    expect(isTodoRecurringOnDate(todo, '2026-08-12')).toBe(true);
    expect(isTodoRecurringOnDate(todo, '2026-08-17')).toBe(false);
    expect(isTodoRecurringOnDate(todo, '2026-08-04')).toBe(false);
  });

  test('tracks recurring task occurrences without completing the series', () => {
    const dailyTask = createTodo('Practicar ingles', {
      dueDate: '2026-07-10',
      recurrence: TODO_RECURRENCES.daily,
    });
    const occurrenceDate = getTodoNextOccurrenceDate(dailyTask, '2026-07-13');

    expect(occurrenceDate).toBe('2026-07-13');
    expect(isTodoOccurrenceCompleted(dailyTask, occurrenceDate)).toBe(false);

    const completedOccurrence = toggleTodoOccurrence(dailyTask, occurrenceDate);

    expect(completedOccurrence.completed).toBe(false);
    expect(completedOccurrence.completedAt).toBeNull();
    expect(completedOccurrence.completedOccurrences).toEqual(['2026-07-13']);
    expect(isTodoOccurrenceCompleted(completedOccurrence, occurrenceDate)).toBe(true);
    expect(toggleTodoOccurrence(completedOccurrence, occurrenceDate).completedOccurrences).toEqual([]);
  });

  test('migrates a completed recurring task into a dated occurrence', () => {
    const [todo] = normalizeTodos([{
      id: 'legacy-recurring',
      text: 'Rutina diaria',
      completed: true,
      completedAt: '2026-07-12T10:00:00.000Z',
      dueDate: '2026-07-01',
      recurrence: TODO_RECURRENCES.daily,
    }]);

    expect(todo.completed).toBe(false);
    expect(todo.completedAt).toBeNull();
    expect(todo.completedOccurrences).toEqual(['2026-07-12']);
  });

  test('normalizes event and period schedule dates', () => {
    expect(normalizeTodoSchedule({
      dateType: TODO_DATE_TYPES.event,
      dueDate: '2026-08-10',
    })).toEqual({
      dateType: TODO_DATE_TYPES.event,
      dueDate: null,
      startDate: '2026-08-10',
      endDate: null,
    });
    expect(normalizeTodoSchedule({
      dateType: TODO_DATE_TYPES.period,
      startDate: '2026-08-10',
      endDate: '2026-08-05',
    })).toEqual({
      dateType: TODO_DATE_TYPES.period,
      dueDate: null,
      startDate: '2026-08-10',
      endDate: '2026-08-10',
    });
  });

  test('exports dated todos as an ICS calendar', () => {
    const calendar = createTodosCalendarExport([
      {
        id: 'exam-1',
        text: 'Examen final',
        kind: TODO_KINDS.event,
        dateType: TODO_DATE_TYPES.event,
        startDate: '2026-08-08',
        startTime: '10:00',
        description: 'Aula 3',
      },
      {
        id: 'course-1',
        text: 'Cursada de programacion',
        kind: TODO_KINDS.schedule,
        dateType: TODO_DATE_TYPES.period,
        startDate: '2026-08-04',
        endDate: '2026-12-01',
        startTime: '10:00',
        endTime: '12:00',
        recurrence: TODO_RECURRENCES.weekly,
        project: 'Facultad',
      },
      {
        id: 'done-1',
        text: 'Tarea resuelta',
        completed: true,
        dueDate: '2026-08-01',
      },
    ], new Date('2026-07-13T12:00:00.000Z'));

    expect(calendar.count).toBe(2);
    expect(calendar.content).toContain('BEGIN:VCALENDAR');
    expect(calendar.content).toContain('SUMMARY:Examen final');
    expect(calendar.content).toContain('DESCRIPTION:Aula 3');
    expect(calendar.content).toContain('DTSTART:20260808T100000');
    expect(calendar.content).toContain('DTEND:20260808T110000');
    expect(calendar.content).toContain('SUMMARY:Cursada de programacion');
    expect(calendar.content).toContain('DTSTART:20260804T100000');
    expect(calendar.content).toContain('DTEND:20261201T120000');
    expect(calendar.content).toContain('RRULE:FREQ=WEEKLY;UNTIL=20261201T235959');
    expect(calendar.content).not.toContain('Tarea resuelta');
  });

  test('imports basic ICS events as agenda todos', () => {
    const result = readTodosCalendarImport([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:exam-2026@example.com',
      'SUMMARY:Examen de algebra',
      'DESCRIPTION:Aula 3\\nTraer calculadora',
      'DTSTART:20260808T100000',
      'DTEND:20260808T120000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:inscripcion@example.com',
      'SUMMARY:Inscripcion a finales',
      'DTSTART;VALUE=DATE:20260901',
      'DTEND;VALUE=DATE:20260916',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:cursada@example.com',
      'SUMMARY:Cursada de redes',
      'DTSTART;TZID=America/Argentina/Buenos_Aires:20260804T100000',
      'DTEND;TZID=America/Argentina/Buenos_Aires:20260804T120000',
      'RRULE:FREQ=WEEKLY;UNTIL=20261201T235959',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'));

    expect(result).toEqual({
      ok: true,
      totalCount: 3,
      todos: [
        expect.objectContaining({
          id: 'ics-exam-2026-example-com',
          text: 'Examen de algebra',
          kind: TODO_KINDS.event,
          description: 'Aula 3\nTraer calculadora',
          dateType: TODO_DATE_TYPES.event,
          startDate: '2026-08-08',
          endDate: null,
          startTime: '10:00',
          endTime: null,
          recurrence: TODO_RECURRENCES.none,
        }),
        expect.objectContaining({
          id: 'ics-inscripcion-example-com',
          text: 'Inscripcion a finales',
          kind: TODO_KINDS.period,
          dateType: TODO_DATE_TYPES.period,
          startDate: '2026-09-01',
          endDate: '2026-09-15',
        }),
        expect.objectContaining({
          id: 'ics-cursada-example-com',
          text: 'Cursada de redes',
          kind: TODO_KINDS.schedule,
          dateType: TODO_DATE_TYPES.period,
          startDate: '2026-08-04',
          endDate: '2026-12-01',
          startTime: '10:00',
          endTime: '12:00',
          recurrence: TODO_RECURRENCES.weekly,
        }),
      ],
    });
  });

  test('ignores ICS events without a title or date', () => {
    expect(readTodosCalendarImport([
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:',
      'DTSTART:20260808T100000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'SUMMARY:Sin fecha',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n'))).toEqual({
      ok: false,
      error: 'El calendario no contiene eventos importables.',
    });
  });

  test('normalizes project and tags values', () => {
    expect(normalizeProject('  TaskFlow  ')).toBe('TaskFlow');
    expect(normalizeProject('   ')).toBeNull();
    expect(normalizeTags('React, testing, React, , UI')).toEqual([
      'React',
      'testing',
      'UI',
    ]);
    expect(normalizeTags(null)).toEqual([]);
  });

  test('normalizes subtasks from text and legacy objects', () => {
    expect(normalizeSubtasks('  Revisar copy  \n\nValidar mobile')).toEqual([
      { id: 'subtask-0-revisar-copy', text: 'Revisar copy', completed: false },
      { id: 'subtask-2-validar-mobile', text: 'Validar mobile', completed: false },
    ]);
    expect(normalizeSubtasks([
      { id: 'step-1', text: 'Configurar deploy', completed: true },
      { text: '  ' },
      { text: 'Probar offline' },
    ])).toEqual([
      { id: 'step-1', text: 'Configurar deploy', completed: true },
      { id: 'subtask-2-probar-offline', text: 'Probar offline', completed: false },
    ]);
  });

  test('filters visible todos by text, project, tags and status', () => {
    const todos = [
      { id: '1', text: 'Preparar entrevista', completed: true, project: 'Carrera', tags: [] },
      { id: '2', text: 'Actualizar contenido', completed: false, project: 'TaskFlow', tags: ['portfolio'] },
      { id: '3', text: 'Practicar testing', completed: false, project: null, tags: ['calidad'] },
    ];

    expect(getVisibleTodos(todos, 'taskflow', TODO_FILTERS.all)).toEqual([
      todos[1],
    ]);
    expect(getVisibleTodos(todos, 'calidad', TODO_FILTERS.all)).toEqual([
      todos[2],
    ]);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.active)).toEqual([
      todos[1],
      todos[2],
    ]);
    expect(getVisibleTodos(todos, 'preparar', TODO_FILTERS.completed)).toEqual([
      todos[0],
    ]);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.all, '2026-07-06', {
      project: 'TaskFlow',
    })).toEqual([
      todos[1],
    ]);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.all, '2026-07-06', {
      tag: 'calidad',
    })).toEqual([
      todos[2],
    ]);
  });

  test('filters visible todos by advanced attributes and type', () => {
    const todos = normalizeTodos([
      {
        id: 'task-high',
        text: 'Preparar entrega',
        completed: false,
        priority: TODO_PRIORITIES.high,
        subtasks: [{ id: 'subtask-1', text: 'Revisar consigna', completed: false }],
      },
      {
        id: 'task-reminder',
        text: 'Pagar servicio',
        completed: false,
        dueDate: '2026-07-20',
        reminder: TODO_REMINDERS.oneDay,
      },
      {
        id: 'event-1',
        text: 'Examen final',
        kind: TODO_KINDS.event,
        dateType: TODO_DATE_TYPES.event,
        startDate: '2026-07-21',
      },
      {
        id: 'schedule-1',
        text: 'Cursar redes',
        kind: TODO_KINDS.schedule,
        dateType: TODO_DATE_TYPES.period,
        startDate: '2026-07-01',
        recurrence: TODO_RECURRENCES.weekly,
      },
    ]);

    expect(getVisibleTodos(todos, '', TODO_FILTERS.unscheduled).map(todo => todo.id)).toEqual(['task-high']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.highPriority).map(todo => todo.id)).toEqual(['task-high']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.pendingSubtasks).map(todo => todo.id)).toEqual(['task-high']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.withReminder).map(todo => todo.id)).toEqual(['task-reminder']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.events).map(todo => todo.id)).toEqual(['event-1']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.schedules).map(todo => todo.id)).toEqual(['schedule-1']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.recurring).map(todo => todo.id)).toEqual(['schedule-1']);
    expect(getTodoFilterCounts(todos)).toEqual(expect.objectContaining({
      [TODO_FILTERS.unscheduled]: 1,
      [TODO_FILTERS.highPriority]: 1,
      [TODO_FILTERS.pendingSubtasks]: 1,
      [TODO_FILTERS.withReminder]: 1,
      [TODO_FILTERS.events]: 1,
      [TODO_FILTERS.schedules]: 1,
      [TODO_FILTERS.recurring]: 1,
    }));
  });

  test('keeps archived todos out of normal filters and exposes archive history', () => {
    const todos = normalizeTodos([
      { id: 'active', text: 'Activa', completed: false },
      { id: 'done', text: 'Completada', completed: true },
      { id: 'archived', text: 'Archivada', completed: true, archivedAt: '2026-07-13T10:00:00.000Z' },
    ]);

    expect(isTodoArchived(todos[2])).toBe(true);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.all).map(todo => todo.id)).toEqual(['active', 'done']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.completed).map(todo => todo.id)).toEqual(['done']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.archived).map(todo => todo.id)).toEqual(['archived']);
    expect(getTodoGroups(getVisibleTodos(todos, '', TODO_FILTERS.archived))).toEqual([
      expect.objectContaining({
        id: TODO_GROUPS.archived,
        title: 'Archivadas',
        todos: [expect.objectContaining({ id: 'archived' })],
      }),
    ]);
    expect(getTodoFilterCounts(todos)).toEqual(expect.objectContaining({
      [TODO_FILTERS.all]: 2,
      [TODO_FILTERS.completed]: 1,
      [TODO_FILTERS.archived]: 1,
    }));
  });

  test('keeps agenda items out of task completion filters and metrics', () => {
    const todos = normalizeTodos([
      {
        id: 'task-1',
        text: 'Entregar TP',
        kind: TODO_KINDS.task,
        completed: false,
        priority: TODO_PRIORITIES.high,
        dueDate: '2026-08-10',
      },
      {
        id: 'schedule-1',
        text: 'Cursar programacion',
        kind: TODO_KINDS.schedule,
        completed: true,
        dateType: TODO_DATE_TYPES.period,
        startDate: '2026-08-10',
        endDate: '2026-11-20',
        recurrence: TODO_RECURRENCES.weekly,
      },
      {
        id: 'event-1',
        text: 'Rendir parcial',
        kind: TODO_KINDS.event,
        completed: true,
        dateType: TODO_DATE_TYPES.event,
        startDate: '2026-08-10',
      },
    ]);

    expect(todos.filter(isTaskTodo).map(todo => todo.id)).toEqual(['task-1']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.active, '2026-08-10').map(todo => todo.id)).toEqual(['task-1']);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.completed, '2026-08-10')).toEqual([]);
    expect(getTodoInsights(todos, '2026-08-10')).toEqual(expect.objectContaining({
      totalTodos: 1,
      completedTodos: 0,
      pendingTodos: 1,
      highPriorityPendingTodos: 1,
    }));
  });

  test('builds project and tag facet counts', () => {
    const todos = [
      { id: '1', text: 'Uno', project: 'TaskFlow', tags: ['frontend', 'testing'] },
      { id: '2', text: 'Dos', project: 'TaskFlow', tags: ['testing'] },
      { id: '3', text: 'Tres', project: 'Docs', tags: [] },
    ];

    expect(getTodoFacets(todos)).toEqual({
      projects: [
        { name: 'Docs', count: 1 },
        { name: 'TaskFlow', count: 2 },
      ],
      tags: [
        { name: 'frontend', count: 1 },
        { name: 'testing', count: 2 },
      ],
    });
  });

  test('filters todos by due date status', () => {
    const todos = [
      { id: '1', text: 'Tarea vencida', completed: false, dueDate: '2026-07-05' },
      { id: '2', text: 'Tarea de hoy', completed: false, dueDate: '2026-07-06' },
      { id: '3', text: 'Tarea proxima', completed: false, dueDate: '2026-07-07' },
      { id: '4', text: 'Tarea completada vencida', completed: true, dueDate: '2026-07-05' },
      { id: '5', text: 'Tarea sin fecha', completed: false, dueDate: null },
    ];

    expect(getTodoDateStatus(todos[0], '2026-07-06')).toBe(TODO_FILTERS.overdue);
    expect(getTodoDateStatus(todos[1], '2026-07-06')).toBe(TODO_FILTERS.today);
    expect(getTodoDateStatus(todos[2], '2026-07-06')).toBe(TODO_FILTERS.upcoming);
    expect(getTodoDateStatus(todos[3], '2026-07-06')).toBeNull();
    expect(getTodosDateCounts(todos, '2026-07-06')).toEqual({
      overdue: 1,
      today: 1,
      upcoming: 1,
    });
    expect(getVisibleTodos(todos, '', TODO_FILTERS.overdue, '2026-07-06')).toEqual([
      todos[0],
    ]);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.today, '2026-07-06')).toEqual([
      todos[1],
    ]);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.upcoming, '2026-07-06')).toEqual([
      todos[2],
    ]);
  });

  test('uses event and period dates in date status filters', () => {
    const todos = [
      {
        id: 'event-today',
        text: 'Rendir examen',
        completed: false,
        dateType: TODO_DATE_TYPES.event,
        startDate: '2026-07-06',
      },
      {
        id: 'period-active',
        text: 'Inscripcion abierta',
        completed: false,
        dateType: TODO_DATE_TYPES.period,
        startDate: '2026-07-01',
        endDate: '2026-07-10',
      },
      {
        id: 'period-future',
        text: 'Semana de finales',
        completed: false,
        dateType: TODO_DATE_TYPES.period,
        startDate: '2026-08-01',
        endDate: '2026-08-15',
      },
    ];

    expect(getTodoDateStatus(todos[0], '2026-07-06')).toBe(TODO_FILTERS.today);
    expect(getTodoDateStatus(todos[1], '2026-07-06')).toBe(TODO_FILTERS.today);
    expect(getTodoDateStatus(todos[2], '2026-07-06')).toBe(TODO_FILTERS.upcoming);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.today, '2026-07-06')).toEqual([
      todos[0],
      todos[1],
    ]);
  });

  test('uses recurring schedules in date status filters', () => {
    const todos = [
      {
        id: 'daily',
        text: 'Repasar vocabulario',
        completed: false,
        dueDate: '2026-07-01',
        recurrence: TODO_RECURRENCES.daily,
      },
      {
        id: 'weekly',
        text: 'Planificacion semanal',
        completed: false,
        dueDate: '2026-07-06',
        recurrence: TODO_RECURRENCES.weekly,
      },
      {
        id: 'monthly',
        text: 'Revisar presupuesto',
        completed: false,
        dueDate: '2026-07-15',
        recurrence: TODO_RECURRENCES.monthly,
      },
      {
        id: 'completed',
        text: 'Rutina completada',
        completed: true,
        dueDate: '2026-07-01',
        recurrence: TODO_RECURRENCES.daily,
      },
    ];

    expect(getTodoDateStatus(todos[0], '2026-07-06')).toBe(TODO_FILTERS.today);
    expect(getTodoDateStatus(todos[1], '2026-07-13')).toBe(TODO_FILTERS.today);
    expect(getTodoDateStatus(todos[1], '2026-07-14')).toBe(TODO_FILTERS.upcoming);
    expect(getTodoDateStatus(todos[2], '2026-07-14')).toBe(TODO_FILTERS.upcoming);
    expect(getTodoDateStatus(todos[3], '2026-07-06')).toBeNull();
    expect(getVisibleTodos(todos, '', TODO_FILTERS.today, '2026-07-06')).toEqual([
      todos[0],
      todos[1],
    ]);
  });

  test('groups visible todos by due date and completion', () => {
    const todos = [
      { id: '1', text: 'Sin fecha', completed: false, dueDate: null },
      { id: '2', text: 'Completada', completed: true, dueDate: '2026-07-05' },
      { id: '3', text: 'Vencida', completed: false, dueDate: '2026-07-05' },
      { id: '4', text: 'Hoy', completed: false, dueDate: '2026-07-06' },
      { id: '5', text: 'Proxima', completed: false, dueDate: '2026-07-07' },
    ];

    expect(getTodoGroups(todos, '2026-07-06')).toEqual([
      {
        id: TODO_GROUPS.overdue,
        title: 'Vencidas',
        todos: [todos[2]],
      },
      {
        id: TODO_GROUPS.today,
        title: 'Hoy',
        todos: [todos[3]],
      },
      {
        id: TODO_GROUPS.upcoming,
        title: 'Proximas',
        todos: [todos[4]],
      },
      {
        id: TODO_GROUPS.unscheduled,
        title: 'Sin fecha',
        todos: [todos[0]],
      },
      {
        id: TODO_GROUPS.completed,
        title: 'Completadas',
        todos: [todos[1]],
      },
    ]);
  });

  test('calculates local productivity insights', () => {
    const todos = [
      {
        id: '1',
        text: 'Completada reciente',
        completed: true,
        completedAt: '2026-07-07T10:00:00.000Z',
        dueDate: '2026-07-05',
        priority: TODO_PRIORITIES.medium,
      },
      {
        id: '2',
        text: 'Completada antigua',
        completed: true,
        completedAt: '2026-06-20T10:00:00.000Z',
        priority: TODO_PRIORITIES.low,
      },
      {
        id: '3',
        text: 'Pendiente vencida',
        completed: false,
        dueDate: '2026-07-05',
        priority: TODO_PRIORITIES.high,
      },
      {
        id: '4',
        text: 'Pendiente normal',
        completed: false,
        dueDate: '2026-07-08',
        priority: TODO_PRIORITIES.medium,
      },
    ];

    expect(getTodoInsights(todos, '2026-07-07')).toEqual({
      totalTodos: 4,
      completedTodos: 2,
      pendingTodos: 2,
      completionRate: 50,
      completedLast7Days: 1,
      overdueTodos: 1,
      highPriorityPendingTodos: 1,
    });
  });

  test('creates and reads todos backup files', () => {
    const backup = createTodosBackup([
      {
        id: 'todo-1',
        text: 'Respaldar tareas',
        completed: false,
        priority: TODO_PRIORITIES.high,
        project: 'TaskFlow',
        tags: ['backup'],
        subtasks: [{ id: 'subtask-1', text: 'Verificar archivo', completed: true }],
      },
    ]);

    expect(backup).toEqual(expect.objectContaining({
      version: 1,
      exportedAt: expect.any(String),
      todos: [
        expect.objectContaining({
          id: 'todo-1',
          text: 'Respaldar tareas',
          priority: TODO_PRIORITIES.high,
          project: 'TaskFlow',
          tags: ['backup'],
          subtasks: [{ id: 'subtask-1', text: 'Verificar archivo', completed: true }],
        }),
      ],
    }));

    expect(readTodosBackup(backup)).toEqual({
      ok: true,
      todos: backup.todos,
    });
    expect(readTodosBackup({ invalid: true })).toEqual({
      ok: false,
      error: 'El archivo no contiene una lista de tareas valida.',
    });
    expect(readTodosBackup({ version: TODO_BACKUP_VERSION + 1, todos: [] })).toEqual({
      ok: false,
      error: 'El backup usa una version de datos mas nueva que esta app.',
    });
  });

  test('creates and reads workspace backup files', () => {
    const backup = createTodoWorkspaceBackup({
      activeBoardId: 'work',
      todos: [
        { id: 'todo-current', text: 'Preparar tablero activo', completed: false },
      ],
      boards: [
        {
          id: 'personal',
          name: 'Personal',
          todos: [{ id: 'todo-personal', text: 'Plan personal', completed: false }],
          createdAt: null,
          updatedAt: null,
        },
        {
          id: 'work',
          name: 'Trabajo',
          todos: [],
          createdAt: null,
          updatedAt: null,
        },
      ],
      savedViews: [
        {
          id: 'view-work',
          name: 'Trabajo activo',
          searchValue: 'tablero',
          filter: TODO_FILTERS.all,
          project: 'Trabajo',
          tag: null,
          createdAt: null,
        },
      ],
    });

    expect(backup).toEqual(expect.objectContaining({
      version: TODO_BACKUP_VERSION,
      kind: TODO_WORKSPACE_BACKUP_KIND,
      exportedAt: expect.any(String),
      activeBoardId: 'work',
      todos: [expect.objectContaining({ text: 'Preparar tablero activo' })],
      boards: [
        expect.objectContaining({ name: 'Personal' }),
        expect.objectContaining({
          name: 'Trabajo',
          todos: [expect.objectContaining({ text: 'Preparar tablero activo' })],
        }),
      ],
      savedViews: [expect.objectContaining({ name: 'Trabajo activo' })],
    }));
    expect(readTodoWorkspaceBackup(backup)).toEqual(expect.objectContaining({
      ok: true,
      totalTodos: 2,
      backup: expect.objectContaining({
        activeBoardId: 'work',
        savedViews: [expect.objectContaining({ name: 'Trabajo activo' })],
      }),
    }));
    expect(readTodoWorkspaceBackup({ todos: [] })).toEqual({
      ok: false,
      error: 'El archivo no contiene un backup completo valido.',
      isWorkspaceBackup: false,
    });
  });

  test('previews imports with duplicate counts before saving', () => {
    const result = analyzeTodosImport([
      { id: 'todo-1', text: 'Preparar demo', completed: false },
      { id: 'todo-2', text: 'Revisar README', completed: false },
    ], {
      todos: [
        { id: 'todo-3', text: 'Nueva tarea' },
        { id: 'todo-4', text: 'preparar demo' },
        { id: 'todo-1', text: 'Otro texto' },
      ],
    });

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      totalCount: 3,
      newCount: 1,
      duplicateCount: 2,
    }));
  });

  test('merges imports without duplicating existing todos', () => {
    const result = applyTodosImport([
      { id: 'todo-1', text: 'Preparar demo', completed: false, order: 0 },
    ], {
      todos: [
        { id: 'todo-2', text: 'Preparar demo' },
        { id: 'todo-3', text: 'Nueva tarea' },
        { id: 'todo-4', text: 'Nueva tarea' },
      ],
    }, 'merge');

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      totalCount: 3,
      importedCount: 1,
      skippedDuplicates: 2,
    }));
    expect(result.todos).toEqual([
      expect.objectContaining({ id: 'todo-1', text: 'Preparar demo', order: 0 }),
      expect.objectContaining({ id: 'todo-3', text: 'Nueva tarea', order: 1 }),
    ]);
  });

  test('normalizes and updates local todo boards', () => {
    const defaultBoards = ensureDefaultTodoBoard([], [
      { id: 'todo-1', text: 'Plan personal', completed: false },
    ]);

    expect(defaultBoards).toEqual([
      expect.objectContaining({
        id: 'personal',
        name: 'Personal',
        todos: [
          expect.objectContaining({ id: 'todo-1', text: 'Plan personal' }),
        ],
      }),
    ]);

    const addResult = addTodoBoard(defaultBoards, ' Talleres ');

    expect(addResult).toEqual(expect.objectContaining({
      ok: true,
      board: expect.objectContaining({ name: 'Talleres', todos: [] }),
    }));

    const updatedBoards = upsertTodoBoardTodos(addResult.boards, addResult.board.id, [
      { id: 'todo-2', text: 'Preparar taller', completed: false },
    ]);

    expect(getActiveTodoBoardId(updatedBoards, addResult.board.id)).toBe(addResult.board.id);
    expect(normalizeTodoBoards(updatedBoards)).toEqual([
      expect.objectContaining({ name: 'Personal', todos: [expect.objectContaining({ text: 'Plan personal' })] }),
      expect.objectContaining({ name: 'Talleres', todos: [expect.objectContaining({ text: 'Preparar taller' })] }),
    ]);
    expect(addTodoBoard(updatedBoards, 'talleres')).toEqual({
      ok: false,
      error: 'Ya existe un tablero con ese nombre.',
    });

    const renameResult = renameTodoBoard(updatedBoards, addResult.board.id, 'Capacitaciones');

    expect(renameResult).toEqual(expect.objectContaining({
      ok: true,
      board: expect.objectContaining({ name: 'Capacitaciones' }),
    }));
    expect(renameTodoBoard(renameResult.boards, addResult.board.id, 'personal')).toEqual({
      ok: false,
      error: 'Ya existe un tablero con ese nombre.',
    });

    const deleteResult = removeTodoBoard(renameResult.boards, addResult.board.id);

    expect(deleteResult).toEqual(expect.objectContaining({
      ok: true,
      deletedBoard: expect.objectContaining({ name: 'Capacitaciones' }),
      nextBoard: expect.objectContaining({ name: 'Personal' }),
      boards: [expect.objectContaining({ name: 'Personal' })],
    }));
    expect(removeTodoBoard(deleteResult.boards, DEFAULT_TODO_BOARD_ID)).toEqual({
      ok: false,
      error: 'Necesitas al menos un tablero.',
    });
  });

  test('normalizes and manages saved todo views', () => {
    const addResult = addTodoSavedView([], ' Demo frontend ', {
      searchValue: ' demo ',
      filter: TODO_FILTERS.active,
      project: ' TaskFlow ',
      tag: 'frontend',
    });

    expect(addResult).toEqual(expect.objectContaining({
      ok: true,
      view: expect.objectContaining({
        name: 'Demo frontend',
        searchValue: 'demo',
        filter: TODO_FILTERS.active,
        project: 'TaskFlow',
        tag: 'frontend',
      }),
    }));

    expect(addTodoSavedView(addResult.views, 'demo frontend', {})).toEqual({
      ok: false,
      error: 'Ya existen filtros guardados con ese nombre.',
    });
    expect(normalizeTodoSavedViews([
      { id: 'view-1', name: 'Vencidas', filter: TODO_FILTERS.overdue },
      { id: 'view-2', name: 'Invalida', filter: 'broken', project: '  ' },
    ])).toEqual([
      expect.objectContaining({ name: 'Vencidas', filter: TODO_FILTERS.overdue }),
      expect.objectContaining({ name: 'Invalida', filter: TODO_FILTERS.all, project: null }),
    ]);
    expect(removeTodoSavedView(addResult.views, addResult.view.id)).toEqual([]);
  });
});
