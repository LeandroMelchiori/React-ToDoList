import {
  TODO_FILTERS,
  TODO_GROUPS,
  TODO_PRIORITIES,
  analyzeTodosImport,
  applyTodosImport,
  createTodosBackup,
  createTodo,
  getTodoFacets,
  getTodoDateStatus,
  getTodoGroups,
  getTodosDateCounts,
  getVisibleTodos,
  moveTodoToPosition,
  normalizeDueDate,
  normalizePriority,
  normalizeProject,
  normalizeSubtasks,
  normalizeTags,
  normalizeTodos,
  readTodosBackup,
} from './todoModel';

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
        completed: true,
        order: 0,
        priority: TODO_PRIORITIES.medium,
        dueDate: null,
        project: null,
        tags: [],
        subtasks: [],
        createdAt: null,
      },
      {
        id: 'todo-2',
        text: 'Actualizar CV',
        completed: false,
        order: 1,
        priority: TODO_PRIORITIES.medium,
        dueDate: null,
        project: null,
        tags: [],
        subtasks: [],
        createdAt: null,
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
      project: 'TaskFlow',
      tags: 'React, testing, React',
      subtasks: 'Armar caso\nValidar UI',
    });

    expect(todo).toMatchObject({
      text: 'Practicar React',
      completed: false,
      order: 0,
      priority: TODO_PRIORITIES.high,
      dueDate: '2026-07-20',
      project: 'TaskFlow',
      tags: ['React', 'testing'],
      subtasks: [
        { id: 'subtask-0-armar-caso', text: 'Armar caso', completed: false },
        { id: 'subtask-1-validar-ui', text: 'Validar UI', completed: false },
      ],
    });
    expect(todo.id).toEqual(expect.any(String));
    expect(todo.createdAt).toEqual(expect.any(String));
  });

  test('normalizes invalid priority and due date values', () => {
    expect(normalizePriority('urgent')).toBe(TODO_PRIORITIES.medium);
    expect(normalizePriority(TODO_PRIORITIES.low)).toBe(TODO_PRIORITIES.low);
    expect(normalizeDueDate('2026-07-20')).toBe('2026-07-20');
    expect(normalizeDueDate(null)).toBeNull();
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
});
