import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { loginAs, logout, patchExposure, ACCOUNTS } from './helpers/admin-api.js';

test.describe.configure({ mode: 'serial' });

function sql(statement) {
  const escaped = statement.replace(/"/g, '\\"');
  return execSync(
    `docker exec study114-mysql-dev mysql -uroot -pstudy114dev --default-character-set=utf8mb4 -N study114_dev -e "${escaped}"`,
    { encoding: 'utf8' },
  ).trim();
}

function noticeCount(cardType, id) {
  return Number(
    sql(
      `SELECT COUNT(*) FROM provider_system_notices WHERE notice_kind='admin_hide' AND dedupe_key LIKE 'admin_hide:${cardType}:${id}:%'`,
    ),
  );
}

test.describe('숨김 후속 + 문의 관리 20261007', () => {
  test('공부방 숨김은 상세정보2 저장과 주인 공개로 풀리지 않는다', async ({ request }) => {
    sql("UPDATE users SET email_verified_at=COALESCE(email_verified_at,NOW()) WHERE email='room-owner1@dev.local'");
    sql("UPDATE study_rooms SET profile_status='published' WHERE id=1");
    await loginAs(request, 'admin');
    const before = noticeCount('study_room', 1);
    const hidden = await patchExposure(request, { target_type: 'study_room', target_id: '1', action: 'hide' });
    expect(hidden.res.status()).toBe(200);
    expect(hidden.body.item.status).toBe('hidden');
    expect(hidden.body.log.userNotified).toBe(true);
    expect(noticeCount('study_room', 1)).toBe(before + 1);
    expect(sql("SELECT is_read FROM provider_system_notices WHERE dedupe_key LIKE 'admin_hide:study_room:1:%' ORDER BY id DESC LIMIT 1")).toBe('0');

    await loginAs(request, 'study_room');
    const saved = await request.post('/api/study-room/register.php', {
      data: {
        action: 'save',
        step: 'facility',
        study_room_id: 1,
        payload: {
          facility_note: 'e2e hide keep',
          youtube_url: '',
          facebook_url: '',
          instagram_url: '',
          facility_ids: [],
          images: [],
        },
      },
    });
    expect(saved.status()).toBe(200);
    const publish = await request.patch('/api/registrations/study-rooms.php', {
      data: { id: 1, action: 'publish' },
    });
    const publishBody = await publish.json();
    expect(publishBody.reason).toBe('not_allowed');
    const again = await request.get('/api/registrations/study-rooms.php?id=1');
    const roomBody = await again.json();
    expect(roomBody.room.profile_status).toBe('hidden');

    const afterUnhide = noticeCount('study_room', 1);
    await loginAs(request, 'admin');
    await patchExposure(request, { target_type: 'study_room', target_id: '1', action: 'publish' });
    expect(noticeCount('study_room', 1)).toBe(afterUnhide);
    const second = await patchExposure(request, { target_type: 'study_room', target_id: '1', action: 'hide' });
    expect(second.body.log.userNotified).toBe(true);
    expect(noticeCount('study_room', 1)).toBe(afterUnhide + 1);
    sql("UPDATE study_rooms SET profile_status='published' WHERE id=1");
  });

  test('과외 연락 저장에 published를 넣어도 숨김이 유지된다', async ({ request }) => {
    sql("UPDATE users SET email_verified_at=COALESCE(email_verified_at,NOW()) WHERE email='tutor-owner1@dev.local'");
    sql("UPDATE tutors SET profile_status='published' WHERE id=1");
    await loginAs(request, 'admin');
    const hidden = await patchExposure(request, { target_type: 'tutor', target_id: '1', action: 'hide' });
    expect(hidden.body.item.status).toBe('hidden');
    await loginAs(request, 'tutor');
    const saved = await request.post('/api/tutor/register.php', {
      data: {
        action: 'save',
        step: 'contact',
        tutor_id: 1,
        payload: {
          contact_time_note: 'e2e',
          profile_status: 'published',
          images: [],
        },
      },
    });
    expect(saved.status()).toBe(200);
    const again = await request.get('/api/registrations/tutors.php?id=1');
    const body = await again.json();
    expect(body.tutor.profile_status).toBe('hidden');
    await loginAs(request, 'admin');
    await patchExposure(request, { target_type: 'tutor', target_id: '1', action: 'publish' });
  });

  test('학생 숨김은 알림 0건이고 user_notified는 0이다', async ({ request }) => {
    const before = Number(sql("SELECT COUNT(*) FROM provider_system_notices WHERE notice_kind='admin_hide'"));
    await loginAs(request, 'admin');
    const hidden = await patchExposure(request, { target_type: 'student', target_id: '1', action: 'hide' });
    expect(hidden.res.status()).toBe(200);
    expect(hidden.body.log.userNotified).toBe(false);
    expect(Number(sql("SELECT COUNT(*) FROM provider_system_notices WHERE notice_kind='admin_hide'"))).toBe(before);
    await patchExposure(request, { target_type: 'student', target_id: '1', action: 'publish' });
  });

  test('로그인 문의는 계정 이메일과 회원 id로 남고 비로그인은 401이다', async ({ request }) => {
    await logout(request);
    const anon = await request.post('/api/support/tickets.php', {
      data: { email: 'other@example.com', category: 'unhide_request', body: '비로그인', role: 'guest' },
    });
    expect(anon.status()).toBe(401);

    await loginAs(request, 'study_room');
    const created = await request.post('/api/support/tickets.php', {
      data: { email: 'other@example.com', category: 'unhide_request', body: '숨김 해제 요청 e2e', role: 'guest' },
    });
    expect(created.status()).toBe(200);
    const createdBody = await created.json();
    expect(createdBody.ticket.email).toBe(ACCOUNTS.study_room);
    const userId = sql(`SELECT id FROM users WHERE email='${ACCOUNTS.study_room}'`);
    const stored = sql(
      `SELECT CONCAT(user_id, '|', email) FROM support_tickets WHERE ticket_no='${createdBody.ticket.id}'`,
    );
    expect(stored).toBe(`${userId}|${ACCOUNTS.study_room}`);

    const mine = await request.get('/api/support/tickets.php?mine=1');
    const mineBody = await mine.json();
    expect(mineBody.tickets.some((t) => t.id === createdBody.ticket.id)).toBeTruthy();
    const again = await request.get('/api/support/tickets.php?mine=1');
    const againBody = await again.json();
    expect(againBody.tickets.some((t) => t.id === createdBody.ticket.id)).toBeTruthy();
  });

  test('관리자 목록은 같은 요청을 다시 해도 total과 행이 같다', async ({ request }) => {
    await loginAs(request, 'admin');
    const first = await request.get('/api/support/tickets.php?admin=1&group=open&q=&page=1&per_page=20');
    const firstBody = await first.json();
    const second = await request.get('/api/support/tickets.php?admin=1&group=open&q=&page=1&per_page=20');
    const secondBody = await second.json();
    expect(secondBody.total).toBe(firstBody.total);
    expect(secondBody.tickets.map((t) => t.id).join(',')).toBe(firstBody.tickets.map((t) => t.id).join(','));
    expect(firstBody.per_page).toBe(20);
  });
});
