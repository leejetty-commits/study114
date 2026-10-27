/**
 * 326 — 환불 신청·동결·철회 verify (정적 검증)
 * 실행: node scripts/verify-refund-apply.mjs
 *
 * DB·서버 접속 없음. 파일 내용 기반 정적 검증.
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

/* ── A. PHP 서비스 파일 존재 ─────────────────────────── */

ok('A1 RefundService 존재', exists('src/Paid/RefundService.php'));
ok('A2 RefundRepository 존재', exists('src/Paid/RefundRepository.php'));
ok('A3 API endpoint 존재', exists('public/api/paid/refund.php'));

/* ── B. RefundService 구조 검증 ──────────────────────── */

const svc = exists('src/Paid/RefundService.php') ? read('src/Paid/RefundService.php') : '';

ok('B1 checkEligibility 메서드', svc.includes('function checkEligibility'));
ok('B2 submit 메서드', svc.includes('function submit'));
ok('B3 withdraw 메서드', svc.includes('function withdraw'));
ok('B4 isPackBlockedByRefund 메서드', svc.includes('function isPackBlockedByRefund'));
ok('B5 MemoTicketRefundCalculator 호출', svc.includes('MemoTicketRefundCalculator::calculate'));
ok('B6 freezePack(remaining=0)', svc.includes("remaining = 0") || svc.includes('SET remaining = 0'));
ok('B7 restorePack(frozen_remaining)', svc.includes('function restorePack'));
ok('B8 frozen_remaining in reason_text', svc.includes('frozen_remaining'));
ok('B9 beginTransaction', svc.includes('beginTransaction'));
ok('B10 FOR UPDATE 잠금', svc.includes('FOR UPDATE'));
ok('B11 product_kind count 검증', svc.includes("'count'"));
ok('B12 자동승인 markApproved', svc.includes('markApproved'));
ok('B13 refund_requested 상태', svc.includes("'refund_requested'"));

/* ── C. RefundRepository 구조 검증 ───────────────────── */

const repo = exists('src/Paid/RefundRepository.php') ? read('src/Paid/RefundRepository.php') : '';

ok('C1 insert 메서드', repo.includes('function insert'));
ok('C2 markApproved 메서드', repo.includes('function markApproved'));
ok('C3 markCancelled 메서드', repo.includes('function markCancelled'));
ok('C4 hasActiveRefund 메서드', repo.includes('function hasActiveRefund'));
ok('C5 findByOrderRefForUpdate', repo.includes('function findByOrderRefForUpdate'));
ok('C6 requested+approved 활성 상태', repo.includes("'requested', 'approved'"));

/* ── D. API endpoint 검증 ────────────────────────────── */

const api = exists('public/api/paid/refund.php') ? read('public/api/paid/refund.php') : '';

ok('D1 PaidApi::requireProvider', api.includes('requireProvider'));
ok('D2 GET 자격확인', api.includes("'GET'") && api.includes('checkEligibility'));
ok('D3 POST submit', api.includes("'submit'"));
ok('D4 POST withdraw', api.includes("'withdraw'"));

/* ── E. Admin 차단 검증 ──────────────────────────────── */

const adminSvc = exists('src/Admin/AdminCommerceService.php') ? read('src/Admin/AdminCommerceService.php') : '';

ok('E1 RefundService import', adminSvc.includes('RefundService'));
ok('E2 isPackBlockedByRefund 호출', adminSvc.includes('isPackBlockedByRefund'));
ok('E3 차단 메시지', adminSvc.includes('환불 진행 중'));

/* ── F. Frontend JS 검증 ─────────────────────────────── */

const paidApi = exists('preview/home-ui/src/paid-api.js') ? read('preview/home-ui/src/paid-api.js') : '';
ok('F1 refund endpoint', paidApi.includes("refund: '/api/paid/refund.php'"));
ok('F2 fetchRefundEligibility', paidApi.includes('fetchRefundEligibility'));
ok('F3 submitRefund', paidApi.includes('submitRefund'));
ok('F4 withdrawRefund', paidApi.includes('withdrawRefund'));

