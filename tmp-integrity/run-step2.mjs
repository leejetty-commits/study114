import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';

const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\guest';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const searchUrl = 'https://study114.net/search/#/search/room';

  // 1. PC: Search Room Main (Empty state with sample)
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    const consoleLogs = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(`[console.error] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      consoleLogs.push(`[pageerror] ${err.message}`);
    });
    page.on('response', res => {
      if (res.status() >= 400) networkErrors.push(`[${res.status()}] ${res.url()}`);
    });

    console.log('[PC] Navigating to search room...');
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const shotPath1 = path.join(SHOTS_DIR, '02-search-room-empty-pc.png');
    await page.screenshot({ path: shotPath1, fullPage: true });

    // Try clicking region / address selector if available (READ ONLY action, no submit)
    console.log('[PC] Checking address search / region selector buttons...');
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, select, input, a')).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        id: el.id,
        className: el.className,
        placeholder: el.placeholder
      })).filter(b => b.text.includes('주소') || b.text.includes('지역') || b.text.includes('필터') || b.placeholder?.includes('주소'));
    });
    console.log('Search action candidates:', buttons);

    // Click '주소찾기' button or similar to see what dialog appears
    const addrBtn = page.locator('button:has-text("주소찾기"), a:has-text("주소찾기")').first();
    if (await addrBtn.count() > 0) {
      console.log('[PC] Clicking 주소찾기 button...');
      await addrBtn.click();
      await page.waitForTimeout(1500);
      const shotModalPath = path.join(SHOTS_DIR, '03-search-room-region-dialog-pc.png');
      await page.screenshot({ path: shotModalPath, fullPage: false });
    }

    console.log('[PC Search Results]', {
      url: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors
    });
    await context.close();
  }

  // 2. Mobile: Search Room Main & Dialog
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    const consoleLogs = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(`[console.error] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      consoleLogs.push(`[pageerror] ${err.message}`);
    });
    page.on('response', res => {
      if (res.status() >= 400) networkErrors.push(`[${res.status()}] ${res.url()}`);
    });

    console.log('[Mobile] Navigating to search room...');
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const shotPath1 = path.join(SHOTS_DIR, '02-search-room-empty-m.png');
    await page.screenshot({ path: shotPath1, fullPage: true });

    const addrBtn = page.locator('button:has-text("주소찾기"), a:has-text("주소찾기")').first();
    if (await addrBtn.count() > 0) {
      console.log('[Mobile] Clicking 주소찾기 button...');
      await addrBtn.click();
      await page.waitForTimeout(1500);
      const shotModalPath = path.join(SHOTS_DIR, '03-search-room-region-dialog-m.png');
      await page.screenshot({ path: shotModalPath, fullPage: false });
    }

    console.log('[Mobile Search Results]', {
      url: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors
    });
    await context.close();
  }

  await browser.close();
}

run().catch(console.error);
