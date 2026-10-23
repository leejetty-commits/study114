process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:\\work\\study114\\.wt\\integrity-tutor\\tmp-integrity\\C1';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  // Safety net
  await page.route('**/api/**', (route) => {
    const req = route.request();
    const method = req.method();
    const url = req.url();
    if (method === 'GET' || url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
      route.continue();
      return;
    }
    console.warn(`[SAFETY NET BLOCKED] ${method} ${url}`);
    route.abort();
  });

  // 1. Search Student in 도봉구
  console.log('Navigating to student search...');
  await page.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  const sidoSelect = await page.$('select[data-region-sido]');
  if (sidoSelect) {
    await sidoSelect.selectOption({ label: '서울특별시' });
    await page.waitForTimeout(1000);
  }

  const sigunguSelect = await page.$('select[data-find-gu-select]');
  if (sigunguSelect) {
    const opts = await sigunguSelect.$$eval('option', (os) => os.map(o => ({ value: o.value, text: o.textContent.trim() })));
    console.log('Gu options found:', opts.map(o => o.text));
    const dobong = opts.find(o => o.text.includes('도봉구'));
    if (dobong) {
      console.log('Selecting 도봉구...');
      await sigunguSelect.selectOption(dobong.value);
      await page.waitForTimeout(1000);
    }
  }

  const submitBtn = await page.$('button.search-form__submit');
  if (submitBtn) {
    console.log('Clicking search...');
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '03-student-search-dobong.png'), fullPage: false });

  // Look for cards
  const cardElements = await page.evaluate(() => {
    const items = document.querySelectorAll('.tier-card, .search-tier-card, article, [data-card-id]');
    return Array.from(items).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.innerText.slice(0, 150),
    }));
  });
  console.log('Cards in DOM:', cardElements);

  // Click card if present
  const studentCard = await page.$('.tier-card, [data-card-id], article:has-text("이종현학생2")');
  if (studentCard) {
    console.log('Clicking student card...');
    await studentCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '03-student-card-modal-dobong.png'), fullPage: false });

    // Inspect modal text
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('#p24-detail-modal');
      return modal ? modal.innerText : null;
    });
    console.log('Student Modal text:\n', modalText);

    // Look for memo button
    const memoBtn = await page.$('#p24-detail-modal button:has-text("쪽지"), #p24-detail-modal button:has-text("메모")');
    if (memoBtn) {
      console.log('Clicking memo button in modal...');
      await memoBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT_DIR, '03-student-memo-dialog.png'), fullPage: false });

      // Close memo dialog
      const closeMemo = await page.$('.modal__close, button:has-text("취소"), [data-action="close"]');
      if (closeMemo) await closeMemo.click();
      await page.waitForTimeout(1000);
    }

    // Close student detail modal
    const closeDetail = await page.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeDetail) await closeDetail.click();
    await page.waitForTimeout(1000);
  }

  // 2. Search Tutor in 양주시 or 서울특별시
  console.log('\nNavigating to tutor search...');
  await page.goto(`${BASE_URL}/search/#/search/tutor?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  const tutorSido = await page.$('select[data-region-sido]');
  if (tutorSido) {
    await tutorSido.selectOption({ label: '경기도' });
    await page.waitForTimeout(1000);
  }

  const tutorGu = await page.$('select[data-find-gu-select]');
  if (tutorGu) {
    const opts = await tutorGu.$$eval('option', (os) => os.map(o => ({ value: o.value, text: o.textContent.trim() })));
    const yangju = opts.find(o => o.text.includes('양주시'));
    if (yangju) {
      console.log('Selecting 양주시...');
      await tutorGu.selectOption(yangju.value);
      await page.waitForTimeout(1000);
    }
  }

  const tutorSubmit = await page.$('button.search-form__submit');
  if (tutorSubmit) {
    await tutorSubmit.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '03-tutor-search-yangju.png'), fullPage: false });

  // Click tutor card
  const tutorCard = await page.$('.tier-card, [data-card-id], article:has-text("최고수학샘2")');
  if (tutorCard) {
    console.log('Clicking tutor card...');
    await tutorCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '03-tutor-card-modal-yangju.png'), fullPage: false });

    const tutorModalText = await page.evaluate(() => {
      const modal = document.querySelector('#p24-detail-modal');
      return modal ? modal.innerText : null;
    });
    console.log('Tutor Modal text:\n', tutorModalText);

    const closeTutor = await page.$('#p24-detail-modal [data-p24-action="close"], #p24-detail-modal .modal__close');
    if (closeTutor) await closeTutor.click();
  }

  await browser.close();
}

main().catch(console.error);
