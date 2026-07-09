/**
 * [2단계] 인증(Auth) API 점검 — 로컬 API :8080
 */
import { test, expect } from '@playwright/test';

const DEV_EMAIL = 'guardian1@dev.local';
const DEV_PASSWORD = 'password';

test.describe('[2단계] Auth API (로컬)', () => {
  test('me.php — 비로그인', async ({ request }) => {
    await request.post('/api/auth/logout.php').catch(() => {});
    const res = await request.get('/api/auth/me.php');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.authenticated).toBe(false);
  });

  test('login.php — dev 학부모', async ({ request }) => {
    const res = await request.post('/api/auth/login.php', {
      data: { email: DEV_EMAIL, password: DEV_PASSWORD },
    });
    const body = await res.json();
    if (!res.ok() || !body.ok) {
      test.info().annotations.push({
        type: 'blocker',
        description: `로컬 login 실패: ${body.message || res.status()} — DB 연결·시드 확인 필요`,
      });
    }
    expect(res.ok()).toBeTruthy();
    expect(body.ok).toBeTruthy();
    expect(body.role_type).toBe('guardian_student');
  });

  test('세션 유지 — login 후 me.php', async ({ request }) => {
    await request.post('/api/auth/login.php', {
      data: { email: DEV_EMAIL, password: DEV_PASSWORD },
    });
    const res = await request.get('/api/auth/me.php');
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.email).toBe(DEV_EMAIL);
  });

  test('logout.php', async ({ request }) => {
    await request.post('/api/auth/login.php', {
      data: { email: DEV_EMAIL, password: DEV_PASSWORD },
    });
    const res = await request.post('/api/auth/logout.php');
    const body = await res.json();
    expect(body.ok).toBeTruthy();
    const me = await request.get('/api/auth/me.php');
    const meBody = await me.json();
    expect(meBody.authenticated).toBe(false);
  });

  test('oauth/start.php — 미설정 시 에러 리다이렉트', async ({ request }) => {
    const res = await request.get('/api/auth/oauth/start.php?provider=naver', {
      maxRedirects: 0,
    });
    expect([302, 303]).toContain(res.status());
    const location = res.headers()['location'] || '';
    expect(location).toMatch(/oauth_error|login/);
  });
});
