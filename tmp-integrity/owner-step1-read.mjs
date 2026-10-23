import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';
const REPORT_DATA_FILE = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-step1-results.json';

const SCREENS = [
  { id: 'B-01-home', url: 'https://study114.net/' },
  { id: 'B-02-mypage-hub', url: 'https://study114.net/#/mypage' },
  { id: 'B-02b-mypage-home', url: 'https://study114.net/#/mypage/home' },
  { id: 'B-03-mypage-account', url: 'https://study114.net/#/mypage/account' },
  { id: 'B-04-mypage-contact', url: 'https://study114.net/#/mypage/contact' },
  { id: 'B-05-mypage-messages', url: 'https://study114.net/#/mypage/messages' },
  { id: 'B-06-mypage-registrations', url: 'https://study114.net/#/mypage/registrations' },
  { id: 'B-07-mypage-plans', url: 'https://study114.net/#/mypage/plans' },
  { id: 'B-08-mypage-plans-my', url: 'https://study114.net/#/mypage/plans/my' },
  { id: 'B-09-mypage-plans-history', url: 'https://study114.net/#/mypage/plans/history' },
  { id: 'B-10-mypage-recent', url: 'https://study114.net/#/mypage/recent' },
  { id: 'B-11-mypage-wishlist', url: 'https://study114.net/#/mypage/wishlist' },
  { id: 'B-12-mypage-student-review', url: 'https://study114.net/#/mypage/student-review' },
  { id: 'B-13-mypage-submission-board', url: 'https://study114.net/#/mypage/submission-board' },
  { id: 'B-14-mypage-submission-docs', url: 'https://study114.net/#/mypage/submission-docs' },
  { id: 'B-15-myshop-owner', url: 'https://study114.net/#/myshop' },
  { id: 'B-17-community-hub', url: 'https://study114.net/#/community' },
  { id: 'B-18-community-director', url: 'https://study114.net/#/community/director' },
  { id: 'B-19-community-parent', url: 'https://study114.net/#/community/parent' },
  { id: 'B-20-community-tutor', url: 'https://study114.net/#/community/tutor' },
  { id: 'B-21-community-admission', url: 'https://study114.net/#/community/admission' },
  { id: 'B-22-community-solved', url: 'https://study114.net/#/community/solved' },
  { id: 'B-23-support-hub', url: 'https://study114.net/#/support' },
  { id: 'B-24-support-notice', url: 'https://study114.net/#/support/notice' },
  { id: 'B-25-support-faq', url: 'https://study114.net/#/support/faq' },
  { id: 'B-26-support-contact', url: 'https://study114.net/#/support/contact' },
  { id: 'B-27-support-tickets', url: 'https://study114.net/#/support/contact/tickets' },
  { id: 'B-28-support-library', url: 'https://study114.net/#/support/library' },
  { id: 'B-29-support-policies', url: 'https://study114.net/#/support/policies' },
  { id: 'B-30-search-room', url: 'https://study114.net/search/#/search/room' },
  { id: 'B-31-search-tutor', url: 'https://study114.net/search/#/search/tutor' },
  { id: 'B-32-forbidden-admin-notices', url: 'https://study114.net/#/support/admin/notices' },
  { id: 'B-33-forbidden-admin-tickets', url: 'https://study114.net/#/support/admin/tickets' },
  { id: 'B-34-forbidden-register-tutor', url: 'https://study114.net/#/register/tutor' }
];

async function captureScreen(context, item, mode) {
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
    if (res.status() >= 400) {
      networkErrors.push(`[${res.status()}] ${res.url()}`);
    }
  });

  console.log(`[${mode.toUpperCase()}] Navigating to ${item.id}: ${item.url}`);
  try {
    await page.goto(item.url, { waitUntil: 'networkidle', timeout: 35000 });
  } catch (e) {
    console.log(`[${mode.toUpperCase()}] goto timed out or failed for ${item.url}, waiting 3s...`);
  }
  await page.waitForTimeout(2000);

  // Additional interactions for specific screens if needed
  if (item.id === 'B-30-search-room') {
    // We will do address button dialog in separate capture or inline
  }

  const shotPath = path.join(SHOTS_DIR, `${item.id}-${mode === 'pc' ? 'pc' : 'm'}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  const finalUrl = page.url();
  const title = await page.title();
  const bodyTextSnippet = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n+/g, ' '));

  let extraData = {};
  if (item.id === 'B-06-mypage-registrations') {
    extraData.links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, button'))
        .map(el => ({ text: el.innerText.trim(), href: el.getAttribute('href'), id: el.id, className: el.className }))
        .filter(l => l.text.length > 0);
    });
  }

  await page.close();

  return {
    id: item.id,
    mode,
    url: item.url,
    finalUrl,
    title,
    bodyTextSnippet,
    consoleLogs,
    networkErrors,
    shotPath,
    extraData
  };
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const allResults = [];

  // 1. PC Run
  console.log('=== STARTING PC RUN ===');
  const pcContext = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  for (const item of SCREENS) {
    try {
      const res = await captureScreen(pcContext, item, 'pc');
      allResults.push(res);
    } catch (err) {
      console.error(`Error on PC screen ${item.id}:`, err.message);
      allResults.push({ id: item.id, mode: 'pc', error: err.message });
    }
  }
  await pcContext.close();

  // 2. Mobile Run
  console.log('=== STARTING MOBILE RUN ===');
  const mobileContext = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });

  for (const item of SCREENS) {
    try {
      const res = await captureScreen(mobileContext, item, 'm');
      allResults.push(res);
    } catch (err) {
      console.error(`Error on Mobile screen ${item.id}:`, err.message);
      allResults.push({ id: item.id, mode: 'm', error: err.message });
    }
  }
  await mobileContext.close();

  await browser.close();

  fs.writeFileSync(REPORT_DATA_FILE, JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`Saved step 1 results to ${REPORT_DATA_FILE}`);
}

run().catch(err => {
  console.error('Fatal in step 1:', err);
  process.exit(1);
});
