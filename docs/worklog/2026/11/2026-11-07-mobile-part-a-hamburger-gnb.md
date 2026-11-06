# Part A — 햄버거 GNB (모바일 ≤899px)

- **과제**: 모바일 반응형 Part A — 수평 스크롤 GNB를 햄버거 드로어로 교체
- **정본**: `docs/internal/80-mobile-responsive-proposal.md`
- **브랜치**: `mobile-hamburger-gnb`
- **날짜**: 2026-11-07

## 지시서 원문

> 순서대로 작업을 진행한다. 한 파트를 할때마다 셀프검수를 정밀하게 2회하고 나에게 브리핑을 한다. 나의 승인 후에 다음 파트를 진행한다.

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `preview/home-ui/src/styles/home.css` | 햄버거 버튼 CSS, 드로어 패널/백드롭 CSS, 899px 미디어쿼리, `body.is-drawer-open` 스크롤 잠금 |
| `preview/home-ui/src/layout.js` | `renderHeader()`에 햄버거+드로어 HTML 추가, `openDrawer()`/`closeDrawer()` 함수, `bindLayoutEvents()`에 드로어 이벤트 바인딩 |
| `preview/shared/site-chrome.js` | `renderSiteHeader()`에 햄버거+드로어 HTML 추가, `openDrawer()`/`closeDrawer()` 함수, `bindSiteChrome()`에 드로어 이벤트 바인딩 |

## 설계 원칙

1. **CSS 미디어쿼리 격리**: `@media (max-width: 899px)` 안에서만 변화 → PC(≥900px) 무영향
2. **HTML `hidden` 속성**: 드로어는 `hidden` 기본값, JS가 토글 → PC에서 절대 표시 안됨
3. **양쪽 렌더러 동시 대응**: `site-chrome.js`(타 SPA) + `layout.js`(home-ui) 일관된 구조
4. **기존 GNB 유지**: `.home-gnb`(데스크톱)는 변경 없음, `.home-gnb-mobile`만 드로어로 교체

## 셀프검수

### 1회차 — PC 레이아웃 안전성
- ✅ `.home-hamburger` 기본 `display:none`
- ✅ 899px 미디어쿼리 격리
- ✅ `.home-drawer[hidden]` → `display:none !important`
- ✅ 기존 `.home-gnb`, `.home-header__util` 기본값 변경 없음
- ✅ 빌드 성공, ShopPage 가드 71/71 pass

### 2회차 — 모바일 동작 검증
- ✅ ≤899px: 햄버거 `display:flex`, `.home-gnb-mobile` + `.home-header__util` 숨김
- ✅ 드로어 열기/닫기: 햄버거 토글, ✕ 버튼, 백드롭 클릭, GNB 아이템, 유틸 아이템
- ✅ 스크롤 잠금: `body.is-drawer-open { overflow:hidden }`
- ✅ z-index 1500, 드로어 패널 `min(18rem, 85vw)`
- ✅ 접근성: `aria-label`, `aria-expanded` 토글

## 위험도

- **낮음**: CSS 미디어쿼리 격리로 PC 레이아웃에 영향 없음
- 원복: 브랜치 삭제로 즉시 원복 가능

## 검수·승인

- [ ] 사용자 승인 (커밋 hash: ___________)
