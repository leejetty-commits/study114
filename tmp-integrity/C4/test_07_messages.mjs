import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runMessagesTest() {
  console.log('=== Starting Test 7: Messages & Reviews ===');
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
    if (url.includes('/api/messages/') || url.includes('/api/reviews/')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiLogs.push({
        method: res.request().method(),
        url,
        status: res.status(),
        requestPostData: res.request().postData(),
        responseBody: body.slice(0, 1000)
      });
      console.log(`[MESSAGES API] ${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  const report = {
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 쪽지함 이동 (#/mypage/messages)
  console.log('Navigating to #/mypage/messages ...');
  await page.goto(`${BASE_URL}/#/mypage/messages`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '07-01-messages-initial.png'), fullPage: true });

  // 스레드 목록 API 결과 직접 확인
  const threadsData = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/messages/threads.php', { credentials: 'include' });
      return await r.json();
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Threads API Data:', JSON.stringify(threadsData, null, 2));

  // 화면 내 대화 상대방 목록 확인
  const threads = Array.isArray(threadsData?.threads) ? threadsData.threads : [];
  console.log('Total threads count:', threads.length);

  report.threadsCount = threads.length;
  report.threads = threads;

  // 상대방 이름이 「이종현...」인 대화가 있는지 확인
  let eligibleThread = null;
  for (const t of threads) {
    const otherName = String(t.other_user_name || t.partner_name || t.other_display_name || '');
    if (otherName.startsWith('이종현')) {
      eligibleThread = t;
      break;
    }
  }

  if (eligibleThread) {
    console.log('Found eligible thread with partner starting with "이종현":', eligibleThread);
    report.partnerCheck = {
      partnerFound: true,
      thread: eligibleThread,
      replySent: false
    };
  } else {
    console.log('No eligible conversation partner starting with "이종현" (점검 못 함 처리).');
    report.partnerCheck = {
      partnerFound: false,
      reason: threads.length === 0
        ? '쪽지함이 비어 있음 (진행 중인 대화 스레드 0건)'
        : '기존 대화 상대방 중 「이종현…」으로 시작하는 상대방이 없음',
      replySent: false,
      status: '점검 못 함'
    };
  }

  // 3. 탭 반응 확인: 후기함 탭 클릭
  console.log('Testing 후기함 tab click...');
  const reviewTab = await page.waitForSelector('a[href="#/mypage/messages/reviews"], .msg-hub__tab:has-text("후기함")', { timeout: 5000 });
  await reviewTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '07-02-reviews-tab.png'), fullPage: true });

  const reviewPageText = await page.innerText('body');
  const reviewTabActive = reviewPageText.includes('후기') && (await page.url()).includes('/reviews');
  console.log('Is review tab loaded:', reviewTabActive);

  // 4. 다시 쪽지 탭 클릭
  console.log('Testing 쪽지 tab click back...');
  const messageTab = await page.waitForSelector('a[href="#/mypage/messages"], .msg-hub__tab:has-text("쪽지")', { timeout: 5000 });
  await messageTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '07-03-messages-tab-back.png'), fullPage: true });

  const messagePageText = await page.innerText('body');
  const messageTabActive = messagePageText.includes('쪽지') && !(await page.url()).includes('/reviews');
  console.log('Is message tab loaded back:', messageTabActive);

  report.tabsReaction = {
    reviewTabActive,
    messageTabActive
  };

  fs.writeFileSync(path.join(OUT_DIR, 'test_07_result.json'), JSON.stringify({
    report,
    apiLogs
  }, null, 2));

  await browser.close();
  console.log('=== Test 7 Finished Successfully ===');
}

runMessagesTest().catch(err => {
  console.error('Test 7 Failed:', err);
  process.exit(1);
});
