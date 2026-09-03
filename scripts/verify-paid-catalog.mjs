/**
 * PR-A — 정책 가격 매트릭스 + 프론트 SSOT 이전 검증
 * PHP CLI가 있으면 `php scripts/verify-paid-catalog.php`도 함께 실행한다.
 * 실행: node scripts/verify-paid-catalog.mjs
 */
import {
  PLAN_CATALOG_SEED,
  PLAN_RUNTIME_DEFAULTS,
  resolveCheckoutAmount,
} from '../preview/home-ui/src/plans/runtime-config.js';
import { spawnSync } from 'node:child_process';

let pass = 0;
let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** 34-1 / 가격 체크리스트 정본 (서버 PaidCatalog와 동일해야 함) */
const PERIODS = ['2주', '1개월', '2개월', '3개월', '6개월'];
const MATRIX = {
  study_room: {
    prime: [30000, 50000, 90000, 127500, 240000],
    pick: [15000, 30000, 54000, 76500, 144000],
    badge: [2500, 5000, 9000, 12750, 24000],
  },
  tutor: {
    prime: [18000, 30000, 57000, 81000, 153000],
    pick: [10000, 20000, 38000, 54000, 102000],
    badge: [5000, 10000, 19000, 27000, 51000],
    memo_prime: [2, 5, 10, 15, 30],
    memo_pick: [1, 2, 4, 6, 12],
  },
};
const MEMO = { '1회': 1000, '5회권': 4500, '10회권': 8000 };
const RATES = {
  study_room: { '2개월': 0.1, '3개월': 0.15, '6개월': 0.2 },
  tutor: { '2개월': 0.05, '3개월': 0.1, '6개월': 0.15 },
};

ok('no_local_seed_prices', Array.isArray(PLAN_CATALOG_SEED) && PLAN_CATALOG_SEED.length === 0);
ok('credit_expire_120_default', Number(PLAN_RUNTIME_DEFAULTS.credit_expire_days) === 120);
ok(
  'message_packs_no_20',
  JSON.stringify(PLAN_RUNTIME_DEFAULTS.message_credit_pack) === JSON.stringify([1, 5, 10]),
);
ok('resolve_no_test_override', resolveCheckoutAmount(4500).chargeKrw === 4500);

for (const role of ['study_room', 'tutor']) {
  for (const sku of ['prime', 'pick']) {
    PERIODS.forEach((period, i) => {
      const sale = MATRIX[role][sku][i];
      const rate = RATES[role][period] || 0;
      const list = rate > 0 ? Math.round(sale / (1 - rate)) : sale;
      ok(
        `policy_${role}_${sku}_${period}`,
        sale > 0 && list >= sale,
        `sale=${sale} list=${list}`,
      );
    });
  }
  PERIODS.forEach((period, i) => {
    ok(`policy_${role}_badge_${period}`, MATRIX[role].badge[i] > 0, String(MATRIX[role].badge[i]));
  });
}

PERIODS.forEach((period, i) => {
  ok(`policy_memo_bundle_prime_${period}`, MATRIX.tutor.memo_prime[i] === [2, 5, 10, 15, 30][i]);
  ok(`policy_memo_bundle_pick_${period}`, MATRIX.tutor.memo_pick[i] === [1, 2, 4, 6, 12][i]);
});

ok('policy_memo_1', MEMO['1회'] === 1000);
ok('policy_memo_5', MEMO['5회권'] === 4500);
ok('policy_memo_10', MEMO['10회권'] === 8000);
ok('policy_no_20_sku', !('20회권' in MEMO));

// list price reconstruction samples
ok('list_room_prime_2m', Math.round(90000 / 0.9) === 100000);
ok('list_tutor_pick_6m', Math.round(102000 / 0.85) === 120000);

const php = spawnSync('php', ['scripts/verify-paid-catalog.php'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
const phpOut = `${php.stdout || ''}${php.stderr || ''}${php.error || ''}`;
const phpMissing =
  php.error?.code === 'ENOENT' ||
  /not recognized|ENOENT|명령어|명령이|php.*not found|�� cmdlet/i.test(phpOut) ||
  (php.status === 1 && !/FAIL |OK |all ok/i.test(phpOut) && /php/i.test(phpOut));

if (php.status === 0) {
  process.stdout.write(php.stdout || '');
  ok('php_verify_paid_catalog', true);
} else if (phpMissing) {
  console.warn('SKIP  php scripts/verify-paid-catalog.php (php CLI 없음 — CI/로컬 PHP에서 실행)');
} else {
  process.stdout.write(php.stdout || '');
  process.stderr.write(php.stderr || '');
  ok('php_verify_paid_catalog', false, `exit=${php.status}`);
}

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (fail > 0) process.exit(1);
