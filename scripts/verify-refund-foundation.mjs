/**
 * 325 — 환불 기반(refund foundation) verify
 * 실행: node scripts/verify-refund-foundation.mjs
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

// --- A. SQL 마이그레이션 ---
const sqlFile = 'sql/schema/083_refund_foundation.sql';
ok('A1 SQL 파일 존재', exists(sqlFile));
const sql = exists(sqlFile) ? read(sqlFile) : '';
ok('A2 ENUM 6값 — refund_requested', sql.includes("'refund_requested'"));
ok('A3 ENUM 6값 — refunded', sql.includes("'refunded'"));
const enumMatch = sql.match(/ENUM\s*\(\s*'pending'\s*,\s*'paid'\s*,\s*'failed'\s*,\s*'cancelled'\s*,\s*'refund_requested'\s*,\s*'refunded'\s*\)/i);
ok('A4 ENUM 순서 6값 일치', Boolean(enumMatch));
ok('A5 provider_refund_requests CREATE', sql.includes('CREATE TABLE provider_refund_requests'));
ok('A6 order_ref UNIQUE', sql.includes('UNIQUE KEY') && sql.includes('order_ref'));
const refundStatusEnum = sql.match(/status\s+ENUM\s*\(\s*'requested'\s*,\s*'approved'\s*,\s*'rejected'\s*,\s*'refunded'\s*,\s*'cancelled'\s*\)/i);
ok('A7 refund_requests.status 5값', Boolean(refundStatusEnum));
const createBlock = sql.slice(sql.indexOf('CREATE TABLE provider_refund_requests'));
const refundEnums = [...createBlock.matchAll(/ENUM\([^)]+\)/gi)].map((m) => m[0]);
const statusEnum = refundEnums.find((e) => e.includes("'requested'"));
ok('A8 pending 미사용 (refund status)', statusEnum ? !statusEnum.includes("'pending'") : false);

// --- B. 관리자 PHP 쿼리 ---
const adminRepo = read('src/Admin/AdminMemberRepository.php');
const adminDelete = read('src/Admin/AdminMemberDeleteService.php');
ok('B1 AdminMemberRepository refund_requested 포함', adminRepo.includes("'refund_requested'"));
ok('B2 AdminMemberDeleteService refund_requested 포함', adminDelete.includes("'refund_requested'"));
const repoRefunded = adminRepo.match(/IN\s*\(\s*'paid'\s*,\s*'refund_requested'\s*,\s*'refunded'\s*\)/);
ok('B3 AdminMemberRepository IN 3값 순서', Boolean(repoRefunded));
const deleteRefunded = adminDelete.match(/\['paid',\s*'refund_requested',\s*'refunded'\]/);
ok('B4 AdminMemberDeleteService in_array 3값', Boolean(deleteRefunded));

// --- C. 프론트 라벨 ---
const mypageCopy = read('preview/home-ui/src/mypage/mypage-copy.js');
const a28State = read('preview/home-ui/src/admin/a28-screens-state.js');
ok('C1 mypage-copy refund_requested 존재', mypageCopy.includes('refund_requested'));
ok('C2 mypage-copy refund_requested → 진행중', mypageCopy.includes("refund_requested: '진행중'"));
ok('C3 a28 refund_requested 존재', a28State.includes('refund_requested'));
ok('C4 a28 refund_requested → 환불 진행중', a28State.includes("refund_requested: '환불 진행중'"));
ok('C5 mypage-copy 라벨 ≠ a28 라벨', () => {
  const userMatch = mypageCopy.match(/refund_requested:\s*'([^']+)'/);
  const adminMatch = a28State.match(/refund_requested:\s*'([^']+)'/);
  return userMatch && adminMatch && userMatch[1] !== adminMatch[1];
}, '사용자 ≠ 관리자 라벨');

// --- D. A6 문구 (환불 없음 제거) ---
const orderBlocks = read('preview/home-ui/src/plans/order-blocks.js');
const plansScreens = read('preview/home-ui/src/plans/screens.js');
ok('D1 order-blocks.js 「환불 없음」 0건', !orderBlocks.includes('환불 없음'));
ok('D2 plans/screens.js 「환불 없음」 0건', !plansScreens.includes('환불 없음'));
ok('D3 order-blocks 「환불·연장되지 않습니다」 0건', !orderBlocks.includes('환불·연장되지 않습니다'));
ok('D4 screens.js 「환불·연장 없음」 0건', !plansScreens.includes('환불·연장 없음'));

ok('D5 order-blocks 120일 만료 → 환불액 0', orderBlocks.includes('잔여 소멸(환불액 0)'));
ok('D6 order-blocks 7일 이내', orderBlocks.includes('7일 이내'));
ok('D7 screens.js 잔여 소멸(환불액 0)', plansScreens.includes('잔여 소멸(환불액 0)'));

ok('D8 accordion 1회 즉시권 문구 불변', orderBlocks.includes('1회 즉시권: 7일 이내 미발송 시 전액'));
ok('D9 accordion 회사 귀책 문구 불변', orderBlocks.includes('회사 귀책 발송 실패는 횟수 복구를 우선합니다'));
ok('D10 position accordion 불변', orderBlocks.includes('시작 전: 전액 환불'));

// --- E. 노출 카피 불변 ---
ok('E1 checkout 환불 안내 불변', plansScreens.includes('환불은 시작 전 전액, 시작 후 일할 계산(서버 정본)'));
ok('E2 result 환불 안내 불변', plansScreens.includes('자동연장 없음 · 환불은 시작 전 전액'));

// --- F. 문서 ---
ok('F1 18c 문서 존재', exists('docs/ssot/18c-memo-ticket-refund-lock.md'));
ok('F2 18 문서 존재', exists('docs/ssot/18-paid-services-rough.md'));
ok('F3 18d 미존재', !exists('docs/ssot/18d-position-refund-calculator.md'));

// --- G. 324 verify 호환: refunded 라벨 불변 ---
ok('G1 mypage-copy refunded → 환불 완료 유지', mypageCopy.includes("refunded: '환불 완료'"));
ok('G2 a28 refunded → 환불 유지', a28State.includes("refunded: '환불'"));

console.log(`\nverify-refund-foundation: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
