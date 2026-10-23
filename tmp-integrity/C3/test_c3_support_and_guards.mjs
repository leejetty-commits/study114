import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C3';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  const viewports = [
    { name: 'pc', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844, isMobile: true }
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log(`======================================================\n`);

    const networkLogs = {
      allowedPosts: [],
      blockedRequests: [],
      consoleErrors: [],
      pageErrors: [],
      failedRequests: []
    };

    function attachListeners(page) {
      page.route('**/api/**', (route, request) => {
        const method = request.method();
        const url = request.url();
        if (method !== 'GET') {
          if (url.includes('/api/search/search.php') || url.includes('/api/search/region-stats.php')) {
            networkLogs.allowedPosts.push({ method, url });
            route.continue();
          } else {
            console.warn(`[SAFETY ABORT] ${method} ${url}`);
            networkLogs.blockedRequests.push({ method, url, postData: request.postData() });
            route.abort('blockedbyclient');
          }
        } else {
          route.continue();
        }
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          networkLogs.consoleErrors.push({ url: page.url(), text: msg.text() });
        }
      });
      page.on('pageerror', err => {
        networkLogs.pageErrors.push({ url: page.url(), message: err.message });
      });
      page.on('response', resp => {
        if (resp.status() >= 400) {
          networkLogs.failedRequests.push({ url: resp.url(), status: resp.status() });
        }
      });
    }

    // ----------------------------------------------------
    // TEST 1: FRESH DIRECT OPEN vs MENU (손님 화면 전환 버그 재현 테스트)
    // ----------------------------------------------------
    console.log(`[${vp.name}] TEST 1: Fresh Direct Open check for community boards...`);
    const directTargets = [
      { id: 'fresh-tutor', path: '/#/community/tutor', label: '과외쌤 고민방 직접 열기' },
      { id: 'fresh-director', path: '/#/community/director', label: '공부방 고민방 직접 열기' },
      { id: 'fresh-parent', path: '/#/community/parent', label: '학부모 고민방 직접 열기' },
      { id: 'fresh-solved', path: '/#/community/solved', label: '해결후기 직접 열기' }
    ];

    for (const tgt of directTargets) {
      // 새 context로 직접 열기 (이전 캐시나 mypage 경유 없음)
      const freshContext = await browser.newContext({
        storageState: STATE_FILE,
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile || false
      });
      const freshPage = await freshContext.newPage();
      attachListeners(freshPage);

      console.log(`[${vp.name}] Fresh direct open: ${tgt.path}`);
      await freshPage.goto(`${BASE_URL}${tgt.path}`, { waitUntil: 'networkidle' });
      await freshPage.waitForTimeout(3000);

      const shotName = `c3-direct-fresh-${tgt.id}-${vp.name}.png`;
      await freshPage.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: true });

      const directState = await freshPage.evaluate(() => {
        const body = document.body.innerText;
        const isGuest = body.includes('로그인') && !body.includes('로그아웃') && !body.includes('로그인:');
        const loginText = Array.from(document.querySelectorAll('.user-info, .auth-status, header, nav')).map(e => e.textContent.trim()).filter(t => t.includes('로그인') || t.includes('이종현과외'));
        return {
          url: window.location.href,
          hash: window.location.hash,
          title: document.title,
          isGuestMode: isGuest,
          headerAuthSnippet: loginText.slice(0, 3),
          bodyHead: body.slice(0, 300)
        };
      });

      results.push({
        section: 'Direct Fresh Open Test',
        viewport: vp.name,
        target: tgt,
        state: directState,
        screenshot: shotName
      });

      await freshContext.close();
    }

    // ----------------------------------------------------
    // TEST 2: 고객센터 전체 점검
    // ----------------------------------------------------
    console.log(`\n[${vp.name}] TEST 2: Support Center Full Test...`);
    const mainContext = await browser.newContext({
      storageState: STATE_FILE,
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile || false
    });
    const page = await mainContext.newPage();
    attachListeners(page);

    // Initial auth warm-up
    await page.goto(`${BASE_URL}/#/mypage/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const supportTargets = [
      { id: 'support-home', path: '/#/support', label: '고객센터 홈' },
      { id: 'support-notice', path: '/#/support/notice', label: '고객센터 공지사항' },
      { id: 'support-faq', path: '/#/support/faq', label: '고객센터 FAQ (전체)' },
      { id: 'support-faq-fee', path: '/#/support/faq/fee', label: '고객센터 FAQ 이용료/유료' },
      { id: 'support-faq-match', path: '/#/support/faq/match', label: '고객센터 FAQ 매칭/연락' },
      { id: 'support-faq-board', path: '/#/support/faq/board', label: '고객센터 FAQ 게시판/커뮤니티' },
      { id: 'support-policies-terms', path: '/#/support/policies/terms', label: '약관' },
      { id: 'support-policies-privacy', path: '/#/support/policies/privacy', label: '개인정보처리방침' },
      { id: 'support-policies-platform', path: '/#/support/policies/platform', label: '플랫폼 고지' },
      { id: 'support-policies-trust', path: '/#/support/policies/trust', label: '신뢰·검증 원칙' },
      { id: 'support-policies-safety', path: '/#/support/policies/safety', label: '안전과외 가이드' },
      { id: 'support-policies-student-privacy', path: '/#/support/policies/student-privacy', label: '학생 개인정보 보호' },
      { id: 'support-policies-reporting', path: '/#/support/policies/reporting', label: '신고 및 분쟁 해결 안내' },
      { id: 'support-policies-account-contact', path: '/#/support/policies/account-contact', label: '계정 및 연락 관리' },
      { id: 'support-library', path: '/#/support/library', label: '고객센터 자료실 안내' },
      { id: 'support-contact', path: '/#/support/contact', label: '문의하기 폼' }
    ];

    for (const st of supportTargets) {
      console.log(`[${vp.name}] Support navigation to ${st.path}...`);
      await page.goto(`${BASE_URL}${st.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);

      const shotName = `c3-support-${st.id}-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: true });

      const state = await page.evaluate(() => {
        const formInputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          name: el.getAttribute('name'),
          placeholder: el.getAttribute('placeholder')
        }));
        const notices = Array.from(document.querySelectorAll('.notice-item, .support-notice-item, tr, .faq-item, .accordion-item')).map(el => ({
          title: el.querySelector('.title, h3, h4, button, summary')?.textContent?.trim() || el.textContent?.slice(0, 40)?.trim()
        }));
        const rightRail = document.querySelector('.right-rail, aside.rail, .side-rail, .rail-column');
        return {
          url: window.location.href,
          hash: window.location.hash,
          title: document.title,
          formInputs,
          itemCount: notices.length,
          sampleItems: notices.slice(0, 3),
          hasRightRail: !!rightRail,
          bodySnippet: document.body.innerText.slice(0, 350)
        };
      });

      results.push({
        section: 'Support Center',
        viewport: vp.name,
        target: st,
        state,
        screenshot: shotName
      });
    }

    // 고객센터 공지사항 상세 확인 (PC에서)
    if (vp.name === 'pc') {
      console.log(`[${vp.name}] Clicking first notice item...`);
      await page.goto(`${BASE_URL}/#/support/notice`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const noticeClickable = await page.evaluate(() => {
        const item = document.querySelector('.notice-item a, tr a, .support-notice-list a, a[href*="/support/notice/"]');
        if (item) return { href: item.getAttribute('href'), text: item.textContent.trim() };
        return null;
      });

      if (noticeClickable) {
        console.log(`[${vp.name}] Found notice link:`, noticeClickable);
        await page.goto(`${BASE_URL}${noticeClickable.href.startsWith('#') ? noticeClickable.href : '#' + noticeClickable.href}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2500);
        const noticeDetailShot = `c3-support-notice-detail-${vp.name}.png`;
        await page.screenshot({ path: path.join(SHOTS_DIR, noticeDetailShot), fullPage: true });
        results.push({
          section: 'Support Notice Detail',
          viewport: vp.name,
          noticeClickable,
          screenshot: noticeDetailShot
        });
      }

      // 문의하기 폼 필드 입력 테스트 (미제출)
      console.log(`[${vp.name}] Testing Support Contact Form inputs (without submitting)...`);
      await page.goto(`${BASE_URL}/#/support/contact`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      try {
        const subjectInput = await page.$('input[name="subject"], input[name="title"], input[placeholder*="제목"], input[type="text"]');
        if (subjectInput) {
          await subjectInput.fill('[테스트미접수] 과외쌤 문의 테스트');
        }
        const messageInput = await page.$('textarea[name="message"], textarea[name="body"], textarea[name="content"], textarea');
        if (messageInput) {
          await messageInput.fill('[테스트미접수] 무결성 검사 중 필드 유효성 테스트입니다. 제출 버튼은 누르지 않습니다.');
        }
        await page.waitForTimeout(1000);
        const contactTypedShot = `c3-support-contact-typed-${vp.name}.png`;
        await page.screenshot({ path: path.join(SHOTS_DIR, contactTypedShot), fullPage: true });
      } catch (e) {
        console.warn('Could not type in contact form:', e.message);
      }
    }

    // ----------------------------------------------------
    // TEST 3: 과외쌤에게 막혀야 하는 주소 점검
    // ----------------------------------------------------
    console.log(`\n[${vp.name}] TEST 3: Forbidden routes for Tutor...`);
    const forbiddenTargets = [
      { id: 'support-admin-notices', path: '/#/support/admin/notices', label: '고객센터 관리 - 공지' },
      { id: 'support-admin-tickets', path: '/#/support/admin/tickets', label: '고객센터 관리 - 티켓' },
      { id: 'admin-hub', path: '/#/admin', label: '관리자 홈' },
      { id: 'admin-tickets', path: '/#/admin/tickets', label: '관리자 티켓' },
      { id: 'register-intro-room', path: '/#/register-intro/room', label: '공부방 등록 인트로' },
      { id: 'register-study-room', path: '/#/register/study-room', label: '공부방 등록' },
      { id: 'mypage-reg-study-rooms', path: '/#/mypage/registrations/study-rooms', label: '마이페이지 공부방 등록' },
      { id: 'register-intro-student', path: '/#/register-intro/student', label: '학생 등록 인트로' },
      { id: 'register-student', path: '/#/register/student', label: '학생 등록' },
      { id: 'mypage-reg-students', path: '/#/mypage/registrations/students', label: '마이페이지 학생 등록' }
    ];

    for (const ft of forbiddenTargets) {
      console.log(`[${vp.name}] Visiting forbidden target: ${ft.path}...`);
      await page.goto(`${BASE_URL}${ft.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const shotName = `c3-forbidden-${ft.id}-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: true });

      const forbiddenState = await page.evaluate(() => {
        const body = document.body.innerText;
        const forms = Array.from(document.querySelectorAll('form, input, select, textarea, button[type="submit"]')).map(el => ({
          tag: el.tagName.toLowerCase(),
          name: el.getAttribute('name'),
          type: el.getAttribute('type'),
          text: el.textContent?.trim()
        }));
        const alerts = Array.from(document.querySelectorAll('.alert, .error, .toast, .auth-guard, .access-denied, .error-page')).map(e => e.textContent.trim());
        return {
          url: window.location.href,
          hash: window.location.hash,
          title: document.title,
          alerts,
          formElementsCount: forms.length,
          bodySnippet: body.slice(0, 400)
        };
      });

      results.push({
        section: 'Forbidden Routes',
        viewport: vp.name,
        target: ft,
        state: forbiddenState,
        screenshot: shotName
      });
    }

    // ----------------------------------------------------
    // TEST 4: 우측 레일 (Right Rail) & 내 공지 & 배너 상세 분석
    // ----------------------------------------------------
    console.log(`\n[${vp.name}] TEST 4: Right rail and personalized banners check...`);
    await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const railInfo = await page.evaluate(() => {
      const rail = document.querySelector('.right-rail, aside.rail, .side-rail, .rail-column, [data-rail]');
      const widgets = Array.from(document.querySelectorAll('.rail-widget, .rail-box, .side-widget, .right-rail-section, .right-rail > div, aside > div')).map(w => ({
        header: w.querySelector('h3, h4, .widget-title, .title')?.textContent?.trim() || '',
        text: w.innerText.slice(0, 200).trim(),
        links: Array.from(w.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))
      }));
      const banners = Array.from(document.querySelectorAll('.banner, .promo-banner, .home-banner, .marketing-banner')).map(b => ({
        text: b.innerText.slice(0, 150).trim(),
        link: b.querySelector('a')?.getAttribute('href') || null
      }));
      return {
        hasRail: !!rail,
        railSnippet: rail ? rail.innerText.slice(0, 500) : null,
        widgets: widgets.slice(0, 8),
        banners
      };
    });

    results.push({
      section: 'Right Rail & Banners',
      viewport: vp.name,
      railInfo
    });

    results.push({
      section: 'Network & Error Summary',
      viewport: vp.name,
      networkLogs
    });

    await mainContext.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT_DIR, 'results_support_guards.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('\n=== Support & Guards test completed. Saved to results_support_guards.json ===\n');
}

run().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
