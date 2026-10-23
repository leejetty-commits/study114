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

  page.route('**/api/**', (route) => {
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

  await page.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  // Trigger sido change to 서울특별시
  await page.evaluate(() => {
    const sido = document.getElementById('find_student_region_sido');
    sido.value = '서울특별시';
    sido.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(1000);

  // Check city options
  const cityInfo = await page.evaluate(() => {
    const city = document.getElementById('find_student_region_city');
    return Array.from(city.options).map(o => ({ value: o.value, text: o.text }));
  });
  console.log('City options after sido change:', cityInfo.slice(0, 10));

  // Select 도봉구 in city
  await page.evaluate(() => {
    const city = document.getElementById('find_student_region_city');
    const opt = Array.from(city.options).find(o => o.text.includes('도봉구'));
    if (opt) {
      city.value = opt.value;
      city.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1000);

  // Check hidden region_id
  const regionIdVal = await page.evaluate(() => {
    const hidden = document.querySelector('input[data-field="region_id"], input[name="f_preferred_region_id"]');
    return hidden ? hidden.value : 'not found';
  });
  console.log('Hidden region_id value:', regionIdVal);

  // Click submit
  const submitBtn = await page.$('.search-form__submit');
  await submitBtn.click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(OUT_DIR, '03-student-search-dobong-success.png'), fullPage: false });

  // Check card
  const cards = await page.$$eval('article, .card-item, .tier-card, [data-card-id]', (els) =>
    els.map(el => ({ tag: el.tagName, className: el.className, text: el.innerText }))
  );
  console.log('Student Cards found:', cards);

  // Click on the student card
  const cardEl = await page.$('article:has-text("이종현학생2"), .search-results article, .search-tier-results article');
  if (cardEl) {
    console.log('Clicking student card...');
    await cardEl.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '04-student-detail-modal-success.png'), fullPage: false });

    const modalText = await page.evaluate(() => {
      const m = document.querySelector('#p24-detail-modal');
      return m ? m.innerText : 'null';
    });
    console.log('Modal text:\n', modalText);

    // Click memo
    const memoBtn = await page.$('#p24-detail-modal button:has-text("쪽지"), #p24-detail-modal button:has-text("메모")');
    if (memoBtn) {
      console.log('Clicking memo button in modal...');
      await memoBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT_DIR, '04-student-memo-compose-success.png'), fullPage: false });

      const composeText = await page.evaluate(() => {
        const m = document.querySelector('.modal:not(#p24-detail-modal), [role="dialog"], .compose-modal');
        return m ? m.innerText : 'no compose modal';
      });
      console.log('Compose modal text:\n', composeText);

      // Close compose modal
      const closeCompose = await page.$('.modal__close, button:has-text("취소"), [data-action="close"]');
      if (closeCompose) await closeCompose.click();
    }
  }

  await browser.close();
}

main().catch(console.error);
