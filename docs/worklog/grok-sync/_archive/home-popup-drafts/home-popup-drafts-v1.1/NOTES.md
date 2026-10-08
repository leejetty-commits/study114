# 홈 팝업 드래프트 v1.1 — 노트

작성: 2026-09-23 (KST) · 우동공과(study114)  
기반: `home-popup-drafts-v1` (레이아웃·사이즈·팔레트 유지) + **브랜드 각인 규칙**

## 0. v1 → v1.1 변경 요약

| 규칙 | v1 | v1.1 |
|------|----|------|
| 로고 단위 | C 광고에서 `.promo-mark`(「우」)와 `.promo-brand`(「우동공과」)가 **독립 블록** | **한 덩어리** `.brand-lockup` — mark+word가 같은 부모에서만 움직임 |
| 브랜드 노출 | 공지 A는 브랜드 없음 · 이벤트 B는 느슨한 텍스트 「우동공과 Autumn Offer」 | **모든 팝업에 우동공과 각인** — corner lockup 및/또는 soft watermark |
| 레이아웃/색 | A 420×480 cream+amber · B 400×560 coral · C 560×360 mint+teal | **동일** (bright-only, 네이비/다크 패널 금지) |

v1 폴더·ZIP은 **수정하지 않음**. 이 폴더는 변형(variant) 드래프트.

---

## 1. 브랜드 잠금 단위 (lockup-one-unit)

```html
<div class="brand-lockup" aria-label="우동공과">
  <span class="brand-lockup__mark">우</span>
  <span class="brand-lockup__word">우동공과</span>
</div>
```

**규칙**
- mark + wordmark는 **하나의 원자(atom)**. flex row · gap 6–8px · align center.
- mark만 단독으로 스타일링·배치·스케일하지 말 것. 반드시 `.brand-lockup` 안에서 word와 함께.
- 이동·축소·확대는 `.brand-lockup` 전체에만 적용.

**금지 (v1 C의 문제)**
- `.promo-mark` + `.promo-brand`처럼 「우」 상자만 떨어뜨려 두는 구조.

---

## 2. 항상 각인 (always-imprint)

사용자가 카드를 보는 동안 **어딘가에 우동공과가 보여야** 한다.

선택지 (병행 가능)
1. **Corner / hero lockup** — 작은·중간 `.brand-lockup`
2. **Soft watermark** — `.brand-watermark` (약 10–14% opacity, pointer-events none, 카드 overflow hidden)

### 유형별 배치 (조금씩 다르게, 모두 각인 충족)

| 유형 | lockup | watermark |
|------|--------|-----------|
| **A 공지** | 우상단 소형 (닫기 왼쪽) | 카드 우하단 매우 옅게 |
| **B 이벤트** | 히어로 안 lockup + 바깥 sibling 「Autumn Offer」 caption | cream 본문 쪽 soft watermark |
| **C 광고** | 좌측 민트 패널에 **ONE** lockup만 (orphan 「우」 제거) | 우측 흰 콘텐츠 하단 faint (optional) |

푸터 「오늘 하루 보지 않기」·흰 X·사이즈·팔레트는 v1과 동일.

---

## 3. 고정 사이즈 (v1과 동일)

| 유형 | 레이아웃 | 고정 크기 |
|------|----------|-----------|
| A 공지 | `layout-stack` | **420 × 480** |
| B 이벤트 | `layout-hero-stack` | **400 × 560** |
| C 광고 | `layout-split` | **560 × 360** |

모바일 공통: `max-width: min(100vw - 32px, card-width)` · `max-height: 80vh` · 내부 스크롤.

---

## 4. 색 분리 (bright-only, 변경 없음)

사이트 셸 = UDX 블루 `#266BC4`. 팝업 = 카테고리 밝은 액센트. 네이비·차콜·근흑 패널 금지.

| 유형 | 카드/패널 | CTA |
|------|-----------|-----|
| A | cream `#FFFBF5` + amber | ochre `#92400E` |
| B | coral/peach hero + cream body | coral `#E86B4A` |
| C | soft mint 좌 + 흰 우 | teal `#14B8A6` |

---

## 5. 파일 맵

- `a-notice.html` / `b-event.html` / `c-promo.html` — 1440×900 보드
- `tokens.css` / `board.css` / **`brand.css`** (lockup · watermark)
- `shots/*.png` — 보드 전체 + 카드 크롭
- `index.html` — 갤러리 (v1.1 라벨)
