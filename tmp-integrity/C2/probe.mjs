import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C2';

async function main() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // 안전장치
  const nonGetRequests = [];
  await page.route('**/api/**', (route, request) => {
    const method = request.method();
    const url = request.url();
    if (method !== 'GET') {
      if (url.includes('/api/search/search.php')) {
        route.continue();
      } else {
        console.warn(`[SAFETY ABORT] Blocked non-GET API call: ${method} ${url}`);
        nonGetRequests.push({ method, url, postData: request.postData() });
        route.abort('blockedbyclient');
      }
    } else {
      route.continue();
    }
  });

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedRequests.push({ url: resp.url(), status: resp.status() });
    }
  });

  console.log('Navigating to mypage...');
  await page.goto(`${BASE_URL}/#/mypage/home`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log('Current URL after home:', currentUrl);

  await page.goto(`${BASE_URL}/#/mypage/registrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Current URL after registrations:', page.url());

  // Extract tutor info from page state if available
  const evalResult = await page.evaluate(() => {
    const navText = Array.from(document.querySelectorAll('.mypage-nav-item, nav a, .side-nav a, .mypage-nav a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));
    const links = Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href')).filter(Boolean);
    const tutorLinks = links.filter(h => h && h.includes('/mypage/registrations/tutors/'));
    return {
      title: document.title,
      hash: window.location.hash,
      navItems: navText,
      tutorLinks: Array.from(new Set(tutorLinks)),
      bodySnippet: document.body.innerText.slice(0, 500)
    };
  });

  console.log('Page eval result:', JSON.stringify(evalResult, null, 2));

  await browser.close();
}

main().catch(err => {
  console.error('Error in probe:', err);
  process.exit(1);
});
