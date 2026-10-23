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
  const searchRequests = [];

  page.on('request', (req) => {
    if (req.url().includes('/api/search/search.php')) {
      searchRequests.push({
        url: req.url(),
        method: req.method(),
        postData: req.postData(),
      });
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/search/search.php')) {
      console.log(`Response ${res.status()} for ${res.request().postData()}`);
      const body = await res.text().catch(() => '');
      console.log(`Body: ${body.slice(0, 200)}`);
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  console.log('Total search requests:', searchRequests.length);
  await browser.close();
}

main().catch(console.error);
