import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkDetailEditMode() {
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
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Clicking 상세정보1 수정 button...');
  await page.click('[data-embed-edit]');
  await page.waitForTimeout(2000);

  const editState = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
      name: el.name,
      type: el.type,
      id: el.id,
      placeholder: el.placeholder,
      value: el.value,
      className: el.className
    }));
    const saveBtn = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('저장') || b.innerText.includes('완료') || b.className.includes('save')).map(b => ({
      text: b.innerText.trim(),
      className: b.className
    }));
    return {
      inputs,
      saveBtn
    };
  });

  console.log('Edit Form elements:', JSON.stringify(editState, null, 2));

  await context.close();
  await browser.close();
}

checkDetailEditMode().catch(console.error);
