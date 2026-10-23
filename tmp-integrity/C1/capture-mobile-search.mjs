process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
import * as path from 'node:path';

const require = createRequire('file:///d:/work/study114/package.json');
const { chromium, devices } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:\\work\\study114\\.wt\\integrity-tutor\\tmp-integrity\\C1';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 12'],
    storageState: STORAGE_STATE,
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  page.route('**/api/**', (route) => {
    const req = route.request();
    const method = req.method();
    const url = req.url();
    if (method === 'GET' || url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
      route.continue();
      return;
    }
    route.abort();
  });

  // Mobile tutor search
  await page.goto(`${BASE_URL}/search/#/search/tutor?role=tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '03-search-tutor-mobile.png'), fullPage: true });

  // Mobile student search
  await page.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '03-search-student-mobile.png'), fullPage: true });

  await browser.close();
  console.log('Mobile search screenshots captured');
}

main().catch(console.error);
