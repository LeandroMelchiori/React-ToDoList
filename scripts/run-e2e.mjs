import { spawn, spawnSync } from 'node:child_process';

const host = '127.0.0.1';
const port = '4173';
const previewUrl = `http://${host}:${port}`;

function runStep(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until Vite preview finishes binding the port.
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

runStep(process.execPath, ['./node_modules/vite/bin/vite.js', 'build']);

const server = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', port, '--strictPort'],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  },
);

let exitCode = 0;

try {
  await waitForServer(previewUrl);

  const result = spawnSync(
    process.execPath,
    ['./node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    },
  );

  exitCode = result.status ?? 1;
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  server.kill();
}

process.exit(exitCode);
