/**
 * 329 — 구매이력 v3 UI verify (정적 검증)
 * 실행: node scripts/verify-329-purchase-history-v3.mjs
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
const myScreens = exists('preview/home-ui/src/mypage/screens.js') ? read('preview/home-ui/src/mypage/screens.js') : '';
const css = exists('preview/home-ui/src/styles/mypage-ops.css') ? read('preview/home-ui/src/styles/mypage-ops.css') : '';
const copy = exists('preview/home-ui/src/mypage/mypage-copy.js') ? read('preview/home-ui/src/mypage/mypage-copy.js') : '';
const router = exists('preview/home-ui/src/plans/router.js') ? read('preview/home-ui/src/plans/router.js') : '';

/* ── A. v3 행 구조 ───────────────────────────────────── */

ok('A1 renderHistV3Row 함수', screens.includes('function renderHistV3Row'));
ok('A2 renderV3Panel 함수', screens.includes('function renderV3Panel'));
ok('A3 resolveV3Cells 함수', screens.includes('function resolveV3Cells'));
ok('A4 plans-hist-row 클래스', screens.includes('plans-hist-row'));
ok('A5 plans-hist-row__bar', screens.includes('plans-hist-row__bar'));
ok('A6 plans-hist-row__acts', screens.includes('plans-hist-row__acts'));
ok('A7 plans-hist-row__panel', screens.includes('plans-hist-row__panel'));
ok('A8 is-open 토글', screens.includes("is-open"));

/* ── B. v3 셀 5개 ────────────────────────────────────── */

ok('B1 내역 셀', screens.includes("cellBtn('내역'"));
ok('B2 환불 셀', screens.includes("cellBtn('환불'"));
ok('B3 진행상황 셀', screens.includes("cellBtn('진행상황'"));
ok('B4 종료 셀', screens.includes("cellBtn('종료'"));
ok('B5 소멸 셀', screens.includes("cellBtn('소멸'"));

/* ── C. 셀별 패널 ────────────────────────────────────── */

ok('C1 renderV3DetailPanel', screens.includes('function renderV3DetailPanel'));
ok('C2 renderV3RefundPanel', screens.includes('function renderV3RefundPanel'));
ok('C3 renderV3ProgressPanel', screens.includes('function renderV3ProgressPanel'));
ok('C4 renderV3EndedPanel', screens.includes('function renderV3EndedPanel'));
ok('C5 renderV3ExpiredPanel', screens.includes('function renderV3ExpiredPanel'));
ok('C6 renderProgressSteps', screens.includes('function renderProgressSteps'));

/* ── D. 셀 토글 이벤트 ──────────────────────────────── */

ok('D1 data-v3-cell 속성', screens.includes('data-v3-cell'));
ok('D2 data-v3-ref 속성', screens.includes('data-v3-ref'));
ok('D3 셀 토글 바인딩', screens.includes("[data-v3-cell]"));
ok('D4 openCell 상태', screens.includes('let openCell'));
ok('D5 같은 셀 재클릭 접힘', () => {
  const idx = screens.indexOf("[data-v3-cell]");
  const block = screens.slice(idx, idx + 600);
  return block.includes('openCell = null');
});

/* ── E. 탭 유지(쪽지권/노출) ─────────────────────────── */

ok('E1 plans-hist-tabs', screens.includes('plans-hist-tabs'));
ok('E2 쪽지권 탭', screens.includes('data-history-tab="count"'));
ok('E3 노출상품 탭', screens.includes('data-history-tab="position"'));
ok('E4 historyTab 상태', screens.includes("let historyTab = 'count'"));

/* ── F. 환불 기능 유지 ───────────────────────────────── */

ok('F1 환불 신청 버튼', screens.includes('data-refund-submit'));
ok('F2 환불 철회 버튼', screens.includes('data-refund-withdraw'));
ok('F3 사유 선택', screens.includes('data-refund-reason-select'));
ok('F4 상세 입력', screens.includes('data-refund-detail'));
ok('F5 fetchRefundEligibility 호출', screens.includes('fetchRefundEligibility'));
ok('F6 submitRefund 호출', screens.includes('submitRefund'));
ok('F7 withdrawRefund 호출', screens.includes('withdrawRefund'));
ok('F8 본인확인 입력란', screens.includes('data-refund-withdraw-confirm'));

