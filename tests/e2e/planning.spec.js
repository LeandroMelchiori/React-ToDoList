import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.use({ serviceWorkers: 'block', timezoneId: 'America/Argentina/Buenos_Aires' });

async function checkAccessibility(page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
}

const todos = [
  { id: 'work', text: 'Trabajo', project: 'Trabajo', kind: 'schedule', startDate: '2026-10-01', endDate: '2026-12-31',
    startTime: '09:00', endTime: '17:00', recurrence: 'weekly', recurrenceDays: [1, 2, 3, 4, 5] },
  { id: 'class', text: 'Clase de programación', project: 'Estudio', kind: 'schedule', startDate: '2026-10-01', endDate: '2026-12-18',
    startTime: '18:00', endTime: '20:00', recurrence: 'weekly', recurrenceDays: [1, 3, 5] },
  { id: 'exam', text: 'Examen parcial', project: 'Estudio', kind: 'event', startDate: '2026-10-14', startTime: '19:00' },
  { id: 'task', text: 'Actualizar portfolio', project: 'Personal', kind: 'task', description: 'Conservar mis notas',
    priority: 'high', tags: ['personal'], subtasks: [{ id: 'sub', text: 'Elegir trabajos', completed: true }] },
  { id: 'read', text: 'Leer apuntes', kind: 'task' },
];

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-09T12:00:00-03:00') });
  await page.addInitScript(() => {
    if (!localStorage.getItem('UX_FIXTURE')) {
      localStorage.setItem('UX_FIXTURE', 'ready');
      localStorage.setItem('THEME_V1', 'light');
    }
  });
  await page.addInitScript(items => {
    if (!localStorage.getItem('TODOS_V1')) localStorage.setItem('TODOS_V1', JSON.stringify(items));
  }, todos);
});

test('uses a daily timeline, current time and real event duration', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Hoy' }).click();
  const grid = page.getByRole('grid', { name: /Agenda diaria/ });
  await expect(grid.getByRole('columnheader')).toHaveCount(2);
  await expect(grid.getByRole('button', { name: /09:00 a 17:00 Horario Semanal Trabajo/ })).toHaveCSS('background-color', 'rgb(224, 242, 254)');
  await expect(grid.getByRole('button', { name: /18:00 a 20:00 Horario Semanal Clase de programación/ })).toHaveCSS('background-color', 'rgb(237, 233, 254)');
  await expect(page.getByRole('img', { name: 'Hora actual 12:00' })).toBeVisible();
  const scroller = page.locator('.TodoWeekCalendar-scroller');
  expect(await scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await scroller.evaluate(element => { element.scrollTop = 0; });
  await page.clock.fastForward(60_000);
  await expect(page.getByRole('img', { name: 'Hora actual 12:01' })).toBeVisible();
  expect(await scroller.evaluate(element => element.scrollTop)).toBe(0);
  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await dialog.getByLabel('Nueva tarea', { exact: true }).fill('Taller nocturno');
  await dialog.getByText('Evento', { exact: true }).click();
  await dialog.getByLabel('Dia del evento', { exact: true }).fill('2026-10-09');
  await dialog.getByLabel('Hora del evento', { exact: true }).fill('21:00');
  await dialog.getByLabel('Fin del evento', { exact: true }).fill('20:00');
  await dialog.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(dialog).toContainText('La hora de fin debe ser posterior al inicio.');
  await dialog.getByLabel('Fin del evento', { exact: true }).fill('22:30');
  await dialog.getByLabel('Proyecto', { exact: true }).fill('Estudio');
  await dialog.getByRole('button', { name: 'Agregar', exact: true }).click();
  const event = grid.getByRole('button', { name: /21:00 a 22:30 Evento Taller nocturno/ });
  await expect(event).toHaveAttribute('data-category', 'study');
  expect((await event.boundingBox()).height).toBeCloseTo(79.5, 0);
  await event.scrollIntoViewIfNeeded();
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-daily-desktop.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await expect(grid.getByRole('button', { name: /09:00 a 17:00 Horario Semanal Trabajo/ })).toHaveCSS('background-color', 'rgb(18, 50, 71)');
  await expect(grid.getByRole('button', { name: /18:00 a 20:00 Horario Semanal Clase de programación/ })).toHaveCSS('background-color', 'rgb(48, 35, 74)');
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-daily-desktop-dark.png'), animations: 'disabled' });
});

