import { expect } from '@playwright/test';
import { execSync } from 'node:child_process';

export const DEV_PASSWORD = 'password';

export const ACCOUNTS = {
  tutor: 'tutor-owner1@dev.local',
  admin: 'ops@dev.local',
};

/** @param {import('@playwright/test').APIRequestContext} request */
export async function loginAs(request, role) {
  const res = await request.post('/api/auth/login.php', {
    data: { email: ACCOUNTS[role], password: DEV_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
}

/** @param {import('@playwright/test').APIRequestContext} request */
export async function logout(request) {
  await request.post('/api/auth/logout.php').catch(() => {});
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Record<string, unknown>} payload
 */
export async function patchExposure(request, payload) {
  const res = await request.patch('/api/admin/exposure.php', { data: payload });
  return { res, body: await res.json().catch(() => ({})) };
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Record<string, unknown>} payload
 */
export async function patchSubmissionQueue(request, payload) {
  const res = await request.patch('/api/admin/submission-queue.php', { data: payload });
  return { res, body: await res.json().catch(() => ({})) };
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ status?: string, targetType?: string }} [opts]
 */
export async function getExposureItems(request, opts = {}) {
  const params = new URLSearchParams();
  if (opts.targetType) params.set('target_type', opts.targetType);
  if (opts.status) params.set('status', opts.status);
  const qs = params.toString();
  const res = await request.get(`/api/admin/exposure.php${qs ? `?${qs}` : ''}`);
  const body = await res.json();
  return { res, body, items: body.items ?? [] };
}

/** @param {import('@playwright/test').APIRequestContext} request */
export async function getSubmissionQueue(request, status = 'submitted') {
  const res = await request.get(`/api/admin/submission-queue.php?status=${status}`);
  const body = await res.json();
  return { res, body, queue: body.queue ?? [] };
}

/**
 * @param {object} log
 * @param {{ action: string, target: string, userNotified: boolean, detailMemo?: string, operator?: string }} expected
 */
export function expectLog(log, expected) {
  expect(log, 'log 객체가 응답에 포함되어야 합니다').toBeTruthy();
  expect(log.action).toBe(expected.action);
  expect(log.target).toBe(expected.target);
  expect(log.operator).toBe(expected.operator ?? ACCOUNTS.admin);
  expect(log.userNotified).toBe(expected.userNotified);
  if (expected.detailMemo !== undefined) {
    expect(log.detailMemo).toBe(expected.detailMemo);
  }
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} title
 */
export async function createSubmissionPost(request, title) {
  await loginAs(request, 'tutor');
  const res = await request.post('/api/board/posts.php', {
    data: {
      board_key: 'submission',
      author_role: 'tutor',
      status: 'submitted',
      title,
      description: 'E2E boundary test',
      category_id: 'education',
      file_label: 'e2e-proof.pdf',
      memo: '',
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok && body.post?.id).toBeTruthy();
  return /** @type {string} */ (body.post.id);
}

/** 시드 복원용 — 테스트 후 공개 상태로 되돌림 */
export async function restoreExposureDefaults(request) {
  await loginAs(request, 'admin');
  await patchExposure(request, {
    target_type: 'study_room',
    target_id: '3',
    action: 'publish',
  });
  await patchExposure(request, {
    target_type: 'study_room',
    target_id: '3',
    action: 'inquiry_status',
    inquiry_status: 'waiting_only',
  });
  await patchExposure(request, { target_type: 'tutor', target_id: '1', action: 'publish' });
  await patchExposure(request, { target_type: 'submission', target_id: 'sub-seed-1', action: 'publish' });
}

const DEV_MYSQL =
  'docker exec study114-mysql-dev mysql -uroot -pstudy114dev --default-character-set=utf8mb4 study114_dev -e';

/** @param {string} sql */
export function devSql(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  execSync(`${DEV_MYSQL} "${escaped}"`, { stdio: 'pipe' });
}

/** P18b E2E — 이메일 인증 · 학생2 선제 쪽지 스레드 초기화 */
export function prepColdMemoE2e() {
  devSql(
    "UPDATE users SET email_verified_at=COALESCE(email_verified_at,NOW()) WHERE email='tutor-owner1@dev.local'",
  );
  devSql(
    "DELETE FROM message_threads WHERE context_kind='student' AND context_id=2 AND participant_low_user_id=4",
  );
}

/** P16-04 E2E — tutor-owner1 쪽지권 0회 (bypass 없음) */
export function prepMemoGateZeroE2e() {
  devSql(
    "UPDATE provider_entitlements SET cold_memo_allowed=0, memo_credits=0 WHERE user_id=4",
  );
  devSql(
    "UPDATE provider_ticket_packs SET remaining=0 WHERE user_id=4 AND ticket_type='memo'",
  );
}

/** P16-04 E2E — tutor-owner1 쪽지권 시드 복원 */
export function restoreMemoGateE2e() {
  devSql(
    "UPDATE provider_ticket_packs SET remaining=5 WHERE user_id=4 AND ticket_type='memo' AND source='manual'",
  );
  devSql(
    "INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source) SELECT 4, 'memo', 5, 5, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'manual' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM provider_ticket_packs WHERE user_id=4 AND ticket_type='memo' AND source='manual')",
  );
}

/** P18e — reminder 테이블 (032) idempotent */
export function ensureReminderSchemaE2e() {
  devSql(
    'CREATE TABLE IF NOT EXISTS provider_system_notices (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, notice_kind VARCHAR(64) NOT NULL, dedupe_key VARCHAR(191) NOT NULL, title VARCHAR(200) NOT NULL, body TEXT NOT NULL, action_href VARCHAR(500) NULL, is_read TINYINT(1) NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uk_provider_notice_dedupe (dedupe_key), KEY idx_provider_notice_user (user_id, is_read, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  );
  devSql(
    'CREATE TABLE IF NOT EXISTS provider_reminder_dispatches (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, channel ENUM(\'email\',\'sms\',\'onsite\') NOT NULL, reminder_kind VARCHAR(64) NOT NULL, dedupe_key VARCHAR(191) NOT NULL, sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uk_provider_dispatch_dedupe (dedupe_key), KEY idx_provider_dispatch_user (user_id, sent_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  );
}

/** P18c E2E — student 1 열람 잠금 초기화 */
export function prepRequestViewE2e() {
  devSql(
    "DELETE FROM provider_request_unlocks WHERE provider_user_id=4 AND student_id=1",
  );
}
