import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C2';

const URLS_PART_B = [
  { name: '15_mypage_home', path: '#/mypage/home' },
  { name: '16_messages', path: '#/mypage/messages' },
  { name: '17_recent', path: '#/mypage/recent' },
  { name: '18_student_review', path: '#/mypage/student-review' },
  { name: '19_wishlist', path: '#/mypage/wishlist' },
  { name: '20_contact', path: '#/mypage/contact' },
  { name: '21_plans', path: '#/mypage/plans' },
  { name: '22_plans_my', path: '#/mypage/plans/my' },
  { name: '23_plans_history', path: '#/mypage/plans/history' },
  { name: '24_submission_docs', path: '#/mypage/submission-docs' },
  { name: '25_submission_board', path: '#/mypage/submission-board' },
  { name: '26_account', path: '#/mypage/account' },
];

async function runDevice(deviceType, viewport) {
  console.log(`\n=== Running Part B for ${deviceType} (${viewport.width}x${viewport.height}) ===`);
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

  for (const item of URLS_PART_B) {
    const screenLogs = {
      name: item.name,
      targetPath: item.path,
      device: deviceType,
      consoleErrors: [],
      pageErrors: [],
      httpFailures: [],
      finalUrl: '',
      title: '',
      suspiciousStrings: [],
      headings: [],
      tabsState: [],
      subTabsState: [],
      buttonsState: [],
      inputsState: [],
      emptyStateDetected: false,
      textPreview: '',
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

    // Check if there are sub-tabs to interact with (e.g. in messages or plans)
    const subTabInfo = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tab, [role="tab"], button.tab-btn, .msg-tab, .filter-tab, .sub-tab')).map(el => ({
        text: el.innerText.trim(),
        active: el.classList.contains('active') || el.getAttribute('aria-selected') === 'true',
        id: el.id,
        className: el.className
      }));
      return tabs;
    });
    screenLogs.subTabsState = subTabInfo;

    // Screenshot
    const ssPath = `${OUT_DIR}/screenshots/${deviceType}/${item.name}.png`;
    await page.screenshot({ path: ssPath, fullPage: true });
    screenLogs.screenshot = ssPath;

    // DOM inspections
    const inspection = await page.evaluate(() => {
      const text = document.body.innerText;
      const suspicious = [];
      const regexPatterns = [
        /\bundefined\b/gi,
        /\bnull\b/gi,
        /\bNaN\b/gi,
        /공부방/g,
        /학부모/g,
        /\[object Object\]/g,
      ];
      for (const re of regexPatterns) {
        const matches = text.match(re);
        if (matches) {
          suspicious.push({ pattern: re.toString(), count: matches.length });
        }
      }

      // Check empty state
      const hasEmptyState = /내역이 없습니다|등록된 내용이 없습니다|최근 열람한|받은 쪽지가 없습니다|문의 내역이 없습니다|관심 학생이 없습니다|아직|목록이 비어/g.test(text);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .screen-title, .page-title, .section-title')).map(h => ({
        tag: h.tagName.toLowerCase(),
        text: h.innerText.trim(),
        className: h.className,
      }));

      const buttons = Array.from(document.querySelectorAll('button, a.button, a.btn, input[type="button"], input[type="submit"]')).map(btn => ({
        text: btn.innerText.trim(),
        disabled: btn.disabled || btn.hasAttribute('disabled'),
        className: btn.className,
      }));

      const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id,
        value: el.value ? (el.value.length > 30 ? el.value.slice(0, 30) + '...' : el.value) : '',
        disabled: el.disabled,
        placeholder: el.getAttribute('placeholder') || '',
      }));

      return {
        suspicious,
        headings,
        buttons: buttons.slice(0, 30),
        inputs: inputs.slice(0, 30),
        hasEmptyState,
        textPreview: text.slice(0, 500),
      };
    });

    screenLogs.suspiciousStrings = inspection.suspicious;
    screenLogs.headings = inspection.headings;
    screenLogs.buttonsState = inspection.buttons;
    screenLogs.inputsState = inspection.inputs;
    screenLogs.emptyStateDetected = inspection.hasEmptyState;
    screenLogs.textPreview = inspection.textPreview;

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

  fs.writeFileSync(`${OUT_DIR}/part_b_summary.json`, JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Part B finished! Results saved to part_b_summary.json');
}

main().catch(err => {
  console.error('Fatal in Part B:', err);
  process.exit(1);
});
