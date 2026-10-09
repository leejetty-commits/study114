#!/usr/bin/env node
/**
 * 2026-10-09 무결성 점검 수정 확인 (코드 정적 검사 + 순수 함수 동작).
 * 실행: node scripts/verify-integrity-fix-20261009.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`PASS ${name}`);
  } else {
    fail += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/* 1. 없는 공부방 번호 → 「찾을 수 없습니다」 */
{
  const src = read('preview/home-ui/src/myshop/public-shell.js');
  check('공부방 상세: 찾을 수 없음 카드 문구 유지', src.includes('이 공부방 소개를 찾을 수 없습니다.'));
  check(
    '공부방 상세: 서버·예비 데이터 둘 다 없으면 로딩 문구를 없음 카드로 바꿈',
    /else if \(!fallback && mount\.querySelector\('\[data-pm-loading\]'\)\)\s*\{\s*mount\.innerHTML = renderShowcaseHtml\(null\);/.test(src),
  );
  const model = read('preview/home-ui/src/myshop/public-model.js');
  check('공부방 상세: renderShowcaseHtml(null) → toMyshopShowcaseInputs(null) = null', /toMyshopShowcaseInputs\(item\) \{\s*if \(!item\) return null;/.test(model));
}

/* 2. 고민방 목록·단건 캐시는 받은 역할과 지금 역할이 같을 때만 */
{
  const src = read('preview/home-ui/src/concern/store.js');
  check('고민방: 목록 캐시에 역할 저장', /return \{ query, role, posts, access, total, hasMore \};/.test(src));
  check('고민방: 역할 다르면 목록 캐시 무시', src.includes('if (!entry || entry.role !== getNavRole()) return null;'));
  check('고민방: 첫 페이지 요청 역할 = 캐시 역할', /const role = getNavRole\(\);\s*const data = await fetchBoardPosts\(boardKey, \{\s*navRole: role,/.test(src));
  check('고민방: 더 보기는 캐시 역할로 요청', src.includes('navRole: entry.role,'));
  check('고민방: 단건 캐시 역할 확인', src.includes('if (detail && detail.role === role) return detail;'));
  check('고민방: 단건 대신 목록에서 찾을 때도 역할 확인', src.includes('if (entry && entry.role !== role) return null;'));
  check('고민방: 저장 직후 단건 캐시에도 역할', src.includes("{ post, access: 'full', role: getNavRole() }"));
  const lines = src.split('\n').filter((l) => /_details\.set\(detailKey\(/.test(l));
  check('고민방: 단건 캐시를 넣는 곳 2곳 모두 역할 포함', lines.length === 2, `found ${lines.length}`);
}

/* 3. 고객센터 관리 화면은 관리자만 */
{
  const screens = read('preview/home-ui/src/support/screens.js');
  check('고객센터 관리: 관리자 아니면 안내 화면', screens.includes('return isAdminUser() ? renderAdminScreen(path) : renderAdminDeniedGate();'));
  check('고객센터 관리: 안내 문구', screens.includes('운영자 전용 화면이에요'));
  const index = read('preview/home-ui/src/support/index.js');
  check('고객센터 관리: 관리자 아니면 관리 화면 이벤트(목록 요청 포함) 연결 안 함', index.includes('if (isAdminSupportPath(path) && isAdminUser()) {'));
}

/* 4. 콘솔 401/403: 부트에서 운영 전체 문의 목록을 요청하지 않음 */
{
  const backend = read('preview/home-ui/src/support/support-backend.js');
  const m = backend.match(/export async function activateSupportApi\(\) \{([\s\S]*?)\n\}/);
  const body = m ? m[1] : '';
  check('문의 목록: activateSupportApi 찾음', Boolean(m));
  check('문의 목록: 부트는 공지만', body.includes('fetchNotices()') && !body.includes('fetchTickets') && !body.includes('hydrateSupportCache'));
  const php = read('public/api/support/tickets.php');
  check('서버: 조건 없는 GET 은 관리자 전용(그래서 일반 요청이 401/403)', /SupportApi::requireAdmin\(\);\s*SupportApi::ok\(\['tickets' => \$service->list\(null\)\]\);/.test(php));
  const callers = [];
  for (const f of ['preview/home-ui/src/support/admin-screens.js', 'preview/home-ui/src/support/support-backend.js']) {
    if (read(f).includes("hydrateSupportCache('')")) callers.push(f);
  }
  check('문의 목록: 전체 목록 요청은 관리자 문의 관리 화면에만', callers.length === 1 && callers[0].endsWith('admin-screens.js'), callers.join(','));
}

/* 5. 등록 화면은 자기 역할 것만 */
{
  const src = read('preview/home-ui/src/mypage/screens.js');
  check(
    '등록 화면: 역할-화면 짝 확인',
    src.includes("(r === 'parent' && studentReg) || (r === 'study_room' && studyRoomReg) || (r === 'tutor' && tutorReg)"),
  );
  check('등록 화면: 다른 역할이면 내 등록으로', /if \(!own\) \{\s*const dest = getDefaultMypagePath\(r\);/.test(src));
  const router = read('preview/home-ui/src/mypage/router.js');
  check(
    '등록 화면: 돌려보낼 곳은 항상 자기 역할 등록(무한 반복 없음)',
    /if \(role === 'study_room'\) return getStudyRoomEntryPath\(\);\s*if \(role === 'tutor'\) return getTutorEntryPath\(\);\s*return getParentStudentProfilePath\(\) \|\| '\/mypage\/registrations\/students';/.test(router),
  );
}

/* 6. 「로그인한 회원 회원에게」 */
{
  const acl = read('preview/home-ui/src/board-channel-acl.js');
  const fnSrc = acl.match(/export function boardAudienceText\(label\) \{([\s\S]*?)\n\}/);
  check('게시판 대상 문구 함수 있음', Boolean(fnSrc));
  if (fnSrc) {
    // eslint-disable-next-line no-new-func
    const boardAudienceText = new Function('label', fnSrc[1]);
    check('「로그인한 회원」 → 「로그인한 회원」', boardAudienceText('로그인한 회원') === '로그인한 회원');
    check('「과외쌤」 → 「과외쌤 회원」', boardAudienceText('과외쌤') === '과외쌤 회원');
    check('「공부방·과외쌤」 → 「공부방·과외쌤 회원」', boardAudienceText('공부방·과외쌤') === '공부방·과외쌤 회원');
  }
  const all = [acl, read('preview/home-ui/src/concern/screens.js')].join('\n');
  check('「${label} 회원에게」 직접 붙이는 곳 없음', !/allowedRolesLabel\)?\}? 회원에게/.test(all));
  check('고민방 화면이 함수를 가져옴', /import \{\s*boardAudienceText,/.test(read('preview/home-ui/src/concern/screens.js')));
}

/* 7. 탭 제목·설명에 「프리뷰」 없음 */
{
  const expect = {
    'preview/home-ui/index.html': '우동공과 — 우리동네 공부방·과외쌤',
    'preview/search-ui/index.html': '우동공과 — 공부방·과외쌤 찾기',
    'preview/auth-ui/index.html': '우동공과 — 로그인·회원가입',
    'preview/study-room-ui/index.html': '우동공과 — 공부방 등록',
    'preview/tutor-ui/index.html': '우동공과 — 과외쌤 등록',
  };
  for (const [f, title] of Object.entries(expect)) {
    const html = read(f);
    check(`탭 제목 ${f}`, html.includes(`<title>${title}</title>`));
    const head = html.split('</head>')[0];
    check(`머리말에 「프리뷰」 없음 ${f}`, !head.includes('프리뷰'));
  }
}

/* 8. 고민방 설명 단어 단위 줄바꿈 */
{
  const css = read('preview/home-ui/src/styles/home-community.css');
  check('고민방 본문 keep-all', /\.concern-frame__body \{[^}]*word-break: keep-all;[^}]*overflow-wrap: break-word;/.test(css));
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
