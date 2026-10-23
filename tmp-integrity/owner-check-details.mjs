import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkDetails() {
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

  // detail 1
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const detail1Inputs = await page.evaluate(() => {
    return {
      text: document.querySelector('.mp-room, .mypage-content, main')?.innerText?.slice(0, 1000),
      inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
        name: el.name,
        type: el.type,
        value: el.value,
        id: el.id
      }))
    };
  });
  console.log('Detail 1:', JSON.stringify(detail1Inputs, null, 2));

  // detail 2
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail2', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const detail2Inputs = await page.evaluate(() => {
    return {
      text: document.querySelector('.mp-room, .mypage-content, main')?.innerText?.slice(0, 1000),
      inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
        name: el.name,
        type: el.type,
        value: el.value,
        id: el.id
      }))
    };
  });
  console.log('Detail 2:', JSON.stringify(detail2Inputs, null, 2));

  await context.close();
  await browser.close();
}

checkDetails().catch(console.error);
