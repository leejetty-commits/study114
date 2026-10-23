import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';
const DEEP_DATA_FILE = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-step1-deep-results.json';

const TARGETS = [
  { id: 'B-16-myshop-public-7', url: 'https://study114.net/#/myshop/study-room/7' },
  { id: 'B-06a-reg-profile', url: 'https://study114.net/#/mypage/registrations/study-rooms/7' },
  { id: 'B-06b-reg-basic', url: 'https://study114.net/#/mypage/registrations/study-rooms/7/basic' },
  { id: 'B-06c-reg-detail1', url: 'https://study114.net/#/mypage/registrations/study-rooms/7/detail' },
  { id: 'B-06d-reg-detail2', url: 'https://study114.net/#/mypage/registrations/study-rooms/7/detail2' },
  { id: 'B-06e-reg-inquiries', url: 'https://study114.net/#/mypage/registrations/study-rooms/7/inquiries' },
  { id: 'B-06f-reg-publish', url: 'https://study114.net/#/mypage/registrations/study-rooms/7/publish' },
];

async function runDeep() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const results = [];

  // PC
  const pcContext = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  for (const t of TARGETS) {
    const page = await pcContext.newPage();
    const consoleLogs = [];
    const networkErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleLogs.push(`[console.error] ${msg.text()}`); });
    page.on('pageerror', err => { consoleLogs.push(`[pageerror] ${err.message}`); });
    page.on('response', res => { if (res.status() >= 400) networkErrors.push(`[${res.status()}] ${res.url()}`); });

    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 35000 });
    } catch (e) {}
    await page.waitForTimeout(2000);

    const shotPath = path.join(SHOTS_DIR, `${t.id}-pc.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    results.push({
      id: t.id,
      mode: 'pc',
      url: t.url,
      finalUrl: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors,
      shotPath
    });
    await page.close();
  }

  // Address dialog on PC search
  {
    const page = await pcContext.newPage();
    try {
      await page.goto('https://study114.net/search/#/search/room', { waitUntil: 'networkidle', timeout: 35000 });
    } catch (e) {}
    await page.waitForTimeout(2000);

    // Look for 주소찾기 or 지역선택 button
    const addrBtn = await page.$('button:has-text("주소찾기"), button:has-text("지역"), .search-address-btn, [data-action="find-address"]');
    let dialogOpened = false;
    if (addrBtn) {
      await addrBtn.click();
      await page.waitForTimeout(1500);
      dialogOpened = true;
    }
    const shotPath = path.join(SHOTS_DIR, 'B-30b-search-room-address-dialog-pc.png');
    await page.screenshot({ path: shotPath, fullPage: true });
    results.push({
      id: 'B-30b-search-room-address-dialog',
      mode: 'pc',
      dialogOpened,
      shotPath
    });
    await page.close();
  }

  // Community director write button check on PC
  {
    const page = await pcContext.newPage();
    await page.goto('https://study114.net/#/community/director', { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(2000);

    const writeBtn = await page.$('button:has-text("글쓰기"), a:has-text("글쓰기"), .community-write-btn');
    const writeBtnInfo = writeBtn ? {
      text: await writeBtn.innerText(),
      visible: await writeBtn.isVisible()
    } : null;

    const noticeBanner = await page.evaluate(() => {
      const el = document.querySelector('.community-gate-banner, .community-board-notice, .role-guard-banner');
      return el ? el.innerText : null;
    });

    results.push({
      id: 'B-18-community-director-check',
      mode: 'pc',
      writeBtnInfo,
      noticeBanner
    });
    await page.close();
  }

  await pcContext.close();

  // Mobile
  const mobileContext = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });

  for (const t of TARGETS) {
    const page = await mobileContext.newPage();
    const consoleLogs = [];
    const networkErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleLogs.push(`[console.error] ${msg.text()}`); });
    page.on('pageerror', err => { consoleLogs.push(`[pageerror] ${err.message}`); });
    page.on('response', res => { if (res.status() >= 400) networkErrors.push(`[${res.status()}] ${res.url()}`); });

    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 35000 });
    } catch (e) {}
    await page.waitForTimeout(2000);

    const shotPath = path.join(SHOTS_DIR, `${t.id}-m.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    results.push({
      id: t.id,
      mode: 'm',
      url: t.url,
      finalUrl: page.url(),
      title: await page.title(),
      consoleLogs,
      networkErrors,
      shotPath
    });
    await page.close();
  }

  // Address dialog on Mobile search
  {
    const page = await mobileContext.newPage();
    try {
      await page.goto('https://study114.net/search/#/search/room', { waitUntil: 'networkidle', timeout: 35000 });
    } catch (e) {}
    await page.waitForTimeout(2000);

    const addrBtn = await page.$('button:has-text("주소찾기"), button:has-text("지역"), .search-address-btn, [data-action="find-address"]');
    let dialogOpened = false;
    if (addrBtn) {
      await addrBtn.click();
      await page.waitForTimeout(1500);
      dialogOpened = true;
    }
    const shotPath = path.join(SHOTS_DIR, 'B-30b-search-room-address-dialog-m.png');
    await page.screenshot({ path: shotPath, fullPage: true });
    results.push({
      id: 'B-30b-search-room-address-dialog',
      mode: 'm',
      dialogOpened,
      shotPath
    });
    await page.close();
  }

  await mobileContext.close();
  await browser.close();

  fs.writeFileSync(DEEP_DATA_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Saved deep results to ${DEEP_DATA_FILE}`);
}

runDeep().catch(console.error);
