import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runCommunityTest() {
  console.log('=== Starting Test 1: Community Concern Boards ===');
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
    if (url.includes('/api/')) {
      let body = '';
      try {
        body = await res.text();
      } catch (e) {}
      apiLogs.push({
        method: res.request().method(),
        url,
        status: res.status(),
        responseBody: body.slice(0, 1000)
      });
    }
  });

  const testReport = {
    steps: [],
    readOnlyChecks: {}
  };

  // 1. 홈 방문으로 세션 완전 hydrate
  console.log('1. Navigating to Home to hydrate session...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.waitForSelector('text=이종현과외');

  // 2. 커뮤니티 홈 이동
  console.log('2. Navigating to #/community ...');
  await page.goto(`${BASE_URL}/#/community`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-01-community-home.png'), fullPage: true });

  // 3. 과외쌤 고민방 (#/community/tutor) 이동
  console.log('3. Navigating to Tutor Concern channel (#/community/tutor)...');
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-02-concern-tutor-list.png'), fullPage: true });

  // 글쓰기 버튼 확인
  const writeBtn = await page.waitForSelector('a[href="#/community/tutor/new"], button:has-text("글쓰기"), a:has-text("글쓰기")', { timeout: 5000 });
  console.log('Write button found!');

  // 4. 글쓰기 버튼 클릭
  await writeBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-03-write-page.png'), fullPage: true });

  // 글쓰기 폼 입력
  const testTitle = `[테스트] 과외샤 채널 글쓰기 확인_${Date.now()}`;
  const testBody = `[테스트] 과외샤 무결성 점검 본문입니다. 자동화 검사 진행 중.`;

  // 제목 입력
  const titleInput = await page.waitForSelector('input[placeholder*="제목"], input[name="title"], input[type="text"]');
  await titleInput.fill(testTitle);

  // 본문 입력
  const contentInput = await page.waitForSelector('textarea[placeholder*="내용"], textarea[placeholder*="고민"], textarea');
  await contentInput.fill(testBody);

  await page.screenshot({ path: path.join(SHOTS_DIR, '01-04-write-filled.png') });

  // 등록 버튼 클릭
  console.log('5. Submitting post...');
  const submitBtn = await page.waitForSelector('button:has-text("등록"), button:has-text("작성"), button:has-text("저장"), button[type="submit"]');
  
  const postRespPromise = page.waitForResponse(res => res.url().includes('/api/') && res.request().method() === 'POST', { timeout: 10000 });
  await submitBtn.click();

  let postRespStatus = null;
  let postRespBody = null;
  try {
    const postResp = await postRespPromise;
    postRespStatus = postResp.status();
    postRespBody = await postResp.text();
  } catch (e) {
    console.warn('Post response timeout or missed:', e.message);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-05-post-submitted.png'), fullPage: true });

  testReport.steps.push({
    step: 'create_post',
    status: postRespStatus,
    title: testTitle,
    responseBody: postRespBody
  });

  // 5. 목록/상세 표시 확인 및 글쓴이 이름 확인
  console.log('6. Checking post in list & detail...');
  let postLink = await page.$(`text="${testTitle}"`);
  if (!postLink) {
    await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    postLink = await page.$(`text="${testTitle}"`);
  }

  let authorName = null;
  let postDetailUrl = null;

  if (postLink) {
    console.log('Post found in list! Clicking...');
    await postLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-06-post-detail.png'), fullPage: true });
    postDetailUrl = page.url();

    const detailText = await page.innerText('body');
    console.log('Detail text snippet:', detailText.slice(0, 500));
    // 글쓴이 이름 확인
    if (detailText.includes('최고수학샘')) {
      authorName = '최고수학샘';
    } else if (detailText.includes('이종현과외')) {
      authorName = '이종현과외';
    } else {
      authorName = '기타/미확인';
    }
  } else {
    console.error('Post NOT found in list!');
  }

  testReport.steps.push({
    step: 'view_detail',
    postFound: !!postLink,
    authorName,
    url: postDetailUrl
  });

  // 6. 글 수정
  console.log('7. Editing post...');
  const editBtn = await page.$('button:has-text("수정"), a:has-text("수정")');
  let editSuccess = false;
  let editStatus = null;
  let updatedTitle = `${testTitle}_수정됨`;
  if (editBtn) {
    await editBtn.click();
    await page.waitForTimeout(1500);

    const editTitleInput = await page.$('input[placeholder*="제목"], input[name="title"], input[type="text"]');
    if (editTitleInput) await editTitleInput.fill(updatedTitle);
    const editContentInput = await page.$('textarea[placeholder*="내용"], textarea');
    if (editContentInput) await editContentInput.fill(`${testBody} (수정 완료)`);

    await page.screenshot({ path: path.join(SHOTS_DIR, '01-07-edit-modal.png') });

    const editSaveBtn = await page.$('button:has-text("수정"), button:has-text("저장"), button:has-text("완료")');
    if (editSaveBtn) {
      const editRespPromise = page.waitForResponse(res => res.url().includes('/api/') && (res.request().method() === 'PUT' || res.request().method() === 'POST' || res.request().method() === 'PATCH'), { timeout: 10000 }).catch(() => null);
      await editSaveBtn.click();
      const editResp = await editRespPromise;
      editStatus = editResp ? editResp.status() : 'unknown';
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SHOTS_DIR, '01-08-edit-done.png'), fullPage: true });
      editSuccess = true;
    }
  } else {
    console.warn('Edit button not found!');
  }
  testReport.steps.push({
    step: 'edit_post',
    success: editSuccess,
    updatedTitle,
    status: editStatus
  });

  // 7. 댓글 작성 및 삭제
  console.log('8. Adding comment...');
  const commentInput = await page.$('textarea[placeholder*="댓글"], input[placeholder*="댓글"]');
  let commentCreated = false;
  let commentDeleted = false;
  const commentText = `[테스트] 과외샤 댓글 작성 확인_${Date.now()}`;
  if (commentInput) {
    await commentInput.fill(commentText);
    const commentSubmitBtn = await page.$('button:has-text("등록"), button:has-text("작성"), button:has-text("댓글")');
    if (commentSubmitBtn) {
      await commentSubmitBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SHOTS_DIR, '01-09-comment-added.png'), fullPage: true });
      commentCreated = (await page.innerText('body')).includes(commentText);

      // 댓글 삭제 버튼 확인
      const allDelBtns = await page.$$('button:has-text("삭제")');
      for (const btn of allDelBtns) {
        const parentText = await btn.evaluate(el => el.closest('.comment, [data-comment-id], li, div')?.innerText || '');
        if (parentText.includes(commentText)) {
          console.log('Clicking comment delete button...');
          page.once('dialog', async dialog => {
            console.log('Comment dialog:', dialog.message());
            await dialog.accept();
          });
          await btn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SHOTS_DIR, '01-10-comment-deleted.png'), fullPage: true });
          commentDeleted = !(await page.innerText('body')).includes(commentText);
          break;
        }
      }
    }
  }
  testReport.steps.push({
    step: 'comment',
    created: commentCreated,
    deleted: commentDeleted
  });

  // 8. 글 삭제
  console.log('9. Deleting test post...');
  const delBtns = await page.$$('button:has-text("삭제")');
  let postDeleted = false;
  for (const btn of delBtns) {
    page.once('dialog', async dialog => {
      console.log('Post delete dialog:', dialog.message());
      await dialog.accept();
    });
    const delRespPromise = page.waitForResponse(res => res.url().includes('/api/') && (res.request().method() === 'DELETE' || res.request().method() === 'POST'), { timeout: 5000 }).catch(() => null);
    await btn.click();
    await delRespPromise;
    await page.waitForTimeout(2500);
    postDeleted = true;
    break;
  }
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-11-post-deleted.png'), fullPage: true });
  testReport.steps.push({
    step: 'delete_post',
    deleted: postDeleted
  });

  // 9. 읽기 전용 채널 권한 확인
  console.log('10. Checking read-only channels...');
  // 원장 채널: #/community/director
  await page.goto(`${BASE_URL}/#/community/director`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-12-readonly-director.png'), fullPage: true });
  const directorWriteBtn = await page.$('a[href="#/community/director/new"], button:has-text("글쓰기")');
  const directorCanWrite = directorWriteBtn ? await directorWriteBtn.isVisible() : false;

  // 학부모 채널: #/community/parent
  await page.goto(`${BASE_URL}/#/community/parent`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-13-readonly-parent.png'), fullPage: true });
  const parentWriteBtn = await page.$('a[href="#/community/parent/new"], button:has-text("글쓰기")');
  const parentCanWrite = parentWriteBtn ? await parentWriteBtn.isVisible() : false;

  testReport.readOnlyChecks = {
    directorChannel: { hasWriteButton: directorCanWrite },
    parentChannel: { hasWriteButton: parentCanWrite }
  };

  // 10. 모바일 뷰포트 확인
  console.log('11. Mobile viewport check...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-14-concern-tutor-mobile.png'), fullPage: true });

  fs.writeFileSync(path.join(OUT_DIR, 'test_01_result.json'), JSON.stringify({
    testReport,
    blockedLogs,
    apiLogs: apiLogs.slice(-30)
  }, null, 2));

  await browser.close();
  console.log('=== Test 1 Finished Successfully ===');
}

runCommunityTest().catch(err => {
  console.error('Test 1 Failed:', err);
  process.exit(1);
});
