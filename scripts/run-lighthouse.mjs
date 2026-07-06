import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const url = 'https://taskflow.sachadev.me';
const outputPath = 'reports/lighthouse.html';

mkdirSync('reports', { recursive: true });

const result = spawnSync(
  process.execPath,
  [
    './node_modules/lighthouse/cli/index.js',
    url,
    '--chrome-flags=--headless',
    '--output=html',
    `--output-path=${outputPath}`,
  ],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
