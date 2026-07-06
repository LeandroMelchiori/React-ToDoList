import {
  TODO_FILTERS,
  createTodo,
  getVisibleTodos,
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
        createdAt: null,
      },
      {
        id: 'todo-2',
        text: 'Actualizar CV',
        completed: false,
        createdAt: null,
      },
    ]);
  });

  test('normalizes invalid todo collections as an empty list', () => {
    expect(normalizeTodos(null)).toEqual([]);
    expect(normalizeTodos({ text: 'No es una lista' })).toEqual([]);
  });

  test('creates a new todo with a generated id and trimmed text', () => {
    const todo = createTodo('  Practicar React  ');

    expect(todo).toMatchObject({
      text: 'Practicar React',
      completed: false,
    });
    expect(todo.id).toEqual(expect.any(String));
    expect(todo.createdAt).toEqual(expect.any(String));
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
