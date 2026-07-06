import { test, expect } from '@playwright/test';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEV_PASSWORD = 'password';
const ACCOUNTS = {
  tutor: 'tutor-owner1@dev.local',
  admin: 'ops@dev.local',
};

/** @param {import('@playwright/test').Page} page @param {'tutor'|'admin'} role */
async function apiDevLogin(page, role) {
  const res = await page.request.post('/api/auth/login.php', {
    data: { email: ACCOUNTS[role], password: DEV_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
}

/** @param {import('@playwright/test').Page} page @param {'tutor'|'admin'} role */
async function ensureDevLogin(page, role) {
  await apiDevLogin(page, role);
  await page.goto('/');
  await page.waitForSelector('#app .preview-toolbar', { timeout: 30_000 });
  const me = await page.request.get('/api/auth/me.php');
  const data = await me.json();
  expect(data.ok && data.authenticated).toBeTruthy();
  expect(data.email).toBe(ACCOUNTS[role]);
  expect(data.role_type).toBe(role === 'admin' ? 'admin' : 'tutor');
}

/** @param {import('@playwright/test').Page} page @param {string} hashPath */
async function gotoHash(page, hashPath) {
  await page.goto('/');
  await page.waitForSelector('#app .preview-toolbar', { timeout: 30_000 });
  await page.evaluate((path) => {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  }, hashPath);
  await page.waitForTimeout(400);
}

const TUTOR_TITLE = `E2E 첨부 ${Date.now()}`;

test.describe('submission 첨부 → 운영 큐 → 열람 → 노출 반영', () => {
  test('제출자 업로드부터 운영자 조치까지', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    const pdfPath = join(tmpdir(), `study114-e2e-${Date.now()}.pdf`);
    writeFileSync(pdfPath, '%PDF-1.4 study114 e2e\n');

    try {
      await gotoHash(page, '/guest');
      await ensureDevLogin(page, 'tutor');
      await gotoHash(page, '/mypage/submission-board/new');

      await page.locator('input[name="title"]').fill(TUTOR_TITLE);
      await page.locator('textarea[name="description"]').fill('Playwright E2E 첨부 흐름');
      await page.locator('input[type="file"]').setInputFiles(pdfPath);
      await page.locator('[data-sub-action="submit"]').click();

      await expect(page.locator(`text=${TUTOR_TITLE}`)).toBeVisible({ timeout: 30_000 });

      await ensureDevLogin(page, 'admin');
      await gotoHash(page, '/admin/submission-docs');

      await expect(page.getByText(TUTOR_TITLE)).toBeVisible({ timeout: 30_000 });

      const row = page.locator('tr', { hasText: TUTOR_TITLE });
      const viewBtn = row.locator('[data-a28-sub-view]');
      await expect(viewBtn).toBeVisible();
      const postKey = await viewBtn.getAttribute('data-a28-sub-view');
      expect(postKey).toBeTruthy();

      const tokenRes = await page.request.post('/api/board/attachments/token.php', {
        data: { post_key: postKey, audience: 'admin' },
      });
      expect(tokenRes.ok()).toBeTruthy();
      const tokenBody = await tokenRes.json();
      expect(tokenBody.ok && tokenBody.token).toBeTruthy();

      const downloadRes = await page.request.get(
        `/api/board/attachments/download.php?token=${encodeURIComponent(tokenBody.token)}`,
      );
      expect(downloadRes.ok()).toBeTruthy();

      page.once('popup', (popup) => popup.close().catch(() => {}));
      await viewBtn.click();

      await row.getByRole('button', { name: '노출 반영' }).click();

      await expect(page.locator(`tr:has-text("${TUTOR_TITLE}")`)).toHaveCount(0, { timeout: 30_000 });

      await gotoHash(page, '/admin/logs');
      await expect(page.getByText('제출자료 노출 반영').first()).toBeVisible();
      await expect(page.getByText('ops@dev.local').first()).toBeVisible();
    } finally {
      try {
        unlinkSync(pdfPath);
      } catch {
        /* ignore */
      }
    }
  });
});

test.describe('관리자 접근 제한', () => {
  test('비로그인 시 submission-docs 차단', async ({ page }) => {
    await page.request.post('/api/auth/logout.php').catch(() => {});
    await gotoHash(page, '/admin/submission-docs');
    await expect(page.getByText('운영자 전용')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dev·운영 로그인' })).toBeVisible();
  });

  test('과외 계정은 admin API 403', async ({ page }) => {
    await apiDevLogin(page, 'tutor');
    const res = await page.request.get('/api/admin/submission-queue.php?status=submitted');
    expect(res.status()).toBe(403);
  });
});
