import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runWishlistTest() {
  console.log('=== Starting Test 8: Wishlist & Recent Views ===');
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

  const report = {
    steps: []
  };

  // 1. 홈 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 검색 화면 (과외쌤 홈의 카드 목록 또는 학생찾기)
  console.log('Navigating to Tutor Home (#/tutor)...');
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-01-home-cards.png'), fullPage: true });

  // 카드 내 찜(하트) 버튼 찾기
  // .card-wish, [data-action="wishlist-toggle"], button:has-text("♡"), button:has-text("♥")
  const wishButtons = await page.$$('button[data-action*="wish"], button.card-action--wish, button:has-text("♡"), [aria-label*="찜"]');
  console.log('Found wish buttons on Home:', wishButtons.length);

  let targetCardId = null;
  let targetCardTitle = null;

  if (wishButtons.length > 0) {
    const firstWishBtn = wishButtons[0];
    const parentCard = await firstWishBtn.evaluate(el => {
      const card = el.closest('.home-card, .search-card, article, .tier-card');
      return {
        text: card?.innerText?.slice(0, 100),
        id: card?.getAttribute('data-id') || card?.getAttribute('data-card-id')
      };
    });
    console.log('Target card to wish:', parentCard);
    targetCardTitle = parentCard.text;

    // 찜 클릭
    console.log('Clicking wish button...');
    await firstWishBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS_DIR, '08-02-card-wished.png') });

    report.steps.push({
      step: 'wish_toggle_on',
      targetCard: parentCard
    });

    // 3. 마이페이지 찜한 공부방·과외쌤 (#/mypage/wishlist) 이동
    console.log('Navigating to #/mypage/wishlist ...');
    await page.goto(`${BASE_URL}/#/mypage/wishlist`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '08-03-mypage-wishlist.png'), fullPage: true });

    const wishlistText = await page.innerText('body');
    const isWishedInMypage = targetCardTitle ? wishlistText.includes(targetCardTitle.split('\n')[0].trim()) : false;
    console.log('Is wished card visible in mypage wishlist:', isWishedInMypage);

    report.steps.push({
      step: 'verify_wishlist',
      visibleInMypage: isWishedInMypage
    });

    // 4. 찜 해제 (마이페이지에서 해제 또는 홈에서 다시 클릭)
    console.log('Unwishing card...');
    const unpickBtn = await page.$('button[data-action="wishlist-remove"], button:has-text("삭제"), button:has-text("찜 해제"), button:has-text("♥")');
    if (unpickBtn) {
      await unpickBtn.click();
      await page.waitForTimeout(1500);
    } else {
      // 홈으로 돌아가서 다시 하트 클릭
      await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const reWishBtn = (await page.$$('button[data-action*="wish"], button.card-action--wish, button:has-text("♥"), [aria-label*="찜"]'))[0];
      if (reWishBtn) await reWishBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: path.join(SHOTS_DIR, '08-04-card-unwished.png') });

    // 5. 마이페이지 찜 목록에서 빠졌는지 확인
    await page.goto(`${BASE_URL}/#/mypage/wishlist`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '08-05-mypage-wishlist-cleared.png'), fullPage: true });

    const wishlistClearedText = await page.innerText('body');
    const isWishCleared = targetCardTitle ? !wishlistClearedText.includes(targetCardTitle.split('\n')[0].trim()) : true;
    console.log('Is wished card removed from wishlist (restored):', isWishCleared);

    report.steps.push({
      step: 'unwish_and_restore',
      cleared: isWishCleared
    });
  } else {
    console.warn('No wish button found on Home. Checking search page...');
  }

  // 6. 최근열람 기록 반영 확인 (#/mypage/recent)
  console.log('Checking recent views (#/mypage/recent)...');
  await page.goto(`${BASE_URL}/#/mypage/recent`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-06-mypage-recent.png'), fullPage: true });

  const recentText = await page.innerText('body');
  const hasRecentSection = recentText.includes('최근열람') || recentText.includes('최근 열람');
  console.log('Recent views page loaded:', hasRecentSection);

  report.steps.push({
    step: 'recent_views',
    pageLoaded: hasRecentSection,
    snippet: recentText.slice(0, 500)
  });

  fs.writeFileSync(path.join(OUT_DIR, 'test_08_result.json'), JSON.stringify(report, null, 2));

  await browser.close();
  console.log('=== Test 8 Finished ===');
}

runWishlistTest().catch(err => {
  console.error('Test 8 Failed:', err);
  process.exit(1);
});
