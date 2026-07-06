import { expect, test } from '@playwright/test';

test('manages a todo through the production flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Organiza tu dia con una primera tarea')).toBeVisible();

  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Escribe una tarea antes de agregarla.')).toBeVisible();

  const createDialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await createDialog.getByRole('textbox', { name: 'Nueva tarea' }).fill('Preparar demo para recruiter');
  await createDialog.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Preparar demo para recruiter')).toBeVisible();

  await page.getByLabel('Buscar tareas').fill('recruiter');
  await expect(page.getByText('Preparar demo para recruiter')).toBeVisible();

  await page.getByRole('button', { name: 'Editar tarea' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Editar tarea' });
  await expect(editDialog.getByRole('textbox', { name: 'Editar tarea' })).toHaveValue('Preparar demo para recruiter');

  await editDialog.getByRole('textbox', { name: 'Editar tarea' }).fill('Preparar demo publica');
  await editDialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Preparar demo publica')).toBeVisible();
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
