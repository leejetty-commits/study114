# Part C — 우측 레일 모바일 아코디언 v2 (div+button 방식)

**과제ID:** part-c-rail-accordion-v2  
**날짜:** 2026-11-07  
**브랜치:** `feat/part-c-rail-accordion-v2`

---

## 지시서

> Part C 재설계 방안을 검증하고, 성공할 방안으로 구현하라.  
> 데스크톱 웹사이트에 절대 영향을 끼치면 안 된다. 모바일 최적화 작업이다.  
> 코드를 덧붙이는 방식보다 근본적인 방안으로 코딩하라.

---

## 왜 이전 방식이 실패했는가

| 방식 | 실패 원인 |
|---|---|
| `<details>` 태그 (PR #101) | `open` 속성 없을 때 브라우저 UA 스타일시트가 `content-visibility: hidden` 강제 적용. HTML 스펙 레벨 — CSS로 우회 불가. 데스크톱에서도 패널이 숨겨짐 → Revert |

---

## 근본 해결 — div+button+matchMedia

### HTML 구조

```html
<aside class="home-sidebar home-sidebar--guest home-sidebar--live-rail right-rail rail-accordion ...">
  <!-- 데스크톱: CSS로 display:none, 모바일: 표시 -->
  <button type="button" class="rail-accordion__toggle" aria-expanded="false" aria-controls="rr-panel-1">
    <strong class="rail-accordion__label">오늘의 안내</strong>
    <span class="rail-accordion__chevron" aria-hidden="true"></span>
  </button>
  <!-- 데스크톱: CSS로 항상 display:flex (is-open 무관), 모바일: 기본 display:none -->
  <div class="rail-accordion__panel" id="rr-panel-1">
    <!-- 기존 레일 슬롯들 -->
  </div>
</aside>
```

### CSS 원칙

```
≥1024px:
  .rail-accordion__panel { display: flex; }     ← 미디어쿼리 없음 → 항상 표시
  .rail-accordion__toggle { display: none; }    ← 버튼 항상 숨김

≤1023px:
  .rail-accordion__toggle { display: flex; }    ← 버튼 표시
  .rail-accordion__panel { display: none; }     ← 기본 숨김
  .rail-accordion.is-open > .rail-accordion__panel { display: flex; }  ← 열렸을 때만 표시
```

**핵심:** ≥1024px 패널은 JS와 `is-open` 클래스에 완전히 무관. CSS 단독으로 항상 표시.

### JS 로직

```javascript
function applyState(isMobile) {
  if (isMobile) {
    accordion.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    accordion.classList.add('is-open');  // 데스크톱: 패널은 CSS로 이미 표시, aria 정합성용
    toggle.setAttribute('aria-expanded', 'true');
  }
}
// matchMedia 감시 + 클릭 토글
```

---

## 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `preview/home-ui/src/right-rail.js` | `<details>` 로직 완전 제거, `railAccordionSeq` 추가, `renderPromoWithRightRail` 아코디언 구조로 재작성, `bindRailAccordion` 추가, `bindRightRailEvents`에서 호출 |
| `preview/home-ui/src/styles/home-right-rail.css` | ≤480px `display:none` 제거, 아코디언 CSS 추가 |

---

## 검수

| 항목 | 결과 |
|---|---|
| 빌드 에러 | ✅ 없음 (`npm run build:dothome`) |
| ShopPage gate | ✅ 71/71 통과 |
| `<details>` 코드 | ✅ 완전 제거 (주석만 존재) |
| 데스크톱 패널 CSS 보호 | ✅ `@media` 없는 `.rail-accordion__panel { display: flex }` — `is-open` 무관 |

---

## 승인 대기

- 커밋: `625a0045` (브랜치 `feat/part-c-rail-accordion-v2`)
- push: 완료
- 승인자: 사용자 (대기 중)
