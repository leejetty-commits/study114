/**
 * 사이트오류-2 · 우측 레일 고민방 배너 블럭 · 역할별 노출 · 받는 중/0건/실패
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-rail-concern-banners.mjs
 *
 * (a) 게스트·공부방·과외쌤·학생 레일 방 배너 목록이 정책과 같다
 * (b) 받는 중·0건·실패에서도 방 배너·HOT·이달의 베스트 구역과 제목이 남는다
 * (c) 0건·실패 문구는 concern/copy.js CONCERN_RAIL_COPY 상수이고 right-rail.js 에 박혀 있지 않다
 * (d) 레일에 소개 카드가 없다(학생 포함), 학생 레일에 공부방·과외쌤 고민방 글이 없다
 * (e) 게스트 레일(이달의 베스트 포함)에 글 본문·작성자 필드가 그려지지 않는다
 * (f) 사이트오류-2b: 학생 레일 이달의 베스트에 공부방·과외쌤 고민방 항목이 없고, 빼고 0건이면 0건 문구. 다른 역할은 그대로
 * 사이트오류-4: 이달의 베스트는 본문 띠가 아니라 홈 레일 맨 위(방 배너 위) 구역, 방마다 1개다.
 *
 * DB·서버에 접속하지 않는다. /api/board/concern-hot.php 응답은 2b 이전 서버처럼 흉내 낸다
 * (모든 역할에 세 고민방 항목을 주고, 읽기 권한 없는 방·게스트는 제목 항목). 학생 제외는 화면 쪽만 검사한다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── 최소 브라우저 환경(document 는 두지 않는다: 레일 다시 그리기는 건너뛴다) ──
const mem = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.localStorage = globalThis.sessionStorage;
globalThis.window = globalThis;
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/guest',
    href: 'http://127.0.0.1:5174/#/guest',
    origin: 'http://127.0.0.1:5174',
    host: '127.0.0.1:5174',
    hostname: '127.0.0.1',
    protocol: 'http:',
    pathname: '/',
    search: '',
    assign() {},
    replace() {},
  },
  writable: true,
  configurable: true,
});

const ROOMS = ['concern-director', 'concern-tutor', 'concern-parent'];

/** 서버가 글을 주는 방. parentOnly·providerOnly 는 일부 방만 글이 있는 경우. */
const POSTED_ROOMS = {
  posts: ROOMS,
  parentOnly: ['concern-parent'],
  providerOnly: ['concern-director', 'concern-tutor'],
  empty: [],
  fail: [],
};

/** @type {{ role: string, mode: keyof typeof POSTED_ROOMS }} */
const server = { role: 'guest', mode: 'posts' };

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

let getBoardAccess;

function serverItem(role, boardKey, n) {
  const titlesOnly = role === 'guest' || getBoardAccess(boardKey, role).access !== 'full';
  const base = {
    id: `${boardKey}-p${n}`,
    boardKey,
    boardLabel: boardKey,
    title: `TITLE_${boardKey}_${n}`,
    type: 'worry',
    createdAt: '2026-10-01T09:00:00+09:00',
    reactionTotal: 7,
    commentCount: 1,
  };
  if (titlesOnly) {
    // 게스트 응답에 본문·작성자 값이 섞여 와도 레일은 그리지 않아야 한다.
    return role === 'guest' ? { ...base, description: `BODY_${boardKey}`, authorDisplayName: `AUTHOR_${boardKey}` } : base;
  }
  return {
    ...base,
    _numericId: 100 + n,
    description: `BODY_${boardKey}`,
    authorDisplayName: `AUTHOR_${boardKey}`,
    authorUserId: 9,
    reactions: { empathy: 3, helpful: 2, cheer: 2, score: 7 },
  };
}

globalThis.fetch = async (input) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  // 같은 레일의 정보 게시판 배너(사이트오류-3b)가 posts.php 를 읽는다. 이 검사는 고민방만 보므로 0건으로 답한다.
  if (url.pathname.endsWith('/api/board/posts.php')) return json(200, { ok: true, access: 'titles', posts: [], total: 0 });
  if (!url.pathname.endsWith('/api/board/concern-hot.php')) return json(404, { ok: false });
  if (server.mode === 'fail') return json(500, { ok: false, message: 'db down' });
  const view = url.searchParams.get('view') || 'hot';
  const { role, mode } = server;
  const posted = POSTED_ROOMS[mode];
  if (view === 'best') {
    const boards = {};
    for (const key of ROOMS) boards[key] = posted.includes(key) ? [serverItem(role, key, 9)] : [];
    return json(200, { ok: true, view, boards });
  }
  const posts = posted.flatMap((key) => [serverItem(role, key, 1), serverItem(role, key, 2)]);
  return json(200, { ok: true, view, posts });
};

