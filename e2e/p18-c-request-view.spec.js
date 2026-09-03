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

  test('POST unlock — 열람권 폐지 후 차감 없이 허용', async ({ request }) => {
    // 구정책(p18-c 원문): paid_only 학생 1회 차감 · 재열람 무차감.
    // 최신 정책: 요청문 열람권 SKU는 카탈로그에서 제거(removed_skus).
    // ProviderTicketService::unlockPaidRequest 는 "폐지 — 차감 없이 항상 열람 허용".
    prepRequestViewE2e();
    await loginAs(request, 'tutor');

    const before = await request.get('/api/paid/request-access.php?student_id=1');
    const beforeBody = await before.json();
    expect(before.ok()).toBeTruthy();
    expect(beforeBody.unlocked).toBeTruthy();
    expect(beforeBody.can_unlock).toBeFalsy();
    const ticketsBefore = beforeBody.request_view_tickets;

    const unlock = await request.post('/api/paid/request-access.php', {
      data: { student_id: 1 },
    });
    const unlockBody = await unlock.json();
    expect(unlock.ok()).toBeTruthy();
    expect(unlockBody.unlocked).toBeTruthy();
    expect(unlockBody.consumed).toBeFalsy();
    expect(unlockBody.request_view_tickets).toBe(ticketsBefore);

    await logout(request);
  });
});
