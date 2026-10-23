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
        url: res.url(),
        method: res.request().method(),
        body: body.slice(0, 200),
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
  const results = {};

  // =========================================================
  // 1. Search Details (Student in Dobong-gu, Tutor in Yangju-si)
  // =========================================================
  const pcContext = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });
  const pcPage = await pcContext.newPage();
  const searchLogs = { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] };
  setupSafetyNet(pcPage, searchLogs);

  console.log('--- 1-1. Student Search: Seoul -> Dobong-gu ---');
  await pcPage.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(2500);

  // Region cascade
  const sido = await pcPage.$('select[data-field="region_sido"]');
  if (sido) {
    await sido.selectOption('서울특별시');
    await pcPage.waitForTimeout(1000);
    const city = await pcPage.$('select[data-field="region_city"]');
    if (city) {
      await city.selectOption('도봉구');
      await pcPage.waitForTimeout(1000);
    }
  }

  const submit = await pcPage.$('button.search-form__submit, button[type="submit"]');
  if (submit) {
    await submit.click();
    await pcPage.waitForTimeout(3000);
  }

  await pcPage.screenshot({ path: path.join(OUT_DIR, '03-student-search-dobong-results.png'), fullPage: false });

  // Find student card
  const studentCard = await pcPage.$('.tier-card, article:has-text("이종현학생2"), .expo-card');
  if (studentCard) {
    console.log('Clicking student card for Dobong-gu...');
    await studentCard.click();
    await pcPage.waitForTimeout(2000);
    await pcPage.screenshot({ path: path.join(OUT_DIR, '04-student-detail-modal.png'), fullPage: false });

    results.studentModalInfo = await pcPage.evaluate(() => {
      const m = document.querySelector('#p24-detail-modal');
      return m ? {
        title: m.querySelector('.p24-modal__title, h2, h3')?.innerText,
        text: m.innerText,
        buttons: Array.from(m.querySelectorAll('button, a')).map(b => b.textContent.trim()),
      } : null;
    });

    // Check memo modal
    const memoBtn = await pcPage.$('#p24-detail-modal button:has-text("쪽지"), #p24-detail-modal button:has-text("메모")');
    if (memoBtn) {
      console.log('Clicking student memo button...');
      await memoBtn.click();
      await pcPage.waitForTimeout(1500);
      await pcPage.screenshot({ path: path.join(OUT_DIR, '04-student-memo-compose-dialog.png'), fullPage: false });

      results.studentMemoDialog = await pcPage.evaluate(() => {
        const m = document.querySelector('.modal:not(#p24-detail-modal), .dialog, [role="dialog"]');
        return m ? m.innerText : document.body.innerText.slice(0, 500);
      });

      const closeCompose = await pcPage.$('.modal__close, button:has-text("취소"), [data-action="close"]');
      if (closeCompose) await closeCompose.click();
      await pcPage.waitForTimeout(1000);
    }

    const closeDetail = await pcPage.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeDetail) await closeDetail.click();
    await pcPage.waitForTimeout(1000);
  }

  console.log('--- 1-2. Tutor Search: Gyeonggi-do -> Yangju-si ---');
  await pcPage.goto(`${BASE_URL}/search/#/search/tutor?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(2500);

  const tutorSido = await pcPage.$('select[data-field="region_sido"]');
  if (tutorSido) {
    await tutorSido.selectOption('경기도');
    await pcPage.waitForTimeout(1000);
    const tutorCity = await pcPage.$('select[data-field="region_city"]');
    if (tutorCity) {
      await tutorCity.selectOption('양주시');
      await pcPage.waitForTimeout(1000);
    }
  }

  const tutorSubmit = await pcPage.$('button.search-form__submit, button[type="submit"]');
  if (tutorSubmit) {
    await tutorSubmit.click();
    await pcPage.waitForTimeout(3000);
  }

  await pcPage.screenshot({ path: path.join(OUT_DIR, '03-tutor-search-yangju-results.png'), fullPage: false });

  const tutorCard = await pcPage.$('.tier-card, article:has-text("최고수학샘2"), .expo-card');
  if (tutorCard) {
    console.log('Clicking tutor card for Yangju...');
    await tutorCard.click();
    await pcPage.waitForTimeout(2000);
    await pcPage.screenshot({ path: path.join(OUT_DIR, '04-tutor-detail-modal.png'), fullPage: false });

    results.tutorModalInfo = await pcPage.evaluate(() => {
      const m = document.querySelector('#p24-detail-modal');
      return m ? {
        title: m.querySelector('.p24-modal__title, h2, h3')?.innerText,
        text: m.innerText,
        buttons: Array.from(m.querySelectorAll('button, a')).map(b => b.textContent.trim()),
      } : null;
    });

    const closeTutor = await pcPage.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeTutor) await closeTutor.click();
    await pcPage.waitForTimeout(1000);
  }

  // =========================================================
  // 2. Study Room Details 6, 7, 8 (PC and Mobile)
  // =========================================================
  console.log('--- 2. Study Room Details (6, 7, 8) ---');
  const rooms = [6, 7, 8];
  results.studyRooms = {};

  for (const roomId of rooms) {
    console.log(`Checking Study Room ${roomId}...`);
    const roomLogs = { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] };
    const rPage = await pcContext.newPage();
    setupSafetyNet(rPage, roomLogs);

    // PC Check
    const roomUrl = `${BASE_URL}/#/myshop/study-room/${roomId}`;
    await rPage.goto(roomUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await rPage.waitForTimeout(3000);

    const pcShot = `04-studyroom-${roomId}-pc.png`;
    const pcFullShot = `04-studyroom-${roomId}-pc-full.png`;
    await rPage.screenshot({ path: path.join(OUT_DIR, pcShot), fullPage: false });
    await rPage.screenshot({ path: path.join(OUT_DIR, pcFullShot), fullPage: true });

    const roomDetails = await rPage.evaluate(() => {
      const shop = document.querySelector('article.shop, [data-shop], [data-myshop]');
      const sections = Array.from(document.querySelectorAll('section, [data-section], [data-shop-section]')).map(s => ({
        tag: s.tagName,
        id: s.id,
        className: s.className,
        dataset: Object.assign({}, s.dataset),
        title: s.querySelector('h2, h3, h4')?.textContent?.trim(),
      }));
      return {
        url: window.location.href,
        shopFound: Boolean(shop),
        shopSectionsAttr: shop?.getAttribute('data-shop-sections'),
        sections,
        bodyText: document.body.innerText.slice(0, 2000),
      };
    });

    // Check inquiry/contact button - open modal, inspect, DO NOT SEND, close!
    const inquiryBtn = await rPage.$('button:has-text("문의하기"), button:has-text("쪽지"), [data-action="inquiry"], [data-action="open-inquiry"]');
    if (inquiryBtn) {
      console.log(`Room ${roomId}: Clicking inquiry button...`);
      await inquiryBtn.click();
      await rPage.waitForTimeout(1500);
      const modalShot = `04-studyroom-${roomId}-inquiry-modal.png`;
      await rPage.screenshot({ path: path.join(OUT_DIR, modalShot), fullPage: false });

      const closeInquiry = await rPage.$('.modal__close, button:has-text("취소"), [data-action="close"]');
      if (closeInquiry) await closeInquiry.click();
      await rPage.waitForTimeout(1000);
    }

    results.studyRooms[roomId] = {
      pc: roomDetails,
      logs: roomLogs,
    };
    await rPage.close();
  }

  // Mobile Check for Study Room 7
  console.log('Mobile check for Study Room 7...');
  const mobContext = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });
  const mobPage = await mobContext.newPage();
  setupSafetyNet(mobPage, { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] });
  await mobPage.goto(`${BASE_URL}/#/myshop/study-room/7`, { waitUntil: 'networkidle', timeout: 45000 });
  await mobPage.waitForTimeout(3000);
  await mobPage.screenshot({ path: path.join(OUT_DIR, '04-studyroom-7-mobile-full.png'), fullPage: true });
  await mobPage.close();

  // =========================================================
  // 3. Invalid URLs (Scope 5)
  // =========================================================
  console.log('--- 3. Testing Invalid URLs ---');
  results.invalidUrls = {};

  const invalidUrls = [
    { name: 'invalid-room-999999', url: `${BASE_URL}/#/myshop/study-room/999999` },
    { name: 'invalid-tutor-reg-999999', url: `${BASE_URL}/#/mypage/registrations/tutors/999999` },
    { name: 'invalid-tutor-999999', url: `${BASE_URL}/#/tutor/999999` },
    { name: 'invalid-route-xyz', url: `${BASE_URL}/#/some-nonexistent-route-xyz` },
  ];

  for (const inv of invalidUrls) {
    console.log(`Checking invalid URL: ${inv.name} (${inv.url})...`);
    const invLogs = { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] };
    const invPage = await pcContext.newPage();
    setupSafetyNet(invPage, invLogs);

    await invPage.goto(inv.url, { waitUntil: 'networkidle', timeout: 45000 });
    await invPage.waitForTimeout(3000);

    const shotName = `05-invalid-${inv.name}.png`;
    await invPage.screenshot({ path: path.join(OUT_DIR, shotName), fullPage: false });

    results.invalidUrls[inv.name] = {
      requestedUrl: inv.url,
      finalUrl: invPage.url(),
      title: await invPage.title(),
      bodySnippet: (await invPage.evaluate(() => document.body.innerText)).slice(0, 500),
      anomalies: await inspectTextAnomalies(invPage),
      logs: invLogs,
    };
    await invPage.close();
  }

  // =========================================================
  // 4. Own Tutor Profile Check
  // =========================================================
  console.log('--- 4. Checking Own Tutor Profile Screen ---');
  const ownTutorLogs = { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] };
  const ownPage = await pcContext.newPage();
  setupSafetyNet(ownPage, ownTutorLogs);

  await ownPage.goto(`${BASE_URL}/#/mypage/registrations/tutors/9`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(3000);

  await ownPage.screenshot({ path: path.join(OUT_DIR, '04-own-tutor-mypage-pc.png'), fullPage: false });
  await ownPage.screenshot({ path: path.join(OUT_DIR, '04-own-tutor-mypage-full.png'), fullPage: true });

  results.ownTutor = {
    url: ownPage.url(),
    text: (await ownPage.evaluate(() => document.body.innerText)).slice(0, 1500),
    anomalies: await inspectTextAnomalies(ownPage),
  };
  await ownPage.close();

  fs.writeFileSync(path.join(OUT_DIR, 'full-inspection-report.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('Saved full-inspection-report.json successfully.');

  await browser.close();
}

main().catch(console.error);
