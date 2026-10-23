process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  const topHtml = await page.evaluate(() => {
    // find elements containing '마이페이지' or '이용안내'
    const els = Array.from(document.querySelectorAll('*')).filter(el => 
      el.children.length === 0 && (el.textContent.includes('마이페이지') || el.textContent.includes('이용안내'))
    );
    return els.map(el => ({
      text: el.textContent,
      tag: el.tagName,
      outerHTML: el.parentElement?.outerHTML?.slice(0, 500)
    }));
  });

  console.log('Top HTML:', JSON.stringify(topHtml, null, 2));
  await browser.close();
}

main().catch(console.error);
