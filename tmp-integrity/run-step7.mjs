import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';

const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\guest';

async function checkErrorRoutes() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const targets = [
    { url: 'https://study114.net/#/myshop/study-room/999999', prefix: '13-error-notfound-room' },
    { url: 'https://study114.net/#/myshop/study-room/abc', prefix: '14-error-invalid-room-id' },
    { url: 'https://study114.net/#/some-nonexistent-route-xyz', prefix: '15-error-unknown-route' }
  ];

  for (const t of targets) {
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

      console.log(`[PC] Navigating to ${t.url}...`);
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 35000 });
      await page.waitForTimeout(3000);

      const shotPath = path.join(SHOTS_DIR, `${t.prefix}-pc.png`);
      await page.screenshot({ path: shotPath, fullPage: true });

      const text = await page.evaluate(() => document.body.innerText);

      console.log(`[PC ${t.prefix}]`, {
        finalUrl: page.url(),
        title: await page.title(),
        consoleLogs,
        networkErrors,
        snippet: text.slice(0, 300).replace(/\n+/g, ' ')
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

      console.log(`[Mobile] Navigating to ${t.url}...`);
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 35000 });
      await page.waitForTimeout(3000);

      const shotPath = path.join(SHOTS_DIR, `${t.prefix}-m.png`);
      await page.screenshot({ path: shotPath, fullPage: true });

      console.log(`[Mobile ${t.prefix}]`, {
        finalUrl: page.url(),
        title: await page.title(),
        consoleLogs,
        networkErrors
      });
      await context.close();
    }
  }

  await browser.close();
}

checkErrorRoutes().catch(console.error);
