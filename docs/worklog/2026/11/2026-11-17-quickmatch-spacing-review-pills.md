# 2026-11-17 퀵매칭 소개 여백·후기함 알약

## 지시

1. 퀵매칭 소개(카탈로그, `#/promo/quick-match`, 마이페이지 본문 공통) 상단 카피의 제목·부제·설명·배지·안내 줄 사이 여백을 늘린다. PC 폭은 가운데, 390은 왼쪽.
2. 마이페이지 후기함의 「일반·실시간 퀵매칭」 알약을 쪽지 탭처럼 흰 카드 위로 뺀다.

## 수정

- `preview/home-ui/src/promo/quick-match-view.js` — 상단 카피를 `.qm-lead` 한 덩어리로 그린다. 카탈로그와 소개가 같은 순서를 쓴다.
- `preview/home-ui/src/promo/quick-match.css` — 줄 사이 여백을 늘리고, 768px 이상에서만 가운데 정렬한다.
- `preview/home-ui/src/provider-reviews/inbox.js` — 후기 구분 알약을 `mp-card` 밖으로 옮긴다.

## 확인

- 1280: 소개·카탈로그 상단 카피 `text-align: center`. 제목 아래 여백 21.6px.
- 390: 같은 카피 `text-align: left`.
- 후기함: 알약이 흰 카드 앞. 카드와 간격 11px. 문구는 「일반」「실시간 퀵매칭」.

캡처는 `docs/worklog/2026/11/shots-qm-spacing/`.

## 하지 않은 것

머지·배포는 하지 않았다. main에 있던 verify bundle 실패는 이번 범위가 아니다.
