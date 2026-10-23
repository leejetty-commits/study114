import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runInquiryStatusTest() {
  console.log('=== Starting Test 4: Tutor Inquiry Status Toggle & Restore ===');
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
    if (url.includes('/api/registrations/tutors.php')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiLogs.push({
        method: res.request().method(),
        url,
        status: res.status(),
        requestPostData: res.request().postData(),
        responseBody: body.slice(0, 1000)
      });
      console.log(`[TUTOR API] ${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  const report = {
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 쪽지설정 페이지 진입
  console.log('Navigating to #/mypage/registrations/tutors/9/inquiries ...');
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/inquiries`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-01-inquiries-initial.png'), fullPage: true });

  // 현재 상태 확인 (라디오 또는 셀렉트 등)
  const initialRadio = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"], input[name="inquiry_status"]')).map(r => ({
      name: r.name,
      value: r.value,
      checked: r.checked,
      id: r.id
    }));
    const selects = Array.from(document.querySelectorAll('select')).map(s => ({
      name: s.name,
      value: s.value
    }));
    return { radios, selects, bodyText: document.body.innerText.slice(0, 1000) };
  });
  console.log('Initial Inquiries Status UI:', JSON.stringify(initialRadio, null, 2));

  report.initialState = initialRadio;

  // 3. 'open' (쪽지 받음) 선택
  console.log('Selecting "open" (쪽지 받음)...');
  // 라디오 또는 버튼 찾기
  const openOption = await page.$('input[value="open"], label:has-text("쪽지 받음"), label:has-text("정상 접수")');
  if (openOption) {
    await openOption.click();
  } else {
    // 셀렉트 박스 등 시도
    await page.selectOption('select', 'open').catch(() => {});
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-02-inquiries-open-selected.png') });

  // 저장 버튼 클릭
  console.log('Saving open status...');
  const saveBtn = await page.waitForSelector('button:has-text("저장"), button:has-text("변경사항 저장"), button[type="submit"]', { timeout: 5000 });
  const patchRespPromise1 = page.waitForResponse(res => res.url().includes('/api/registrations/tutors.php') && res.request().method() === 'PATCH', { timeout: 10000 });
  await saveBtn.click();

  let patchResp1 = null;
  try {
    patchResp1 = await patchRespPromise1;
  } catch (e) {
    console.warn('Patch response wait timeout:', e.message);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-03-inquiries-open-saved.png'), fullPage: true });

  report.steps.push({
    step: 'set_open',
    status: patchResp1 ? patchResp1.status() : 'unknown',
    respBody: patchResp1 ? await patchResp1.text() : null
  });

  // 재조회로 반영 확인 (페이지 새로고침)
  console.log('Reloading page to verify "open" persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-04-inquiries-open-reloaded.png'), fullPage: true });

  const openVerified = await page.evaluate(() => {
    const radio = document.querySelector('input[value="open"]');
    return radio ? radio.checked : false;
  });
  report.openVerified = openVerified;
  console.log('Is "open" checked after reload:', openVerified);

  // 4. 원래 값(paused)으로 원복 저장
  console.log('Restoring status to "paused"...');
  const pausedOption = await page.$('input[value="paused"], label:has-text("쪽지 안받음"), label:has-text("잠시 쉬임")');
  if (pausedOption) {
    await pausedOption.click();
  } else {
    await page.selectOption('select', 'paused').catch(() => {});
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-05-inquiries-paused-selected.png') });

  const saveBtn2 = await page.waitForSelector('button:has-text("저장"), button:has-text("변경사항 저장"), button[type="submit"]', { timeout: 5000 });
  const patchRespPromise2 = page.waitForResponse(res => res.url().includes('/api/registrations/tutors.php') && res.request().method() === 'PATCH', { timeout: 10000 });
  await saveBtn2.click();

  let patchResp2 = null;
  try {
    patchResp2 = await patchRespPromise2;
  } catch (e) {
    console.warn('Patch response wait timeout:', e.message);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-06-inquiries-paused-saved.png'), fullPage: true });

  report.steps.push({
    step: 'restore_paused',
    status: patchResp2 ? patchResp2.status() : 'unknown',
    respBody: patchResp2 ? await patchResp2.text() : null
  });

  // 재조회로 paused 원복 확인
  console.log('Reloading page to verify "paused" restored...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-07-inquiries-paused-restored.png'), fullPage: true });

  const pausedVerified = await page.evaluate(() => {
    const radio = document.querySelector('input[value="paused"]');
    return radio ? radio.checked : false;
  });
  report.pausedVerified = pausedVerified;
  console.log('Is "paused" checked after reload (restored):', pausedVerified);

  fs.writeFileSync(path.join(OUT_DIR, 'test_04_result.json'), JSON.stringify({
    report,
    apiLogs
  }, null, 2));

  await browser.close();
  console.log('=== Test 4 Finished ===');
}

runInquiryStatusTest().catch(err => {
  console.error('Test 4 Failed:', err);
  process.exit(1);
});
