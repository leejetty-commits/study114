/**
 * 보이는 카드를 차례로 눌러 상세가 열렸는지 모은다.
 * 한 장이 실패해도 나머지는 계속 누르고, 호출하는 쪽에서 마지막에 assert 한다.
 */
import { expect } from '@playwright/test';

const DETAIL = '#p24-detail-modal';

/** @param {import('@playwright/test').Page} page */
async function dismissGuestGate(page) {
  const gate = page.locator('#guest-deep-access-gate');
  if (await gate.isVisible().catch(() => false)) {
    await gate.getByRole('button', { name: '나중에 할게요' }).click();
    await expect(gate).toHaveCount(0);
  }
}

/**
 * @param {import('@playwright/test').Locator} card
 */
async function readCardMeta(card) {
  const cls = (await card.getAttribute('class')) || '';
  const tier = cls.includes('expo-card--prime') ? 'prime' : cls.includes('expo-card--pick') ? 'pick' : 'basic';
  const providerId = await card.getAttribute('data-provider-id');
  const studentId = await card.getAttribute('data-student-id');
  const kind = (await card.getAttribute('data-provider-kind')) || (studentId ? 'student' : '');
  const name = (
    (await card.locator('.expo-hcard__name, .expo-tbl__cell--name').first().textContent().catch(() => '')) || ''
  ).replace(/\s+/g, ' ').trim();
  return {
    id: providerId || studentId || '',
    kind,
    tier,
    name,
  };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} cards 보이는 카드만 넘긴다.
 * @param {{ click?: (card: import('@playwright/test').Locator) => Promise<void>, openLocator?: import('@playwright/test').Locator, afterOpen?: () => Promise<void>, close?: () => Promise<void>, openTimeout?: number }} [opts]
 * @returns {Promise<{ count: number, results: Array<{ index: number, id: string, kind: string, tier: string, name: string, opened: boolean }> }>}
 */
export async function clickAllCards(page, cards, opts = {}) {
  const count = await cards.count();
  /** @type {Array<{ index: number, id: string, kind: string, tier: string, name: string, opened: boolean }>} */
  const results = [];
  const openTimeout = opts.openTimeout ?? 4000;
  const openLocator = opts.openLocator || page.locator(DETAIL);
  const close = opts.close || (async () => {
    const btn = page.locator('[data-p24-action="close"]');
    if (await btn.count()) {
      await btn.first().click();
      await page.locator(DETAIL).waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
    }
  });

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const meta = await readCardMeta(card);
    let didOpen = false;
    try {
      if (opts.click) await opts.click(card);
      else await card.click({ timeout: 5000 });
      await openLocator.first().waitFor({ state: 'visible', timeout: openTimeout });
      didOpen = true;
    } catch {
      didOpen = false;
    }
    results.push({ index, ...meta, opened: didOpen });
    if (didOpen && opts.afterOpen) await opts.afterOpen();
    if (didOpen) {
      try {
        await close();
      } catch {
        /* 다음 카드는 계속 */
      }
    } else {
      await dismissGuestGate(page);
    }
  }
  return { count, results };
}

/** 0장이면 실패. 안 열린 카드가 있으면 목록을 메시지에 남기고 실패. */
export function assertAllOpened(results) {
  expect(results.length, '보이는 카드 0장 — 조용히 통과하지 않음').toBeGreaterThan(0);
  const closed = results.filter((row) => !row.opened);
  expect(
    closed.map((row) => `${row.index}:${row.kind}:${row.tier}:${row.id}:${row.name}`),
    '상세가 열리지 않은 카드',
  ).toEqual([]);
}

/** @param {Array<{ tier: string, opened: boolean }>} results */
export function tierNotes(results) {
  const tiers = ['basic', 'pick', 'prime'];
  return tiers.map((tier) => {
    const rows = results.filter((row) => row.tier === tier);
    if (!rows.length) return `${tier}: 데이터 없음`;
    const closed = rows.filter((row) => !row.opened).length;
    return closed ? `${tier}: ${rows.length}장 중 ${closed}장 실패` : `${tier}: ${rows.length}장 열림`;
  }).join(' · ');
}
