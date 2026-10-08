/**
 * 운영 투입 전 스모크 — A28-07 노출 보정 · A28-06 경계
 * 전제: 로컬 Docker(study114_dev) 전용 — home-ui :5174 · API :8080 · 시드 운영자 계정
 * (`helpers/local-seed-accounts.js`, 026/036 시드 · 운영 DB 에는 없음). 운영 사이트 대상으로 돌리지 않는다.
 */
import { test, expect } from '@playwright/test';
import {
  loginAs,
  patchExposure,
  getExposureItems,
  createSubmissionPost,
  ACCOUNTS,
  DEV_PASSWORD,
} from './helpers/admin-api.js';

const SUBMITTED_422_SNIPPET = 'A28-06';

test.describe('A28-07 운영 스모크', () => {
  test('admin 로그인 · exposure 목록', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await getExposureItems(request, { targetType: 'submission', status: 'submitted' });
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
  });

  test('#/admin/exposure — 탭 3개 · 제출 드롭다운 없음', async ({ page }) => {
    await page.request.post('/api/auth/login.php', {
      data: { email: ACCOUNTS.admin, password: DEV_PASSWORD },
    });
    await page.goto('/');
    await page.waitForSelector('#app .preview-toolbar', { timeout: 30_000 });
    await page.evaluate(() => {
      window.location.hash = '#/admin/exposure';
    });
    await page.waitForSelector('[data-a28-exp-tab="study_room"]', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /홈·찾기 노출/ })).toBeVisible();
    await expect(page.locator('[data-a28-exp-tab="tutor"]')).toBeVisible();
    await expect(page.locator('[data-a28-exp-tab="student"]')).toBeVisible();
    await expect(page.locator('select[name="target_type"]')).toHaveCount(0);
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
      data: { email: ACCOUNTS.admin, password: DEV_PASSWORD },
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
