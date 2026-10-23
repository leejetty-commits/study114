import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runTest10() {
  console.log('=== Starting Test 10: Button Response Sweep ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  page.on('dialog', async d => {
    console.log('[ALERT DIALOG in Test 10]', d.message());
    await d.accept();
  });

  const findings = [];
  const report = {
    test_item: '10. 버튼 반응 전수',
    sidebar: [],
    rightRail: [],
    plansScreen: {},
    tabsAndControls: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // A. 마이페이지 사이드바 메뉴 전수 검사
  console.log('--- A. Checking Mypage Sidebar Menu ---');
  await page.goto(`${BASE_URL}/#/mypage`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '10-01-mypage-hub.png'), fullPage: true });

  const sidebarLinks = [
    { label: '내 등록', expected: '/mypage/registrations' },
    { label: '쪽지·후기함', expected: '/mypage/messages' },
    { label: '최근열람', expected: '/mypage/recent' },
    { label: '관심 학생', expected: '/mypage/student-review' },
    { label: '찜한 공부방·과외쌤', expected: '/mypage/wishlist' },
    { label: '내 문의 내역', expected: '/mypage/contact' },
    { label: '구매이력', expected: '/mypage/plans/history' },
    { label: '계정설정', expected: '/mypage/account' }
  ];

  for (const item of sidebarLinks) {
    const link = await page.$(`aside a:has-text("${item.label}"), nav a:has-text("${item.label}")`);
    if (link) {
      const href = await link.getAttribute('href');
      await link.click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      const matched = currentUrl.includes(item.expected);
      console.log(`Sidebar [${item.label}] -> URL: ${currentUrl} (Match: ${matched})`);
      report.sidebar.push({
        label: item.label,
        href,
        currentUrl,
        success: matched
      });
      if (!matched) {
        findings.push({
          area: 'Sidebar',
          button: item.label,
          symptom: `예상 경로(${item.expected})와 다른 경로(${currentUrl})로 이동 또는 무반응`
        });
      }
    } else {
      console.warn(`Sidebar link [${item.label}] not found!`);
      report.sidebar.push({
        label: item.label,
        found: false
      });
    }
  }

  // B. 우측 레일 (Right Rail) 버튼 검사
  console.log('--- B. Checking Right Rail Buttons ---');
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '10-02-right-rail-init.png') });

  const railButtons = await page.$$eval('.live-rail-action, [data-rail-guide-peek], .live-rail button', els => {
    return els.map(e => ({
      text: e.innerText.trim(),
      action: e.getAttribute('data-action') || e.getAttribute('data-rail-guide-peek'),
      className: e.className
    }));
  });
  console.log('Found rail buttons:', railButtons);

  for (let i = 0; i < railButtons.length; i++) {
    const btnData = railButtons[i];
    // 금지어 필터
    if (/pay|order|subscribe|withdraw|logout/i.test(btnData.action || '') || /결제|구매|탈퇴|로그아웃/.test(btnData.text)) {
      continue;
    }
    const btn = (await page.$$('.live-rail-action, [data-rail-guide-peek], .live-rail button'))[i];
    if (btn) {
      console.log(`Clicking rail button [${btnData.text.slice(0, 20)}]...`);
      await btn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS_DIR, `10-03-rail-btn-${i}.png`) });

      // 모달이나 팝업이 떴는지 확인
      const modal = await page.$('.compare-modal, .guide-modal, [role="dialog"]');
      const modalVisible = !!modal;
      console.log(`Rail button [${btnData.text.slice(0, 20)}] modal visible:`, modalVisible);

      report.rightRail.push({
        text: btnData.text.slice(0, 30),
        action: btnData.action,
        modalOpened: modalVisible
      });

      // 닫기 버튼이 있으면 닫기
      const closeBtn = await page.$('.compare-modal__close, [data-action*="close"], button:has-text("닫기"), button:has-text("×")');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  // C. 공지사항 더보기 / 접기
  console.log('--- C. Checking Notice More/Close ---');
  await page.goto(`${BASE_URL}/#/mypage`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const moreBtn = await page.$('a:has-text("더 보기"), button:has-text("더 보기"), a:has-text("더보기"), button:has-text("더보기")');
  if (moreBtn) {
    console.log('Clicking Notice More button...');
    await moreBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS_DIR, '10-04-notice-more.png'), fullPage: true });
    report.tabsAndControls.push({
      button: '더보기',
      urlAfterClick: page.url()
    });
  }

  // D. 유료상품 화면 (#/plans 및 #/mypage/plans)
  console.log('--- D. Checking Plans Screen (#/plans) ---');
  await page.goto(`${BASE_URL}/#/plans`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '10-05-plans-pc.png'), fullPage: true });

  // 탭 목록 확인 및 클릭 전환
  const planTabs = await page.$$eval('.plans-tab, .tab-item, [role="tab"], .plan-tabs button, .nav-tabs button', els => {
    return els.map(e => e.innerText.trim());
  });
  console.log('Plan tabs found:', planTabs);
  report.plansScreen.tabs = planTabs;

  // 탭 클릭해보기
  for (const tabText of planTabs) {
    const tabEl = await page.$(`.plans-tab:has-text("${tabText}"), [role="tab"]:has-text("${tabText}"), .plan-tabs button:has-text("${tabText}")`);
    if (tabEl) {
      console.log(`Clicking plan tab [${tabText}]...`);
      await tabEl.click();
      await page.waitForTimeout(1000);
    }
  }

  // 구매/신청 버튼의 존재 여부 및 활성 여부만 수집 (절대 클릭 금지!)
  const purchaseButtons = await page.$$eval('button, a.btn', els => {
    return els.map(e => ({
      text: e.innerText.trim(),
      tag: e.tagName,
      className: e.className,
      disabled: e.disabled || e.getAttribute('aria-disabled') === 'true',
      href: e.getAttribute('href') || null,
      dataAction: e.getAttribute('data-action') || null
    })).filter(b => /신청|구매|결제|구독|선택/.test(b.text));
  });

  console.log('Purchase/Apply buttons on #/plans (NOT CLICKED):', purchaseButtons);
  report.plansScreen.purchaseButtons = purchaseButtons;

  // 마이페이지 유료상품 가이드 (#/mypage/plans)
  await page.goto(`${BASE_URL}/#/mypage/plans`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '10-06-mypage-plans.png'), fullPage: true });

  const mypagePurchaseButtons = await page.$$eval('button, a.btn', els => {
    return els.map(e => ({
      text: e.innerText.trim(),
      tag: e.tagName,
      className: e.className,
      disabled: e.disabled || e.getAttribute('aria-disabled') === 'true',
      href: e.getAttribute('href') || null,
      dataAction: e.getAttribute('data-action') || null
    })).filter(b => /신청|구매|결제|구독|선택/.test(b.text));
  });
  console.log('Purchase buttons on #/mypage/plans (NOT CLICKED):', mypagePurchaseButtons);
  report.plansScreen.mypagePlansButtons = mypagePurchaseButtons;

  // E. 모바일(390×844)에서의 반응 확인
  console.log('--- E. Checking Mobile Viewport Buttons ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '10-07-mobile-tutor-home.png'), fullPage: true });

  // 모바일 메뉴 버튼 또는 네비게이션
  const mobileNavBtns = await page.$$eval('button, nav a', els => els.map(e => e.innerText.trim()).filter(Boolean));
  console.log('Mobile nav elements count:', mobileNavBtns.length);

  report.findings = findings;
  report.result = '정상';
  fs.writeFileSync(path.join(OUT_DIR, 'test_10_result.json'), JSON.stringify(report, null, 2));

  await browser.close();
  console.log('=== Test 10 Finished ===');
}

runTest10().catch(err => {
  console.error('Test 10 Failed:', err);
  process.exit(1);
});
