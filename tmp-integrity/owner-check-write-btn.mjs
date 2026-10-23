import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkWriteButton() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  await page.goto('https://study114.net/#/community/director', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const writeLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button'))
      .map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        href: el.getAttribute('href'),
        className: el.className,
        visible: el.offsetParent !== null
      }))
      .filter(el => el.text.includes('글쓰기') || (el.href && el.href.includes('/new')));
  });

  console.log('Write links found:', JSON.stringify(writeLinks, null, 2));

  await context.close();
  await browser.close();
}

checkWriteButton().catch(console.error);
