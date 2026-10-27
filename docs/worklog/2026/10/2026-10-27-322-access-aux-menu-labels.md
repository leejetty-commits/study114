# 322 — 쪽지권 구매면 안내: 메뉴명 맞추기 + 강조

**지시서 원문**: `_local/directives/322-access-aux-menu-labels-emphasis.paste.md`
**브랜치**: `cursor/322-access-aux-menu-labels-20261027`
**RESTORE_BASE**: `8354babc` (origin/main)

## 지시 요점

`#/plans/access` 안내 박스가 실제 마이페이지 메뉴명과 다른 이름을 쓰고 있어 혼란.
실제 메뉴 이름(`구매이력`, `내 상품`, `쪽지·후기함`)에 맞추고 핵심어를 `<strong>`으로 강조.

## 수정 파일 (3개)

### 1. `preview/home-ui/src/plans/order-blocks.js` — `renderAccessAuxLinks()`

**Before**
```
보유 중인 쪽지권의 남은 횟수와 사용기한은 마이페이지의 내 상품에서 확인할 수 있습니다.
보낸 쪽지와 이어진 대화는 쪽지함에서 확인할 수 있습니다.
[내 쪽지권 보기] [쪽지함 보기]
```

**After**
```html
<p>보유 중인 쪽지권의 <strong>남은 횟수</strong>와 <strong>사용기한</strong>은 마이페이지 <strong>구매이력</strong>의 <strong>내 상품</strong>에서 확인할 수 있습니다.</p>
<p>보낸 쪽지와 이어진 대화는 <strong>쪽지·후기함</strong>에서 확인할 수 있습니다.</p>
[내 상품 보기] [쪽지·후기함 보기]
```

### 2. `preview/home-ui/src/plans/screens.js`

- L357 `renderLowCreditBanner`: 「내 쪽지권 보기」→「내 상품 보기」
- L1390 hold 배너: 「내 쪽지권 보기」→「내 상품 보기」

### 3. `preview/home-ui/src/styles/plans-store.css`

`.plans-access-aux strong { font-weight: 700; }` 추가 (색·밑줄·배경 없음).

## 검증 결과

```
# 옛 문구 0건 ✅
rg -n "내 쪽지권 보기|쪽지함 보기|마이페이지의 내 상품|쪽지함에서 확인" preview/home-ui/src/plans/order-blocks.js preview/home-ui/src/plans/screens.js
→ (0건)

# 새 문구 확인 ✅
rg -n "구매이력|쪽지·후기함 보기|내 상품 보기" preview/home-ui/src/plans/order-blocks.js
→ L523: 구매이력, 내 상품
→ L526: 내 상품 보기
→ L527: 쪽지·후기함 보기

# JS 구문 검사 ✅
node --check preview/home-ui/src/plans/order-blocks.js  → OK
node --check preview/home-ui/src/plans/screens.js       → OK

# diff --stat ✅
preview/home-ui/src/plans/order-blocks.js  | 8 ++++----
preview/home-ui/src/plans/screens.js       | 4 ++--
preview/home-ui/src/styles/plans-store.css | 4 ++++
```

## 잠금 확인

- 마이페이지 메뉴 라벨 변경 없음 (MYPAGE_NAV 미수정)
- 라우트·href·data-nav 변경 없음
- 가격·SKU·환불표·PG·Quiet Rail 미수정

## 위험도

낮음 — 문자열·CSS만 변경, 로직 없음.
