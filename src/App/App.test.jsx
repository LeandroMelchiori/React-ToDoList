import { render, screen, within } from '@testing-library/react';
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
  });

  test('manages the main todo flow from the UI', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Escribe una tarea antes de agregarla.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nueva tarea'), 'Preparar entrevista tecnica');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Completaste 0 de 1 tareas/ })).toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      text: 'Preparar entrevista tecnica',
      completed: false,
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
});
