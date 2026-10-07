# 181 · Cursor — 홈 작은 홍보 배너 3개 (로컬)

- 작성: 2026-09-29 KST · 우동공과2
- 선행: 179 수락 (`4a6e135`) — `/#/promo/tutor`·`/#/promo/parent` live
- 정본: 178 잠금 · 180 e카탈로그
- 상태: Cursor 구현 대기 · push · build:dothome 금지 · Notion 금지
- 저장소: leejetty-commits/study114 · D:\work\study114
- 배포: 179와 함께 수락 후 「배포」 시에만

## 0. 절대

1. 메인메뉴(GNB)에 「홍보」 만들지 말 것.
2. 게스트·역할 홈의 시네마형 **한 칸** 마케팅 배너를 **작은 배너 3개**로 교체.
3. 세 칸 = 게스트 홈 + 공부방·과외쌤·학생 홈 **모두 동일**. 자기 역할 칸 숨기지 말 것.
4. 관리자 공지·이벤트 홈 팝업 시스템(`home-popup/*`)은 **유지**.
5. search_*/plans/support 배너는 이번 Must 아님.
6. 175·177·179 본문 재작업 금지. push / build:dothome 금지.

## 1. Must — 세 칸

| 보이는 글자 | 클릭 도착 |
|---|---|
| 내가 찾는 공부방 | #/promo/study-room |
| 나의 과외쌤은 어디에? | #/promo/tutor |
| 학생, 인재로 만들기 | #/promo/parent |

- 「○○ 소개」 라벨 금지. 로그인 게이트 없이 소개만 연다.
- 꾸밈 = live 공부방 카탈로그·159/160 e카탈로그와 **같은 계열**.

## 2. Must — 어디

한 칸 `renderHomeMarketingBanner`를 쓰던 홈만 3칸으로:

- guest-sections.js
- roles/parent.js · roles/study-room.js · roles/tutor.js (경로 다르면 기존 홈만 최소)

SURFACE_BANNER의 guest/parent/study_room/tutor 한 칸을 3칸으로 대체.

## 3. Allowlist

- preview/home-ui/src/home-marketing-banner.js (+ 필요 시 홈 전용 신규 모듈 1개)
- preview/home-ui/src/styles/home-marketing-banner.css (또는 신규 CSS 1개)
- preview/home-ui/src/guest-sections.js
- preview/home-ui/src/roles/parent.js
- preview/home-ui/src/roles/study-room.js
- preview/home-ui/src/roles/tutor.js

밖 = 오버스코프 → 멈추고 보고.

## 4. 금지

GNB「홍보」, 홈팝업 전면 삭제, 179 본문 재작성, 학생 유료·픽·프라임 유도, Notion, push, build:dothome

## 5. 수락 스모크

1. 게스트·세 역할 홈에 세 칸 · 글자 잠금 · 각 promo 실본문
2. 홈 시네마 한 칸 안 보임
3. 관리자 홈 팝업 정상

## 6. 커밋 예

feat(home): replace cinema banner with three promo catalog cards
로컬만. push 금지.
