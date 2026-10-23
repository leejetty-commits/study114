import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkBasicDom() {
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
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click on 기본정보 tab
  const basicTab = await page.$('a.mp-room__tab[href*="/basic"]');
  if (basicTab) {
    console.log('Clicking 기본정보 tab link...');
    await basicTab.click();
    await page.waitForTimeout(2000);
  }

  const domInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      mainText: document.querySelector('.mp-room, .mypage-content, main')?.innerText?.slice(0, 1500),
      forms: Array.from(document.querySelectorAll('form')).map(f => f.className),
      inputsCount: document.querySelectorAll('input, select, textarea').length
    };
  });

  console.log('DOM info:', JSON.stringify(domInfo, null, 2));

  await context.close();
  await browser.close();
}

checkBasicDom().catch(console.error);
