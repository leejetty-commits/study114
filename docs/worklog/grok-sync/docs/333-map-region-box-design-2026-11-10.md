# 333 지도 지역 요약 박스 디자인 조정 (2026-11-10 종현 확정)

시안: 박스 /workspace/yt/mock-F4.png (우동공과3 박스). 디자인만 변경, 로직 그대로.

## 대상
지도 위 지역 요약 박스 `aside.hero-map__banner`. 지도가 나오는 홈(#/guest 등)과 찾기 화면에 똑같이 적용.

## 범위 (이 파일만)
- 신규 `udong-symbol.svg` 1개 (홈·찾기 모두 `/assets/brand/udong-symbol.svg`로 열리는 위치, 실제 서빙 경로 확인)
- `preview/home-ui/src/styles/home.css` (공통 스타일)
- `preview/home-ui/src/guest-sections.js` (85~95줄 박스 마크업)
- `preview/search-ui/src/search-map.js` (159줄~ 박스 마크업)
- `preview/search-ui/src/styles/search-visily.css` (`.hero-map--float-rail` 덮어쓰기 규칙)

## 심벌 만들기 (새로 그리지 말 것)
`docs/design/brand-logo/01_가로형_심벌+우동공과.svg`에서 defs의 clipPath `c0`(rect 690.84/439.44/136.8/201.12)와 첫 번째 `<g clip-path="url(#c0)">` 그룹만 남기고(경로·색 그대로), 바깥 transform 없이 `viewBox="690.84 439.44 136.8 201.12"`로 저장. 원본 01~04 수정 금지.

## 필수
1. 박스 위쪽 5px 색띠, 4등분 `#F45A5F` / `#FF813D` / `#0764B5` / `#61257E` (::before, overflow:hidden)
2. 박스 바탕 `#FFFBF6`, 그림자 `0 16px 40px rgba(40,25,10,.38), 0 4px 10px rgba(0,0,0,.16)`
3. 동 이름 제목(홈 h1, 찾기 h2 태그 그대로) 안 맨 앞에 칩 span: 심벌 img(높이 15px, 너비 auto, alt="") + 「우리동네」. 칩 12px·600, 글자 `#C2541A`, 바탕 `#FFF1E8`, 테두리 `#FFD2B8`, pill, 오른쪽 8px. 제목은 flex·align-items:flex-start, 칩 윗선 = 동 이름 글자 윗선(오차 1px 이내). 두 화면 마크업 동일.
4. 박스 padding-top 18.4px → 28px
5. 동 이름 아래 여백 5.6px → 16px
6. 찾기 버튼 `.hero-map__cta` 아래 여백 12px → 6px
7. 통계 줄 `.hero-map__stats > div` 위아래 padding 6.4px → 3.5px (줄 높이 35 → 29px)
8. 공통 규칙은 home.css에 한 번. search-visily.css·design-system.css·udx-std-apply.css와 충돌하는 부분만 조정(!important 최소). 찾기 박스 위치·폭 유지.

## 금지
동 이름·heading 계산, 숫자 집계, API, 링크, data 속성, 이벤트, naver-map.js, 라우팅 변경 금지(칩 span 추가만 허용). 다른 컴포넌트 스타일 변경 금지. 이모지·아이콘 폰트·다른 핀 그림 대체 금지.

## 확인
홈 #/guest와 찾기 화면, 각 1920폭·390폭 스크린샷. 두 화면 실측 표(위 여백 28, 동 이름 아래 16, 버튼 아래 6, 줄 29px, 칩 윗선 오차). 심벌 200 응답, CSP 위반 0, 숫자·버튼 링크 동작 수정 전과 동일.

## 보고
변경 파일·diff 요약·실측 표·스크린샷 경로. 커밋·push는 검수 후.
