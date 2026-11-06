# 327 · 모바일 히어로 맵 회색 여백 제거 — 원인·실패·해결

> 작성 2026-11-07 KST · 상태: **완료**  
> 정본: `docs/internal/80b-hero-map-mobile-grey-fix.md`

---

## 현상

모바일(≤719px)에서 히어로 맵 아래 회색(`#e8eef3`) 여백이 화면 1/3 이상 차지.

---

## 근본 원인 (3가지 복합)

### 1. CSS import 순서 — override 불가 구조

```
home-ui/main.js:
  import './styles/home.css';          ← 2번째
  import './styles/design-system.css'; ← 15번째 (나중)
```

`home.css`에서 `design-system.css`를 `!important`로 override 시도해도  
**나중에 로드된 파일이 이기므로** 전부 무효. PR #91~#96 실패 원인.

### 2. 모바일 breakpoint에 `height` 없음 → `height:100%` 체인 붕괴

| 구간 | design-system.css |
|---|---|
| ≥720px | `min-height` **+** `height: calc(17rem+110px) !important` |
| ≤640px (구) | `min-height` **만** — `height` 없음 |

`.naver-map-mount { height: 100% }` → 부모에 explicit `height` 없으면 `auto` = 0  
→ 네이버 맵 SDK가 0px에 가깝게 렌더링 → 나머지 영역이 회색 배경으로 노출.

### 3. `.hero-map--float-rail`의 `overflow: hidden`

Wrapper 섹션에 `height` 고정 시, 모바일에서 flow 배치로 전환된 배너(대치동 박스)가  
`overflow: hidden`에 의해 클리핑 → 보이지 않음 (PR #97 사이드이펙트).

---

## 실패 이력

| PR | 접근 | 실패 이유 |
|---|---|---|
| #91~#96 | `home.css`에서 override | design-system.css가 나중에 로드 → 전부 무효 |
| #97 | design-system.css 직접 수정, wrapper+canvas 모두 `height:9rem` | wrapper height 고정 → overflow:hidden이 배너 클리핑 |
| #98 | wrapper에서 height 제거, canvas `height:9rem` | 9rem=144px 너무 짧음 |
| #99 | canvas `height: calc(9rem+110px)=254px` 복원 | ✅ 해결 |

---

## 최종 해결책 (design-system.css, PR #99, 커밋 `a20617d9`)

```css
@media (max-width: 719px) {
  /* wrapper: min-height만 (height 고정 금지 — overflow:hidden 배너클리핑) */
  .home-shell .hero-map,
  .search-chrome-shell .hero-map,
  .home-app .hero-map,
  .hero-map--search {
    min-height: calc(9rem + 110px) !important;
  }

  /* canvas·surface: height 명시 → height:100% 체인 복원 → 맵이 canvas 채움 */
  .home-shell .hero-map__canvas,
  .home-shell .hero-map__surface,
  .search-chrome-shell .hero-map__canvas,
  .search-chrome-shell .hero-map__surface,
  .home-app .hero-map__canvas,
  .hero-map--search .hero-map__canvas,
  .hero-map--search .hero-map__surface {
    min-height: calc(9rem + 110px) !important;
    height: calc(9rem + 110px) !important;
  }
}
```

**핵심:**
- `design-system.css` 직접 수정 (home.css에서는 override 불가)
- Wrapper와 canvas/surface를 분리된 규칙으로 적용
- Breakpoint `640px → 719px` (search-visily.css banner 전환 기준과 일치)
- Canvas/surface에만 `height` 명시 → `height:100%` 체인 복원

---

## 미해결

**지도접기/지도보기** (PR #95에서 제거됨, 이번 작업 대상 아님)  
→ 사용자 결정: "더 강한 모델에게 맡기자" (2026-11-07)  
→ 구현 시 주의: 네이버 맵 SDK가 `display:none` 상태에서 초기화 시 크기 0 → 펼칠 때 resize 필요

---

## 수정 파일 (최종)

| 파일 | 변경 |
|---|---|
| `preview/home-ui/src/styles/design-system.css` | ≤640px → ≤719px, wrapper/canvas 분리, height 추가 |
| `preview/home-ui/src/styles/home.css` | PR #96 band-aid 코드 제거 |
