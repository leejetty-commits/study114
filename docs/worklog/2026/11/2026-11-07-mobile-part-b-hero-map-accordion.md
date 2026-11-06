# Part B — 히어로 맵 아코디언 (모바일 ≤719px)

- **과제**: 모바일 반응형 Part B — 히어로 맵을 아코디언으로 접기
- **정본**: `docs/internal/80-mobile-responsive-proposal.md`
- **브랜치**: `mobile-hero-map-accordion`
- **날짜**: 2026-11-07

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `preview/home-ui/src/guest-sections.js` | 토글 버튼 HTML 추가, `data-hero-map-canvas` 속성 추가 |
| `preview/home-ui/src/styles/home.css` | 719px 미디어쿼리: 배너·토글·지도 order 재배치, 지도 접기/펼침 CSS |
| `preview/home-ui/src/layout.js` | `bindLayoutEvents()`에 히어로 맵 토글 이벤트 추가 |

## 동작

- **≥720px (PC)**: 변경 없음 — 기존 가로 배치(배너 왼쪽 + 지도 오른쪽) 유지
- **≤719px (모바일)**: 배너가 위, 「지도 보기 ▾」 토글 버튼, 지도는 접힌 상태 기본
  - 토글 터치 → 지도 펼침 (aspect-ratio 4:3, max-height 75vh)
  - 다시 터치 → 지도 접기

## 셀프검수

### 1회차 — PC 안전성
- ✅ 토글 버튼 `display:none` 기본값
- ✅ 719px 미디어쿼리 격리
- ✅ 기존 flex-direction/min-height 변경 없음

### 2회차 — 모바일 동작
- ✅ 배너 위, 토글 중간, 지도 아래
- ✅ 접기/펼침 토글 + 텍스트/화살표 전환
- ✅ 빌드 성공, ShopPage 가드 71/71 pass

## 위험도

- **낮음**: CSS 미디어쿼리 격리, JS 토글은 클래스 추가만

## 검수·승인

- [ ] 사용자 승인 (커밋 hash: ___________)
