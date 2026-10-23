import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C2';

const URLS_PART_C = [
  { name: '27_guard_students', path: '#/mypage/registrations/students' },
  { name: '28_guard_study_rooms', path: '#/mypage/registrations/study-rooms' },
  { name: '29_other_tutor_1_hub', path: '#/mypage/registrations/tutors/1' },
  { name: '30_other_tutor_1_basic', path: '#/mypage/registrations/tutors/1/basic' },
  { name: '31_other_tutor_8_basic', path: '#/mypage/registrations/tutors/8/basic' },
  { name: '32_other_tutor_10_basic', path: '#/mypage/registrations/tutors/10/basic' },
  { name: '33_other_tutor_999_basic', path: '#/mypage/registrations/tutors/999/basic' },
];

async function runDevice(deviceType, viewport) {
  console.log(`\n=== Running Part C for ${deviceType} (${viewport.width}x${viewport.height}) ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: viewport,
  });

  const page = await context.newPage();

  const allowedPostUrls = ['/api/search/search.php'];
  const blockedRequests = [];
  await page.route('**/api/**', (route, request) => {
    const method = request.method();
    const url = request.url();
    if (method !== 'GET') {
      const isAllowed = allowedPostUrls.some(allowed => url.includes(allowed));
      if (isAllowed) {
        route.continue();
      } else {
        console.warn(`[SAFETY BLOCKED] ${method} ${url}`);
        blockedRequests.push({ method, url, postData: request.postData() });
        route.abort('blockedbyclient');
      }
    } else {
      route.continue();
    }
  });

  const logs = [];

  // Initialize session by visiting tutor home first
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  for (const item of URLS_PART_C) {
    const screenLogs = {
      name: item.name,
      targetPath: item.path,
      device: deviceType,
      consoleErrors: [],
      pageErrors: [],
      httpFailures: [],
      finalUrl: '',
      title: '',
      headings: [],
      textPreview: '',
      hasBlockedIndicator: false,
      visibleTutorName: '',
      visibleInputs: [],
    };

    const consoleHandler = msg => {
      if (msg.type() === 'error') {
        screenLogs.consoleErrors.push(msg.text());
      }
    };
    const pageErrorHandler = err => {
      screenLogs.pageErrors.push(err.message || String(err));
    };
    const responseHandler = resp => {
      if (resp.status() >= 400) {
        screenLogs.httpFailures.push({ url: resp.url(), status: resp.status() });
      }
    };

    page.on('console', consoleHandler);
    page.on('pageerror', pageErrorHandler);
    page.on('response', responseHandler);

    console.log(`Visiting ${item.path}...`);
    try {
      await page.goto(`${BASE_URL}/${item.path}`, { waitUntil: 'networkidle' });
    } catch (e) {
      console.error(`Navigation error for ${item.path}:`, e.message);
    }
    await page.waitForTimeout(3000);

    screenLogs.finalUrl = page.url();
    screenLogs.title = await page.title();

    // Screenshot
    const ssPath = `${OUT_DIR}/screenshots/${deviceType}/${item.name}.png`;
    await page.screenshot({ path: ssPath, fullPage: true });
    screenLogs.screenshot = ssPath;

    // DOM inspections
    const inspection = await page.evaluate(() => {
      const text = document.body.innerText;
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .screen-title, .page-title')).map(h => ({
        tag: h.tagName.toLowerCase(),
        text: h.innerText.trim(),
      }));

      // Check for blocked/error messages
      const isBlocked = /권한이 없거나|접근할 수 없|존재하지 않거나|잘못된 접근|접근 불가|등록 권한|로그인 계정/g.test(text);

      // Check visible inputs (for basic info leakage)
      const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
        id: el.id,
        name: el.getAttribute('name') || '',
        value: el.value || '',
      })).filter(i => i.value);

      return {
        headings,
        isBlocked,
        textPreview: text.slice(0, 600),
        inputs,
      };
    });

    screenLogs.headings = inspection.headings;
    screenLogs.hasBlockedIndicator = inspection.isBlocked;
    screenLogs.textPreview = inspection.textPreview;
    screenLogs.visibleInputs = inspection.inputs;

    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);
    page.off('response', responseHandler);

    logs.push(screenLogs);
  }

  await browser.close();
  return { logs, blockedRequests };
}

async function main() {
  const pcResults = await runDevice('pc', { width: 1440, height: 900 });
  const mobileResults = await runDevice('mobile', { width: 390, height: 844 });

  const summary = {
    pc: pcResults.logs,
    mobile: mobileResults.logs,
    blockedRequests: [...pcResults.blockedRequests, ...mobileResults.blockedRequests],
  };

  fs.writeFileSync(`${OUT_DIR}/part_c_summary.json`, JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Part C finished! Results saved to part_c_summary.json');
}

main().catch(err => {
  console.error('Fatal in Part C:', err);
  process.exit(1);
});
