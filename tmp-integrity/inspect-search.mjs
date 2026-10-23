import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log('REQ:', req.method(), req.url());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      console.log('RES:', res.status(), res.url());
      if (res.url().includes('search')) {
        try {
          const json = await res.json();
          console.log('SEARCH JSON SAMPLE:', JSON.stringify(json).slice(0, 300));
        } catch (e) {}
      }
    }
  });

  await page.goto('https://study114.net/search/#/search/room', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT PREVIEW:\n', text.slice(0, 1000));

  await browser.close();
}

main().catch(console.error);
