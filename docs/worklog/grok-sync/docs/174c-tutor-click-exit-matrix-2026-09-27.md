# 174c — 과외쌤 로그인 클릭 이탈 매트릭스 (실사이트)

일자: 2026-09-27  
계정: leejetty+tutor@gmail.com → `/#/tutor`  
연관: `174` / `174a`(게스트) / `174b`(공부방)

## Top

| ID | 판정 | 현상 | 기대 |
| :--- | :--- | :--- | :--- |
| T1 | 이탈버그 | support·notice 「← 메인 홈으로」 → `/#/guest` | `/#/tutor` |
| T2 | 이탈버그 | 검색 배너 「홈으로」 → `/#/guest` (GNB 홈은 tutor OK) | 역할 홈 통일 |
| T3 | 개선 | mypage breadcrumb 「마이페이지」 제자리 | 목록/홈 |
| T4 | 개선 | 과외쌤 맥락인데 promo CTA → `/#/promo/study-room` | `/#/promo/tutor` |

정상: guide/promo/community 「메인 홈으로」→ tutor, 카드 상세 팝업, 찾기 `role=tutor`.

공부방 R1·R2와 **동일 계열** → Cursor **175**에 역할 공통으로 묶음.
