# MOBILE-GNB-ABC-REPORT

> 비교 의견서 · **잠금 아님** · Stage 5B **HOLD** · 최종 GNB 미선택 · v1.0 미선언  
> build_id: `mobile-gnb-abc-20260910T1639Z` · 폭: 430 · 390 · 360 · 2026-09-10 KST

## 1. 배경
기존 모바일 GNB는 가로 나열 + `overflow-x:auto`로 **clip / h-scroll FAIL**(GATE-AUDIT RSP4, plans badge multi `scroll_disclosure`).  
본 팩은 대체 방향 A/B/C만 정적 비교한다.

## 2. 공통 측정 (default @360/390/430)
| Variant | headerHeight | firstContentY | hScroll | touch44 |
|---------|-------------:|--------------:|:-------:|:-------:|
| A | 56 / 56 / 56 | 56 / 56 / 56 | no | pass |
| B | 57 / 57 / 57 | 57 / 57 / 57 | no | pass |
| C | 56 / 56 / 56 | 56 / 56 / 56 | no | pass |

동일 데모 본문 사용. header 높이 토큰을 정책으로 잠그지 않음(관찰값).

## 3. Variant A — Logo + Hamburger
### Pros
- 닫힌 상태 최단 헤더·정보 밀도 낮음 → 360에서도 여유
- 전체 IA(기존 라벨)를 드로어에 수용, 긴 목록은 세로 스크롤
- 닫기·햄버거 ≥44×44 확보 용이
- guest/logged 유틸 슬롯을 상단에 두어도 코어 내비와 경합 적음

### Cons
- 현재 위치는 닫힌 상태에서 라벨 슬롯(`state=current`) 또는 드로어 내부 의존 → 한 손 탐색 시 단계 +1
- 오픈 시 본문 커버(의도) — 맥락 유지·비교 쇼핑 UX에 부담 가능
- 역할 스트레스 시 드로어 길이 증가(세로 스크롤 필요)

### Risks
- 햄버거 발견성(어포던스) · 메뉴 IA 정보 구조 설계 품질에 종속
- “현재 위치”를 상단 크로메에 항상 둘지 제품 결정 필요(본 팩은 비교 상태만)

### Fit / Caution screens
- **Fit:** 탐색 빈도 낮은 유틸·긴 IA, 콘텐츠 우선 홈/리스트
- **Caution:** 탭 전환이 매우 잦은 핵심 3~5개 목적지

### 판정
**PASS**(본 비교 팩 측정 기준: no h-scroll / touch / 계층) · 제품 채택은 **미판정**

### 추천 랭크: **2**
근거(의견): 안정적 해법이지만 핵심 이동 비용이 B/C보다 큼.

## 4. Variant B — Core + More (비교 가정 IA)
> 코어 예: 홈·찾기·커뮤니티 + 더보기 — **최종 IA 아님**

### Pros
- 핵심 목적지 1탭 도달
- 더보기로 나머지 IA 수용 → 360에서 가로 나열 FAIL 회피 가능
- more-current 상태로 “더보기 안 현재 위치” 표현 가능

### Cons
- 코어 선정 자체가 제품 결정(본 팩은 가정)
- 360에서 로고+코어+더보기+유틸 동시 배치 시 밀도 위험 → 유틸은 guest/logged에서 아이콘 슬롯으로 완화(비교용)
- more-current 시 힌트/시트 의존

### Risks
- 잘못된 코어 선정 시 이탈·더보기 과다
- 라벨 길이(한국어)로 360 밀도 재발 가능

### Fit / Caution
- **Fit:** 핵심 3개 전후가 분명한 서비스
- **Caution:** 핵심이 자주 바뀌거나 동등 가중 메뉴 ≥5

### 판정
**PASS**(비교 팩 측정) · IA 채택 **미판정**

### 추천 랭크: **1**
근거(의견): FAIL 원인(가로 나열)을 직접 줄이면서 핵심 이동성을 유지. 단, 코어 IA는 별도 승인 필요.

## 5. Variant C — Top logo + Bottom nav
### Pros
- 하단 탭으로 현재 위치·라벨+아이콘 가시성 양호(본 팩 샷)
- 상단은 로고/계정에 집중 → 역할 분리 명확
- safe-area·body bottom padding으로 본문 하단 커버 완화 가능

### Cons / Risks
- **상세 sticky CTA와 하단 내비 충돌** — 측정 `ctaClash=true` @360/390/430 → **HOLD(위험 노출)**  
  CTA를 숨기거나 수정 정책을 발명하지 않음(지시 준수).
- 하단 탭 슬롯 수 제한 → “더보기” 또는 정보 구조 압축 필요
- 역할 스트레스 시 라벨 길이로 10px대 폰트 밀도 상승

### Fit / Caution
- **Fit:** 앱형 주요 탭 4~5개 고정 IA
- **Caution:** 상세·결제·신청 등 sticky CTA가 있는 화면(충돌 해소 정책 별도 필요)

### 판정
기본 상태 **PASS** · `detail-cta` **HOLD**(충돌 RISK) · 채택 **미판정**

### 추천 랭크: **3**
근거(의견): 패턴 자체는 유효하나 기존 sticky CTA와의 충돌이 미해결이라 단독 채택 보류.

## 6. 종합
| Rank | Variant | 한줄 |
|-----:|---------|------|
| 1 | B | 핵심 도달 + clip 회피 — IA 가정 승인 전제 |
| 2 | A | 안전·확장 — 이동 비용 |
| 3 | C | 탭 UX 양호 — **CTA 충돌 HOLD** |

### Final (잠금 아님)
- **모바일 GNB 선택: 미정(undecided)**
- **Stage 5B: HOLD**
- **디자인 매뉴얼 v1.0: 미선언**
- C CTA conflict: **YES** (`ctaClash=true`, bottomBarHeight≈56)
- STOP — 승인 전 다음 단계 자동 진입 없음
