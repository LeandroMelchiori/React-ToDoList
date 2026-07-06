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
});
