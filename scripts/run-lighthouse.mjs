import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const url = process.env.LIGHTHOUSE_URL || 'https://taskflow.sachadev.me';
const reportsPath = 'reports';
const outputPath = `${reportsPath}/lighthouse.html`;
const tempPath = resolve(`${reportsPath}/.lighthouse-temp`);

function readLighthouseData(reportPath) {
  const marker = 'window.__LIGHTHOUSE_JSON__ = ';
  const html = readFileSync(reportPath, 'utf8');
  const start = html.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const jsonStart = start + marker.length;
  const jsonEnd = html.indexOf(';</script>', jsonStart);

  if (jsonEnd < 0) {
    return null;
  }

  return JSON.parse(html.slice(jsonStart, jsonEnd));
}

function formatScore(score) {
  return Math.round(score * 100);
}

function printSummary(reportPath) {
  const data = readLighthouseData(reportPath);

  if (!data) {
    console.log(`Lighthouse report saved to ${reportPath}`);
    return;
  }

  const categorySummary = Object.values(data.categories)
    .map(category => `${category.title}: ${formatScore(category.score)}`)
    .join(' | ');
  const opportunities = Object.values(data.audits)
    .filter(audit =>
      typeof audit.score === 'number' &&
      audit.score < 1 &&
      audit.scoreDisplayMode !== 'informative'
    )
    .sort((firstAudit, secondAudit) => firstAudit.score - secondAudit.score)
    .slice(0, 5);

  console.log(`Lighthouse report saved to ${reportPath}`);
  console.log(categorySummary);

  if (opportunities.length > 0) {
    console.log('Top opportunities:');
    opportunities.forEach(audit => {
      console.log(`- ${formatScore(audit.score)} ${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}`);
    });
  }
}

mkdirSync(reportsPath, { recursive: true });
rmSync(tempPath, { recursive: true, force: true });
mkdirSync(tempPath, { recursive: true });

const result = spawnSync(
  process.execPath,
  [
    './node_modules/lighthouse/cli/index.js',
    url,
    '--chrome-flags=--headless=new --disable-gpu --no-sandbox',
    '--quiet',
    '--output=html',
    `--output-path=${outputPath}`,
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      TEMP: tempPath,
      TMP: tempPath,
    },
    stdio: 'pipe',
    shell: false,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}

if (!existsSync(outputPath)) {
  console.error(`Lighthouse did not create ${outputPath}`);
  process.exit(1);
}

printSummary(outputPath);
rmSync(tempPath, { recursive: true, force: true });