const acl = await import('../preview/home-ui/src/board-channel-acl.js');
getBoardAccess = acl.getBoardAccess;
const copyMod = await import('../preview/home-ui/src/concern/copy.js');
const store = await import('../preview/home-ui/src/concern/store.js');
const rail = await import('../preview/home-ui/src/right-rail.js');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const RAIL_COPY = copyMod.CONCERN_RAIL_COPY || {};
const POLICY_COPY = {
  roomEmpty: '아직 글이 미도착중... 첫 이야기를 기다려요',
  hotEmpty: '아직 뜨거운 글이 도착하지 않았어요',
  bestEmpty: '이달의 베스트, 아직 글이 미도착중...',
  loadFailed: '글을 불러오는 중 길이 막혔어요. 잠시 후 다시 확인해 주세요',
};
const INTRO_CARD_TEXT = '이 공간의 소개만 볼 수 있어요';
const HOT_TITLE = '지금 고민 HOT';
const BEST_TITLE = '이달의 베스트';
const SEASON_TITLE = '이번 시즌 추천 행동';

const EXPECTED_ROOMS = {
  guest: ['concern-director', 'concern-tutor', 'concern-parent'],
  study_room: ['concern-director', 'concern-tutor', 'concern-parent'],
  tutor: ['concern-director', 'concern-tutor', 'concern-parent'],
  parent: ['concern-parent'],
};
const ROOM_LABEL = Object.fromEntries(ROOMS.map((key) => [key, copyMod.getConcernBoardByKey(key)?.label || key]));

/** @returns {{ room: string|null, hot: boolean, html: string }[]} */
function sections(html) {
  return String(html)
    .split('<section')
    .slice(1)
    .map((chunk) => {
      const head = chunk.slice(0, chunk.indexOf('>'));
      return {
        room: head.match(/data-rail-room="([^"]+)"/)?.[1] || null,
        hot: /data-rail-hot\b/.test(head) || chunk.includes(HOT_TITLE),
        html: chunk,
      };
    });
}

function roomBlocks(html) {
  return sections(html).filter((s) => s.room);
}

function sameSet(a, b) {
  return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
}

async function settle() {
  await Promise.all([
    store.ensureRailConcernPosts('latest'),
    store.ensureRailConcernPosts('hot'),
    store.ensureBestConcernPosts(),
  ]);
  await new Promise((r) => setTimeout(r, 0));
}

const ROLE_HOME_HASH = { guest: '#/guest', study_room: '#/study-room', tutor: '#/tutor', parent: '#/parent' };

/** 홈 레일의 「이달의 베스트」 구역(없으면 빈 값). */
function bestSection(html) {
  const found = sections(html).find((s) => /data-rail-best\b/.test(s.html.slice(0, s.html.indexOf('>'))));
  return found ? `<section${found.html}` : '';
}

function renderAll(role) {
  location.hash = ROLE_HOME_HASH[role];
  const home = rail.renderPromoWithRightRail('home_right_rail', { navRole: role });
  return {
    home,
    search: rail.renderPromoWithRightRail('search_right_rail', { navRole: role }),
    best: bestSection(home),
  };
}

/** @type {Record<string, Record<string, string[]>>} */
const exposure = {};

