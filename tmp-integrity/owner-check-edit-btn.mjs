import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkEditButton() {
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
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const editBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).filter(el => el.innerText.includes('수정')).map(el => ({
      tag: el.tagName,
      text: el.innerText.trim(),
      href: el.getAttribute('href'),
      className: el.className
    }));
  });
  console.log('Edit buttons on Detail 1:', JSON.stringify(editBtns, null, 2));

  await context.close();
  await browser.close();
}

checkEditButton().catch(console.error);
