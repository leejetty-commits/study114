import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runInquiryStatusFixed() {
  console.log('=== Starting Test 4 (Fixed): Tutor Inquiry Status Toggle & Restore ===');
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

  // 2. 쪽지설정 페이지 이동
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/inquiries`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-10-initial-state.png'), fullPage: true });

  // 3. '쪽지 받는 중' (value="1") 클릭
  console.log('Clicking p21_inquiry_receiving value="1" (쪽지 받는 중)...');
  await page.click('input[name="p21_inquiry_receiving"][value="1"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-11-open-selected.png') });

  // 저장 버튼 클릭
  console.log('Clicking [data-p21-inquiry-save]...');
  const patchRespPromise1 = page.waitForResponse(res => res.url().includes('/api/registrations/tutors.php') && res.request().method() === 'PATCH', { timeout: 10000 });
  await page.click('[data-p21-inquiry-save], button:has-text("저장하기")');
  const patchResp1 = await patchRespPromise1;
  const patchText1 = await patchResp1.text();
  console.log('Patch open response:', patchText1.slice(0, 300));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-12-open-saved.png'), fullPage: true });

  report.steps.push({
    step: 'toggle_open',
    status: patchResp1.status(),
    response: patchText1.slice(0, 300)
  });

  // 새로고침하여 open 유지 확인
  console.log('Reloading to verify open status persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-13-open-verified-reloaded.png'), fullPage: true });

  const isOpenChecked = await page.evaluate(() => {
    const el = document.querySelector('input[name="p21_inquiry_receiving"][value="1"]');
    return el ? el.checked : false;
  });
  console.log('isOpenChecked after reload:', isOpenChecked);
  report.isOpenPersisted = isOpenChecked;

  // 4. 원래 값(paused)으로 원복 저장
  console.log('Restoring to paused: clicking receiving=0 and reason=paused...');
  await page.click('input[name="p21_inquiry_receiving"][value="0"]');
  await page.waitForTimeout(500);
  await page.click('input[name="p21_inquiry_reason"][value="paused"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-14-paused-selected.png') });

  console.log('Clicking save to restore paused...');
  const patchRespPromise2 = page.waitForResponse(res => res.url().includes('/api/registrations/tutors.php') && res.request().method() === 'PATCH', { timeout: 10000 });
  await page.click('[data-p21-inquiry-save], button:has-text("저장하기")');
  const patchResp2 = await patchRespPromise2;
  const patchText2 = await patchResp2.text();
  console.log('Patch paused response:', patchText2.slice(0, 300));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-15-paused-saved.png'), fullPage: true });

  report.steps.push({
    step: 'restore_paused',
    status: patchResp2.status(),
    response: patchText2.slice(0, 300)
  });

  // 새로고침하여 paused 원복 최종 확인
  console.log('Reloading to verify paused restored...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-16-paused-verified-final.png'), fullPage: true });

  const isPausedChecked = await page.evaluate(() => {
    const recv0 = document.querySelector('input[name="p21_inquiry_receiving"][value="0"]');
    const reasonPaused = document.querySelector('input[name="p21_inquiry_reason"][value="paused"]');
    return (recv0 ? recv0.checked : false) && (reasonPaused ? reasonPaused.checked : false);
  });
  console.log('isPausedChecked after final reload:', isPausedChecked);
  report.isPausedRestored = isPausedChecked;

  fs.writeFileSync(path.join(OUT_DIR, 'test_04_fixed_result.json'), JSON.stringify({
    report,
    apiLogs
  }, null, 2));

  await browser.close();
  console.log('=== Test 4 (Fixed) Done Successfully ===');
}

runInquiryStatusFixed().catch(console.error);
