/**
 * 찜 목록 = 카드 + 확대카드 (2026-10-09)
 * 실행(저장소 루트): node scripts/verify-wishlist-card-zoom.mjs   |  npm run verify:wishlist-card-zoom
 * 옛 커밋 비교:      node scripts/verify-wishlist-card-zoom.mjs --ref 90cc0f0
 *
 * (1) PHP: 찜 목록 응답에 공개 카드 필드 · 비공개 필드 없음 · 남의 찜 안 보임 · 숨김/탈퇴/삭제는 상태만
 *     → scripts/verify-wishlist-card-zoom.php (가짜 PDO)
 * (2) 화면: 홈·찾기 카드 캐시가 비어도 찜 카드가 그려지고, 탭하면 기존 확대카드가 뜬다
 *     → scripts/verify-wishlist-card-zoom-screen.mjs (vite-node · 가짜 fetch)
 * --ref 는 그 커밋의 src·config·preview 소스를 임시 폴더에 풀어 같은 검사를 돌린다(검사 파일은 지금 것).
 * DB·운영 서버·운영 계정에 접속하지 않는다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

const refIdx = process.argv.indexOf('--ref');
const ref = refIdx > 0 ? process.argv[refIdx + 1] || '' : '';

let srcRoot = ROOT;
let tmp = '';
if (ref) {
  tmp = mkdtempSync(join(tmpdir(), 'wishlist-card-zoom-'));
  const tarPath = join(tmp, 'ref.tar');
  const arch = spawnSync(
    'git',
    ['archive', '--format=tar', `--output=${tarPath}`, ref, 'src', 'config', 'preview'],
    { cwd: ROOT, encoding: 'utf8' },
  );
  if (arch.status !== 0) {
    console.error(`FAIL  git archive ${ref} — ${arch.stderr}`);
    process.exit(2);
  }
  const untar = spawnSync('tar', ['-xf', tarPath, '-C', tmp], { encoding: 'utf8' });
  if (untar.status !== 0) {
    console.error(`FAIL  tar -xf — ${untar.stderr}`);
    process.exit(2);
  }
  srcRoot = tmp;
  console.log(`(소스: ${ref} → ${tmp})`);
}

const env = { ...process.env, WISHLIST_VERIFY_ROOT: srcRoot };

function summary(out) {
  const m = String(out || '').match(/(\d+) PASS \/ (\d+) FAIL/);
  return m ? { pass: Number(m[1]), fail: Number(m[2]) } : { pass: 0, fail: 1 };
}

console.log('── (1) PHP 저장소/서비스 ──');
const php = spawnSync(phpBin(), [join(ROOT, 'scripts', 'verify-wishlist-card-zoom.php')], {
  cwd: ROOT,
  encoding: 'utf8',
  env,
});
process.stdout.write(php.stdout || '');
process.stderr.write(php.stderr || '');
const phpSum = summary(php.stdout);
if (php.status !== 0 && phpSum.fail === 0) phpSum.fail = 1;

console.log('\n── (2) 화면 모듈 ──');
const screen = spawnSync('npx', ['--yes', 'vite-node', join(ROOT, 'scripts', 'verify-wishlist-card-zoom-screen.mjs')], {
  cwd: join(ROOT, 'preview', 'home-ui'),
  encoding: 'utf8',
  shell: true,
  env,
  maxBuffer: 32 * 1024 * 1024,
});
process.stdout.write(screen.stdout || '');
process.stderr.write(screen.stderr || '');
const screenSum = summary(screen.stdout);
if (screen.status !== 0 && screenSum.fail === 0) screenSum.fail = 1;

if (tmp) rmSync(tmp, { recursive: true, force: true });

const pass = phpSum.pass + screenSum.pass;
const fail = phpSum.fail + screenSum.fail;
console.log(`\n${ref ? `[${ref}] ` : ''}합계 ${pass} PASS / ${fail} FAIL (php ${phpSum.pass}/${phpSum.fail} · screen ${screenSum.pass}/${screenSum.fail})`);
process.exit(fail > 0 ? 1 : 0);
