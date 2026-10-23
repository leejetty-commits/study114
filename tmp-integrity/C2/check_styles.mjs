import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C2';

const CHECK_PATHS = [
  { name: 'tutor_hub', path: '#/mypage/registrations/tutors/9' },
  { name: 'tutor_basic', path: '#/mypage/registrations/tutors/9/basic' },
  { name: 'tutor_detail', path: '#/mypage/registrations/tutors/9/detail' },
  { name: 'tutor_inquiries', path: '#/mypage/registrations/tutors/9/inquiries' },
  { name: 'tutor_publish', path: '#/mypage/registrations/tutors/9/publish' },
  { name: 'messages', path: '#/mypage/messages' },
  { name: 'recent', path: '#/mypage/recent' },
  { name: 'student_review', path: '#/mypage/student-review' },
  { name: 'wishlist', path: '#/mypage/wishlist' },
  { name: 'contact', path: '#/mypage/contact' },
  { name: 'plans', path: '#/mypage/plans' },
  { name: 'plans_my', path: '#/mypage/plans/my' },
  { name: 'plans_history', path: '#/mypage/plans/history' },
  { name: 'submission_docs', path: '#/mypage/submission-docs' },
  { name: 'submission_board', path: '#/mypage/submission-board' },
  { name: 'account', path: '#/mypage/account' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // 안전장치
  await page.route('**/api/**', (route, request) => {
    if (request.method() !== 'GET' && !request.url().includes('/api/search/search.php')) {
      route.abort('blockedbyclient');
    } else {
      route.continue();
    }
  });

  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const styleReport = [];

  for (const item of CHECK_PATHS) {
    await page.goto(`${BASE_URL}/${item.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const breadcrumb = document.querySelector('.mypage-breadcrumb');
      const sideActive = document.querySelector('.mypage-nav__link.is-active');
      const subTabs = Array.from(document.querySelectorAll('.mp-room__tab')).map(t => ({
        text: t.innerText.trim(),
        active: t.classList.contains('is-active'),
      }));

      // Horizontal overflow check
      const bodyWidth = document.body.scrollWidth;
      const windowWidth = window.innerWidth;
      const hasHorizontalScroll = bodyWidth > windowWidth;

      let h1Style = null;
      if (h1) {
        const computed = window.getComputedStyle(h1);
        h1Style = {
          text: h1.innerText.trim(),
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          textAlign: computed.textAlign,
          color: computed.color,
          margin: computed.margin,
          padding: computed.padding,
        };
      }

      return {
        h1Style,
        breadcrumbText: breadcrumb ? breadcrumb.innerText.trim() : null,
        sideActiveText: sideActive ? sideActive.innerText.trim() : null,
        subTabs,
        hasHorizontalScroll,
        scrollDiff: bodyWidth - windowWidth,
      };
    });

    styleReport.push({
      name: item.name,
      path: item.path,
      ...data,
    });
  }

  // Also check mobile horizontal overflow
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileReport = [];

  for (const item of CHECK_PATHS) {
    await page.goto(`${BASE_URL}/${item.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const mData = await page.evaluate(() => {
      const bodyWidth = document.documentElement.scrollWidth;
      const windowWidth = window.innerWidth;
      const hasHorizontalScroll = bodyWidth > windowWidth;
      const h1 = document.querySelector('h1');
      return {
        hasHorizontalScroll,
        scrollDiff: bodyWidth - windowWidth,
        h1Text: h1 ? h1.innerText.trim() : '',
        h1FontSize: h1 ? window.getComputedStyle(h1).fontSize : '',
      };
    });

    mobileReport.push({
      name: item.name,
      path: item.path,
      ...mData,
    });
  }

  await browser.close();

  fs.writeFileSync(`${OUT_DIR}/style_report.json`, JSON.stringify({ pc: styleReport, mobile: mobileReport }, null, 2), 'utf-8');
  console.log('Style report saved!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
