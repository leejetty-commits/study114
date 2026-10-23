import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\guest';

async function checkScreen(url, namePrefix, options = {}) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const results = { pc: {}, mobile: {} };

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

    console.log(`[PC] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(2500);

    if (options.beforeShot) {
      await options.beforeShot(page, 'pc');
    }

    const shotPath = path.join(SHOTS_DIR, `${namePrefix}-pc.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    results.pc = {
      finalUrl: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors,
      shotPath
    };
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

    console.log(`[Mobile] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(2500);

    if (options.beforeShot) {
      await options.beforeShot(page, 'mobile');
    }

    const shotPath = path.join(SHOTS_DIR, `${namePrefix}-m.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    results.mobile = {
      finalUrl: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors,
      shotPath
    };
    await context.close();
  }

  await browser.close();
  return results;
}

async function run() {
  const homeResult = await checkScreen('https://study114.net/', '01-home');
  console.log('=== HOME RESULT ===', JSON.stringify(homeResult, null, 2));
}

run().catch(console.error);
