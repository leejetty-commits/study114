import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C2';

const URLS_PART_A = [
  { name: '01_reg_index', path: '#/mypage/registrations' },
  { name: '02_tutors_list', path: '#/mypage/registrations/tutors' },
  { name: '03_tutors_tab_all', path: '#/mypage/registrations/tutors/tab/all' },
  { name: '04_tutors_tab_draft', path: '#/mypage/registrations/tutors/tab/draft' },
  { name: '05_tutors_tab_published', path: '#/mypage/registrations/tutors/tab/published' },
  { name: '06_tutors_tab_hidden', path: '#/mypage/registrations/tutors/tab/hidden' },
  { name: '07_tutors_tab_not_ready', path: '#/mypage/registrations/tutors/tab/not_ready' },
  { name: '08_tutor_9_hub', path: '#/mypage/registrations/tutors/9' },
  { name: '09_tutor_9_basic', path: '#/mypage/registrations/tutors/9/basic' },
  { name: '10_tutor_9_detail', path: '#/mypage/registrations/tutors/9/detail' },
  { name: '11_tutor_9_publish', path: '#/mypage/registrations/tutors/9/publish' },
  { name: '12_tutor_9_access', path: '#/mypage/registrations/tutors/9/access' },
  { name: '13_tutor_9_inquiries', path: '#/mypage/registrations/tutors/9/inquiries' },
  { name: '14_tutor_9_exposure', path: '#/mypage/registrations/tutors/9/exposure' },
];

async function runDevice(deviceType, viewport) {
  console.log(`\n=== Running Part A for ${deviceType} (${viewport.width}x${viewport.height}) ===`);
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

  // Initialize session by visiting home first
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  for (const item of URLS_PART_A) {
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
      inputsState: [],
      buttonsState: [],
      tabsState: [],
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

      // Check inputs
      const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id,
        value: el.value ? (el.value.length > 30 ? el.value.slice(0, 30) + '...' : el.value) : '',
        disabled: el.disabled,
        placeholder: el.getAttribute('placeholder') || '',
      }));

      // Check buttons
      const buttons = Array.from(document.querySelectorAll('button, a.button, a.btn, input[type="button"], input[type="submit"]')).map(btn => ({
        text: btn.innerText.trim(),
        disabled: btn.disabled || btn.hasAttribute('disabled'),
        className: btn.className,
      }));

      // Check tabs / nav
      const tabs = Array.from(document.querySelectorAll('.tab, [role="tab"], .tutor-tab, .tutor-subnav a, .nav-tab')).map(t => ({
        text: t.innerText.trim(),
        active: t.classList.contains('active') || t.getAttribute('aria-selected') === 'true',
      }));

      // Headings info
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .screen-title, .page-title')).map(h => ({
        tag: h.tagName.toLowerCase(),
        text: h.innerText.trim(),
        className: h.className,
      }));

      return {
        suspicious,
        inputs: inputs.slice(0, 30),
        buttons: buttons.slice(0, 30),
        tabs,
        headings,
        textPreview: text.slice(0, 400),
      };
    });

    screenLogs.suspiciousStrings = inspection.suspicious;
    screenLogs.inputsState = inspection.inputs;
    screenLogs.buttonsState = inspection.buttons;
    screenLogs.tabsState = inspection.tabs;
    screenLogs.headings = inspection.headings;
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

  fs.writeFileSync(`${OUT_DIR}/part_a_summary.json`, JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Part A finished! Results saved to part_a_summary.json');
}

main().catch(err => {
  console.error('Fatal in Part A:', err);
  process.exit(1);
});
