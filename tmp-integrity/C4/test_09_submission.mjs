import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runSubmissionTest() {
  console.log('=== Starting Test 9: Submission Board ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  page.on('dialog', async d => {
    console.log('[DIALOG]', d.type(), d.message());
    await d.accept();
  });

  const report = {
    test_item: '9. 제출함',
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 제출함 허브 이동
  console.log('Navigating to #/mypage/submission-board...');
  await page.goto(`${BASE_URL}/#/mypage/submission-board`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '09-01-submission-list.png'), fullPage: true });

  // 3. 새 제출 작성 화면 이동
  console.log('Navigating to #/mypage/submission-board/new...');
  await page.goto(`${BASE_URL}/#/mypage/submission-board/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '09-02-submission-new.png'), fullPage: true });

  const testTitle = `[테스트] 증빙자료 제출 확인_${Date.now()}`;
  const filePath = path.join(OUT_DIR, 'test-sample.png');

  // 폼 입력
  console.log('Filling submission form...');
  await page.fill('input[name="title"]', testTitle);
  
  // 카테고리 선택
  const categorySelect = await page.$('select[name="category"], select[name="categoryId"]');
  if (categorySelect) {
    await categorySelect.selectOption({ index: 1 });
  }

  // 파일 첨부
  console.log('Setting file input:', filePath);
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(filePath);
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '09-03-form-filled.png') });

  // 제출 버튼 클릭
  console.log('Submitting form...');
  const submitBtn = await page.$('button[data-sub-action="submit"], button[type="submit"]:has-text("제출"), button:has-text("제출하기")');
  await submitBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '09-04-submitted-detail.png'), fullPage: true });

  const detailUrl = page.url();
  console.log('Current URL after submit:', detailUrl);
  const isDetailView = detailUrl.includes('/mypage/submission-board/');

  report.steps.push({
    step: 'submit_post',
    title: testTitle,
    detailUrl,
    isDetailView
  });

  // 4. 목록에서 표시 확인
  console.log('Navigating to list to check visibility...');
  await page.goto(`${BASE_URL}/#/mypage/submission-board`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '09-05-list-with-post.png'), fullPage: true });

  const listText = await page.innerText('body');
  const isPostInList = listText.includes(testTitle);
  console.log('Is submitted post visible in list:', isPostInList);

  report.steps.push({
    step: 'verify_list',
    visible: isPostInList
  });

  // 5. 삭제 (원복)
  console.log('Deleting submitted post...');
  // 상세로 들어가서 삭제하거나 목록에서 삭제
  const postRow = await page.$(`tr:has-text("${testTitle}")`);
  if (postRow) {
    const deleteBtn = await postRow.$('button[data-sub-delete], button:has-text("삭제")');
    if (deleteBtn) {
      console.log('Found delete button in row, clicking...');
      await deleteBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // 상세로 들어가기
      const detailLink = await postRow.$('a');
      if (detailLink) {
        await detailLink.click();
        await page.waitForTimeout(2000);
        const detailDeleteBtn = await page.$('button[data-sub-delete], button:has-text("삭제")');
        if (detailDeleteBtn) {
          console.log('Found delete button in detail, clicking...');
          await detailDeleteBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  }

  // 6. 삭제 후 목록 확인 (원복 확인)
  await page.goto(`${BASE_URL}/#/mypage/submission-board`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '09-06-list-deleted.png'), fullPage: true });

  const finalListText = await page.innerText('body');
  const isDeleted = !finalListText.includes(testTitle);
  console.log('Is test post successfully deleted (restored):', isDeleted);

  report.steps.push({
    step: 'delete_and_restore',
    deleted: isDeleted,
    success: isDeleted
  });

  report.result = (isPostInList && isDeleted) ? '정상' : '오류';
  fs.writeFileSync(path.join(OUT_DIR, 'test_09_result.json'), JSON.stringify(report, null, 2));

  await browser.close();
  console.log('=== Test 9 Finished ===');
}

runSubmissionTest().catch(err => {
  console.error('Test 9 Failed:', err);
  process.exit(1);
});
