# 유료상품 Shell · B안 구현 치수 가이드 (잠금 메모)

작성: 2026-09-18 KST  
성격: **Cursor 구현용 수치 SSOT** · 정책/가격/IA/라우트 변경 없음  
추천안: **B안** — 상품홈만 Shell 풀폭 시네마 · 그 아래 좌메뉴+본문 warm canvas · 우레일/footer white  
근거 Shell: live-adopted `paid-storefront-shell-fit` FACT (`32+160+24+800+8+224+32=1280`)  
카드 FACT: period **138×200**(반올림 137.6) · ticket **229×241** · panel content **762** (body 800 안 page pad)

> 라벨: **LOCK** = 구현 고정 · **FACT** = 기존 실측 · **SPEC** = B안용 신규 잠금(샘플로 검증)

---

## 1) A/B 비교 결론

| | A · inner warm panel | B · paid body warm canvas |
|--|--|--|
| warm 범위 | 중앙 body **안쪽** 큰 패널만 | **좌메뉴 열 + body 열**(갭 포함) 전체 바탕 |
| 좌메뉴 | warm 밖 또는 동일 톤에 묻힘 | warm 위 **white surface 박스** |
| 우레일 | white | white **유지(손대지 않음)** |
| footer | 기존 | white/기존 **유지** |
| 중첩 | warm panel + 흰 카드 = 이중 박스 | canvas 위 카드만 → 피로↓ |
| 판정 | 비채택(대조용) | **채택** |

---

## 2) 최종 추천안 (단일)

1. 전역 사이트 바탕 = **white** (`--uds-bg` / page white).
2. **상품홈만** GNB 아래 **Shell full-width 시네마 hero** (좌메뉴·바디·레일 열을 가로지름).
3. 시네마 **아래부터** Type B 열 재개: nav 160 · gap 24 · body 800 · gap 8 · rail 224.
4. 그 구간에서 **warm canvas** = nav열+gap+body열만 칠함. **rail열·footer는 white**.
5. 좌메뉴 = warm 위 **white card** (radius 12 · 1px Line).
6. 노출/쪽지권 상세 = 시네마 **없음** · compact intro · 구매 UI 주연 · 주문요약은 우레일.
7. 홈 = 안내 허브(진입 카드 2 + 이용중 텍스트 링크).

---

## 3) 레이아웃 치수표

### 3.1 데스크톱 · 기준 뷰포트

#### @1440 (LOCK 기준 뷰)

| 항목 | px | 근거 |
|------|---:|------|
| viewport | **1440** | 표준 데스크톱 검수폭 |
| 전체 shell width (border-box) | **1280** | FACT live/shell-fit |
| shell 좌우 바깥 여백 | **80** each | `(1440−1280)/2` |
| shell 좌우 padding (gutter) | **32 / 32** | FACT · inner row 1216 |
| 좌메뉴 width | **160** | FACT |
| nav → body gap | **24** | FACT |
| body width (track) | **800** | FACT `1fr` |
| body → right rail gap | **8** | FACT |
| right rail width | **224** | FACT |
| 공식 | `32+160+24+800+8+224+32=1280` | LOCK |
| **warm canvas 시작** | shell content 좌측 = nav 열 왼쪽 엣지 | SPEC · gutter 32 안쪽 |
| **warm canvas 끝** | body 열 오른쪽 엣지 | SPEC · **rail gap·rail 미포함** |
| warm canvas 폭 | **984** | `160+24+800` LOCK |
| warm canvas 세로 | 시네마 **아래** ~ footer **위** | SPEC |
| warm canvas 내부 padding (열 바깥) | **0** (열 그리드가 담당) | SPEC · 이중 패딩 금지 |
| 좌메뉴 white box 내부 pad | **8 / 8** 가로 · 세로 **12~16** | FACT shell-fit nav pad 계열 |
| body `.page` 좌우 pad | **18 / 18** | FACT → content **762** |
| footer 전환 전 bottom spacing | **48** (`--s-6`) | LOCK 토큰 · footer mt와 맞춤 |
| footer | white/기존 규격 · **미변경** | LOCK |

#### @1280 (shell = viewport에 맞춤)