/* ── G. 경로 통합 ────────────────────────────────────── */

ok('G1 /mypage/plans → v3', myScreens.includes("'/mypage/plans') return renderPlansV3"));
ok('G2 /mypage/plans/history → /mypage/plans 별칭', () => {
  const myRouter = exists('preview/home-ui/src/mypage/router.js') ? read('preview/home-ui/src/mypage/router.js') : '';
  return myRouter.includes("'/mypage/plans/history': '/mypage/plans'");
});
ok('G3 renderPlansV3 함수', myScreens.includes('function renderPlansV3'));
ok('G4 renderPlansV3 calls renderPlansHistory', myScreens.includes('renderPlansHistory()'));
ok('G5 /plans/history → /mypage/plans', () => {
  return router.includes("'/plans/history': '/mypage/plans'");
});

/* ── H. CSS v3 ───────────────────────────────────────── */

ok('H1 plans-hist-row CSS', css.includes('.plans-hist-row'));
ok('H2 plans-hist-row__bar CSS', css.includes('.plans-hist-row__bar'));
ok('H3 plans-hist-row__acts CSS', css.includes('.plans-hist-row__acts'));
ok('H4 plans-hist-row__panel CSS', css.includes('.plans-hist-row__panel'));
ok('H5 900px 반응형', css.includes('min-width: 900px') || css.includes('min-width:900px'));
ok('H6 240px acts 폭', css.includes('240px'));
ok('H7 is-cell-active CSS', css.includes('is-cell-active'));
ok('H8 plans-hist-steps CSS', css.includes('plans-hist-steps'));
ok('H9 is-done CSS', css.includes('.is-done'));
ok('H10 is-rejected CSS', css.includes('.is-rejected'));

/* ── I. PG HOLD 준수 (329b) ──────────────────────────── */

ok('I1 isRefundDone 없음', !screens.includes('isRefundDone'));
ok('I2 「환불 완료」 문구 없음', !screens.includes('환불 완료'));
ok('I3 「환불이 완료」 문구 없음', !screens.includes('환불이 완료'));
ok('I4 진행단계 key refunded 없음', () => {
  const idx = screens.indexOf('function renderProgressSteps');
  if (idx < 0) return false;
  const block = screens.slice(idx, idx + 800);
  return !block.includes("key: 'refunded'") && !block.includes('환불 완료');
});
ok('I5 pgCancel 호출 없음', !screens.includes('pgCancel'));
ok('I6 프론트 금액 계산 없음', () => {
  return !screens.includes('Math.floor') || !screens.includes('remaining_days');
});

/* ── J. 상태배지 ─────────────────────────────────────── */

ok('J1 상태배지 ing', screens.includes('plans-hist-row__st--ing'));
ok('J2 상태배지 no (반려)', screens.includes('plans-hist-row__st--no'));
ok('J3 완료 배지(--ok) 미사용', !screens.includes('plans-hist-row__st--ok'));

/* ── K. 제목·카피 "구매이력" / 「내 상품」 0 ───────────── */

ok('K1 구매이력 제목', screens.includes('구매이력'));
ok('K2 screens 「내 상품」 사용자문구 없음', () => {
  /* 주석 제외: 문자열 리터럴로 사용자에게 나가는 것만 */
  return !/["'`]내 상품/.test(screens) && !/>내 상품</.test(screens);
});
ok('K3 order-blocks 「내 상품」 없음', () => {
  const ob = exists('preview/home-ui/src/plans/order-blocks.js') ? read('preview/home-ui/src/plans/order-blocks.js') : '';
  return !ob.includes('내 상품');
});
ok('K4 hub-home 「내 상품」 없음', () => {
  const hub = exists('preview/home-ui/src/plans/hub-home.js') ? read('preview/home-ui/src/plans/hub-home.js') : '';
  return !hub.includes('내 상품');
});
ok('K5 router 제목 구매이력', () => {
  return router.includes("'P18-04': '구매이력'") && router.includes("'P18-05': '구매이력'");
});

/* ── 결과 ────────────────────────────────────────────── */

console.log(`\n=== 329 verify-purchase-history-v3: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
