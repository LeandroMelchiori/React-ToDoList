import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = '4173';
const previewUrl = `http://${host}:${port}`;
const screenshotPath = 'public/demo-taskflow.png';

const demoTodos = [
  {
    id: 'demo-1',
    text: 'Preparar demo para recruiter',
    completed: false,
    createdAt: '2026-07-06T12:00:00.000Z',
  },
  {
    id: 'demo-2',
    text: 'Revisar accesibilidad del modal',
    completed: true,
    createdAt: '2026-07-06T12:10:00.000Z',
  },
  {
    id: 'demo-3',
    text: 'Documentar decisiones tecnicas',
    completed: false,
    createdAt: '2026-07-06T12:20:00.000Z',
  },
  {
    id: 'demo-4',
    text: 'Validar CI antes del deploy',
    completed: false,
    createdAt: '2026-07-06T12:30:00.000Z',
  },
];

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

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.addInitScript(todos => {
    localStorage.setItem('TODOS_V1', JSON.stringify(todos));
  }, demoTodos);

  await page.goto(previewUrl);
  await page.getByText('Preparar demo para recruiter').waitFor();
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  console.log(`Demo screenshot saved to ${screenshotPath}`);
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  server.kill();
}

process.exit(exitCode);
