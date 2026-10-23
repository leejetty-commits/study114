import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = process.env.TEMP + '/s114-t8b';
const BASE = 'http://127.0.0.1:5174';
await mkdir(OUT, { recursive: true });

const ROLES = [
  { key: 'parent', role_type: 'guardian_student' },
  { key: 'study_room', role_type: 'study_room_owner' },
  { key: 'tutor', role_type: 'tutor' },
];

const FILLED = {
  ok: true,
  items: [
    {
      target_type: 'study_room',
      target_id: 10,
      title_snapshot: '해운대공부방',
      viewed_at: '2026-10-12T01:00:00.000Z',
      last_route: 'search',
      last_action: 'view_detail',
    },
    {
      target_type: 'tutor',
      target_id: 3,
      title_snapshot: '수학과외',
      viewed_at: '2026-10-11T01:00:00.000Z',
      last_route: 'tutor',
      last_action: 'wish_add',
    },
  ],
};

function meBody(role_type) {
  return {
    ok: true,
    authenticated: true,
    email_verified: true,
    needs_account_contact: false,
    needs_basic_register: false,
    oauth_role_pending: false,
    user_id: 1,
    email: `${role_type}@dev.local`,
    role_type,
    name: '시험',
    admin_level: null,
    must_change_password: false,
    oauth_providers: [],
    oauth_provider_labels: [],
    phone_verified: true,
  };
}

async function installRoutes(page, { role_type, recent }) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    let body = { ok: true, items: [] };
    if (url.includes('/api/auth/me.php')) body = meBody(role_type);
    else if (url.includes('/api/handoff/recent.php')) body = recent;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

function measure(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.mypage-content .mp-card');
    const cs = card ? getComputedStyle(card) : null;
    const rows = [...document.querySelectorAll('.mypage-content .mp-card__row')];
    const rowStyles = rows.map((row) => {
      const s = getComputedStyle(row);
      return {
        borderTopWidth: s.borderTopWidth,
        borderTopStyle: s.borderTopStyle,
        borderRadius: s.borderRadius,
        opacity: s.opacity,
      };
    });
    const aux = document.querySelector('.mypage-content .mp-card__row p:not(.mp-card__row-title)');
    const title = document.querySelector('.mypage-content .mp-card__row-title');
    const empty = document.querySelector('.mypage-content .mp-card__empty');
    const notice = document.querySelector('.mypage-content .mypage-notice, .mypage-notice');
    const content = document.querySelector('.mypage-content');
    const box = (el) => (el ? el.getBoundingClientRect() : null);
    const cardBox = box(card);
    const contentBox = box(content);
    const noticeBox = box(notice);
    const fonts = [...document.querySelectorAll('.mypage-content *')]
      .map((el) => getComputedStyle(el).fontSize)
      .filter((v, i, a) => a.indexOf(v) === i);
    return {
      text: document.querySelector('.mypage-content')?.innerText || '',
      title: document.querySelector('.mypage-content h1, .mypage-head, .mypage-title')?.textContent || document.body.innerText.slice(0, 80),
      heading: [...document.querySelectorAll('h1,h2')].map((el) => el.textContent.trim()).slice(0, 8),
      stateCard: document.querySelectorAll('.state-card').length,
      entity: document.querySelectorAll('.mypage-entity').length,
      entityList: document.querySelectorAll('.mypage-entity-list').length,
      cards: document.querySelectorAll('.mypage-content .mp-card').length,
      card: cs
        ? {
            bg: cs.backgroundColor,
            border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
            radius: cs.borderRadius,
            pad: cs.padding,
            shadow: cs.boxShadow,
          }
        : null,
      rowStyles,
      auxColor: aux ? getComputedStyle(aux).color : null,
      auxSize: aux ? getComputedStyle(aux).fontSize : null,
      titleSize: title ? getComputedStyle(title).fontSize : null,
      titleWeight: title ? getComputedStyle(title).fontWeight : null,
      emptyText: empty?.textContent || '',
      rightDelta: cardBox && contentBox ? Math.round((contentBox.right - cardBox.right) * 10) / 10 : null,
      noticeDelta: cardBox && noticeBox ? Math.round((noticeBox.right - cardBox.right) * 10) / 10 : null,
      fonts,
      again: document.querySelector('[data-mypage-recent-detail]')?.textContent?.trim() || '',
    };
  });
}

const browser = await chromium.launch({ headless: true });
const report = [];

for (const role of ROLES) {
  for (const mode of ['empty', 'filled']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await installRoutes(page, {
      role_type: role.role_type,
      recent: mode === 'filled' ? FILLED : { ok: true, items: [] },
    });
    await page.goto(`${BASE}/#/mypage/recent`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.mypage-content .mp-card', { timeout: 15000 });
    const data = await measure(page);
    await page.screenshot({ path: `${OUT}/${role.key}-${mode}-1280.png`, fullPage: true });

    let click = null;
    if (mode === 'empty') {
      await page.locator('.mp-card__foot a', { hasText: '탐색하기' }).click();
      await page.waitForTimeout(300);
      click = { afterExplore: page.url() };
      await page.goto(`${BASE}/#/mypage/recent`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.mp-card__link', { timeout: 15000 });
      await page.locator('.mp-card__link', { hasText: '내 등록' }).click();
      await page.waitForTimeout(300);
      click.afterRegister = page.url();
    } else {
      await page.getByRole('button', { name: '다시 보기' }).first().click();
      await page.waitForTimeout(500);
      click = {
        modal: await page.locator('#p24-detail-modal').count(),
        url: page.url(),
      };
    }

    const narrow = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await installRoutes(narrow, {
      role_type: role.role_type,
      recent: mode === 'filled' ? FILLED : { ok: true, items: [] },
    });
    await narrow.goto(`${BASE}/#/mypage/recent`, { waitUntil: 'networkidle' });
    await narrow.waitForSelector('.mypage-content .mp-card', { timeout: 15000 });
    const narrowPad = await narrow.evaluate(() => getComputedStyle(document.querySelector('.mypage-content .mp-card')).padding);
    if (role.key === 'parent') {
      await narrow.screenshot({ path: `${OUT}/parent-${mode}-390.png`, fullPage: true });
    }
    await narrow.close();
    await page.close();
    report.push({ role: role.key, mode, narrowPad, click, ...data });
  }
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
