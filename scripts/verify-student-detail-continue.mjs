/**
 * 학생 가입완료 「상세정보 이어서 입력하기」 → 상세 폼 경로 (2026-11-13)
 * 실행: node scripts/verify-student-detail-continue.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(ROOT, 'preview/auth-ui/src/screens/signup-complete.js'), 'utf8');

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

const goDetail = src.slice(
  src.indexOf('[data-action="go-detail-register"]'),
  src.indexOf('[data-action="go-home"]'),
);

ok('학생 분기에 resolveOwnStudentId 사용', /resolveOwnStudentId\(/.test(goDetail));
ok('상세 경로 studentSectionPath(..., \'detail\') 또는 studentDetailUrl', /studentDetailUrl\(|studentSectionPath\([^,]+,\s*['"]detail['"]\)/.test(src));
ok('목록 폴백 studentListUrl 또는 registrations/students (id 없을 때)', /studentListUrl\(|mypage\/registrations\/students/.test(src));
ok('본인 학생 조회 API 폴백', /\/api\/registrations\/students\.php/.test(src));
ok('공부방 분기는 STUDY_ROOM_UI_BASE 그대로', /role === 'study_room'[\s\S]{0,120}STUDY_ROOM_UI_BASE/.test(goDetail));
ok('과외쌤 분기는 TUTOR_UI_BASE 그대로', /role === 'tutor'[\s\S]{0,120}TUTOR_UI_BASE/.test(goDetail));
ok('학생만 목록으로 바로 assign 하던 한 줄 제거', !/location\.assign\(`\$\{HOME_UI_BASE\}\/#\/mypage\/registrations\/students`\)/.test(goDetail));
ok('studentSectionPath 재사용 import', /from ['"].*student-reg\/router\.js['"]/.test(src));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
