import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';

const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\guest';

async function checkPromo() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const url = 'https://study114.net/#/promo/study-room';

  // PC
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

    console.log('[PC] Navigating to promo study-room...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const shotPath = path.join(SHOTS_DIR, '16-promo-study-room-pc.png');
    await page.screenshot({ path: shotPath, fullPage: true });

    console.log('[PC Promo]', {
      finalUrl: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors
    });
    await context.close();
  }

  // Mobile
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

    console.log('[Mobile] Navigating to promo study-room...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const shotPath = path.join(SHOTS_DIR, '16-promo-study-room-m.png');
    await page.screenshot({ path: shotPath, fullPage: true });

    console.log('[Mobile Promo]', {
      finalUrl: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors
    });
    await context.close();
  }

  await browser.close();
}

checkPromo().catch(console.error);
