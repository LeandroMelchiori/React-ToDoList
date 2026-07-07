import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('manages a todo through the production flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Organiza tu dia con una primera tarea')).toBeVisible();

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  const initialCreateDialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await expect(initialCreateDialog.getByRole('textbox', { name: 'Nueva tarea' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(initialCreateDialog).not.toBeVisible();

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Escribe una tarea antes de agregarla.')).toBeVisible();

  const createDialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await createDialog.getByRole('textbox', { name: 'Nueva tarea' }).fill('Preparar demo del proyecto');
  await createDialog.getByLabel('Prioridad').selectOption('high');
  await createDialog.getByLabel('Fecha limite').fill('2026-07-20');
  await createDialog.getByLabel('Proyecto').fill('TaskFlow');
  await createDialog.getByLabel('Etiquetas').fill('frontend, testing');
  await createDialog.getByLabel('Subtareas').fill('Revisar copy\nValidar responsive');
  await createDialog.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Preparar demo del proyecto')).toBeVisible();
  await expect(page.getByText('Alta', { exact: true })).toBeVisible();
  await expect(page.getByText('20/07/2026')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por proyecto TaskFlow' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta frontend' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por etiqueta testing' })).toBeVisible();
  await expect(page.getByLabel('Revisar copy')).toBeVisible();
  await expect(page.getByLabel('Validar responsive')).toBeVisible();

  await page.getByRole('button', { name: 'Filtrar por etiqueta frontend' }).click();
  await expect(page.getByRole('button', { name: 'Limpiar filtros' })).toBeVisible();
  await expect(page.getByText('Preparar demo del proyecto')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();

  await page.getByLabel('Revisar copy').check();
  await expect(page.getByLabel('Revisar copy')).toBeChecked();

  await page.getByLabel('Buscar tareas').fill('frontend');
  await expect(page.getByText('Preparar demo del proyecto')).toBeVisible();

  await page.getByRole('button', { name: 'Editar tarea' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Editar tarea' });
  await expect(editDialog.getByRole('textbox', { name: 'Editar tarea' })).toHaveValue('Preparar demo del proyecto');
  await expect(editDialog.getByLabel('Proyecto')).toHaveValue('TaskFlow');
  await expect(editDialog.getByLabel('Etiquetas')).toHaveValue('frontend, testing');
  await expect(editDialog.getByLabel('Subtareas')).toHaveValue('Revisar copy\nValidar responsive');

  await editDialog.getByRole('textbox', { name: 'Editar tarea' }).fill('Preparar demo publica');
  await editDialog.getByLabel('Etiquetas').fill('frontend, qa');
  await editDialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Preparar demo publica')).toBeVisible();
  await expect(page.getByText('Alta', { exact: true })).toBeVisible();
  await expect(page.getByText('20/07/2026')).toBeVisible();
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

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar tareas' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const backup = JSON.parse(await readFile(downloadPath, 'utf8'));

  expect(download.suggestedFilename()).toMatch(/^taskflow-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(backup).toEqual(expect.objectContaining({
    version: 1,
    exportedAt: expect.any(String),
    todos: [
      expect.objectContaining({
        text: 'Definir prioridades de la semana',
        project: 'Personal',
        tags: ['planificacion'],
      }),
    ],
  }));
  await expect(page.getByText('Backup exportado.')).toBeVisible();
});

test('previews and merges imported todos without duplicates', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Usar plantilla Preparar entrevista' }).click();
  await expect(page.getByText('Preparar entrevista tecnica', { exact: true })).toBeVisible();

  await page.getByLabel('Importar tareas desde JSON').setInputFiles({
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