test('keeps overdue tasks visible when filtering the calendar', async ({ page }) => {
  await page.addInitScript(items => localStorage.setItem('TODOS_V1', JSON.stringify([...items,
    { id: 'late', text: 'Entregar informe', kind: 'task', dueDate: '2026-10-08', project: 'Trabajo' },
  ])), todos);
  await page.goto('/');
  const tray = page.getByRole('complementary', { name: 'Tareas vencidas' });
  await expect(tray).toContainText('Vencidas (1)');
  await page.getByText('Buscar y filtrar', { exact: true }).click();
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await page.getByRole('group', { name: 'Filtrar tareas' }).getByRole('button', { name: /^Eventos/ }).click();
  await expect(tray).toBeVisible();
  await tray.locator('summary').click();
  await expect(tray.getByRole('button', { name: /Entregar informe/ }).first()).toBeVisible();
  await tray.getByRole('checkbox', { name: 'Completar vencida Entregar informe' }).click();
  await expect(tray).not.toBeVisible();
});

test('changes a task block with buttons, changes its duration and undoes it', async ({ page }) => {
  await page.addInitScript(items => localStorage.setItem('TODOS_V1', JSON.stringify(items.map(todo => todo.id === 'task'
    ? { ...todo, timeBlocks: [{ id: 'existing', date: '2026-10-09', startTime: '20:00', endTime: '21:00' }] } : todo))), todos);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Hoy' }).click();
  const grid = page.getByRole('grid', { name: /Agenda diaria/ });
  await grid.getByRole('button', { name: /20:00 a 21:00 Trabajo Actualizar portfolio/ }).click();
  await page.getByRole('button', { name: 'Cambiar horario del bloque 20:00 a 21:00' }).click();
  const editor = page.getByRole('dialog', { name: 'Cambiar horario' });
  await expect(editor.getByLabel('Inicio', { exact: true })).toHaveValue('20:00');
  await editor.getByLabel('Fecha', { exact: true }).fill('2026-10-10');
  await editor.getByLabel('Inicio', { exact: true }).fill('18:00');
  await editor.getByLabel('Fin', { exact: true }).fill('19:30');
  await editor.getByRole('button', { name: 'Guardar horario' }).click();
  const storedBlock = () => page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).find(todo => todo.id === 'task')?.timeBlocks);
  await expect.poll(storedBlock).toMatchObject([{ id: 'existing', date: '2026-10-10', startTime: '18:00', endTime: '19:30' }]);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(storedBlock).toMatchObject([{ id: 'existing', date: '2026-10-09', startTime: '20:00', endTime: '21:00' }]);
  const source = grid.getByRole('button', { name: /20:00 a 21:00 Trabajo Actualizar portfolio/ });
  const target = grid.getByRole('gridcell', { name: 'Vie 09/10 21:00', exact: true });
  await target.scrollIntoViewIfNeeded();
  await source.dragTo(target);
  await expect(editor.getByLabel('Inicio', { exact: true })).toHaveValue('21:00');
  await expect(editor.getByLabel('Fin', { exact: true })).toHaveValue('22:00');
  await page.keyboard.press('Escape');
  await expect(source).toBeVisible();
});

