/**
 * 326 — 결제내역 UI 탭·확장행·환불 흐름 verify (정적 검증)
 * 실행: node scripts/verify-refund-history-ui.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const exists = (rel) => existsSync(join(ROOT, rel));

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  let value = cond;
  try {
    value = typeof cond === 'function' ? cond() : cond;
  } catch (e) {
    value = false;
    detail = `${detail} threw ${e?.message || e}`.trim();
  }
  if (value) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const screens = exists('preview/home-ui/src/plans/screens.js') ? read('preview/home-ui/src/plans/screens.js') : '';
const paidApi = exists('preview/home-ui/src/paid-api.js') ? read('preview/home-ui/src/paid-api.js') : '';
const histMock = exists('preview/home-ui/src/plans/history-mock.js') ? read('preview/home-ui/src/plans/history-mock.js') : '';
const copy = exists('preview/home-ui/src/mypage/mypage-copy.js') ? read('preview/home-ui/src/mypage/mypage-copy.js') : '';

/* ── A. 탭 UI 구조 ──────────────────────────────────── */

ok('A1 탭 역할(role=tablist)', screens.includes('role="tablist"'));
ok('A2 탭 data 속성', screens.includes('data-history-tab="count"') && screens.includes('data-history-tab="position"'));
ok('A3 탭 aria-selected', screens.includes('aria-selected'));
ok('A4 tabpanel', screens.includes('role="tabpanel"'));

/* ── B. 확장행 구조 ──────────────────────────────────── */

ok('B1 확장 토글 속성', screens.includes('data-history-expand'));
ok('B2 확장 행 클래스', screens.includes('history-expand-row'));
ok('B3 is-expanded 클래스', screens.includes('is-expanded'));
ok('B4 renderExpandedRow 함수', screens.includes('function renderExpandedRow'));
ok('B5 renderHistoryRow 함수', screens.includes('function renderHistoryRow'));

/* ── C. 환불 액션 박스 ───────────────────────────────── */

ok('C1 refund-action-box 클래스', screens.includes('refund-action-box'));
ok('C2 환불 신청 버튼', screens.includes('data-refund-submit'));
ok('C3 환불 철회 버튼', screens.includes('data-refund-withdraw'));
ok('C4 환불 사유 select', screens.includes('data-refund-reason-select'));
ok('C5 환불 상세 input', screens.includes('data-refund-detail'));
ok('C6 환불예정액 표시', screens.includes('환불 예정액'));

/* ── D. 이벤트 바인딩 ────────────────────────────────── */

ok('D1 탭 click 바인딩', screens.includes("[data-history-tab]") && screens.includes('addEventListener'));
ok('D2 확장 click 바인딩', screens.includes("[data-history-expand]"));
ok('D3 submitRefund 호출', screens.includes('submitRefund'));
ok('D4 withdrawRefund 호출', screens.includes('withdrawRefund'));
ok('D5 fetchRefundEligibility 호출', screens.includes('fetchRefundEligibility'));

/* ── E. 캐시 무효화 흐름 ─────────────────────────────── */

ok('E1 submit 후 historyCache.loaded=false', () => {
  const idx = screens.indexOf('await submitRefund');
  const after = screens.slice(idx, idx + 500);
  return after.includes('historyCache.loaded = false');
});
ok('E2 withdraw 후 historyCache.loaded=false', () => {
  const idx = screens.indexOf('await withdrawRefund');
  const after = screens.slice(idx, idx + 500);
  return after.includes('historyCache.loaded = false');
});
ok('E3 submit 후 loadHistoryRows 재호출', () => {
  const idx = screens.indexOf('await submitRefund');
  const after = screens.slice(idx, idx + 700);
  return after.includes('loadHistoryRows()');
});

/* ── F. import 검증 ──────────────────────────────────── */

ok('F1 screens.js imports fetchRefundEligibility', screens.includes('fetchRefundEligibility'));
ok('F2 screens.js imports submitRefund', screens.includes('submitRefund'));
ok('F3 screens.js imports withdrawRefund', screens.includes('withdrawRefund'));
ok('F4 screens.js imports REFUND_REASON_CHOICES', screens.includes('REFUND_REASON_CHOICES'));
ok('F5 screens.js imports REFUND_COPY', screens.includes('REFUND_COPY'));
ok('F6 screens.js imports invalidateHistoryCache', screens.includes('invalidateHistoryCache'));

