process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:\\work\\study114\\.wt\\integrity-tutor\\tmp-integrity\\C1';

function setupSafetyNetAndLoggers(page, logs) {
  page.route('**/api/**', (route) => {
    const req = route.request();
    const method = req.method();
    const url = req.url();
    if (method === 'GET') {
      route.continue();
      return;
    }
    // Allowed read-only POSTs
    if (url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
      logs.allowedPosts.push({ method, url });
      route.continue();
      return;
    }
    logs.blockedMutations.push({ method, url });
    console.warn(`[BLOCKED NON-GET] ${method} ${url}`);
    route.abort();
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logs.consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('pageerror', (err) => {
    logs.pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('response', async (res) => {
    if (res.status() >= 400) {
      let text = '';
      try {
        text = await res.text();
      } catch (e) {
        text = '(could not read body)';
      }
      logs.failedRequests.push({
        status: res.status(),
        statusText: res.statusText(),
        url: res.url(),
        method: res.request().method(),
        body: text.slice(0, 500),
      });
    }
  });
}

async function inspectTextAnomalies(page) {
  return await page.evaluate(() => {
    const textNodes = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walk.nextNode())) {
      const txt = node.textContent?.trim();
      if (!txt) continue;
      if (
        txt.includes('undefined') ||
        txt.includes('null') ||
        txt.includes('NaN') ||
        txt.includes('NaN') ||
        txt.includes('Invalid Date')
      ) {
        // filter out legitimate words
        if (/\b(undefined|null|NaN|Invalid Date)\b/.test(txt)) {
          textNodes.push({
            text: txt,
            parentTag: node.parentElement?.tagName,
            parentClass: node.parentElement?.className,
            parentHtml: node.parentElement?.outerHTML?.slice(0, 200),
          });
        }
      }
    }
    return textNodes;
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = {
    pc: { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] },
    mobile: { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] },
  };

  // 1. PC Viewport
  console.log('--- Checking PC Home ---');
  const pcContext = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });
  const pcPage = await pcContext.newPage();
  setupSafetyNetAndLoggers(pcPage, results.pc);

  await pcPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(3000);

  results.pc.urlAfterLoad = pcPage.url();
  await pcPage.screenshot({ path: path.join(OUT_DIR, '01-home-pc-full.png'), fullPage: true });
  await pcPage.screenshot({ path: path.join(OUT_DIR, '01-home-pc-top.png'), fullPage: false });

  // Scroll down to cards and take screenshot
  await pcPage.evaluate(() => window.scrollTo(0, 800));
  await pcPage.waitForTimeout(1000);
  await pcPage.screenshot({ path: path.join(OUT_DIR, '01-home-pc-cards.png'), fullPage: false });

  // Scroll to bottom
  await pcPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await pcPage.waitForTimeout(1000);
  await pcPage.screenshot({ path: path.join(OUT_DIR, '01-home-pc-bottom.png'), fullPage: false });

  // Check text anomalies
  results.pc.anomalies = await inspectTextAnomalies(pcPage);

  // Check tutor home elements
  results.pc.gnbItems = await pcPage.evaluate(() => {
    return Array.from(document.querySelectorAll('.site-gnb a, .site-gnb button, nav a, .gnb__item, [data-gnb-item]')).map((el) => ({
      text: el.textContent?.trim(),
      href: el.getAttribute('href'),
      visible: el.offsetParent !== null,
    }));
  });
  results.pc.utilItems = await pcPage.evaluate(() => {
    return Array.from(document.querySelectorAll('.site-util a, .site-util button, [data-util-item]')).map((el) => ({
      text: el.textContent?.trim(),
      href: el.getAttribute('href'),
    }));
  });

  // Test switching tab to "우리동네 학생"
  console.log('PC: Clicking 우리동네 학생 tab...');
  const studentTabBtn = await pcPage.$('button:has-text("우리동네 학생"), [role="tab"]:has-text("우리동네 학생"), .provider-home__tab:has-text("우리동네 학생")');
  if (studentTabBtn) {
    await studentTabBtn.click();
    await pcPage.waitForTimeout(2500);
    await pcPage.screenshot({ path: path.join(OUT_DIR, '01-home-pc-student-tab.png'), fullPage: false });
  } else {
    console.log('우리동네 학생 tab button not found');
  }

  // 2. Mobile Viewport
  console.log('--- Checking Mobile Home ---');
  const mobileContext = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });
  const mobilePage = await mobileContext.newPage();
  setupSafetyNetAndLoggers(mobilePage, results.mobile);

  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await mobilePage.waitForTimeout(3000);

  results.mobile.urlAfterLoad = mobilePage.url();
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '01-home-mobile-full.png'), fullPage: true });
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '01-home-mobile-top.png'), fullPage: false });

  await mobilePage.evaluate(() => window.scrollTo(0, 800));
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '01-home-mobile-mid.png'), fullPage: false });

  await mobilePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '01-home-mobile-bottom.png'), fullPage: false });

  results.mobile.anomalies = await inspectTextAnomalies(mobilePage);

  fs.writeFileSync(path.join(OUT_DIR, 'home-results.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('Done home checks. Saved to home-results.json');

  await browser.close();
}

run().catch(console.error);