test('reschedules one class and undoes the occurrence exception', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Hoy' }).click();
  const grid = page.getByRole('grid', { name: /Agenda diaria/ });
  const scheduledClass = grid.getByRole('button', { name: /18:00 a 20:00 Horario Semanal Clase de programación/ });
  await scheduledClass.click();
  await page.getByRole('button', { name: 'Cambiar horario', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Cambiar horario' });
  await expect(editor).toContainText('Solo se modifica el 09/10/2026');
  await editor.getByLabel('Fecha', { exact: true }).fill('2026-10-10');
  await editor.getByLabel('Inicio', { exact: true }).fill('14:00');
  await editor.getByLabel('Fin', { exact: true }).fill('16:30');
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-reschedule-mobile.png'), animations: 'disabled' });
  await editor.getByRole('button', { name: 'Guardar horario' }).click();
  const series = () => page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).find(todo => todo.id === 'class'));
  await expect.poll(series).toMatchObject({ recurrenceDays: [1, 3, 5], excludedOccurrences: ['2026-10-09'], startTime: '18:00', endTime: '20:00' });
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(series).toMatchObject({ excludedOccurrences: [] });
  await expect(scheduledClass).toBeVisible();
});

test('opens planning and reserves time without changing the task', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planificación', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Semana' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('grid').getByRole('columnheader')).toHaveCount(8);
  await expect(page.getByLabel('Agregar rapido')).not.toBeVisible();
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-desktop-light.png'), animations: 'disabled' });

  await page.getByRole('button', { name: 'Programar Actualizar portfolio' }).click();
  const dialog = page.getByRole('dialog', { name: 'Programar tarea' });
  await checkAccessibility(page);
  await dialog.getByLabel('Fecha', { exact: true }).fill('2026-10-09');
  await dialog.getByLabel('Inicio', { exact: true }).fill('20:00');
  await dialog.getByLabel('Fin', { exact: true }).fill('21:00');
  await dialog.getByRole('button', { name: 'Reservar bloque' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: /20:00 a 21:00 Trabajo Actualizar portfolio/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    task: JSON.parse(localStorage.getItem('TODOS_V1')).find(item => item.id === 'task')?.timeBlocks,
    board: JSON.parse(localStorage.getItem('TODO_BOARDS_V1') || '[]')
      .flatMap(board => board.todos).find(item => item.id === 'task')?.timeBlocks,
  }))).toMatchObject({
    task: [{ date: '2026-10-09', startTime: '20:00', endTime: '21:00' }],
    board: [{ date: '2026-10-09', startTime: '20:00', endTime: '21:00' }],
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /20:00 a 21:00 Trabajo Actualizar portfolio/ })).toBeVisible();
  const task = await page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).find(item => item.id === 'task'));
  expect(task).toMatchObject({ completed: false, description: 'Conservar mis notas', priority: 'high', tags: ['personal'],
    subtasks: [{ id: 'sub', text: 'Elegir trabajos', completed: true }],
    timeBlocks: [{ date: '2026-10-09', startTime: '20:00', endTime: '21:00' }] });
  await page.getByRole('checkbox', { name: 'Completar Leer apuntes' }).click();
  await expect(page.getByRole('checkbox', { name: 'Completar Leer apuntes' })).not.toBeVisible();
});

