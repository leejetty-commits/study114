/**
 * [1단계] 진입/라우팅 기본 점검 — home-ui hash routes
 * 전제: home-ui :5174 · API :8080 (선택)
 */
import { test, expect } from '@playwright/test';

const HOME_ROUTES = [
  { hash: '#/guest', marker: '[data-screen="guest"], .guest-home, #app' },
  { hash: '#/parent', marker: '#app' },
  { hash: '#/study-room', marker: '#app' },
  { hash: '#/tutor', marker: '#app' },
  { hash: '#/support', marker: '#app' },
  { hash: '#/mypage', marker: '#app' },
  { hash: '#/library', marker: '#app' },
];

test.describe('[1단계] home-ui 라우팅', () => {
  for (const { hash, marker } of HOME_ROUTES) {
    test(`${hash} 진입`, async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#app', { timeout: 30_000 });
      await page.evaluate((h) => {
        window.location.hash = h;
      }, hash);
      await page.waitForTimeout(400);
      const app = page.locator(marker).first();
      await expect(app).toBeVisible();
      const html = await page.locator('#app').innerHTML();
      expect(html.length).toBeGreaterThan(100);
      expect(html).not.toMatch(/프리뷰 로드 오류/);
    });
  }

  test('빈 hash → #/guest 리다이렉트', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 30_000 });
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#/guest');
  });
});
