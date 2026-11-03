import { afterEach, expect, test, vi } from 'vitest';
import { createAccountApi, AccountApiError } from './accountApi';
import { readAccountConfig } from './accountConfig';

afterEach(() => vi.unstubAllGlobals());
const profile = { id: 'a6189465-b5b9-4230-bc22-4cafba008924', handle: 'ana', displayName: 'Ana', timeZone: 'UTC' };
const env = { VITE_AUTH0_DOMAIN: 'login.example.test', VITE_AUTH0_CLIENT_ID: 'public-client', VITE_AUTH0_AUDIENCE: 'taskflow', VITE_TASKFLOW_API_URL: 'https://api.example.test/api/v1' };

test('requires complete public configuration and rejects unsafe API endpoints', () => {
  expect(readAccountConfig(env)?.apiUrl).toBe(env.VITE_TASKFLOW_API_URL);
  expect(readAccountConfig({ ...env, VITE_AUTH0_CLIENT_ID: '' })).toBeNull();
  for (const url of ['http://api.example.test/api/v1', 'https://person:password@api.example.test/api/v1', 'https://api.example.test/api/v1?token=secret']) {
    expect(readAccountConfig({ ...env, VITE_TASKFLOW_API_URL: url })).toBeNull();
  }
  expect(readAccountConfig({ ...env, VITE_TASKFLOW_API_URL: 'http://127.0.0.1:8080/api/v1' })).not.toBeNull();
});

test('uses a memory token with no cache, credentials or redirect forwarding', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(profile)));
  vi.stubGlobal('fetch', fetcher);
  const api = createAccountApi(env.VITE_TASKFLOW_API_URL, async () => 'memory-access-token');
  expect(await api.me(new AbortController().signal)).toEqual(profile);
  expect(fetcher).toHaveBeenCalledWith(`${env.VITE_TASKFLOW_API_URL}/me`, expect.objectContaining({
    credentials: 'omit', cache: 'no-store', redirect: 'error', headers: { Authorization: 'Bearer memory-access-token' },
  }));
});

test('does not send missing tokens or requests cancelled during token acquisition', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  await expect(createAccountApi(env.VITE_TASKFLOW_API_URL, async () => undefined).me(new AbortController().signal)).rejects.toBeInstanceOf(AccountApiError);
  const controller = new AbortController(); controller.abort();
  await expect(createAccountApi(env.VITE_TASKFLOW_API_URL, async () => 'token').me(controller.signal)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

test('rejects malformed profiles and preserves structured enrollment errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response('{"code":"invalid_invitation"}', { status: 403 })));
  const api = createAccountApi(env.VITE_TASKFLOW_API_URL, async () => 'token');
  await expect(api.me(new AbortController().signal)).rejects.toMatchObject({ code: 'invalid_response' });
  await expect(api.redeem({ token: 'code', handle: 'ana', displayName: 'Ana', timeZone: 'UTC' }, 'operation', new AbortController().signal))
    .rejects.toMatchObject({ status: 403, code: 'invalid_invitation' });
});
