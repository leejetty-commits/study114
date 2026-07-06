/**
 * P18 18c — 요청문 열람권
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout, prepRequestViewE2e } from './helpers/admin-api.js';

test.describe('P18 18c 요청문 열람권', () => {
  test('GET request-access — 잔여 · 목록 · 통합 request_view', async ({ request }) => {
    await loginAs(request, 'tutor');
    const res = await request.get('/api/paid/request-access.php');
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
    expect(body.request_view).toBeTruthy();
    expect(body.request_view_tickets).toBeGreaterThan(0);
    expect(body.request_view.remaining).toBe(body.request_view_tickets);
    expect(Array.isArray(body.unlocked_student_ids)).toBeTruthy();
    expect(body.request_view.unlocked_student_ids).toEqual(body.unlocked_student_ids);
    await logout(request);
  });

  test('POST unlock — student 1 paid_only · 재열람 무차감', async ({ request }) => {
    prepRequestViewE2e();
    await loginAs(request, 'tutor');

    const before = await request.get('/api/paid/request-access.php?student_id=1');
    const beforeBody = await before.json();
    expect(beforeBody.unlocked).toBeFalsy();
    expect(beforeBody.can_unlock).toBeTruthy();

    const unlock = await request.post('/api/paid/request-access.php', {
      data: { student_id: 1 },
    });
    const unlockBody = await unlock.json();
    expect(unlock.ok()).toBeTruthy();
    expect(unlockBody.consumed).toBeTruthy();
    expect(unlockBody.request_view_tickets).toBeLessThan(beforeBody.request_view_tickets);

    const again = await request.post('/api/paid/request-access.php', {
      data: { student_id: 1 },
    });
    const againBody = await again.json();
    expect(againBody.consumed).toBeFalsy();
    expect(againBody.unlocked).toBeTruthy();
    expect(againBody.request_view_tickets).toBe(unlockBody.request_view_tickets);

    await logout(request);
  });
});