const screens = exists('preview/home-ui/src/plans/screens.js') ? read('preview/home-ui/src/plans/screens.js') : '';
ok('F5 history 탭 UI', screens.includes('data-history-tab'));
ok('F6 확장행 토글', screens.includes('data-history-expand'));
ok('F7 환불 신청 버튼', screens.includes('data-refund-submit'));
ok('F8 환불 철회 버튼', screens.includes('data-refund-withdraw'));
ok('F9 환불 사유 선택', screens.includes('data-refund-reason-select'));
ok('F10 historyTab 상태', screens.includes("let historyTab = 'count'"));
ok('F11 expandedOrderRef 상태', screens.includes('let expandedOrderRef'));
ok('F12 refundEligCache', screens.includes('refundEligCache'));
ok('F13 isCountProduct 분기', screens.includes('isCountProduct'));

const copy = exists('preview/home-ui/src/mypage/mypage-copy.js') ? read('preview/home-ui/src/mypage/mypage-copy.js') : '';
ok('F14 REFUND_REASON_CHOICES', copy.includes('REFUND_REASON_CHOICES'));
ok('F15 REFUND_STATUS_LABELS', copy.includes('REFUND_STATUS_LABELS'));
ok('F16 REFUND_COPY 확인메시지', copy.includes('confirmSubmit'));
ok('F17 frozenNote', copy.includes('frozenNote'));

const histMock = exists('preview/home-ui/src/plans/history-mock.js') ? read('preview/home-ui/src/plans/history-mock.js') : '';
ok('F18 invalidateHistoryCache', histMock.includes('invalidateHistoryCache'));
ok('F19 normalizeStatus', histMock.includes('normalizeStatus'));

/* ── G. 325 기존 verify 불변 ─────────────────────────── */

const sql083 = exists('sql/schema/083_refund_foundation.sql') ? read('sql/schema/083_refund_foundation.sql') : '';
ok('G1 083 SQL 파일 존재(325 불변)', exists('sql/schema/083_refund_foundation.sql'));
ok('G2 083 ENUM 6값 불변', sql083.includes("'refund_requested'") && sql083.includes("'refunded'"));

const myCopy = exists('preview/home-ui/src/mypage/mypage-copy.js') ? read('preview/home-ui/src/mypage/mypage-copy.js') : '';
ok('G3 325 라벨 불변 — refund_requested: 진행중', myCopy.includes("refund_requested: '진행중'"));
ok('G4 325 라벨 불변 — refunded: 환불 완료', myCopy.includes("refunded: '환불 완료'"));

const a28state = exists('preview/home-ui/src/admin/a28-screens-state.js') ? read('preview/home-ui/src/admin/a28-screens-state.js') : '';
ok('G5 admin 라벨 불변 — 환불 진행중', a28state.includes("refund_requested: '환불 진행중'"));

/* ── H. 문서 존재 확인 ───────────────────────────────── */

const lockDoc = exists('docs/ssot/18c-memo-ticket-refund-lock.md') ? read('docs/ssot/18c-memo-ticket-refund-lock.md') : '';
ok('H1 18c 정본 존재', exists('docs/ssot/18c-memo-ticket-refund-lock.md'));
ok('H2 18c에 326 기록', lockDoc.includes('326'));

/* ── I. 326b 본인확인 ────────────────────────────────── */

ok('I1 철회 confirm_text 파라미터', svc.includes('string $confirmText'));
ok('I2 WITHDRAW_CONFIRM_TEXT 상수', svc.includes("WITHDRAW_CONFIRM_TEXT = '환불철회'"));
ok('I3 본인확인 실패 시 InvalidArgumentException', () => {
  const idx = svc.indexOf('function withdraw');
  const fn = svc.slice(idx, idx + 600);
  return fn.includes('WITHDRAW_CONFIRM_TEXT') && fn.includes('InvalidArgumentException');
});
ok('I4 identity_checked_at 기록', repo.includes('identity_checked_at'));
ok('I5 identity_method 기록', repo.includes('identity_method'));
ok('I6 withdraw_linked=1 기록', repo.includes('withdraw_linked = 1'));
ok('I7 markCancelledWithIdentity 메서드', repo.includes('function markCancelledWithIdentity'));
ok('I8 API에 confirm_text 전달', api.includes('confirm_text'));

