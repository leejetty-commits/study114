# [369] 결제 화면(주문 요약) 레이아웃·문구 정리

## 지시서 원문 (요약)

- 대상: `work/369-checkout-layout` 브랜치 (main 기준)
- 범위: home-ui 유료상품 결제(주문 요약) 화면의 CSS와 문구만
- 필수 6개: 원인 확인 → 데스크톱 1280 → 모바일 390 → 문구 → 전후 캡처 → 커밋·push

## 원인 분석

**~180px 갇힘의 근본 원인:**

| 계층 | 파일 | 설명 |
|---|---|---|
| `.sup-frame` grid | `home-support-guide.css:38-40` | `display: grid; grid-template-columns: 11.5rem minmax(0,1fr)` — 2열 그리드 |
| checkout 셸 | `shell.js:82-84` | `hideNav = true` → nav HTML 미렌더 → `sup-frame__body`가 그리드 첫 열(11.5rem ≈ 184px)에 배치 |
| 오른쪽 열 | — | `1fr` 열은 비어 있으나 남은 공간 차지 |

고객센터(`/support`) 등은 nav + body가 2열에 정상 배치되지만,
checkout·result은 nav를 숨기므로 body가 첫 번째 좁은 열에 갇힘.

## 수정 내용

### CSS (`plans-store.css`)

```css
/* nav 없는 결제·결과 화면은 단일 열 */
.plans-layout .sup-frame--no-nav { display: block; }
.plans-checkout { max-width: 44rem; margin-inline: auto; }
```

- 주문 요약 `dd`에 `white-space: nowrap` 추가 (데스크톱 날짜 끊김 방지)
- 959px 이하 media query에서 `white-space: normal` 리셋

### 셸 (`shell.js`)

- `hideNav` 시 `.sup-frame--no-nav` modifier 클래스 추가

### 문구

| 파일 | Before | After |
|---|---|---|
| `order-blocks.js:436` | `결제 금액은 서버 카탈로그 기준으로 다시 확인됩니다` | `최종 금액은 결제 직전에 한 번 더 확인해요` |
| `order-blocks.js:116-117` | `Prime ${n}/${cap} 마감` | `프라임 ${n}/${cap} 마감` |
| `screens.js` checkout 제목 | `결제` | `주문·결제` |
| `screens.js` totalLabel | `결제 예정(표시가·서버 재검증)` | `예상 결제 금액` |
| `screens.js` note | `...결제 직전 서버가 재검증합니다` | `...결제 직전 서버가 최종 확인합니다` |
| `router.js:61` | `결제` | `주문·결제` |
| storefront totalLabel | `결제 예정(표시가·서버 재검증)` | `예상 결제 금액` |
| storefront note | `...표시가는 참고이며 결제 직전 서버가 재검증합니다` | `...결제 직전 서버가 최종 확인합니다` |

## 캡처

| 파일 | 폭 | SHA-256(16) |
|---|---|---|
| **before/** | | |
| prime-badge-1280 | 1280 | `0f9f272e5c679636` |
| prime-badge-390 | 390 | `4b1d47bf41148ab8` |
| prime-nobadge-1280 | 1280 | `4ab213e1409e8289` |
| prime-nobadge-390 | 390 | `b9e354d67d5385ee` |
| pick-badge-1280 | 1280 | `39eeec0ef521b67b` |
| pick-badge-390 | 390 | `87820729c2ec9be1` |
| pick-nobadge-1280 | 1280 | `84730566e88105d9` |
| pick-nobadge-390 | 390 | `5a7e1ba544ae8220` |
| **after/** | | |
| prime-badge-1280 | 1280 | `1d15afe3999c70f5` |
| prime-badge-390 | 390 | `5c81d774ceca2cfb` |
| prime-nobadge-1280 | 1280 | `1c804c869fde4b63` |
| prime-nobadge-390 | 390 | `45fba149d0d4a24b` |
| pick-badge-1280 | 1280 | `9b4eb34bf04a2977` |
| pick-badge-390 | 390 | `5094a7cae877541b` |
| pick-nobadge-1280 | 1280 | `66b1ac1cbd7cd4ec` |
| pick-nobadge-390 | 390 | `2a20334431f98d1e` |

모든 해시 상이 ✓

## 수정 파일

1. `preview/home-ui/src/styles/plans-store.css`
2. `preview/home-ui/src/plans/shell.js`
3. `preview/home-ui/src/plans/order-blocks.js`
4. `preview/home-ui/src/plans/screens.js`
5. `preview/home-ui/src/plans/router.js`

## 검수

- [ ] 사용자 승인 대기