| 항목 | px | 근거 |
|------|---:|------|
| viewport / shell | **1280 / 1280** | shell max |
| 바깥 여백 | **0** | |
| gutter | **32 / 32** | LOCK 유지 |
| nav / gap / body / gapRail / rail | **160 / 24 / 800 / 8 / 224** | LOCK 동일 |
| warm 폭 | **984** | 동일 |
| 비고 | 열 폭 축소 금지. 가로 스크롤 나면 body만 `min-width:0` + 카드 스크롤 | SPEC |

#### @1024 (태블릿)

| 항목 | px | 근거 |
|------|---:|------|
| shell | **min(1024, 100%)** · 실질 content ≈ viewport−0 | |
| gutter | **24 / 24** (`--s-3`) | SPEC · 32→24로 한 단 축소 |
| nav | **160** 유지 또는 **144** (최소) | SPEC · 160 우선, 공간 부족 시 144 |
| nav→body gap | **16** | SPEC |
| rail | **224** 유지하되 body `1fr` 축소 | |
| body | `1fr` (잔여) | |
| body→rail gap | **8** | LOCK |
| warm | 여전히 **nav+gap+body만** | LOCK 원칙 |
| 비고 | rail sticky 해제 가능(≤960 기존 규칙과 정합 시 static) | 기존 5A 960 규칙 준용 |

#### @390 (모바일)

| 항목 | px | 근거 |
|------|---:|------|
| shell | **100%** (390) | |
| gutter | **16 / 16** | LOCK `--s-2` |
| 열 구조 | **세로 스택** nav → body → rail | LOCK |
| nav | 폭 100% · white card · 높이 auto | |
| body | 100% | |
| rail | 100% · white · sticky 해제 | |
| warm canvas | **nav+body 구간만** 세로로 연속 칠함. rail 블록은 white | SPEC |
| hero | 가로 100% · 높이 아래 hero표 | 홈만 |
| 기간/티켓 카드 | 가로 스크롤 또는 1열 | period 다열 강제 금지 |

---

## 4) 상품홈 hero 규격

