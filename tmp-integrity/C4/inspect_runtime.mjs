import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function inspectRuntime() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // 홈 먼저 방문해서 auth-session 초기화 확인
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 현재 세션 상태 확인
  const sessionInfo = await page.evaluate(async () => {
    // sessionStorage 내용
    const ss = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      ss[k] = sessionStorage.getItem(k);
    }
    // localStorage 내용
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      ls[k] = localStorage.getItem(k);
    }
    // API /api/auth/me.php 호출 결과 직접 fetch
    let meResp = null;
    try {
      const r = await fetch('/api/auth/me.php');
      meResp = { status: r.status, data: await r.json() };
    } catch (e) {
      meResp = { error: e.message };
    }

    return {
      sessionStorage: ss,
      localStorage: ls,
      meResp
    };
  });

  console.log('Session Info:', JSON.stringify(sessionInfo, null, 2));

  // 이제 #/community/tutor 로 이동
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const commState = await page.evaluate(() => {
    return {
      activeRoleKey: sessionStorage.getItem('study114_active_role'),
      url: window.location.href,
      htmlSnippet: document.querySelector('.hero-band, .concern-note, .concern-list')?.outerHTML
    };
  });
  console.log('Comm State:', JSON.stringify(commState, null, 2));

  await browser.close();
}

inspectRuntime();
