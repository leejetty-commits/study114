import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runGreetingTest() {
  console.log('=== Starting Test 5: Neighborhood Greeting ===');
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
    if (url.includes('/api/neighborhood-greetings.php')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiLogs.push({
        method: res.request().method(),
        url,
        status: res.status(),
        requestPostData: res.request().postData(),
        responseBody: body.slice(0, 1000)
      });
      console.log(`[GREETING API] ${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  const report = {
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 마이페이지 진입 (과외 9 허브)
  console.log('Navigating to Tutor 9 hub...');
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-01-greeting-initial.png'), fullPage: true });

  const greetingInput = await page.waitForSelector('textarea[placeholder*="동네 이웃에게 전할 한 줄 인사"]', { timeout: 5000 });
  const uploadBtn = await page.waitForSelector('button:has-text("올리기")', { timeout: 5000 });

  // 3. 금지어 검사: "010-1234-5678" 포함 문구
  console.log('Testing forbidden word rejection (010-1234-5678)...');
  await greetingInput.fill('[테스트] 010-1234-5678 연락주세요');
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-02-greeting-forbidden-input.png') });

  // 올리기 클릭 시 거부 메시지 감지
  let forbiddenRejected = false;
  let forbiddenMessage = '';

  // 에러 메시지 엘리먼트 감시
  await uploadBtn.click();
  await page.waitForTimeout(1000);

  const pageText = await page.innerText('body');
  if (pageText.includes('전화, 카톡, 주소는 넣을 수 없어요') || pageText.includes('넣을 수 없어요')) {
    forbiddenRejected = true;
    forbiddenMessage = '전화, 카톡, 주소는 넣을 수 없어요.';
  }
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-03-greeting-forbidden-rejected.png') });
  console.log('Forbidden test result:', { forbiddenRejected, forbiddenMessage });

  report.steps.push({
    step: 'forbidden_word_check',
    rejected: forbiddenRejected,
    message: forbiddenMessage
  });

  // 4. 정상 문구 올리기: "[테스트] 동네인사 확인"
  console.log('Uploading valid test greeting: "[테스트] 동네인사 확인"...');
  await greetingInput.fill('[테스트] 동네인사 확인');
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-04-greeting-valid-input.png') });

  const publishRespPromise = page.waitForResponse(res => res.url().includes('/api/neighborhood-greetings.php') && res.request().method() === 'POST', { timeout: 10000 });
  await uploadBtn.click();

  let publishResp = null;
  try {
    publishResp = await publishRespPromise;
  } catch (e) {
    console.warn('Publish wait timeout:', e.message);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-05-greeting-uploaded.png'), fullPage: true });

  const isUploadedInMypage = (await page.innerText('body')).includes('[테스트] 동네인사 확인');
  console.log('Is greeting visible in mypage:', isUploadedInMypage);

  report.steps.push({
    step: 'upload_greeting',
    status: publishResp ? publishResp.status() : 'unknown',
    visibleInMypage: isUploadedInMypage
  });

  // 5. 홈 화면에서 동네 인사 칸·더보기 팝업 표시 여부 확인
  console.log('Navigating to Home to check greeting feed...');
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-06-home-greeting-box.png'), fullPage: true });

  const homeText = await page.innerText('body');
  const visibleInHomeBox = homeText.includes('[테스트] 동네인사 확인');
  console.log('Visible in Home greeting box:', visibleInHomeBox);

  // 더보기 팝업 클릭 시도
  const moreBtn = await page.$('.home-news button:has-text("더보기"), .home-news a:has-text("더보기"), [data-greeting-more], button:has-text("동네 인사 더보기")');
  let visibleInPopup = false;
  let cardPopupWorked = false;

  if (moreBtn) {
    console.log('Clicking greeting more button...');
    await moreBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS_DIR, '05-07-home-greeting-modal.png'), fullPage: true });
    const modalText = await page.innerText('body');
    visibleInPopup = modalText.includes('[테스트] 동네인사 확인');
    console.log('Visible in greeting popup:', visibleInPopup);

    // 이름 클릭 시 카드 팝업 확인
    const nameBtn = await page.$('button:has-text("최고수학샘"), a:has-text("최고수학샘"), [data-greeting-provider="9"]');
    if (nameBtn) {
      console.log('Clicking name button in popup...');
      await nameBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS_DIR, '05-08-greeting-card-popup.png'), fullPage: true });
      const cardText = await page.innerText('body');
      cardPopupWorked = cardText.includes('최고수학샘') && (cardText.includes('수학') || cardText.includes('서울특별시'));
    }
  }

  report.steps.push({
    step: 'home_display_check',
    visibleInHomeBox,
    visibleInPopup,
    cardPopupWorked
  });

  // 6. 마이페이지로 돌아와서 "내리기" 실행 (원복)
  console.log('Returning to Tutor 9 hub to unpublish (내리기)...');
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const unpublishBtn = await page.waitForSelector('button:has-text("내리기"), [data-greeting-unpublish]', { timeout: 5000 });
  const unpublishRespPromise = page.waitForResponse(res => res.url().includes('/api/neighborhood-greetings.php') && res.request().method() === 'POST', { timeout: 10000 });
  await unpublishBtn.click();

  let unpublishResp = null;
  try {
    unpublishResp = await unpublishRespPromise;
  } catch (e) {
    console.warn('Unpublish response timeout:', e.message);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-09-greeting-unpublished.png'), fullPage: true });

  const hubTextAfter = await page.innerText('body');
  const isGreetingRemoved = hubTextAfter.includes('아직 올린 인사가 없어요');
  console.log('Is greeting removed/unpublished in mypage:', isGreetingRemoved);

  report.steps.push({
    step: 'unpublish_greeting',
    status: unpublishResp ? unpublishResp.status() : 'unknown',
    unpublished: isGreetingRemoved
  });

  fs.writeFileSync(path.join(OUT_DIR, 'test_05_result.json'), JSON.stringify({
    report,
    apiLogs
  }, null, 2));

  await browser.close();
  console.log('=== Test 5 Finished Successfully ===');
}

runGreetingTest().catch(err => {
  console.error('Test 5 Failed:', err);
  process.exit(1);
});
