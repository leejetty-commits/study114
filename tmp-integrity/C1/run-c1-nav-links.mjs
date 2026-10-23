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
  const blockedRequests = [];
  await page.route('**/api/**', (route) => {
    const method = route.request().method();
    const url = route.request().url();
    if (method === 'GET') {
      route.continue();
      return;
    }
    if (url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
      route.continue();
      return;
    }
    blockedRequests.push({ method, url });
    console.warn(`[SAFETY NET BLOCKED] ${method} ${url}`);
    route.abort();
  });

  const navResults = [];

  // Targets to test in GNB and Util
  const targets = [
    { name: 'gnb-home', selector: 'header nav a:has-text("홈"), .site-gnb a:has-text("홈")' },
    { name: 'gnb-find-tutor', selector: 'header nav a:has-text("과외쌤찾기"), .site-gnb a:has-text("과외쌤찾기")' },
    { name: 'gnb-find-student', selector: 'header nav a:has-text("학생찾기"), .site-gnb a:has-text("학생찾기")' },
    { name: 'gnb-register-tutor', selector: 'header nav a:has-text("과외쌤상세등록"), .site-gnb a:has-text("과외쌤상세등록")' },
    { name: 'gnb-plans', selector: 'header nav a:has-text("유료상품"), .site-gnb a:has-text("유료상품")' },
    { name: 'gnb-community', selector: 'header nav a:has-text("커뮤니티"), .site-gnb a:has-text("커뮤니티")' },
    { name: 'gnb-support', selector: 'header nav a:has-text("고객센터"), .site-gnb a:has-text("고객센터")' },
    { name: 'util-guide', selector: '.site-util a:has-text("이용안내"), .site-util button:has-text("이용안내")' },
    { name: 'util-messages', selector: '.site-util a:has-text("쪽지·후기함"), .site-util button:has-text("쪽지·후기함")' },
    { name: 'util-recent', selector: '.site-util a:has-text("최근열람"), .site-util button:has-text("최근열람")' },
    { name: 'util-mypage', selector: '.site-util a:has-text("마이페이지"), .site-util button:has-text("마이페이지")' },
  ];

  for (const t of targets) {
    console.log(`\n=== Testing ${t.name} ===`);
    const consoleErrors = [];
    const failedRequests = [];

    const onConsole = (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    };
    const onPageError = (err) => {
      consoleErrors.push(`pageerror: ${err.message}`);
    };
    const onResponse = async (res) => {
      if (res.status() >= 400) {
        failedRequests.push({ status: res.status(), url: res.url() });
      }
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('response', onResponse);

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2000);

      const el = await page.$(t.selector);
      if (!el) {
        console.warn(`Element not found for ${t.name}`);
        navResults.push({ name: t.name, status: 'not_found' });
        continue;
      }

      const href = await el.getAttribute('href');
      console.log(`Clicking ${t.name} (href: ${href})...`);
      
      // Click element
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
        el.click(),
      ]);

      await page.waitForTimeout(2500);

      const finalUrl = page.url();
      const pageTitle = await page.title();
      console.log(`Landed at: ${finalUrl} (Title: ${pageTitle})`);

      const shotName = `02-nav-${t.name}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, shotName), fullPage: false });

      navResults.push({
        name: t.name,
        targetSelector: t.selector,
        href,
        finalUrl,
        pageTitle,
        screenshot: shotName,
        consoleErrors: consoleErrors.filter((e) => !e.includes('tickets.php') && !e.includes('403')),
        failedRequests: failedRequests.filter((r) => !r.url.includes('tickets.php')),
      });
    } catch (e) {
      console.error(`Error testing ${t.name}:`, e.message);
      navResults.push({ name: t.name, error: e.message });
    } finally {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('response', onResponse);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'nav-results.json'), JSON.stringify(navResults, null, 2), 'utf-8');
  console.log('\nSaved nav results to nav-results.json');

  await browser.close();
}

main().catch(console.error);
