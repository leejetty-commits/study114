/**
 * 운영 투입 전 스모크 — A28-07 노출 보정 · A28-06 경계
 * 전제: home-ui :5174 · API :8080 · ops@dev.local / password
 */
import { test, expect } from '@playwright/test';
import {
  loginAs,
  patchExposure,
  getExposureItems,
  createSubmissionPost,
  ACCOUNTS,
} from './helpers/admin-api.js';

const SUBMITTED_422_SNIPPET = 'A28-06';

test.describe('A28-07 운영 스모크', () => {
  test('admin 로그인 · exposure 목록', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await getExposureItems(request, { targetType: 'submission', status: 'submitted' });
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
  });

  test('#/admin/exposure — submitted 제출 row publish 미노출 · A28-06 안내', async ({ page }) => {
    await page.request.post('/api/auth/login.php', {
      data: { email: ACCOUNTS.admin, password: 'password' },
    });
    await page.goto('/');
    await page.waitForSelector('#app .preview-toolbar', { timeout: 30_000 });
    await page.evaluate(() => {
      window.location.hash = '#/admin/exposure';
    });
    await page.waitForSelector('[data-a28-exp-filter]', { timeout: 15_000 });

    const filterForm = page.locator('[data-a28-exp-filter]');
    await filterForm.locator('select[name="target_type"]').selectOption('submission');
    await filterForm.locator('select[name="status"]').selectOption('submitted');
    await filterForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    const submittedRow = page.locator('tr[data-a28-exp-row="submission:sub-seed-2"]');
    const hasSeed = (await submittedRow.count()) > 0;
    if (hasSeed) {
      await expect(submittedRow.locator('[data-a28-exp-action="publish"]')).toHaveCount(0);
      await expect(submittedRow.getByRole('link', { name: '→ A28-06 노출 반영' })).toBeVisible();
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'sub-seed-2가 submitted가 아님 — API 경계 테스트로 대체',
      });
    }
  });

  test('submitted 제출 A28-07 publish → 422 메시지', async ({ request }) => {
    const postKey = await createSubmissionPost(request, `Smoke 422 ${Date.now()}`);
    await loginAs(request, 'admin');

    const { res, body } = await patchExposure(request, {
      target_type: 'submission',
      target_id: postKey,
      action: 'publish',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
    expect(body.message).toContain(SUBMITTED_422_SNIPPET);
    expect(body.message).toMatch(/제출됨|submitted/i);
  });

  test('#/admin/logs — 핵심 action_kind 라벨 구분', async ({ page, request }) => {
    await loginAs(request, 'admin');
    await page.request.post('/api/auth/login.php', {
      data: { email: ACCOUNTS.admin, password: 'password' },
    });
    await page.goto('/');
    await page.waitForSelector('#app .preview-toolbar', { timeout: 30_000 });
    await page.evaluate(() => {
      window.location.hash = '#/admin/logs';
    });
    await page.waitForSelector('.sup-admin-table', { timeout: 15_000 });

    const hint = page.getByText('조치 구분:');
    await expect(hint).toBeVisible();

    for (const label of ['프로필 숨김', '노출 보정', '제출 노출 반영', '제출 숨김']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });
});
