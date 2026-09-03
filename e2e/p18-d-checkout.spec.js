/**
 * P18 18d — dev mock PG checkout
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout, restoreMemoGateE2e } from './helpers/admin-api.js';

test.describe('P18 18d dev PG', () => {
  test('쪽지권 5회권 구매 → memo_tickets 증가', async ({ request }) => {
    restoreMemoGateE2e();
    await loginAs(request, 'tutor');

    const before = await request.get('/api/messages/entitlements.php');
    const beforeBody = await before.json();
    const ticketsBefore = beforeBody.memo_tickets;

    const create = await request.post('/api/paid/checkout.php', {
      data: {
        action: 'create',
        product_id: 'memo_ticket',
        variant: '5회권',
        provider_type: 'tutor',
        provider_id: 1,
      },
    });
    const createBody = await create.json();
    expect(create.ok()).toBeTruthy();
    expect(createBody.order_ref).toBeTruthy();
    expect(createBody.status).toBe('pending');
    expect(createBody.amount_won).toBe(4500);
    expect(createBody.sale_price_krw).toBe(4500);
    expect(createBody.pg_provider).toBe('dev_mock');

    const historyPending = await request.get('/api/paid/history.php');
    const historyPendingBody = await historyPending.json();
    expect(historyPending.ok()).toBeTruthy();
    const pendingRow = (historyPendingBody.orders ?? []).find(
      (row) => row.order_ref === createBody.order_ref,
    );
    expect(pendingRow, 'history에 pending 주문이 있어야 합니다').toBeTruthy();
    expect(pendingRow.amount_won).toBe(4500);
    expect(pendingRow.amount_won).not.toBe(10);
    if (pendingRow.catalog_version == null || pendingRow.catalog_version === '') {
      expect(pendingRow.catalog_version ?? null).toBeNull();
    } else {
      expect(pendingRow.catalog_version).toBe('2026-09-04.1');
    }

    const complete = await request.post('/api/paid/checkout.php', {
      data: { action: 'complete', order_ref: createBody.order_ref },
    });
    const completeBody = await complete.json();
    expect(complete.ok()).toBeTruthy();
    expect(completeBody.status).toBe('paid');
    expect(completeBody.fulfilled).toBeTruthy();
    expect(completeBody.amount_won).toBe(4500);

    const historyPaid = await request.get('/api/paid/history.php');
    const historyPaidBody = await historyPaid.json();
    const paidRow = (historyPaidBody.orders ?? []).find(
      (row) => row.order_ref === createBody.order_ref,
    );
    expect(paidRow?.status).toBe('paid');
    expect(paidRow?.amount_won).toBe(4500);

    const after = await request.get('/api/messages/entitlements.php');
    const afterBody = await after.json();
    expect(afterBody.memo_tickets).toBeGreaterThanOrEqual(ticketsBefore + 5);

    await logout(request);
  });
});
