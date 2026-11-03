import { test, expect } from '@playwright/test';

test('never keeps API or authorized responses in the offline cache', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    await fetch('/api/v1/privacy-test');
    await fetch('/authorized-response', { headers: { Authorization: 'Bearer test-only' } });
  });
  const cached = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async name =>
    (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat());
  expect(cached).not.toContain('/api/v1/privacy-test');
  expect(cached).not.toContain('/authorized-response');
  await context.setOffline(true);
  expect(await page.evaluate(async () => {
    try { await fetch('/api/v1/privacy-test'); return true; } catch { return false; }
  })).toBe(false);
  await context.setOffline(false);
});
