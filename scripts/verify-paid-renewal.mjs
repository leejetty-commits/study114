/**
 * 유료상품 리뉴얼 정적 증빙 (라우트 책임 · 분기 · 대시보드/슬롯 잔재 · 배지/대기 API)
 * 실행: npm run verify:paid-renewal
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const FAIL = [];
const PASS = [];

function ok(name, cond, detail = '') {
  if (cond) PASS.push(name);
  else FAIL.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const screens = read('preview/home-ui/src/plans/screens.js');
const storeUi = read('preview/home-ui/src/plans/store-ui.js');
const orderBlocks = read('preview/home-ui/src/plans/order-blocks.js');
const slotInv = read('preview/home-ui/src/plans/slot-inventory.js');
const paidApi = read('preview/home-ui/src/paid-api.js');
const checkoutSvc = read('src/Paid/ProviderCheckoutService.php');
const badgeRepo = read('src/Paid/PaidBadgeRepository.php');
const waitlistPhp = read('public/api/paid/waitlist.php');
const waitlistSvc = read('src/Paid/ProviderWaitlistService.php');
const ticketSvc = read('src/Paid/ProviderTicketService.php');
const mypageScreens = read('preview/home-ui/src/mypage/screens.js');
const css = read('preview/home-ui/src/styles/plans-store.css');

// --- 라우트 책임 ---
ok(
  'positions: 배지 섹션 존재',
  screens.includes('renderBadgeAddonSection') && screens.includes('renderPlansPositions'),
);
ok(
  'positions: 주문요약·적용대상',
  screens.includes('renderOrderSummaryBlock') && screens.includes("renderApplyTargetBlock(profile, role, 'positions')"),
);
ok(
  'access: 구매 전 확인·aux 링크',
  screens.includes('renderAccessPurchaseCheck') && screens.includes('renderAccessAuxLinks'),
);
{
  const accessFn = screens.slice(screens.indexOf('export function renderPlansAccess'));
  const accessBody = accessFn.slice(0, accessFn.indexOf('export function renderPlansMy'));
  ok(
    'access: LowCredit/잔액 블록 미사용',
    !accessBody.includes('renderLowCreditBanner') &&
      !accessBody.includes('현재 잔액') &&
      !accessBody.includes('선입선출') &&
      !accessBody.includes('가장 빠른 만료'),
  );
  ok(
    'access: 쪽지권 숫자 카드',
    screens.includes('function renderAccessCard') &&
      screens.includes('plans-ticket-card__count') &&
      screens.includes('data-plans-ticket-option') &&
      accessBody.includes('renderAccessCard'),
  );
}

ok(
  'my: 예약대기 호스트(공부방)',
  mypageScreens.includes('data-plans-my-waitlist') && screens.includes('fetchPrimeWaitlist'),
);

// --- 공부방/과외쌤 분기 ---
ok('slot-inventory: 공부방 Prime ONLY', slotInv.includes('공부방 Prime ONLY') || slotInv.includes('study_room'));
ok(
  'positions: 점유판은 roomPrimeOnly',
  screens.includes('const roomPrimeOnly = role === \'study_room\' && product.productCode === \'prime\''),
);
ok(
  'tutor 가이드: 매진·예약대기 금지 카피',
  screens.includes('점유 슬롯·매진·예약대기는 과외쌤에 적용되지 않습니다'),
);
ok(
  'ticket service: pick inventory false',
  ticketSvc.includes("'inventory' => false") || ticketSvc.includes('inventory\' => false'),
);

// --- 배지 서버 ---
ok('badge max-2 normalize', badgeRepo.includes('normalizeBadgeCodesForBundle') && badgeRepo.includes('최대 2개'));
ok('단독 badge_addon create 거부', checkoutSvc.includes("kindHint === 'badge_addon'") && checkoutSvc.includes('최초 구매 또는 연장'));
ok('badge_codes position only', checkoutSvc.includes('홍보 배지는 Prime/Pick 구매에만'));
ok('UI max-2 disabled', storeUi.includes('atMax') && storeUi.includes('data-plans-badge-code'));
ok('checkout transmits badge_codes', paidApi.includes('badge_codes'));

// --- 예약대기 ---
ok('waitlist API study_room+prime only', waitlistPhp.includes("providerType !== 'study_room'") && waitlistPhp.includes("exposureType !== 'prime'"));
ok('waitlist 공개응답 순번 제외', waitlistSvc.includes('순번·경쟁업체·대기 인원 제외'));
ok('registerPrimeWaitlist hardcodes study_room/prime', paidApi.includes("provider_type: 'study_room'") && paidApi.includes("exposure_type: 'prime'"));
ok('assertRoomPrimeAvailable study_room prime only', checkoutSvc.includes("productId !== 'prime' || $providerType !== 'study_room'"));

// --- Pick / 쪽지권 polish ---
ok('Pick 5×2 preview', screens.includes('plans-pick-preview') && screens.includes('5열 × 2행'));
ok('Pick preview CSS', css.includes('.plans-pick-preview__grid'));
ok('Ticket typography CSS', css.includes('.plans-ticket-card__count'));

// --- 서버 정본 경계 카피 ---
ok('주문요약 서버 재검증 문구', screens.includes('서버 재검증') || orderBlocks.includes('서버'));
ok('환불 아코디언', orderBlocks.includes('renderPolicyAccordion') || screens.includes("renderPolicyAccordion('position')"));

const outDir = path.join(root, 'tmp/paid-renewal-verify');
fs.mkdirSync(outDir, { recursive: true });
const report = {
  generated_at: new Date().toISOString(),
  pass: PASS.length,
  fail: FAIL.length,
  passed: PASS,
  failed: FAIL,
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

console.log(`verify:paid-renewal — PASS ${PASS.length} / FAIL ${FAIL.length}`);
if (FAIL.length) {
  FAIL.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
PASS.forEach((p) => console.log('  ✓', p));
