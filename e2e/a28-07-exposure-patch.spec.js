import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import {
  loginAs,
  logout,
  patchExposure,
  patchSubmissionQueue,
  getExposureItems,
  getSubmissionQueue,
  expectLog,
  createSubmissionPost,
  restoreExposureDefaults,
  ACCOUNTS,
} from './helpers/admin-api.js';

function sqlValue(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  return execSync(
    `docker exec study114-mysql-dev mysql -uroot -pstudy114dev --default-character-set=utf8mb4 -N study114_dev -e "${escaped}"`,
    { encoding: 'utf8' },
  ).trim();
}

function hideNoticeCount(cardType, id) {
  return Number(
    sqlValue(
      `SELECT COUNT(*) FROM provider_system_notices WHERE notice_kind='admin_hide' AND dedupe_key LIKE 'admin_hide:${cardType}:${id}:%'`,
    ),
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('A28-07 접근 가드 · 입력 검증', () => {
  test('Q1 비로그인 GET exposure → 401', async ({ request }) => {
    await logout(request);
    const res = await request.get('/api/admin/exposure.php');
    expect(res.status()).toBe(401);
  });

  test('Q2 tutor GET exposure → 403', async ({ request }) => {
    await loginAs(request, 'tutor');
    const res = await request.get('/api/admin/exposure.php');
    expect(res.status()).toBe(403);
  });

  test('Q3 admin GET exposure → 200', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await getExposureItems(request);
    expect(res.status()).toBe(200);
    expect(body.ok).toBeTruthy();
    expect(Array.isArray(body.items)).toBeTruthy();
  });

  test('Q4 비로그인 #/admin/exposure UI 게이트', async ({ page }) => {
    await logout(page.request);
    await page.goto('/');
    await page.waitForSelector('#app .preview-toolbar', { timeout: 30_000 });
    await page.evaluate(() => {
      window.location.hash = '#/admin/exposure';
    });
    await expect(page.getByText('운영자 전용')).toBeVisible();
  });

  test('잘못된 target_type → 422', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await patchExposure(request, {
      target_type: 'student',
      target_id: '1',
      action: 'hide',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
  });

  test('tutor에 inquiry_status → 422', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await patchExposure(request, {
      target_type: 'tutor',
      target_id: '1',
      action: 'inquiry_status',
      inquiry_status: 'paused',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
  });

  test('Q9 study_room inquiry_status 값 누락 → 422', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await patchExposure(request, {
      target_type: 'study_room',
      target_id: '3',
      action: 'inquiry_status',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
  });

  test('잘못된 action → 422', async ({ request }) => {
    await loginAs(request, 'admin');
    const { res, body } = await patchExposure(request, {
      target_type: 'study_room',
      target_id: '3',
      action: 'approve',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
  });
});

test.describe('A28-07 PATCH 핵심 (부록 F Q6~Q15)', () => {
  test.beforeAll(() => {
    sqlValue(
      `UPDATE study_rooms SET
        study_room_name = COALESCE(NULLIF(TRIM(study_room_name),''),'e2e 공부방'),
        lesson_place_type = COALESCE(NULLIF(TRIM(lesson_place_type),''),'study_room'),
        main_subject_note = COALESCE(NULLIF(TRIM(main_subject_note),''),'국어'),
        slogan = COALESCE(NULLIF(TRIM(slogan),''),'e2e 슬로건'),
        address_text = COALESCE(NULLIF(TRIM(address_text),''),'서울 강남구 e2e 주소')
      WHERE id = 3`,
    );
    sqlValue(
      `INSERT INTO study_room_regions (study_room_id, slot, region_id, is_primary)
       SELECT 3, 1, 3, 1 FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM study_room_regions
         WHERE study_room_id = 3 AND slot = 1 AND region_id IS NOT NULL AND region_id <> 0
       )`,
    );
    sqlValue(
      `INSERT INTO study_room_primary_audiences (study_room_id, school_level)
       SELECT 3, 'elementary' FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM study_room_primary_audiences WHERE study_room_id = 3
       )`,
    );
  });

  test.beforeEach(async ({ request }) => {
    await loginAs(request, 'admin');
  });

  test.afterAll(async ({ request }) => {
    await loginAs(request, 'admin');
    await restoreExposureDefaults(request);
  });

  test('Q6 study_room hide — profile hidden · hide_profile · user_notified', async ({ request }) => {
    const beforeNotices = hideNoticeCount('study_room', 3);
    const memo = `E2E Q6 hide ${Date.now()}`;
    const { res, body } = await patchExposure(request, {
      target_type: 'study_room',
      target_id: '3',
      action: 'hide',
      internal_memo: memo,
      reason_category: 'internal_review',
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('hidden');
    expect(body.item.searchVisible).toBe(false);
    expectLog(body.log, {
      action: 'hide_profile',
      target: '3',
      userNotified: true,
      detailMemo: memo,
    });
    expect(hideNoticeCount('study_room', 3)).toBe(beforeNotices + 1);
    const notice = sqlValue(
      "SELECT CONCAT(title, '|', is_read, '|', body) FROM provider_system_notices WHERE notice_kind='admin_hide' AND dedupe_key LIKE 'admin_hide:study_room:3:%' ORDER BY id DESC LIMIT 1",
    );
    expect(notice.startsWith('홈·찾기 숨김|0|')).toBeTruthy();
    expect(notice).toContain('이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.');
  });

  test('Q7 study_room publish — profile published · exposure_correction', async ({ request }) => {
    const { res, body } = await patchExposure(request, {
      target_type: 'study_room',
      target_id: '3',
      action: 'publish',
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('published');
    expect(body.item.searchVisible).toBe(true);
    expectLog(body.log, {
      action: 'exposure_correction',
      target: '3',
      userNotified: false,
    });
  });

  test('Q7b 슬로건이 비면 draft·missing, 채우면 published', async ({ request }) => {
    const before = sqlValue('SELECT COALESCE(slogan, \'\') FROM study_rooms WHERE id = 3').replace(/'/g, "''");
    try {
      const hidden = await patchExposure(request, {
        target_type: 'study_room',
        target_id: '3',
        action: 'hide',
      });
      expect(hidden.res.status()).toBe(200);
      sqlValue("UPDATE study_rooms SET slogan = '' WHERE id = 3");
      const draft = await patchExposure(request, {
        target_type: 'study_room',
        target_id: '3',
        action: 'publish',
      });
      expect(draft.res.status()).toBe(200);
      expect(draft.body.item.status).toBe('draft');
      expect(draft.body.missing || []).toContain('슬로건');
      sqlValue(`UPDATE study_rooms SET slogan = '${before}' WHERE id = 3`);
      // 불완전 publish 뒤 상태는 draft다. draft에서 publish는 400이므로 숨긴 다음 다시 올린다.
      const rehide = await patchExposure(request, {
        target_type: 'study_room',
        target_id: '3',
        action: 'hide',
      });
      expect(rehide.res.status()).toBe(200);
      const again = await patchExposure(request, {
        target_type: 'study_room',
        target_id: '3',
        action: 'publish',
      });
      expect(again.res.status()).toBe(200);
      expect(again.body.item.status).toBe('published');
    } finally {
      sqlValue(`UPDATE study_rooms SET slogan = '${before}', profile_status = 'published' WHERE id = 3`);
    }
  });

  test('Q8 study_room inquiry_status=paused · exposure_correction', async ({ request }) => {
    const { res, body } = await patchExposure(request, {
      target_type: 'study_room',
      target_id: '3',
      action: 'inquiry_status',
      inquiry_status: 'paused',
    });
    expect(res.status()).toBe(200);
    expect(body.item.secondaryStatus).toBe('paused');
    expectLog(body.log, {
      action: 'exposure_correction',
      target: '3',
      userNotified: false,
    });
  });

  test('Q10 tutor hide — hide_profile', async ({ request }) => {
    const beforeNotices = hideNoticeCount('tutor', 1);
    const { res, body } = await patchExposure(request, {
      target_type: 'tutor',
      target_id: '1',
      action: 'hide',
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('hidden');
    expectLog(body.log, {
      action: 'hide_profile',
      target: '1',
      userNotified: true,
    });
    expect(hideNoticeCount('tutor', 1)).toBe(beforeNotices + 1);
  });

  test('Q11 tutor publish — exposure_correction', async ({ request }) => {
    const { res, body } = await patchExposure(request, {
      target_type: 'tutor',
      target_id: '1',
      action: 'publish',
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('published');
    expectLog(body.log, {
      action: 'exposure_correction',
      target: '1',
      userNotified: false,
    });
  });

  test('Q12 tutor inquiry_status → 422 (미지원)', async ({ request }) => {
    const { res } = await patchExposure(request, {
      target_type: 'tutor',
      target_id: '1',
      action: 'inquiry_status',
      inquiry_status: 'open',
    });
    expect(res.status()).toBe(422);
  });

  test('Q13 submission hide — submission_hide · target_id 형식', async ({ request }) => {
    const memo = `E2E Q13 ${Date.now()}`;
    const { res, body } = await patchExposure(request, {
      target_type: 'submission',
      target_id: 'sub-seed-1',
      action: 'hide',
      internal_memo: memo,
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('hidden');
    expect(body.item.internalMemo).toBe(memo);
    expectLog(body.log, {
      action: 'submission_hide',
      target: 'submission:sub-seed-1',
      userNotified: false,
      detailMemo: memo,
    });
  });

  test('Q14 submission publish — submission_expose', async ({ request }) => {
    const { res, body } = await patchExposure(request, {
      target_type: 'submission',
      target_id: 'sub-seed-1',
      action: 'publish',
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('published');
    expectLog(body.log, {
      action: 'submission_expose',
      target: 'submission:sub-seed-1',
      userNotified: false,
    });
  });

  test('Q15 submission submitted → A28-07 publish 거부 (422 · A28-06 경계)', async ({ request }) => {
    const postKey = await createSubmissionPost(request, `E2E Q15 boundary ${Date.now()}`);
    await loginAs(request, 'admin');

    const { res, body } = await patchExposure(request, {
      target_type: 'submission',
      target_id: postKey,
      action: 'publish',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
    expect(String(body.message ?? body.error ?? '')).toMatch(/A28-06|제출됨/);
  });
});

test.describe('A28-06 / A28-07 경계 회귀', () => {
  test.describe.configure({ mode: 'serial' });

  /** @type {string | undefined} */
  let boundaryPostKey;

  test.beforeEach(async ({ request }) => {
    await loginAs(request, 'admin');
  });

  test('Q16 submitted 항목은 A28-06 큐에만 노출', async ({ request }) => {
    boundaryPostKey = await createSubmissionPost(request, `E2E A28-06 boundary ${Date.now()}`);
    await loginAs(request, 'admin');

    const { queue } = await getSubmissionQueue(request, 'submitted');
    expect(queue.some((q) => q.id === boundaryPostKey)).toBeTruthy();

    const { items } = await getExposureItems(request, { targetType: 'submission', status: 'submitted' });
    expect(items.some((i) => i.targetId === boundaryPostKey)).toBeTruthy();
  });

  test('Q16b A28-06 expose — 큐 제거 · submission_expose 로그', async ({ request }) => {
    expect(boundaryPostKey).toBeTruthy();
    const memo = `A28-06 expose ${Date.now()}`;
    const { res, body } = await patchSubmissionQueue(request, {
      id: boundaryPostKey,
      action: 'expose',
      internal_memo: memo,
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('published');
    expectLog(body.log, {
      action: 'submission_expose',
      target: `submission:${boundaryPostKey}`,
      userNotified: false,
      detailMemo: memo,
    });

    const { queue } = await getSubmissionQueue(request, 'submitted');
    expect(queue.some((q) => q.id === boundaryPostKey)).toBeFalsy();
  });

  test('Q17 A28-06 큐 이후 A28-07 hide — submission_hide (보정 경로)', async ({ request }) => {
    expect(boundaryPostKey).toBeTruthy();
    const { res, body } = await patchExposure(request, {
      target_type: 'submission',
      target_id: boundaryPostKey,
      action: 'hide',
      internal_memo: 'A28-07 hide after A28-06 expose',
    });
    expect(res.status()).toBe(200);
    expect(body.item.status).toBe('hidden');
    expectLog(body.log, {
      action: 'submission_hide',
      target: `submission:${boundaryPostKey}`,
      userNotified: false,
      detailMemo: 'A28-07 hide after A28-06 expose',
    });
  });

  test('A28-06은 submitted가 아니면 expose 거부', async ({ request }) => {
    expect(boundaryPostKey).toBeTruthy();
    const { res, body } = await patchSubmissionQueue(request, {
      id: boundaryPostKey,
      action: 'expose',
    });
    expect(res.status()).toBe(422);
    expect(body.ok).toBeFalsy();
  });

  test('Q18 GET 필터 study_room + published', async ({ request }) => {
    await patchExposure(request, {
      target_type: 'study_room',
      target_id: '3',
      action: 'publish',
    });
    const { res, body } = await getExposureItems(request, {
      targetType: 'study_room',
      status: 'published',
    });
    expect(res.status()).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i) => i.targetType === 'study_room' && i.status === 'published')).toBeTruthy();
  });

  test('Q19 GET status=hidden 필터', async ({ request }) => {
    expect(boundaryPostKey).toBeTruthy();
    await patchExposure(request, {
      target_type: 'submission',
      target_id: boundaryPostKey,
      action: 'hide',
    });
    const { body } = await getExposureItems(request, { status: 'hidden' });
    expect(body.items.some((i) => i.targetId === boundaryPostKey && i.status === 'hidden')).toBeTruthy();
  });

  test('Q20 PATCH 후 operator는 세션 email', async ({ request }) => {
    const { body } = await patchExposure(request, {
      target_type: 'tutor',
      target_id: '2',
      action: 'hide',
      operator_id: 'forged@evil.local',
    });
    expect(body.log.operator).toBe(ACCOUNTS.admin);
    await patchExposure(request, { target_type: 'tutor', target_id: '2', action: 'publish' });
  });
});
