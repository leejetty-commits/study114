/**
 * [5단계] 쪽지 플로우 e2e 헬퍼
 */
import { expect } from '@playwright/test';

const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';

export async function devLoginParent(page) {
  await page.goto(`${HOME}/#/guest`);
  await page.getByRole('button', { name: 'Dev·학부모' }).click();
  await page.waitForURL(/#\/parent/, { timeout: 15_000 });
}

export async function devLoginTutor(page) {
  await page.goto(`${HOME}/#/guest`);
  await page.getByRole('button', { name: 'Dev·과외' }).click();
  await page.waitForURL(/#\/tutor/, { timeout: 15_000 });
}

export async function openFirstStudyRoomDetail(page) {
  const card = page.locator('[data-provider-kind="study_room"][data-provider-id]').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 10_000 });
}

export async function openComposeFromStudyRoomDetail(page) {
  await openFirstStudyRoomDetail(page);
  await page.getByRole('button', { name: '상담/쪽지 보내기' }).click();
  await expect(page.locator('[data-overlay="compose"]')).toBeVisible({ timeout: 10_000 });
}

export async function sendCompose(page, body) {
  page.once('dialog', (dialog) => dialog.accept().catch(() => {}));
  const overlay = page.locator('[data-overlay="compose"]');
  await overlay.locator('.msg-compose__textarea').fill(body);
  const sendBtn = overlay.locator('[data-action="compose-send"]');
  await expect(sendBtn).toBeEnabled();
  await sendBtn.click();
  await page.waitForURL(/#\/mypage\/messages\/thread\/\d+/, { timeout: 30_000 });
  await waitForThreadBody(page, body);
}

export async function waitForThreadBody(page, bodyText) {
  await expect(page.locator('.msg-bubble--me').filter({ hasText: bodyText })).toBeVisible({
    timeout: 30_000,
  });
}

export function threadIdFromUrl(url) {
  const m = url.match(/#\/mypage\/messages\/thread\/(\d+)/);
  return m ? Number(m[1]) : null;
}

export async function parentComposeStudyRoomMessage(page, body) {
  await page.waitForSelector('[data-provider-kind="study_room"]', { timeout: 30_000 });
  await expect(page.getByText('쪽지 ON')).toBeVisible({ timeout: 15_000 });
  await openComposeFromStudyRoomDetail(page);
  await sendCompose(page, body);
  return threadIdFromUrl(page.url());
}
