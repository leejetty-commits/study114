import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const phase = process.argv[2] || 'main';
const port = process.argv[3] || '5183';
const outDir = process.argv[4] || 'D:/work/study114/tmp/home-b-out';
fs.mkdirSync(outDir, { recursive: true });

const CASES = [
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

function measureRail() {
  const s = document.querySelector('.live-rail-slot--best');
  if (!s) return null;
  const b = s.querySelector('.live-rail-slot__band');
  const r = b.getBoundingClientRect();
  const t = s.querySelector('.live-rail-slot__title');
  const first = document.querySelector('[data-right-rail-slot] .live-rail-slot');
  const bandCs = getComputedStyle(b);
  const titleCs = getComputedStyle(t);
  return {
    tag: b.tagName,
    bg: bandCs.backgroundColor,
    fg: titleCs.color,
    band: [Math.round(r.x), Math.round(r.width), Math.round(r.height)],
    first: first === s,
    state: s.dataset.railState,
    openKeys: [...s.querySelectorAll('[data-concern-best-open]')].map((e) => e.dataset.concernBestOpen),
    openTags: [...s.querySelectorAll('[data-concern-best-open]')].map((e) => e.tagName),
    rooms: [...document.querySelectorAll('.live-rail-slot--room .live-rail-slot__band')].map(
      (e) => getComputedStyle(e).backgroundColor,
    ),
    order: [...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')]
      .map((e) => e.className.replace(/live-rail-slot /, ''))
      .join('|'),
  };
}

function measurePop() {
  const p = document.querySelector('.rail-popup');
  if (!p) return null;
  const h = p.querySelector('.rail-popup__head');
  return {
    kind: p.dataset.railPopupKind,
    bg: h ? getComputedStyle(h).backgroundColor : null,
    text: p.innerText.slice(0, 160).replace(/\n/g, ' / '),
  };
}

function lin(c) {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function contrast(fg, bg) {
  const parse = (s) => (s.match(/\d+/g) || []).slice(0, 3).map(Number);
  const [r1, g1, b1] = parse(fg);
  const [r2, g2, b2] = parse(bg);
  if ([r1, g1, b1, r2, g2, b2].some((n) => Number.isNaN(n))) return null;
  const L1 = 0.2126 * lin(r1) + 0.7152 * lin(g1) + 0.0722 * lin(b1);
  const L2 = 0.2126 * lin(r2) + 0.7152 * lin(g2) + 0.0722 * lin(b2);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

const res = {};
const browser = await chromium.launch({ channel: 'chrome' });
for (const mode of ['empty', 'posts']) {
  for (const w of [1280, 1023, 390]) {
    for (const [name, rt, home] of CASES) {
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
      await pg.route('**/api/board/concern-hot.php*', (route) => {
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
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      });
      await pg.goto(`http://127.0.0.1:${port}/#${home}`, { waitUntil: 'domcontentloaded' });
      await pg.waitForSelector('.live-rail-slot--best', { timeout: 8000 }).catch(() => {});
      await pg.waitForTimeout(500);
      const d = { rail: await pg.evaluate(measureRail) };
      if (d.rail) d.rail.contrast = contrast(d.rail.fg, d.rail.bg);
      const sel = mode === 'empty' ? '.live-rail-slot--best .live-rail-slot__band' : '.live-rail-best__item';
      const el = pg.locator(sel).first();
      if (await el.count()) {
        await el.scrollIntoViewIfNeeded();
        await el.click();
        await pg.waitForTimeout(1000);
        d.pop = await pg.evaluate(measurePop);
        const shotBase = name === '공부방' && (w === 1280 || w === 390) && phase === 'after';
        if (shotBase && d.pop) {
          await pg.screenshot({ path: path.join(outDir, `2026-10-14-home-b-${mode}-popup-${w}-studyroom.png`) });
        }
        await pg.keyboard.press('Escape');
        await pg.waitForTimeout(300);
        if (mode === 'empty') {
          d.focusBack = await pg.evaluate(() => (document.activeElement ? document.activeElement.className : null));
          const e2 = pg.locator('.live-rail-slot--best button.live-rail-empty');
          if (await e2.count()) {
            await e2.first().focus();
            await pg.keyboard.press('Enter');
            await pg.waitForTimeout(800);
            d.enter = await pg.evaluate(measurePop);
            await pg.keyboard.press('Escape');
            await pg.waitForTimeout(300);
          }
          const band = pg.locator('.live-rail-slot--best .live-rail-slot__band');
          if (await band.count()) {
            await pg.evaluate(() => {
              const b = document.querySelector('.live-rail-slot--best .live-rail-slot__band');
              if (b && b.focus) b.focus({ focusVisible: true });
            });
            d.focusRing = await pg.evaluate(() => {
              const b = document.activeElement;
              if (!b) return null;
              const cs = getComputedStyle(b);
              return {
                className: b.className,
                focusVisible: b.matches(':focus-visible'),
                outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
              };
            });
            if (phase === 'after' && w === 1280 && name === '공부방') {
              await pg.screenshot({ path: path.join(outDir, '2026-10-14-home-b-focus-ring-1280.png') });
            }
            await pg.keyboard.press(' ');
            await pg.waitForTimeout(800);
            d.space = await pg.evaluate(measurePop);
          }
        }
      }
      res[`${mode}|${w}|${name}`] = d;
      await ctx.close();
    }
  }
}
await browser.close();
const outFile = path.join(outDir, `measure-${phase}.json`);
fs.writeFileSync(outFile, JSON.stringify(res, null, 2));
console.log('wrote', outFile, 'keys', Object.keys(res).length);
for (const [k, v] of Object.entries(res)) {
  const r = v.rail || {};
  console.log(
    k,
    'tag',
    r.tag,
    'bg',
    r.bg,
    'fg',
    r.fg,
    'band',
    (r.band || []).join('/'),
    'first',
    r.first,
    'state',
    r.state,
    'keys',
    (r.openKeys || []).join(','),
    'rooms',
    (r.rooms || [])[0],
    'pop',
    v.pop && v.pop.bg,
    'kind',
    v.pop && v.pop.kind,
  );
}
