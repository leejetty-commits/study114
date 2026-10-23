import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function debugCompose() {
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
  const apiCalls = [];
  page.on('response', async res => {
    if (res.request().method() === 'POST' || res.status() >= 400 || res.url().includes('board') || res.url().includes('posts')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiCalls.push({
        method: res.request().method(),
        url: res.url(),
        status: res.status(),
        body: body.slice(0, 300)
      });
    }
  });

  await page.goto('https://study114.net/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click 커뮤니티 -> 공부방 고민방 -> 글쓰기
  await page.click('a.home-gnb__item[href="#/community"]');
  await page.waitForTimeout(1000);
  await page.click('a[href="#/community/director"]');
  await page.waitForTimeout(1000);
  await page.click('a[href="#/community/director/new"]');
  await page.waitForTimeout(1000);

  await page.fill('input[name="title"]', '[테스트] 무결성 점검 — 곧 삭제');
  await page.fill('textarea[name="body"]', '[테스트] 자동 점검 글입니다.');
  await page.waitForTimeout(500);

  console.log('Clicking 올리기...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Final URL:', page.url());
  const errorMsg = await page.evaluate(() => {
    const err = document.querySelector('[data-concern-compose-error]');
    return err ? { hidden: err.hidden, text: err.innerText } : null;
  });
  console.log('Compose Error Element:', errorMsg);
  console.log('API Calls during submit:', JSON.stringify(apiCalls, null, 2));

  await context.close();
  await browser.close();
}

debugCompose().catch(console.error);
