/**
 * P18-02 18b — 횟수권 · status API · P16-04 게이트
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout, prepColdMemoE2e, prepMemoGateZeroE2e, restoreMemoGateE2e } from './helpers/admin-api.js';

test.describe('P18-02 18b 횟수권', () => {
  test('GET /api/paid/status.php — exposure · tickets · 통합 모델', async ({ request }) => {
    await loginAs(request, 'tutor');
    const res = await request.get('/api/paid/status.php');
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
    expect(body.cold_memo).toBeTruthy();
    expect(body.request_view).toBeTruthy();
    expect(body.exposure).toBeTruthy();
    expect(body.tickets?.memo).toBeTruthy();
    expect(body.tickets.memo.remaining).toBe(body.cold_memo.remaining);
    expect(typeof body.tickets.memo.remaining).toBe('number');
    await logout(request);
  });

  test('entitlements — 통합 cold_memo · request_view', async ({ request }) => {
    await loginAs(request, 'tutor');
    const res = await request.get('/api/messages/entitlements.php');
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
    expect(body.cold_memo).toBeTruthy();
    expect(body.request_view).toBeTruthy();
    expect(body.memo_tickets).toBe(body.cold_memo.remaining);
    expect(body.request_view_tickets).toBe(body.request_view.remaining);
    expect(body.memo_tickets).toBeGreaterThan(0);
    expect(body.can_cold_memo).toBe(body.cold_memo.can_send);
    expect(body.memo_nearest_expiry).toBeTruthy();
    await logout(request);
  });

  test('선제 쪽지 후 memo_tickets 감소', async ({ request }) => {
    prepColdMemoE2e();
    await loginAs(request, 'tutor');
    const before = await request.get('/api/messages/entitlements.php');
    const beforeBody = await before.json();
    const ticketsBefore = beforeBody.memo_tickets;
    expect(ticketsBefore).toBeGreaterThan(0);

    const compose = await request.post('/api/messages/threads.php', {
      data: {
        context_kind: 'student',
        context_id: 2,
        context_label: 'E2E 학생2',
        peer_display_name: 'E2E 학생2',
        scope_badge: '구조화 항목만',
        scope_hint: '테스트',
        body: '안녕하세요, E2E 쪽지권 차감 테스트입니다.',
      },
    });
    expect(compose.ok()).toBeTruthy();
    const composeBody = await compose.json();
    expect(composeBody.ok).toBeTruthy();

    const after = await request.get('/api/messages/entitlements.php');
    const afterBody = await after.json();
    expect(afterBody.memo_tickets).toBeLessThan(ticketsBefore);
    await logout(request);
  });

  test('쪽지권 0회 — 선제 쪽지 paid_gate', async ({ request }) => {
    prepColdMemoE2e();
    prepMemoGateZeroE2e();
    try {
      await loginAs(request, 'tutor');
      const ent = await request.get('/api/messages/entitlements.php');
      const entBody = await ent.json();
      expect(entBody.memo_tickets).toBe(0);
      expect(entBody.can_cold_memo).toBeFalsy();

      const compose = await request.post('/api/messages/threads.php', {
        data: {
          context_kind: 'student',
          context_id: 2,
          context_label: 'E2E 학생2',
          peer_display_name: 'E2E 학생2',
          scope_badge: '구조화 항목만',
          scope_hint: '테스트',
          body: '쪽지권 0회 게이트 테스트',
        },
      });
      expect(compose.status()).toBe(403);
      const composeBody = await compose.json();
      expect(composeBody.error).toBe('paid_gate');
      await logout(request);
    } finally {
      restoreMemoGateE2e();
    }
  });
});
