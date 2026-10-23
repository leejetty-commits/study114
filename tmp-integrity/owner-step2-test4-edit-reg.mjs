import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';

async function testEditReg() {
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
    test: '4. 마이샵/내 등록 편집',
    field: 'intro_long (공부방 소개 / 자랑)',
    originalValue: '조용합니다.',
    changedValue: '조용합니다. [테스트]',
    revertedValue: null,
    shots: {}
  };

  console.log('--- Step 1: Record Before ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const shotBefore = path.join(SHOTS_DIR, 'B-write4-reg-01-before.png');
  await page.screenshot({ path: shotBefore, fullPage: true });
  record.shots.before = shotBefore;

  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shotPublicBefore = path.join(SHOTS_DIR, 'B-write4-reg-02-public-before.png');
  await page.screenshot({ path: shotPublicBefore, fullPage: true });
  record.shots.publicBefore = shotPublicBefore;

  console.log('--- Step 2: Edit intro_long with [테스트] ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.click('[data-embed-edit]');
  await page.waitForTimeout(1500);

  await page.fill('textarea[name="intro_long"]', record.changedValue);
  await page.waitForTimeout(500);

  // Click 저장 button
  const saveBtn = await page.$('button.btn--primary:has-text("저장")');
  if (saveBtn) {
    await saveBtn.click();
    console.log('Clicked 저장');
  }
  await page.waitForTimeout(3000);

  const shotSaved = path.join(SHOTS_DIR, 'B-write4-reg-03-saved.png');
  await page.screenshot({ path: shotSaved, fullPage: true });
  record.shots.saved = shotSaved;

  console.log('--- Step 3: Check Public Myshop Changed ---');
  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const publicTextAfterChange = await page.evaluate(() => document.body.innerText);
  const changedReflected = publicTextAfterChange.includes('조용합니다. [테스트]');
  console.log('Public myshop reflects change?:', changedReflected);

  const shotPublicChanged = path.join(SHOTS_DIR, 'B-write4-reg-04-public-changed.png');
  await page.screenshot({ path: shotPublicChanged, fullPage: true });
  record.shots.publicChanged = shotPublicChanged;

  console.log('--- Step 4: Revert intro_long to original ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.click('[data-embed-edit]');
  await page.waitForTimeout(1500);

  await page.fill('textarea[name="intro_long"]', record.originalValue);
  await page.waitForTimeout(500);

  const saveBtnRevert = await page.$('button.btn--primary:has-text("저장")');
  if (saveBtnRevert) {
    await saveBtnRevert.click();
    console.log('Clicked 저장 for revert');
  }
  await page.waitForTimeout(3000);

  const shotReverted = path.join(SHOTS_DIR, 'B-write4-reg-05-reverted.png');
  await page.screenshot({ path: shotReverted, fullPage: true });
  record.shots.reverted = shotReverted;

  console.log('--- Step 5: Check Public Myshop Reverted ---');
  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const publicTextAfterRevert = await page.evaluate(() => document.body.innerText);
  const revertedReflected = publicTextAfterRevert.includes('조용합니다.') && !publicTextAfterRevert.includes('조용합니다. [테스트]');
  console.log('Public myshop reflects revert?:', revertedReflected);
  record.revertedValue = revertedReflected ? '조용합니다. (원복 성공)' : '원복 미반영 (실패)';

  const shotPublicReverted = path.join(SHOTS_DIR, 'B-write4-reg-06-public-reverted.png');
  await page.screenshot({ path: shotPublicReverted, fullPage: true });
  record.shots.publicReverted = shotPublicReverted;

  await context.close();
  await browser.close();

  fs.writeFileSync('d:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-write4-reg-result.json', JSON.stringify(record, null, 2), 'utf-8');
  console.log('Edit registration test completed successfully!');
}

testEditReg().catch(err => {
  console.error('Fatal in edit reg test:', err);
  process.exit(1);
});
