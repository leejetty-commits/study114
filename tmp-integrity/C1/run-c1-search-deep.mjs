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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  const logs = { consoleErrors: [], pageErrors: [], failedRequests: [], blockedMutations: [], allowedPosts: [] };
  setupSafetyNet(page, logs);

  const report = {};

  // ==========================================
  // Part 1: Student Search
  // ==========================================
  console.log('--- 1. Testing Student Search Form & Search ---');
  await page.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Inspect form select options
  const sidoSelect = await page.$('select[name="sido"], select[data-region-sido], select:has(option:has-text("서울특별시"))');
  if (sidoSelect) {
    const options = await sidoSelect.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.textContent.trim() })));
    console.log('Sido options count:', options.length);
    // Select 서울특별시
    const seoulOpt = options.find(o => o.text.includes('서울'));
    if (seoulOpt) {
      await sidoSelect.selectOption(seoulOpt.value);
      await page.waitForTimeout(1000);
    }
  }

  // Check sigungu select
  const sigunguSelect = await page.$('select[name="sigungu"], select[data-region-sigungu], select[data-find-gu-select]');
  if (sigunguSelect) {
    const guOpts = await sigunguSelect.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.textContent.trim() })));
    console.log('Gu options:', guOpts.slice(0, 10));
    // Select first real gu (e.g., 강남구 or 도봉구)
    const targetGu = guOpts.find(o => o.text.includes('도봉구') || o.text.includes('강남구') || (o.value && o.value !== ''));
    if (targetGu) {
      console.log('Selecting Gu:', targetGu);
      await sigunguSelect.selectOption(targetGu.value);
      await page.waitForTimeout(1000);
    }
  }

  // Click Submit
  const submitBtn = await page.$('button.search-form__submit, button[type="submit"]:has-text("검색")');
  if (submitBtn) {
    console.log('Clicking search submit...');
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '03-student-search-results.png'), fullPage: false });

  // Check card items
  const studentCards = await page.$$('.card-item, .search-results article, [data-card-id], .card, .tier-card, article');
  console.log(`Student cards found after search: ${studentCards.length}`);

  // Find clickable card
  const cardToClick = await page.$('.search-tier-results article, .search-results article, [data-card-id], .expo-card');
  if (cardToClick) {
    console.log('Clicking student card for detail modal...');
    await cardToClick.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '03-student-detail-modal.png'), fullPage: false });

    // Inspect modal DOM
    report.studentModal = await page.evaluate(() => {
      const modal = document.querySelector('#p24-detail-modal');
      if (!modal) return { open: false };
      return {
        open: true,
        header: modal.querySelector('.p24-modal__header, header')?.innerText,
        title: modal.querySelector('.p24-modal__title, h2, h3')?.innerText,
        badges: Array.from(modal.querySelectorAll('.badge, .token, .chip')).map(b => b.textContent.trim()),
        sections: Array.from(modal.querySelectorAll('section, .p24-section, [data-section]')).map(s => s.getAttribute('data-section') || s.className),
        allText: modal.innerText.slice(0, 1500),
        buttons: Array.from(modal.querySelectorAll('button, a')).map(b => ({
          text: b.textContent.trim(),
          action: b.getAttribute('data-p24-action') || b.getAttribute('data-action') || '',
          disabled: b.hasAttribute('disabled') || b.classList.contains('disabled'),
        })),
      };
    });

    // Check action button: memo
    const memoBtn = await page.$('#p24-detail-modal [data-p24-action="memo"], #p24-detail-modal button:has-text("쪽지"), #p24-detail-modal button:has-text("메모")');
    if (memoBtn) {
      console.log('Clicking student memo button in modal...');
      await memoBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT_DIR, '03-student-memo-compose.png'), fullPage: false });

      // Close memo compose modal
      const closeMemo = await page.$('.modal__close, button:has-text("취소"), [data-action="close"], .btn--cancel');
      if (closeMemo) {
        console.log('Closing memo compose modal...');
        await closeMemo.click();
        await page.waitForTimeout(1000);
      }
    }

    // Close detail modal
    const closeDetail = await page.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeDetail) {
      await closeDetail.click();
      await page.waitForTimeout(1000);
    }
  }

  // ==========================================
  // Part 2: Tutor Search
  // ==========================================
  console.log('--- 2. Testing Tutor Search ---');
  await page.goto(`${BASE_URL}/search/#/search/tutor?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Select Sido
  const tutorSido = await page.$('select[name="sido"], select[data-region-sido], select:has(option:has-text("서울특별시"))');
  if (tutorSido) {
    const opts = await tutorSido.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.textContent.trim() })));
    const seoul = opts.find(o => o.text.includes('서울'));
    if (seoul) {
      await tutorSido.selectOption(seoul.value);
      await page.waitForTimeout(1000);
    }
  }

  const tutorGu = await page.$('select[name="sigungu"], select[data-region-sigungu], select[data-find-gu-select]');
  if (tutorGu) {
    const guOpts = await tutorGu.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.textContent.trim() })));
    const targetGu = guOpts.find(o => o.value && o.value !== '');
    if (targetGu) {
      await tutorGu.selectOption(targetGu.value);
      await page.waitForTimeout(1000);
    }
  }

  const tutorSubmit = await page.$('button.search-form__submit, button[type="submit"]:has-text("검색")');
  if (tutorSubmit) {
    await tutorSubmit.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '03-tutor-search-results.png'), fullPage: false });

  const tutorCard = await page.$('.search-tier-results article, .search-results article, [data-card-id], .expo-card');
  if (tutorCard) {
    console.log('Clicking tutor card for detail modal...');
    await tutorCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '03-tutor-detail-modal.png'), fullPage: false });

    report.tutorModal = await page.evaluate(() => {
      const modal = document.querySelector('#p24-detail-modal');
      if (!modal) return { open: false };
      return {
        open: true,
        header: modal.querySelector('.p24-modal__header, header')?.innerText,
        title: modal.querySelector('.p24-modal__title, h2, h3')?.innerText,
        badges: Array.from(modal.querySelectorAll('.badge, .token, .chip')).map(b => b.textContent.trim()),
        sections: Array.from(modal.querySelectorAll('section, .p24-section, [data-section]')).map(s => s.getAttribute('data-section') || s.className),
        allText: modal.innerText.slice(0, 1500),
        buttons: Array.from(modal.querySelectorAll('button, a')).map(b => ({
          text: b.textContent.trim(),
          action: b.getAttribute('data-p24-action') || b.getAttribute('data-action') || '',
          disabled: b.hasAttribute('disabled') || b.classList.contains('disabled'),
        })),
      };
    });

    const closeTutorDetail = await page.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeTutorDetail) {
      await closeTutorDetail.click();
      await page.waitForTimeout(1000);
    }
  }

  // ==========================================
  // Part 3: 0 Results Check
  // ==========================================
  console.log('--- 3. Testing 0 Results Guidance ---');
  // Choose a sido/gu that has 0 results or filter by unusual subject
  const subjectSelect = await page.$('select[name="main_subject"], select[name="subject"], select[data-field="subject"], select:has(option:has-text("제2외국어"))');
  if (subjectSelect) {
    const sOpts = await subjectSelect.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.textContent.trim() })));
    const rare = sOpts.find(o => o.text.includes('제2외국어') || o.text.includes('기타'));
    if (rare) {
      await subjectSelect.selectOption(rare.value);
    }
  }
  if (tutorSubmit) {
    await tutorSubmit.click();
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: path.join(OUT_DIR, '03-search-tutor-zero.png'), fullPage: false });

  report.logs = logs;
  fs.writeFileSync(path.join(OUT_DIR, 'search-deep-report.json'), JSON.stringify(report, null, 2), 'utf-8');
  console.log('Saved search deep report.');

  await browser.close();
}

main().catch(console.error);
