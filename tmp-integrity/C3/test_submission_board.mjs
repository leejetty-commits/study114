import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C3';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 안전장치
  page.route('**/api/**', (route, request) => {
    if (request.method() !== 'GET') {
      route.abort('blockedbyclient');
    } else {
      route.continue();
    }
  });

  console.log('Visiting /#/mypage/submission-board...');
  await page.goto(`${BASE_URL}/#/mypage/submission-board`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const shot = 'c3-submission-board-actual-pc.png';
  await page.screenshot({ path: path.join(SHOTS_DIR, shot), fullPage: true });

  const state = await page.evaluate(() => ({
    url: window.location.href,
    hash: window.location.hash,
    title: document.title,
    body: document.body.innerText.slice(0, 500)
  }));

  console.log('Submission Board State:', JSON.stringify(state, null, 2));

  await browser.close();
}

run().catch(console.error);
