# Cursor 구현 메모 — 유료상품 홈 v2.1

정책/가격/기간/라우트/권한 **변경 금지**. 홈 = 안내·진입 허브. 구매 UI는 상세에만.

## Shell LOCK

```
32 + 160 + 24 + 800 + 8 + 224 + 32 = 1280
```

v2.1은 gutter를 그리드 열로 올려 `padding-inline: 0` + 7열:

`[32 L][160 nav][24][800 body][8][224 rail][32 R]`

## Warm canvas 범위 (v2.1 NEW)

| 포함 | 제외 |
|------|------|
| **왼쪽 32px gutter** | 오른쪽 rail gap **8** |
| nav **160** | rail **224** |
| nav→body gap **24** | 오른쪽 gutter **32** |
| body **800** | footer / GNB / page white |

**Warm 폭 = 1016** (`32+160+24+800`). 토큰 `#F6F1E8`.

좌메뉴 = warm 위 **white card** (r12 · 1px Line).  
우레일 = **white** (역할 박스만 · 주문요약/구매 CTA 없음).

시네마는 warm **위**(밖). Warm은 시네마 **아래**부터.

## Hero (home only)

- Shell **full width** (7열 전체)
- h **280** @≥1280 · pad content **40×32**
- Soft abstract SVG (`assets/hero-soft.svg`) + left warm/blue readable overlay
- Title dark ink · CTA: Primary + Ghost (chips 대체)
- 상세 페이지에 시네마 복제 금지

## 홈 콘텐츠 계층

1. **메인 진입 2카드** — 노출상품 / 쪽지권 (min-h 160 · pad 20~22 · r12)
2. **홍보 배지 auxiliary** — 카드 **아래** · 한 단계 약한 정보 행 (작은 타입 · 연한 보더 · Primary CTA 없음)
3. 이용중 = **텍스트 링크만**
4. howto / 무료·유료 / FAQ

## 홈에서 금지

- 기간/횟수 선택 UI · 배지 선택 폼 · 적용대상 · 주문요약 · 구매 CTA
- 이용중 카드/Primary 버튼 · 긴 환불 매뉴얼

## 체크리스트

```
[ ] page bg white
[ ] cinema full shell · h280 · soft image + readable overlay
[ ] warm = left gutter + nav + gap + body (1016) · rail white
[ ] nav white card on warm
[ ] 2 entry cards + badge aux weaker below
[ ] 이용중 = text link
[ ] no purchase UI on home
[ ] no policy/price/IA/route invention
```
