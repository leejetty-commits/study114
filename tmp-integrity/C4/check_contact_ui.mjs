import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/#/mypage/contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text = await page.innerText('body');
  console.log('--- Page text preview ---');
  console.log(text.slice(0, 1500));

  await browser.close();
}

check().catch(console.error);
