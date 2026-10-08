/**
 * 사이트오류-26 클라이언트 잠금.
 * 실행: preview/home-ui 에서 npx vite-node ../../scripts/verify-position-region-tier.mjs
 * PHP 회귀는 이 파일이 같이 돌린다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPickPool, getPrimeCandidatePool, getPrimeOccupied } from '../preview/home-ui/src/exposure-rules.js';
import { studyRoomHomeSearchFilters } from '../preview/home-ui/src/study-room-home-seed.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

let passed = 0;
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
    return;
  }
  failed += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

const dong = studyRoomHomeSearchFilters({ region_id: '11', region_basis_type: 'dong', complex_id: '' }, '대치동');
check('M3 동 홈 필터는 region_id 만', dong.region_id === '11' && dong.complex_id == null, JSON.stringify(dong));

const complex = studyRoomHomeSearchFilters(
  { region_id: '11', region_basis_type: 'complex', complex_id: '9' },
  '대치동',
);
check(
  'M3 단지 홈 필터는 region_id 와 complex_id',
  complex.region_id === '11' && complex.complex_id === '9',
  JSON.stringify(complex),
);

const realPool = [
  { id: 1, _realDb: true, profile_status: 'published', exposure_tier: 'prime', position_sku: null },
  { id: 2, _realDb: true, profile_status: 'published', exposure_tier: 'basic', position_sku: 'prime' },
];
const occupied = getPrimeOccupied(realPool).map((item) => item.id);
check('M3 실데이터 프라임 칸은 position_sku 만', occupied.length === 1 && occupied[0] === 2, JSON.stringify(occupied));

const tutorReal = getPrimeCandidatePool('tutor', realPool).map((item) => item.id);
check('M3 과외쌤 실데이터도 position_sku 만', tutorReal.length === 1 && tutorReal[0] === 2, JSON.stringify(tutorReal));

const unpaid = [
  { id: 3, profile_status: 'published', exposure_tier: 'prime' },
  { id: 4, profile_status: 'published', exposure_tier: 'basic' },
];
check('유료 없으면 공부방 프라임 칸 비움 (실데이터 표시 없어도)', getPrimeOccupied(unpaid).length === 0, JSON.stringify(getPrimeOccupied(unpaid)));
check('유료 없으면 과외쌤 프라임 후보 비움 (실데이터 표시 없어도)', getPrimeCandidatePool('tutor', unpaid).length === 0, JSON.stringify(getPrimeCandidatePool('tutor', unpaid)));
check('유료 없으면 픽 후보 비움 (실데이터 표시 없어도)', getPickPool(unpaid, []).length === 0, JSON.stringify(getPickPool(unpaid, [])));

console.log(`\nclient ${passed} PASS / ${failed} FAIL`);

const php = spawnSync(phpBin(), ['scripts/verify-position-region-tier.php'], {
  cwd: ROOT,
  encoding: 'utf8',
});
process.stdout.write(php.stdout || '');
process.stderr.write(php.stderr || '');
if (php.status !== 0) failed += 1;

process.exit(failed > 0 || php.status !== 0 ? 1 : 0);
