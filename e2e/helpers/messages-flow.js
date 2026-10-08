/**
 * [5단계] 쪽지 플로우 e2e 헬퍼
 */
import { expect } from '@playwright/test';

const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';

/** 로컬 Docker 시드 계정 (sql/schema/012_search_dev_seed.sql) */
async function apiLoginAndOpen(page, email, hashPath) {
  const res = await page.request.post(`${HOME}/api/auth/login.php`, {
    data: { email, password: 'password' },
  });
  expect(res.ok()).toBeTruthy();
  await page.goto(`${HOME}/#${hashPath}`);
  await page.waitForURL(new RegExp(`#${hashPath}`), { timeout: 15_000 });
}

export async function devLoginParent(page) {
  await apiLoginAndOpen(page, 'guardian1@dev.local', '/parent');
}

export async function devLoginTutor(page) {
  await apiLoginAndOpen(page, 'tutor-owner1@dev.local', '/tutor');
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
