import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';

async function testContact() {
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
    test: '6. 1:1 문의',
    ticketText: '[테스트] 무결성 점검 — 답변 불필요',
    submitted: false,
    historyVerified: false,
    cancelAvailable: false,
    reverted: false,
    shots: {}
  };

  console.log('--- Step 1: Open Support Contact Form ---');
  await page.goto('https://study114.net/#/support/contact', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const shotBefore = path.join(SHOTS_DIR, 'B-write6-contact-01-before.png');
  await page.screenshot({ path: shotBefore, fullPage: true });
  record.shots.before = shotBefore;

  console.log('--- Step 2: Fill and Submit Ticket ---');
  await page.fill('textarea[name="body"]', record.ticketText);
  await page.waitForTimeout(500);

  // Click submit
  await page.click('button[type="submit"]:has-text("운영문의 남기기")');
  await page.waitForTimeout(3000);
  record.submitted = true;

  const shotSubmitted = path.join(SHOTS_DIR, 'B-write6-contact-02-submitted.png');
  await page.screenshot({ path: shotSubmitted, fullPage: true });
  record.shots.submitted = shotSubmitted;

  console.log('--- Step 3: Check My Page Contact History ---');
  await page.goto('https://study114.net/#/mypage/contact', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const historyInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    const cancelBtns = Array.from(document.querySelectorAll('button, a')).filter(el =>
      el.innerText.includes('취소') || el.innerText.includes('삭제')
    ).map(el => ({ text: el.innerText.trim(), tag: el.tagName }));

    return {
      textSnippet: text.slice(0, 1500),
      hasTicket: text.includes('[테스트] 무결성 점검 — 답변 불필요'),
      cancelBtns
    };
  });

  console.log('History info:', JSON.stringify(historyInfo, null, 2));
  record.historyVerified = historyInfo.hasTicket;
  record.cancelAvailable = historyInfo.cancelBtns.length > 0;

  const shotHistory = path.join(SHOTS_DIR, 'B-write6-contact-03-history.png');
  await page.screenshot({ path: shotHistory, fullPage: true });
  record.shots.history = shotHistory;

  if (record.cancelAvailable) {
    console.log('Cancel/Delete button found, attempting cancellation...');
    const btn = await page.$('button:has-text("취소"), button:has-text("삭제")');
    if (btn) {
      await btn.click();
      await page.waitForTimeout(2000);
      record.reverted = true;
      const shotReverted = path.join(SHOTS_DIR, 'B-write6-contact-04-cancelled.png');
      await page.screenshot({ path: shotReverted, fullPage: true });
      record.shots.reverted = shotReverted;
    }
  } else {
    console.log('No cancel/delete button available in contact history. Leaving ticket as is.');
  }

  await context.close();
  await browser.close();

  fs.writeFileSync('d:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-write6-contact-result.json', JSON.stringify(record, null, 2), 'utf-8');
  console.log('Contact test completed successfully!');
}

testContact().catch(err => {
  console.error('Fatal in contact test:', err);
  process.exit(1);
});
