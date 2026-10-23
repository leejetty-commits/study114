import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const port = process.argv[2];
const outDir = process.argv[3] || 'D:/work/study114/tmp/home-b2-out';
fs.mkdirSync(outDir, { recursive: true });

const C = [
  ['비회원', null, '/guest'],
  ['공부방', 'study_room_owner', '/study-room'],
  ['과외쌤', 'tutor', '/tutor'],
  ['학생', 'guardian_student', '/parent'],
];

function post(i, bk, r = 9) {
  return {
    id: String(i),
    title: `베스트글${i}`,
    board_key: bk,
    boardKey: bk,
    reaction_total: r,
    reactionTotal: r,
    created_at: '2026-10-01',
  };
}

function hot(route, mode) {
  const u = route.request().url();
  let body;
  if (u.includes('view=best')) {
    const boards =
      mode === 'empty'
        ? {}
        : {
            'concern-director': [post(1, 'concern-director')],
            'concern-tutor': [post(2, 'concern-tutor')],
            'concern-parent': [post(3, 'concern-parent')],
          };
    body = { ok: true, boards };
  } else {
    body = { ok: true, posts: [] };
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

function railInfo() {
  const s = document.querySelector('.live-rail-slot--best');
  if (!s) return null;
  const b = s.querySelector('.live-rail-slot__band');
  const r = b.getBoundingClientRect();
  const t = s.querySelector('.live-rail-slot__title');
  const first = document.querySelector('[data-right-rail-slot] .live-rail-slot');
  const fontOf = (e) => {
    if (!e) return null;
    const c = getComputedStyle(e);
    return [c.fontSize, c.lineHeight, c.fontWeight];
  };
  const empty = s.querySelector('.live-rail-empty');
  const roomEmpty = document.querySelector('.live-rail-slot--room .live-rail-empty');
  return {
    tag: b.tagName,
    bg: getComputedStyle(b).backgroundColor,
    fg: getComputedStyle(t).color,
    band: [Math.round(r.x), Math.round(r.width), Math.round(r.height)],
    first: first === s,
    state: s.dataset.railState,
    openKeys: [...s.querySelectorAll('[data-concern-best-open]')].map((e) => e.dataset.concernBestOpen),
    emptyFont: fontOf(empty),
    roomEmptyFont: fontOf(roomEmpty),
    rooms: [...document.querySelectorAll('.live-rail-slot--room .live-rail-slot__band')].map((e) =>
      getComputedStyle(e).backgroundColor,
    ),
    order: [...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')]
      .map((e) => e.className.replace(/live-rail-slot /, ''))
      .join('|'),
  };
}

function popInfo() {
  const p = document.querySelector('.rail-popup');
  if (!p) return null;
  const h = p.querySelector('.rail-popup__head');
  const titleEl = p.querySelector('.rail-popup__title,h2');
  const go = p.querySelector('.rail-popup__go');
  return {
    kind: p.dataset.railPopupKind,
    bg: h ? getComputedStyle(h).backgroundColor : null,
    title: titleEl ? titleEl.textContent : undefined,
    go: go ? go.getAttribute('href') : undefined,
    text: p.innerText.slice(0, 160).replace(/\n/g, ' / '),
  };
}

const res = {};
const browser = await chromium.launch({ channel: 'chrome' });
for (const mode of ['empty', 'posts']) {
  for (const w of [1280, 1023, 390]) {
    for (const [n, rt, home] of C) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 1100 } });
      const pg = await ctx.newPage();
      if (rt) {
        await pg.route('**/api/auth/me.php', (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ok: true,
              authenticated: true,
              email_verified: true,
              role_type: rt,
              user_id: 1,
              email: 't@t',
              name: 't',
              phone_verified: true,
            }),
          }),
        );
      }
      await pg.route('**/api/board/concern-hot.php*', (route) => hot(route, mode));
      const d = {};
      try {
        await pg.goto(`http://127.0.0.1:${port}/#${home}`);
        await pg.waitForTimeout(1800);
        d.rail = await pg.evaluate(railInfo);
        const sel = mode === 'empty' ? '.live-rail-slot--best .live-rail-slot__band' : '.live-rail-best__item';
        const el = pg.locator(sel).first();
        if (await el.count()) {
          await el.scrollIntoViewIfNeeded();
          await el.click();
          await pg.waitForTimeout(1000);
          d.pop = await pg.evaluate(popInfo);
          if (w === 1280 && n === '공부방') {
            await pg.screenshot({ path: path.join(outDir, `b2-${port}-${mode}.png`) });
          }
          if (mode === 'empty' && n === '공부방' && (w === 1280 || w === 390)) {
            const popup = pg.locator('.rail-popup');
            if (await popup.count()) {
              await popup.screenshot({ path: path.join(outDir, `empty-popup-${w}.png`) });
            }
          }
          if (mode === 'posts' && n === '공부방' && w === 1280) {
            const popup = pg.locator('.rail-popup');
            if (await popup.count()) {
              await popup.screenshot({ path: path.join(outDir, 'posts-popup-1280.png') });
            }
          }
          if (mode === 'empty' && n === '공부방' && w === 1280) {
            const empty = pg.locator('.live-rail-slot--best .live-rail-empty');
            if (await empty.count()) {
              await empty.screenshot({ path: path.join(outDir, 'empty-font-1280.png') });
            }
          }
          await pg.keyboard.press('Escape');
          await pg.waitForTimeout(300);
          if (mode === 'empty') {
            d.focusBack = await pg.evaluate(() => document.activeElement && document.activeElement.className);
            const e2 = pg.locator('.live-rail-slot--best button.live-rail-empty');
            if (await e2.count()) {
              await e2.first().focus();
              await pg.keyboard.press('Enter');
              await pg.waitForTimeout(800);
              d.enter = await pg.evaluate(popInfo);
              await pg.keyboard.press('Escape');
              await pg.waitForTimeout(300);
            }
            const b = pg.locator('.live-rail-slot--best .live-rail-slot__band');
            await b.first().focus();
            await pg.keyboard.press(' ');
            await pg.waitForTimeout(800);
            d.space = await pg.evaluate(popInfo);
          }
        }
      } catch (err) {
        d.error = String(err && err.message ? err.message : err);
      }
      res[`${mode}|${w}|${n}`] = d;
      console.log(`${mode}|${w}|${n}`, JSON.stringify(d).slice(0, 420));
      await ctx.close();
    }
  }
}
await browser.close();
const out = path.join(outDir, `b2-${port}.json`);
fs.writeFileSync(out, JSON.stringify(res));
console.log('WROTE', out);
