import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function inspectBasicForm() {
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
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/basic', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      name: el.name,
      type: el.type,
      id: el.id,
      placeholder: el.placeholder,
      value: el.value,
      label: el.closest('label')?.innerText?.replace(/\n+/g, ' ') || null
    }));
  });

  console.log('Basic Form inputs:', JSON.stringify(inputs, null, 2));

  await context.close();
  await browser.close();
}

inspectBasicForm().catch(console.error);
