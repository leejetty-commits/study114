import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '287-shots');
mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:5198/287-preview.html';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

async function badge() {
  return page.$eval('[data-p19-memo-status]', (el) => ({
    status: el.getAttribute('data-p19-memo-status'),
    text: el.textContent.trim(),
    cls: el.querySelector('span')?.className || '',
    color: getComputedStyle(el.querySelector('span')).color,
    bg: getComputedStyle(el.querySelector('span')).backgroundColor,
  }));
}

async function shot(name) {
  await page.screenshot({ path: join(out, name), fullPage: true });
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
}

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}?view=settings`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-p19-memo-status]');
const openBefore = await badge();
const open1280 = await shot('student-memo-badge-open-1280.png');

await page.click('input[name="memo_status"][value="paused"]');
const afterClick = await badge();

await page.click('button[type="submit"]');
await page.waitForFunction(() => document.querySelector('[data-p19-memo-status]')?.getAttribute('data-p19-memo-status') === 'paused');
const pausedSaved = await badge();
const storedPaused = await page.evaluate(() => window.__p287()?.memo_status);

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-p19-memo-status]');
const pausedReload = await badge();
const paused1280 = await shot('student-memo-badge-paused-1280.png');

await page.setViewportSize({ width: 390, height: 844 });
const paused390 = await shot('student-memo-badge-paused-390.png');

await page.setViewportSize({ width: 1280, height: 900 });
await page.click('input[name="memo_status"][value="open"]');
const beforeSecondSave = await badge();
await page.click('button[type="submit"]');
await page.waitForFunction(() => document.querySelector('[data-p19-memo-status]')?.getAttribute('data-p19-memo-status') === 'open');
const openAgain = await badge();

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}?view=settings`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-p19-memo-status]');
const open390state = await badge();
const open390 = await shot('student-memo-badge-open-390.png');

await page.goto(`${base}?view=hub`, { waitUntil: 'domcontentloaded' });
const hubBadge = await page.locator('.p21-inq-badge').count();
await page.goto(`${base}?view=basic`, { waitUntil: 'domcontentloaded' });
const basicBadge = await page.locator('.p21-inq-badge').count();
await page.goto(`${base}?view=detail`, { waitUntil: 'domcontentloaded' });
const detailBadge = await page.locator('.p21-inq-badge').count();

console.log(JSON.stringify({
  openBefore,
  afterClick,
  pausedSaved,
  storedPaused,
  pausedReload,
  beforeSecondSave,
  openAgain,
  open390state,
  open1280,
  paused1280,
  paused390,
  open390,
  hubBadge,
  basicBadge,
  detailBadge,
  errors,
}, null, 2));

await browser.close();
