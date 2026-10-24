/**
 * 300-1 — 보이는 카드 전부 클릭. 제품 동작은 고치지 않는다.
 * REAL_DB_CAP 은 preview/home-ui/src/exposure-bridge.js 와 같은 수.
 * 표본 밖 카드가 쪽지 배지·비교·이어가기·찜에서 안 열리는 것은 test.fail (300-2).
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, DEV_PASSWORD } from './helpers/admin-api.js';
import { assertAllOpened, clickAllCards, tierNotes } from './helpers/click-all-cards.js';

const HOME = process.env.STUDY114_HOME_UI_URL || 'http://127.0.0.1:5174';
const SEARCH = process.env.STUDY114_SEARCH_UI_URL || 'http://127.0.0.1:5176';

/** exposure-bridge.js REAL_DB_CAP */
const CAP = { study_room: 3, tutor: 2, student: 2 };

const FAIL_NOTE = '300-2에서 수정 예정: resolveDetailItem/REAL_DB_CAP 표본 밖 카드';

const HOME_ROLES = [
  { id: 'guest', hash: '/guest', account: null },
  { id: 'student', hash: '/parent', account: 'parent' },
  { id: 'tutor', hash: '/tutor', account: 'tutor' },
  { id: 'study_room', hash: '/study-room', account: 'study_room' },
];

const SEARCH_TABS = [
  { tab: 'tutor', kind: 'tutor', card: '[data-provider-kind="tutor"][data-provider-id]:visible' },
  { tab: 'room', kind: 'study_room', card: '[data-provider-kind="study_room"][data-provider-id]:visible' },
  { tab: 'student', kind: 'student', card: '[data-student-id]:visible' },
];

/** @param {import('@playwright/test').Page} page @param {'parent'|'tutor'|'study_room'|null} account */
async function login(page, account) {
  if (!account) return;
  const res = await page.request.post('/api/auth/login.php', {
    data: { email: ACCOUNTS[account], password: DEV_PASSWORD },
  });
  expect(res.ok(), `${account} 로그인`).toBeTruthy();
}

function providerCards(page) {
  return page.locator('article[data-provider-id][data-provider-kind]:visible');
}

test.describe('300-1 홈 4모드 · 보이는 카드 전부', () => {
  for (const role of HOME_ROLES) {
    test(`${role.id} 홈 카드 상세`, async ({ page }) => {
      await login(page, role.account);
      await page.goto(`${HOME}/#${role.hash}`);
      await page.waitForSelector('nav.home-gnb, #app', { timeout: 30_000 });
      const selector = role.id === 'guest'
        ? 'article[data-provider-id][data-provider-kind]:visible'
        : 'article[data-provider-id][data-provider-kind]:visible, [data-student-id]:visible';
      await page.locator(selector).first()
        .waitFor({ state: 'visible', timeout: 30_000 })
        .catch(() => {});
      const cards = page.locator(selector);
      const { results } = await clickAllCards(page, cards);
      test.info().annotations.push({ type: 'tiers', description: `${role.id} 홈 ${tierNotes(results)}` });
      assertAllOpened(results);
    });
  }
});

test.describe('300-1 찾기 3종 · 학생 역할(guardian1)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'parent');
  });

  for (const spec of SEARCH_TABS) {
    test(`찾기 ${spec.tab} 카드 상세`, async ({ page }) => {
      await page.goto(`${SEARCH}/#/search/${spec.tab}?role=parent`);
      await page.waitForSelector(spec.card, { timeout: 30_000 });
      const { results } = await clickAllCards(page, page.locator(spec.card));
      test.info().annotations.push({ type: 'tiers', description: `찾기 ${spec.tab} ${tierNotes(results)}` });
      assertAllOpened(results);
    });
  }
});

