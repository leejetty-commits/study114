/**
 * [3단계] 회원가입 → 기본등록 저장 E2E
 * 전제: API :8080 (Docker) · auth-ui :5173 (UI 테스트)
 */
import { test, expect } from '@playwright/test';
import { signupAndBasicRegister, buildSignupPayload, DEV_PASSWORD } from './helpers/signup-flow.js';

const AUTH_BASE = process.env.STUDY114_AUTH_UI_URL || 'http://127.0.0.1:5173';

const ROLE_HOME = {
  student: '/parent',
  study_room: '/study-room',
  tutor: '/tutor',
};

test.describe('[3단계] signup → basic-register API', () => {
  for (const role of ['student', 'study_room', 'tutor']) {
    test(`${role} — signup + basic-register + 세션`, async ({ request }) => {
      await request.post('/api/auth/logout.php').catch(() => {});

      const { signupBody, basicBody, meBody } = await signupAndBasicRegister(request, role);

      expect(signupBody.user_id).toBeGreaterThan(0);
      expect(basicBody.kind).toBe(role === 'student' ? 'student' : role);
      expect(basicBody.id).toBeGreaterThan(0);
      expect(meBody.authenticated).toBe(true);
      expect(meBody.email).toBe(signupBody.email);
    });
  }
});

test.describe('[3단계] auth-ui 화면 플로우 (student)', () => {
  test('약관 → 역할 → 가입폼 → 기본등록 → 완료', async ({ page }) => {
    const email = `ui_${Date.now()}@test.local`;

    await page.goto(`${AUTH_BASE}/#/signup/terms`);
    await page.waitForSelector('[data-form="terms"]', { timeout: 30_000 });

    for (const id of ['service', 'privacy', 'location']) {
      await page.locator(`input[name="${id}"]`).check();
    }
    await page.locator('[data-submit-terms]').click();
    await page.waitForURL(/#\/signup\/role/, { timeout: 10_000 });

    await page.locator('[data-role="student"]').click();
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await page.waitForSelector('#signup-email', { timeout: 15_000 });

    await page.locator('#signup-email').fill(email);
    await page.locator('#signup-password').fill(DEV_PASSWORD);
    await page.locator('#signup-password-confirm').fill(DEV_PASSWORD);
    await page.locator('#signup-name').fill('UI테스트학부모');
    await page.locator('input[name="gender"][value="male"]').check();
    await page.locator('#signup-phone').fill('01077776666');
    await page.locator('#signup-address').fill('서울특별시 강남구 대치동 1');
    await page.locator('[data-form="signup"] button[type="submit"]').click();

    await page.waitForURL(/#\/signup\/basic/, { timeout: 15_000 });
    await page.waitForSelector('[data-form="basic-student"]', { timeout: 10_000 });

    await page.locator('[data-form="basic-student"] button[type="submit"]').click();
    await page.waitForURL(/#\/signup\/complete/, { timeout: 15_000 });

    await expect(page.getByText('가입 · 기본등록 완료')).toBeVisible();
    await expect(page.locator('.success-info dd').filter({ hasText: email })).toBeVisible();
    await expect(page.locator('.success-info dd').filter({ hasText: /student #\d+/ })).toBeVisible();
  });

  test('완료 화면 → 메인 홈 분기 (student → parent)', async ({ page, context }) => {
    const email = `home_${Date.now()}@test.local`;

    await page.goto(`${AUTH_BASE}/#/signup/terms`);
    await page.waitForSelector('[data-form="terms"]', { timeout: 30_000 });
    for (const id of ['service', 'privacy', 'location']) {
      await page.locator(`input[name="${id}"]`).check();
    }
    await page.locator('[data-submit-terms]').click();
    await page.locator('[data-role="student"]').click();
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await page.waitForSelector('#signup-email', { timeout: 15_000 });

    await page.locator('#signup-email').fill(email);
    await page.locator('#signup-password').fill(DEV_PASSWORD);
    await page.locator('#signup-password-confirm').fill(DEV_PASSWORD);
    await page.locator('#signup-name').fill('홈분기테스트');
    await page.locator('input[name="gender"][value="female"]').check();
    await page.locator('#signup-phone').fill('01055554444');
    await page.locator('#signup-address').fill('서울시 강남구');
    await page.locator('[data-form="signup"] button[type="submit"]').click();
    await page.waitForURL(/#\/signup\/basic/);
    await page.locator('[data-form="basic-student"] button[type="submit"]').click();
    await page.waitForURL(/#\/signup\/complete/);

    const [homePage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('[data-action="go-home"]').click(),
    ]);
    await homePage.waitForLoadState('domcontentloaded');
    await homePage.waitForTimeout(500);
    const hash = await homePage.evaluate(() => window.location.hash);
    expect(hash).toBe(`#${ROLE_HOME.student}`);
  });
});
