import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  console.log('Navigating to https://study114.net/...');
  await page.goto('https://study114.net/', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(2500);

  const title = await page.title();
  const url = page.url();
  console.log('Page Title:', title);
  console.log('Page URL:', url);

  // Check header text or mypage links
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Body prefix (safe):\n', bodyText.replace(/\n+/g, ' '));

  const shotPath = path.join(SHOTS_DIR, 'B-00-precheck-pc.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Screenshot saved to', shotPath);

  await context.close();
  await browser.close();
}

main().catch(err => {
  console.error('Error in precheck:', err);
  process.exit(1);
});
