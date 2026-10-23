import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function inspectForms() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. #/mypage/registrations/tutors/9/basic 조사
  console.log('--- Inspecting /basic ---');
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/basic`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const basicInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea, button')).map(el => ({
      tag: el.tagName,
      name: el.name || el.id || el.getAttribute('data-field') || el.innerText?.slice(0, 20),
      type: el.type,
      value: el.value,
      visible: el.offsetParent !== null
    }));
  });
  console.log('Basic Inputs count:', basicInputs.length);
  const basicText = await page.innerText('body');
  console.log('Basic text preview:', basicText.slice(0, 800));

  // 3. #/mypage/registrations/tutors/9/detail 조사
  console.log('--- Inspecting /detail ---');
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/detail`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const detailInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea, button')).map(el => ({
      tag: el.tagName,
      name: el.name || el.id || el.getAttribute('data-field') || el.innerText?.slice(0, 20),
      type: el.type,
      value: el.value,
      visible: el.offsetParent !== null
    }));
  });
  console.log('Detail Inputs count:', detailInputs.length);
  const detailText = await page.innerText('body');
  console.log('Detail text preview:', detailText.slice(0, 800));

  await browser.close();
}

inspectForms().catch(console.error);
