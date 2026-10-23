import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function inspectGreeting() {
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
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const greetingEditor = await page.evaluate(() => {
    const editor = document.querySelector('.ng-editor, [data-ng-editor], #neighborhood-greeting-editor');
    const textarea = document.querySelector('textarea.ng-editor__textarea, textarea[name="greeting"], #ng-greeting-input');
    const list = document.querySelector('.ng-history, .ng-list, [data-ng-history]');
    return {
      hasEditor: !!editor,
      editorHtml: editor ? editor.innerHTML : null,
      textareaValue: textarea ? textarea.value : null,
      historyText: list ? list.innerText : null,
      allTextareas: Array.from(document.querySelectorAll('textarea')).map(t => ({
        name: t.name,
        id: t.id,
        placeholder: t.placeholder,
        value: t.value
      }))
    };
  });

  console.log('Greeting Editor info:', JSON.stringify(greetingEditor, null, 2));

  // Also check Home page for greeting
  await page.goto('https://study114.net/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const homeGreeting = await page.evaluate(() => {
    const el = document.querySelector('.neighborhood-greeting, .home-greeting, [data-neighborhood-greeting]');
    return el ? el.innerText : null;
  });
  console.log('Home greeting element:', homeGreeting);

  await context.close();
  await browser.close();
}

inspectGreeting().catch(console.error);
