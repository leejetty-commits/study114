/**
 * 계정 문맥 분리 회귀 — fallback / Hot 공유 금지
 * npm run verify:account-context
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'src/Paid/PaidBadgeRepository.php',
  'src/Paid/ProviderCheckoutService.php',
  'docs/internal/59-account-context-separation-lock.md',
];

let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

const repo = fs.readFileSync(path.join(root, files[0]), 'utf8');
const checkout = fs.readFileSync(path.join(root, files[1]), 'utf8');
const lockDoc = fs.readFileSync(path.join(root, files[2]), 'utf8');

ok('no_resolveProviderForUser', !/function resolveProviderForUser/.test(repo));
ok('no_room_first_fallback_comment', !/study_room 우선|방 우선|없으면 tutor/.test(repo + checkout));
ok('assertOwnedProvider_exists', /function assertOwnedProvider/.test(repo));
ok('checkout_requires_provider', /provider_type·provider_id가 필요합니다/.test(checkout));
ok('badge_period_same_context', /listActivePositions\(\$userId, \$providerType, \$providerId\)/.test(checkout));
ok('lock_doc_one_liner', /같은 계정이 아니다/.test(lockDoc));
ok('lock_doc_hot_independent', /Hot은 이름만 공통/.test(lockDoc) || /Hot.*독립/.test(lockDoc));
ok('schema_056_exists', fs.existsSync(path.join(root, 'sql/schema/056_provider_account_context.sql')));

const { normalizePaidBadgeCode, resolvePaidPromoBadges } = await import(
  '../preview/home-ui/src/card-visual.js'
);
ok('subject_track_not_on_tutor', normalizePaidBadgeCode('subject_track', 'tutor') === null);
ok('jjokjipge_not_on_room', normalizePaidBadgeCode('jjokjipge', 'study_room') === null);
ok(
  'hot_ok_both_types',
  normalizePaidBadgeCode('hot', 'study_room') === 'hot' && normalizePaidBadgeCode('hot', 'tutor') === 'hot',
);
ok(
  'renderer_uses_array_only',
  resolvePaidPromoBadges('study_room', { paid_badges: ['hot'] }).some((b) => b.id === 'hot') &&
    resolvePaidPromoBadges('tutor', { paid_badges: [] }).length === 0,
);

console.log(fail === 0 ? `\n${8 + 4} checks OK` : `\n${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
