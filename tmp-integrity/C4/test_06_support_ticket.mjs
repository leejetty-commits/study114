import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runSupportTest() {
  console.log('=== Starting Test 6: Support 1:1 Contact Ticket ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  page.on('dialog', async d => {
    console.log('[ALERT DIALOG]', d.message());
    await d.accept();
  });

  const apiLogs = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/support/')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiLogs.push({
        method: res.request().method(),
        url,
        status: res.status(),
        requestPostData: res.request().postData(),
        responseBody: body.slice(0, 1000)
      });
      console.log(`[SUPPORT API] ${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  const report = {
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 문의 화면 이동 (#/support/contact)
  console.log('Navigating to #/support/contact ...');
  await page.goto(`${BASE_URL}/#/support/contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '06-01-support-contact-form.png'), fullPage: true });

  // 폼 입력
  const testMessage = `[테스트] 과외샤 무결성 점검 문의_${Date.now()}\n과외샤 로그인 상태에서 고객센터 1:1 문의 작성 테스트입니다.`;
  const textarea = await page.waitForSelector('textarea[name="body"], textarea[placeholder*="문의"]', { timeout: 5000 });
  await textarea.fill(testMessage);
  await page.screenshot({ path: path.join(SHOTS_DIR, '06-02-support-contact-filled.png') });

  // 제출
  console.log('Submitting support ticket...');
  const submitBtn = await page.waitForSelector('button:has-text("운영문의 남기기"), button[type="submit"]', { timeout: 5000 });
  
  const postRespPromise = page.waitForResponse(res => res.url().includes('/api/support/tickets.php') && res.request().method() === 'POST', { timeout: 10000 });
  await submitBtn.click();

  let postResp = null;
  let postRespBody = null;
  try {
    postResp = await postRespPromise;
    postRespBody = await postResp.text();
  } catch (e) {
    console.warn('Post response timeout:', e.message);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '06-03-support-contact-submitted.png'), fullPage: true });

  // 티켓 ID 추출
  let ticketId = null;
  try {
    const parsed = JSON.parse(postRespBody);
    ticketId = parsed.ticket?.id || parsed.id;
  } catch (e) {}

  console.log('Created Ticket ID:', ticketId);

  report.steps.push({
    step: 'create_ticket',
    status: postResp ? postResp.status() : 'unknown',
    ticketId,
    responseSnippet: postRespBody?.slice(0, 300)
  });

  // 3. 내 문의 내역 화면 이동 (#/mypage/contact)
  console.log('Navigating to my contact history (#/mypage/contact)...');
  await page.goto(`${BASE_URL}/#/mypage/contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '06-04-mypage-contact-history.png'), fullPage: true });

  const historyText = await page.innerText('body');
  const isTicketInHistory = ticketId ? historyText.includes(ticketId) : historyText.includes('[테스트] 과외샤 무결성 점검 문의');
  console.log('Is ticket visible in history:', isTicketInHistory);

  // 삭제 기능 여부 확인
  const deleteBtn = await page.$('.contact-history button:has-text("삭제"), .sup-ticket button:has-text("삭제"), button:has-text("문의 삭제")');
  const hasDeleteFunction = !!deleteBtn;
  console.log('Has ticket delete function:', hasDeleteFunction);

  report.steps.push({
    step: 'verify_history',
    visibleInHistory: isTicketInHistory,
    hasDeleteFunction,
    ticketId
  });

  fs.writeFileSync(path.join(OUT_DIR, 'test_06_result.json'), JSON.stringify({
    report,
    apiLogs
  }, null, 2));

  await browser.close();
  console.log('=== Test 6 Finished Successfully ===');
}

runSupportTest().catch(err => {
  console.error('Test 6 Failed:', err);
  process.exit(1);
});
