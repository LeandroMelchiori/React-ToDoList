import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.use({ serviceWorkers: 'block' });

test('keeps an empty workspace compact and aligned at desktop, zoom-sized and mobile widths', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('THEME_V1', 'light');
    localStorage.setItem('TODO_SETTINGS_V2', JSON.stringify({ defaultView: 'list' }));
  });
  await page.goto('/');
  await expect(page.getByText('Todavia no hay tareas')).toBeVisible();
  await expect(page.getByRole('button', { name: /Usar plantilla/ })).toHaveCount(0);

  for (const width of [1440, 960, 768, 640, 480, 375]) {
    await page.setViewportSize({ width, height: width === 640 ? 360 : 800 });
    await page.locator('.App-searchTools > summary').click();
    const alignment = await page.evaluate(() => {
      const x = selector => document.querySelector(selector).getBoundingClientRect().left;
      return { title: x('#app-title'), context: x('.App-boardContext'), search: x('.TodoSearch-label'),
        titleRight: document.querySelector('#app-title').getBoundingClientRect().right,
        themeLeft: x('.ThemeToggle') };
    });
    expect(alignment.title).toBeCloseTo(alignment.context, 0);
    expect(alignment.title).toBeCloseTo(alignment.search, 0);
    expect(alignment.titleRight).toBeLessThan(alignment.themeLeft);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Exportar / importar', exact: true })).toBeVisible();
    await page.locator('.App-searchTools > summary').click();
  }
  await page.getByRole('button', { name: 'Planificación', exact: true }).click();
  await expect(page.locator('.TodoAgenda')).toBeVisible();
  await expect(page.locator('.EmptyTodo-container')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('local-empty-mobile.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('local-empty-desktop.png'), animations: 'disabled' });
});