/* ── G. 제품 분류 로직 ───────────────────────────────── */

ok('G1 isCountProduct 함수', screens.includes('function isCountProduct'));
ok('G2 product_kind 체크', screens.includes("kind === 'count'") || screens.includes("=== 'count'"));
ok('G3 쪽지 regex fallback', screens.includes('/쪽지/'));
ok('G4 mock/local 행 환불 불가', () => {
  const fn = screens.slice(screens.indexOf('function renderHistoryRow'));
  return fn.includes("isFromApi") && fn.includes("r.source === 'api'");
});

/* ── H. copy 완전성 ──────────────────────────────────── */

ok('H1 REFUND_REASON_CHOICES 4개', () => {
  const m = copy.match(/REFUND_REASON_CHOICES\s*=\s*\[/);
  if (!m) return false;
  const arr = copy.slice(m.index, copy.indexOf('];', m.index) + 2);
  return (arr.match(/value:/g) || []).length >= 4;
});
ok('H2 REFUND_STATUS_LABELS 5개', () => {
  const m = copy.match(/REFUND_STATUS_LABELS\s*=\s*\{/);
  if (!m) return false;
  const obj = copy.slice(m.index, copy.indexOf('};', m.index) + 2);
  return (obj.match(/:/g) || []).length >= 5;
});
ok('H3 REFUND_COPY.confirmSubmit', copy.includes('confirmSubmit'));
ok('H4 REFUND_COPY.confirmWithdraw', copy.includes('confirmWithdraw'));
ok('H5 REFUND_COPY.frozenNote', copy.includes('frozenNote'));

/* ── I. API client 완전성 ────────────────────────────── */

ok('I1 refund endpoint 등록', paidApi.includes("refund:"));
ok('I2 fetchRefundEligibility GET', paidApi.includes('fetchRefundEligibility'));
ok('I3 submitRefund POST action=submit', paidApi.includes("action: 'submit'"));
ok('I4 withdrawRefund POST action=withdraw', paidApi.includes("action: 'withdraw'"));

/* ── J. history-mock 변경 ────────────────────────────── */

ok('J1 invalidateHistoryCache export', histMock.includes('export function invalidateHistoryCache'));
ok('J2 normalizeStatus', histMock.includes('function normalizeStatus'));
ok('J3 canceled→cancelled 정규화', histMock.includes("'canceled'") && histMock.includes("'cancelled'"));

/* ── K. 326b 본인확인 UI ─────────────────────────────── */

ok('K1 철회 확인 입력란', screens.includes('data-refund-withdraw-confirm'));
ok('K2 withdrawConfirmLabel import', screens.includes('REFUND_COPY'));
ok('K3 철회 시 confirmText 전달', () => {
  const idx = screens.indexOf('await withdrawRefund');
  const before = screens.slice(Math.max(0, idx - 300), idx + 200);
  return before.includes('confirmText') || before.includes('confirmInput');
});
ok('K4 클라이언트 사전검증', screens.includes('withdrawConfirmText'));

/* ── L. 326b 재환불 차단 표시 ────────────────────────── */

ok('L1 withdrawnNoRerefund 문구 존재', copy.includes('withdrawnNoRerefund'));
ok('L2 서버 eligible=false 시 메시지 표시', () => {
  const idx = screens.indexOf('!elig.eligible');
  if (idx < 0) return false;
  const after = screens.slice(idx, idx + 200);
  return after.includes('elig.message');
});

/* ── M. 326b a28 관리자 문구 ─────────────────────────── */

const a28Copy = exists('preview/home-ui/src/admin/a28-copy.js') ? read('preview/home-ui/src/admin/a28-copy.js') : '';
ok('M1 a28-copy A28_REFUND_LABELS', a28Copy.includes('A28_REFUND_LABELS'));
ok('M2 a28-copy 환불규정 정리', !a28Copy.includes('환불규정에 따라서'));

/* ── 결과 ────────────────────────────────────────────── */

console.log(`\n=== 326+326b verify-refund-history-ui: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
