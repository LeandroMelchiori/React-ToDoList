import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.use({ serviceWorkers: 'block', timezoneId: 'America/Argentina/Buenos_Aires' });
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00-03:00') });
  await page.addInitScript(() => {
    localStorage.setItem('THEME_V1', 'light');
    if (!localStorage.getItem('TODOS_V1')) localStorage.setItem('TODOS_V1', JSON.stringify([{ id: 'own-task', text: 'Actividad propia', kind: 'task' }]));
  });
});
async function openOrders(page) {
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeFocused();
}
async function createOrder(page) {
  await openOrders(page);
  await page.getByRole('button', { name: 'Nuevo pedido', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo pedido' });
  await expect(dialog.getByLabel('Cliente', { exact: true })).toBeFocused();
  await dialog.getByLabel('Cliente', { exact: true }).fill('María');
  await dialog.getByLabel('Contacto (opcional)', { exact: true }).fill('555-privado');
  await dialog.getByLabel('Detalle 1', { exact: true }).fill('Torta de chocolate');
  await dialog.getByLabel('Cantidad 1', { exact: true }).fill('2');
  await dialog.getByLabel('Fecha de entrega o retiro', { exact: true }).fill('2026-10-16');
  await dialog.getByLabel('Hora de entrega (opcional)', { exact: true }).fill('18:00');
  await expect(dialog.getByText('Reservar tiempo de preparación', { exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel('Estado del pedido', { exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel('Observaciones (opcional)', { exact: true })).toHaveCount(0);
  await dialog.getByText('Importe y cobro', { exact: true }).click();
  await dialog.getByLabel('Importe total', { exact: true }).fill('10000');
  await dialog.getByLabel('Importe cobrado', { exact: true }).fill('2500');
  await dialog.getByRole('button', { name: 'Guardar pedido', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Pedido guardado en este navegador.')).toBeVisible();
}
async function checkA11y(page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
}

test('takes a manual order, links its agenda and keeps payment and task metrics separate', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await createOrder(page);
  await expect(page.getByText(/Señado/)).toBeVisible();
  await checkA11y(page);
  await page.screenshot({ path: info.outputPath('orders-desktop-light.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Ver en agenda' }).click();
  await expect(page.getByRole('button', { name: /Entrega · María/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Preparar · María/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Entrega · María/ }).first().click();
  const editor = page.getByRole('dialog', { name: 'Editar pedido' });
  await expect(editor.getByLabel('Cliente', { exact: true })).toHaveValue('María');
  await editor.getByLabel('Fecha de entrega o retiro', { exact: true }).fill('2026-10-20');
  await editor.getByRole('button', { name: 'Guardar pedido', exact: true }).click();
  await expect(page.getByText('Pedido actualizado.')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ORDERS_V1')).orders);
  expect(stored[0].deliveryDate).toBe('2026-10-20');
  expect(stored[0].paidCents).toBe(250000);
  expect(stored[0].preparation).toBeNull();
  expect(stored[0].notes).toBe('');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).map(item => item.text))).toEqual(['Actividad propia']);
  await page.reload();
  await openOrders(page);
  await expect(page.getByText(/20\/10\/2026/)).toBeVisible();
  await page.getByLabel('Estado de María', { exact: true }).selectOption('delivered');
  await expect(page.getByText('Estado del pedido actualizado.')).toBeVisible();
  await page.getByLabel('Filtrar pedidos').selectOption('all');
  await expect(page.locator('.Orders-badge--delivered')).toHaveText('Entregado');
  await expect(page.getByText(/Señado/)).toBeVisible();
  await page.getByRole('button', { name: 'Planificación', exact: true }).click();
  await expect(page.getByRole('button', { name: /Entrega · María|Preparar · María/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tareas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Completaste 0 de 1 tareas' })).toBeVisible();
});

test('validates drafts and supports mobile keyboard, theme and deletion confirmation', async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await openOrders(page);
  await page.getByRole('button', { name: 'Nuevo pedido', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo pedido' });
  await dialog.getByRole('button', { name: 'Guardar pedido', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeFocused();
  await expect(dialog.getByRole('alert')).toContainText('cliente');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Nuevo pedido', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Planificación', exact: true }).click();
  await createOrder(page);
  await checkA11y(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath('orders-mobile-light.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await checkA11y(page);
  await page.getByRole('button', { name: 'Editar pedido de María', exact: true }).click();
  await checkA11y(page);
  await page.screenshot({ path: info.outputPath('orders-form-mobile-dark.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Eliminar pedido de María', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Eliminar pedido' });
  await confirmation.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('heading', { name: 'María', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar pedido de María', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Eliminar pedido', exact: true }).click();
  await expect(page.getByText('Todavía no hay pedidos')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ORDERS_V1')).orders)).toEqual([]);
});

test('backs up orders and calendar together, rejects invalid orders and does not duplicate linked ICS events', async ({ page, browser }) => {
  await page.goto('/');
  await createOrder(page);
  await page.getByText('Exportar / importar', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup completo' }).click();
  const backup = JSON.parse(await readFile(await (await downloadPromise).path(), 'utf8'));
  expect(backup.version).toBe(2);
  expect(backup.orders).toHaveLength(1);
  expect(backup.todos).toHaveLength(1);
  const icsDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar calendario ICS' }).click();
  const ics = await readFile(await (await icsDownload).path(), 'utf8');
  expect(ics).toContain('Entrega');
  expect(ics).not.toContain('555-privado');
  await page.getByLabel('Importar calendario ICS').setInputFiles({ name: 'agenda.ics', mimeType: 'text/calendar', buffer: Buffer.from(ics) });
  await expect(page.getByRole('region', { name: 'Previsualizacion de importacion' })).toContainText('1 duplicada omitida');
  await page.getByRole('button', { name: 'Importar calendario', exact: true }).click();
  await expect(page.getByText('No se agregaron elementos nuevos.')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')).length)).toBe(1);

  const context = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const fresh = await context.newPage();
    await fresh.goto('/');
    await fresh.getByRole('button', { name: 'Exportar / importar', exact: true }).click();
    const invalid = { ...backup, orders: [{ ...backup.orders[0], items: [] }] };
    await fresh.getByLabel('Importar backup JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await expect(fresh.getByText(/pedidos inválidos/)).toBeVisible();
    expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1') || '[]'))).toEqual([]);
    await fresh.getByLabel('Importar backup JSON').setInputFiles({ name: 'pedidos.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await expect(fresh.getByRole('region', { name: 'Previsualizacion de importacion' })).toContainText('Pedidos incluidos: 1');
    await fresh.getByRole('button', { name: 'Restaurar backup', exact: true }).click();
    await expect(fresh.getByText(/Pedidos restaurados: 1/)).toBeVisible();
    await openOrders(fresh);
    await expect(fresh.getByRole('heading', { name: 'María', exact: true })).toBeVisible();
    await fresh.getByText('Exportar / importar', { exact: true }).click();
    await fresh.getByLabel('Importar backup JSON').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, kind: 'taskflow-workspace', todos: [], boards: [], savedViews: [] })) });
    await expect(fresh.getByRole('region', { name: 'Previsualizacion de importacion' })).toContainText('Tus pedidos actuales se conservan');
    await fresh.getByRole('button', { name: 'Restaurar backup', exact: true }).click();
    await expect(fresh.getByRole('heading', { name: 'María', exact: true })).toBeVisible();
    expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('ORDERS_V1')).orders)).toEqual(backup.orders);
  } finally { await context.close(); }
});