test('offers a daily grid and a separate task tray on mobile in both themes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('group', { name: 'Elegir dia' })).toBeVisible();
  await expect(page.getByRole('grid').getByRole('columnheader')).toHaveCount(2);
  await page.getByRole('button', { name: 'Lun 05/10' }).click();
  await expect(page.getByRole('button', { name: 'Lun 05/10' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Crear bloque el 2026-10-05 a las 08:00' })).toBeVisible();
  const overflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    grid: document.querySelector('.TodoWeekCalendar-scroller').scrollWidth > document.querySelector('.TodoWeekCalendar-scroller').clientWidth,
  }));
  expect(overflow).toEqual({ page: false, grid: false });
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-mobile-light.png'), animations: 'disabled' });
  await page.getByRole('button', { name: /Sin fecha \(2\)/ }).click();
  await page.getByRole('button', { name: 'Programar Actualizar portfolio' }).click();
  const dialog = page.getByRole('dialog', { name: 'Programar tarea' });
  await dialog.getByLabel('Fecha', { exact: true }).fill('2026-10-09');
  await dialog.getByLabel('Inicio', { exact: true }).fill('10:00');
  await dialog.getByLabel('Fin', { exact: true }).fill('11:00');
  await dialog.getByRole('button', { name: 'Reservar bloque' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Trabajo');
  await dialog.getByRole('checkbox', { name: 'Reservar de todos modos' }).check();
  await dialog.getByRole('button', { name: 'Reservar bloque' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-mobile-dark.png'), animations: 'disabled' });
});

test('creates a class with weekdays and a term end outside advanced options', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await dialog.getByLabel('Nueva tarea', { exact: true }).fill('Cursada de álgebra');
  await dialog.getByText('Horario', { exact: true }).click();
  await dialog.getByLabel('Primer dia', { exact: true }).fill('2026-10-05');
  await dialog.getByLabel('Ultimo dia', { exact: true }).fill('2026-11-27');
  await dialog.getByLabel('Hora de inicio', { exact: true }).fill('21:00');
  await dialog.getByLabel('Hora de fin', { exact: true }).fill('22:00');
  await expect(dialog.getByLabel('Repeticion')).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Mar', exact: true }).check();
  await dialog.getByRole('checkbox', { name: 'Jue', exact: true }).check();
  await dialog.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).find(todo => todo.text === 'Cursada de álgebra')))
    .toMatchObject({ kind: 'schedule', startDate: '2026-10-05', endDate: '2026-11-27', recurrence: 'weekly', recurrenceDays: [2, 4] });
});

test('drags a task into a three-day slot with cancellation and persistence', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('tab', { name: '3 días' }).click();
  const grid = page.getByRole('grid', { name: /Agenda de tres días/ });
  await expect(grid.getByRole('columnheader')).toHaveCount(4);
  await expect(grid.getByRole('columnheader', { name: 'Vie 09/10' })).toBeVisible();
  await page.getByRole('button', { name: 'Tres días siguientes' }).click();
  await expect(grid.getByRole('columnheader', { name: 'Mier 14/10' })).toBeVisible();
  const source = page.getByRole('button', { name: 'Actualizar portfolio Sin fecha asignada' });
  const target = grid.getByRole('gridcell', { name: 'Mar 13/10 20:00', exact: true });
  await target.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('planning-three-days-desktop.png'), animations: 'disabled' });
  await source.dragTo(target);
  const dialog = page.getByRole('dialog', { name: 'Programar tarea' });
  await expect(dialog.getByLabel('Fecha', { exact: true })).toHaveValue('2026-10-13');
  await expect(dialog.getByLabel('Inicio', { exact: true })).toHaveValue('20:00');
  await expect(dialog.getByLabel('Fin', { exact: true })).toHaveValue('21:00');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(source).toBeVisible();
  await source.dragTo(target);
  await dialog.getByRole('button', { name: 'Reservar bloque' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('TODO_BOARDS_V1') || '[]')
    .flatMap(board => board.todos).find(todo => todo.id === 'task')?.timeBlocks))
    .toMatchObject([{ date: '2026-10-13', startTime: '20:00', endTime: '21:00' }]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Programar Actualizar portfolio' })).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).find(todo => todo.id === 'task')?.timeBlocks))
    .toMatchObject([{ date: '2026-10-13', startTime: '20:00', endTime: '21:00' }]);
});

test('shows three days on a small phone and keeps period creation in more types', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('tab', { name: '3 días' }).click();
  const grid = page.getByRole('grid', { name: /Agenda de tres días/ });
  await expect(grid.getByRole('columnheader')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(await grid.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
  await checkAccessibility(page);
  await page.screenshot({ path: testInfo.outputPath('planning-three-days-mobile.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await expect(dialog.getByRole('radio')).toHaveCount(3);
  await expect(dialog.getByRole('radio', { name: /Periodo/ })).not.toBeVisible();
  await dialog.getByText('Más tipos', { exact: true }).click();
  await dialog.getByText('Periodo', { exact: true }).click();
  await expect(dialog.getByLabel('Inicio del periodo')).toBeVisible();
  await checkAccessibility(page);
});
