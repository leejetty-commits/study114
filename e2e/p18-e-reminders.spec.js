/**
 * P18e 18d — 만료·소진 알림
 */
import { test, expect } from '@playwright/test';
import {
  loginAs,
  logout,
  prepColdMemoE2e,
  devSql,
  ensureReminderSchemaE2e,
} from './helpers/admin-api.js';

const CRON_KEY = 'dev-cron-key';

function prepPositionExpiry7d() {
  devSql(
    "UPDATE provider_position_subscriptions SET ends_at=CONCAT(DATE_ADD(CURDATE(), INTERVAL 7 DAY), ' 23:59:59') WHERE user_id=4",
  );
}

test.describe('P18e 만료·소진 알림', () => {
  test('cron — 기간형 D-7 온사이트 안내 생성', async ({ request }) => {
    ensureReminderSchemaE2e();
    prepPositionExpiry7d();
    devSql(
      "DELETE FROM provider_reminder_dispatches WHERE user_id=4 AND reminder_kind LIKE 'position_expiry%'",
    );
    devSql(
      "DELETE FROM provider_system_notices WHERE user_id=4 AND notice_kind LIKE 'position_expiry%'",
    );

    const cron = await request.post(`/api/cron/paid-reminders.php?key=${CRON_KEY}`);
    const cronBody = await cron.json();
    expect(cron.ok()).toBeTruthy();
    expect(cronBody.ok).toBeTruthy();
    expect(cronBody.processed).toBeGreaterThan(0);

    await loginAs(request, 'tutor');
    const notices = await request.get('/api/paid/notices.php');
    const noticesBody = await notices.json();
    expect(notices.ok()).toBeTruthy();
    expect(noticesBody.notices?.length).toBeGreaterThan(0);
    expect(noticesBody.notices[0].title).toContain('7일');
    await logout(request);
  });

  test('차감 이벤트 — 쪽지권 1회 남음 안내', async ({ request }) => {
    ensureReminderSchemaE2e();
    prepColdMemoE2e();
    devSql(
      "UPDATE provider_ticket_packs SET remaining=2 WHERE user_id=4 AND ticket_type='memo' AND source='manual'",
    );
    devSql(
      "DELETE FROM provider_reminder_dispatches WHERE user_id=4 AND reminder_kind='memo_remaining_1'",
    );
    devSql(
      "DELETE FROM provider_system_notices WHERE user_id=4 AND notice_kind='memo_remaining_1'",
    );

    await loginAs(request, 'tutor');
    const compose = await request.post('/api/messages/threads.php', {
      data: {
        context_kind: 'student',
        context_id: 2,
        context_label: 'E2E 학생2',
        peer_display_name: 'E2E 학생2',
        scope_badge: '구조화 항목만',
        scope_hint: '테스트',
        body: '알림 1회 남음 테스트',
      },
    });
    expect(compose.ok()).toBeTruthy();

    const notices = await request.get('/api/paid/notices.php');
    const noticesBody = await notices.json();
    const kinds = (noticesBody.notices ?? []).map((n) => n.notice_kind);
    expect(kinds).toContain('memo_remaining_1');
    await logout(request);
  });
});
