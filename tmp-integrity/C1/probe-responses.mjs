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
  const responses = [];

  page.on('response', (res) => {
    responses.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  console.log('Responses:');
  console.log(responses.join('\n'));

  await browser.close();
}

main().catch(console.error);
