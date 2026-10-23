import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkDirectorBoard() {
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
  const responses = [];

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('board') || url.includes('concern') || url.includes('community')) {
      let body = '';
      try {
        body = await res.text();
      } catch (e) {}
      responses.push({
        url,
        status: res.status(),
        body: body.slice(0, 500)
      });
    }
  });

  console.log('Navigating to https://study114.net/#/community/director...');
  await page.goto('https://study114.net/#/community/director', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Board API responses:', JSON.stringify(responses, null, 2));

  // Check state role
  const clientState = await page.evaluate(() => {
    return {
      navRole: window.__study114_nav_role || localStorage.getItem('study114_role') || sessionStorage.getItem('study114_role'),
      user: window.__study114_auth_user || null,
      cookies: document.cookie
    };
  });
  console.log('Client State:', clientState);

  // Now try navigating to #/community/director/new
  console.log('Navigating to https://study114.net/#/community/director/new...');
  await page.goto('https://study114.net/#/community/director/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const composeHtml = await page.evaluate(() => {
    const form = document.querySelector('form.concern-compose-form');
    const card = document.querySelector('.concern-compose');
    return {
      hasForm: !!form,
      composeHtml: card ? card.innerHTML.slice(0, 1000) : document.body.innerText.slice(0, 1000)
    };
  });
  console.log('Compose page check:', composeHtml);

  await context.close();
  await browser.close();
}

checkDirectorBoard().catch(console.error);
