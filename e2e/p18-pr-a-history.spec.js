/**
 * PR-A — history는 schema 061 유무와 관계없이 amount_won을 반환한다.
 * catalog_version은 컬럼이 없으면 null, 있으면 스냅샷 문자열.
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/admin-api.js';

test.describe('PR-A history catalog snapshot', () => {
  test('GET /api/paid/history.php — 주문 금액·상태 계약', async ({ request }) => {
    await loginAs(request, 'tutor');

    const create = await request.post('/api/paid/checkout.php', {
      data: { action: 'create', product_id: 'memo_ticket', variant: '10회권', amount_won: 10 },
    });
    const created = await create.json();
    expect(create.ok()).toBeTruthy();
    expect(created.amount_won).toBe(8000);

    const history = await request.get('/api/paid/history.php');
    const body = await history.json();
    expect(history.ok()).toBeTruthy();
    expect(Array.isArray(body.orders)).toBeTruthy();

    const row = body.orders.find((item) => item.order_ref === created.order_ref);
    expect(row).toBeTruthy();
    expect(row.amount_won).toBe(8000);
    expect(row.product_id).toBe('memo_ticket');
    expect(row.variant_label).toBe('10회권');
    expect(row.status).toBe('pending');
    expect(row).toHaveProperty('catalog_version');
    if (row.catalog_version) {
      expect(row.catalog_version).toBe('2026-09-04.1');
      expect(row.list_price_won).toBe(10000);
      expect(row.discount_won).toBe(2000);
    } else {
      expect(row.catalog_version).toBeNull();
    }

    await logout(request);
  });
});
