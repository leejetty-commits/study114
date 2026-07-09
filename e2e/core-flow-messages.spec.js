/**
 * [5단계] 쪽지 플로우 (로컬 실측)
 * 전제: home-ui :5174 · auth-ui :5173 · API :8080
 */
import { test, expect } from '@playwright/test';
import {
  devLoginParent,
  devLoginTutor,
  openFirstStudyRoomDetail,
  parentComposeStudyRoomMessage,
  threadIdFromUrl,
} from './helpers/messages-flow.js';
import { prepBlockThreadE2e, prepMemoGateZeroE2e, restoreMemoGateE2e } from './helpers/admin-api.js';

const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';

test.describe('[5단계] guest → 로그인 유도', () => {
  test('guest 상세 · 로그인 CTA → auth-ui 새 탭', async ({ context, page }) => {
    await page.goto(`${HOME}/#/guest`);
    await page.waitForSelector('[data-provider-kind="study_room"]', { timeout: 30_000 });
    await openFirstStudyRoomDetail(page);
    const [authPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: '로그인하고 문의하기' }).click(),
    ]);
    await authPage.waitForLoadState('domcontentloaded');
    expect(authPage.url()).toMatch(/#\/login/);
    expect(authPage.url()).toMatch(/from=detail/);
    await authPage.close();
  });

  test('guest 쪽지함 · 비로그인 시 데모 스레드 노출', async ({ page }) => {
    await page.goto(`${HOME}/#/mypage/messages/inbox`);
    await page.waitForSelector('.msg-panel', { timeout: 30_000 });
    await expect(page.locator('.msg-row').first()).toBeVisible();
    await expect(page.getByText('대치맘')).toBeVisible();
    await expect(page.locator('.msg-reply')).toHaveCount(0);
  });
});

test.describe('[5단계] parent 상세 → compose → 저장', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginParent(page);
  });

  test('parent 상세 → compose overlay → 전송 → thread 진입', async ({ page }) => {
    const body = `e2e-parent-compose-${Date.now()}`;
    const threadId = await parentComposeStudyRoomMessage(page, body);
    expect(threadId).toBeGreaterThan(0);
    await expect(page.locator('.msg-reply')).toBeVisible();
  });

  test('전송 후 API threads · inbox 목록', async ({ page }) => {
    prepBlockThreadE2e();
    const body = `e2e-parent-inbox-${Date.now()}`;
    const threadId = await parentComposeStudyRoomMessage(page, body);
    const api = await page.request.get('/api/messages/threads.php');
    expect(api.ok()).toBeTruthy();
    const data = await api.json();
    expect(data.ok).toBe(true);
    const found = (data.threads ?? []).some((t) => t.id === threadId);
    expect(found).toBe(true);

    // parent compose = initiatedByMe · 읽음 처리 후 받은 탭 제외 → 보낸 탭에서 확인
    await page.goto('/#/mypage/messages/sent', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.msg-list', { timeout: 30_000 });
    const row = page.locator(`a.msg-row[href="#/mypage/messages/thread/${threadId}"]`);
    await expect(row).toContainText(body.slice(0, 40));
    await row.click();
    await expect(page).toHaveURL(new RegExp(`#/mypage/messages/thread/${threadId}`));
  });

  test('thread 답장 전송', async ({ page }) => {
    const body = `e2e-parent-reply-${Date.now()}`;
    await parentComposeStudyRoomMessage(page, body);
    const reply = `e2e-reply-${Date.now()}`;
    await page.locator('.msg-reply__input').fill(reply);
    await page.locator('.msg-reply').locator('button[type="submit"]').click();
    await expect(page.locator('.msg-bubble--me').filter({ hasText: reply })).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('[5단계] 종료·권한 상태', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginParent(page);
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('보관함(archive) 빈 상태', async ({ page }) => {
    await page.goto('/#/mypage/messages/archive', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.msg-panel', { timeout: 30_000 });
    await expect(page.getByText('쪽지가 없습니다')).toBeVisible();
  });

  test('차단 후 답장 불가 · 종료 배너', async ({ page }) => {
    prepBlockThreadE2e();
    const body = `e2e-block-${Date.now()}`;
    await parentComposeStudyRoomMessage(page, body);
    const blockBtn = page.locator('[data-msg-action="block"]');
    await expect(blockBtn).toBeEnabled();
    await blockBtn.click();
    // API·프론트 기본 block_reason = '차단됨' (BLOCK_THREAD_COPY.banner는 reason 없을 때만)
    await expect(page.getByText('차단됨')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.msg-reply')).toHaveCount(0);
    await expect(page.getByText('답장할 수 없습니다')).toBeVisible();
  });
});

test.describe('[5단계] tutor 콜드 메모 권한', () => {
  test.afterEach(() => {
    restoreMemoGateE2e();
  });

  test('무료 tutor · 학생 상세 → 쪽지권 게이트', async ({ page }) => {
    prepMemoGateZeroE2e();
    await devLoginTutor(page);
    await page.locator('[data-provider-tab="student"]').click();
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForSelector('.expo-basic--student[data-student-id]', { timeout: 30_000 });
    await page.locator('.expo-basic--student[data-student-id]').first().click();
    await expect(page.locator('#p24-detail-modal')).toBeVisible();
    await page.getByRole('button', { name: '메모 보내기' }).click();
    await expect(page.locator('[data-overlay="gate"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-overlay="gate"] .msg-gate__title')).toContainText('쪽지권');
    await expect(page.locator('[data-overlay="compose"]')).toHaveCount(0);
  });
});

test.describe('[5단계] 로그인 후 guest 유도 플로우 이어가기', () => {
  test('로그인 → parent 홈 상세 → 첫 쪽지 전송', async ({ page }) => {
    await devLoginParent(page);
    const body = `e2e-after-login-${Date.now()}`;
    const threadId = await parentComposeStudyRoomMessage(page, body);
    expect(threadId).toBeGreaterThan(0);
  });
});
