import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountWorkspace } from './AccountWorkspace';
import type { AccountConfig } from './accountConfig';

const { auth } = vi.hoisted(() => ({ auth: { isAuthenticated: false, isLoading: false, user: undefined as undefined | { sub: string; name: string }, error: undefined,
  loginWithRedirect: vi.fn(), logout: vi.fn(), getAccessTokenSilently: vi.fn() } }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => auth }));
const config: AccountConfig = { domain: 'login.example.test', clientId: 'public-client', audience: 'taskflow', apiUrl: 'https://api.example.test/api/v1', databaseConnection: 'Database' };
const profile = { id: 'a6189465-b5b9-4230-bc22-4cafba008924', handle: 'ana', displayName: 'Ana', timeZone: 'UTC' };
beforeEach(() => { auth.isAuthenticated = false; auth.isLoading = false; auth.user = undefined; vi.clearAllMocks(); auth.getAccessTokenSilently.mockResolvedValue('memory-token'); });
afterEach(() => vi.unstubAllGlobals());

test('delegates Google and email/password to hosted login without collecting passwords', async () => {
  const user = userEvent.setup();
  render(<AccountWorkspace config={config} onLocal={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Continuar con Google' }));
  expect(auth.loginWithRedirect).toHaveBeenCalledWith({ authorizationParams: { connection: 'google-oauth2' } });
  await user.click(screen.getByRole('button', { name: 'Entrar con email y contraseña' }));
  expect(auth.loginWithRedirect).toHaveBeenCalledWith({ authorizationParams: { connection: 'Database' } });
  expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
});

test('prevents repeated redirects and allows retry when opening login fails', async () => {
  let rejectLogin!: (reason: Error) => void;
  auth.loginWithRedirect.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectLogin = reject; }));
  const user = userEvent.setup();
  render(<AccountWorkspace config={config} onLocal={vi.fn()} />);
  const google = screen.getByRole('button', { name: 'Continuar con Google' });
  const email = screen.getByRole('button', { name: 'Entrar con email y contraseña' });
  await user.click(google);
  expect(google).toBeDisabled();
  expect(email).toBeDisabled();
  await user.click(email);
  expect(auth.loginWithRedirect).toHaveBeenCalledTimes(1);
  rejectLogin(new Error('Unable to redirect'));
  await screen.findByRole('alert');
  expect(email).toBeEnabled();
  await user.click(email);
  expect(auth.loginWithRedirect).toHaveBeenCalledTimes(2);
});

test('keeps draft and idempotency key when enrollment fails and lets users paste invitations', async () => {
  const user = userEvent.setup();
  auth.isAuthenticated = true; auth.user = { sub: 'one', name: 'Ana' };
  const requests: RequestInit[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    if (!init.method) return new Response('{"code":"invitation_required"}', { status: 403 });
    requests.push(init); return new Response('{"code":"invalid_invitation"}', { status: 403 });
  }));
  render(<AccountWorkspace config={config} onLocal={vi.fn()} />);
  await screen.findByLabelText('Código de invitación');
  await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  expect(screen.getByRole('alert')).toHaveFocus();
  await user.click(screen.getByLabelText('Código de invitación'));
  await user.paste('a'.repeat(43));
  await user.type(screen.getByLabelText('Nombre de usuario'), 'ana');
  await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  await screen.findByText(/La invitación no está disponible/);
  await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[0].headers).toEqual(requests[1].headers);
  expect(requests[0].body).toEqual(requests[1].body);
  expect(screen.getByLabelText('Código de invitación')).toHaveValue('a'.repeat(43));
});

test('ignores a previous identity response after changing accounts', async () => {
  auth.isAuthenticated = true; auth.user = { sub: 'one', name: 'Ana' };
  let resolveFirst!: (value: Response) => void;
  vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { resolveFirst = resolve; }))
    .mockResolvedValue(new Response(JSON.stringify({ ...profile, displayName: 'Beto', handle: 'beto' }))));
  const view = render(<AccountWorkspace config={config} onLocal={vi.fn()} />);
  await waitFor(() => expect(resolveFirst).toBeTypeOf('function'));
  auth.user = { sub: 'two', name: 'Beto' };
  view.rerender(<AccountWorkspace config={config} onLocal={vi.fn()} />);
  await screen.findByRole('heading', { name: 'Hola, Beto' });
  resolveFirst(new Response(JSON.stringify(profile)));
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Hola, Ana' })).not.toBeInTheDocument());
  expect(screen.getByRole('heading', { name: 'Hola, Beto' })).toBeVisible();
});

test('shows the owned profile and uses a fixed logout destination', async () => {
  auth.isAuthenticated = true; auth.user = { sub: 'one', name: 'Ana' };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(profile))));
  const user = userEvent.setup();
  render(<AccountWorkspace config={config} onLocal={vi.fn()} />);
  await screen.findByRole('heading', { name: 'Hola, Ana' });
  await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(auth.logout).toHaveBeenCalledWith({ logoutParams: { returnTo: `${window.location.origin}/account` } });
  expect(screen.queryByText('@ana')).not.toBeInTheDocument();
});