| 항목 | 값 | 근거 |
|------|-----|------|
| 범위 | **Shell full-width** (1280 border-box 안 · gutter 포함 영역 전체). **body full-width 아님** | LOCK · 좌메뉴·레일 열까지 breakout |
| warm과의 관계 | 시네마는 **warm 밖(위)**. warm은 **hero 아래부터** 시작 | LOCK |
| hero height (콘텐츠 박스) | **280** @≥1280 · **240** @1024 · **200** @390 | SPEC · 홈 1포인트용. 과도한 500+ 금지 |
| hero 내부 padding | **32 / 40** (가로 `--s-4` / 세로 `--s-5`) @≥1280 · @390 **16 / 24** | SPEC |
| eyebrow | FS-12 · 500 · Primary 또는 on-dark soft | |
| title | FS-28 @≥1280 · FS-22 @390 · weight 700 · max-width **720** | 본문 토큰 |
| body/lead | FS-14~16 · max-width **640** · lh 1.5 | |
| CTA block | Primary 1 + Secondary/Ghost 1 · gap **12** · 버튼 높이 **40**(데스크톱)/**44**(모바일) | |
| CTA/title 블록 폭 | max **720** · 좌측 정렬(Shell 좌 gutter 기준) | SPEC |
| hero → 첫 섹션(열 그리드) 간격 | **32** (`--s-4`) | SPEC |
| 배경 | Primary 계열 solid 또는 **약한** geometric (과한 gradient 금지) | |

---

## 5) 상세 상단 규격 (노출상품 · 쪽지권 공통)

| 항목 | 값 | 근거 |
|------|-----|------|
| 시네마 | **없음** | LOCK |
| compact intro 높이 (콘텐츠) | **112~136** (eyebrow+제목+1줄+칩 포함) | SPEC · 구 page-hero ~173보다 축소 |
| intro 내부 pad | **0** 상단(섹션 시작) · 하단 **0** · 칩까지 포함 후 섹션 gap으로 분리 | |
| eyebrow → 제목 | **8** | |
| 제목 → 설명 | **8** | |
| 설명 → 칩 행 | **12** | |
| intro → 첫 구매 섹션 | **24** (`--s-3`) | SPEC · 답답함 해소 핵심 |
| 제목 | FS-22 또는 18 · 700 | 상세는 28/36 금지(홈과 차별) |
| 설명 | FS-14 · 1줄 · muted | |
| 칩 | h **28~32** · FS-12 · radius 6~999 pill | |
| 답답하지 않은 기준 | intro 블록 ≤ **140** 높이 · intro 아래 **≥24** 여백 · 첫 구매 섹션 제목이 폴드 내 조기 노출 | SPEC |

---

## 6) 카드 크롬 규격

| 항목 | 값 | 근거 |
|------|-----|------|
| section card padding | **22** (기존 panel) · 최소 **18** | FACT 22 |
| card(섹션) gap 세로 | **16~24** (`--s-2`~`--s-3`) | SPEC |
| card radius | **12** (`--r-card`) | LOCK |
| border | **1px** `--paid-line` / `--uds-line` | LOCK |
| 선택 강조 | border **2px** Primary 또는 1px+ring · fill 남발 금지 | |
| period card W×H | **138 × 200** (FACT 137.6→**138**로 잠금) | FACT |
| period card pad | **12** | FACT |
| period grid | 5열 · 가로 스크롤 허용 · track 합≈720 | FACT |
| ticket card W×H | **229 × 241** | FACT |
| ticket card pad | **16** | FACT |
| ticket grid | 3열 · gap ≈ **14** (716 안에 3×229) | FACT 유도 |
| 진입 카드(홈 2장) min H | **160** · pad **20~22** · 1fr 2열 gap **16** | SPEC |
| 주문요약 card width | rail **224** 내부 · pad **16** · content ≈ **192** | rail FACT |
| 주문요약 sticky | `min-width: 961px` 에서만 sticky · top **16~24** | 5A 규칙 준용 |
| 본문 안 거대 warm 래퍼 | **B안에서 삭제** | SPEC |

Warm 토큰: `--paid-bg: #F6F1E8` (또는 동등 soft ivory). **채도↑ 금지.**

---

## 7) 홈에서 제거 / 상세에 남길 요소

### 홈에서 제거
- Prime/Pick 기간 선택 UI · 배지 선택 · 적용대상 폼
- 주문요약 · 구매 CTA · occupancy/예약대기 · Pick 미리보기
- 긴 환불/이용 매뉴얼 · 이용중 **카드/프라이머리 버튼**
- 상세급 시네마 복제(홈에만 시네마)

### 홈에 남김
- Shell 풀폭 시네마 · 짧은 카피 · 진입 카드 **2**(노출/쪽지권)
- 이용중 **텍스트 링크** · 짧은 이용법 · 무료/유료 요약 1 · FAQ/문의

### 상세에 남김/주연
- compact intro · Basic 안내 · Prime/Pick 또는 쪽지 수량 카드
- 배지·적용대상(노출) · 주문요약+구매 CTA(**우레일**) · 환불 accordion

---

## 8) Cursor 구현용 가이드 메모 (체크리스트)

```text
[ ] page bg = white
[ ] home: hero = position full shell width 1280; height 280; pad 32×40; below gap 32
[ ] home: warm starts AFTER hero; width 984 = nav+gap+body; rail column NOT warm
[ ] home: left nav = white r12 card on warm
[ ] home: right rail = white (unchanged role)
[ ] home: footer = white/existing
[ ] home: 2 entry cards only; 이용중 = text link
[ ] detail: NO cinema; intro ≤136px; gap to first purchase section = 24
[ ] detail: period 138×200; ticket 229×241; section pad 22; radius 12; border 1
[ ] detail: order summary in rail 224; sticky ≥961 only
[ ] shell @1440: 32+160+24+800+8+224+32=1280
[ ] @390: stack nav→body→rail; warm on nav+body only; gutter 16
[ ] no policy/price/IA/route changes
```

### CSS 스케치 (의미 고정용 · 복붙 전제 아님)

```css
/* shell row */
.paid-shell { max-width: 1280px; margin-inline: auto; padding-inline: 32px; }
.paid-shell__row { display: grid; grid-template-columns: 160px 24px 1fr 8px 224px; }
/* warm only under nav+body — implement via background on a wrapper
   spanning columns 1–3, or separate bg layer width: 984px; */
.paid-warm { background: #F6F1E8; } /* nav+body region */
.paid-nav-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.paid-rail { background: #fff; } /* no warm */
.home-cinema { width: 100%; /* of 1280 shell */ min-height: 280px; }
```

---

## 9) 출처

- Shell FACT: `paid-storefront-shell-fit/MEASUREMENTS.md`
- 카드 FACT: 동 문서 §5 period 137.6→138 lock, ticket 229.3→229
- 역할 잠금: 상품홈 허브 · 상세 구매 · B canvas · 시네마 홈 전용
