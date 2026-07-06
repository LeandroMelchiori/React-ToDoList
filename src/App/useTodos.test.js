import {
  TODO_FILTERS,
  TODO_PRIORITIES,
  createTodo,
  getVisibleTodos,
  normalizeDueDate,
  normalizePriority,
  normalizeTodos,
} from './useTodos';

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
        priority: TODO_PRIORITIES.medium,
        dueDate: null,
        createdAt: null,
      },
      {
        id: 'todo-2',
        text: 'Actualizar CV',
        completed: false,
        priority: TODO_PRIORITIES.medium,
        dueDate: null,
        createdAt: null,
      },
    ]);
  });

  test('normalizes invalid todo collections as an empty list', () => {
    expect(normalizeTodos(null)).toEqual([]);
    expect(normalizeTodos({ text: 'No es una lista' })).toEqual([]);
  });

  test('creates a new todo with a generated id, priority, due date and trimmed text', () => {
    const todo = createTodo('  Practicar React  ', {
      priority: TODO_PRIORITIES.high,
      dueDate: '2026-07-20',
    });

    expect(todo).toMatchObject({
      text: 'Practicar React',
      completed: false,
      priority: TODO_PRIORITIES.high,
      dueDate: '2026-07-20',
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

  test('filters visible todos by text and status', () => {
    const todos = [
      { id: '1', text: 'Preparar entrevista', completed: true },
      { id: '2', text: 'Actualizar portfolio', completed: false },
      { id: '3', text: 'Practicar testing', completed: false },
    ];

    expect(getVisibleTodos(todos, 'portfolio', TODO_FILTERS.all)).toEqual([
      todos[1],
    ]);
    expect(getVisibleTodos(todos, '', TODO_FILTERS.active)).toEqual([
      todos[1],
      todos[2],
    ]);
    expect(getVisibleTodos(todos, 'preparar', TODO_FILTERS.completed)).toEqual([
      todos[0],
    ]);
  });
});
