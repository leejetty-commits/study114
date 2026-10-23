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
    console.warn(`[SAFETY NET BLOCKED] ${method} ${url}`);
    route.abort();
  });

  const buttons = [
    { name: 'util-guide', selector: 'button[data-action="util-guide"]' },
    { name: 'util-messages', selector: 'button[data-action="util-messages"]' },
    { name: 'util-recent', selector: 'button[data-action="util-recent"]' },
    { name: 'util-mypage', selector: 'button[data-action="util-mypage"]' },
    { name: 'tutorbox-messages', selector: '.my-box a:has-text("쪽지 후기함")' },
    { name: 'tutorbox-mypage', selector: '.my-box a:has-text("마이페이지")' },
  ];

  const results = [];

  for (const b of buttons) {
    console.log(`\n=== Testing ${b.name} ===`);
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

      const el = await page.$(b.selector);
      if (!el) {
        console.warn(`Element not found for ${b.name}`);
        results.push({ name: b.name, status: 'not_found' });
        continue;
      }

      console.log(`Clicking ${b.name}...`);
      await el.click();
      await page.waitForTimeout(2500);

      const finalUrl = page.url();
      const pageTitle = await page.title();
      console.log(`Landed at: ${finalUrl} (Title: ${pageTitle})`);

      const shotName = `02-util-${b.name}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, shotName), fullPage: false });

      results.push({
        name: b.name,
        selector: b.selector,
        finalUrl,
        pageTitle,
        screenshot: shotName,
        consoleErrors: consoleErrors.filter((e) => !e.includes('tickets.php') && !e.includes('403')),
        failedRequests: failedRequests.filter((r) => !r.url.includes('tickets.php')),
      });
    } catch (e) {
      console.error(`Error testing ${b.name}:`, e.message);
      results.push({ name: b.name, error: e.message });
    } finally {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('response', onResponse);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'util-results.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nSaved util results to util-results.json');

  await browser.close();
}

main().catch(console.error);
