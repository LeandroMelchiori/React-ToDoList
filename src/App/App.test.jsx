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

function toTimeInputValue(date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${hour}:${minute}`;
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
    expect(within(screen.getByRole('dialog')).getByText('Tarea completable')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nueva tarea'), 'Rendir parcial de algebra');
    await user.click(screen.getByRole('radio', { name: /Evento/ }));
    expect(within(screen.getByRole('dialog')).getByText('Evento de agenda')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Descripcion'), 'Aula 4, llevar DNI y calculadora');
    expect(within(screen.getByLabelText('Repeticion')).queryByRole('option', { name: 'Diaria' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Repeticion'), 'yearly');
    await user.type(screen.getByLabelText('Dia del evento'), '2026-08-15');
    fireEvent.change(screen.getByLabelText('Hora del evento'), { target: { value: '10:00' } });
    expect(within(screen.getByRole('dialog')).getByText('Dia 15/08/2026')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('Hora 10:00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Rendir parcial de algebra')).toBeInTheDocument();
    expect(screen.getByText('Aula 4, llevar DNI y calculadora')).toBeInTheDocument();
    expect(screen.getByText('Dia 15/08/2026 10:00')).toBeInTheDocument();
    expect(screen.getByText('Anual')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Inscripcion a finales');
    await user.click(screen.getByRole('radio', { name: /Periodo/ }));
    expect(within(screen.getByRole('dialog')).getByText('Rango activo')).toBeInTheDocument();
    expect(screen.getByLabelText('Repeticion')).toBeDisabled();
    await user.type(screen.getByLabelText('Inicio del periodo'), '2026-09-01');
    await user.type(screen.getByLabelText('Fin del periodo'), '2026-08-30');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('La fecha de fin no puede ser anterior al inicio.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Fin del periodo'));
    await user.type(screen.getByLabelText('Fin del periodo'), '2026-09-15');
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '12:00' } });
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Inscripcion a finales')).toBeInTheDocument();
    expect(screen.getByText('Periodo 01/09/2026 - 15/09/2026 10:00 a 12:00')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tu agenda no tiene tareas pendientes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar tarea como completada' })).not.toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos).toEqual([
      expect.objectContaining({
        text: 'Rendir parcial de algebra',
        kind: 'event',
        description: 'Aula 4, llevar DNI y calculadora',
        dateType: 'event',
        dueDate: null,
        startDate: '2026-08-15',
        endDate: null,
        startTime: '10:00',
        endTime: null,
        recurrence: 'yearly',
      }),
      expect.objectContaining({
        text: 'Inscripcion a finales',
        kind: 'period',
        dateType: 'period',
        dueDate: null,
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        startTime: '10:00',
        endTime: '12:00',
      }),
    ]);
  });

  test('creates an agenda item with a browser reminder', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    const MockNotification = vi.fn();
    MockNotification.permission = 'default';
    MockNotification.requestPermission = requestPermission;
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: MockNotification,
    });
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Rendir final de redes');
    await user.click(screen.getByRole('radio', { name: /Evento/ }));
    await user.type(screen.getByLabelText('Dia del evento'), '2026-08-15');
    fireEvent.change(screen.getByLabelText('Hora del evento'), { target: { value: '10:00' } });
    await user.selectOptions(screen.getByLabelText('Recordatorio'), '30-minutes');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Recordatorio 30 min antes')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      text: 'Rendir final de redes',
      reminder: '30-minutes',
    }));

    await openTools(user);
    await user.click(within(screen.getByLabelText('Recordatorios')).getByRole('button', { name: 'Activar' }));

    await waitFor(() => expect(requestPermission).toHaveBeenCalledTimes(1));
  });

  test('warns before saving an overlapping schedule', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'existing-course',
        text: 'Cursar algebra',
        kind: 'schedule',
        dateType: 'period',
        startDate: '2026-08-10',
        endDate: '2026-08-10',
        startTime: '10:00',
        endTime: '12:00',
        recurrence: 'none',
      },
    ]));
    renderApp();

    expect(await screen.findByText('Cursar algebra')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Consulta de algebra');
    await user.click(screen.getByRole('radio', { name: /Horario/ }));
    fireEvent.change(screen.getByLabelText('Primer dia'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText('Ultimo dia'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '11:00' } });
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '11:30' } });
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    const conflictAlert = screen.getByRole('alert');
    expect(conflictAlert).toHaveTextContent('Este horario se superpone');
    expect(conflictAlert).toHaveTextContent('Cursar algebra desde 10/08/2026');
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toHaveLength(1);

    await user.click(within(conflictAlert).getByRole('button', { name: 'Cambiar horario' }));
    expect(screen.getByLabelText('Hora de inicio')).toHaveFocus();

    await user.click(within(conflictAlert).getByRole('button', { name: 'Guardar de todos modos' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Consulta de algebra')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))).toHaveLength(2);
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
        startTime: '10:00',
        order: 0,
      },
      {
        id: 'todo-period',
        text: 'Inscripcion a finales',
        completed: false,
        dateType: 'period',
        startDate: today,
        endDate: tomorrow,
        startTime: '10:00',
        endTime: '12:00',
        order: 1,
      },
      {
        id: 'todo-unscheduled',
        text: 'Leer bibliografia',
        completed: false,
        order: 2,
      },
      {
        id: 'todo-recurring',
        text: 'Pagar cuota',
        completed: false,
        dateType: 'due',
        dueDate: today,
        recurrence: 'weekly',
        order: 3,
      },
      {
        id: 'todo-daily-1',
        text: 'Tomar medicacion',
        completed: false,
        dateType: 'due',
        dueDate: today,
        recurrence: 'daily',
        order: 4,
      },
      {
        id: 'todo-daily-2',
        text: 'Repasar vocabulario',
        completed: false,
        dateType: 'due',
        dueDate: today,
        recurrence: 'daily',
        order: 5,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Rendir parcial')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Calendario' }));

    expect(screen.getByRole('grid', { name: /Calendario/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Evento 10:00 Rendir parcial/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Periodo 10:00 a 12:00 Inscripcion a finales/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Limite Semanal Pagar cuota/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('2 diarias').length).toBeGreaterThan(0);
    expect(within(screen.getByRole('complementary', { name: 'Elementos sin fecha' })).getByRole('button', { name: 'Leer bibliografia' })).toBeInTheDocument();

    const dailySummary = screen.getAllByText('2 diarias')[0];
    await user.click(dailySummary);
    expect(within(dailySummary.closest('details')).getByRole('button', { name: 'Tomar medicacion' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Semana' }));

    expect(screen.getByRole('grid', { name: /Agenda semanal/ })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Elementos sin horario por dia' })).getAllByRole('button', { name: /Limite Semanal Pagar cuota/ }).length).toBeGreaterThan(0);
    expect(within(screen.getByRole('group', { name: 'Elementos sin horario por dia' })).getAllByText('2 diarias').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /10:00 Evento Rendir parcial/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /10:00 a 12:00 Periodo Inscripcion a finales/ }).length).toBeGreaterThan(0);
    expect(within(screen.getByRole('complementary', { name: 'Elementos sin fecha' })).getByRole('button', { name: 'Leer bibliografia' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /10:00 Evento Rendir parcial/ }));

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(detailDialog).toHaveClass('ModalContent--side');
    expect(within(detailDialog).getByRole('button', { name: 'Cerrar detalle' })).toBeInTheDocument();
    expect(within(detailDialog).getByText('Rendir parcial')).toBeInTheDocument();
    await user.click(within(detailDialog).getByRole('button', { name: 'Editar' }));

    const editDialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    expect(within(editDialog).getByLabelText('Editar tarea')).toHaveValue('Rendir parcial');
  });

  test('shows a planning board grouped by status', async () => {
    const user = userEvent.setup();
    const yesterday = getRelativeDateInputValue(-1);
    const today = getRelativeDateInputValue(0);
    const tomorrow = getRelativeDateInputValue(1);

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-overdue',
        text: 'Enviar tramite vencido',
        kind: 'task',
        completed: false,
        dateType: 'due',
        dueDate: yesterday,
        priority: 'high',
        order: 0,
      },
      {
        id: 'todo-today',
        text: 'Preparar clase de hoy',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: today,
        startTime: '10:00',
        order: 1,
      },
      {
        id: 'todo-upcoming',
        text: 'Comprar materiales',
        kind: 'task',
        completed: false,
        dateType: 'due',
        dueDate: tomorrow,
        priority: 'medium',
        order: 2,
      },
      {
        id: 'todo-unscheduled',
        text: 'Idea sin fecha',
        kind: 'task',
        completed: false,
        priority: 'low',
        order: 3,
      },
      {
        id: 'todo-completed',
        text: 'Cerrar tarea lista',
        kind: 'task',
        completed: true,
        priority: 'medium',
        order: 4,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Enviar tramite vencido')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tablero' }));

    expect(screen.getByRole('heading', { name: 'Planificacion por estado' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Columna Vencidas' })).getByText('Enviar tramite vencido')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Columna Hoy' })).getByText('Preparar clase de hoy')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Columna Proximas' })).getByText('Comprar materiales')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Columna Sin fecha' })).getByText('Idea sin fecha')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Columna Completadas' })).getByText('Cerrar tarea lista')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir detalle Preparar clase de hoy' }));

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(within(detailDialog).getByText('Evento')).toBeInTheDocument();
    expect(within(detailDialog).getByText('Preparar clase de hoy')).toBeInTheDocument();
  });

  test('shows a focused today view separated by tasks and agenda items', async () => {
    const user = userEvent.setup();
    const yesterday = getRelativeDateInputValue(-1);
    const today = getRelativeDateInputValue(0);
    const tomorrow = getRelativeDateInputValue(1);

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-task',
        text: 'Preparar entrega',
        kind: 'task',
        completed: false,
        dateType: 'due',
        dueDate: today,
        order: 0,
      },
      {
        id: 'todo-event',
        text: 'Rendir parcial',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: today,
        startTime: '10:00',
        order: 1,
      },
      {
        id: 'todo-schedule',
        text: 'Cursar programacion',
        kind: 'schedule',
        completed: false,
        dateType: 'period',
        startDate: today,
        endDate: tomorrow,
        startTime: '14:00',
        endTime: '16:00',
        order: 2,
      },
      {
        id: 'todo-period',
        text: 'Inscripcion a finales',
        kind: 'period',
        completed: false,
        dateType: 'period',
        startDate: yesterday,
        endDate: tomorrow,
        order: 3,
      },
      {
        id: 'todo-tomorrow',
        text: 'Evento de manana',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: tomorrow,
        order: 4,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar entrega')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoy' }));

    expect(screen.getByRole('heading', { name: 'Tu dia en foco' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Tareas para completar' })).getByText('Preparar entrega')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Eventos del dia' })).getByText('Rendir parcial')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Horarios y cursadas' })).getByText('Cursar programacion')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Periodos activos' })).getByText('Inscripcion a finales')).toBeInTheDocument();
    expect(screen.queryByText('Evento de manana')).not.toBeInTheDocument();

    await user.click(within(screen.getByRole('region', { name: 'Eventos del dia' })).getByRole('button', { name: /Rendir parcial/ }));

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(within(detailDialog).getByText('Evento')).toBeInTheDocument();
    await user.click(within(detailDialog).getByRole('button', { name: 'Editar' }));

    const editDialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    expect(within(editDialog).getByLabelText('Editar tarea')).toHaveValue('Rendir parcial');
  });

  test('shows a time reminder in the today view', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const today = toDateInputValue(now);
    const startTime = toTimeInputValue(now);

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-event',
        text: 'Rendir parcial',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: today,
        startTime,
        order: 0,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Rendir parcial')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoy' }));

    const reminder = screen.getByRole('button', { name: `Ahora: ${startTime} Rendir parcial` });
    expect(reminder).toBeInTheDocument();

    await user.click(reminder);

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(within(detailDialog).getByText('Evento')).toBeInTheDocument();
    expect(within(detailDialog).getByText('Rendir parcial')).toBeInTheDocument();
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

  test('requires a base date for recurring todos', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Repasar vocabulario');
    await user.selectOptions(screen.getByLabelText('Repeticion'), 'weekly');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Agrega una fecha para poder repetir la tarea.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1') || '[]')).toEqual([]);
  });

  test('creates a task from the local quick add input', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    const quickAddInput = screen.getByLabelText('Agregar rapido');
    const quickAddForm = quickAddInput.closest('form');

    await user.type(
      quickAddInput,
      'Repasar ingles cada dia 18/07/2026 09:00 #facultad !alta'
    );

    expect(within(quickAddForm).getByText(/Detectado: Alta/)).toHaveTextContent(
      'Alta · #facultad · Diaria · 18/07/2026 · 09:00'
    );
    await user.click(within(quickAddForm).getByRole('button', { name: 'Agregar rapido' }));

    expect(screen.getByText('Repasar ingles')).toBeInTheDocument();
    expect(quickAddInput).toHaveValue('');
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      text: 'Repasar ingles',
      priority: 'high',
      dueDate: '2026-07-18',
      startTime: '09:00',
      recurrence: 'daily',
      tags: ['facultad'],
    }));
  });

  test('creates a weekly recurrence with selected weekdays and limits', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear nueva tarea' }));
    await user.type(screen.getByLabelText('Nueva tarea'), 'Cursar algebra');
    await user.type(screen.getByLabelText('Fecha limite'), '2026-08-03');
    await user.selectOptions(screen.getByLabelText('Repeticion'), 'weekly');
    await user.click(screen.getByLabelText('Lun'));
    await user.click(screen.getByLabelText('Mie'));
    await user.type(screen.getByLabelText('Finaliza el'), '2026-08-31');
    await user.type(screen.getByLabelText('Cantidad maxima'), '4');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByText('Semanal: Lun, Mie - hasta 31/08/2026 - 4 veces')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      text: 'Cursar algebra',
      recurrence: 'weekly',
      recurrenceDays: [1, 3],
      recurrenceEndDate: '2026-08-31',
      recurrenceCount: 4,
    }));
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

  test('filters todos by advanced attributes from the filters menu', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-high',
        text: 'Preparar demo',
        completed: false,
        priority: 'high',
        subtasks: [{ id: 'subtask-1', text: 'Revisar flujo', completed: false }],
        order: 0,
      },
      {
        id: 'todo-reminder',
        text: 'Enviar recordatorio',
        completed: false,
        dueDate: '2026-07-20',
        reminder: '1-day',
        order: 1,
      },
      {
        id: 'event-exam',
        text: 'Rendir final',
        kind: 'event',
        dateType: 'event',
        startDate: '2026-07-22',
        order: 2,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar demo')).toBeInTheDocument();

    let filtersGroup = await openFilters(user);
    expect(within(filtersGroup).getByText('Atributos')).toBeInTheDocument();
    expect(within(filtersGroup).getByText('Tipo')).toBeInTheDocument();

    await user.click(within(filtersGroup).getByRole('button', { name: 'Alta prioridad 1' }));

    expect(screen.getByText('Preparar demo')).toBeInTheDocument();
    expect(screen.queryByText('Enviar recordatorio')).not.toBeInTheDocument();
    expect(screen.queryByText('Rendir final')).not.toBeInTheDocument();

    filtersGroup = await openFilters(user);
    await user.click(within(filtersGroup).getByRole('button', { name: 'Eventos 1' }));

    expect(screen.getByText('Rendir final')).toBeInTheDocument();
    expect(screen.queryByText('Preparar demo')).not.toBeInTheDocument();
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
    const scheduleFilter = within(filtersGroup).getByRole('button', { name: /Horarios/ });
    const periodFilter = within(filtersGroup).getByRole('button', { name: /Periodos/ });

    allFilter.focus();
    await user.keyboard('{ArrowRight}');
    expect(pendingFilter).toHaveFocus();

    await user.keyboard('{End}');
    expect(periodFilter).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(scheduleFilter).toHaveFocus();

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

  test('applies bulk actions only to compatible selected elements', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-pending', text: 'Preparar entrega', completed: false, order: 0 },
      { id: 'todo-completed', text: 'Entrega anterior', completed: true, order: 1 },
      {
        id: 'event-exam',
        text: 'Examen final',
        kind: 'event',
        dateType: 'event',
        startDate: '2026-08-08',
        completed: false,
        order: 2,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar entrega')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Seleccionar tareas' }));
    await user.click(screen.getByLabelText('Seleccionar Preparar entrega'));
    await user.click(screen.getByLabelText('Seleccionar Examen final'));
    await user.click(within(screen.getByRole('region', { name: 'Acciones masivas' }))
      .getByRole('button', { name: 'Completar' }));

    expect(screen.getByText('1 elemento completado.')).toBeInTheDocument();
    let storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos.find(todo => todo.id === 'todo-pending').completed).toBe(true);
    expect(storedTodos.find(todo => todo.id === 'event-exam').completed).toBe(false);

    await user.click(screen.getByLabelText('Seleccionar Entrega anterior'));
    await user.click(within(screen.getByRole('region', { name: 'Acciones masivas' }))
      .getByRole('button', { name: 'Archivar completadas' }));
    storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos.find(todo => todo.id === 'todo-completed').archivedAt).toEqual(expect.any(String));

    await user.click(screen.getByLabelText('Seleccionar Examen final'));
    await user.click(within(screen.getByRole('region', { name: 'Acciones masivas' }))
      .getByRole('button', { name: 'Eliminar' }));
    const bulkDeleteDialog = screen.getByRole('dialog', { name: 'Eliminar seleccion' });
    await user.click(within(bulkDeleteDialog).getByRole('button', { name: 'Eliminar 1' }));

    expect(screen.queryByText('Examen final')).not.toBeInTheDocument();
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

    expect(screen.getByRole('progressbar', {
      name: 'Progreso de subtareas de Organizar lanzamiento: 0 de 2',
    })).toBeInTheDocument();
    expect(firstSubtask).not.toBeChecked();
    expect(within(checklist).getByLabelText('Validar mobile')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Escribir guia'));

    expect(screen.getByLabelText('Escribir guia')).toBeChecked();
    expect(screen.getByRole('progressbar', {
      name: 'Progreso de subtareas de Organizar lanzamiento: 1 de 2',
    })).toBeInTheDocument();
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

  test('completes one recurring occurrence without closing the series', async () => {
    const user = userEvent.setup();
    const today = getRelativeDateInputValue(0);
    const [year, month, day] = today.split('-');
    const displayDate = `${day}/${month}/${year}`;

    localStorage.setItem('TODOS_V1', JSON.stringify([{
      id: 'todo-daily',
      text: 'Repasar vocabulario',
      completed: false,
      dueDate: today,
      recurrence: 'daily',
      completedOccurrences: [],
    }]));
    renderApp();

    expect(await screen.findByText('Repasar vocabulario')).toBeInTheDocument();
    expect(screen.getByText(`Proxima ${displayDate}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', {
      name: `Completar ocurrencia del ${displayDate}`,
    }));

    expect(screen.getByText(`Realizada ${displayDate}`)).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: `Marcar pendiente ocurrencia del ${displayDate}`,
    })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: false,
      completedAt: null,
      completedOccurrences: [today],
    }));
  });

  test('collapses long subtasks lists behind progress summary', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-routine',
        text: 'Rutina diaria',
        completed: false,
        order: 0,
        subtasks: [
          { id: 'subtask-1', text: 'Tender cama', completed: true },
          { id: 'subtask-2', text: 'Preparar desayuno', completed: false },
          { id: 'subtask-3', text: 'Ordenar escritorio', completed: true },
          { id: 'subtask-4', text: 'Sacar basura', completed: false },
        ],
      },
    ]));
    renderApp();

    expect(await screen.findByText('Rutina diaria')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', {
      name: 'Progreso de subtareas de Rutina diaria: 2 de 4',
    })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Checklist de Rutina diaria' })).not.toBeInTheDocument();

    const summaryButton = screen.getByRole('button', {
      name: 'Ver subtareas de Rutina diaria: 2 de 4',
    });
    expect(summaryButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(summaryButton);

    const checklist = screen.getByRole('list', { name: 'Checklist de Rutina diaria' });
    expect(summaryButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(checklist).getByLabelText('Tender cama')).toBeChecked();
    expect(within(checklist).getByLabelText('Sacar basura')).not.toBeChecked();

    await user.click(screen.getByRole('button', {
      name: 'Ocultar subtareas de Rutina diaria: 2 de 4',
    }));

    expect(screen.queryByRole('list', { name: 'Checklist de Rutina diaria' })).not.toBeInTheDocument();
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

  test('applies and persists display preferences', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Organiza tu dia con una primera tarea')).toBeInTheDocument();
    await openTools(user);

    await user.selectOptions(screen.getByLabelText('Densidad'), 'compact');
    expect(screen.getByRole('main')).toHaveClass('App--compact');

    await user.click(screen.getByLabelText('Mostrar captura rapida'));
    expect(screen.queryByLabelText('Agregar rapido')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Vista inicial'), 'calendar');
    expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem('TODO_SETTINGS_V1'))).toEqual({
      defaultView: 'calendar',
      density: 'compact',
      showQuickAdd: false,
    });
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

  test('exports dated items to an ICS calendar', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:taskflow-calendar');
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
        id: 'todo-event',
        text: 'Examen de algebra',
        kind: 'event',
        dateType: 'event',
        startDate: '2026-08-08',
        startTime: '10:00',
      },
      {
        id: 'todo-course',
        text: 'Cursada de redes',
        kind: 'schedule',
        dateType: 'period',
        startDate: '2026-08-04',
        endDate: '2026-12-01',
        startTime: '10:00',
        endTime: '12:00',
        recurrence: 'weekly',
      },
    ]));
    renderApp();

    expect(await screen.findByText('Examen de algebra')).toBeInTheDocument();

    await openTools(user);
    await user.click(screen.getByRole('button', { name: 'Exportar calendario ICS' }));

    const [calendarBlob] = createObjectURL.mock.calls[0];
    const calendarText = await calendarBlob.text();

    expect(calendarText).toContain('BEGIN:VCALENDAR');
    expect(calendarText).toContain('SUMMARY:Examen de algebra');
    expect(calendarText).toContain('SUMMARY:Cursada de redes');
    expect(calendarText).toContain('RRULE:FREQ=WEEKLY;UNTIL=20261201T235959');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:taskflow-calendar');
    expect(screen.getByRole('status')).toHaveTextContent('2 elementos exportados al calendario.');
  });

  test('previews and imports an ICS calendar without duplicates', async () => {
    const user = userEvent.setup();
    const calendarFile = new File([
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:exam-2026@example.com',
        'SUMMARY:Examen de algebra',
        'DTSTART:20260808T100000',
        'DTEND:20260808T120000',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:course-2026@example.com',
        'SUMMARY:Cursada de redes',
        'DTSTART:20260804T100000',
        'DTEND:20260804T120000',
        'RRULE:FREQ=WEEKLY;UNTIL=20261201T235959',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'),
    ], 'facultad.ics', { type: 'text/calendar' });

    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-existing',
        text: 'Examen de algebra',
        kind: 'event',
        completed: false,
        dateType: 'event',
        startDate: '2026-08-08',
        startTime: '10:00',
      },
    ]));
    renderApp();

    expect(await screen.findByText('Examen de algebra')).toBeInTheDocument();

    await openTools(user);
    await user.upload(screen.getByLabelText('Importar calendario ICS'), calendarFile);

    expect(screen.getByRole('region', { name: 'Previsualizacion de importacion' })).toBeInTheDocument();
    expect(screen.getByText('facultad.ics: 2 elementos encontrados.')).toBeInTheDocument();
    expect(screen.getByText('Al importar: 1 elemento agregado y 1 duplicada omitida.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reemplazar tareas' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Importar calendario' }));

    expect(screen.getByText('Cursada de redes')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 elemento agregado. 1 duplicada omitida.');
    expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
      'Examen de algebra',
      'Cursada de redes',
    ]);
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
    expect(screen.getByText('Al fusionar en Personal: 1 tarea agregada y 1 duplicada omitida.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fusionar sin duplicados' }));

    expect(screen.getByText('Nueva tarea importada')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 tarea agregada en Personal. 1 duplicada omitida.');
    expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
      'Preparar demo',
      'Nueva tarea importada',
    ]);
  });

  test('merges imported todos into the selected board', async () => {
    const user = userEvent.setup();
    const backupFile = new File([
      JSON.stringify({
        version: 1,
        todos: [
          { id: 'todo-import-1', text: 'Preparar demo', completed: false },
          { id: 'todo-import-2', text: 'Nueva tarea importada', completed: false },
        ],
      }),
    ], 'taskflow-board-import.json', { type: 'application/json' });

    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-personal', text: 'Preparar demo', completed: false, order: 0 },
    ]));
    localStorage.setItem('ACTIVE_TODO_BOARD_V1', JSON.stringify('personal'));
    localStorage.setItem('TODO_BOARDS_V1', JSON.stringify([
      {
        id: 'personal',
        name: 'Personal',
        todos: [{ id: 'todo-personal', text: 'Preparar demo', completed: false, order: 0 }],
        createdAt: null,
        updatedAt: null,
      },
      {
        id: 'work',
        name: 'Trabajo',
        todos: [{ id: 'todo-work', text: 'Plan trabajo', completed: false, order: 0 }],
        createdAt: null,
        updatedAt: null,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar demo')).toBeInTheDocument();

    await openTools(user);
    await user.upload(screen.getByLabelText('Importar backup JSON'), backupFile);

    expect(screen.getByText('taskflow-board-import.json: 2 tareas encontradas.')).toBeInTheDocument();
    expect(screen.getByText('Al fusionar en Personal: 1 tarea agregada y 1 duplicada omitida.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Tablero destino'), 'work');

    expect(screen.getByText('Al fusionar en Trabajo: 2 tareas agregadas y 0 duplicadas omitidas.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fusionar sin duplicados' }));

    expect(screen.getByRole('status')).toHaveTextContent('2 tareas agregadas en Trabajo.');
    expect(screen.queryByText('Nueva tarea importada')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('TODOS_V1')).map(todo => todo.text)).toEqual([
        'Preparar demo',
      ]);
      expect(JSON.parse(localStorage.getItem('TODO_BOARDS_V1'))).toEqual([
        expect.objectContaining({
          id: 'personal',
          todos: [expect.objectContaining({ text: 'Preparar demo' })],
        }),
        expect.objectContaining({
          id: 'work',
          todos: [
            expect.objectContaining({ text: 'Plan trabajo' }),
            expect.objectContaining({ text: 'Preparar demo' }),
            expect.objectContaining({ text: 'Nueva tarea importada' }),
          ],
        }),
      ]);
    });
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
        dueDate: '2026-07-20',
        recurrence: 'weekly',
        project: 'Web',
        tags: ['portfolio'],
        subtasks: [{ id: 'subtask-1', text: 'Revisar copy', completed: true }],
      },
      { id: 'todo-2', text: 'Preparar entrevista', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Actualizar portfolio')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0]);

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(within(detailDialog).getByText('Actualizar portfolio')).toBeInTheDocument();
    expect(within(detailDialog).getByText('Limite 20/07/2026')).toBeInTheDocument();
    expect(within(detailDialog).getByText('#portfolio')).toBeInTheDocument();
    await user.click(within(detailDialog).getByRole('button', { name: 'Editar' }));

    const dialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    const textarea = within(dialog).getByLabelText('Editar tarea');
    const recurrenceSelect = within(dialog).getByLabelText('Repeticion');
    const projectInput = within(dialog).getByLabelText('Proyecto');
    const tagsInput = within(dialog).getByLabelText('Etiquetas');
    expect(textarea).toHaveValue('Actualizar portfolio');
    expect(recurrenceSelect).toHaveValue('weekly');
    expect(projectInput).toHaveValue('Web');
    expect(tagsInput).toHaveValue('portfolio');
    expect(within(dialog).getByRole('list', { name: 'Subtareas agregadas' })).toHaveTextContent('Revisar copy');

    await user.clear(textarea);
    await user.type(textarea, 'preparar entrevista');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('Ya existe otra tarea con ese texto.')).toBeInTheDocument();

    await user.clear(textarea);
    await user.type(textarea, 'Actualizar README del portfolio');
    await user.selectOptions(recurrenceSelect, 'monthly');
    await user.clear(projectInput);
    await user.type(projectInput, 'TaskFlow');
    await user.clear(tagsInput);
    await user.type(tagsInput, 'docs, ui');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Actualizar README del portfolio')).toBeInTheDocument();
    expect(screen.queryByText('Actualizar portfolio')).not.toBeInTheDocument();
    expect(screen.getByText('Mensual')).toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos[0]).toEqual(expect.objectContaining({
      id: 'todo-1',
      text: 'Actualizar README del portfolio',
      completed: false,
      recurrence: 'monthly',
      project: 'TaskFlow',
      tags: ['docs', 'ui'],
      subtasks: [{ id: 'subtask-1', text: 'Revisar copy', completed: true }],
    }));
  });

  test('duplicates a todo from the detail panel as a fresh copy', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Preparar final',
        completed: true,
        completedAt: '2026-07-20T10:00:00.000Z',
        priority: 'high',
        dueDate: '2026-07-20',
        recurrence: 'weekly',
        project: 'Facultad',
        tags: ['algebra'],
        subtasks: [{ id: 'subtask-1', text: 'Leer resumen', completed: true }],
        order: 0,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Preparar final')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    await user.click(within(detailDialog).getByRole('button', { name: 'Duplicar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Preparar final')).toBeInTheDocument();
    expect(screen.getByText('Copia de Preparar final')).toBeInTheDocument();

    const storedTodos = JSON.parse(localStorage.getItem('TODOS_V1'));
    expect(storedTodos).toHaveLength(2);
    expect(storedTodos[1]).toEqual(expect.objectContaining({
      text: 'Copia de Preparar final',
      completed: false,
      completedAt: null,
      priority: 'high',
      dueDate: '2026-07-20',
      recurrence: 'weekly',
      project: 'Facultad',
      tags: ['algebra'],
      subtasks: [
        expect.objectContaining({
          text: 'Leer resumen',
          completed: false,
        }),
      ],
    }));
  });

  test('toggles task completion from the detail panel', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Enviar inscripcion',
        completed: false,
        priority: 'medium',
        order: 0,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Enviar inscripcion')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(within(detailDialog).getByText('Pendiente')).toBeInTheDocument();

    await user.click(within(detailDialog).getByRole('button', { name: 'Completar' }));

    expect(within(detailDialog).getByText('Completada')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: true,
      completedAt: expect.any(String),
    }));

    await user.click(within(detailDialog).getByRole('button', { name: 'Marcar pendiente' }));

    expect(within(detailDialog).getByText('Pendiente')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      completed: false,
      completedAt: null,
    }));
  });

  test('archives completed todos and restores them from history', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      {
        id: 'todo-1',
        text: 'Cerrar entrega',
        completed: false,
        priority: 'medium',
        order: 0,
      },
    ]));
    renderApp();

    expect(await screen.findByText('Cerrar entrega')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    let detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    await user.click(within(detailDialog).getByRole('button', { name: 'Completar' }));
    await user.click(within(detailDialog).getByRole('button', { name: 'Archivar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Cerrar entrega')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      archivedAt: expect.any(String),
    }));

    await user.click(within(await openFilters(user)).getByRole('button', { name: 'Archivadas 1' }));

    expect(screen.getByText('Cerrar entrega')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    expect(within(detailDialog).getAllByText('Archivada')).toHaveLength(2);
    await user.click(within(detailDialog).getByRole('button', { name: 'Restaurar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('TODOS_V1'))[0]).toEqual(expect.objectContaining({
      archivedAt: null,
    }));
  });

  test('keeps a todo when delete confirmation is cancelled', async () => {
    const user = userEvent.setup();
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-1', text: 'Publicar demo', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Publicar demo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    const detailDialog = screen.getByRole('dialog', { name: 'Detalle del elemento' });
    await user.click(within(detailDialog).getByRole('button', { name: 'Eliminar' }));

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
    const kindSelect = within(dialog).getByRole('radio', { name: /Tarea/ });
    const descriptionInput = within(dialog).getByLabelText('Descripcion');
    const prioritySelect = within(dialog).getByLabelText('Prioridad');
    const recurrenceSelect = within(dialog).getByLabelText('Repeticion');
    const dueDateInput = within(dialog).getByLabelText('Fecha limite');
    const dueTimeInput = within(dialog).getByLabelText('Hora limite');
    const reminderSelect = within(dialog).getByLabelText('Recordatorio');
    const projectInput = within(dialog).getByLabelText('Proyecto');
    const tagsInput = within(dialog).getByLabelText('Etiquetas');
    const subtasksInput = within(dialog).getByLabelText('Subtareas');
    const addSubtaskButton = within(dialog).getByRole('button', { name: 'Agregar subtarea' });
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancelar' });
    const submitButton = within(dialog).getByRole('button', { name: 'Agregar' });

    expect(textarea).toHaveFocus();

    await user.tab();
    expect(kindSelect).toHaveFocus();

    await user.tab();
    expect(descriptionInput).toHaveFocus();

    await user.tab();
    expect(prioritySelect).toHaveFocus();

    await user.tab();
    expect(dueDateInput).toHaveFocus();

    await user.tab();
    expect(dueTimeInput).toHaveFocus();

    await user.tab();
    expect(recurrenceSelect).toHaveFocus();

    await user.tab();
    expect(reminderSelect).toHaveFocus();

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

  test('creates and restores an automatic snapshot before deleting a todo', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'todo-snapshot', text: 'Conservar antes de borrar', completed: false },
    ]));
    renderApp();

    expect(await screen.findByText('Conservar antes de borrar')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar tarea' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Eliminar tarea' })).getByRole('button', { name: 'Eliminar' }));

    expect(screen.queryByText('Conservar antes de borrar')).not.toBeInTheDocument();

    await waitFor(() => {
      const snapshots = JSON.parse(localStorage.getItem('TODO_SNAPSHOTS_V1'));
      expect(snapshots[0].backup.todos[0].text).toBe('Conservar antes de borrar');
    });

    await openTools(user);

    expect(screen.getByRole('heading', { name: 'Copias automaticas' })).toBeInTheDocument();
    expect(screen.getByText('Antes de eliminar una tarea')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restaurar' }));

    expect(await screen.findByText('Conservar antes de borrar')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copia restaurada.');
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
