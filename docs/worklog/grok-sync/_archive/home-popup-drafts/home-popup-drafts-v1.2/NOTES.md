# 홈 팝업 드래프트 v1.2 — 노트

작성: 2026-09-23 (KST) · 우동공과(study114)  
기반: `home-popup-drafts-v1.1` (레이아웃·사이즈·bright-only·always-imprint) + **실로고 PNG lockup**

## 0. v1.1 → v1.2 변경 요약

| 규칙 | v1.1 | v1.2 |
|------|------|------|
| 로고 단위 | CSS 텍스트 `.brand-lockup` (「우」상자 + 「우동공과」) | **단일 `<img>`** — 연필핀 아이콘 + 「우동공과」 wordmark PNG |
| 풀 로고 | (해당 없음) | **2줄 「우리동네 / 공부방과외」 full logo는 1차 lockup으로 쓰지 않음** |
| watermark | 텍스트 「우동공과」 | faded `logo-wordmark.png` (또는 lockup) |
| 레이아웃/색 | A 420×480 · B 400×560 · C 560×360 · bright-only | **동일** |

v1 · v1.1 폴더·ZIP은 **수정하지 않음**.

---

## 1. 브랜드 잠금 단위 (lockup-one-unit — PNG)

```html
<img class="brand-lockup brand-lockup--md"
     src="assets/logo-lockup-pencil-wordmark-h64.png"
     alt="우동공과" height="48" />
```

**규칙**
- 연필/핀 아이콘이 **앞**, 「우동공과」 wordmark가 **뒤** — 한 장의 PNG.
- 이동·축소·확대는 이 `<img>` 하나에만. icon / word를 분리 배치·스케일 금지.
- full 2줄 로고(`logo-full.png`)는 팝업 1차 lockup으로 사용하지 않음.

**에셋 (복사본: `assets/`)**
| 파일 | 용도 |
|------|------|
| `logo-lockup-pencil-wordmark.png` | 마스터 lockup |
| `…-h40.png` / `…-h64.png` / `…-h80.png` | 코너·히어로·패널 사이즈 |
| `logo-wordmark.png` | soft watermark |
| `logo-icon-pencil.png` | 아이콘 단독 (필요 시) |

---

## 2. 항상 각인 (always-imprint)

| 유형 | lockup (단일 img) | watermark |
|------|-------------------|-----------|
| **A 공지** | 우상단 h≈28 (h40 asset) | body BR faded wordmark |
| **B 이벤트** | 히어로 h≈48 (h64) + 「Autumn Offer」 caption | cream body faded wordmark |
| **C 광고** | 좌측 민트 패널 h≈64 (h80) ONE | 우측 흰 콘텐츠 faint wordmark |

푸터 「오늘 하루 보지 않기」·흰 X·사이즈·팔레트는 v1과 동일.

---

## 3. 고정 사이즈 / 색 (변경 없음)

| 유형 | 레이아웃 | 크기 | 팔레트 |
|------|----------|------|--------|
| A | `layout-stack` | 420×480 | cream+amber |
| B | `layout-hero-stack` | 400×560 | coral/peach |
| C | `layout-split` | 560×360 | mint+teal |

사이트 셸 = UDX 블루 `#266BC4`. 네이비·차콜 패널 금지.

---

## 4. 파일 맵

- `a-notice.html` / `b-event.html` / `c-promo.html`
- `tokens.css` / `board.css` / `brand.css`
- `assets/` — lockup · wordmark · icon
- `shots/*.png` — 보드 + 카드 크롭
- `index.html` — 갤러리
