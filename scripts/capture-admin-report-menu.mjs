/**
 * Playwright를 통한 실렌더 확인 및 스크린샷 캡처
 * 실행: node scripts/capture-admin-report-menu.mjs
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const assetsDir = join(root, 'docs', 'worklog', '2026', '10', 'assets', 'admin-report-menu');

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');
const { createServer } = await import('file:///d:/work/study114/preview/home-ui/node_modules/vite/dist/node/index.js');

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

async function assertPrintIsolation(page, expectedTitleKeyword, contextLabel) {
  const visibleText = await page.evaluate(() => document.body.innerText);

  // 1. 없어야 하는 것:
  // - hubLead: 「신고 대응, 노출 보정, 제출자료 확인처럼 서비스 운영에 필요한 최소 조치만 모았습니다」
  if (visibleText.includes('신고 대응') || visibleText.includes('노출 보정')) {
    throw new Error(`FAIL [${contextLabel}]: 인쇄 모드에 hubLead 문장이 노출되었습니다! text snippet: ${visibleText.slice(0, 300)}`);
  }
  // - 오늘 할 일
  if (visibleText.includes('오늘 할 일')) {
    throw new Error(`FAIL [${contextLabel}]: 인쇄 모드에 「오늘 할 일」이 노출되었습니다!`);
  }
  // - 사이드바 메뉴 (예: 공지·안내 글, 마켓·결제, 회원관리 등)
  if (visibleText.includes('공지·안내 글') || visibleText.includes('마켓·결제') || visibleText.includes('회원관리')) {
    throw new Error(`FAIL [${contextLabel}]: 인쇄 모드에 사이드바 메뉴가 노출되었습니다!`);
  }

  // 2. 있어야 하는 것:
  // - 보고서 제목
  if (!visibleText.includes(expectedTitleKeyword)) {
    throw new Error(`FAIL [${contextLabel}]: 인쇄 모드에 보고서 제목('${expectedTitleKeyword}')이 노출되지 않았습니다! visibleText: ${visibleText}`);
  }
  // - ①~⑤ 라인
  const requiredPrefixes = ['①', '②', '③', '④', '⑤'];
  for (const prefix of requiredPrefixes) {
    if (!visibleText.includes(prefix)) {
      throw new Error(`FAIL [${contextLabel}]: 인쇄 모드에 라인 '${prefix}' 항목이 노출되지 않았습니다! visibleText: ${visibleText}`);
    }
  }
  // - 출력 시각
  if (!visibleText.includes('출력 시각')) {
    throw new Error(`FAIL [${contextLabel}]: 인쇄 모드에 출력 시각이 노출되지 않았습니다! visibleText: ${visibleText}`);
  }

  console.log(`PASS [${contextLabel}]: 인쇄 모드 격리 단언 통과 (안내문/오늘할일/사이드바 없음, 제목/①~⑤/출력시각만 노출)`);
}

async function main() {
  console.log('1. Starting Vite preview/dev server...');
  const server = await createServer({
    root: join(root, 'preview', 'home-ui'),
    server: { port: 5188, host: '127.0.0.1' },
    configFile: join(root, 'preview', 'home-ui', 'vite.config.js'),
  });
  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === 'object' ? address.port : 5188;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server listening on ${baseUrl}`);

  console.log('2. Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // API 목(mock) 설정 - Playwright LIFO 우선순위이므로 catch-all을 먼저 등록
  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [], list: [] }),
    });
  });

  await page.route('**/api/auth/me.php*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        authenticated: true,
        email_verified: true,
        user_id: 1,
        email: 'admin@study114.net',
        role_type: 'admin',
        name: '최고관리자',
        admin_level: 'super_admin',
        must_change_password: false,
        oauth_role_pending: false,
      }),
    });
  });

  await page.route('**/api/auth/login.php*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        user: {
          user_id: 1,
          email: 'admin@study114.net',
          role_type: 'admin',
          name: '최고관리자',
          email_verified: true,
          admin_level: 'super_admin',
          must_change_password: false,
        },
      }),
    });
  });

  await page.route('**/api/admin/settlement-lines.php*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        line: 'pay',
        page: 1,
        per_page: 50,
        total: 0,
        items: [],
        link: '/admin/commerce',
      }),
    });
  });

  await page.route('**/api/admin/settlement-report.php*', async (route) => {
    const url = new URL(route.request().url());
    const period = url.searchParams.get('period') || 'day';
    const date = url.searchParams.get('date') || '';

    if (period === 'day') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          state: 'ready',
          period: 'day',
          date: date || '2026-10-07',
          report: {
            period_kind: 'day',
            period_start: date || '2026-10-07',
            period_end: date || '2026-10-07',
            print_title: `일일정산서 ${date || '2026-10-07'}`,
            is_backfill: 0,
            body_lines: [
              '① 결제 3건 350,000원 (공부방 2건 200,000원 · 과외쌤 1건 150,000원 · 학생 0건 0원)',
              '② 남은 응대 문의 2 · 신고 0',
              '③ 등록 공부방 1 · 과외쌤 1 · 학생 3',
              '④ 탈퇴 공부방 0 · 과외쌤 0 · 학생 0 / 관리자 삭제 공부방 0 · 과외쌤 0 · 학생 0',
              '⑤ 홈 팝업 1개',
            ],
          },
        }),
      });
      return;
    }

    if (period === 'week') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          state: 'missing',
          period: 'week',
          date: date || '2026-10-05',
          report: null,
        }),
      });
      return;
    }

    // month
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        state: 'missing',
        period: 'month',
        date: date || '2026-10-01',
        report: null,
      }),
    });
  });

  console.log('3. Navigating to /#/admin (운영 홈)...');
  await page.goto(`${baseUrl}/#/admin`);
  
  // 게이트 화면이 뜰 경우 dev-login-admin 클릭
  const devLoginBtn = page.locator('[data-action="dev-login-admin"]').first();
  if (await devLoginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Clicking dev-login-admin button...');
    await devLoginBtn.click();
  }

  await page.waitForSelector('[data-settlement-root]', { timeout: 10000 });
  await page.waitForSelector('[data-today-root]', { timeout: 10000 });

  // window.print 스파이 심기
  await page.evaluate(() => {
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls++;
    };
  });

  // (a) 운영 홈에서 보고서가 오늘 할 일 위에 위치하는지 확인
  const settlementBox = await page.locator('[data-settlement-root]').boundingBox();
  const todayBox = await page.locator('[data-today-root]').boundingBox();
  console.log(`Settlement Y: ${settlementBox?.y}, Today Y: ${todayBox?.y}`);
  if (!settlementBox || !todayBox || settlementBox.y >= todayBox.y) {
    throw new Error('FAIL: 보고서가 오늘 할 일 위에 위치하지 않습니다!');
  }
  console.log('PASS: (a) 보고서가 오늘 할 일 위에 위치함 확인!');

  // 스크린샷 1: 운영 홈 화면 (보고서 + 오늘 할 일)
  await page.screenshot({
    path: join(assetsDir, '01-admin-hub-report-above-today.png'),
    fullPage: false,
  });
  console.log('Saved 01-admin-hub-report-above-today.png');

  // (b) 메뉴 순서 확인: 홍보 런치가 공지·안내 글 아래, 마켓·결제 위에 위치
  const sidebarNavText = await page.locator('.admin-sidebar__nav').innerText();
  const noticesIndex = sidebarNavText.indexOf('공지·안내 글');
  const promoIndex = sidebarNavText.indexOf('홍보 런치');
  const commerceIndex = sidebarNavText.indexOf('마켓·결제');
  console.log(`Menu indices - 공지·안내 글: ${noticesIndex}, 홍보 런치: ${promoIndex}, 마켓·결제: ${commerceIndex}`);
  if (noticesIndex === -1 || promoIndex === -1 || commerceIndex === -1 || !(noticesIndex < promoIndex && promoIndex < commerceIndex)) {
    throw new Error('FAIL: 메뉴 순서가 올바르지 않습니다!');
  }
  console.log('PASS: (b) 홍보 런치가 공지·안내 글 아래, 마켓·결제 위에 위치함 확인!');

  // 사이드바 포커스 스크린샷
  await page.locator('.admin-sidebar').screenshot({
    path: join(assetsDir, '02-admin-sidebar-menu-order.png'),
  });
  console.log('Saved 02-admin-sidebar-menu-order.png');

  // (c) 일간 ready 상태 인쇄 클릭 검증
  const initialPrintCalls = await page.evaluate(() => window.__printCalls);
  const printBtn = page.locator('[data-settlement-print]');
  await printBtn.waitFor({ state: 'visible' });
  const isDayPrintDisabled = await printBtn.isDisabled();
  console.log(`Day print button disabled? ${isDayPrintDisabled}`);
  if (isDayPrintDisabled) {
    throw new Error('FAIL: 일간 ready 상태에서 인쇄 버튼이 비활성화되어 있습니다!');
  }
  await printBtn.click();
  const afterDayPrintCalls = await page.evaluate(() => window.__printCalls);
  console.log(`Print calls after day click: ${afterDayPrintCalls} (initial: ${initialPrintCalls})`);
  if (afterDayPrintCalls <= initialPrintCalls) {
    throw new Error('FAIL: 일간 ready 상태에서 인쇄 버튼 클릭 시 window.print가 호출되지 않았습니다!');
  }
  console.log('PASS: (c) 일간 ready 인쇄 버튼 클릭 시 window.print 호출 확인!');

  // print 미디어 에뮬레이션 스크린샷 및 인쇄 모드 격리 단언
  await page.emulateMedia({ media: 'print' });
  await assertPrintIsolation(page, '일일정산서', '운영 홈 일간 ready');
  await page.screenshot({
    path: join(assetsDir, '03-report-day-ready-print.png'),
    fullPage: false,
  });
  console.log('Saved 03-report-day-ready-print.png');
  await page.emulateMedia({ media: 'screen' });

  // (d) 주간 missing 상태 검증
  console.log('Testing Week (missing) state...');
  await page.locator('[data-settlement-tab="week"]').click();
  // 라인에 주간 기본 포맷이 표시될 때까지 대기
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-settlement-root]');
    return root && root.getAttribute('data-period') === 'week' && document.body.innerText.includes('② 새 응대 내역 없음');
  });

  const isWeekPrintDisabled = await printBtn.isDisabled();
  console.log(`Week print button disabled? ${isWeekPrintDisabled}`);
  if (isWeekPrintDisabled) {
    throw new Error('FAIL: 주간 missing 상태에서 인쇄 버튼이 비활성화되어 있습니다!');
  }

  const beforeWeekPrintCalls = await page.evaluate(() => window.__printCalls);
  await printBtn.click();
  const afterWeekPrintCalls = await page.evaluate(() => window.__printCalls);
  console.log(`Print calls after week click: ${afterWeekPrintCalls} (before: ${beforeWeekPrintCalls})`);
  if (afterWeekPrintCalls <= beforeWeekPrintCalls) {
    throw new Error('FAIL: 주간 missing 상태에서 인쇄 버튼 클릭 시 window.print가 호출되지 않았습니다!');
  }
  console.log('PASS: (d) 주간 missing 인쇄 버튼 클릭 시 window.print 호출 확인!');

  // 주간 인쇄 시트 확인 및 인쇄 모드 격리 단언
  await page.emulateMedia({ media: 'print' });
  await assertPrintIsolation(page, '주간 보고서', '운영 홈 주간 missing');
  await page.screenshot({
    path: join(assetsDir, '04-report-week-missing-print.png'),
    fullPage: false,
  });
  console.log('Saved 04-report-week-missing-print.png');
  await page.emulateMedia({ media: 'screen' });

  // (e) 월간 missing 상태 검증
  console.log('Testing Month (missing) state...');
  await page.locator('[data-settlement-tab="month"]').click();
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-settlement-root]');
    const title = root?.querySelector('[data-settlement-print-title]');
    return root && root.getAttribute('data-period') === 'month' && title?.textContent?.includes('월간 보고서');
  });

  const isMonthPrintDisabled = await printBtn.isDisabled();
  console.log(`Month print button disabled? ${isMonthPrintDisabled}`);
  if (isMonthPrintDisabled) {
    throw new Error('FAIL: 월간 missing 상태에서 인쇄 버튼이 비활성화되어 있습니다!');
  }

  const beforeMonthPrintCalls = await page.evaluate(() => window.__printCalls);
  await printBtn.click();
  const afterMonthPrintCalls = await page.evaluate(() => window.__printCalls);
  console.log(`Print calls after month click: ${afterMonthPrintCalls} (before: ${beforeMonthPrintCalls})`);
  if (afterMonthPrintCalls <= beforeMonthPrintCalls) {
    throw new Error('FAIL: 월간 missing 상태에서 인쇄 버튼 클릭 시 window.print가 호출되지 않았습니다!');
  }
  console.log('PASS: (e) 월간 missing 인쇄 버튼 클릭 시 window.print 호출 확인!');

  await page.emulateMedia({ media: 'print' });
  await assertPrintIsolation(page, '월간 보고서', '운영 홈 월간 missing');
  await page.screenshot({
    path: join(assetsDir, '05-report-month-missing-print.png'),
    fullPage: false,
  });
  console.log('Saved 05-report-month-missing-print.png');
  await page.emulateMedia({ media: 'screen' });

  // (f) 직접 주소 /#/admin/settlement 단독 페이지 확인
  console.log('Testing Direct Route /#/admin/settlement...');
  await page.goto(`${baseUrl}/#/admin/settlement`);
  await page.waitForSelector('[data-settlement-root]');
  await page.screenshot({
    path: join(assetsDir, '06-admin-settlement-direct-page.png'),
    fullPage: false,
  });
  console.log('Saved 06-admin-settlement-direct-page.png');

  // (g) 단독 화면 인쇄 모드 및 격리 단언
  console.log('Testing Direct Route Print Mode...');
  const directPrintBtn = page.locator('[data-settlement-print]');
  await directPrintBtn.waitFor({ state: 'visible' });
  await directPrintBtn.click();
  await page.emulateMedia({ media: 'print' });
  await assertPrintIsolation(page, '일일정산서', '단독 화면 /admin/settlement 인쇄');
  await page.screenshot({
    path: join(assetsDir, '07-admin-settlement-direct-print.png'),
    fullPage: false,
  });
  console.log('Saved 07-admin-settlement-direct-print.png');
  await page.emulateMedia({ media: 'screen' });

  console.log('All tests passed successfully!');
  await browser.close();
  await server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
