/**
 * 채널 ACL API · 찜 메뉴 · 자료실 가짜 다운로드 차단 (로컬)
 */
import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/admin-api.js';
import { HOME, devLoginParent } from './helpers/mypage-flow.js';
import { devLoginTutor } from './helpers/messages-flow.js';

test.describe('board channel ACL API', () => {
  test('guest concern-director — posts 비어 있고 제목 필드 없음', async ({ request }) => {
    const res = await request.get('/api/board/posts.php?board_key=concern-director');
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.ok).toBeTruthy();
    expect(body.access).toBe('intro');
    expect(Array.isArray(body.posts)).toBeTruthy();
    expect(body.posts).toEqual([]);
    expect(body.intro?.title).toBeTruthy();
    const blob = JSON.stringify(body.posts);
    expect(blob).not.toMatch(/authorName|author_role|title":"/);
  });

  test('guest concern-parent — 게시글 파생 정보 없음', async ({ request }) => {
    const res = await request.get('/api/board/posts.php?board_key=concern-parent');
    const body = await res.json();
    expect(body.access).toBe('intro');
    expect(body.posts).toEqual([]);
  });

  test('guest notice — 목록 허용', async ({ request }) => {
    const res = await request.get('/api/board/posts.php?board_key=notice');
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.access).toBe('full');
    expect(Array.isArray(body.posts)).toBeTruthy();
  });

  test('guest submission — 차단', async ({ request }) => {
    const res = await request.get('/api/board/posts.php?board_key=submission');
    expect([401, 403]).toContain(res.status());
  });

  test('guest concern-family alias — intro, posts 없음', async ({ request }) => {
    const res = await request.get('/api/board/posts.php?board_key=concern-family');
    const body = await res.json();
    expect(body.access).toBe('intro');
    expect(body.posts).toEqual([]);
    expect(body.intro?.boardKey).toBe('concern-parent');
  });

  test('guest concern-solved · tutor — intro', async ({ request }) => {
    for (const key of ['concern-solved', 'concern-tutor']) {
      const res = await request.get(`/api/board/posts.php?board_key=${key}`);
      const body = await res.json();
      expect(body.access, key).toBe('intro');
      expect(body.posts, key).toEqual([]);
    }
  });

  test('guest library — 로그인 필요, guide-pdf는 메타 목록', async ({ request }) => {
    const lib = await request.get('/api/board/posts.php?board_key=library');
    expect([401, 403]).toContain(lib.status());
    const guides = await request.get('/api/board/posts.php?board_key=library-guide-pdf');
    const body = await guides.json();
    expect(guides.ok()).toBeTruthy();
    expect(body.access).toBe('full');
    expect(Array.isArray(body.posts)).toBeTruthy();
  });

  test('guest 직접 id 쿼리도 제목을 주지 않음', async ({ request }) => {
    const res = await request.get('/api/board/posts.php?board_key=concern-director&id=cd1');
    const body = await res.json();
    expect(body.access).toBe('intro');
    expect(body.posts).toEqual([]);
  });

  test('guest faq · safe-guide 목록 허용', async ({ request }) => {
    for (const key of ['faq', 'safe-guide']) {
      const res = await request.get(`/api/board/posts.php?board_key=${key}`);
      const body = await res.json();
      expect(res.ok(), key).toBeTruthy();
      expect(body.access, key).toBe('full');
      expect(Array.isArray(body.posts), key).toBeTruthy();
    }
  });

  test('parent 직접 director id 조회도 intro', async ({ request }) => {
    await loginAs(request, 'parent');
    const res = await request.get('/api/board/posts.php?board_key=concern-director&id=cd1');
    const body = await res.json();
    expect(body.access).toBe('intro');
    expect(body.posts).toEqual([]);
    await logout(request);
  });

  test('parent cannot list director posts', async ({ request }) => {
    await loginAs(request, 'parent');
    const res = await request.get('/api/board/posts.php?board_key=concern-director');
    const body = await res.json();
    expect(body.access).toBe('intro');
    expect(body.posts).toEqual([]);
    await logout(request);
  });

  test('study_room cannot compose submission', async ({ request }) => {
    await loginAs(request, 'study_room');
    const res = await request.post('/api/board/posts.php', {
      data: {
        board_key: 'submission',
        title: 'should-fail',
        category_id: 'other',
        file_label: 'x.pdf',
      },
    });
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test('study_room reads all concern boards, cannot compose parent', async ({ request }) => {
    await loginAs(request, 'study_room');
    for (const key of ['concern-parent', 'concern-director', 'concern-tutor']) {
      const res = await request.get(`/api/board/posts.php?board_key=${key}`);
      const body = await res.json();
      expect(body.access, key).toBe('full');
      expect(Array.isArray(body.posts), key).toBeTruthy();
    }
    const write = await request.post('/api/board/posts.php', {
      data: { board_key: 'concern-parent', title: 'should-fail', body: 'x' },
    });
    expect(write.status()).toBe(403);
    await logout(request);
  });

  test('tutor reads director, cannot compose director', async ({ request }) => {
    await loginAs(request, 'tutor');
    const res = await request.get('/api/board/posts.php?board_key=concern-director');
    const body = await res.json();
    expect(body.access).toBe('full');
    const write = await request.post('/api/board/posts.php', {
      data: { board_key: 'concern-director', title: 'should-fail', body: 'x' },
    });
    expect(write.status()).toBe(403);
    await logout(request);
  });
});

test.describe('wishlist all logged-in roles', () => {
  test('parent 사이드바에 찜 목록', async ({ page }) => {
    await devLoginParent(page);
    await page.goto(`${HOME}/#/mypage/home`);
    await expect(page.locator('.mypage-nav a[data-mypage-nav="/mypage/wishlist"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('tutor 사이드바에 찜 목록 · 학생검토함과 분리', async ({ page }) => {
    await devLoginTutor(page);
    await page.goto(`${HOME}/#/mypage/registrations`);
    await expect(page.locator('.mypage-nav a[data-mypage-nav="/mypage/wishlist"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('.mypage-nav a[data-mypage-nav="/mypage/student-review"]')).toBeVisible();
    await page.goto(`${HOME}/#/mypage/wishlist`);
    await expect(page.locator('.mypage-panel')).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('library download not fake-complete', () => {
  test('자료실 다운로드 버튼이 준비 중으로 비활성', async ({ page }) => {
    await page.goto(`${HOME}/#/library/guides`);
    const btn = page.locator('.lib-card__dl').first();
    if ((await btn.count()) === 0) {
      test.info().annotations.push({ type: 'note', description: '가이드 카드 없음(권한·시드)' });
      return;
    }
    await expect(btn).toBeDisabled();
    await expect(btn).toContainText('준비 중');
  });
});

const DIRECTOR_SEED_TITLE = '문의는 오는데 등록까지 이어지지 않아요';

test.describe('guest UI concern intro (preview)', () => {
  test('게스트 원장 고민방 목록에 시드 제목이 렌더되지 않음', async ({ page }) => {
    await page.goto(`${HOME}/#/community/director`);
    await expect(page.locator('.concern-hero__lead')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText(DIRECTOR_SEED_TITLE);
  });

  test('게스트 홈 레일에 원장 고민 시드 제목이 없음', async ({ page }) => {
    await page.goto(`${HOME}/#/`);
    await expect(page.locator('[data-right-rail-slot], .home-sidebar')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText(DIRECTOR_SEED_TITLE);
  });
});
