/**
 * JS ACL 검증 후 PHP ACL·매트릭스 비교.
 * PHP CLI가 없으면 exit 2 (미실행 ≠ 성공). CI는 setup-php 후 이 스크립트 또는 개별 명령을 사용한다.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, 'tmp');
mkdirSync(tmp, { recursive: true });

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
}

const js = run('npx', ['--yes', 'vite-node', 'scripts/verify-board-channel-acl.mjs']);
process.stdout.write(js.stdout || '');
process.stderr.write(js.stderr || '');
if (js.status !== 0) process.exit(js.status ?? 1);

const phpProbe = run('php', ['-v']);
if (phpProbe.status !== 0) {
  const status = {
    php: 'unrun',
    reason: 'php CLI not found',
    js: 'pass',
    compared: false,
  };
  writeFileSync(join(tmp, 'board-acl-php-status.json'), JSON.stringify(status, null, 2));
  console.warn('\nPHP ACL verify: 미실행 (php CLI 없음). 서버 ACL 완료로 처리하지 않음.');
  process.exit(2);
}

const php = run('php', ['scripts/verify-board-channel-acl.php']);
process.stdout.write(php.stdout || '');
process.stderr.write(php.stderr || '');
if (php.status !== 0) {
  writeFileSync(
    join(tmp, 'board-acl-php-status.json'),
    JSON.stringify({ php: 'fail', js: 'pass', compared: false }, null, 2),
  );
  process.exit(php.status ?? 1);
}

const cmp = run('node', ['scripts/compare-board-acl-matrix.mjs']);
process.stdout.write(cmp.stdout || '');
process.stderr.write(cmp.stderr || '');
const compared = cmp.status === 0;
writeFileSync(
  join(tmp, 'board-acl-php-status.json'),
  JSON.stringify({ php: 'pass', js: 'pass', compared }, null, 2),
);
if (!compared) process.exit(cmp.status ?? 1);
