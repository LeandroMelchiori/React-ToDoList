import { expect, test } from '@playwright/test';

test('opens the orders screen and saves a new order offline before ever visiting it online', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('TaskFlow esta listo para usarse offline.')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const assets = await page.evaluate(async () => (await (await caches.open('taskflow-shell-v6')).keys()).map(request => request.url));
  expect(assets.some(url => /OrdersWorkspace.*\.js$/.test(url))).toBe(true);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo pedido', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo pedido' });
  await dialog.getByLabel('Cliente', { exact: true }).fill('Cliente offline');
  await dialog.getByLabel('Detalle 1', { exact: true }).fill('Arreglo de ropa');
  await dialog.getByRole('button', { name: 'Guardar pedido', exact: true }).click();
  await expect(page.getByText('Pedido guardado en este navegador.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cliente offline', exact: true })).toBeVisible();
});
