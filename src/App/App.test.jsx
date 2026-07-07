import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function renderApp() {
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal');
  document.body.appendChild(modalRoot);

  return render(<App />);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getRelativeDateInputValue(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return toDateInputValue(date);
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    delete document.documentElement.dataset.theme;
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('manages the main todo flow from the UI', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Escribe una tarea antes de agregarla.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nueva tarea'), 'Preparar entrevista tecnica');
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'high');
    await user.type(screen.getByLabelText('Fecha limite'), '2026-07-20');
    await user.type(screen.getByLabelText('Proyecto'), 'TaskFlow');
    await user.type(screen.getByLabelText('Etiquetas'), 'React, testing');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('20/07/2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por proyecto TaskFlow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta React' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta testing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Completaste 0 de 1 tareas/ })).toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      text: 'Preparar entrevista tecnica',
      completed: false,
      priority: 'high',
      dueDate: '2026-07-20',
      project: 'TaskFlow',
      tags: ['React', 'testing'],
    }));

    await user.type(screen.getByLabelText('Buscar tareas'), 'testing');
    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marcar tarea como completada' }));
    expect(screen.getByText('Completaste todas tus tareas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Completadas/ }));
    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Pendientes/ }));
    expect(screen.queryByText('Preparar entrevista tecnica')).not.toBeInTheDocument();
    expect(screen.getByText('No hay tareas que coincidan con tu busqueda.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Todas/ }));
    await user.click(screen.getByRole('button', { name: 'Eliminar tarea' }));

    const deleteDialog = screen.getByRole('dialog', { name: 'Eliminar tarea' });
    expect(within(deleteDialog).getByText('Preparar entrevista tecnica')).toBeInTheDocument();
    await user.click(within(deleteDialog).getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();
  });

  test('shows duplicate validation in the create todo form', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Actualizar portfolio', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Actualizar portfolio')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'actualizar portfolio');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Esa tarea ya existe.')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByLabelText('Nueva tarea')).toHaveValue('actualizar portfolio');
  });

  test('filters todos by due date status', async () => {
    const user = userEvent.setup();
    const yesterday = getRelativeDateInputValue(-1);
    const today = getRelativeDateInputValue(0);
    const tomorrow = getRelativeDateInputValue(1);

    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Resolver deuda vencida', completed: false, dueDate: yesterday },
      { id: 'todo-2', text: 'Enviar avance de hoy', completed: false, dueDate: today },
      { id: 'todo-3', text: 'Preparar proxima mejora', completed: false, dueDate: tomorrow },
      { id: 'todo-4', text: 'Tarea vencida completada', completed: true, dueDate: yesterday },
    ]));
    renderApp();

    expect(await screen.findByText('Resolver deuda vencida')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vencidas: 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hoy: 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proximas: 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Vencidas/ }));
    expect(screen.getByText('Resolver deuda vencida')).toBeInTheDocument();
    expect(screen.queryByText('Enviar avance de hoy')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Hoy/ }));
    expect(screen.getByText('Enviar avance de hoy')).toBeInTheDocument();
    expect(screen.queryByText('Resolver deuda vencida')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Proximas/ }));
    expect(screen.getByText('Preparar proxima mejora')).toBeInTheDocument();
    expect(screen.queryByText('Enviar avance de hoy')).not.toBeInTheDocument();
  });

  test('groups visible todos by due date and completion', async () => {
    const yesterday = getRelativeDateInputValue(-1);
    const today = getRelativeDateInputValue(0);
    const tomorrow = getRelativeDateInputValue(1);

    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Sin fecha asignada', completed: false, dueDate: null, order: 0 },
      { id: 'todo-2', text: 'Ya completada', completed: true, dueDate: yesterday, order: 1 },
      { id: 'todo-3', text: 'Vencida pendiente', completed: false, dueDate: yesterday, order: 2 },
      { id: 'todo-4', text: 'Para hoy', completed: false, dueDate: today, order: 3 },
      { id: 'todo-5', text: 'Para manana', completed: false, dueDate: tomorrow, order: 4 },
    ]));
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Vencidas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Proximas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sin fecha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completadas' })).toBeInTheDocument();

    const items = within(screen.getByRole('list', { name: 'Lista de tareas' })).getAllByRole('listitem');
    expect(items.map(item => item.textContent)).toEqual([
      expect.stringContaining('Vencida pendiente'),
      expect.stringContaining('Para hoy'),
      expect.stringContaining('Para manana'),
      expect.stringContaining('Sin fecha asignada'),
      expect.stringContaining('Ya completada'),
    ]);
  });

  test('filters todos by project and tag facets', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Preparar demo',
        completed: false,
        project: 'TaskFlow',
        tags: ['frontend'],
      },
      {
        id: 'todo-2',
        text: 'Ordenar apuntes',
        completed: false,
        project: 'Docs',
        tags: ['contenido'],
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar demo')).toBeInTheDocument();
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();

    const projectsGroup = screen.getByRole('group', { name: 'Proyectos' });
    await user.click(within(projectsGroup).getByRole('button', { name: /TaskFlow/ }));

    expect(screen.getByText('Preparar demo')).toBeInTheDocument();
    expect(screen.queryByText('Ordenar apuntes')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filtrar por etiqueta contenido' }));

    expect(screen.queryByText('Preparar demo')).not.toBeInTheDocument();
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();
  });

  test('moves todos manually and persists the new order', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Primera tarea', completed: false, order: 0 },
      { id: 'todo-2', text: 'Segunda tarea', completed: false, order: 1 },
      { id: 'todo-3', text: 'Tercera tarea', completed: false, order: 2 },
    ]));
    renderApp();

    expect(await screen.findByText('Primera tarea')).toBeInTheDocument();

    let items = within(screen.getByRole('list', { name: 'Lista de tareas' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Primera tarea');
    expect(within(items[0]).getByRole('button', { name: 'Subir tarea' })).toBeDisabled();

    await user.click(within(items[0]).getByRole('button', { name: 'Bajar tarea' }));

    items = within(screen.getByRole('list', { name: 'Lista de tareas' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Segunda tarea');
    expect(items[1]).toHaveTextContent('Primera tarea');
    expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
      'Segunda tarea',
      'Primera tarea',
      'Tercera tarea',
    ]);
  });

  test('creates and toggles todo subtasks', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Organizar lanzamiento');
    await user.type(screen.getByLabelText('Subtareas'), 'Escribir guia{enter}Validar mobile');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    const checklist = screen.getByRole('list', { name: 'Checklist de Organizar lanzamiento' });
    const firstSubtask = within(checklist).getByLabelText('Escribir guia');

    expect(firstSubtask).not.toBeChecked();
    expect(within(checklist).getByLabelText('Validar mobile')).toBeInTheDocument();

    await user.click(firstSubtask);

    expect(firstSubtask).toBeChecked();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      subtasks: [
        expect.objectContaining({ text: 'Escribir guia', completed: true }),
        expect.objectContaining({ text: 'Validar mobile', completed: false }),
      ],
    }));
  });

  test('toggles and persists dark mode', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('THEME_V1')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('supports keyboard shortcuts for search and creating todos', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.keyboard('/');
    expect(screen.getByLabelText('Buscar tareas')).toHaveFocus();

    await user.keyboard('n');
    expect(screen.queryByRole('dialog', { name: 'Crear tarea' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Buscar tareas')).toHaveValue('n');

    screen.getByLabelText('Buscar tareas').blur();
    await user.keyboard('n');

    expect(screen.getByRole('dialog', { name: 'Crear tarea' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva tarea')).toHaveFocus();
  });

  test('shows PWA offline and update status messages', async () => {
    const worker = { postMessage: vi.fn() };
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { addEventListener: vi.fn() },
    });
    renderApp();

    expect(await screen.findByText('Sin conexion. TaskFlow sigue disponible offline.')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('taskflow:pwa-update', {
        detail: { worker },
      }));
    });

    expect(screen.getByText('Hay una nueva version disponible.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar app' }));

    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  test('loads the persisted dark theme', async () => {
    localStorage.setItem('THEME_V1', 'dark');
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('exports todos to a JSON backup', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:taskflow-backup');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Exportar tareas',
        completed: false,
        priority: 'high',
        dueDate: '2026-07-20',
        project: 'TaskFlow',
        tags: ['backup'],
        subtasks: [{ id: 'subtask-1', text: 'Revisar JSON', completed: true }],
      },
    ]));
    renderApp();

    expect(await screen.findByText('Exportar tareas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Exportar tareas' }));

    const [backupBlob] = createObjectURL.mock.calls[0];
    const backup = JSON.parse(await backupBlob.text());

    expect(backup).toEqual(expect.objectContaining({
      version: 1,
      exportedAt: expect.any(String),
      todos: [
        expect.objectContaining({
          id: 'todo-1',
          text: 'Exportar tareas',
          priority: 'high',
          dueDate: '2026-07-20',
          project: 'TaskFlow',
          tags: ['backup'],
          subtasks: [{ id: 'subtask-1', text: 'Revisar JSON', completed: true }],
        }),
      ],
    }));
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:taskflow-backup');
    expect(screen.getByRole('status')).toHaveTextContent('Backup exportado.');
  });

  test('imports todos from a JSON backup', async () => {
    const user = userEvent.setup();
    const backupFile = new File([
      JSON.stringify({
        version: 1,
        todos: [
          {
            id: 'todo-imported',
            text: 'Importar tareas',
            completed: false,
            priority: 'low',
            dueDate: '2026-08-01',
            project: 'Administracion',
            tags: ['json'],
            subtasks: [{ id: 'subtask-imported', text: 'Validar archivo', completed: false }],
          },
        ],
      }),
    ], 'taskflow-backup.json', { type: 'application/json' });
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Importar tareas desde JSON'), backupFile);

    expect(await screen.findByText('Importar tareas')).toBeInTheDocument();
    expect(screen.getByText('Baja')).toBeInTheDocument();
    expect(screen.getByText('01/08/2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por proyecto Administracion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta json' })).toBeInTheDocument();
    expect(screen.getByLabelText('Validar archivo')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 tarea importada.');
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toEqual([
      expect.objectContaining({
        id: 'todo-imported',
        text: 'Importar tareas',
        priority: 'low',
        dueDate: '2026-08-01',
        project: 'Administracion',
        tags: ['json'],
        subtasks: [{ id: 'subtask-imported', text: 'Validar archivo', completed: false }],
      }),
    ]);
  });

  test('recovers from invalid stored todos', async () => {
    localStorage.setItem('TODOS_V1', '{"broken":');
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toEqual([]);
  });

  test('shows an error when localStorage is unavailable', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

    renderApp();

    expect(await screen.findByText('No pudimos cargar tus tareas')).toBeInTheDocument();

    getItemSpy.mockRestore();
  });

  test('synchronizes todos after an external storage change', async () => {
    const user = userEvent.setup();
    const updatedTodos = [
      { id: 'todo-2', text: 'Actualizar desde otra pestana', completed: false },
    ];

    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Tarea local', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Tarea local')).toBeInTheDocument();

    localStorage.setItem('TODOS_V1', JSON.stringify(updatedTodos));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'TODOS_V1' }));
    });

    const alertDialog = await screen.findByRole('alertdialog', { name: 'Cambios externos detectados' });
    await user.click(within(alertDialog).getByRole('button', { name: 'Actualizar tareas' }));

    expect(screen.queryByText('Tarea local')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizar desde otra pestana')).toBeInTheDocument();
  });

  test('edits a todo from the modal and validates duplicate text', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Actualizar portfolio',
        completed: false,
        project: 'Web',
        tags: ['portfolio'],
        subtasks: [{ id: 'subtask-1', text: 'Revisar copy', completed: true }],
      },
      { id: 'todo-2', text: 'Preparar entrevista', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Actualizar portfolio')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Editar tarea' })[0]);

    const dialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    const textarea = within(dialog).getByLabelText('Editar tarea');
    const projectInput = within(dialog).getByLabelText('Proyecto');
    const tagsInput = within(dialog).getByLabelText('Etiquetas');
    const subtasksInput = within(dialog).getByLabelText('Subtareas');
    expect(textarea).toHaveValue('Actualizar portfolio');
    expect(projectInput).toHaveValue('Web');
    expect(tagsInput).toHaveValue('portfolio');
    expect(subtasksInput).toHaveValue('Revisar copy');

    await user.clear(textarea);
    await user.type(textarea, 'preparar entrevista');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('Ya existe otra tarea con ese texto.')).toBeInTheDocument();

    await user.clear(textarea);
    await user.type(textarea, 'Actualizar README del portfolio');
    await user.clear(projectInput);
    await user.type(projectInput, 'TaskFlow');
    await user.clear(tagsInput);
    await user.type(tagsInput, 'docs, ui');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizar README del portfolio')).toBeInTheDocument();
    expect(screen.queryByText('Actualizar portfolio')).not.toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos[0]).toEqual(expect.objectContaining({
      id: 'todo-1',
      text: 'Actualizar README del portfolio',
      completed: false,
      project: 'TaskFlow',
      tags: ['docs', 'ui'],
      subtasks: [{ id: 'subtask-1', text: 'Revisar copy', completed: true }],
    }));
  });

  test('keeps a todo when delete confirmation is cancelled', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Publicar demo', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Publicar demo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar tarea' }));

    const dialog = screen.getByRole('dialog', { name: 'Eliminar tarea' });
    expect(within(dialog).getByText('Publicar demo')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Publicar demo')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toEqual([
      expect.objectContaining({ id: 'todo-1', text: 'Publicar demo' }),
    ]);
  });

  test('keeps focus inside the modal and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: 'Crear nueva tarea' });
    await user.click(createButton);

    const dialog = screen.getByRole('dialog', { name: 'Crear tarea' });
    const textarea = within(dialog).getByLabelText('Nueva tarea');
    const prioritySelect = within(dialog).getByLabelText('Prioridad');
    const dueDateInput = within(dialog).getByLabelText('Fecha limite');
    const projectInput = within(dialog).getByLabelText('Proyecto');
    const tagsInput = within(dialog).getByLabelText('Etiquetas');
    const subtasksInput = within(dialog).getByLabelText('Subtareas');
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancelar' });
    const submitButton = within(dialog).getByRole('button', { name: 'Agregar' });

    expect(textarea).toHaveFocus();

    await user.tab();
    expect(prioritySelect).toHaveFocus();

    await user.tab();
    expect(dueDateInput).toHaveFocus();

    await user.tab();
    expect(projectInput).toHaveFocus();

    await user.tab();
    expect(tagsInput).toHaveFocus();

    await user.tab();
    expect(subtasksInput).toHaveFocus();

    await user.tab();
    expect(cancelButton).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();

    await user.tab();
    expect(textarea).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(createButton).toHaveFocus();
  });

  test('closes the modal when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: 'Crear nueva tarea' });
    await user.click(createButton);

    const dialog = screen.getByRole('dialog', { name: 'Crear tarea' });
    await user.click(dialog.parentElement);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(createButton).toHaveFocus();
  });
});
