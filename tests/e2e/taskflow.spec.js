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
