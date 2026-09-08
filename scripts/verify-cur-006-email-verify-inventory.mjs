/**
 * CUR-006 · email_verified_at 갱신 경로 + 세션 보호 API 전수검색
 * 실메일/배포 없음. 누락(보호 후보인데 게이트 없음)을 FAIL로 보고한다.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
let failed = 0;
let passed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    passed += 1;
    console.log('PASS:', msg);
  }
}

function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'vendor') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

function read(abs) {
  return readFileSync(abs, 'utf8');
}

const codeFiles = walk(join(root, 'src'), (p) => p.endsWith('.php'))
  .concat(walk(join(root, 'public/api'), (p) => p.endsWith('.php')))
  .concat(walk(join(root, 'sql'), (p) => p.endsWith('.sql')));

/** @type {Array<{file:string,kind:string,snippet:string}>} */
const writePaths = [];

for (const abs of codeFiles) {
  const text = read(abs);
  const rel = relative(root, abs).replace(/\\/g, '/');
  const re = /email_verified_at/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = Math.max(0, m.index - 80);
    const end = Math.min(text.length, m.index + 100);
    const window = text.slice(start, end).replace(/\s+/g, ' ');
    if (!/\b(UPDATE\s+users|INSERT\s+INTO\s+users)\b/i.test(window)) continue;
    let kind = 'other';
    if (/INSERT\s+INTO\s+users/i.test(window)) kind = 'insert';
    else if (/email_verified_at\s*=\s*NULL/i.test(window)) kind = 'clear';
    else if (/email_verified_at\s*=\s*COALESCE|email_verified_at\s*=\s*NOW/i.test(window)) kind = 'set_verified';
    else if (/SET\s+email_verified_at/i.test(window) && /NULL/i.test(window)) kind = 'clear';
    writePaths.push({ file: rel, kind, snippet: window.slice(0, 140) });
  }
}

console.log('\n=== email_verified_at 갱신 경로 ===');
const uniqWrites = [];
const seen = new Set();
for (const w of writePaths) {
  const key = `${w.file}|${w.kind}`;
  if (seen.has(key)) continue;
  seen.add(key);
  uniqWrites.push(w);
  console.log(`- [${w.kind}] ${w.file}`);
  console.log(`  ${w.snippet}`);
}

const runtimeWrites = uniqWrites.filter(
  (w) => w.file.startsWith('src/') || w.file.startsWith('public/'),
);

assert(
  runtimeWrites.some((w) => w.file.includes('EmailVerificationService') && w.kind === 'set_verified'),
  '런타임 확인 완료 경로: EmailVerificationService',
);
assert(
  runtimeWrites.some((w) => w.file.includes('EmailVerificationService') && w.kind === 'clear'),
  '런타임 clearVerifiedAt 경로',
);
assert(
  runtimeWrites.some((w) => w.file.includes('AccountWithdrawService') && w.kind === 'clear'),
  '탈퇴 시 email_verified_at NULL',
);
assert(
  runtimeWrites.some((w) => w.file.includes('OAuthService') && w.kind === 'insert'),
  'OAuth 생성 시 email_verified_at INSERT',
);
assert(
  !runtimeWrites.some((w) => w.file.includes('SignupService')),
  'SignupService는 email_verified_at을 쓰지 않음',
);

const allowedRuntime = new Set([
  'src/Auth/EmailVerificationService.php|set_verified',
  'src/Auth/EmailVerificationService.php|clear',
  'src/Auth/AccountWithdrawService.php|clear',
  'src/Auth/OAuthService.php|insert',
]);
const unexpected = runtimeWrites.filter((w) => !allowedRuntime.has(`${w.file}|${w.kind}`));
assert(
  unexpected.length === 0,
  `런타임 미등록 갱신 경로 0건 (got ${unexpected.map((u) => u.file + ':' + u.kind).join(', ') || 'none'})`,
);

