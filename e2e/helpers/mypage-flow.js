/**
 * [6단계] 마이페이지 플로우 e2e 헬퍼
 */
import { expect } from '@playwright/test';

const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';

export { HOME };

export async function devLoginParent(page) {
  const res = await page.request.post('/api/auth/login.php', {
    data: { email: 'guardian1@dev.local', password: 'password' },
  });
  expect(res.ok()).toBeTruthy();
}

export async function clearCompareHandoff(page) {
  await page.request.delete('/api/handoff/compare.php?target_type=study_room');
  await page.request.delete('/api/handoff/compare.php?target_type=tutor');
}

export async function openFirstStudyRoomDetail(page) {
  const card = page.locator('[data-provider-kind="study_room"][data-provider-id]').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 10_000 });
}

export async function getDetailTitle(page) {
  return page.locator('#p24-detail-modal .p24-modal__title').innerText();
}

/** 상세 모달에서 찜 상태가 켜져 있도록 토글 */
export async function ensureWishlisted(page) {
  const wishBtn = page.locator('#p24-detail-modal [data-p24-action="wish-toggle"]').first();
  const text = ((await wishBtn.textContent()) ?? '').trim();
  if (!text.includes('해제')) {
    await wishBtn.click();
    await expect(wishBtn).toContainText('찜 해제', { timeout: 10_000 });
  }
}

export async function closeDetailModal(page) {
  await page.locator('[data-p24-action="close"]').click();
  await expect(page.locator('#p24-detail-modal')).toHaveCount(0, { timeout: 10_000 });
}
