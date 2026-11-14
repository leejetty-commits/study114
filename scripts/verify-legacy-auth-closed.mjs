/**
 * sec H2 — 옛 PHP 로그인·로그아웃·찾기 주소가 index.php로 열리지 않는지 본다.
 * 실행: node scripts/verify-legacy-auth-closed.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
const web = readFileSync(join(root, 'src/routes/web.php'), 'utf8');

const checks = [];

function check(name, ok) {
  checks.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

check(
  'htaccess: auth/(login|logout|find-id|find-password) → index.php 규칙 없음',
  !/auth\/\(login\|logout\|find-id\|find-password\).*index\.php/.test(htaccess),
);

const redirects = [
  ['login', '/auth/#/login'],
  ['logout', '/auth/#/login'],
  ['find-id', '/auth/#/find-id'],
  ['find-password', '/auth/#/find-password'],
];

for (const [path, target] of redirects) {
  const rule = new RegExp(
    `^[ \\t]*RewriteRule \\^auth/${path}/\\?\\$ ${target.replaceAll('/', '\\/')} \\[R=302,NE,L\\]`,
    'm',
  );
  check(`htaccess: /auth/${path} → 302 ${target}`, rule.test(htaccess));
}

check("web.php: post('/auth/login' 없음", !web.includes("post('/auth/login'"));
check("web.php: '/auth/logout' 없음", !web.includes("'/auth/logout'"));
check("web.php: get('/auth/login' 없음", !web.includes("get('/auth/login'"));
check("web.php: get('/auth/find-id' 없음", !web.includes("get('/auth/find-id'"));
check("web.php: get('/auth/find-password' 없음", !web.includes("get('/auth/find-password'"));

const failed = checks.filter((ok) => !ok).length;
const passed = checks.length - failed;
console.log(`${passed} PASS, ${failed} FAIL, ${checks.length} total`);
process.exit(failed === 0 ? 0 : 1);
