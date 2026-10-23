import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function precheck() {
  console.log('--- Starting Precheck ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  const consoleLogs = [];
  const failedReqs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('requestfailed', req => failedReqs.push({ url: req.url(), failure: req.failure() }));

  // 1. 홈 방문
  console.log('Navigating to Home...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const bodyText = await page.innerText('body');
  const isLoggedIn = bodyText.includes('이종현과외') || bodyText.includes('로그아웃');
  console.log('Is Logged In:', isLoggedIn);

  await page.screenshot({ path: path.join(SHOTS_DIR, '00-precheck-home.png'), fullPage: true });

  if (!isLoggedIn) {
    console.error('ERROR: Session expired or tutor user name not found! Stopping.');
    await browser.close();
    process.exit(1);
  }

  // 2. 마이페이지 과외샤 9 확인
  console.log('Navigating to Tutor 9 Registration page...');
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(SHOTS_DIR, '00-precheck-tutor9.png'), fullPage: true });

  // 값 추출
  const pageInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
      name: el.name || el.id || el.getAttribute('data-field') || el.placeholder,
      id: el.id,
      tagName: el.tagName,
      value: el.value,
      type: el.type,
      checked: el.checked,
      disabled: el.disabled
    }));
    return {
      title: document.title,
      url: window.location.href,
      inputs,
      textPreview: document.body.innerText.slice(0, 1000)
    };
  });

  console.log('Precheck Tutor 9 Info:', JSON.stringify(pageInfo, null, 2));

  fs.writeFileSync(path.join(OUT_DIR, 'precheck_result.json'), JSON.stringify({
    isLoggedIn,
    blockedLogs,
    pageInfo,
    consoleLogs: consoleLogs.slice(0, 20),
    failedReqs
  }, null, 2));

  await browser.close();
  console.log('--- Precheck Finished Successfully ---');
}

precheck().catch(err => {
  console.error('Precheck Failed:', err);
  process.exit(1);
});
