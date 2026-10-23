process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:\\work\\study114\\.wt\\integrity-tutor\\tmp-integrity\\C1';

function setupSafetyNet(page, logs) {
  page.route('**/api/**', (route) => {
    const req = route.request();
    const method = req.method();
    const url = req.url();
    if (method === 'GET') {
      route.continue();
      return;
    }
    if (url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
      logs.allowedPosts.push({ method, url });
      route.continue();
      return;
    }
    const postData = req.postData() || '';
    if (
      (url.includes('/api/tutor/register.php') || url.includes('/api/study-room/register.php')) &&
      (postData.includes('"action":"masters"') || postData.includes('"action":"load"'))
    ) {
      logs.allowedPosts.push({ method, url, postData: postData.slice(0, 100) });
      route.continue();
      return;
    }
    logs.blockedMutations.push({ method, url, postData: postData.slice(0, 200) });
    console.warn(`[SAFETY NET BLOCKED] ${method} ${url}`);
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
      let body = '';
      try {
        body = await res.text();
      } catch (e) {
        body = '(body read failed)';
      }
      logs.failedRequests.push({
        status: res.status(),
        statusText: res.statusText(),
        url: res.url(),
        method: res.request().method(),
        body: body.slice(0, 300),
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
      if (/\b(undefined|null|NaN|Invalid Date)\b/.test(txt)) {
        textNodes.push({
          text: txt,
          parentTag: node.parentElement?.tagName,
          parentClass: node.parentElement?.className,
          parentHtml: node.parentElement?.outerHTML?.slice(0, 200),
        });
      }
    }
    return textNodes;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = {
    studentSearchPc: { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] },
    studentSearchMobile: { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] },
    tutorSearchPc: { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] },
    roomSearchPc: { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] },
  };

  // 1. Student Search PC
  console.log('=== 1. Student Search PC ===');
  const pcContext = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });
  const pcPage = await pcContext.newPage();
  setupSafetyNet(pcPage, results.studentSearchPc);

  await pcPage.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(3000);

  await pcPage.screenshot({ path: path.join(OUT_DIR, '03-search-student-pc-init.png'), fullPage: false });

  // Check anomalies
  results.studentSearchPc.anomalies = await inspectTextAnomalies(pcPage);

  // Check cards present
  const studentCards = await pcPage.$$('.card, .exposure-card, [data-card-id], article.card-item');
  console.log(`Found ${studentCards.length} cards on Student Search PC`);

  // Test card click to open detail modal
  const firstCard = await pcPage.$('.card, .exposure-card, [data-card-id], article.card-item, .search-results article');
  if (firstCard) {
    console.log('Clicking first student card...');
    await firstCard.click();
    await pcPage.waitForTimeout(2000);
    await pcPage.screenshot({ path: path.join(OUT_DIR, '03-student-detail-modal-pc.png'), fullPage: false });

    // Inspect modal contents
    const modalInfo = await pcPage.evaluate(() => {
      const modal = document.querySelector('#p24-detail-modal, .p24-modal, .modal');
      if (!modal) return null;
      return {
        title: modal.querySelector('.modal__title, .p24-modal__title, h2, h3')?.textContent?.trim(),
        text: modal.innerText?.slice(0, 500),
        buttons: Array.from(modal.querySelectorAll('button, a')).map(b => b.textContent?.trim()),
      };
    });
    console.log('Modal info:', modalInfo);
    results.studentSearchPc.modalInfo = modalInfo;

    // Try opening memo/action button if available, DO NOT SEND, then close
    const memoBtn = await pcPage.$('#p24-detail-modal button:has-text("쪽지"), #p24-detail-modal button:has-text("메모")');
    if (memoBtn) {
      console.log('Found memo button in student detail modal, clicking to open compose modal...');
      await memoBtn.click();
      await pcPage.waitForTimeout(1500);
      await pcPage.screenshot({ path: path.join(OUT_DIR, '03-student-memo-modal-pc.png'), fullPage: false });

      // Close compose modal without sending!
      const closeCompose = await pcPage.$('.modal__close, button:has-text("취소"), button:has-text("닫기"), [data-action="close"]');
      if (closeCompose) {
        console.log('Closing memo modal...');
        await closeCompose.click();
        await pcPage.waitForTimeout(1000);
      }
    }

    // Close detail modal
    const closeDetail = await pcPage.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeDetail) {
      console.log('Closing student detail modal...');
      await closeDetail.click();
      await pcPage.waitForTimeout(1000);
    }
  }

  // Test 0 results search on Student
  console.log('Testing 0 results search on Student...');
  const searchInput = await pcPage.$('input[type="search"], input[name="q"], input[placeholder*="검색"], input.search-input');
  if (searchInput) {
    await searchInput.fill('존재하지않는희귀과목검색어9999');
    await pcPage.keyboard.press('Enter');
    await pcPage.waitForTimeout(2000);
    await pcPage.screenshot({ path: path.join(OUT_DIR, '03-search-student-pc-zero.png'), fullPage: false });
  }

  // 2. Student Search Mobile
  console.log('=== 2. Student Search Mobile ===');
  const mobContext = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });
  const mobPage = await mobContext.newPage();
  setupSafetyNet(mobPage, results.studentSearchMobile);

  await mobPage.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await mobPage.waitForTimeout(3000);
  await mobPage.screenshot({ path: path.join(OUT_DIR, '03-search-student-mobile-init.png'), fullPage: false });
  results.studentSearchMobile.anomalies = await inspectTextAnomalies(mobPage);

  // 3. Tutor Search PC
  console.log('=== 3. Tutor Search PC ===');
  setupSafetyNet(pcPage, results.tutorSearchPc);
  await pcPage.goto(`${BASE_URL}/search/#/search/tutor?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(3000);
  await pcPage.screenshot({ path: path.join(OUT_DIR, '03-search-tutor-pc-init.png'), fullPage: false });
  results.tutorSearchPc.anomalies = await inspectTextAnomalies(pcPage);

  // Click first tutor card to view tutor detail modal
  const firstTutorCard = await pcPage.$('.card, .exposure-card, [data-card-id], article.card-item, .search-results article');
  if (firstTutorCard) {
    console.log('Clicking first tutor card...');
    await firstTutorCard.click();
    await pcPage.waitForTimeout(2000);
    await pcPage.screenshot({ path: path.join(OUT_DIR, '03-tutor-detail-modal-pc.png'), fullPage: false });

    results.tutorSearchPc.modalInfo = await pcPage.evaluate(() => {
      const modal = document.querySelector('#p24-detail-modal, .p24-modal, .modal');
      if (!modal) return null;
      return {
        title: modal.querySelector('.modal__title, .p24-modal__title, h2, h3')?.textContent?.trim(),
        text: modal.innerText?.slice(0, 500),
        buttons: Array.from(modal.querySelectorAll('button, a')).map(b => b.textContent?.trim()),
      };
    });

    const closeTutorDetail = await pcPage.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeTutorDetail) {
      await closeTutorDetail.click();
      await pcPage.waitForTimeout(1000);
    }
  }

  // 4. Study Room Search PC
  console.log('=== 4. Study Room Search PC ===');
  setupSafetyNet(pcPage, results.roomSearchPc);
  await pcPage.goto(`${BASE_URL}/search/#/search/room`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(3000);
  await pcPage.screenshot({ path: path.join(OUT_DIR, '03-search-room-pc-init.png'), fullPage: false });
  results.roomSearchPc.anomalies = await inspectTextAnomalies(pcPage);

  fs.writeFileSync(path.join(OUT_DIR, 'search-results.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('Saved search results to search-results.json');

  await browser.close();
}

main().catch(console.error);