test.describe('300-1 표본 밖 · 쪽지 배지·비교·이어가기·찜', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'parent');
  });

  test('찾기 과외쌤 쪽지 배지 → 작성 또는 상세', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/tutor?role=parent`);
    const cards = page.locator('[data-provider-kind="tutor"][data-provider-id]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 30_000 });
    const count = await cards.count();
    expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
    // 카드 본문 클릭은 getProviderItem. 쪽지 배지는 resolveDetailItem 만 본다.
    test.fail(count > CAP.tutor, FAIL_NOTE);
    const { results } = await clickAllCards(page, cards, {
      click: async (card) => {
        await card.locator('[data-action="open-detail-memo"]').first().click();
      },
      openLocator: page.locator('#p24-detail-modal, [data-overlay="compose"]'),
      close: async () => {
        const cancel = page.locator('[data-overlay="compose"] [data-action="close-overlay"]');
        if (await cancel.count()) await cancel.first().click();
        if (await page.locator('#p24-detail-modal').isVisible()) {
          await page.locator('[data-p24-action="close"]').first().click();
        }
      },
    });
    assertAllOpened(results);
  });

  test('찾기 마지막 공부방 비교 → 비교표에 이름', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/room?role=parent`);
    const cards = page.locator('[data-provider-kind="study_room"][data-provider-id]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 30_000 });
    const count = await cards.count();
    expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
    const outside = count > CAP.study_room;
    test.fail(outside, FAIL_NOTE);
    const card = cards.nth(count - 1);
    const name = ((await card.locator('.expo-hcard__name, .expo-tbl__cell--name').first().textContent()) || '').trim();
    expect(name.length, '비교할 카드 이름').toBeGreaterThan(0);
    await card.locator('[data-action="compare-toggle"]').first().click();
    await page.locator('[data-action="compare-bar-open"]').first().click();
    await expect(page.locator('#compare-modal-root')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#compare-modal-root')).toContainText(name.slice(0, 8));
  });

  test('비교 목록에서 마지막 공부방 상세를 연다', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/room?role=parent`);
    const cards = page.locator('[data-provider-kind="study_room"][data-provider-id]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 30_000 });
    const count = await cards.count();
    expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
    if (count > CAP.study_room) test.fail(true, FAIL_NOTE);
    const card = cards.nth(count - 1);
    const name = ((await card.locator('.expo-hcard__name, .expo-tbl__cell--name').first().textContent()) || '').trim();
    expect(name.length, '비교할 카드 이름').toBeGreaterThan(0);
    await card.locator('[data-action="compare-toggle"]').first().click();
    await page.locator('[data-action="compare-bar-open"]').first().click();
    const modal = page.locator('#compare-modal-root');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await modal.locator('.compare-policy__name, th').filter({ hasText: name.slice(0, 8) }).first().click();
    await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 10_000 });
  });

  test('이어가기 resume_intent 가 마지막 과외쌤 상세를 연다', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/tutor?role=parent`);
    const cards = page.locator('[data-provider-kind="tutor"][data-provider-id]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 30_000 });
    const count = await cards.count();
    expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
    test.fail(count > CAP.tutor, FAIL_NOTE);
    const id = await cards.nth(count - 1).getAttribute('data-provider-id');
    const intent = encodeURIComponent(JSON.stringify({
      source: 'card_detail',
      providerType: 'tutor',
      providerId: Number(id),
      t: Date.now(),
    }));
    await page.goto(`${HOME}/#/parent?resume_intent=${intent}`);
    await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 10_000 });
  });

  test('찾기에서 찜한 표본 밖 공부방이 찜 목록에서 상세로 열린다', async ({ page }) => {
    await page.goto(`${SEARCH}/#/search/room?role=parent`);
    const cards = page.locator('[data-provider-kind="study_room"][data-provider-id]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 30_000 });
    const count = await cards.count();
    expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
    const card = cards.nth(count - 1);
    const id = await card.getAttribute('data-provider-id');
    await card.locator('[data-action="wish-toggle"]').first().click();
    await page.goto(`${HOME}/#/mypage/wishlist`);
    await page.waitForSelector('#app', { timeout: 30_000 });
    const wished = page.locator(`[data-mypage-wishlist="study_room"] [data-provider-id="${id}"]`);
    const unknown = page.locator(`[data-wish-unavailable="study_room"][data-id="${id}"]`);
    await wished.or(unknown).first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    const visible = await wished.count();
    test.fail(count > CAP.study_room && visible === 0, FAIL_NOTE);
    await expect(wished, '찜 목록에 카드가 없음').toHaveCount(1);
    await wished.click();
    await expect(page.locator('#p24-detail-modal')).toBeVisible({ timeout: 10_000 });
  });
});

test('300-1 공개 마이샵 cold open', async ({ page }) => {
  await login(page, 'parent');
  await page.goto(`${SEARCH}/#/search/room?role=parent`);
  const cards = page.locator('[data-provider-kind="study_room"][data-provider-id]:visible');
  await cards.first().waitFor({ state: 'visible', timeout: 30_000 });
  expect(await cards.count(), '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
  const id = await cards.nth((await cards.count()) - 1).getAttribute('data-provider-id');
  await page.goto(`${HOME}/#/myshop/study-room/${id}`);
  const shell = page.locator('[data-myshop-public]');
  await expect(shell).toBeVisible({ timeout: 15_000 });
  await expect(shell.locator('.shop--empty')).toHaveCount(0);
});

test('300-1 게스트 찾기 공부방 카드는 상세 대신 로그인 팝업', async ({ page }) => {
  await page.goto(`${SEARCH}/#/search/room?role=guest`);
  await page.waitForSelector('[data-search-form]', { timeout: 30_000 });
  const cards = page.locator('[data-provider-kind="study_room"][data-provider-id]:visible');
  const count = await cards.count();
  expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    await cards.nth(i).click();
    await expect(page.locator('#p24-detail-modal')).toHaveCount(0);
    const gate = page.locator('#guest-deep-access-gate');
    await expect(gate).toBeVisible();
    await gate.getByRole('button', { name: '나중에 할게요' }).click();
  }
});

test('300-1 게스트 학생 카드는 장마다 로그인으로 이동', async ({ page }) => {
  await page.goto(`${SEARCH}/#/search/student?role=guest`);
  await page.waitForSelector('[data-search-form]', { timeout: 30_000 });
  const cards = page.locator('[data-student-id]:visible');
  const count = await cards.count();
  expect(count, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    await page.goto(`${SEARCH}/#/search/student?role=guest`);
    await page.locator('[data-student-id]:visible').nth(i).click();
    await page.waitForURL(/login/, { timeout: 15_000 });
  }
});

test('과외쌤·공부방 계정도 찾기 과외쌤 카드를 전부 연다', async ({ page }) => {
  await login(page, 'tutor');
  await page.goto(`${SEARCH}/#/search/tutor?role=tutor`);
  await page.waitForSelector('[data-provider-kind="tutor"][data-provider-id]:visible', { timeout: 30_000 });
  const tutor = await clickAllCards(page, providerCards(page));
  test.info().annotations.push({ type: 'tiers', description: `tutor 찾기 ${tierNotes(tutor.results)}` });
  assertAllOpened(tutor.results);

  await login(page, 'study_room');
  await page.goto(`${SEARCH}/#/search/room?role=study_room`);
  await page.waitForSelector('[data-provider-kind="study_room"][data-provider-id]:visible', { timeout: 30_000 });
  const room = await clickAllCards(page, providerCards(page));
  test.info().annotations.push({ type: 'tiers', description: `study_room 찾기 ${tierNotes(room.results)}` });
  assertAllOpened(room.results);
});
