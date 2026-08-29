/**
 * 로컬 Docker 백엔드(http://127.0.0.1:8080)에 실제 세션을 붙여 Board ACL 을 검사한다.
 * 운영 DB·닷홈 서버에는 접속하지 않는다. STUDY114_API_BASE 로만 대상을 바꾼다.
 *
 * Usage: node scripts/verify-board-acl-live.mjs
 */
import { execFileSync } from 'node:child_process';

const BASE = process.env.STUDY114_API_BASE || 'http://127.0.0.1:8080';
const DEV_PASSWORD = 'password';
const ACCOUNTS = {
  parent: 'guardian1@dev.local',
  study_room: 'room-owner1@dev.local',
  tutor: 'tutor-owner1@dev.local',
  tutor2: 'tutor-owner2@dev.local',
  admin: 'ops@dev.local',
};
const CONCERNS = ['concern-parent', 'concern-director', 'concern-tutor'];

const results = [];
function record(status, name, detail = '') {
  results.push({ status, name, detail });
  const line = `${status.padEnd(4)} ${name}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
}
function check(name, cond, detail = '') {
  record(cond ? 'PASS' : 'FAIL', name, cond ? '' : detail);
}

function sql(statement) {
  return execFileSync(
    'docker',
    [
      'exec', 'study114-mysql-dev',
      'mysql', '-uroot', '-pstudy114dev', '--default-character-set=utf8mb4',
      '-N', '-B', 'study114_dev', '-e', statement,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  ).trim();
}

/** 역할별 쿠키 항아리 */
class Session {
  constructor(label) {
    this.label = label;
    this.cookie = '';
  }

  async request(method, path, body) {
    const headers = {};
    if (this.cookie) headers.Cookie = this.cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      const pair = c.split(';')[0];
      const name = pair.split('=')[0];
      const rest = this.cookie
        .split('; ')
        .filter((x) => x && x.split('=')[0] !== name);
      this.cookie = [...rest, pair].join('; ');
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* HTML 오류 페이지 등 */
    }
    return { status: res.status, json, text };
  }

  get(p) {
    return this.request('GET', p);
  }

  post(p, b) {
    return this.request('POST', p, b);
  }

  del(p) {
    return this.request('DELETE', p);
  }

  async login(role) {
    const r = await this.post('/api/auth/login.php', {
      email: ACCOUNTS[role],
      password: DEV_PASSWORD,
    });
    if (r.status !== 200 || !r.json?.ok) {
      throw new Error(`login ${role} failed: ${r.status} ${r.text.slice(0, 200)}`);
    }
    return this;
  }

  logout() {
    return this.post('/api/auth/logout.php');
  }
}

const FIXTURES = {
  'concern-director': { key: 'acl-e2e-director', owner: 1, role: 'study_room' },
  'concern-tutor': { key: 'acl-e2e-tutor', owner: 4, role: 'tutor' },
  'concern-parent': { key: 'acl-e2e-parent', owner: 6, role: 'parent' },
};
const SECRET_TITLE = 'ACL-E2E-SECRET-TITLE';
// 운영 시드 행(sub-seed-*)은 건드리지 않는다. 소유자 미상 레거시 글을 직접 만든다.
const LEGACY_SUBMISSION = 'acl-e2e-legacy';

function setupFixtures() {
  for (const [board, f] of Object.entries(FIXTURES)) {
    sql(
      `DELETE FROM board_posts WHERE post_key='${f.key}';` +
        `INSERT INTO board_posts (board_key, post_key, author_user_id, author_role, status, title, description)` +
        ` VALUES ('${board}','${f.key}',${f.owner},'${f.role}','published','${SECRET_TITLE}','secret body');`,
    );
  }
  sql(
    `DELETE FROM board_posts WHERE post_key='${LEGACY_SUBMISSION}';` +
      `INSERT INTO board_posts (board_key, post_key, author_user_id, author_role, status, title, category_id, file_label)` +
      ` VALUES ('submission','${LEGACY_SUBMISSION}',NULL,'tutor','submitted','acl-e2e-legacy-post','education','legacy.pdf');`,
  );
  const legacy = sql(
    `SELECT author_user_id IS NULL FROM board_posts WHERE post_key='${LEGACY_SUBMISSION}'`,
  );
  if (legacy !== '1') {
    throw new Error(`fixture ${LEGACY_SUBMISSION} 의 author_user_id 가 NULL 이 아닙니다`);
  }
}

function teardownFixtures() {
  const keys = Object.values(FIXTURES).map((f) => `'${f.key}'`).join(',');
  sql(`DELETE FROM board_posts WHERE post_key IN (${keys}) OR post_key LIKE 'acl-e2e-%'`);
}

function introKeys(intro) {
  return Object.keys(intro ?? {}).sort().join(',');
}

async function main() {
  setupFixtures();

  // ---------- guest ----------
  const guest = new Session('guest');
  for (const key of CONCERNS.concat('concern-solved')) {
    const r = await guest.get(`/api/board/posts.php?board_key=${key}`);
    check(
      `guest ${key} — access=intro, posts=[]`,
      r.status === 200 && r.json?.access === 'intro' && Array.isArray(r.json?.posts) && r.json.posts.length === 0,
      `status=${r.status} access=${r.json?.access} posts=${r.json?.posts?.length}`,
    );
    check(
      `guest ${key} — intro 는 메뉴명만 (boardKey,level,menuLabel)`,
      r.json?.intro?.level === 'menu_only' && introKeys(r.json?.intro) === 'boardKey,level,menuLabel',
      `level=${r.json?.intro?.level} keys=${introKeys(r.json?.intro)}`,
    );
    check(
      `guest ${key} — 응답 전체에 게시글 제목 없음`,
      !JSON.stringify(r.json).includes(SECRET_TITLE),
    );
  }
  {
    const r = await guest.get('/api/board/posts.php?board_key=concern-family');
    check(
      'guest concern-family — concern-parent 로 정규화',
      r.json?.access === 'intro' && r.json?.intro?.boardKey === 'concern-parent',
      `boardKey=${r.json?.intro?.boardKey}`,
    );
  }
  {
    const r = await guest.post('/api/board/posts.php', {
      board_key: 'concern-parent',
      title: 'guest-should-fail',
    });
    check('guest 고민방 글쓰기 차단', r.status === 401 || r.status === 403, `status=${r.status}`);
  }
  {
    const r = await guest.get('/api/board/posts.php?board_key=submission');
    check('guest submission 차단', r.status === 401 || r.status === 403, `status=${r.status}`);
  }

  // ---------- 학생·학부모 ----------
  const parent = await new Session('parent').login('parent');
  {
    const r = await parent.get('/api/board/posts.php?board_key=concern-parent');
    check(
      'parent 자기 고민방 읽기',
      r.json?.access === 'full' && JSON.stringify(r.json.posts).includes(SECRET_TITLE),
      `access=${r.json?.access}`,
    );
  }
  for (const key of ['concern-director', 'concern-tutor']) {
    const r = await parent.get(`/api/board/posts.php?board_key=${key}`);
    check(
      `parent ${key} 목록 차단`,
      r.json?.access === 'intro' && r.json.posts.length === 0 && !JSON.stringify(r.json).includes(SECRET_TITLE),
      `access=${r.json?.access} posts=${r.json?.posts?.length}`,
    );
    check(
      `parent ${key} intro 는 소개문까지 (level=intro)`,
      r.json?.intro?.level === 'intro' && Boolean(r.json?.intro?.body),
      `level=${r.json?.intro?.level}`,
    );
  }
  // 단건 우회
  {
    const dirKey = FIXTURES['concern-director'].key;
    const dirId = sql(`SELECT id FROM board_posts WHERE post_key='${dirKey}'`);
    for (const q of [`id=${dirId}`, `post_key=${dirKey}`, `id=${dirId}&post_key=${dirKey}`]) {
      const r = await parent.get(`/api/board/posts.php?board_key=concern-director&${q}`);
      check(
        `parent 단건 우회 차단 (${q})`,
        r.json?.access === 'intro' && r.json.posts.length === 0 && !JSON.stringify(r.json).includes(SECRET_TITLE),
        `access=${r.json?.access} posts=${r.json?.posts?.length}`,
      );
    }
    // board_key 를 자기 채널로 위장하고 남의 글 id 조회
    const r = await parent.get(`/api/board/posts.php?board_key=concern-parent&id=${dirId}`);
    check(
      'parent board_key 위장 단건 조회로 남의 글 못 봄',
      !JSON.stringify(r.json).includes('secret body'),
      JSON.stringify(r.json).slice(0, 120),
    );
  }

  // ---------- 공부방 ----------
  const room = await new Session('study_room').login('study_room');
  for (const key of CONCERNS) {
    const r = await room.get(`/api/board/posts.php?board_key=${key}`);
    check(`study_room ${key} 읽기 가능`, r.json?.access === 'full', `access=${r.json?.access}`);
  }
  for (const key of ['concern-parent', 'concern-tutor']) {
    const r = await room.post('/api/board/posts.php', { board_key: key, title: 'x' });
    check(`study_room ${key} 글쓰기 403`, r.status === 403, `status=${r.status}`);
  }
  {
    const r = await room.post('/api/board/posts.php', { board_key: 'concern-director', title: 'x' });
    check(
      'study_room concern-director 는 ACL 통과 (미구현 오류로 떨어짐)',
      r.status !== 403 && r.status !== 401,
      `status=${r.status}`,
    );
  }
  {
    const r = await room.post('/api/board/posts.php', {
      board_key: 'submission',
      title: 'x',
      category_id: 'other',
      file_label: 'x.pdf',
    });
    check('study_room submission 글쓰기 403', r.status === 403, `status=${r.status}`);
  }

  // ---------- 과외쌤 ----------
  const tutor = await new Session('tutor').login('tutor');
  for (const key of CONCERNS) {
    const r = await tutor.get(`/api/board/posts.php?board_key=${key}`);
    check(`tutor ${key} 읽기 가능`, r.json?.access === 'full', `access=${r.json?.access}`);
  }
  for (const key of ['concern-parent', 'concern-director']) {
    const r = await tutor.post('/api/board/posts.php', { board_key: key, title: 'x' });
    check(`tutor ${key} 글쓰기 403`, r.status === 403, `status=${r.status}`);
  }
  {
    const r = await tutor.post('/api/board/posts.php', { board_key: 'concern-tutor', title: 'x' });
    check(
      'tutor concern-tutor 는 ACL 통과 (미구현 오류로 떨어짐)',
      r.status !== 403 && r.status !== 401,
      `status=${r.status}`,
    );
  }

  // ---------- IDOR: 요청 boardKey 위장 ----------
  const dirPostKey = FIXTURES['concern-director'].key;
  {
    const r = await tutor.post('/api/board/posts.php', {
      board_key: 'concern-tutor',
      post_key: dirPostKey,
      title: 'moved-by-idor',
    });
    check('IDOR 수정 — 요청 boardKey 위장 403', r.status === 403, `status=${r.status}`);
    const actual = sql(`SELECT board_key FROM board_posts WHERE post_key='${dirPostKey}'`);
    check('IDOR 수정 후 실제 채널 불변', actual === 'concern-director', `board_key=${actual}`);
  }
  {
    const r = await tutor.del(
      `/api/board/posts.php?board_key=concern-tutor&post_key=${dirPostKey}&author_role=tutor`,
    );
    check('IDOR 삭제 — 요청 boardKey 위장 403', r.status === 403, `status=${r.status}`);
    const still = sql(`SELECT COUNT(*) FROM board_posts WHERE post_key='${dirPostKey}'`);
    check('IDOR 삭제 후 행 유지', still === '1', `count=${still}`);
  }

  // ---------- submission 소유권 (다른 과외쌤) ----------
  const tutor2 = await new Session('tutor2').login('tutor2');
  const owned = await tutor2.post('/api/board/posts.php', {
    board_key: 'submission',
    title: 'acl-e2e-owned-by-tutor2',
    category_id: 'education',
    file_label: 'acl-e2e.pdf',
    status: 'submitted',
  });
  const ownedKey = owned.json?.post?.postKey ?? owned.json?.post?.post_key ?? owned.json?.post?.id;
  check('tutor2 submission 작성 성공', owned.status === 200 && Boolean(ownedKey), `status=${owned.status}`);
  if (ownedKey) {
    const ownerId = sql(`SELECT author_user_id FROM board_posts WHERE post_key='${ownedKey}'`);
    check('신규 글에 author_user_id 기록됨', ownerId === '5', `author_user_id=${ownerId}`);

    const edit = await tutor.post('/api/board/posts.php', {
      board_key: 'submission',
      post_key: ownedKey,
      title: 'stolen',
    });
    check('다른 과외쌤 글 수정 403', edit.status === 403, `status=${edit.status}`);

    const del = await tutor.del(
      `/api/board/posts.php?board_key=submission&post_key=${ownedKey}&author_role=tutor`,
    );
    check('다른 과외쌤 글 삭제 403', del.status === 403, `status=${del.status}`);

    const token = await tutor.post('/api/board/attachments/token.php', {
      post_key: ownedKey,
      audience: 'owner',
    });
    check(
      '다른 과외쌤 submission 첨부 토큰 403',
      token.status === 403,
      `status=${token.status} ${JSON.stringify(token.json).slice(0, 120)}`,
    );

    const own = await tutor2.post('/api/board/posts.php', {
      board_key: 'submission',
      post_key: ownedKey,
      title: 'acl-e2e-owned-by-tutor2-v2',
      category_id: 'education',
      file_label: 'acl-e2e.pdf',
    });
    check('본인 글 수정은 허용', own.status === 200, `status=${own.status} ${own.text.slice(0, 140)}`);
  }

  // ---------- author_user_id 없는 레거시 글 ----------
  {
    const edit = await tutor.post('/api/board/posts.php', {
      board_key: 'submission',
      post_key: LEGACY_SUBMISSION,
      title: 'legacy-edit',
      category_id: 'education',
      file_label: 'legacy.pdf',
    });
    check('레거시(소유자 미상) 글 수정 403', edit.status === 403, `status=${edit.status}`);

    const del = await tutor.del(
      `/api/board/posts.php?board_key=submission&post_key=${LEGACY_SUBMISSION}&author_role=tutor`,
    );
    check('레거시(소유자 미상) 글 삭제 403', del.status === 403, `status=${del.status}`);

    const token = await tutor.post('/api/board/attachments/token.php', {
      post_key: LEGACY_SUBMISSION,
      audience: 'owner',
    });
    check('레거시 글 첨부 토큰 403', token.status === 403, `status=${token.status}`);

    const still = sql(`SELECT COUNT(*) FROM board_posts WHERE post_key='${LEGACY_SUBMISSION}'`);
    check('레거시 글 삭제되지 않음', still === '1', `count=${still}`);
  }

  // ---------- admin ----------
  const admin = await new Session('admin').login('admin');
  {
    // admin 은 소유권 게이트를 통과한다. 레거시 글을 실제로 삭제할 수 있는지로 확인한다.
    const del = await admin.del(
      `/api/board/posts.php?board_key=submission&post_key=${LEGACY_SUBMISSION}`,
    );
    check('admin 은 소유자 미상 레거시 글 삭제 가능', del.status === 200, `status=${del.status} ${del.text.slice(0, 140)}`);
    const gone = sql(`SELECT COUNT(*) FROM board_posts WHERE post_key='${LEGACY_SUBMISSION}'`);
    check('admin 삭제 후 행 제거됨', gone === '0', `count=${gone}`);
    for (const key of CONCERNS) {
      const r = await admin.get(`/api/board/posts.php?board_key=${key}`);
      check(`admin ${key} 읽기 가능`, r.json?.access === 'full', `access=${r.json?.access}`);
    }
  }

  // ---------- 세션 종료 후 캐시 없음 ----------
  await tutor.logout();
  {
    const r = await tutor.get('/api/board/posts.php?board_key=concern-director');
    check(
      '로그아웃 후 같은 커넥션에서 보호 글 미노출',
      r.json?.access === 'intro' && !JSON.stringify(r.json).includes(SECRET_TITLE),
      `access=${r.json?.access}`,
    );
  }

  teardownFixtures();

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  console.log(`\n${pass} PASS · ${fail} FAIL · total ${results.length}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('runner error:', e.message);
  try {
    teardownFixtures();
  } catch {
    /* ignore */
  }
  process.exitCode = 2;
});
