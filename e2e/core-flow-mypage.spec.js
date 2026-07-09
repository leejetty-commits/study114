/**
 * [6단계] 마이페이지 — 찜 · 비교 · 최근열람 (로컬 실측)
 * 전제: home-ui :5174 · search-ui :5176 · API :8080
 */
import { test, expect } from '@playwright/test';
import {
  HOME,
  devLoginParent,
  clearCompareHandoff,
  openFirstStudyRoomDetail,
  getDetailTitle,
  ensureWishlisted,
  closeDetailModal,
} from './helpers/mypage-flow.js';

const SEARCH = process.env.STUDY114_SEARCH_UI_URL || 'http://127.0.0.1:5176';

test.describe('[6단계] parent 마이페이지 · 찜', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginParent(page);
    await clearCompareHandoff(page);
  });

  test('상세 찜 → 마이페이지 찜 목록 노출', async ({ page }) => {
    await page.goto(`${HOME}/#/parent`);
    await openFirstStudyRoomDetail(page);
    const title = (await getDetailTitle(page)).trim();
    await ensureWishlisted(page);
    await closeDetailModal(page);

    await page.goto(`${HOME}/#/mypage/wishlist`);
    await page.waitForSelector('.mypage-panel', { timeout: 30_000 });
    await expect(page.locator('.mypage-entity-list').getByText(title, { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    const fav = await page.request.get('/api/handoff/favorites.php?target_type=study_room');
    expect(fav.ok()).toBeTruthy();
    const favBody = await fav.json();
    expect(favBody.items?.length).toBeGreaterThan(0);
  });
});

test.describe('[6단계] parent 마이페이지 · 비교', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginParent(page);
    await clearCompareHandoff(page);
  });

  test('상세 비교 → compare-bar · API count', async ({ page }) => {
    await page.goto(`${HOME}/#/parent`);
    await openFirstStudyRoomDetail(page);
    const card = page.locator('[data-provider-kind="study_room"][data-provider-id]').first();
    const targetId = Number(await card.getAttribute('data-provider-id'));

    await page.locator('#p24-detail-modal [data-p24-action="compare-toggle"]').first().click();
    await expect(page.locator('#p24-detail-modal .p24-compare-aware__badge.is-on')).toBeVisible({
      timeout: 10_000,
    });
    await closeDetailModal(page);
    await expect(page.locator('.compare-bar')).toBeVisible({ timeout: 10_000 });

    const cmp = await page.request.get('/api/handoff/compare.php?target_type=study_room');
    expect(cmp.ok()).toBeTruthy();
    const cmpBody = await cmp.json();
    expect(cmpBody.count).toBe(1);
    expect(cmpBody.items?.some((i) => Number(i.target_id) === targetId)).toBe(true);
  });

  test('찜 목록에서 비교 담기', async ({ page }) => {
    await page.goto(`${HOME}/#/parent`);
    await openFirstStudyRoomDetail(page);
    await ensureWishlisted(page);
    await closeDetailModal(page);

    await page.goto(`${HOME}/#/mypage/wishlist`);
    await page.waitForSelector('[data-mypage-wish-compare]', { timeout: 30_000 });
    await page.locator('[data-mypage-wish-compare][data-kind="study_room"]').first().click();

    const cmp = await page.request.get('/api/handoff/compare.php?target_type=study_room');
    const cmpBody = await cmp.json();
    expect(cmpBody.count).toBeGreaterThan(0);

    // compare-bar는 parent 홈 등 탐색 화면에만 렌더 (마이페이지 본문에는 없음)
    await page.goto(`${HOME}/#/parent`);
    await expect(page.locator('.compare-bar')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('[6단계] parent 마이페이지 · 최근열람', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginParent(page);
  });

  test('search-ui 상세 열람 → 마이페이지 최근열람 기록', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/tutor?role=parent`);
    await page.waitForSelector('[data-provider-kind="tutor"]', { timeout: 30_000 });
    const card = page.locator('[data-provider-kind="tutor"][data-provider-id]').first();
    await card.click();
    await expect(page.locator('#p24-detail-modal')).toBeVisible();
    const title = (await getDetailTitle(page)).trim();
    await closeDetailModal(page);

    await page.goto(`${HOME}/#/mypage/recent`);
    await page.waitForSelector('.mypage-entity-list', { timeout: 30_000 });
    await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 15_000 });

    const recent = await page.request.get('/api/handoff/recent.php');
    expect(recent.ok()).toBeTruthy();
    const recentBody = await recent.json();
    expect(recentBody.items?.some((i) => String(i.title_snapshot ?? '').includes(title.slice(0, 8)))).toBe(
      true,
    );
  });
});
