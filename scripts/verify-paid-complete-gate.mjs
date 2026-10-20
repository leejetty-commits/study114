/**
 * 274 — 구매 완료 잠금이 코드에 있는지 확인한다.
 * 실행: npx vite-node scripts/verify-paid-complete-gate.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
let failed = 0;

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function ok(name, cond, detail = '') {
  if (cond) {
    console.log(`OK  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

const checkout = read('public/api/paid/checkout.php');
const service = read('src/Paid/ProviderCheckoutService.php');
const screens = read('preview/home-ui/src/plans/screens.js');
const paidApi = read('preview/home-ui/src/paid-api.js');
const htaccess = read('public/.htaccess');
const gate = read('src/Paid/PaidCheckoutGate.php');
const gateFnStart = gate.indexOf('function mockCompleteAllowed');
const gateFn = gate.slice(gateFnStart, gate.indexOf('}', gateFnStart) + 1);

const completeFn = service.slice(
  service.indexOf('function completeOrder'),
  service.indexOf('function buildCompletePayload') > -1
    ? service.indexOf('private function', service.indexOf('function completeOrder') + 20)
    : service.indexOf('function completeOrder') + 800,
);
const fulfillAt = service.indexOf('function fulfill');
const fulfillComment = service.slice(Math.max(0, fulfillAt - 220), fulfillAt);

ok(
  'gate_reads_getenv_only',
  gateFn.includes("getenv('STUDY114_PAID_MOCK_COMPLETE') === '1'") &&
    !gateFn.includes('$_ENV') &&
    !gateFn.includes('$_SERVER') &&
    !gateFn.includes('study114_env'),
);
ok(
  'checkout_checks_before_complete',
  checkout.includes('PaidCheckoutGate::mockCompleteAllowed()') &&
    checkout.indexOf('PaidCheckoutGate::mockCompleteAllowed()') < checkout.indexOf('completeOrder(') &&
    checkout.includes("PaidApi::fail(403, 'payment_not_available'"),
);
ok(
  'complete_order_checks_before_transaction',
  completeFn.includes('PaidCheckoutGate::mockCompleteAllowed()') &&
    completeFn.indexOf('PaidCheckoutGate::mockCompleteAllowed()') < completeFn.indexOf('beginTransaction()'),
);
ok(
  'fulfill_comment',
  fulfillComment.includes('PaidCheckoutGate::mockCompleteAllowed()'),
);

const notice = '결제 기능을 준비하고 있어요. 곧 열릴 예정이에요';
const unavailableStart = screens.indexOf("result.status === 'unavailable'");
const unavailableEnd = screens.indexOf('const ok = result.status', unavailableStart);
const unavailable = unavailableStart >= 0 ? screens.slice(unavailableStart, unavailableEnd) : '';
ok('result_notice', unavailable.includes(notice) && unavailable.includes('유료상품으로 돌아가기'));
ok(
  'result_hides_dev_terms',
  unavailable !== '' &&
    !unavailable.includes('orderRef') &&
    !unavailable.includes('order_ref') &&
    !/pending|mock/i.test(unavailable),
);

const rejectStart = screens.indexOf("err.code === 'payment_not_available'");
const rejectEnd = screens.indexOf('const msg = err instanceof Error', rejectStart);
const rejectBranch = rejectStart >= 0 ? screens.slice(rejectStart, rejectEnd) : '';
ok('reject_sets_notice', rejectBranch.includes(notice) && rejectBranch.includes("status: 'unavailable'"));
ok('reject_skips_history', rejectBranch !== '' && !rejectBranch.includes('appendHistoryRow'));

const completeClient = paidApi.slice(paidApi.indexOf('function completePaidCheckout'), paidApi.indexOf('function fetchPaidHistory'));
ok(
  'client_marks_payment_not_available',
  completeClient.includes("err.code === 'payment_not_available'") && completeClient.includes("err.code = 'payment_not_available'"),
);
ok('htaccess_has_no_flag', !htaccess.includes('STUDY114_PAID_MOCK_COMPLETE'));

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\npaid complete gate ok');