for (const role of Object.keys(EXPECTED_ROOMS)) {
  const expected = EXPECTED_ROOMS[role];
  exposure[role] = {};
  for (const mode of Object.keys(POSTED_ROOMS)) {
    store.resetConcernData();
    server.role = role;
    server.mode = mode;
    const loading = renderAll(role);
    await settle();
    const done = renderAll(role);
    const posted = POSTED_ROOMS[mode];

    const states = mode === 'posts' ? { loading, [mode]: done } : { [mode]: done };
    for (const [state, out] of Object.entries(states)) {
      const tag = `${role}/${state}`;
      const blocks = roomBlocks(out.home);
      const keys = blocks.map((b) => b.room);
      exposure[role][state] = keys;

      // (a) 역할별 방 배너 목록 + (b) 방 이름 제목
      ok(`a_room_blocks_${tag}`, sameSet(keys, expected), `got [${keys.join(',')}] want [${expected.join(',')}]`);
      ok(
        `b_room_titles_${tag}`,
        blocks.length > 0 && blocks.every((b) => b.html.includes(`>${ROOM_LABEL[b.room]}<`)),
        keys.join(','),
      );
      // (b) HOT·이달의 베스트 구역과 제목
      const hot = sections(out.home).find((s) => s.hot);
      ok(`b_hot_section_${tag}`, Boolean(hot && hot.html.includes(HOT_TITLE)));
      // 이달의 베스트: 레일 맨 위(첫 방 배너보다 앞)에 제목과 함께
      const bestAt = out.home.indexOf('data-rail-best');
      ok(
        `b_best_section_${tag}`,
        out.best.includes(`>${BEST_TITLE}<`) && bestAt >= 0 && bestAt < out.home.indexOf('data-rail-room='),
        `best@${bestAt}`,
      );
      // 순서: 방 배너가 「이번 시즌 추천 행동」 위
      const firstRoom = out.home.indexOf('data-rail-room=');
      const season = out.home.indexOf(SEASON_TITLE);
      ok(`order_rooms_above_season_${tag}`, firstRoom >= 0 && season > firstRoom, `room@${firstRoom} season@${season}`);

      // (d) 레일 소개 카드 없음
      ok(`d_no_intro_card_${tag}`, !out.home.includes(INTRO_CARD_TEXT) && !out.search.includes(INTRO_CARD_TEXT));
      if (role === 'parent') {
        const leaked = ['concern-director', 'concern-tutor'].filter(
          (key) => out.home.includes(`TITLE_${key}_`) || out.search.includes(`TITLE_${key}_`) || keys.includes(key),
        );
        ok(`d_student_no_provider_rooms_${tag}`, leaked.length === 0, leaked.join(','));
        // 서버가 두 방 글을 섞어 보내도(배포 전 서버·옛 응답) 학생 레일 이달의 베스트에는 그리지 않는다
        const bestLeaked = ['concern-director', 'concern-tutor'].filter((key) => out.best.includes(`TITLE_${key}_`));
        ok(`d_student_best_no_provider_rooms_${tag}`, bestLeaked.length === 0, bestLeaked.join(','));
      }
      // (e) 게스트 본문·작성자 미렌더
      if (role === 'guest') {
        const all = `${out.home}${out.search}${out.best}`;
        ok(`e_guest_no_body_author_${tag}`, !/BODY_|AUTHOR_/.test(all));
      }

      const allCopy = Object.values(POLICY_COPY);
      if (state === 'loading') {
        ok(
          `b_loading_title_only_${tag}`,
          blocks.length > 0 && blocks.every((b) => !b.html.includes('TITLE_') && !allCopy.some((c) => b.html.includes(c))),
        );
      } else if (posted.length) {
        ok(
          `posts_titles_in_own_block_${tag}`,
          blocks.length > 0 &&
            blocks.every((b) =>
              posted.includes(b.room)
                ? b.html.includes(`TITLE_${b.room}_1`) && !b.html.includes(POLICY_COPY.roomEmpty)
                : b.html.includes(POLICY_COPY.roomEmpty) && !b.html.includes('TITLE_'),
            ) &&
            blocks.every((b) => ROOMS.filter((k) => k !== b.room).every((k) => !b.html.includes(`TITLE_${k}_`))),
        );
        const hotHasRoom = expected.some((key) => posted.includes(key));
        ok(
          `posts_hot_${tag}`,
          Boolean(hot) && (hotHasRoom ? hot.html.includes('TITLE_') : hot.html.includes(POLICY_COPY.hotEmpty)),
        );
        const bestRooms = posted.filter((key) => expected.includes(key));
        const bestItems = (out.best.match(/data-concern-best-open="/g) || []).length;
        ok(
          `posts_best_cards_${tag}`,
          bestRooms.length
            ? bestRooms.every((key) => out.best.includes(`TITLE_${key}_9`)) && bestItems === bestRooms.length
            : out.best.includes(POLICY_COPY.bestEmpty) && !out.best.includes('TITLE_'),
          `rooms [${bestRooms.join(',')}] items ${bestItems}`,
        );
        if (role !== 'parent') {
          ok(
            `best_provider_rooms_kept_${tag}`,
            ['concern-director', 'concern-tutor']
              .filter((key) => posted.includes(key))
              .every((key) => out.best.includes(`TITLE_${key}_9`)),
          );
        }
      } else if (state === 'empty') {
        ok(
          `b_empty_copy_${tag}`,
          blocks.length > 0 &&
            blocks.every((b) => b.html.includes(POLICY_COPY.roomEmpty)) &&
            Boolean(hot && hot.html.includes(POLICY_COPY.hotEmpty)) &&
            out.best.includes(POLICY_COPY.bestEmpty) &&
            !`${out.home}${out.best}`.includes(POLICY_COPY.loadFailed),
        );
      } else if (state === 'fail') {
        ok(
          `b_fail_copy_${tag}`,
          blocks.length > 0 &&
            blocks.every((b) => b.html.includes(POLICY_COPY.loadFailed) && !b.html.includes(POLICY_COPY.roomEmpty)) &&
            Boolean(hot && hot.html.includes(POLICY_COPY.loadFailed) && !hot.html.includes(POLICY_COPY.hotEmpty)) &&
            out.best.includes(POLICY_COPY.loadFailed) &&
            !out.best.includes(POLICY_COPY.bestEmpty),
        );
      }

      // 찾기 레일: 슬롯에 걸린 학생/학부모 고민방 배너는 모든 역할·상태에서 남는다
      const searchKeys = roomBlocks(out.search).map((b) => b.room);
      ok(`search_parent_block_${tag}`, sameSet(searchKeys, ['concern-parent']), `got [${searchKeys.join(',')}]`);
    }
  }
}

// (c) 문구 상수
ok(
  'c_copy_constants_match_policy',
  Object.entries(POLICY_COPY).every(([k, v]) => RAIL_COPY[k] === v),
  JSON.stringify(RAIL_COPY),
);
const railSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'preview', 'home-ui', 'src', 'right-rail.js'),
  'utf8',
);
ok(
  'c_no_copy_literals_in_right_rail',
  Object.values(POLICY_COPY).every((v) => !railSrc.includes(v)) && railSrc.includes('CONCERN_RAIL_COPY'),
);

