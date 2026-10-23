import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function finishTest01() {
  console.log('=== Completing Test 01: Comment Delete & Post Delete via Inline Confirm ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  const apiCalls = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/board/')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiCalls.push({ method: res.request().method(), url, status: res.status(), body: body.slice(0, 300) });
      console.log(`[BOARD API] ${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  // 1. 홈 -> 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 과외쌤 고민방 이동
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const postLink = await page.$('text=[테스트]');
  if (!postLink) {
    console.log('No test post found! Everything already clean.');
    await browser.close();
    return;
  }

  console.log('Found post link, navigating to post detail...');
  await postLink.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-cleanup-01-detail.png'), fullPage: true });

  // 3. 댓글 삭제 테스트 (있으면)
  const commentDeleteTrigger = await page.$('[data-concern-delete-comment]');
  if (commentDeleteTrigger) {
    console.log('Found comment delete trigger! Clicking to open inline confirm...');
    await commentDeleteTrigger.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-cleanup-02-comment-confirm.png') });

    // 인라인 컨펌 모달의 "삭제하기" 버튼 클릭
    const confirmBtn = await page.waitForSelector('button:has-text("삭제하기")', { timeout: 3000 });
    console.log('Clicking comment confirm button...');
    await confirmBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-cleanup-03-comment-deleted.png'), fullPage: true });
  } else {
    console.log('No comment delete trigger found.');
  }

  // 4. 글 삭제 테스트
  const postDeleteTrigger = await page.$('[data-concern-delete-post]');
  if (postDeleteTrigger) {
    console.log('Found post delete trigger! Clicking to open inline confirm...');
    await postDeleteTrigger.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-cleanup-04-post-confirm.png') });

    const postConfirmBtn = await page.waitForSelector('button:has-text("삭제하기")', { timeout: 3000 });
    console.log('Clicking post confirm button...');
    await postConfirmBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-cleanup-05-post-deleted.png'), fullPage: true });
  } else {
    console.warn('Post delete trigger NOT found!');
  }

  // 5. 목록에서 테스트 글 완전히 사라졌는지 확인
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const remaining = await page.$('text=[테스트]');
  console.log('Remaining test post in tutor board:', !!remaining);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-cleanup-06-final-list.png'), fullPage: true });

  fs.writeFileSync(path.join(OUT_DIR, 'test_01_cleanup_result.json'), JSON.stringify({
    remaining: !!remaining,
    apiCalls
  }, null, 2));

  await browser.close();
  console.log('=== Test 01 Cleanup & Verification Done ===');
}

finishTest01().catch(console.error);