/* ── J. 326b 재환불 차단 ─────────────────────────────── */

ok('J1 hasWithdrawnRefund 메서드', repo.includes('function hasWithdrawnRefund'));
ok('J2 withdrawn_no_rerefund 사유 코드', svc.includes("'withdrawn_no_rerefund'"));
ok('J3 checkEligibility에 재환불 차단', () => {
  const idx = svc.indexOf('function checkEligibility');
  const fn = svc.slice(idx, svc.indexOf('function submit', idx));
  return fn.includes('hasWithdrawnRefund');
});
ok('J4 submit에 재환불 차단', () => {
  const idx = svc.indexOf('function submit');
  const fn = svc.slice(idx, svc.indexOf('function withdraw', idx));
  return fn.includes('hasWithdrawnRefund');
});
ok('J5 UNIQUE 충돌 catch', svc.includes('Duplicate entry') || svc.includes('uk_refund_order_ref'));
ok('J6 UNIQUE 충돌 사용자 문구(500 아님)', svc.includes('PaidConflictException') && svc.includes('이미 존재합니다'));
ok('J7 철회 후 재신청 안내 문구', svc.includes('철회 처리된 결제는'));

/* ── K. 326b 관리자 차단 보강 ────────────────────────── */

ok('K1 resolveOrderRefForPack 헬퍼', svc.includes('function resolveOrderRefForPack'));
ok('K2 source_order_ref 컬럼 존재 체크', () => {
  const idx = svc.indexOf('function resolveOrderRefForPack');
  if (idx < 0) return false;
  const fn = svc.slice(idx, idx + 1500);
  return fn.includes('columnExists') && fn.includes('source_order_ref');
});
ok('K3 fallback user_id+pack_size 매칭', () => {
  const idx = svc.indexOf('function resolveOrderRefForPack');
  const fn = svc.slice(idx, idx + 1500);
  return fn.includes('pack_size') && fn.includes('user_id');
});
ok('K4 isPackBlockedByRefund가 resolveOrderRefForPack 사용', () => {
  const idx = svc.indexOf('function isPackBlockedByRefund');
  const fn = svc.slice(idx, idx + 300);
  return fn.includes('resolveOrderRefForPack');
});

/* ── L. 326b frozen_remaining 가드 ───────────────────── */

ok('L1 parseFrozenRemainingStrict 메서드', svc.includes('function parseFrozenRemainingStrict'));
ok('L2 빈 reason_text → RuntimeException', () => {
  const idx = svc.indexOf('function parseFrozenRemainingStrict');
  const fn = svc.slice(idx, idx + 1200);
  return fn.includes('RuntimeException') && fn.includes('비어 있습니다');
});
ok('L3 JSON 파싱 실패 → RuntimeException', () => {
  const idx = svc.indexOf('function parseFrozenRemainingStrict');
  const fn = svc.slice(idx, idx + 1200);
  return fn.includes('파싱에 실패');
});
ok('L4 frozen_remaining 필드 없음 → RuntimeException', () => {
  const idx = svc.indexOf('function parseFrozenRemainingStrict');
  const fn = svc.slice(idx, idx + 1200);
  return fn.includes('필드가 없습니다');
});
ok('L5 withdraw가 parseFrozenRemainingStrict 호출', () => {
  const idx = svc.indexOf('function withdraw');
  const fn = svc.slice(idx, svc.indexOf('function isPackBlockedByRefund'));
  return fn.includes('parseFrozenRemainingStrict');
});

/* ── M. 326b 문구·문서 ──────────────────────────────── */

const a28Copy = exists('preview/home-ui/src/admin/a28-copy.js') ? read('preview/home-ui/src/admin/a28-copy.js') : '';
ok('M1 a28-copy 환불 차단 문구', a28Copy.includes('blockedByRefund'));
ok('M2 a28-copy 재환불 차단 문구', a28Copy.includes('withdrawnNoRerefund'));
ok('M3 a28-copy 사유 코드 라벨', a28Copy.includes('refundReasonCodes'));

ok('M4 mypage-copy withdrawConfirmText', copy.includes("withdrawConfirmText: '환불철회'"));
ok('M5 mypage-copy withdrawnNoRerefund', copy.includes('withdrawnNoRerefund'));
ok('M6 mypage-copy adminBlockedByRefund', copy.includes('adminBlockedByRefund'));