// 고민방 소스가 없는 슬롯은 방 배너 층이 없다(슬롯 정의상 의도된 숨김)
store.resetConcernData();
server.role = 'study_room';
server.mode = 'posts';
await settle();
for (const slotKey of ['detail_right_rail', 'plans_right_rail', 'support_right_rail', 'register_right_rail']) {
  const html = rail.renderPromoWithRightRail(slotKey, { navRole: 'study_room' });
  ok(`slot_without_concern_source_${slotKey}`, roomBlocks(html).length === 0);
}

store.resetConcernData();
server.role = 'study_room';
server.mode = 'posts';
await settle();
const searchAbs = rail.renderRightRailSidebar('search_right_rail', {
  navRole: 'study_room',
  linkMode: 'absolute',
  homeBase: 'http://127.0.0.1:5174',
});
const searchHot = sections(searchAbs).find((s) => s.hot);
ok(
  'm1_search_hot_inpage',
  Boolean(searchHot) &&
    searchHot.html.includes('data-concern-rail-open=') &&
    searchHot.html.includes('<button') &&
    searchHot.html.includes('data-concern-rail-leave="inpage"') &&
    !searchHot.html.includes('target="_blank"') &&
    !searchHot.html.includes('http://127.0.0.1:5174/#/community'),
  searchHot ? searchHot.html.slice(0, 240) : 'no hot',
);
ok(
  'm2_search_room_leave_inpage',
  searchAbs.includes('data-concern-rail-leave="inpage"') && !searchAbs.includes('target="_blank"'),
);
const homeAfter = rail.renderPromoWithRightRail('home_right_rail', { navRole: 'study_room' });
const homeHot = sections(homeAfter).find((s) => s.hot);
ok(
  'm4_home_hot_stays_hash',
  Boolean(homeHot) &&
    homeHot.html.includes('href="#/community') &&
    !homeHot.html.includes('target="_blank"') &&
    !homeHot.html.includes('data-concern-rail-leave="inpage"'),
);
const registerEntry = rail.renderRegisterRightRail({ navRole: 'study_room', homeBase: 'http://127.0.0.1:5174', linkMode: 'absolute' });
const tutorEntry = rail.renderRegisterRightRail({ navRole: 'tutor', homeBase: 'http://127.0.0.1:5174' });
const mypageEntry = rail.renderPromoWithRightRail('register_right_rail', { navRole: 'tutor' });
ok('m1_register_entry_draws_no_hot', !registerEntry.includes('data-rail-hot') && !tutorEntry.includes('data-rail-hot') && roomBlocks(registerEntry).length === 0);
ok(
  'm3_register_guide_inpage',
  registerEntry.includes('data-rail-guide-leave="inpage"') &&
    tutorEntry.includes('data-rail-guide-leave="inpage"') &&
    mypageEntry.includes('data-rail-guide-leave="inpage"') &&
    !registerEntry.includes('target="_blank"') &&
    !tutorEntry.includes('target="_blank"') &&
    !mypageEntry.includes('/#/guide'),
);
const detailRail = rail.renderRightRailBlock('detail_right_rail', { navRole: 'study_room' });
ok('m4_detail_guide_stays_blank', detailRail.includes('data-rail-guide-leave="blank"') && !detailRail.includes('data-rail-guide-leave="inpage"'));

console.log('\n역할별 홈 레일 방 배너(상태별):');
for (const [role, byState] of Object.entries(exposure)) {
  console.log(`  ${role.padEnd(10)} ${Object.entries(byState).map(([s, k]) => `${s}=[${k.join(',')}]`).join(' ')}`);
}

console.log(`\n${passed} passed / ${failed} failed`);
if (failed) process.exit(1);
console.log('rail-concern-banners verify ok');
