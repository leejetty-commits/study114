# 홈 팝업 드래프트 v1.2 — 핸드오프

우동공과(study114) 홈 팝업 3종 **실로고 lockup 변형**.  
v1.1 레이아웃·사이즈·bright-only·always-imprint는 유지하고, CSS 텍스트 lockup을  
**연필핀 + 「우동공과」 단일 PNG**로 교체합니다.  
2줄 full 로고(우리동네 / 공부방과외)는 1차 lockup으로 쓰지 않습니다.  
`home-popup-drafts-v1/` · `v1.1/` 는 그대로 둡니다.

## 빠른 열기
- 갤러리: `index.html`
- A 공지: `a-notice.html` (420×480 · 우상단 lockup img + wordmark watermark)
- B 이벤트: `b-event.html` (400×560 · 히어로 lockup img + body watermark)
- C 광고: `c-promo.html` (560×360 · 민트 패널 ONE lockup img)

## 스크린샷
`shots/a-notice.png` · `b-event.png` · `c-promo.png`  
카드 크롭: `shots/*-card.png`

## v1.2 핵심 규칙
1. **로고는 한 장의 img** — pencil icon IN FRONT OF 「우동공과」 (`logo-lockup-pencil-wordmark*.png`)
2. **팝업에 우동공과 항상 각인** — corner/hero lockup 및/또는 faded wordmark watermark
3. full 2줄 로고 금지(1차 lockup) · bright-only 유지

상세 → `NOTES.md`
