import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runSolvedTest() {
  console.log('=== Starting Test 2: Solved Community Board ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  const apiLogs = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/board/')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiLogs.push({
        method: res.request().method(),
        url,
        status: res.status(),
        responseBody: body.slice(0, 1000)
      });
      console.log(`[SOLVED API] ${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  const report = {
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 해결후기 페이지 이동
  console.log('Navigating to #/community/solved...');
  await page.goto(`${BASE_URL}/#/community/solved`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-01-solved-list.png'), fullPage: true });

  // 글쓰기 버튼 확인
  const writeBtn = await page.waitForSelector('a[href="#/community/solved/new"], button:has-text("글쓰기"), a:has-text("글쓰기"), button:has-text("후기 작성")', { timeout: 5000 });
  console.log('Write button found in solved board!');
  await writeBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-02-solved-write-form.png'), fullPage: true });

  // 폼 입력
  const testTitle = `[테스트] 해결후기 글쓰기 확인_${Date.now()}`;
  const testBody = `[테스트] 해결후기 무결성 점검 본문입니다. 자동화 검사 진행 중.`;

  const titleInput = await page.waitForSelector('input[placeholder*="제목"], input[name="title"], input[type="text"]');
  await titleInput.fill(testTitle);

  const contentInput = await page.waitForSelector('textarea[placeholder*="내용"], textarea[placeholder*="후기"], textarea');
  await contentInput.fill(testBody);

  await page.screenshot({ path: path.join(SHOTS_DIR, '02-03-solved-filled.png') });

  // 제출
  console.log('Submitting solved post...');
  const submitBtn = await page.waitForSelector('button:has-text("등록"), button:has-text("작성"), button:has-text("저장"), button[type="submit"]');
  
  const postRespPromise = page.waitForResponse(res => res.url().includes('/api/board/posts.php') && res.request().method() === 'POST', { timeout: 10000 });
  await submitBtn.click();

  let postResp = null;
  try {
    postResp = await postRespPromise;
  } catch (e) {
    console.warn('Post response wait timeout:', e.message);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-04-solved-submitted.png'), fullPage: true });

  report.steps.push({
    step: 'create_post',
    status: postResp ? postResp.status() : 'unknown',
    title: testTitle
  });

  // 표시 확인
  console.log('Verifying post in list & detail...');
  let postLink = await page.$(`text="${testTitle}"`);
  if (!postLink) {
    await page.goto(`${BASE_URL}/#/community/solved`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    postLink = await page.$(`text="${testTitle}"`);
  }

  let postDetailFound = false;
  let postAuthor = null;

  if (postLink) {
    console.log('Solved post found in list! Clicking...');
    await postLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '02-05-solved-detail.png'), fullPage: true });
    postDetailFound = true;
    const bodyText = await page.innerText('body');
    if (bodyText.includes('최고수학샘')) postAuthor = '최고수학샘';
    else if (bodyText.includes('이종현과외')) postAuthor = '이종현과외';
  } else {
    console.error('Solved post NOT found in list!');
  }

  report.steps.push({
    step: 'view_detail',
    found: postDetailFound,
    postAuthor
  });

  // 글 삭제
  console.log('Deleting solved post via inline confirm...');
  const delTrigger = await page.waitForSelector('[data-concern-delete-post]', { timeout: 5000 });
  await delTrigger.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-06-solved-delete-confirm.png') });

  const confirmBtn = await page.waitForSelector('button:has-text("삭제하기")', { timeout: 3000 });
  const delRespPromise = page.waitForResponse(res => res.url().includes('/api/board/posts.php') && res.request().method() === 'DELETE', { timeout: 10000 });
  await confirmBtn.click();
  const delResp = await delRespPromise;
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-07-solved-deleted.png'), fullPage: true });

  report.steps.push({
    step: 'delete_post',
    status: delResp ? delResp.status() : 'unknown'
  });

  // 목록에서 완전히 사라졌는지 확인
  await page.goto(`${BASE_URL}/#/community/solved`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const remaining = await page.$(`text="${testTitle}"`);
  console.log('Remaining solved test post:', !!remaining);
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-08-solved-final-list.png'), fullPage: true });

  report.remaining = !!remaining;

  fs.writeFileSync(path.join(OUT_DIR, 'test_02_result.json'), JSON.stringify({
    report,
    apiLogs
  }, null, 2));

  await browser.close();
  console.log('=== Test 2 Finished Successfully ===');
}

runSolvedTest().catch(err => {
  console.error('Test 2 Failed:', err);
  process.exit(1);
});
