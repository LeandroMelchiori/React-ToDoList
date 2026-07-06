import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function renderApp() {
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal');
  document.body.appendChild(modalRoot);

  return render(<App />);
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    delete document.documentElement.dataset.theme;
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
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('20/07/2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Completaste 0 de 1 tareas/ })).toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      text: 'Preparar entrevista tecnica',
      completed: false,
      priority: 'high',
      dueDate: '2026-07-20',
    }));

    await user.type(screen.getByLabelText('Buscar tareas'), 'entrevista');
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
      { id: 'todo-1', text: 'Exportar tareas', completed: false, priority: 'high', dueDate: '2026-07-20' },
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
          { id: 'todo-imported', text: 'Importar tareas', completed: false, priority: 'low', dueDate: '2026-08-01' },
        ],
      }),
    ], 'taskflow-backup.json', { type: 'application/json' });
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Importar tareas desde JSON'), backupFile);

    expect(await screen.findByText('Importar tareas')).toBeInTheDocument();
    expect(screen.getByText('Baja')).toBeInTheDocument();
    expect(screen.getByText('01/08/2026')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 tarea importada.');
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toEqual([
      expect.objectContaining({
        id: 'todo-imported',
        text: 'Importar tareas',
        priority: 'low',
        dueDate: '2026-08-01',
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
      { id: 'todo-1', text: 'Actualizar portfolio', completed: false },
      { id: 'todo-2', text: 'Preparar entrevista', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Actualizar portfolio')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Editar tarea' })[0]);

    const dialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    const textarea = within(dialog).getByLabelText('Editar tarea');
    expect(textarea).toHaveValue('Actualizar portfolio');

    await user.clear(textarea);
    await user.type(textarea, 'preparar entrevista');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('Ya existe otra tarea con ese texto.')).toBeInTheDocument();

    await user.clear(textarea);
    await user.type(textarea, 'Actualizar README del portfolio');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizar README del portfolio')).toBeInTheDocument();
    expect(screen.queryByText('Actualizar portfolio')).not.toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos[0]).toEqual(expect.objectContaining({
      id: 'todo-1',
      text: 'Actualizar README del portfolio',
      completed: false,
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
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancelar' });
    const submitButton = within(dialog).getByRole('button', { name: 'Agregar' });

    expect(textarea).toHaveFocus();

    await user.tab();
    expect(prioritySelect).toHaveFocus();

    await user.tab();
    expect(dueDateInput).toHaveFocus();

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
