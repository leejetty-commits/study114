/**
 * [4단계] 홈 → 검색 → 상세 플로우 (로컬 실측)
 * 전제: home-ui :5174 · search-ui :5176 · API :8080
 */
import { test, expect } from '@playwright/test';

const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';
const SEARCH = process.env.STUDY114_SEARCH_UI_URL || 'http://127.0.0.1:5176';

async function devLoginParent(page) {
  await page.request.post('/api/auth/login.php', {
    data: { email: 'guardian1@dev.local', password: 'password' },
  });
}

async function openFirstStudyRoomDetail(page) {
  const card = page.locator('[data-provider-kind="study_room"][data-provider-id]').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 10_000 });
}

test.describe('[4단계] guest 홈 → 검색 → 상세', () => {
  test('guest #/guest 진입 · GNB 공부방찾기', async ({ page }) => {
    await page.goto(`${HOME}/#/guest`);
    await page.waitForSelector('nav.home-gnb', { timeout: 30_000 });
    const findRoom = page.locator('nav.home-gnb [data-action="gnb-find_room"]').first();
    await expect(findRoom).toBeVisible();
    await expect(findRoom).toContainText('공부방');
  });

  test('guest GNB 공부방찾기 → search-ui 새 탭', async ({ context, page }) => {
    await page.goto(`${HOME}/#/guest`);
    await page.waitForSelector('nav.home-gnb', { timeout: 30_000 });
    const [searchPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('nav.home-gnb [data-action="gnb-find_room"]').first().click(),
    ]);
    await searchPage.waitForLoadState('domcontentloaded');
    expect(searchPage.url()).toMatch(/#\/search\/room/);
    await searchPage.close();
  });

  test('guest 홈 카드 클릭 → 상세 모달 · 로그인 CTA', async ({ page }) => {
    await page.goto(`${HOME}/#/guest`);
    await page.waitForSelector('[data-provider-kind="study_room"]', { timeout: 30_000 });
    await openFirstStudyRoomDetail(page);
    await expect(page.getByRole('button', { name: '로그인하고 문의하기' })).toBeVisible();
    await page.locator('[data-p24-action="close"]').click();
    await expect(page.locator('#p24-detail-modal')).toHaveCount(0);
  });

  test('search-ui region feed → 카드 상세 · guest 로그인 CTA', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/room?role=guest`);
    await page.waitForSelector('.search-results', { timeout: 30_000 });
    await openFirstStudyRoomDetail(page);
    await expect(page.getByRole('button', { name: '로그인하고 문의하기' })).toBeVisible();
  });

  test('search-ui 검색 실행 → 결과 유지 → reset', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/room?role=guest`);
    await page.waitForSelector('[data-search-form]', { timeout: 30_000 });
    const form = page.locator('[data-search-form]');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('.search-results--executed')).toBeVisible({ timeout: 15_000 });
    await page.locator('[data-action="reset-filters"]').click();
    await expect(page.locator('.search-results--pre')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('[4단계] parent 홈 → 검색 → 상세 · 행동', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginParent(page);
    await page.request.delete('/api/handoff/compare.php?target_type=study_room');
    await page.request.delete('/api/handoff/compare.php?target_type=tutor');
  });

  test('parent #/parent 인라인 찾기 · 상세 · 찜/비교', async ({ page }) => {
    await page.goto(`${HOME}/#/parent`);
    await page.waitForSelector('[data-search-form]', { timeout: 30_000 });
    await openFirstStudyRoomDetail(page);

    const wishBtn = page.locator('#p24-detail-modal [data-p24-action="wish-toggle"]').first();
    await expect(wishBtn).toBeVisible();
    const labelBefore = await wishBtn.textContent();
    await wishBtn.click();
    await openFirstStudyRoomDetail(page);
    const labelAfter = await page.locator('#p24-detail-modal [data-p24-action="wish-toggle"]').first().textContent();
    expect(labelAfter).not.toBe(labelBefore);

    const compareBtn = page.locator('#p24-detail-modal [data-p24-action="compare-toggle"]').first();
    await compareBtn.click();
    await expect(page.locator('#p24-detail-modal .p24-compare-aware__badge.is-on')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('[data-p24-action="close"]').click();
    await expect(page.locator('.compare-bar')).toBeVisible({ timeout: 10_000 });
  });

  test('parent 상세 → 쪽지 시작', async ({ page }) => {
    await page.goto(`${HOME}/#/parent`);
    await page.waitForSelector('[data-provider-kind="study_room"]', { timeout: 30_000 });
    await openFirstStudyRoomDetail(page);
    const memoBtn = page.getByRole('button', { name: '상담/쪽지 보내기' });
    await expect(memoBtn).toBeVisible();
    await memoBtn.click();
    await expect(page.locator('[data-overlay="compose"]')).toBeVisible({ timeout: 10_000 });
  });

  test('search-ui parent 역할 · 상세 · 최근열람 기록', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/tutor?role=parent`);
    await page.waitForSelector('[data-provider-kind="tutor"]', { timeout: 30_000 });
    const card = page.locator('[data-provider-kind="tutor"][data-provider-id]').first();
    await card.click();
    await expect(page.locator('#p24-detail-modal')).toBeVisible();
    await page.locator('[data-p24-action="close"]').click();

    await page.goto(`${HOME}/#/mypage/recent`);
    await page.waitForSelector('#app', { timeout: 30_000 });
    const recentText = await page.locator('#app').innerText();
    expect(recentText.length).toBeGreaterThan(50);
  });
});
