import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.skip(process.env.TASKFLOW_AUTH_E2E !== '1', 'Runs with isolated public configuration through npm run test:e2e:auth');
test.use({ serviceWorkers: 'block' });
const origin = 'http://127.0.0.1:4173';
const domain = 'https://login.taskflow.test';
const profile = { id: 'a6189465-b5b9-4230-bc22-4cafba008924', handle: 'ana', displayName: 'Ana', timeZone: 'America/Argentina/Buenos_Aires' };
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

for (const [connection, button] of [['google-oauth2', 'Continuar con Google'], ['Username-Password-Authentication', 'Entrar con email y contraseña']]) {
  test(`accepts an invitation through ${connection}, retries safely and logs out`, async ({ page }, info) => {
    if (connection === 'Username-Password-Authentication') await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(theme => {
      localStorage.setItem('THEME_V1', theme);
      if (!localStorage.getItem('TODOS_V1')) localStorage.setItem('TODOS_V1', JSON.stringify([{ id: 'private-local', text: 'Tarea local', kind: 'task' }]));
    }, connection === 'google-oauth2' ? 'light' : 'dark');
    let nonce = '';
    let challenge = '';
    let enrolled = false;
    const enrollmentKeys = [];
    const accessToken = 'test-only-memory-access-token';
    await page.route(`${domain}/**`, async route => {
      const url = new URL(route.request().url());
      const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (url.pathname === '/authorize') {
        expect(url.searchParams.get('connection')).toBe(connection);
        expect(url.searchParams.get('audience')).toBe('https://taskflow-api.test');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        nonce = url.searchParams.get('nonce'); challenge = url.searchParams.get('code_challenge');
        expect(nonce).toBeTruthy(); expect(challenge).toBeTruthy();
        const callback = new URL(`${origin}/account`);
        callback.searchParams.set('code', 'test-authorization-code'); callback.searchParams.set('state', url.searchParams.get('state'));
        return route.fulfill({ status: 302, headers: { location: callback.href } });
      }
      if (url.pathname === '/oauth/token') {
        const raw = route.request().postData() ?? '';
        const fields = raw.startsWith('{') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
        expect(fields.grant_type).toBe('authorization_code');
        expect(createHash('sha256').update(fields.code_verifier).digest('base64url')).toBe(challenge);
        const now = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ iss: `${domain}/`, aud: 'taskflow-test-client', sub: 'test-person', iat: now, exp: now + 3600, nonce,
          name: 'Ana', email: 'ana@example.test', email_verified: true })).toString('base64url');
        const unsigned = `${header}.${payload}`;
        const idToken = `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url')}`;
        return route.fulfill({ json: { access_token: accessToken, id_token: idToken, token_type: 'Bearer', expires_in: 3600, scope: 'openid profile email' }, headers: cors });
      }
      if (url.pathname === '/v2/logout') {
        expect(url.searchParams.get('returnTo')).toBe(`${origin}/account`);
        return route.fulfill({ status: 302, headers: { location: `${origin}/account` } });
      }
      throw new Error(`Unexpected provider path: ${url.pathname}`);
    });
    await page.route(`${origin}/api/v1/**`, async route => {
      expect(route.request().headers().authorization).toBe(`Bearer ${accessToken}`);
      if (route.request().url().endsWith('/me')) return route.fulfill({ status: enrolled ? 200 : 403, json: enrolled ? profile : { code: 'invitation_required' } });
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toEqual({ token: 'a'.repeat(43), handle: 'ana', displayName: 'Ana', timeZone: 'America/Argentina/Buenos_Aires' });
      enrollmentKeys.push(route.request().headers()['idempotency-key']);
      if (enrollmentKeys.length === 1) return route.fulfill({ status: 503, json: { code: 'unavailable' } });
      enrolled = true;
      return route.fulfill({ json: profile });
    });
    await page.goto('/account');
    await expect(page.getByRole('button', { name: button, exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('login.png'), animations: 'disabled' });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: button, exact: true }).click();
    await expect(page.getByLabel('Código de invitación')).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    await page.getByLabel('Código de invitación').fill('a'.repeat(43));
    await page.getByLabel('Nombre de usuario').fill('ana');
    await page.getByLabel('Zona horaria').fill('America/Argentina/Buenos_Aires');
    await page.screenshot({ path: info.outputPath('invitation.png'), fullPage: true, animations: 'disabled' });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Activar mi cuenta' }).click();
    await expect(page.getByRole('alert')).toContainText('No pudimos conectar');
    await page.getByRole('button', { name: 'Activar mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    expect(enrollmentKeys).toHaveLength(2); expect(enrollmentKeys[0]).toBe(enrollmentKeys[1]);
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
    expect(storage).not.toContain(accessToken); expect(storage).not.toContain('a'.repeat(43));
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TODOS_V1'))[0].text)).toBe('Tarea local');
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
    await page.getByRole('button', { name: 'Volver a mi agenda local' }).click();
    await expect(page.getByRole('heading', { name: 'Planificación', exact: true })).toBeVisible();
  });
}
