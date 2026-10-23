import { createRequire } from 'module';
process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 390, height: 844 },
  });

  const page = await context.newPage();
  await page.route('**/api/**', (route, request) => {
    if (request.method() !== 'GET' && !request.url().includes('/api/search/search.php')) {
      route.abort('blockedbyclient');
    } else {
      route.continue();
    }
  });

  await page.goto(`${BASE_URL}/#/mypage/submission-board`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const overflowElements = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const all = Array.from(document.querySelectorAll('*'));
    const overflowing = [];
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 2) {
        overflowing.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          right: rect.right,
          diff: rect.right - docWidth,
          text: el.innerText ? el.innerText.slice(0, 50).replace(/\n/g, ' ') : '',
        });
      }
    }
    return overflowing.slice(0, 15);
  });

  console.log('Overflowing elements in submission-board:', overflowElements);

  await browser.close();
}

main().catch(console.error);
