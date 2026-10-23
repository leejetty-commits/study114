/**
 * 사이트오류-9 시나리오 드라이버. node tmp/siteerr9/run.mjs → tmp/siteerr9/repro-output.txt
 * page.mjs 한 번 = 새로고침 1회. localStorage 는 tmp/siteerr9/ls-*.json 으로 이어진다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const DIR = import.meta.dirname;
const OUT = path.join(DIR, 'repro-output.txt');
const lines = [];
const say = (s) => { lines.push(s); process.stdout.write(s + '\n'); };

function lsFile(name, seed) {
  const f = path.join(DIR, `ls-${name}.json`);
  fs.writeFileSync(f, JSON.stringify(seed || {}));
  return f;
}
function load(f, label, page, ...tabs) {
  say(`-- ${label}`);
  const r = execFileSync(process.execPath, [path.join(DIR, 'page.mjs'), f, page, ...tabs], { encoding: 'utf8' });
  say(r.trimEnd());
}
const canon = (o) => ({ regionKey: '', regionId: null, lat: null, lng: null, apartmentName: '', axis: 'room', level: 'dong', ...o });

say('==== S0 localStorage 비어 있음 · 과외 분기 학생 로그인 ====');
let f = lsFile('S0');
load(f, '#/parent 첫 진입(공부방→과외쌤→학생 탭)', 'home');
load(f, '새로고침 → 공부방 찾기', 'search', 'room');
load(f, '새로고침 → 과외쌤 찾기', 'search', 'tutor');
load(f, '새로고침 → 학생 찾기', 'search', 'student');

say('\n==== S1 가입완료 go-home (signup-complete.js:320-323): lastRegionByHope.tutor = 지역선택기 라벨 ====');
f = lsFile('S1', { 'study114.studentFind.lastRegionByHope': JSON.stringify({ tutor: '경기도 의정부시' }) });
load(f, '#/parent 첫 진입', 'home');
say('   (마이페이지 기본 폼에서 도봉구 저장: student-reg/screens.js:601 은 detail 폼만 LS 갱신 → LS 변화 없음)');
load(f, '새로고침 → #/parent', 'home');
load(f, '새로고침 → 학생 찾기', 'search', 'student');
load(f, '새로고침 → 과외쌤 찾기', 'search', 'tutor');

say('\n==== S2 lastRegionByHope.tutor = "424" (search-find-surface.js:2070 이 지역선택기 변경 시 id 를 저장) ====');
f = lsFile('S2', { 'study114.studentFind.lastRegionByHope': JSON.stringify({ tutor: '424' }) });
load(f, '#/parent', 'home');
load(f, '새로고침 → 학생 찾기 → (SPA) 공부방 찾기 → (SPA) 과외쌤 찾기', 'search', 'student', 'room', 'tutor');
load(f, '새로고침 → 공부방 찾기', 'search', 'room');
load(f, '새로고침 → 과외쌤 찾기', 'search', 'tutor');

say('\n==== S3 공부방 찾기 주소찾기(카카오 result.sido="경기") 직후 상태 (search-find-surface.js:2193-2220) ====');
f = lsFile('S3', {
  'study114.studentFind.lastRegionByHope': JSON.stringify({ tutor: '424', study_room: '경기 의정부시 신곡동' }),
  'study114-find-canonical-v1': JSON.stringify({ room: canon({ displayLabel: '경기 의정부시 신곡동', regionKey: '경기|의정부시|신곡동', city: '경기', district: '의정부시', dong: '신곡동', source: 'address' }) }),
});
load(f, '새로고침 → 공부방 찾기 → (SPA) 과외쌤 찾기', 'search', 'room', 'tutor');
load(f, '새로고침 → 과외쌤 찾기 (DB 는 도봉구)', 'search', 'tutor');
load(f, '새로고침 → 학생 찾기 → (SPA) 공부방 찾기', 'search', 'student', 'room');
load(f, '새로고침 → #/parent', 'home');

say('\n==== S4 GPS 부팅(search-find-surface.js:770-773, 네이버 area1="경기도") 로 canonical.room 이 생긴 상태 ====');
f = lsFile('S4', {
  'study114.studentFind.lastRegionByHope': JSON.stringify({ study_room: '경기도 의정부시 신곡동' }),
  'study114-find-canonical-v1': JSON.stringify({ room: canon({ displayLabel: '경기도 의정부시 신곡동', city: '경기도', district: '의정부시', dong: '신곡동', source: 'gps' }) }),
});
load(f, '새로고침 → 공부방 찾기 → (SPA) 과외쌤 찾기 → (SPA) 학생 찾기', 'search', 'room', 'tutor', 'student');
load(f, '새로고침 → 공부방 찾기', 'search', 'room');

say('\n==== S6 「신곡동 ↔ 가끔 424」 교대: lastRegionByHope={tutor:424, study_room:경기 의정부시 신곡동}, canonical 없음 ====');
f = lsFile('S6', { 'study114.studentFind.lastRegionByHope': JSON.stringify({ tutor: '424', study_room: '경기 의정부시 신곡동' }) });
load(f, '새로고침 → 공부방 찾기', 'search', 'room');
load(f, '새로고침 → 학생 찾기 → (SPA) 공부방 찾기', 'search', 'student', 'room');
load(f, '새로고침 → 공부방 찾기', 'search', 'room');
load(f, '새로고침 → #/parent (홈 방문)', 'home');
load(f, '새로고침 → 공부방 찾기', 'search', 'room');

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
