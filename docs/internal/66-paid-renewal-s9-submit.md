# 66 · 유료상품 리뉴얼 §9 최종 제출물

범위: `#/plans/*` 유료상품만  
정본 체크리스트: `docs/internal/65-paid-renewal-checklist.md`  
증빙 스크립트: `npm run verify:paid-renewal`

---

## 1) 판단 기준 링크 문서

| 순위 | 문서 | 역할 |
|---|---|---|
| 1 | **34-1장** 유료상품 상세화 | 메인 정본 · 공부방/과외쌤 분기 · 배지·Prime·쪽지권 |
| 2 | **34장** 메뉴 통합·구매 플로우 | IA · positions/access/my · 주문요약 |
| 3 | **유료상품·결제 가격 확정 체크리스트** | 가격·기간·환불·활성 묶음 1개 · 서버 정본 |
| 4 | UDX-05 | 봇 제작·검수·제출 절차 |
| 5 | UDX-STD-001 | 전역 표준 **참조만** (이번 작업 전역 적용 금지) |
| 6 | UDX-20 Shell | 유료상품 쉘/레이아웃 참조 |
| 7 | UDX-60 QA Lab | 유료상품 범위 검수 |

---

## 2) 첨부(ZIP/시안) — 참고 vs 폐기

| 구분 | 내용 |
|---|---|
| **참고** | 카드 배치·톤·점유판/주문요약 레이아웃 감각 (`tmp/paid-design-handoff/`) |
| **폐기** | 과외쌤 Prime 점유·매진·예약대기(W1) · 마이페이지 탭형(W2) · Type B Pick 목록(W3) · access 큰 잔액 대시보드(M2) |
| **원칙** | 링크 정본과 충돌 시 ZIP 폐기 (잠금 0) |

---

## 3) 공통모듈 / 분기 구조 최종안

| 모듈 | 파일 | 책임 |
|---|---|---|
| 슬롯 재고 | `plans/slot-inventory.js` | **공부방 Prime만** 3칸 |
| 주문 블록 | `plans/order-blocks.js` | 적용대상 · 주문요약 · 구매전확인 · 환불 아코디언 · Basic · aux |
| 스토어 UI | `plans/store-ui.js` | 히어로 · 배지 선택(max2) · 비교/FAQ |
| 화면 | `plans/screens.js` | positions/access/my · Pick 미리보기 · 쪽지권 카드 · 대기 등록 |
| 내 상품 허브 | `mypage/screens.js` `#/mypage/plans/my` | 쪽지권 현황 · **공부방만** 예약대기 목록 |
| 서버 결제 | `ProviderCheckoutService.php` | 가격 스냅샷 · 배지 번들 · Prime 만석 conflict |
| 서버 배지 | `PaidBadgeRepository.php` | `normalizeBadgeCodesForBundle` max2 |
| 서버 대기 | `ProviderWaitlistService.php` + `waitlist.php` | study_room + prime only |

분기: **역할 탭 없음** · 적용 프로필(`study_room` | `tutor`)로 카탈로그·카피·재고 UI 분기.

---

## 4) 공부방 / 과외쌤 차이 반영

| 항목 | 공부방 | 과외쌤 |
|---|---|---|
| Prime | 지역 3자리 · 점유판 · 만석 시 예약대기 | 페이지당 3 · 15분 순환 · 재고/매진/대기 UI 없음 |
| Pick | 5×2 미리보기 · 순환 | 동일 순환 · 점유 UI 없음 |
| 배지 | Hot · 단과 | Hot · 쪽집게 · SKY(광고 표현) |
| 적용대상 | 대표 홍보지역 1·2·3 | 활동지역 + 주력과목 |
| 예약대기 API | 허용 | 서버/클라 거부 |

---

## 5) 기능 리뉴얼 내용

1. **배지**: 체크박스 max2 · `?badges=` · checkout `badge_codes` · 단독 `badge_addon` create 거부 · 역할별 허용 · 합산 스냅샷 grant  
2. **공부방 Prime 예약대기**: 등록/목록/취소 API · positions 만석 CTA · my 목록 · Pick/tutor 누수 차단  
3. **라우트**: positions=노출·배지·주문요약 / access=쪽지권·구매전확인(대시보드 제거) / my=보유·대기  
4. **서버 정본**: 금액·환불·묶음1개·배지max2·중도교체불가 — UI는 표시·비활성만  
5. **Pick 5×2 미리보기** · **쪽지권 1/5/10 큰 숫자 카드**

---

## 6) 디자인 반영 내용 (유료상품 범위만)

- `.plans-theme` 잠정 토큰 (`plans-store.css`) — 전역 전파 금지  
- Prime 점유판 · 예약대기 블록 · 주문요약  
- Pick `plans-pick-preview` 5×2 + 페이지 도트  
- 쪽지권 `plans-ticket-card__count` 타이포 카드 · 선택 상태  
- 배지 `plans-addon-card.is-selected` / `.is-disabled`

---

## 7) 아직 잠금이 필요한 미확정 항목

| 항목 | 상태 |
|---|---|
| Pick→Prime 전환 잔여금 | 미확정 · 발명 금지 |
| 무료 쪽지권 만료일 | 미확정 |
| 이용 시작일 규칙 | 미확정 |
| 임시확보 TTL | 미확정 |
| 공부방 Prime **지역별** 3자리 SSOT | 현재 전역 active count≤3 임시 게이트 · 구독 테이블 region 연동 후 교체 |
| 기간 카드 동일 높이 고도화 · UDX-60 전수 | Phase 4 잔여 polish |

---

## 8) 임의 정책 추가 없이 처리했는지 확인표

| 확인 | 결과 |
|---|---|
| 가격·할인을 프론트에서 확정하지 않음 | ✅ 표시가 + 서버 재검증 |
| 환불액 프론트 계산 없음 | ✅ 아코디언 안내만 |
| 배지 중도 추가/교체 UI·API 없음 | ✅ 단독 create 거부 문구 |
| access에 보유현황 대시보드 재유입 없음 | ✅ verify 증빙 |
| 과외쌤/Pick에 점유·매진·대기 UI 없음 | ✅ roomPrimeOnly + waitlist provider_type 가드 |
| UP 상품·내부용어 노출 없음 | ✅ |
| ZIP > 정본 우선 없음 | ✅ 잠금 0 |
| 전역 디자인/홈·찾기·GNB 개편 없음 | ✅ `.plans-theme` 한정 |

---

## 증빙 명령

```bash
npm run verify:paid-renewal
node --check preview/home-ui/src/plans/screens.js
```

(운영 PHP 환경에서는 기존 `verify:paid-catalog` / `verify:paid-pricing` 병행 권장)
