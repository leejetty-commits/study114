# CHANGELOG · illustrations add (guide-redesign-static-v1)

날짜: 2026-09-18 (Asia/Seoul)

## What was added

페이지 히어로·상황 카드·스텝·안전 Do/Don't에 **친절한 SVG 일러스트**를 붙였습니다.  
IA·카피·라우트·락(비교·찜·쪽지 / CS dump 금지 / Primary `#266BC4` / Pretendard / 브래킷 없음)은 v1 유지.

### Page heroes
각 H1 옆(모바일은 위) soft scene SVG:
- `motif-guide.svg` — 허브
- `motif-search.svg` — 찾기·첫 이용
- `motif-register.svg` — 등록·공개
- `motif-compare.svg` — 비교·찜·쪽지
- `motif-safe.svg` — 안전이용

### Hub situation cards
이모지 → 56px illustrated tiles + soft halo(~72px):
- `tile-search.svg` / `tile-register.svg` / `tile-compare.svg`

### Numbered steps (start / register / compare)
각 스텝 번호 옆 40px icon scene (`step-*.svg`):
- start: pick · filter · bookmark · detail · message
- register: login · form · edit · publish · paid
- compare: pick · compare · bookmark · message · inbox

### Safe page
- Do / Don't 헤더: `icon-do.svg` · `icon-dont.svg`
- Help 블록: `icon-help.svg`
- 비교 페이지 기능 칩도 동일 step SVG로 교체

### Style source
`community-support-visual-refresh-v2` motif 문법(선·면 `#266BC4` / soft circle / ivory blob) 재사용.  
사진·광고 배너·코너 브래킷 없음. 이미지는 텍스트를 보조만 함.

## Files touched
- `assets/*.svg` (23)
- `guide.css` (hero row/art · step grid · icon tiles)
- `01-hub.html` … `05-safe.html`
- shots 재캡처 @1440 (+ hub 390)
