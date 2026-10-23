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
  await page.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  const formFields = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return 'No form found';
    const fields = Array.from(form.querySelectorAll('input, select, button')).map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.id,
      className: el.className,
      dataAttrs: Object.assign({}, el.dataset),
      value: el.value,
      options: el.tagName === 'SELECT' ? Array.from(el.options).map(o => ({ value: o.value, text: o.text })) : undefined,
    }));
    return fields;
  });

  console.log('Student Form Fields:', JSON.stringify(formFields, null, 2));
  await browser.close();
}

main().catch(console.error);
