import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const phase = process.argv[2] || 'before';
const outDir = process.argv[3] || 'D:/work/study114/tmp/home-a-out';
fs.mkdirSync(outDir, { recursive: true });

function measure() {
  const r = (s) => {
    const e = document.querySelector(s);
    return e ? e.getBoundingClientRect() : null;
  };
  const t = r('.home-promo-trio');
  const n = r('.home-news-row');
  const b = r('.provider-home-tabs');
  const cards = [...document.querySelectorAll('.home-promo-trio__card')];
  let cardGap = null;
  if (cards.length >= 2) {
    const a = cards[0].getBoundingClientRect();
    const c = cards[1].getBoundingClientRect();
    cardGap = Math.round(c.left - a.right);
    if (Math.abs(c.top - a.top) > 8) cardGap = 'stacked';
  }
  return {
    trioCount: document.querySelectorAll('.home-promo-trio').length,
    cards: cards.length,
    eyebrows: [...document.querySelectorAll('.home-promo-trio__eyebrow')].map((e) => e.textContent.trim()),
    gap1: t && n ? Math.round(n.top - t.bottom) : null,
    gap2: n && b ? Math.round(b.top - n.bottom) : null,
    hTrio: t ? Math.round(t.height) : null,
    hNews: n ? Math.round(n.height) : null,
    hTabs: b ? Math.round(b.height) : null,
    cardGap,
    hash: location.hash,
    title: document.title,
    rail: [...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')].map((s) => s.className).join('|'),
  };
}

const CASES = [
  ['guest', null, '/guest'],
  ['study-room', 'study_room_owner', '/study-room'],
  ['tutor', 'tutor', '/tutor'],
  ['parent', 'guardian_student', '/parent'],
];
const PROMO = ['/promo/study-room', '/promo/tutor', '/promo/parent'];
const WIDTHS = [1280, 1023, 390];

const rows = [];
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of WIDTHS) {
  for (const [name, rt, home] of CASES) {
    for (const routePath of [home, ...PROMO]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
      const pg = await ctx.newPage();
      const errors = [];
      pg.on('pageerror', (err) => errors.push(String(err)));
      pg.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
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
      await pg.goto('http://127.0.0.1:5179/#' + routePath, { waitUntil: 'domcontentloaded' });
      await pg.waitForSelector('.home-news-row, .promo-layout, .home-promo-trio', { timeout: 8000 }).catch(() => {});
      await pg.waitForTimeout(400);
      const measured = await pg.evaluate(measure);
      const shot =
        phase === 'after' &&
        ((routePath === home && (w === 1280 || w === 390)) || (routePath.startsWith('/promo/') && w === 1280));
      if (shot) {
        const file = `${name}${routePath === home ? '-home' : routePath.replace(/\//g, '-')}-${w}.png`;
        await pg.screenshot({ path: path.join(outDir, file) });
        measured.shot = file;
      }
      rows.push({ w, name, path: routePath, ...measured, errors });
      await ctx.close();
    }
  }
}

if (phase === 'after') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const pg = await ctx.newPage();
  await pg.route('**/api/auth/me.php', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        authenticated: true,
        email_verified: true,
        role_type: 'study_room_owner',
        user_id: 1,
        email: 't@t',
        name: 't',
        phone_verified: true,
      }),
    }),
  );
  await pg.goto('http://127.0.0.1:5179/#/promo/study-room', { waitUntil: 'domcontentloaded' });
  await pg.waitForSelector('.home-promo-trio__card', { timeout: 8000 });
  await pg.locator('.home-promo-trio__card').nth(1).click();
  await pg.waitForTimeout(600);
  const afterClick = await pg.evaluate(measure);
  rows.push({ w: 1280, name: 'click-tutor-card', path: '/promo/study-room', ...afterClick, errors: [] });
  await ctx.close();
}

await browser.close();
const outFile = path.join(outDir, `measure-${phase}.json`);
fs.writeFileSync(outFile, JSON.stringify(rows, null, 2));
console.log('wrote', outFile, 'rows', rows.length);
for (const row of rows) {
  console.log(
    [row.w, row.name, row.path, 'trio', row.trioCount, 'cards', row.cards, 'g1', row.gap1, 'g2', row.gap2, 'gapH', row.cardGap, row.hash].join(' '),
  );
}
