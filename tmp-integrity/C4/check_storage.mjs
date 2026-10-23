import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function checkStorage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/#/mypage/wishlist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const lsData = await page.evaluate(() => {
    return {
      allKeys: Object.keys(localStorage),
      userActions: localStorage.getItem('study114-preview-user-actions'),
      studentWishlist: localStorage.getItem('study114-preview-student-wishlist'),
      recentViews: localStorage.getItem('study114-recent-views')
    };
  });
  console.log('LocalStorage State:', JSON.stringify(lsData, null, 2));

  await browser.close();
}

checkStorage().catch(console.error);
