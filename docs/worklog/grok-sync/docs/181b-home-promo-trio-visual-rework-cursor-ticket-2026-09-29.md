# 181b · Cursor — 홈 홍보 3칸 꾸밈 보완 (로컬) · 180 정본 직결

- 작성: 2026-09-29 · 우동공과2
- 기반: `1498d94` · **카피·톤 정본 = 180 e카탈로그 브리프 B-1/B-2/B-3** (막연한 「같은 계열」금지 · 아래 표 그대로)
- push · build:dothome · Notion 금지

## 0. 기능 잠금 (불변)

세 칸 제목·도착:
| 제목(잠금) | path |
|---|---|
| 내가 찾는 공부방 | `/promo/study-room` |
| 나의 과외쌤은 어디에? | `/promo/tutor` |
| 학생, 인재로 만들기 | `/promo/parent` |

게스트·parent·study_room·tutor 동일 · GNB「홍보」금지 · 시네마 회귀 금지 · home-popup 유지

## 1. Must — 미니 카드 데이터 (180에서 가져온 것 · 그대로 쓸 것)

각 칸 HTML: eyebrow + 제목 + 보조 한 줄 (+ 선택 포인트 바). **아래 문자열을 임의 축약·창작하지 말 것.**

### 공부방 칸 ← 180 B-1
- eyebrow: `우리동네 공부방`
- title: `내가 찾는 공부방` (홈 잠금 제목 유지)
- sub: `가까운 곳부터 비교하고, 등록은 가볍게 시작하세요`  
  (B-1 Hero H1·sub 압축: 덜 막막하게 · 기본 정보로 등록 시작)
- accent: `#266bc4`

### 과외쌤 칸 ← 180 B-2
- eyebrow: `우리동네 과외쌤`
- title: `나의 과외쌤은 어디에?`
- sub: `활동 지역·주력 과목으로 프로필을 분명하게`  
  (B-2 Hero H1 직결 축약 — 의미 보존)
- accent: 사이트 청록/녹 토큰 (없으면 `#0f766e`)

### 학생 칸 ← 180 B-3
- eyebrow: `학생 · 학부모 보조`
- title: `학생, 인재로 만들기`
- sub: `가까운 곳부터 비교하고, 쪽지로 시작하세요`  
  (B-3 Hero H1 직결 축약)
- accent: 사이트 앰버/코랄 토큰 (없으면 `#c2410c`)
- **유료·픽·프라임 문구 금지**

비주얼: 크림 종이 배경 · 둥근 카드 · 포인트 바 · hover · 3열/1열. live `/promo/study-room` 종이감. 시네마 큰 사진 금지.

## 2. Allowlist
- `home-marketing-banner.js` (HOME_PROMO_TRIO / renderHomePromoTrio만)
- `styles/home-marketing-banner.css` (.home-promo-trio*만)

## 3. 커밋 예
`fix(home): wire promo trio copy from 180 ecatalog briefs`
로컬만.
