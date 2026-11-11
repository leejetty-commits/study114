# [369] / [369-보완] / [369-보완2] 결제 화면(주문 요약) 레이아웃·문구

## 지시서 원문 (요약)

- 대상: `work/369-checkout-layout`
- 범위: home-ui 유료상품 결제(주문 요약) CSS·문구·캡처
- 369: 180px 갇힘 수정 → 1280/390 → 문구 → 캡처
- 369-보완: 모바일 nowrap · mypage-lead 중복 제거 · 개발용어 · 실앱 캡처
- 369-보완2: 잔여 개발용어 6곳 · 상품/지역 nowrap 해제 · P18-07 제목 중복 · captures 폴더 삭제 · shots-369 재캡처

## 원인 분석 (369)

**~180px 갇힘:** `.sup-frame` 2열 그리드에서 checkout이 nav를 숨기면 body가 11.5rem 열에 갇힘.  
수정: `.sup-frame--no-nav { display: block }` + `.plans-checkout { max-width: 44rem; margin-inline: auto }`

## 캡처 (shots-369 기준, 369-보완2)

경로: `docs/worklog/2026/11/shots-369/`

| 파일 | 폭 | SHA-256(16) |
|---|---|---|
| after-prime-badge-1280.png | 1280 | `99891fda30864ba6` |
| after-prime-badge-390.png | 390 | `34d4a66ee5399c2d` |
| after-prime-nobadge-1280.png | 1280 | `6967bf5a084596fb` |
| after-prime-nobadge-390.png | 390 | `3f8a887480e63f8a` |
| after-pick-badge-1280.png | 1280 | `6cb50f2b1d74cf0e` |
| after-pick-badge-390.png | 390 | `bef89addf09579ac` |
| after-pick-nobadge-1280.png | 1280 | `9d96f5928e641a9b` |
| after-pick-nobadge-390.png | 390 | `34aea07da3880bf4` |
| result-success-1280.png | 1280 | `02edf679b887f63f` |
| result-success-390.png | 390 | `d3d185be049ed269` |
| storefront-prime-badge-390.png | 390 | `942cb1ba4129e351` |

해시 중복 0. 루트 `captures/369-checkout-before`·`after` 폴더는 삭제.

### 390 날짜·금액 한 줄 확인

| 시나리오 | 날짜 | 금액 |
|---|---|---|
| prime-badge | `2026-11-12 ~ 2027-02-09` nowrap | `99,000원` nowrap |
| prime-nobadge | 동일 | 동일 |
| pick-badge | `2026-11-12 ~ 2026-12-11` nowrap | `33,000원` nowrap |
| pick-nobadge | 동일 | 동일 |

## 수정 파일 (누적)

1. `preview/home-ui/src/styles/plans-store.css`
2. `preview/home-ui/src/plans/shell.js`
3. `preview/home-ui/src/plans/order-blocks.js`
4. `preview/home-ui/src/plans/screens.js`
5. `preview/home-ui/src/plans/router.js`
6. `preview/home-ui/src/plans/store-ui.js`
7. `preview/home-ui/src/plans/index.js`
8. `preview/home-ui/src/plans/runtime-config.js`

## 검수

- [ ] 사용자 승인 대기
