/**
 * PR-A — 프론트는 서버 카탈로그 hydrate 후 가격을 쓴다.
 * 이 스크립트는 로컬 seed가 비어 있고 만료·팩 메타가 120일/1·5·10만 남았는지 확인한다.
 * 전체 가격표는 php scripts/verify-paid-catalog.php 를 사용한다.
 * 실행: node scripts/verify-paid-pricing.mjs
 */
import {
  PLAN_CATALOG_SEED,
  PLAN_RUNTIME_DEFAULTS,
  resolveCheckoutAmount,
} from '../preview/home-ui/src/plans/runtime-config.js';

let pass = 0;
let fail = 0;
function ok(name, cond) {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}`);
  }
}

ok('seed_empty_ssot_moved_to_server', PLAN_CATALOG_SEED.length === 0);
ok('expire_days_120', PLAN_RUNTIME_DEFAULTS.credit_expire_days === 120);
ok('packs_1_5_10', JSON.stringify(PLAN_RUNTIME_DEFAULTS.message_credit_pack) === '[1,5,10]');
ok('charge_equals_sale', resolveCheckoutAmount(8000).chargeKrw === 8000);

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (fail > 0) process.exit(1);
