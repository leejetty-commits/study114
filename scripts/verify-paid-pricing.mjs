/**
 * 2026-08-28 유료 확정표 vs runtime-config seed
 * 실행: node scripts/verify-paid-pricing.mjs
 */
import {
  getProductConfig,
  TUTOR_POSITION_MEMO_BUNDLE,
  badgePriceKrw,
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

function option(code, role, optionId) {
  return getProductConfig(code, role)?.options?.find((o) => o.optionId === optionId);
}

ok('prime_no_2week', !option('prime', 'study_room', 'prime_14') && !option('prime', 'tutor', 'prime_14'));
ok('no_21day', !option('pick', 'study_room', 'pick_21') && !option('prime', 'study_room', 'prime_21'));
ok('no_3month', !option('pick', 'study_room', 'pick_3m') && !option('prime', 'tutor', 'prime_3m'));

ok('room_pick_2w', option('pick', 'study_room', 'pick_14')?.priceKrw === 15000);
ok('room_pick_1m', option('pick', 'study_room', 'pick_1m')?.priceKrw === 30000);
ok('room_pick_2m', option('pick', 'study_room', 'pick_2m')?.priceKrw === 55000);
ok('room_prime_1m', option('prime', 'study_room', 'prime_1m')?.priceKrw === 50000);
ok('room_prime_2m', option('prime', 'study_room', 'prime_2m')?.priceKrw === 90000);

ok('tutor_pick_2w', option('pick', 'tutor', 'pick_14')?.priceKrw === 10000);
ok('tutor_pick_1m', option('pick', 'tutor', 'pick_1m')?.priceKrw === 20000);
ok('tutor_pick_2m', option('pick', 'tutor', 'pick_2m')?.priceKrw === 35000);
ok('tutor_prime_1m', option('prime', 'tutor', 'prime_1m')?.priceKrw === 30000);
ok('tutor_prime_2m', option('prime', 'tutor', 'prime_2m')?.priceKrw === 55000);

ok('memo_5', option('memo_ticket', 'tutor', 'memo_5')?.priceKrw === 9900);
ok('memo_10', option('memo_ticket', 'tutor', 'memo_10')?.priceKrw === 17900);
ok('memo_20', option('memo_ticket', 'tutor', 'memo_20')?.priceKrw === 31900);

ok('bundle_pick', TUTOR_POSITION_MEMO_BUNDLE.pick['2주'] === 1 && TUTOR_POSITION_MEMO_BUNDLE.pick['1개월'] === 2 && TUTOR_POSITION_MEMO_BUNDLE.pick['2개월'] === 4);
ok('bundle_prime', TUTOR_POSITION_MEMO_BUNDLE.prime['1개월'] === 5 && TUTOR_POSITION_MEMO_BUNDLE.prime['2개월'] === 10);
ok('tutor_option_bundle', option('prime', 'tutor', 'prime_1m')?.memoBundle === 5);
ok('room_no_bundle', (option('prime', 'study_room', 'prime_1m')?.memoBundle ?? 0) === 0);

ok('badge_room_1m', badgePriceKrw('study_room', 1) === 5000);
ok('badge_room_2m', badgePriceKrw('study_room', 2) === 10000);
ok('badge_tutor_1m', badgePriceKrw('tutor', 1) === 10000);
ok('badge_tutor_2m', badgePriceKrw('tutor', 2) === 20000);

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (fail > 0) process.exit(1);
