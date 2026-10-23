import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runForbiddenScreensTest() {
  console.log('=== Starting Test 11: Forbidden Screens Guard Check ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  page.on('dialog', async d => {
    console.log('[ALERT DIALOG in Test 11]', d.message());
    await d.accept();
  });

  const targets = [
    { path: '#/admin', name: 'admin_home' },
    { path: '#/admin/tickets', name: 'admin_tickets' },
    { path: '#/mypage/registrations/students', name: 'mypage_reg_students' },
    { path: '#/mypage/registrations/study-rooms', name: 'mypage_reg_study_rooms' }
  ];

  const report = {
    test_item: '11. 차단 화면 가드 확인',
    results: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  for (const target of targets) {
    console.log(`Checking target: ${target.path} (${target.name})...`);
    const targetUrl = `${BASE_URL}/${target.path}`;
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const shotName = `11-${target.name}.png`;
    const shotPath = path.join(SHOTS_DIR, shotName);
    await page.screenshot({ path: shotPath, fullPage: true });

    const finalUrl = page.url();
    const title = await page.title();
    const bodySnippet = (await page.innerText('body')).slice(0, 600);

    // 차단 여부 판정 (권한 없음 안내 문구 또는 리다이렉트 여부)
    const isBlocked = bodySnippet.includes('권한이 없') ||
                      bodySnippet.includes('접근할 수 없') ||
                      bodySnippet.includes('로그인이 필요') ||
                      !finalUrl.includes(target.path.replace('#', ''));

    console.log(`Target ${target.path}: finalUrl=${finalUrl}, isBlocked=${isBlocked}`);

    report.results.push({
      target: target.path,
      name: target.name,
      finalUrl,
      title,
      isBlocked,
      bodySnippet,
      screenshot: `tmp-integrity/C4/screenshots/${shotName}`
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'test_11_result.json'), JSON.stringify(report, null, 2));

  await browser.close();
  console.log('=== Test 11 Finished ===');
}

runForbiddenScreensTest().catch(err => {
  console.error('Test 11 Failed:', err);
  process.exit(1);
});
