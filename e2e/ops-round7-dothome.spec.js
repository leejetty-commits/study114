/**
 * [라운드 7] 닷홈 운영 실측 — https://study114.dothome.co.kr
 * 실행: STUDY114_PREVIEW_URL=https://study114.dothome.co.kr npx playwright test e2e/ops-round7-dothome.spec.js
 */
import { test, expect } from '@playwright/test';

const PROD = process.env.STUDY114_PREVIEW_URL || 'https://study114.dothome.co.kr';

async function prodLoginParent(page) {
  const res = await page.request.post(`${PROD}/api/auth/login.php`, {
    data: { email: 'guardian1@dev.local', password: 'password' },
  });
  expect(res.ok()).toBeTruthy();
}

async function waitHandoffOn(page) {
  await page.goto(`${PROD}/#/parent`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('handoff ON')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('쪽지 ON')).toBeVisible({ timeout: 15_000 });
}

async function openFirstStudyRoomDetail(page) {
  const card = page.locator('[data-provider-kind="study_room"][data-provider-id]').first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.click();
  await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 15_000 });
}

test.describe('[라운드7] 닷홈 운영 실측', () => {
  test.beforeEach(async ({ page }) => {
    await prodLoginParent(page);
    page.on('dialog', (d) => d.accept());
  });

  test('M1 쪽지 compose → thread 진입 · 본문 표시', async ({ page }) => {
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    const body = `ops7-compose-${Date.now()}`;
    await page.getByRole('button', { name: '상담/쪽지 보내기' }).click();
    await expect(page.locator('[data-overlay="compose"]')).toBeVisible({ timeout: 10_000 });
    const overlay = page.locator('[data-overlay="compose"]');
    await overlay.locator('.msg-compose__textarea').fill(body);
    await overlay.locator('[data-action="compose-send"]').click();
    await page.waitForURL(/#\/mypage\/messages\/thread\/\d+/, { timeout: 30_000 });
    await expect(page.locator('.msg-bubble--me').filter({ hasText: body })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('M2 상세 모달 → compose 후 모달 닫힘', async ({ page }) => {
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    const body = `ops7-modal-${Date.now()}`;
    await page.getByRole('button', { name: '상담/쪽지 보내기' }).click();
    await page.locator('[data-overlay="compose"] .msg-compose__textarea').fill(body);
    await page.locator('[data-action="compose-send"]').click();
    await page.waitForURL(/#\/mypage\/messages\/thread\/\d+/, { timeout: 30_000 });
    await expect(page.locator('#p24-detail-modal')).toHaveCount(0, { timeout: 10_000 });
  });

  test('M3 차단 → 차단됨 배너 · 답장 불가', async ({ page }) => {
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    const body = `ops7-block-${Date.now()}`;
    await page.getByRole('button', { name: '상담/쪽지 보내기' }).click();
    await page.locator('[data-overlay="compose"] .msg-compose__textarea').fill(body);
    await page.locator('[data-action="compose-send"]').click();
    await page.waitForURL(/#\/mypage\/messages\/thread\/\d+/, { timeout: 30_000 });
    const blockBtn = page.locator('[data-msg-action="block"]');
    await expect(blockBtn).toBeEnabled({ timeout: 10_000 });
    await blockBtn.click();
    await expect(page.getByText('차단됨')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.msg-reply')).toHaveCount(0);
    await expect(page.getByText('답장할 수 없습니다')).toBeVisible();
  });

  test('M4 받은/보낸 탭 → 보낸 쪽지는 보낸 탭', async ({ page }) => {
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    const body = `ops7-sent-${Date.now()}`;
    await page.getByRole('button', { name: '상담/쪽지 보내기' }).click();
    await page.locator('[data-overlay="compose"] .msg-compose__textarea').fill(body);
    await page.locator('[data-action="compose-send"]').click();
    await page.waitForURL(/#\/mypage\/messages\/thread\/(\d+)/, { timeout: 30_000 });
    const m = page.url().match(/thread\/(\d+)/);
    const threadId = m ? m[1] : '';

    await page.goto(`${PROD}/#/mypage/messages/sent`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.msg-list', { timeout: 30_000 });
    const row = page.locator(`a.msg-row[href="#/mypage/messages/thread/${threadId}"]`);
    await expect(row).toContainText(body.slice(0, 40), { timeout: 15_000 });
  });

  test('P1 마이페이지 recent', async ({ page }) => {
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    const title = (await page.locator('#p24-detail-modal .p24-modal__title').innerText()).trim();
    await page.locator('[data-p24-action="close"]').click();

    await page.goto(`${PROD}/#/mypage/recent`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.mypage-entity-list', { timeout: 30_000 });
    await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 15_000 });
  });

  test('P2 마이페이지 wishlist', async ({ page }) => {
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    const title = (await page.locator('#p24-detail-modal .p24-modal__title').innerText()).trim();
    const wishBtn = page.locator('[data-p24-action="wish-toggle"]').first();
    const label = ((await wishBtn.textContent()) ?? '').trim();
    if (!label.includes('해제')) await wishBtn.click();
    await page.locator('[data-p24-action="close"]').click();

    await page.goto(`${PROD}/#/mypage/wishlist`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.mypage-panel', { timeout: 30_000 });
    await expect(page.locator('.mypage-entity-list').getByText(title, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('P3 compare 상세·찜·compare-bar', async ({ page }) => {
    await page.request.delete(`${PROD}/api/handoff/compare.php?target_type=study_room`);
    await waitHandoffOn(page);
    await openFirstStudyRoomDetail(page);
    await page.locator('[data-p24-action="compare-toggle"]').first().click();
    await expect(page.locator('#p24-detail-modal .p24-compare-aware__badge.is-on')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('[data-p24-action="close"]').click();
    await expect(page.locator('.compare-bar')).toBeVisible({ timeout: 10_000 });

    const cmp = await page.request.get(`${PROD}/api/handoff/compare.php?target_type=study_room`);
    expect(cmp.ok()).toBeTruthy();
    const cmpBody = await cmp.json();
    expect(cmpBody.count).toBeGreaterThan(0);
  });
});
