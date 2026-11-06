# 80b · 모바일 히어로 맵 회색 여백 제거 — 원인·실패·해결 기록

> 작성 2026-11-07 · 연관 정본: `docs/internal/80-mobile-responsive-proposal.md`

---

## 요약

모바일(≤719px)에서 히어로 맵 아래 회색 여백이 발생. PR #91~#96(이전 세션 6회) + PR #97~#99(이번 세션 3회) 총 9회 시도 끝에 해결.

**최종 해결 커밋:** `a20617d9` (PR #99, 2026-11-07)  
**수정 파일:**
- `preview/home-ui/src/styles/design-system.css`
- `preview/home-ui/src/styles/home.css` (band-aid 제거)

---

## 1. 근본 원인 (3가지 복합)

### ① CSS import 순서 — override 불가 구조

```
home-ui/src/main.js:
  import './styles/home.css';          // 2번째
  ...
  import './styles/design-system.css'; // 15번째 (나중)
```

`design-system.css`가 `home.css` **이후에** 로드된다.  
같은 선택자·같은 `!important`이면 **나중에 로드된 파일이 이긴다.**  
→ PR #95~#96에서 `home.css`에 override를 넣어도 모두 `design-system.css`에 덮여 무효.

### ② 모바일 breakpoint에 `height` 없음 → `height:100%` 체인 붕괴

| 구간 | design-system.css 설정 |
|---|---|
| ≥720px | `min-height` **+** `height: calc(17rem+110px) !important` |
| ≤640px (구) | `min-height: calc(9rem+110px)` **만**, `height` 없음 |

`.naver-map-mount { height: 100% }` → 부모에 explicit `height` 없으면 → `auto` = 사실상 0  
→ 네이버 맵 SDK가 0px 또는 아주 작은 높이로 렌더링  
→ 나머지 영역이 `.hero-map--float-rail`의 배경색 `#e8eef3`(회색)으로 노출

### ③ `.hero-map--float-rail`의 `overflow: hidden`

```css
/* search-visily.css */
.hero-map--float-rail {
  overflow: hidden;  /* ← 핵심 */
  background: #e8eef3;
}
```

모바일(≤719px)에서 `.hero-map__banner`(대치동 박스)는 `position: relative`(flow)로 전환됨.  
Wrapper 섹션(`.hero-map`)에 `height` 고정값이 걸리면 banner가 그 아래로 밀려나  
`overflow: hidden`에 의해 클리핑 → 보이지 않음.

---

## 2. HTML 구조 (변경 없음)

```html
<section class="hero-map hero-map--float-rail" ...>
  <div class="hero-map__canvas">           <!-- 맵 컨테이너 -->
    <div class="hero-map__surface hero-map__surface--naver">
      <div class="naver-map-mount-host" data-naver-map-mount></div>
    </div>
  </div>
  <aside class="hero-map__banner" ...>     <!-- 대치동 박스, canvas의 형제 -->
    ...
  </aside>
</section>
```

- **데스크톱**: banner → `position: absolute` (맵 위에 떠 있음)
- **모바일(≤719px)**: banner → `position: relative` (flow, canvas 아래에 쌓임)

Banner의 position 전환 기준: `search-visily.css @media (max-width: 719px)`

---

## 3. 실패 이력

### 이전 세션 PR #91~#96 (전부 home.css에서 override 시도 → 무효)

| PR | 접근 | 실패 이유 |
|---|---|---|
| #91 | 아코디언 토글 JS | 접으면 회색만 남음 |
| #92 | 기본 펼침 + min-height override | home.css → design-system이 덮음 |
| #93 | localStorage + 추가 override | 동일 |
| #94 | `display:none` 방식 | 동일 |
| #95 | 토글 전체 제거 + `min-height:0` | 동일 |
| #96 | home.css에 `min-height:9rem !important` | 동일 — cascade 패배 |

### 이번 세션 PR #97~#99 (design-system.css 직접 수정, 단계적 수정)

| PR | 접근 | 결과 | 오류 |
|---|---|---|---|
| #97 | design-system.css `@media ≤640px → ≤719px`, `height:9rem` wrapper+canvas 모두 | 회색 제거 ✅, banner 소실 ❌, 세로폭 축소 ❌ | wrapper에 `height:9rem` → `overflow:hidden`이 banner 클리핑 |
| #98 | wrapper에서 `height` 제거 (min-height만), canvas `height:9rem` 유지 | banner 복원 ✅, 회색 없음 ✅, 세로폭 여전히 짧음 ❌ | canvas height `9rem=144px`이 너무 짧음 |
| #99 | canvas `height: calc(9rem+110px)=254px` 로 복원 | 전항목 ✅ | — |

---

## 4. 최종 해결책 (design-system.css)

```css
/* 모바일(≤719px): banner가 position:relative(flow)로 전환되므로
   +110px 불필요. canvas·surface에만 height 명시 → height:100% 체인 복원.
   섹션 wrapper(.hero-map)는 min-height만 — height 고정 시 overflow:hidden이
   배너(대치동 박스)를 클리핑하여 가림. */
@media (max-width: 719px) {
  /* wrapper: min-height만 (height 고정 금지) */
  .home-shell .hero-map,
  .search-chrome-shell .hero-map,
  .home-app .hero-map,
  .hero-map--search {
    min-height: calc(9rem + 110px) !important;
  }

  /* canvas·surface: height 명시 → 맵이 canvas를 채움 */
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

**핵심 원칙:**
1. `design-system.css`를 직접 수정 (home.css에서 override 불가 — import 순서)
2. Wrapper(`.hero-map`)와 canvas/surface를 **분리된 규칙**으로 적용
3. Wrapper: `min-height`만 → 자동 높이로 banner 포함
4. Canvas/surface: `height` 명시 → `height:100%` 체인 복원 → 맵 채움
5. Breakpoint `640px → 719px`: banner position 전환 기준과 일치

---

## 5. 미해결 — 지도접기/지도보기

PR #95에서 토글 기능 전체 제거됨 (JS + CSS). 현재 모바일에서도 지도 항상 표시.

- 사용자 결정: "더 강한 모델에게 맡기자" (2026-11-07)
- 구현 난이도: 중간 (네이버 맵 SDK가 `display:none` 상태에서 초기화 시 크기 0 → 펼칠 때 resize 필요)
- 참고: `docs/internal/80-mobile-responsive-proposal.md` §2-1 권장안 A

---

## 6. 건드리지 않은 것

- `naver-map.js` (맵 초기화·알고리즘) — 일체 미변경
- `search-map.js`, `guest-sections.js` (렌더러)
- 데스크톱(≥720px) 레이아웃 — PR #97~#99 모두 무영향 확인

---

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-11-07 | 문서 작성 (PR #97~#99 완료 후) |
