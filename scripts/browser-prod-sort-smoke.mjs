import { chromium } from 'playwright-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = 'https://study114.dothome.co.kr';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
const api = [];
page.on('request', (r) => {
  if (r.url().includes('/api/search/search.php') && r.method() === 'POST') {
    api.push(r.postData() || '');
  }
});
page.on('response', async (r) => {
  if (r.url().includes('/api/search/search.php')) {
    console.log('search_status', r.status());
  }
});

await page.goto(`${base}/#/guest`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

const sortCount = await page.locator('[data-list-sort]').count();
console.log('sort_selects', sortCount);
console.log('api_hits', api.length);
api.slice(0, 6).forEach((b) => console.log('api_body', b));

const html = await page.content();
console.log('has_sort_ui', html.includes('data-list-sort'));
console.log('has_mock_seed_hint', /EXPOSURE|더미|시드/.test(html));

await page.goto(`${base}/search/#/search/room`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
console.log('search_page_ok', true);

await browser.close();
console.log('prod_browser_smoke_done');
