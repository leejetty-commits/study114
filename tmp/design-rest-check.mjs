import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire('d:/work/study114/package.json');
const { chromium } = require('playwright');
const OUT = join(process.env.TEMP, 's114-design');
mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:5174';

function me(role_type) {
  return {
    ok: true, authenticated: true, email_verified: true,
    needs_account_contact: false, needs_basic_register: false, oauth_role_pending: false,
    user_id: 1, email: 'a@dev.local', role_type, name: '시험',
    admin_level: null, must_change_password: false,
    oauth_providers: [], oauth_provider_labels: [], phone_verified: true,
  };
}

const STUDENT = { id: 7, title: '민수', region_label: '해운대', grade_level: '중2', subject_name: '수학' };
const TICKETS = {
  ok: true,
  tickets: [
    {
      id: 't1', category: 'payment', body: '결제 영수증이 필요해요', status: 'open',
      created_at: '2026-10-01T01:00:00.000Z', updated_at: '2026-10-02T01:00:00.000Z',
    },
    {
      id: 't2', category: 'signup', body: '가입 메일이 안 와요', status: 'closed',
      created_at: '2026-09-01T01:00:00.000Z', updated_at: '2026-09-02T01:00:00.000Z',
      admin_reply_text: '다시 보내 드렸습니다', admin_replied_at: '2026-09-02T02:00:00.000Z',
    },
  ],
};

async function install(page, role_type, { reviews = false, tickets = false } = {}) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    let body = { ok: true, items: [], tickets: [] };
    if (url.includes('/api/auth/me.php')) body = me(role_type);
    else if (url.includes('/api/handoff/student-reviews.php') && reviews) {
      body = { ok: true, items: [{ student_id: 7, saved_at: '2026-10-12T01:00:00.000Z', provider_role: 'study_room' }] };
    } else if (url.includes('/api/search/search.php')) {
      const raw = route.request().postData() || '{}';
      const tab = JSON.parse(raw).tab;
      body = { ok: true, items: tab === 'student' ? [STUDENT] : [] };
    } else if (url.includes('/api/support/tickets.php') && tickets) body = TICKETS;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

function cardInfo() {
  const card = document.querySelector('.mypage-content .mp-card, .mypage-content .account-settings__hero');
  const cs = card ? getComputedStyle(card) : null;
  const rows = [...document.querySelectorAll('.mypage-content .mp-card__row, .mypage-content .mypage-contact-item')];
  return {
    text: (document.querySelector('.mypage-content')?.innerText || '').slice(0, 700),
    stateCard: document.querySelectorAll('.state-card').length,
    entity: document.querySelectorAll('.mypage-entity').length,
    cards: document.querySelectorAll('.mypage-content .mp-card, .mypage-content .account-card, .mypage-content .account-settings__hero').length,
    card: cs ? { bg: cs.backgroundColor, radius: cs.borderRadius, shadow: cs.boxShadow, pad: cs.padding } : null,
    rowBorders: rows.slice(0, 2).map((row) => getComputedStyle(row).borderTopWidth),
    newButtons: [...document.querySelectorAll('a,button')].filter((el) => el.textContent.includes('새 운영문의')).length,
  };
}

const browser = await chromium.launch({ headless: true });
const report = [];

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, name), fullPage: false });
}

const cases = [
  ['review-empty', 'study_room_owner', '/mypage/student-review', {}],
  ['review-filled', 'study_room_owner', '/mypage/student-review', { reviews: true }],
  ['review-parent', 'guardian_student', '/mypage/student-review', {}],
  ['contact-empty', 'guardian_student', '/mypage/contact', {}],
  ['contact-filled', 'guardian_student', '/mypage/contact', { tickets: true }],
  ['account', 'guardian_student', '/mypage/account', {}],
];

for (const [name, role, path, opts] of cases) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await install(page, role, opts);
  await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const data = await page.evaluate(cardInfo);
  if (name === 'account') {
    data.hero = await page.evaluate(() => {
      const hero = document.querySelector('.account-settings__hero');
      const nameEl = document.querySelector('.account-settings__name');
      const title = document.querySelector('.account-card__title');
      const hs = hero ? getComputedStyle(hero) : null;
      const after = hero ? getComputedStyle(hero, '::after').content : null;
      return {
        bg: hs?.backgroundImage,
        shadow: hs?.boxShadow,
        radius: hs?.borderRadius,
        nameSize: nameEl ? getComputedStyle(nameEl).fontSize : null,
        titleSize: title ? getComputedStyle(title).fontSize : null,
        after,
        gradient: hs ? /gradient/.test(hs.backgroundImage) : null,
      };
    });
    await page.click('[data-action="toggle-display-name"]');
    await page.waitForTimeout(200);
    data.input = await page.evaluate(() => {
      const input = document.querySelector('#mypage-display-name');
      if (!input) return null;
      const s = getComputedStyle(input);
      return { h: s.height, radius: s.borderRadius, border: s.borderTopColor, size: s.fontSize };
    });
  }
  await shot(page, `${name}.png`);
  await page.close();
  report.push({ name, ...data });
}

for (const [name, role, path] of [
  ['tabs-room', 'study_room_owner', '/mypage/registrations/study-rooms'],
  ['tabs-tutor', 'tutor', '/mypage/registrations/tutors'],
]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await install(page, role, {});
  await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const tabs = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.mp-room__tab')];
    return els.map((el) => {
      const s = getComputedStyle(el);
      return { text: el.textContent.trim(), size: s.fontSize, pad: s.padding, weight: s.fontWeight, color: s.color, active: el.classList.contains('is-active') };
    });
  });
  const gap = await page.evaluate(() => {
    const room = document.querySelector('.mp-room');
    return room ? getComputedStyle(room).gap : null;
  });
  await shot(page, `${name}.png`);
  await page.close();
  report.push({ name, gap, tabs });
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
