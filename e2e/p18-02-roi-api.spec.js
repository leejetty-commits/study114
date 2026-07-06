/**
 * P18-02 ROI API — 18a
 * 전제: API :8080 · tutor-owner1@dev.local · schema 027
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout, ACCOUNTS, DEV_PASSWORD } from './helpers/admin-api.js';

test.describe('P18-02 ROI API', () => {
  test('공급자 GET /api/paid/roi.php — metrics 3종', async ({ request }) => {
    await loginAs(request, 'tutor');
    const res = await request.get('/api/paid/roi.php?days=7');
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
    expect(body.tier).toMatch(/^(free|paid)$/);
    expect(body.days).toBe(7);
    expect(body.metrics).toHaveLength(3);
    const ids = body.metrics.map((m) => m.id).sort();
    expect(ids).toEqual(['compare', 'views', 'wishlist']);
    for (const m of body.metrics) {
      expect(typeof m.value).toBe('number');
      expect(m.value).toBeGreaterThanOrEqual(0);
      expect(m.label).toBeTruthy();
      expect(m.period).toBeTruthy();
    }
    await logout(request);
  });

  test('학부모·비로그인 — 403/401', async ({ request }) => {
    const anon = await request.get('/api/paid/roi.php');
    expect(anon.status()).toBe(401);

    const res = await request.post('/api/auth/login.php', {
      data: { email: 'guardian1@dev.local', password: DEV_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();

    const forbidden = await request.get('/api/paid/roi.php');
    expect(forbidden.status()).toBe(403);
    await logout(request);
  });

  test('상세 열람 후 views 집계 증가', async ({ request }) => {
    await loginAs(request, 'tutor');
    const beforeRes = await request.get('/api/paid/roi.php');
    const beforeBody = await beforeRes.json();
    const viewsBefore = beforeBody.metrics.find((m) => m.id === 'views').value;
    await logout(request);

    await request.post('/api/auth/login.php', {
      data: { email: 'guardian1@dev.local', password: DEV_PASSWORD },
    });
    const recentRes = await request.post('/api/handoff/recent.php', {
      data: {
        target_type: 'tutor',
        target_id: 1,
        title_snapshot: 'ROI E2E',
        last_action: 'view_detail',
      },
    });
    expect(recentRes.ok()).toBeTruthy();
    await logout(request);

    await loginAs(request, 'tutor');
    const afterRes = await request.get('/api/paid/roi.php');
    const afterBody = await afterRes.json();
    const viewsAfter = afterBody.metrics.find((m) => m.id === 'views').value;
    expect(viewsAfter).toBeGreaterThan(viewsBefore);
    await logout(request);
  });
});
