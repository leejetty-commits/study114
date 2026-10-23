import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const text = await page.innerText('body');
  console.log('--- Page text preview ---');
  console.log(text.slice(0, 1500));
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button, a')).map(el => ({ tag: el.tagName, text: el.innerText.trim(), href: el.getAttribute('href'), class: el.className })));
  console.log('--- Buttons/Links ---');
  console.log(JSON.stringify(buttons.filter(b => b.text.length > 0 && b.text.length < 30), null, 2));
  await browser.close();
}

inspect();
