import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkContactForm() {
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
  await page.goto('https://study114.net/#/support/contact', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const formInfo = await page.evaluate(() => {
    return {
      inputs: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
        tag: el.tagName,
        name: el.name,
        type: el.type,
        id: el.id,
        placeholder: el.placeholder,
        value: el.value,
        checked: el.checked
      })),
      buttons: Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
        text: b.innerText || b.value,
        className: b.className
      }))
    };
  });

  console.log('Contact Form Info:', JSON.stringify(formInfo, null, 2));

  await context.close();
  await browser.close();
}

checkContactForm().catch(console.error);
