# 2026-10-08 새 이웃 환영 줄 (동네 인사 통합)

- 브랜치: `cursor/neighborhood-welcome-20261008` (기준 `691e3e6`)
- 정본: `docs/internal/71-neighborhood-welcome-lock.md`
- 위험도: 중 (공개 홈 표시·공개 API 응답 변경). 독립 리뷰 필요.

## 사용자 지시 원문

- 18:06 「1번이 이미 있는 '동네인사'와 유기적으로 조합을 하면 어떤 형태가 될까? 아예 따로 구동하는 것이 의미있니?」
- 18:10 「좋아. 기존에 노출정책은 그대로」
- 18:12 「기존에 노출정책은 그대로 따르고, 라우팅 api 등도 점검을 잘해야 해. 꼼꼼하게 정책을 수립하고 코드 작업을 들어간다. 정본에 남기도록 하고. 진행해도 된다. 공급자와 수요자와의 관계를 잘 고려해서 사이트에 반영하도록.」
- 18:12 「작업을 승인한다.」

## 메인 사전 조사 (정본 근거)

- 동네 인사: `src/Neighborhood/NeighborhoodGreetingService.php`(파일 `storage/neighborhood-greetings.json`), API `public/api/neighborhood-greetings.php`(GET 목록·POST 저장), `public/api/neighborhood-greeting-card.php`(카드 팝업), 화면 `preview/home-ui/src/neighborhood-greeting-ui.js`, 공용 `preview/shared/neighborhood-greeting*.js`.
- 이름 클릭 → 카드 팝업은 이미 있음(`openGreetingTarget`). 신규 구현 불필요.
- 기존 원칙: 랭킹 가산 없음, 작성 재촉 없음, 로그인 전 이름 가림.
- 기존 정본 문서 없음 → 71로 신설.

## 작업 지시서

(하위 에이전트 지시 원문은 아래에 추가)

## 검수 기록

(메인 검수 후 추가)