test('keeps long drawer forms on an opaque surface without scrolling the background', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear tarea' });
  await dialog.getByLabel('Nueva tarea', { exact: true }).fill('Horario de estudio');
  await dialog.getByText('Horario', { exact: true }).click();
  await dialog.getByLabel('Repeticion', { exact: true }).selectOption('yearly');
  await dialog.getByText('Mas opciones', { exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    for (const viewport of [{ width: 1440, height: 720 }, { width: 768, height: 500 }, { width: 375, height: 667 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await dialog.locator('.TodoForm-preview').scrollIntoViewIfNeeded();
      const geometry = await dialog.evaluate(element => {
        const form = element.querySelector('.TodoForm');
        const preview = element.querySelector('.TodoForm-preview');
        return {
          formBottom: form.getBoundingClientRect().bottom,
          previewBottom: preview.getBoundingClientRect().bottom,
          overflow: element.scrollWidth > element.clientWidth,
          scrollTop: element.scrollTop,
          surface: getComputedStyle(element).backgroundColor,
          formSurface: getComputedStyle(form).backgroundColor,
        };
      });
      expect(geometry.formBottom).toBeGreaterThanOrEqual(geometry.previewBottom);
      expect(geometry.overflow).toBe(false);
      expect(geometry.scrollTop).toBeGreaterThan(0);
      expect(geometry.surface).toBe(geometry.formSurface);
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await page.mouse.move(10, 10);
      await page.mouse.wheel(0, 400);
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
      await page.screenshot({ path: testInfo.outputPath(`local-form-${theme}-${viewport.width}.png`), animations: 'disabled' });
    }
    const accessibility = await new AxeBuilder({ page }).include('.ModalContent').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(accessibility.violations.map(item => item.id)).toEqual([]);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.getByRole('button', { name: 'Crear nueva tarea' })).toBeFocused();
});

test('exports and restores a local agenda from the direct data action', async ({ page, browser }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('TODOS_V1', JSON.stringify([
      { id: 'class', kind: 'schedule', text: 'Clases de programación', startDate: '2026-10-01', endDate: '2026-12-18',
        startTime: '18:00', endTime: '20:00', recurrence: 'weekly', recurrenceDays: [1, 3, 5] },
      { id: 'task', kind: 'task', text: 'Revisar propuesta', tags: ['cliente'], subtasks: [{ id: 'sub', text: 'Revisar costos', completed: true }] },
    ]));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Exportar / importar', exact: true }).click();
  await expect(page.getByLabel('Importar backup JSON')).toBeAttached();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup completo' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(backup.todos).toEqual(expect.arrayContaining([
    expect.objectContaining({ text: 'Clases de programación', endTime: '20:00', recurrenceDays: [1, 3, 5] }),
    expect.objectContaining({ text: 'Revisar propuesta', tags: ['cliente'], subtasks: [expect.objectContaining({ completed: true })] }),
  ]));
  await page.screenshot({ path: testInfo.outputPath('local-data-desktop.png'), animations: 'disabled' });

  const cleanContext = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 375, height: 812 } });
  try {
    const cleanPage = await cleanContext.newPage();
    await cleanPage.goto('/');
    await cleanPage.getByRole('button', { name: 'Exportar / importar', exact: true }).click();
    await cleanPage.getByLabel('Importar backup JSON').setInputFiles({ name: 'mi-agenda.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    const preview = cleanPage.getByRole('region', { name: 'Previsualizacion de importacion' });
    await expect(preview).toContainText('mi-agenda.json');
    await expect(preview).toBeFocused();
    await expect(preview.getByRole('button', { name: 'Restaurar backup' })).toBeInViewport();
    await expect(cleanPage.getByRole('button', { name: 'Cerrar opciones' })).toBeInViewport();
    expect(await cleanPage.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1') || '[]').length)).toBe(0);
    await cleanPage.screenshot({ path: testInfo.outputPath('local-import-mobile.png'), animations: 'disabled' });
    await preview.getByRole('button', { name: 'Restaurar backup' }).click();
    await expect(cleanPage.getByText('Backup restaurado: 1 tablero, 2 tareas y 0 filtros guardados.')).toBeVisible();
    const restored = await cleanPage.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1')));
    expect(restored).toEqual(backup.todos);
    await cleanPage.reload();
    await cleanPage.getByRole('button', { name: 'Sin fecha (1)', exact: true }).click();
    await expect(cleanPage.getByRole('button', { name: /Revisar propuesta/ }).first()).toBeVisible();
  } finally {
    await cleanContext.close();
  }
});

test('exchanges ICS files through the data panel without importing until confirmation', async ({ page, browser }) => {
  await page.addInitScript(() => localStorage.setItem('TODOS_V1', JSON.stringify([
    { id: 'workshop', kind: 'event', text: 'Taller para emprendedores', startDate: '2099-10-14', startTime: '18:00', endTime: '19:30' },
  ])));
  await page.goto('/');
  await page.getByRole('button', { name: 'Exportar / importar', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar calendario ICS' }).click();
  const download = await downloadPromise;
  const content = await readFile(await download.path(), 'utf8');
  expect(download.suggestedFilename()).toMatch(/\.ics$/);
  expect(content).toContain('BEGIN:VCALENDAR');
  expect(content).toContain('SUMMARY:Taller para emprendedores');

  const cleanContext = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const cleanPage = await cleanContext.newPage();
    await cleanPage.goto('/');
    await cleanPage.getByRole('button', { name: 'Exportar / importar', exact: true }).click();
    await cleanPage.getByLabel('Importar calendario ICS').setInputFiles({
      name: 'taller.ics', mimeType: 'text/calendar', buffer: Buffer.from(content),
    });
    const preview = cleanPage.getByRole('region', { name: 'Previsualizacion de importacion' });
    await expect(preview).toBeFocused();
    await expect(preview).toContainText('1 elemento encontrado');
    expect(await cleanPage.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1') || '[]').length)).toBe(0);
    await preview.getByRole('button', { name: 'Importar calendario', exact: true }).click();
    await expect(cleanPage.getByText('1 elemento agregado.')).toBeVisible();
    await cleanPage.reload();
    await cleanPage.getByRole('button', { name: 'Tareas', exact: true }).click();
    await expect(cleanPage.getByText('Taller para emprendedores', { exact: true })).toBeVisible();
  } finally {
    await cleanContext.close();
  }
});
