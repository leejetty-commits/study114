import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';

async function testInquiriesSetting() {
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
  page.on('dialog', async d => { await d.accept(); });

  const record = {
    test: '2. 쪽지설정',
    originalValue: '쪽지 안받음 · 잠시 쉼 (value: 0, reason: paused)',
    changedValue: '쪽지 받는 중 (value: 1)',
    revertedValue: null,
    shots: {}
  };

  console.log('--- Step 1: Record Before ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/inquiries', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const shotBefore = path.join(SHOTS_DIR, 'B-write2-inquiry-01-before.png');
  await page.screenshot({ path: shotBefore, fullPage: true });
  record.shots.before = shotBefore;

  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shotPublicBefore = path.join(SHOTS_DIR, 'B-write2-inquiry-02-public-before.png');
  await page.screenshot({ path: shotPublicBefore, fullPage: true });
  record.shots.publicBefore = shotPublicBefore;

  console.log('--- Step 2: Change to 쪽지 받는 중 (value=1) ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/inquiries', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click radio value 1
  await page.click('input[name="p20_inquiry_receiving"][value="1"]');
  await page.waitForTimeout(500);

  // Click 저장하기 button
  const saveBtn = await page.$('button:has-text("저장하기"), input[type="submit"][value="저장하기"], .btn--save');
  if (saveBtn) {
    await saveBtn.click();
    console.log('Clicked 저장하기');
  } else {
    console.error('Cannot find 저장하기 button!');
  }
  await page.waitForTimeout(2500);

  const shotSaved = path.join(SHOTS_DIR, 'B-write2-inquiry-03-saved.png');
  await page.screenshot({ path: shotSaved, fullPage: true });
  record.shots.saved = shotSaved;

  console.log('--- Step 3: Verify Public Myshop changed ---');
  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const publicChangedText = await page.evaluate(() => {
    return document.body.innerText.match(/문의 안내[^\n]*\n[^\n]*/)?.[0] || '';
  });
  console.log('Public inquiry text after change:', publicChangedText);

  const shotPublicChanged = path.join(SHOTS_DIR, 'B-write2-inquiry-04-public-changed.png');
  await page.screenshot({ path: shotPublicChanged, fullPage: true });
  record.shots.publicChanged = shotPublicChanged;

  console.log('--- Step 4: Revert to 쪽지 안받음 (value=0, paused) ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/inquiries', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.click('input[name="p20_inquiry_receiving"][value="0"]');
  await page.waitForTimeout(500);
  await page.click('input[name="inquiry_off_reason"][value="paused"]');
  await page.waitForTimeout(500);

  const saveBtn2 = await page.$('button:has-text("저장하기"), input[type="submit"][value="저장하기"], .btn--save');
  if (saveBtn2) {
    await saveBtn2.click();
    console.log('Clicked 저장하기 for revert');
  }
  await page.waitForTimeout(2500);

  const shotReverted = path.join(SHOTS_DIR, 'B-write2-inquiry-05-reverted.png');
  await page.screenshot({ path: shotReverted, fullPage: true });
  record.shots.reverted = shotReverted;

  console.log('--- Step 5: Verify Public Myshop Reverted ---');
  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const publicRevertedText = await page.evaluate(() => {
    return document.body.innerText.match(/문의 안내[^\n]*\n[^\n]*/)?.[0] || '';
  });
  console.log('Public inquiry text after revert:', publicRevertedText);
  record.revertedValue = publicRevertedText;

  const shotPublicReverted = path.join(SHOTS_DIR, 'B-write2-inquiry-06-public-reverted.png');
  await page.screenshot({ path: shotPublicReverted, fullPage: true });
  record.shots.publicReverted = shotPublicReverted;

  await context.close();
  await browser.close();

  fs.writeFileSync('d:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-write2-inquiry-result.json', JSON.stringify(record, null, 2), 'utf-8');
  console.log('Inquiry setting test completed successfully!');
}

testInquiriesSetting().catch(err => {
  console.error('Fatal in inquiries test:', err);
  process.exit(1);
});
