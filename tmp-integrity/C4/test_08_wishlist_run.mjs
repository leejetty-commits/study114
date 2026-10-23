import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function runTest8() {
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

  // 2. 홈 화면에서 카드 10 (과외 10) 찾기 및 상세 보기 (최근열람 기록용)
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 과외 10번 카드의 상세 모달 열기 또는 상세 링크 클릭하여 최근열람 발생시키기
  const detailTrigger = await page.$('[data-action="wish-toggle"][data-item-id="10"]');
  console.log('Found wish-toggle for tutor 10:', !!detailTrigger);

  // 카드 본문 클릭 또는 상세 열기
  const cardElement = await page.$('.tier-card:has([data-item-id="10"]), article:has([data-item-id="10"]), div:has([data-item-id="10"])');
  if (cardElement) {
    // 상세 보기 버튼이나 카드 클릭
    const detailBtn = await cardElement.$('a, button:has-text("상세"), [data-action*="detail"]');
    if (detailBtn) {
      console.log('Clicking card detail to record recent view...');
      await detailBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS_DIR, '08-01-card-detail-opened.png') });
      // 모달 닫기 버튼이 있으면 닫기
      const closeBtn = await page.$('button[data-action*="close"], button.modal-close, button:has-text("닫기"), .compare-modal__close');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  // 3. 카드 10 찜 추가 클릭
  console.log('Clicking wish button on tutor 10...');
  const wishBtn = await page.$('[data-action="wish-toggle"][data-item-id="10"]');
  await wishBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-02-wish-clicked.png') });

  // 토글 후 상태 확인
  const isWishActive = await page.$eval('[data-action="wish-toggle"][data-item-id="10"]', el => el.classList.contains('is-active') || el.innerText.includes('♥'));
  console.log('Wish button active state on card:', isWishActive);
  report.steps.push({
    step: 'wish_added',
    cardId: '10',
    buttonActive: isWishActive
  });

  // 4. 마이페이지 찜한 공부방·과외쌤 (#/mypage/wishlist) 이동 및 표시 확인
  console.log('Navigating to #/mypage/wishlist...');
  await page.goto(`${BASE_URL}/#/mypage/wishlist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-03-mypage-wishlist.png'), fullPage: true });

  const wishlistContent = await page.innerText('body');
  const hasItemInWishlist = await page.evaluate(() => {
    const list = document.querySelectorAll('.wishlist-modal__row, .wishlist-item, [data-item-id="10"], [data-action="wishlist-remove"]');
    return list.length > 0;
  });
  console.log('Has item in mypage wishlist:', hasItemInWishlist);
  report.steps.push({
    step: 'verify_mypage_wishlist',
    itemVisible: hasItemInWishlist,
    snippet: wishlistContent.slice(0, 400)
  });

  // 5. 마이페이지 최근열람 (#/mypage/recent) 이동 및 표시 확인
  console.log('Navigating to #/mypage/recent...');
  await page.goto(`${BASE_URL}/#/mypage/recent`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-04-mypage-recent.png'), fullPage: true });

  const recentContent = await page.innerText('body');
  const hasRecentItems = await page.evaluate(() => {
    const items = document.querySelectorAll('.recent-item, .recent-list li, article, tr');
    return items.length;
  });
  console.log('Recent page item count:', hasRecentItems);
  report.steps.push({
    step: 'verify_mypage_recent',
    hasRecentItems,
    snippet: recentContent.slice(0, 400)
  });

  // 6. 찜 해제 (마이페이지에서 삭제 버튼 클릭 또는 홈에서 다시 클릭)
  console.log('Unwishing item (restoring)...');
  await page.goto(`${BASE_URL}/#/mypage/wishlist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const removeBtn = await page.$('button[data-action="wishlist-remove"], button[data-action="wish-toggle"]');
  if (removeBtn) {
    console.log('Clicking remove button on mypage wishlist...');
    await removeBtn.click();
    await page.waitForTimeout(1500);
  } else {
    console.log('Navigating back to home to untoggle wish...');
    await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const homeWishBtn = await page.$('[data-action="wish-toggle"][data-item-id="10"]');
    if (homeWishBtn) await homeWishBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-05-unwished.png') });

  // 7. 마이페이지 찜 목록에서 빠졌는지 최종 원복 확인
  await page.goto(`${BASE_URL}/#/mypage/wishlist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-06-mypage-wishlist-empty.png'), fullPage: true });

  const finalWishlistItems = await page.evaluate(() => {
    const list = document.querySelectorAll('.wishlist-modal__row, .wishlist-item, [data-item-id="10"], [data-action="wishlist-remove"]');
    return list.length;
  });
  console.log('Final wishlist item count (should be 0):', finalWishlistItems);
  report.steps.push({
    step: 'unwish_restored',
    finalCount: finalWishlistItems,
    success: finalWishlistItems === 0
  });

  fs.writeFileSync(path.join(OUT_DIR, 'test_08_result.json'), JSON.stringify(report, null, 2));

  await browser.close();
  console.log('=== Test 8 Completed ===');
}

runTest8().catch(err => {
  console.error('Test 8 Failed:', err);
  process.exit(1);
});
