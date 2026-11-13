# 모바일 드로어 여백 — 소개영상 한 줄·세로 간격 (2026-11-14)

지시: PR #209 브랜치 `work/mobile-hamburger-half`에 이어서, 899px 이하 드로어만 `home.css`만 수정.

1. 소개영상 왼쪽 패딩을 줄여 390폭에서 「우동공과 공부방 소개영상」「우동공과 과외쌤 소개영상」이 한 줄. 글자 크기는 유지. 360에서 넘치면 nowrap 없이 줄바꿈하고 보고.
2. gnb·promo·util·문의하기의 위아래 패딩·간격을 약 60~70%. 터치 높이는 40px 이상.

## 적용 (`@media (max-width: 899px)`만)

- 소개영상 `padding-left`: 1.25rem(20px) → 0.5rem(8px). 오른쪽 20px 유지. `font-size` 14px. `white-space: normal`.
- 구역 패딩: gnb·promo 8px → 0.35rem(5.6px, 70%). util·문의 12px → 0.5rem(8px, 67%). gap 4px → 0.15rem(2.4px, 60%).
- 항목 `padding-block`: gnb·소개영상 12px → 0.5rem(8px, 67%). util·문의 8px → 0.35rem(5.6px, 70%).
- 터치: `min-height: 2.5rem`(40px). 패딩을 더 줄이면 40px 밑으로 내려가므로 여기서 멈춤.

## 확인

- `home.css` 괄호 깊이 0.
- 390·360 모두 패널 너비 200px(최소 12.5rem). 소개영상 글자 너비 140px, 내용 칸 172px, 높이 40px, 한 줄. 360에서도 넘치지 않아 줄바꿈은 일어나지 않음.
- 항목 높이 최소 40px.
- 캡처: `mobile-hamburger-drawer-tight-captures/home-390-drawer-full.png` (390×844), `home-360-drawer-full.png` (360×800). 패널 전체가 화면에 있음.

머지하지 않음.
