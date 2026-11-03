import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['scripts/run-e2e.mjs', 'tests/e2e/account-auth.spec.js', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, TASKFLOW_AUTH_E2E: '1', VITE_AUTH0_DOMAIN: 'login.taskflow.test', VITE_AUTH0_CLIENT_ID: 'taskflow-test-client',
    VITE_AUTH0_AUDIENCE: 'https://taskflow-api.test', VITE_AUTH0_DATABASE_CONNECTION: 'Username-Password-Authentication',
    VITE_TASKFLOW_API_URL: 'http://127.0.0.1:4173/api/v1' },
});
process.exit(result.status ?? 1);
