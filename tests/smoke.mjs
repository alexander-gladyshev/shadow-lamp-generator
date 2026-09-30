// Smoke test: open the page, wait for the built-in sample, check the findings, open every tab, export the zip.
// Usage: node tests/smoke.mjs   (needs `npm i -D playwright` and `npx playwright install chromium`)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tests', 'out');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto(pathToFileURL(join(root, 'index.html')).href);
await page.waitForTimeout(2500);

const warn = await page.locator('#warn').innerText();
console.log('Замечания:\n' + warn);

for (const tab of ['pic', 'wall', 'dev', '3d']) {
  await page.click(`[data-tab="${tab}"]`);
  await page.waitForTimeout(tab === '3d' ? 4000 : 500);
  await page.screenshot({ path: join(out, `tab-${tab}.png`) });
}
await page.click('[data-tab="wall"]');
await page.click('[data-wsub="compare"]');
await page.waitForTimeout(1500);
await page.screenshot({ path: join(out, 'compare.png') });

const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dlStl')]);
const file = join(out, 'export.zip');
await download.saveAs(file);
console.log('Скачан:', file);

await browser.close();
if (errors.length) { console.error('Ошибки на странице:\n' + errors.join('\n')); process.exit(1); }
console.log('OK');
