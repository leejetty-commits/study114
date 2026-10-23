import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';

async function testGreeting() {
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
  page.on('dialog', async dialog => {
    console.log(`Dialog opened: [${dialog.type()}] ${dialog.message()}`);
    await dialog.accept();
  });

  const record = {
    test: '1. 동네 인사',
    originalValue: null,
    changedValue: '[테스트] 무결성 점검',
    revertedValue: null,
    shots: {}
  };

  console.log('--- Step 1: Open Mypage StudyRoom 7 ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check original state
  const origHtml = await page.evaluate(() => {
    const wrap = document.querySelector('[data-ng-history-wrap]');
    const textarea = document.querySelector('[data-ng-body]');
    return {
      history: wrap ? wrap.innerText.trim() : '',
      value: textarea ? textarea.value : ''
    };
  });
  record.originalValue = origHtml.history || '(없음)';
  console.log('Original greeting history:', record.originalValue);

  const shotBefore = path.join(SHOTS_DIR, 'B-write1-greeting-01-before.png');
  await page.screenshot({ path: shotBefore, fullPage: true });
  record.shots.before = shotBefore;

  console.log('--- Step 2: Input and Publish Greeting ---');
  await page.fill('[data-ng-body]', '[테스트] 무결성 점검');
  await page.waitForTimeout(500);
  await page.click('[data-ng-save]');
  await page.waitForTimeout(3000);

  const postedHtml = await page.evaluate(() => {
    const wrap = document.querySelector('[data-ng-history-wrap]');
    const status = document.querySelector('[data-ng-status]');
    return {
      history: wrap ? wrap.innerText.trim() : '',
      status: status ? status.innerText.trim() : ''
    };
  });
  console.log('After publish:', postedHtml);

  const shotPosted = path.join(SHOTS_DIR, 'B-write1-greeting-02-posted.png');
  await page.screenshot({ path: shotPosted, fullPage: true });
  record.shots.posted = shotPosted;

  console.log('--- Step 3: Check Home Page for Greeting ---');
  await page.goto('https://study114.net/#/study-room', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const homeGreetingText = await page.evaluate(() => {
    const cell = document.querySelector('.home-news-row__cell--greeting, [data-home-news="greeting"], [data-ng-rail]');
    return cell ? cell.innerText.trim() : '';
  });
  console.log('Home greeting text:', homeGreetingText);

  const shotHome = path.join(SHOTS_DIR, 'B-write1-greeting-03-home.png');
  await page.screenshot({ path: shotHome, fullPage: true });
  record.shots.home = shotHome;

  console.log('--- Step 4: Back to Mypage to Unpublish and Delete ---');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // If there is a down button, click it
  const hasDown = await page.$('[data-ng-down]');
  if (hasDown) {
    console.log('Clicking down (내리기)...');
    await page.click('[data-ng-down]');
    await page.waitForTimeout(2000);
  }

  // Find delete button
  const delBtn = await page.$('[data-ng-del-history]');
  if (delBtn) {
    console.log('Clicking delete (삭제 ×)...');
    await delBtn.click();
    await page.waitForTimeout(2500);
  } else {
    console.log('No delete button found with [data-ng-del-history], looking for any close/del btn');
    const altDel = await page.$('.ng-editor__history-del, .ng-editor__del, button:has-text("삭제"), button:has-text("×")');
    if (altDel) {
      await altDel.click();
      await page.waitForTimeout(2500);
    }
  }

  const revertedHtml = await page.evaluate(() => {
    const wrap = document.querySelector('[data-ng-history-wrap]');
    return wrap ? wrap.innerText.trim() : '';
  });
  record.revertedValue = revertedHtml || '(없음)';
  console.log('Reverted greeting history:', record.revertedValue);

  const shotReverted = path.join(SHOTS_DIR, 'B-write1-greeting-04-reverted.png');
  await page.screenshot({ path: shotReverted, fullPage: true });
  record.shots.reverted = shotReverted;

  // Final check on Home page
  await page.goto('https://study114.net/#/study-room', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shotHomeReverted = path.join(SHOTS_DIR, 'B-write1-greeting-05-home-reverted.png');
  await page.screenshot({ path: shotHomeReverted, fullPage: true });
  record.shots.homeReverted = shotHomeReverted;

  await context.close();
  await browser.close();

  fs.writeFileSync('d:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-write1-greeting-result.json', JSON.stringify(record, null, 2), 'utf-8');
  console.log('Greeting test completed successfully!');
}

testGreeting().catch(err => {
  console.error('Fatal error in greeting test:', err);
  process.exit(1);
});
