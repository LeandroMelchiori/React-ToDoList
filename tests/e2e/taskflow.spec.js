import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

async function openTools(page) {
  await page.getByRole('button', { name: /Herramientas/ }).click();
}

function getBoardSwitcher(page) {
  return page.getByRole('group', { name: 'Cambiar tablero' });
}

test('manages a todo through the production flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Organiza tu dia con una primera tarea')).toBeVisible();

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  const initialCreateDialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await expect(initialCreateDialog.getByRole('textbox', { name: 'Nueva tarea' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(initialCreateDialog).not.toBeVisible();

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('Escribe una tarea antes de agregarla.')).toBeVisible();

  const createDialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await createDialog.getByRole('textbox', { name: 'Nueva tarea' }).fill('Preparar demo del proyecto');
  await createDialog.getByLabel('Descripcion').fill('Ensayar historia del producto y decisiones tecnicas');
  await createDialog.getByLabel('Prioridad').selectOption('high');
  await createDialog.getByLabel('Repeticion').selectOption('weekly');
  await createDialog.getByLabel('Fecha limite', { exact: true }).fill('2026-07-20');
  await createDialog.getByLabel('Proyecto').fill('TaskFlow');
  await createDialog.getByLabel('Etiquetas').fill('frontend, testing');
  await createDialog.getByRole('textbox', { name: 'Subtareas', exact: true }).fill('Revisar copy');
  await createDialog.getByRole('button', { name: 'Agregar subtarea' }).click();
  await createDialog.getByRole('textbox', { name: 'Subtareas', exact: true }).fill('Validar responsive');
  await createDialog.getByRole('button', { name: 'Agregar subtarea' }).click();
  await createDialog.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('Preparar demo del proyecto')).toBeVisible();
  await expect(page.getByText('Ensayar historia del producto y decisiones tecnicas')).toBeVisible();
  await expect(page.getByText('Alta', { exact: true })).toBeVisible();
  await expect(page.getByText('Semanal', { exact: true })).toBeVisible();
  await expect(page.getByText('Limite 20/07/2026')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por proyecto TaskFlow' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta frontend' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta testing' })).toBeVisible();
  await expect(page.getByLabel('Revisar copy')).toBeVisible();
  await expect(page.getByLabel('Validar responsive')).toBeVisible();

  await page.getByRole('button', { name: 'Calendario' }).click();
  await expect(page.getByRole('grid', { name: /Calendario/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Limite Semanal Preparar demo del proyecto/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Lista' }).click();

  await page.getByRole('button', { name: 'Filtrar por etiqueta frontend' }).click();
  await expect(page.getByRole('button', { name: 'Limpiar filtros' })).toBeVisible();
  await expect(page.getByText('Preparar demo del proyecto')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();

  await page.getByLabel('Revisar copy').check();
  await expect(page.getByLabel('Revisar copy')).toBeChecked();

  await page.getByLabel('Buscar tareas').fill('frontend');
  await expect(page.getByText('Preparar demo del proyecto')).toBeVisible();

  await page.getByRole('button', { name: 'Ver detalle' }).click();
  const detailDialog = page.getByRole('dialog', { name: 'Detalle del elemento' });
  await expect(detailDialog.getByText('Preparar demo del proyecto')).toBeVisible();
  await expect(detailDialog.getByText('Limite 20/07/2026')).toBeVisible();
  await detailDialog.getByRole('button', { name: 'Editar' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Editar tarea' });
  await expect(editDialog.getByRole('textbox', { name: 'Editar tarea' })).toHaveValue('Preparar demo del proyecto');
  await expect(editDialog.getByLabel('Descripcion')).toHaveValue('Ensayar historia del producto y decisiones tecnicas');
  await expect(editDialog.getByLabel('Repeticion')).toHaveValue('weekly');
  await expect(editDialog.getByLabel('Proyecto')).toHaveValue('TaskFlow');
  await expect(editDialog.getByLabel('Etiquetas')).toHaveValue('frontend, testing');
  await expect(editDialog.getByRole('list', { name: 'Subtareas agregadas' })).toContainText('Revisar copy');
  await expect(editDialog.getByRole('list', { name: 'Subtareas agregadas' })).toContainText('Validar responsive');

  await editDialog.getByRole('textbox', { name: 'Editar tarea' }).fill('Preparar demo publica');
  await editDialog.getByLabel('Etiquetas').fill('frontend, qa');
  await editDialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Preparar demo publica')).toBeVisible();
  await expect(page.getByText('Alta', { exact: true })).toBeVisible();
  await expect(page.getByText('Semanal', { exact: true })).toBeVisible();
  await expect(page.getByText('Limite 20/07/2026')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por proyecto TaskFlow' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta frontend' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta qa' })).toBeVisible();
  await expect(page.getByLabel('Buscar tareas')).toHaveValue('');

  await page.getByRole('button', { name: 'Marcar tarea como completada' }).click();
  await expect(page.getByText('Completaste todas tus tareas')).toBeVisible();

  await page.getByRole('button', { name: 'Eliminar tarea' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Eliminar tarea' });
  await expect(deleteDialog.getByText('Preparar demo publica')).toBeVisible();

  await deleteDialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Preparar demo publica')).toBeVisible();

  await page.getByRole('button', { name: 'Eliminar tarea' }).click();
  await page.getByRole('dialog', { name: 'Eliminar tarea' }).getByRole('button', { name: 'Eliminar' }).click();

  await expect(page.getByText('Organiza tu dia con una primera tarea')).toBeVisible();
});

test('exports current todos as a JSON backup', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Usar plantilla Plan semanal' }).click();
  await expect(page.getByText('Definir prioridades de la semana')).toBeVisible();

  await openTools(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup completo' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const backup = JSON.parse(await readFile(downloadPath, 'utf8'));

  expect(download.suggestedFilename()).toMatch(/^taskflow-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(backup).toEqual(expect.objectContaining({
    version: 1,
    kind: 'taskflow-workspace',
    exportedAt: expect.any(String),
    todos: [
      expect.objectContaining({
        text: 'Definir prioridades de la semana',
        project: 'Personal',
        tags: ['planificacion'],
      }),
    ],
    boards: [
      expect.objectContaining({
        name: 'Personal',
        todos: [expect.objectContaining({ text: 'Definir prioridades de la semana' })],
      }),
    ],
  }));
  await expect(page.getByText('Backup exportado.')).toBeVisible();
});

test('previews and merges imported todos without duplicates', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Usar plantilla Preparar entrevista' }).click();
  await expect(page.getByText('Preparar entrevista tecnica', { exact: true })).toBeVisible();

  await openTools(page);
  await page.getByLabel('Importar backup JSON').setInputFiles({
    name: 'taskflow-e2e.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      todos: [
        { id: 'todo-duplicate', text: 'Preparar entrevista tecnica', completed: false },
        {
          id: 'todo-imported-e2e',
          text: 'Importar backup desde E2E',
          completed: false,
          project: 'QA',
          tags: ['backup'],
        },
      ],
    })),
  });

  await expect(page.getByRole('region', { name: 'Previsualizacion de importacion' })).toBeVisible();
  await expect(page.getByText('taskflow-e2e.json: 2 tareas encontradas.')).toBeVisible();
  await expect(page.getByText('Al fusionar: 1 tarea agregada y 1 duplicada omitida.')).toBeVisible();

  await page.getByRole('button', { name: 'Fusionar sin duplicados' }).click();

  await expect(page.getByText('Importar backup desde E2E')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por proyecto QA' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta backup' })).toBeVisible();
  await expect(page.getByText('Preparar entrevista tecnica', { exact: true })).toHaveCount(1);
  await expect(page.getByText('1 tarea agregada. 1 duplicada omitida.')).toBeVisible();
});

test('restores a full workspace backup', async ({ page }) => {
  await page.goto('/');

  await openTools(page);
  await page.getByLabel('Importar backup JSON').setInputFiles({
    name: 'taskflow-workspace.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
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
    })),
  });

  await expect(page.getByText('taskflow-workspace.json: 2 tableros, 2 tareas y 1 filtro guardado.')).toBeVisible();
  await page.getByRole('button', { name: 'Restaurar backup' }).click();

  await expect(page.getByText('Preparar workspace')).toBeVisible();
  await expect(getBoardSwitcher(page).getByRole('button', { name: /Trabajo/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trabajo activo', exact: true })).toBeVisible();
  await expect(page.getByText('Backup restaurado: 2 tableros, 2 tareas y 1 filtro guardado.')).toBeVisible();

  await expect.poll(async () => page.evaluate(() => ({
    activeBoardId: JSON.parse(localStorage.getItem('ACTIVE_TODO_BOARD_V1') || 'null'),
    boardNames: JSON.parse(localStorage.getItem('TODO_BOARDS_V1') || '[]').map(board => board.name),
    savedViewNames: JSON.parse(localStorage.getItem('TODO_SAVED_VIEWS_V1') || '[]').map(view => view.name),
  }))).toEqual({
    activeBoardId: 'work',
    boardNames: ['Personal', 'Trabajo'],
    savedViewNames: ['Trabajo activo'],
  });
});

test('keeps local boards and saved views in the production flow', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  let dialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await dialog.getByRole('textbox', { name: 'Nueva tarea' }).fill('Plan personal');
  await dialog.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('Plan personal')).toBeVisible();

  await openTools(page);
  const createBoardForm = page.getByRole('form', { name: 'Crear tablero' });
  await createBoardForm.getByLabel('Nombre del tablero', { exact: true }).fill('Talleres');
  await createBoardForm.getByRole('button', { name: 'Crear' }).click();
  await expect(page.getByText('Todavia no hay tareas')).toBeVisible();
  await expect(page.getByText('Plan personal')).not.toBeVisible();

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  dialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await dialog.getByRole('textbox', { name: 'Nueva tarea' }).fill('Preparar taller');
  await dialog.getByLabel('Proyecto').fill('Talleres');
  await dialog.getByLabel('Etiquetas').fill('formacion');
  await dialog.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('Preparar taller')).toBeVisible();

  await page.getByLabel('Nombre del tablero actual').fill('Capacitaciones');
  await page.getByRole('button', { name: 'Renombrar' }).click();
  await expect(page.getByText('Tablero actualizado.')).toBeVisible();
  await expect(getBoardSwitcher(page).getByRole('button', { name: /Capacitaciones/ })).toBeVisible();

  await page.getByLabel('Buscar tareas').fill('taller');
  await page.getByRole('button', { name: 'Filtrar por etiqueta formacion' }).click();
  await page.getByLabel('Nombre para estos filtros').fill('Taller activo');
  await page.getByRole('button', { name: 'Guardar filtros' }).click();
  await expect(page.getByText('Filtros guardados.')).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.getByLabel('Buscar tareas').fill('');
  await getBoardSwitcher(page).getByRole('button', { name: /Personal/ }).click();
  await expect(page.getByText('Plan personal')).toBeVisible();
  await expect(page.getByText('Preparar taller')).not.toBeVisible();

  await getBoardSwitcher(page).getByRole('button', { name: /Capacitaciones/ }).click();
  await page.getByLabel('Buscar tareas').fill('sin coincidencias');
  await expect(page.getByText('No hay tareas que coincidan con tu busqueda.')).toBeVisible();

  await page.getByRole('button', { name: 'Taller activo', exact: true }).click();
  await expect(page.getByText('Preparar taller')).toBeVisible();
  await expect(page.getByText('Plan personal')).not.toBeVisible();

  const localData = await page.evaluate(() => ({
    boards: JSON.parse(localStorage.getItem('TODO_BOARDS_V1')),
    views: JSON.parse(localStorage.getItem('TODO_SAVED_VIEWS_V1')),
  }));

  expect(localData.boards).toEqual([
    expect.objectContaining({
      name: 'Personal',
      todos: [expect.objectContaining({ text: 'Plan personal' })],
    }),
    expect.objectContaining({
      name: 'Capacitaciones',
      todos: [expect.objectContaining({ text: 'Preparar taller' })],
    }),
  ]);
  expect(localData.views).toEqual([
    expect.objectContaining({
      name: 'Taller activo',
      searchValue: 'taller',
      tag: 'formacion',
    }),
  ]);

  await page.getByRole('button', { name: 'Eliminar tablero Capacitaciones' }).click();
  await page.getByRole('button', { name: 'Confirmar eliminacion' }).click();
  await expect(page.getByText('Plan personal')).toBeVisible();
  await expect(page.getByText('Preparar taller')).not.toBeVisible();

  await expect.poll(async () => page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('TODO_BOARDS_V1') || '[]');

    return boards.map(board => ({
      name: board.name,
      todos: board.todos.map(todo => todo.text),
    }));
  })).toEqual([
    {
      name: 'Personal',
      todos: ['Plan personal'],
    },
  ]);
});