const mypageScreens = exists('preview/home-ui/src/mypage/screens.js') ? read('preview/home-ui/src/mypage/screens.js') : '';
ok('M7 mypage/screens.js 환불규정 정리', !mypageScreens.includes('환불규정에 따라서'));

ok('M8 grok-sync 노트', exists('docs/worklog/grok-sync/326-refund-apply-notes.md'));

const grokNote = exists('docs/worklog/grok-sync/326-refund-apply-notes.md') ? read('docs/worklog/grok-sync/326-refund-apply-notes.md') : '';
ok('M9 grok-sync 본인확인 기록', grokNote.includes('본인확인'));
ok('M10 grok-sync 재환불 차단 기록', grokNote.includes('재환불 차단'));
ok('M11 grok-sync position_ends_at 이월', grokNote.includes('position_ends_at') && grokNote.includes('327'));

/* ── N. 327 position 정적 검사 ───────────────────────── */

const posCalc = exists('src/Paid/PositionRefundCalculator.php') ? read('src/Paid/PositionRefundCalculator.php') : '';
ok('N1 PositionRefundCalculator 존재', posCalc.length > 100);
ok('N2 PositionRefundCalculator 순수 계산', posCalc.includes('DB') === false || !posCalc.includes('$this->pdo'));
ok('N3 before_start_full', posCalc.includes('before_start_full'));
ok('N4 after_start_prorata', posCalc.includes('after_start_prorata'));
ok('N5 last_day', posCalc.includes('last_day'));
ok('N6 period_ended', posCalc.includes('period_ended'));
ok('N7 floor', posCalc.includes('floor('));
ok('N8 needs_owner_decision 없음', !posCalc.includes('needs_owner_decision'));

ok('N9 RefundService position 분기', svc.includes("kind === 'position'") || svc.includes('submitPosition'));
ok('N10 RefundService position txn', () => {
  const idx = svc.indexOf('function submitPosition');
  if (idx < 0) return false;
  const fn = svc.slice(idx, idx + 6000);
  return fn.includes('lockPositionSubscription') && fn.includes('PositionRefundCalculator::calculate')
    && fn.includes('revokeBadgesForPositionOrder') && fn.includes('freezePositionBundles')
    && fn.includes('refund_requested') && fn.includes('markApproved');
});
ok('N11 PG 호출 문자열 0 (position)', () => {
  const idx = svc.indexOf('function submitPosition');
  if (idx < 0) return false;
  const fn = svc.slice(idx, idx + 3000);
  return !fn.includes('cancelPayment') && !fn.includes("'refunded'");
});
ok('N12 철회 복원 경로', svc.includes('function withdrawPosition'));
ok('N13 관리자 position_ends_at 차단', () => {
  const admin = exists('src/Admin/AdminCommerceService.php') ? read('src/Admin/AdminCommerceService.php') : '';
  return admin.includes('isPositionBlockedByRefund');
});
ok('N14 isPositionBlockedByRefund', svc.includes('function isPositionBlockedByRefund'));

ok('N15 프라임 철회 자리 확인', svc.includes('assertPrimeSlotAvailableForWithdraw'));
ok('N16 배지 회수', svc.includes('revokeBadgesForPositionOrder'));
ok('N17 번들 동결', svc.includes('freezePositionBundles'));
ok('N18 badge_follows_position', svc.includes('badge_follows_position'));

ok('N19 18d 정본', exists('docs/ssot/18d-position-refund-lock.md'));
ok('N20 18c 후속 업데이트', () => {
  const c = exists('docs/ssot/18c-memo-ticket-refund-lock.md') ? read('docs/ssot/18c-memo-ticket-refund-lock.md') : '';
  return c.includes('18d') && !c.includes('→ 327)');
});
ok('N21 snapshot segment_started_on', () => {
  const checkout = exists('src/Paid/ProviderCheckoutService.php') ? read('src/Paid/ProviderCheckoutService.php') : '';
  return checkout.includes('segment_started_on');
});

/* ── 결과 ────────────────────────────────────────────── */

console.log(`\n=== 326+326b+327 verify-refund-apply: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
