# [369] / [369-보완] / [369-보완2] / [369-보완3] 결제 화면(주문 요약) 레이아웃·문구

## 지시서 원문 (요약)

- 대상: `work/369-checkout-layout`
- 범위: home-ui 유료상품 결제(주문 요약) CSS·문구·캡처
- 369: 180px 갇힘 수정 → 1280/390 → 문구 → 캡처
- 369-보완: 모바일 nowrap · mypage-lead 중복 제거 · 개발용어 · 실앱 캡처
- 369-보완2: 잔여 개발용어 6곳 · 상품/지역 nowrap 해제 · P18-07 제목 중복 · captures 폴더 삭제 · shots-369 재캡처
- 369-보완3: 스토어프론트 기간·날짜 불일치 수정 · 문구 5곳 · before-* 삭제 · 결제 8장+스토어프론트 재캡처

## 원인 분석 (369)

**~180px 갇힘:** `.sup-frame` 2열 그리드에서 checkout이 nav를 숨기면 body가 11.5rem 열에 갇힘.  
수정: `.sup-frame--no-nav { display: block }` + `.plans-checkout { max-width: 44rem; margin-inline: auto }`

## 원인 분석 (369-보완3)

**재현:** P18-02 storefront 390에서 기간 「90일」인데 날짜가 `2026-11-12 ~ 2026-12-11`(30일)로 표시됨.  
**원인:** `period-cards.js` `resolvePeriodDuration`이 `30일`/`90일`/`30d`/`90d`를 파싱하지 못해 기본 `{type:'month',value:1}`로 떨어짐. 라벨은 option.label「90일」을 쓰고 미리보기만 1개월.  
**수정:** `resolvePeriodDuration`에 `N일`/`Nd` 파싱 추가 → 프라임 90일 = `2026-11-12 ~ 2027-02-09`.

## 캡처 (shots-369 기준, 369-보완3)

경로: `docs/worklog/2026/11/shots-369/`  
`before-*` PNG·before-report 삭제. 상세: `capture3-report.txt`

| 파일 | 크기 | SHA-256(16) | 기간 | 날짜 | 금액 | 배지 | 총액 | 보이는 행 |
|---|---|---|---|---|---|---|---|---|
| after-prime-badge-1280.png | 147316 | `b5b17211e5531d11` | 90일 | 2026-11-12 ~ 2027-02-09 | 99,000원 | 9,900원 | 108,900원 | 주문 요약·프로필·역할·상품·지역·기간·날짜·금액·배지·총액 |
| after-prime-badge-390.png | 128687 | `728aeb09039bb022` | 90일 | 동일 | 동일 | 동일 | 동일 | 동일 + 긴 지역명 줄바꿈 |
| after-prime-nobadge-1280.png | 140477 | `6b1ec89e7e83ddd8` | 90일 | 동일 | 99,000원 | 없음 | 99,000원 | 동일(배지 없음) |
| after-prime-nobadge-390.png | 121767 | `cb0ca4c9501ae786` | 90일 | 동일 | 동일 | 없음 | 동일 | 동일 |
| after-pick-badge-1280.png | 138728 | `793f874e8d338d08` | 30일 | 2026-11-12 ~ 2026-12-11 | 33,000원 | 5,500원 | 38,500원 | 동일 |
| after-pick-badge-390.png | 120142 | `e9083345f9740440` | 30일 | 동일 | 동일 | 동일 | 동일 | 동일 |
| after-pick-nobadge-1280.png | 131804 | `c475537e0778db46` | 30일 | 동일 | 33,000원 | 없음 | 33,000원 | 동일 |
| after-pick-nobadge-390.png | 113939 | `80b431d3a6a42ecf` | 30일 | 동일 | 동일 | 없음 | 동일 | 동일 |
| storefront-prime-badge-390.png | 415479 | `2e8eedcd5533f85e` | 90일 | 2026-11-12 ~ 2027-02-09 | 99,000원 | 9,900원 | 108,900원 | 전체 폭 390 fullPage |

해시 중복 0.

## 수정 파일 (누적)

1. `preview/home-ui/src/styles/plans-store.css`
2. `preview/home-ui/src/plans/shell.js`
3. `preview/home-ui/src/plans/order-blocks.js`
4. `preview/home-ui/src/plans/screens.js`
5. `preview/home-ui/src/plans/router.js`
6. `preview/home-ui/src/plans/store-ui.js`
7. `preview/home-ui/src/plans/index.js`
8. `preview/home-ui/src/plans/runtime-config.js`
9. `preview/home-ui/src/plans/period-cards.js` (보완3)
10. `preview/home-ui/src/plans/catalog-store.js` (보완3)

## 검수

- [ ] 사용자 승인 대기
