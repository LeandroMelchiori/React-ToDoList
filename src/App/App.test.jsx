import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function renderApp() {
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal');
  document.body.appendChild(modalRoot);

  return render(<App />);
}

async function openTools(user) {
  await user.click(screen.getByRole('button', { name: /Herramientas/ }));
}

async function openFilters(user) {
  await user.click(screen.getByRole('button', { name: /Filtros/ }));

  return screen.getByRole('group', { name: 'Filtrar tareas' });
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
    vi.useRealTimers();
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
    expect(screen.getByText('Limite 20/07/2026')).toBeInTheDocument();
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
      dateType: 'due',
      dueDate: '2026-07-20',
      startDate: null,
      endDate: null,
      project: 'TaskFlow',
      tags: ['React', 'testing'],
    }));

    await user.type(screen.getByLabelText('Buscar tareas'), 'testing');
    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marcar tarea como completada' }));
    expect(screen.getByText('Completaste todas tus tareas')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: true,
      completedAt: expect.any(String),
    }));

    await user.click(within(await openFilters(user)).getByRole('button', { name: /Completadas/ }));
    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();

    await user.click(within(await openFilters(user)).getByRole('button', { name: /Pendientes/ }));
    expect(screen.queryByText('Preparar entrevista tecnica')).not.toBeInTheDocument();
    expect(screen.getByText('No hay tareas que coincidan con tu busqueda.')).toBeInTheDocument();

    await user.click(within(await openFilters(user)).getByRole('button', { name: /Todas/ }));
    await user.click(screen.getByRole('button', { name: 'Eliminar tarea' }));

    const deleteDialog = screen.getByRole('dialog', { name: 'Eliminar tarea' });
    expect(within(deleteDialog).getByText('Preparar entrevista tecnica')).toBeInTheDocument();
    await user.click(within(deleteDialog).getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();
  });

  test('creates todos with descriptions, event days and periods', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Rendir parcial de algebra');
    await user.type(screen.getByLabelText('Descripcion'), 'Aula 4, llevar DNI y calculadora');
    await user.selectOptions(screen.getByLabelText('Tipo de fecha'), 'event');
    await user.type(screen.getByLabelText('Dia de la tarea'), '2026-08-15');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Rendir parcial de algebra')).toBeInTheDocument();
    expect(screen.getByText('Aula 4, llevar DNI y calculadora')).toBeInTheDocument();
    expect(screen.getByText('Dia 15/08/2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Inscripcion a finales');
    await user.selectOptions(screen.getByLabelText('Tipo de fecha'), 'period');
    await user.type(screen.getByLabelText('Inicio del periodo'), '2026-09-01');
    await user.type(screen.getByLabelText('Fin del periodo'), '2026-08-30');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('La fecha de fin no puede ser anterior al inicio.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Fin del periodo'));
    await user.type(screen.getByLabelText('Fin del periodo'), '2026-09-15');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Inscripcion a finales')).toBeInTheDocument();
    expect(screen.getByText('Periodo 01/09/2026 - 15/09/2026')).toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos).toEqual([
      expect.objectContaining({
        text: 'Rendir parcial de algebra',
        description: 'Aula 4, llevar DNI y calculadora',
        dateType: 'event',
        dueDate: null,
        startDate: '2026-08-15',
        endDate: null,
      }),
      expect.objectContaining({
        text: 'Inscripcion a finales',
        dateType: 'period',
        dueDate: null,
        startDate: '2026-09-01',
        endDate: '2026-09-15',
      }),
    ]);
  });

  test('shows scheduled todos in the calendar view and opens editing from it', async () => {
    const user = userEvent.setup();
    const today = getRelativeDateInputValue(0);
    const tomorrow = getRelativeDateInputValue(1);

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-exam',
        text: 'Rendir parcial',
        completed: false,
        dateType: 'event',
        startDate: today,
        order: 0,
      },
      {
        id: 'todo-period',
        text: 'Inscripcion a finales',
        completed: false,
        dateType: 'period',
        startDate: today,
        endDate: tomorrow,
        order: 1,
      },
      {
        id: 'todo-unscheduled',
        text: 'Leer bibliografia',
        completed: false,
        order: 2,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Rendir parcial')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Calendario' }));

    expect(screen.getByRole('grid', { name: /Calendario/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dia Rendir parcial/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Periodo Inscripcion a finales/ }).length).toBeGreaterThan(0);
    expect(within(screen.getByRole('complementary', { name: 'Tareas sin fecha' })).getByRole('button', { name: 'Leer bibliografia' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Dia Rendir parcial/ }));

    const editDialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    expect(within(editDialog).getByLabelText('Editar tarea')).toHaveValue('Rendir parcial');
  });

  test('creates a starter todo from the empty onboarding templates', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Todavia no hay tareas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usar plantilla Preparar entrevista' }));

    expect(screen.getByText('Preparar entrevista tecnica')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por proyecto Carrera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta portfolio' })).toBeInTheDocument();
    expect(screen.getByLabelText('Revisar proyectos')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      text: 'Preparar entrevista tecnica',
      priority: 'high',
      project: 'Carrera',
      tags: ['portfolio', 'react'],
      subtasks: [
        expect.objectContaining({ text: 'Revisar proyectos', completed: false }),
        expect.objectContaining({ text: 'Practicar explicacion tecnica', completed: false }),
      ],
    }));
  });

  test('creates a workshop todo from a local starter template', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Todavia no hay tareas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usar plantilla Organizar taller' }));

    expect(screen.getByText('Preparar material del taller')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por proyecto Talleres' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta talleres' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta material' })).toBeInTheDocument();
    expect(screen.getByLabelText('Definir objetivos')).toBeInTheDocument();
    expect(screen.getByLabelText('Revisar presentacion')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      text: 'Preparar material del taller',
      priority: 'high',
      project: 'Talleres',
      tags: ['talleres', 'material'],
      subtasks: [
        expect.objectContaining({ text: 'Definir objetivos', completed: false }),
        expect.objectContaining({ text: 'Revisar presentacion', completed: false }),
        expect.objectContaining({ text: 'Preparar recursos descargables', completed: false }),
      ],
    }));
  });

  test('creates and switches local todo boards', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Todavia no hay tareas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Plan personal');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Plan personal')).toBeInTheDocument();

    await openTools(user);
    const createBoardForm = screen.getByRole('form', { name: 'Crear tablero' });
    await user.type(within(createBoardForm).getByLabelText('Nombre del tablero'), 'Talleres');
    await user.click(within(createBoardForm).getByRole('button', { name: 'Crear' }));

    expect(screen.getByText('Todavia no hay tareas')).toBeInTheDocument();
    expect(screen.queryByText('Plan personal')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Preparar taller');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Preparar taller')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Personal/ }));

    expect(screen.getByText('Plan personal')).toBeInTheDocument();
    expect(screen.queryByText('Preparar taller')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Talleres/ }));

    expect(screen.getByText('Preparar taller')).toBeInTheDocument();
    expect(screen.queryByText('Plan personal')).not.toBeInTheDocument();

    await waitFor(() => {
      const boards = JSON.parse(localStorage.getItem('TODO_BOARDS_V1'));

      expect(boards).toEqual([
        expect.objectContaining({
          name: 'Personal',
          todos: [expect.objectContaining({ text: 'Plan personal' })],
        }),
        expect.objectContaining({
          name: 'Talleres',
          todos: [expect.objectContaining({ text: 'Preparar taller' })],
        }),
      ]);
    });
  });

  test('renames and deletes local todo boards', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Todavia no hay tareas')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Plan personal');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await openTools(user);
    const createBoardForm = screen.getByRole('form', { name: 'Crear tablero' });
    await user.type(within(createBoardForm).getByLabelText('Nombre del tablero'), 'Talleres');
    await user.click(within(createBoardForm).getByRole('button', { name: 'Crear' }));

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Preparar taller');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    const boardNameInput = screen.getByLabelText('Nombre del tablero actual');
    await user.clear(boardNameInput);
    await user.type(boardNameInput, 'Capacitaciones');
    await user.click(screen.getByRole('button', { name: 'Renombrar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Tablero actualizado.');
    const boardSwitcher = screen.getByRole('group', { name: 'Cambiar tablero' });
    expect(within(boardSwitcher).getByRole('button', { name: /Capacitaciones/ })).toBeInTheDocument();
    expect(within(boardSwitcher).queryByRole('button', { name: /Talleres/ })).not.toBeInTheDocument();

    await user.clear(boardNameInput);
    await user.type(boardNameInput, 'Personal');
    await user.click(screen.getByRole('button', { name: 'Renombrar' }));

    expect(screen.getByText('Ya existe un tablero con ese nombre.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar tablero Capacitaciones' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar eliminacion' }));

    expect(screen.getByText('Plan personal')).toBeInTheDocument();
    expect(screen.queryByText('Preparar taller')).not.toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Cambiar tablero' })).queryByRole('button', { name: /Capacitaciones/ })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('TODO_BOARDS_V1'))).toEqual([
        expect.objectContaining({
          name: 'Personal',
          todos: [expect.objectContaining({ text: 'Plan personal' })],
        }),
      ]);
    });
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
    const filtersGroup = await openFilters(user);
    expect(within(filtersGroup).getByRole('button', { name: 'Vencidas 1' })).toBeInTheDocument();
    expect(within(filtersGroup).getByRole('button', { name: 'Hoy 1' })).toBeInTheDocument();
    expect(within(filtersGroup).getByRole('button', { name: 'Proximas 1' })).toBeInTheDocument();

    await user.click(within(filtersGroup).getByRole('button', { name: /Vencidas/ }));
    expect(screen.getByText('Resolver deuda vencida')).toBeInTheDocument();
    expect(screen.queryByText('Enviar avance de hoy')).not.toBeInTheDocument();

    await user.click(within(await openFilters(user)).getByRole('button', { name: /Hoy/ }));
    expect(screen.getByText('Enviar avance de hoy')).toBeInTheDocument();
    expect(screen.queryByText('Resolver deuda vencida')).not.toBeInTheDocument();

    await user.click(within(await openFilters(user)).getByRole('button', { name: /Proximas/ }));
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

  test('shows local productivity metrics from current todos', async () => {
    const yesterday = getRelativeDateInputValue(-1);
    const tomorrow = getRelativeDateInputValue(1);
    const recentCompletedAt = `${getRelativeDateInputValue(0)}T12:00:00.000Z`;
    const oldCompletedAt = `${getRelativeDateInputValue(-12)}T12:00:00.000Z`;

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Terminada reciente',
        completed: true,
        completedAt: recentCompletedAt,
        order: 0,
      },
      {
        id: 'todo-2',
        text: 'Terminada antigua',
        completed: true,
        completedAt: oldCompletedAt,
        order: 1,
      },
      {
        id: 'todo-3',
        text: 'Urgente vencida',
        completed: false,
        dueDate: yesterday,
        priority: 'high',
        order: 2,
      },
      {
        id: 'todo-4',
        text: 'Proxima normal',
        completed: false,
        dueDate: tomorrow,
        priority: 'medium',
        order: 3,
      },
    ]));
    renderApp();

    const metrics = await screen.findByRole('region', { name: 'Metricas locales' });

    expect(within(metrics).getByText('Progreso')).toBeInTheDocument();
    expect(within(metrics).getByText('50%')).toBeInTheDocument();
    expect(within(metrics).getByText('2 de 4 tareas')).toBeInTheDocument();
    expect(within(metrics).getByText('Ultimos 7 dias')).toBeInTheDocument();
    expect(within(metrics).getByText('Vencidas')).toBeInTheDocument();
    expect(within(metrics).getByText('Alta prioridad')).toBeInTheDocument();
    expect(within(metrics).getAllByText('1')).toHaveLength(3);
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

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    const dialog = screen.getByRole('dialog', { name: 'Crear tarea' });
    const projectInput = within(dialog).getByLabelText('Proyecto');

    expect(projectInput).toHaveValue('TaskFlow');
    expect(projectInput).toHaveAttribute('readonly');

    await user.type(within(dialog).getByLabelText('Nueva tarea'), 'Nueva dentro de TaskFlow');
    await user.click(within(dialog).getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Nueva dentro de TaskFlow')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toEqual(expect.arrayContaining([
      expect.objectContaining({
        text: 'Nueva dentro de TaskFlow',
        project: 'TaskFlow',
      }),
    ]));

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filtrar por etiqueta contenido' }));

    expect(screen.queryByText('Preparar demo')).not.toBeInTheDocument();
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();
  });

  test('saves, applies and deletes saved filters', async () => {
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

    await user.type(screen.getByLabelText('Buscar tareas'), 'demo');
    await user.click(screen.getByRole('button', { name: 'Filtrar por etiqueta frontend' }));
    await openTools(user);
    await user.type(screen.getByLabelText('Nombre para estos filtros'), 'Demo frontend');
    await user.click(screen.getByRole('button', { name: 'Guardar filtros' }));

    expect(screen.getByText('Guarda la busqueda y filtros activos para volver a usarlos.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Filtros guardados.');

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await user.clear(screen.getByLabelText('Buscar tareas'));

    expect(screen.getByText('Preparar demo')).toBeInTheDocument();
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Demo frontend' }));

    expect(screen.getByText('Preparar demo')).toBeInTheDocument();
    expect(screen.queryByText('Ordenar apuntes')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar filtros guardados Demo frontend' }));

    expect(screen.queryByRole('button', { name: 'Demo frontend' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODO_SAVED_VIEWS_V1'))).toEqual([]);
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

  test('reorders todos with drag and drop', async () => {
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Primera tarea', completed: false, order: 0 },
      { id: 'todo-2', text: 'Segunda tarea', completed: false, order: 1 },
      { id: 'todo-3', text: 'Tercera tarea', completed: false, order: 2 },
    ]));
    renderApp();

    expect(await screen.findByText('Primera tarea')).toBeInTheDocument();

    const dataTransfer = {
      dropEffect: '',
      effectAllowed: '',
      getData: vi.fn(() => 'todo-3'),
      setData: vi.fn(),
    };
    let items = within(screen.getByRole('list', { name: 'Lista de tareas' })).getAllByRole('listitem');

    fireEvent.dragStart(items[2], { dataTransfer });
    fireEvent.dragOver(items[0], { clientY: -1, dataTransfer });
    fireEvent.drop(items[0], { clientY: -1, dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'todo-3');

    await waitFor(() => {
      items = within(screen.getByRole('list', { name: 'Lista de tareas' })).getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Tercera tarea');
      expect(items[1]).toHaveTextContent('Primera tarea');
      expect(items[2]).toHaveTextContent('Segunda tarea');
    });
    expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
      'Tercera tarea',
      'Primera tarea',
      'Segunda tarea',
    ]);
  });

  test('moves focus through filters with arrow keys', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Preparar demo', completed: false, project: 'TaskFlow', tags: ['frontend'] },
      { id: 'todo-2', text: 'Ordenar docs', completed: true, project: 'Docs', tags: ['contenido'] },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar demo')).toBeInTheDocument();

    const filtersGroup = await openFilters(user);
    const allFilter = within(filtersGroup).getByRole('button', { name: /Todas/ });
    const pendingFilter = within(filtersGroup).getByRole('button', { name: /Pendientes/ });
    const todayFilter = within(filtersGroup).getByRole('button', { name: /Hoy/ });
    const upcomingFilter = within(filtersGroup).getByRole('button', { name: /Proximas/ });

    allFilter.focus();
    await user.keyboard('{ArrowRight}');
    expect(pendingFilter).toHaveFocus();

    await user.keyboard('{End}');
    expect(upcomingFilter).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(todayFilter).toHaveFocus();

    const projectsGroup = screen.getByRole('group', { name: 'Proyectos' });
    const docsProject = within(projectsGroup).getByRole('button', { name: /Docs/ });
    const taskFlowProject = within(projectsGroup).getByRole('button', { name: /TaskFlow/ });

    docsProject.focus();
    await user.keyboard('{ArrowRight}');

    expect(taskFlowProject).toHaveFocus();
  });

  test('moves focus through order buttons with arrow keys', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Primera tarea', completed: false, order: 0 },
      { id: 'todo-2', text: 'Segunda tarea', completed: false, order: 1 },
      { id: 'todo-3', text: 'Tercera tarea', completed: false, order: 2 },
    ]));
    renderApp();

    expect(await screen.findByText('Primera tarea')).toBeInTheDocument();

    const items = within(screen.getByRole('list', { name: 'Lista de tareas' })).getAllByRole('listitem');
    const orderGroup = within(items[1]).getByRole('group', { name: 'Ordenar tarea Segunda tarea' });
    const moveUpButton = within(orderGroup).getByRole('button', { name: 'Subir tarea' });
    const moveDownButton = within(orderGroup).getByRole('button', { name: 'Bajar tarea' });

    moveUpButton.focus();
    await user.keyboard('{ArrowDown}');
    expect(moveDownButton).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(moveUpButton).toHaveFocus();

    await user.keyboard('{Enter}');

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
    await user.type(screen.getByLabelText('Subtareas'), 'Escribir guia');
    await user.click(screen.getByRole('button', { name: 'Agregar subtarea' }));
    expect(within(screen.getByRole('list', { name: 'Subtareas agregadas' })).getByText('Escribir guia')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Subtareas'), 'Validar mobile');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    const checklist = screen.getByRole('list', { name: 'Checklist de Organizar lanzamiento' });
    const firstSubtask = within(checklist).getByLabelText('Escribir guia');

    expect(firstSubtask).not.toBeChecked();
    expect(within(checklist).getByLabelText('Validar mobile')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Escribir guia'));

    expect(screen.getByLabelText('Escribir guia')).toBeChecked();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: false,
      subtasks: [
        expect.objectContaining({ text: 'Escribir guia', completed: true }),
        expect.objectContaining({ text: 'Validar mobile', completed: false }),
      ],
    }));

    await user.click(within(checklist).getByLabelText('Validar mobile'));

    expect(screen.getByText('Completaste todas tus tareas')).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Tarea completa porque todas sus subtareas estan completas',
    })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: true,
      completedAt: expect.any(String),
      subtasks: [
        expect.objectContaining({ text: 'Escribir guia', completed: true }),
        expect.objectContaining({ text: 'Validar mobile', completed: true }),
      ],
    }));

    await user.click(screen.getByLabelText('Escribir guia'));

    expect(screen.getByRole('heading', { name: /Completaste 0 de 1 tareas/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: false,
      completedAt: null,
      subtasks: [
        expect.objectContaining({ text: 'Escribir guia', completed: false }),
        expect.objectContaining({ text: 'Validar mobile', completed: true }),
      ],
    }));
  });

  test('completes pending subtasks when the parent todo is completed', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Preparar clase',
        completed: false,
        subtasks: [
          { id: 'subtask-1', text: 'Armar consignas', completed: false },
          { id: 'subtask-2', text: 'Subir material', completed: false },
        ],
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar clase')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marcar tarea como completada' }));

    expect(screen.getByLabelText('Armar consignas')).toBeChecked();
    expect(screen.getByLabelText('Subir material')).toBeChecked();
    const completedBySubtasksButton = screen.getByRole('button', {
      name: 'Tarea completa porque todas sus subtareas estan completas',
    });

    expect(completedBySubtasksButton).toBeDisabled();

    await user.click(completedBySubtasksButton);

    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: true,
      completedAt: expect.any(String),
      subtasks: [
        expect.objectContaining({ text: 'Armar consignas', completed: true }),
        expect.objectContaining({ text: 'Subir material', completed: true }),
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

  test('exposes keyboard skip link and named task region', async () => {
    renderApp();

    expect(await screen.findByRole('main', { name: 'Organiza tu dia con una primera tarea' })).toBeInTheDocument();

    const skipLink = screen.getByRole('link', { name: 'Saltar a la lista de tareas' });
    const taskRegion = screen.getByRole('region', { name: 'Tareas' });

    expect(skipLink).toHaveAttribute('href', '#todo-list');
    expect(taskRegion).toHaveAttribute('id', 'todo-list');
    expect(taskRegion).toHaveAttribute('tabindex', '-1');
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

    await openTools(user);
    await user.click(screen.getByRole('button', { name: 'Exportar backup completo' }));

    const [backupBlob] = createObjectURL.mock.calls[0];
    const backup = JSON.parse(await backupBlob.text());

    expect(backup).toEqual(expect.objectContaining({
      version: 1,
      kind: 'taskflow-workspace',
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
      boards: [
        expect.objectContaining({
          name: 'Personal',
          todos: [expect.objectContaining({ text: 'Exportar tareas' })],
        }),
      ],
      savedViews: [],
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

    await openTools(user);
    await user.upload(screen.getByLabelText('Importar backup JSON'), backupFile);

    expect(screen.getByRole('region', { name: 'Previsualizacion de importacion' })).toBeInTheDocument();
    expect(screen.getByText('taskflow-backup.json: 1 tarea encontrada.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reemplazar tareas' }));

    expect(await screen.findByText('Importar tareas')).toBeInTheDocument();
    expect(screen.getByText('Baja')).toBeInTheDocument();
    expect(screen.getByText('Limite 01/08/2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por proyecto Administracion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar por etiqueta json' })).toBeInTheDocument();
    expect(screen.getByLabelText('Validar archivo')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 tarea importada. Tus tareas anteriores fueron reemplazadas.');
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

  test('merges imported todos and skips duplicates after preview', async () => {
    const user = userEvent.setup();
    const backupFile = new File([
      JSON.stringify({
        version: 1,
        todos: [
          { id: 'todo-2', text: 'Preparar demo', completed: false },
          { id: 'todo-3', text: 'Nueva tarea importada', completed: false, project: 'Import' },
        ],
      }),
    ], 'taskflow-merge.json', { type: 'application/json' });

    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Preparar demo', completed: false, order: 0 },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar demo')).toBeInTheDocument();

    await openTools(user);
    await user.upload(screen.getByLabelText('Importar backup JSON'), backupFile);

    expect(screen.getByText('taskflow-merge.json: 2 tareas encontradas.')).toBeInTheDocument();
    expect(screen.getByText('Al fusionar: 1 tarea agregada y 1 duplicada omitida.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fusionar sin duplicados' }));

    expect(screen.getByText('Nueva tarea importada')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 tarea agregada. 1 duplicada omitida.');
    expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
      'Preparar demo',
      'Nueva tarea importada',
    ]);
  });

  test('restores boards and saved views from a workspace backup', async () => {
    const user = userEvent.setup();
    const backupFile = new File([
      JSON.stringify({
        version: 1,
        kind: 'taskflow-workspace',
        exportedAt: '2026-07-08T10:00:00.000Z',
        activeBoardId: 'work',
        todos: [
          { id: 'todo-work', text: 'Preparar workspace', completed: false, project: 'Trabajo' },
        ],
        boards: [
          {
            id: 'personal',
            name: 'Personal',
            todos: [{ id: 'todo-personal', text: 'Plan restaurado', completed: false }],
            createdAt: null,
            updatedAt: null,
          },
          {
            id: 'work',
            name: 'Trabajo',
            todos: [{ id: 'todo-work', text: 'Preparar workspace', completed: false, project: 'Trabajo' }],
            createdAt: null,
            updatedAt: null,
          },
        ],
        savedViews: [
          {
            id: 'view-work',
            name: 'Trabajo activo',
            searchValue: '',
            filter: 'all',
            project: 'Trabajo',
            tag: null,
            createdAt: null,
          },
        ],
      }),
    ], 'taskflow-workspace.json', { type: 'application/json' });

    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-old', text: 'Tarea anterior', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Tarea anterior')).toBeInTheDocument();

    await openTools(user);
    await user.upload(screen.getByLabelText('Importar backup JSON'), backupFile);

    expect(screen.getByText('taskflow-workspace.json: 2 tableros, 2 tareas y 1 filtro guardado.')).toBeInTheDocument();
    expect(screen.getByText('Al restaurar, se reemplazan tus tableros, tareas y filtros guardados.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restaurar backup' }));

    expect(screen.getByText('Preparar workspace')).toBeInTheDocument();
    expect(screen.queryByText('Tarea anterior')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Backup restaurado: 2 tableros, 2 tareas y 1 filtro guardado.');

    const boardSwitcher = screen.getByRole('group', { name: 'Cambiar tablero' });
    expect(within(boardSwitcher).getByRole('button', { name: /Trabajo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trabajo activo' })).toBeInTheDocument();

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('ACTIVE_TODO_BOARD_V1'))).toBe('work');
      expect(JSON.parse(localStorage.getItem('TODO_BOARDS_V1'))).toEqual([
        expect.objectContaining({ name: 'Personal' }),
        expect.objectContaining({
          name: 'Trabajo',
          todos: [expect.objectContaining({ text: 'Preparar workspace' })],
        }),
      ]);
      expect(JSON.parse(localStorage.getItem('TODO_SAVED_VIEWS_V1'))).toEqual([
        expect.objectContaining({ name: 'Trabajo activo' }),
      ]);
    });
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
    expect(textarea).toHaveValue('Actualizar portfolio');
    expect(projectInput).toHaveValue('Web');
    expect(tagsInput).toHaveValue('portfolio');
    expect(within(dialog).getByRole('list', { name: 'Subtareas agregadas' })).toHaveTextContent('Revisar copy');

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

  test('undoes a deleted todo and restores its order', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Publicar demo', completed: false, order: 0 },
      { id: 'todo-2', text: 'Revisar metricas', completed: false, order: 1 },
    ]));
    renderApp();

    expect(await screen.findByText('Publicar demo')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar tarea' })[0]);
    await user.click(within(screen.getByRole('dialog', { name: 'Eliminar tarea' })).getByRole('button', { name: 'Eliminar' }));

    expect(screen.queryByText('Publicar demo')).not.toBeInTheDocument();
    expect(screen.getByText('Eliminaste "Publicar demo".')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Deshacer' }));

    expect(screen.getByText('Publicar demo')).toBeInTheDocument();
    expect(screen.queryByText('Eliminaste "Publicar demo".')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
      'Publicar demo',
      'Revisar metricas',
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
    const descriptionInput = within(dialog).getByLabelText('Descripcion');
    const prioritySelect = within(dialog).getByLabelText('Prioridad');
    const dateTypeSelect = within(dialog).getByLabelText('Tipo de fecha');
    const dueDateInput = within(dialog).getByLabelText('Fecha limite');
    const projectInput = within(dialog).getByLabelText('Proyecto');
    const tagsInput = within(dialog).getByLabelText('Etiquetas');
    const subtasksInput = within(dialog).getByLabelText('Subtareas');
    const addSubtaskButton = within(dialog).getByRole('button', { name: 'Agregar subtarea' });
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancelar' });
    const submitButton = within(dialog).getByRole('button', { name: 'Agregar' });

    expect(textarea).toHaveFocus();

    await user.tab();
    expect(descriptionInput).toHaveFocus();

    await user.tab();
    expect(prioritySelect).toHaveFocus();

    await user.tab();
    expect(dateTypeSelect).toHaveFocus();

    await user.tab();
    expect(dueDateInput).toHaveFocus();

    await user.tab();
    expect(projectInput).toHaveFocus();

    await user.tab();
    expect(tagsInput).toHaveFocus();

    await user.tab();
    expect(subtasksInput).toHaveFocus();

    await user.tab();
    expect(addSubtaskButton).toHaveFocus();

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
