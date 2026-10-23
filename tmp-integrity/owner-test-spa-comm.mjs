import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function testSpaNav() {
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
  console.log('1. Go to Home first');
  await page.goto('https://study114.net/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const authStateHome = await page.evaluate(() => {
    return {
      title: document.title,
      text: document.body.innerText.slice(0, 150)
    };
  });
  console.log('Home auth state:', authStateHome);

  console.log('2. Click on 커뮤니티 GNB link');
  const commLink = await page.$('a.home-gnb__item[href="#/community"]');
  if (commLink) {
    await commLink.click();
  } else {
    await page.evaluate(() => { window.location.hash = '#/community'; });
  }
  await page.waitForTimeout(2000);

  console.log('3. Click on 공부방 고민방 link');
  const dirLink = await page.$('a[href="#/community/director"]');
  if (dirLink) {
    await dirLink.click();
  } else {
    await page.evaluate(() => { window.location.hash = '#/community/director'; });
  }
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
  console.log('Write links after SPA navigation:', writeLinks);

  // Take screenshot
  await page.screenshot({ path: 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner\\B-18-community-director-spa-pc.png', fullPage: true });

  await context.close();
  await browser.close();
}

testSpaNav().catch(console.error);
