import { chromium } from 'playwright-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = 'http://127.0.0.1:5174';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
const api = [];
page.on('request', (r) => {
  if (r.url().includes('/api/search/search.php') && r.method() === 'POST') {
    api.push(r.postData() || '');
  }
});

await page.goto(`${base}/#/guest`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('[data-list-sort]', { timeout: 15000 });
await page.waitForTimeout(2000);

const sortCount = await page.locator('[data-list-sort]').count();
console.log('sort_selects', sortCount);

await page.evaluate(() => {
  const el = document.querySelector('[data-list-sort-kind="tutor"]');
  if (!(el instanceof HTMLSelectElement)) return;
  el.value = 'sky';
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(2000);

await page.evaluate(() => {
  const el = document.querySelector('[data-list-sort-kind="tutor"]');
  if (!(el instanceof HTMLSelectElement)) return;
  el.value = 'recommend';
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(2000);

const recommendButtons = await page
  .locator('[data-action="recommend-toggle"], [data-gate="recommend"]')
  .count();
console.log('recommend_buttons', recommendButtons);
console.log('api_hits', api.length);
api.slice(-8).forEach((b) => console.log('api_body', b));

const tutorCards = await page.locator('[data-list-sort-kind="tutor"]').count();
console.log('tutor_sort_control', tutorCards);
await browser.close();
console.log('browser_smoke_ok');
