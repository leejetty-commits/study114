/**
 * P18 18d — dev mock PG checkout
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/admin-api.js';

test.describe('P18 18d dev PG', () => {
  test('쪽지권 5회권 구매 → memo_tickets 증가', async ({ request }) => {
    await loginAs(request, 'tutor');

    const before = await request.get('/api/messages/entitlements.php');
    const beforeBody = await before.json();
    const ticketsBefore = beforeBody.memo_tickets;

    const create = await request.post('/api/paid/checkout.php', {
      data: { action: 'create', product_id: 'memo_ticket', variant: '5회권' },
    });
    const createBody = await create.json();
    expect(create.ok()).toBeTruthy();
    expect(createBody.order_ref).toBeTruthy();
    expect(createBody.status).toBe('pending');

    const complete = await request.post('/api/paid/checkout.php', {
      data: { action: 'complete', order_ref: createBody.order_ref },
    });
    const completeBody = await complete.json();
    expect(complete.ok()).toBeTruthy();
    expect(completeBody.status).toBe('paid');
    expect(completeBody.fulfilled).toBeTruthy();

    const after = await request.get('/api/messages/entitlements.php');
    const afterBody = await after.json();
    expect(afterBody.memo_tickets).toBeGreaterThanOrEqual(ticketsBefore + 5);

    await logout(request);
  });
});
