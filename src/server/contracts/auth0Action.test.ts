import { expect, test, vi } from 'vitest';
import action from '../../../backend/auth0/post-login-action.cjs';

test('adds verified email claims only to the configured TaskFlow access token', async () => {
  const setCustomClaim = vi.fn();
  const event = { secrets: { TASKFLOW_API_AUDIENCE: 'taskflow' }, resource_server: { identifier: 'taskflow' }, user: { email: 'ana@example.test', email_verified: true } };
  await action.onExecutePostLogin(event, { accessToken: { setCustomClaim } });
  expect(setCustomClaim).toHaveBeenCalledWith('https://taskflow.sachadev.me/claims/email', 'ana@example.test');
  expect(setCustomClaim).toHaveBeenCalledWith('https://taskflow.sachadev.me/claims/email_verified', true);
  setCustomClaim.mockClear();
  await action.onExecutePostLogin({ ...event, resource_server: { identifier: 'other' } }, { accessToken: { setCustomClaim } });
  expect(setCustomClaim).not.toHaveBeenCalled();
});

test('does not promote non-boolean verification claims', async () => {
  const setCustomClaim = vi.fn();
  await action.onExecutePostLogin({ secrets: { TASKFLOW_API_AUDIENCE: 'taskflow' }, resource_server: { identifier: 'taskflow' },
    user: { email: 'ana@example.test', email_verified: 'true' } }, { accessToken: { setCustomClaim } });
  expect(setCustomClaim).toHaveBeenCalledWith('https://taskflow.sachadev.me/claims/email_verified', false);
});
