import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkCommunity() {
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

  const elements = await page.evaluate(() => {
    return {
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        className: b.className,
        id: b.id,
        visible: b.offsetParent !== null
      })),
      links: Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.getAttribute('href'),
        className: a.className,
        visible: a.offsetParent !== null
      })),
      boardHtmlSnippet: document.querySelector('.community-board, .community-screen, main')?.innerHTML?.slice(0, 1500)
    };
  });

  console.log('Buttons:', JSON.stringify(elements.buttons, null, 2));
  console.log('Links with write or 글:', JSON.stringify(elements.links.filter(l => l.text.includes('글') || l.text.includes('작성') || (l.href && l.href.includes('write'))), null, 2));
  console.log('Board snippet:\n', elements.boardHtmlSnippet);

  await context.close();
  await browser.close();
}

checkCommunity().catch(console.error);
