process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  // Safety net
  await page.route('**/api/**', (route) => {
    const method = route.request().method();
    const url = route.request().url();
    if (method === 'GET') {
      route.continue();
      return;
    }
    if (url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
      route.continue();
      return;
    }
    console.warn(`[SAFETY NET BLOCKED] ${method} ${url}`);
    route.abort();
  });

  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleLogs.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    consoleLogs.push(`pageerror: ${err.message}`);
  });

  console.log('Navigating to', BASE_URL);
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  await page.screenshot({
    path: 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C1/test-home-pc.png',
    fullPage: false,
  });

  console.log('Console errors:', consoleLogs);
  await browser.close();
}

main().catch(console.error);