const apiPhp = walk(join(root, 'public/api'), (p) => p.endsWith('.php'));
const gateMarkers = [
  'assertVerified',
  'EmailVerificationGate',
  'requireAuth(',
  'requireAdmin(',
  'requireProvider(',
  'optionalVerifiedUser',
  'optionalVerifiedAuth',
  'email_verify_required',
  'AdminApi::requireAdmin',
  'PaidApi::requireProvider',
  'PaidApi::requireAuth',
  'MessagesApi::requireAuth',
  'RegistrationApi::requireAuth',
  'HandoffApi::requireAuth',
  'BoardApi::requireAuth',
  'ProviderReviewApi::requireAuth',
];

const mustGatePatterns = [
  /basic-register\.php$/,
  /\/board\/posts\.php$/,
  /submission-attachments\.php$/,
  /board\/attachments\/token\.php$/,
  /promo-image\.php$/,
  /oauth\/complete-role\.php$/,
  /tutor\/register\.php$/,
  /study-room\/register\.php$/,
  /\/messages\//,
  /\/registrations\//,
  /\/handoff\//,
  /\/reviews\//,
  /\/paid\//,
  /\/admin\//,
];

const intentionalNoGate = [
  /\/auth\/me\.php$/,
  /\/auth\/login\.php$/,
  /\/auth\/logout\.php$/,
  /\/auth\/signup\.php$/,
  /\/auth\/email\//,
  /\/auth\/password\//,
  /\/auth\/profile\.php$/,
  /\/auth\/withdraw\.php$/,
  /\/auth\/account-contact\.php$/,
  /\/auth\/phone\//,
  /\/auth\/oauth\/(start|callback)\.php$/,
  /\/auth\/find-id\.php$/,
  /\/auth\/regions\.php$/,
  /_mail-probe\.php$/,
  /\/cron\//,
];

console.log('\n=== 세션 기반 엔드포인트 게이트 분류 ===');
const missing = [];
const gated = [];
const allowedOpen = [];
const review = [];

for (const abs of apiPhp) {
  const rel = relative(root, abs).replace(/\\/g, '/');
  const text = read(abs);
  const usesSession =
    /AuthSession::user\s*\(/.test(text) ||
    /AdminApi::requireAdmin|PaidApi::requireProvider|PaidApi::requireAuth|MessagesApi::requireAuth|RegistrationApi::requireAuth|HandoffApi::requireAuth|BoardApi::requireAuth|ProviderReviewApi::requireAuth/.test(
      text,
    );
  if (!usesSession) continue;

  const hasGate = gateMarkers.some((g) => text.includes(g));
  const must = mustGatePatterns.some((re) => re.test(rel));
  const intentional = intentionalNoGate.some((re) => re.test(rel));

  if (hasGate) {
    gated.push(rel);
    console.log(`GATED  ${rel}`);
  } else if (intentional) {
    allowedOpen.push(rel);
    console.log(`OPEN*  ${rel} (의도적 허용)`);
  } else if (must) {
    missing.push(rel);
    console.log(`MISS   ${rel}`);
  } else {
    review.push(rel);
    console.log(`REVIEW ${rel}`);
  }
}

assert(missing.length === 0, `보호 API 게이트 누락 0건 (got ${missing.join(', ') || 'none'})`);
assert(gated.length >= 25, `게이트 적용 엔드포인트 충분 (${gated.length})`);
assert(review.length === 0, `미분류 세션 엔드포인트 0건 (got ${review.join(', ') || 'none'})`);

console.log(
  `\nsummary gated=${gated.length} open_intentional=${allowedOpen.length} missing=${missing.length} review=${review.length}`,
);
console.log(`inventory writes_runtime=${runtimeWrites.length} writes_listed=${uniqWrites.length}`);

if (failed > 0) {
  console.error(`\nCUR-006 inventory FAILED passed=${passed} failed=${failed}`);
  process.exit(1);
}
console.log(`\nCUR-006 inventory OK passed=${passed}`);
