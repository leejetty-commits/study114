# Part C — 우측 레일 아코디언 (≤1023px)

**날짜:** 2026-11-07  
**브랜치:** `cursor/part-c-rail-accordion-20261107`  
**연관 정본:** `docs/internal/80-mobile-responsive-proposal.md` §Part C

---

## 지시 원문

> 세번째 파트를 시작하자. 모바일만 최적화하는 것이다. 데스크탑 사이트는 데미지를 주면 안된다.

---

## 변경 내용

### 목표
≤1023px 화면에서 우측 레일을 접힌 아코디언으로 표시. 데스크톱(≥1024px) 사이드바 레이아웃 무손상.

### 수정 파일

**① `preview/home-ui/src/right-rail-store.js`**
- `home_right_rail`, `search_right_rail`, `register_right_rail`, `support_right_rail`
  → `mobileBehavior: 'stack'` → `'collapse'`
- 이제 모든 슬롯(6개)이 `mobileBehavior: 'collapse'`

**② `preview/home-ui/src/styles/home-right-rail.css`**
- **`C-11` 480px 숨김 블록 제거**: 아코디언으로 대체하므로 숨길 필요 없음
- **데스크톱 기본 스타일 추가** (미디어쿼리 밖):
  - `.plans-rail-fold > summary`: `display: none` → 사이드바에서 아코디언 헤더 숨김
  - `.plans-rail-fold > .plans-rail-fold__panel`: `display: flex` → 패널 항상 표시
- **`@media (max-width: 1023px)` 블록에 추가**:
  - `.home-sidebar.right-rail--mobile-collapse`: `display: flex` → 소형 화면에서도 보임
  - `.plans-rail-fold` 아코디언 UI (외곽 테두리, summary 헤더, ▾ 화살표, 패널 접기/펼치기)

### CSS cascade 설계
| 화면 | summary | panel |
|---|---|---|
| ≥1024px (기본) | `display: none` | `display: flex` (항상 표시) |
| ≤1023px (미디어쿼리) | `display: flex` (아코디언 헤더) | `display: none` (기본 닫힘) |
| ≤1023px + `[open]` | — | `display: flex` (열림) |

---

## 검수 항목

- [ ] ≥1024px: 사이드바 그대로, 아코디언 버튼 없음, 콘텐츠 모두 보임
- [ ] 481~1023px: 「현장 고민·안내 ▾」 접기/펼치기
- [ ] ≤480px: 숨김 → 아코디언 접힌 상태로 보임
- [ ] 고민방 팝업 정상 동작
- [ ] PC 사이드바 레이아웃 무손상

---

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-11-07 | 초안 작성 및 커밋 |
