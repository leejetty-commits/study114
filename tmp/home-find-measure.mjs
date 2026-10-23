import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const port = process.argv[2];
const sport = process.argv[3];
const scen = process.argv[4] || 'default';
const outDir = 'D:/work/study114/tmp/home-find-out';
fs.mkdirSync(outDir, { recursive: true });

const C = [
  ['비회원', null, '/guest', '/search/room'],
  ['공부방', 'study_room_owner', '/study-room', '/search/student'],
  ['과외쌤', 'tutor', '/tutor', '/search/student'],
  ['학생', 'guardian_student', '/parent', '/search/tutor'],
];
const BK = ['concern-director', 'concern-tutor', 'concern-parent'];
const NM = { 'concern-director': '공방', 'concern-tutor': '쌤방', 'concern-parent': '학방' };

function post(i, bk, guest) {
  const p = {
    id: String(i),
    title: `${NM[bk]} 글${i}`,
    boardKey: bk,
    board_key: bk,
    reactionTotal: 9,
    reaction_total: 9,
    commentCount: 1,
    createdAt: '2026-10-01',
    authorDisplayName: '미끼작성자',
    description: '미끼본문내용',
  };
  if (!guest) p._numericId = i;
  return p;
}

async function api(route, guest) {
  const u = new URL(route.request().url());
  const acc = guest ? 'titles' : 'full';
  const pk = u.searchParams.get('post_key');
  let body;
  if (pk && u.pathname.includes('posts.php')) {
    const bk = u.searchParams.get('board_key') || u.searchParams.get('board') || 'concern-parent';
    const x = post(1, bk, guest);
    x.id = pk;
    body = { ok: true, access: acc, posts: [x], total: 1 };
  } else if (u.search.includes('view=best')) {
    const boards = {};
    BK.forEach((bk, n) => {
      boards[bk] = [post(10 + n, bk, guest)];
    });
    body = { ok: true, access: acc, boards };
  } else {
    const bk = u.searchParams.get('board') || u.searchParams.get('board_key') || u.searchParams.get('type');
    const keys = BK.includes(bk) ? [bk] : BK;
    body = {
      ok: true,
      access: acc,
      posts: keys.map((k, n) => post(20 + n, k, guest)),
      total: keys.length,
    };
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

function railInfo() {
  const r = document.querySelector('[data-right-rail-slot]') || document.querySelector('.right-rail');
  if (!r) return null;
  const vis = (e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  };
  return {
    rooms: [...r.querySelectorAll('[data-rail-room]')].filter(vis).map((e) => e.dataset.railRoom),
    best: [...r.querySelectorAll('.live-rail-best__item')].filter(vis).map((e) => e.dataset.concernBestOpen),
    order: [...r.querySelectorAll('.live-rail-slot')].map((e) => e.className.replace(/live-rail-slot /, '')).join('|'),
    text: r.innerText,
  };
}

function popInfo() {
  const p = document.querySelector('.rail-popup');
  if (!p) return null;
  return { text: p.innerText, body: !!p.querySelector('.rail-popup__body'), guest: !!p.querySelector('.rail-popup__guest') };
}

const STORED = {
  old: ['faq', 'concern-parent', 'safe-guide'],
  removed: ['faq', 'concern-director', 'concern-parent', 'safe-guide'],
  libold: ['faq', 'library-template', 'safe-guide'],
  six: ['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'library-template', 'safe-guide'],
};

const res = {};
const browser = await chromium.launch({ channel: 'chrome' });
for (const screen of ['find', 'home']) {
  for (const w of [1280, 1023, 390]) {
    for (const [n, rt, home, find] of C) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 1100 } });
      const pg = await ctx.newPage();
      if (STORED[scen]) {
        const keys = JSON.stringify(STORED[scen]);
        await pg.addInitScript(
          `sessionStorage.setItem('study114-right-rail-slot-definitions-v1', JSON.stringify([{slotKey:'search_right_rail',sourceBoardKey:'faq',sourceBoardKeys:${keys}}]))`,
        );
      }
      await pg.route('**/api/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
      );
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
      const guest = rt == null;
      await pg.route('**/api/board/concern-hot.php*', (route) => api(route, guest));
      await pg.route('**/api/board/posts.php*', (route) => api(route, guest));
      const d = {};
      try {
        const url = screen === 'find' ? `http://127.0.0.1:${sport}/#${find}` : `http://127.0.0.1:${port}/#${home}`;
        await pg.goto(url);
        await pg.waitForTimeout(2200);
        d.rail = await pg.evaluate(railInfo);
        if (screen === 'find') {
          const el = pg.locator('.live-rail-best__item').first();
          if (await el.count()) {
            await el.scrollIntoViewIfNeeded();
            await el.click({ force: true });
            await pg.waitForTimeout(1000);
            d.pop = await pg.evaluate(popInfo);
            if (w === 1280) {
              await pg.screenshot({ path: path.join(outDir, `fr-${port}-${scen}-${n}.png`) });
            }
          }
        }
        if (d.rail) d.rail.text = d.rail.text.slice(0, 600);
      } catch (err) {
        d.error = String(err && err.message ? err.message : err);
      }
      res[`${screen}|${w}|${n}`] = d;
      console.log(
        `${screen}|${w}|${n}`,
        JSON.stringify({
          rooms: (d.rail || {}).rooms,
          best: (d.rail || {}).best,
          pop: !!d.pop,
          error: d.error,
        }),
      );
      await ctx.close();
    }
  }
}
await browser.close();
const out = path.join(outDir, `fr-${port}-${scen}.json`);
fs.writeFileSync(out, JSON.stringify(res));
console.log('WROTE', out);
