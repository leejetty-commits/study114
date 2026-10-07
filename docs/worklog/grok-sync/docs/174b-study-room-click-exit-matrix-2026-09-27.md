# 174b — 공부방 로그인 클릭 이탈 매트릭스 (실사이트)

일자: 2026-09-27  
계정: leejetty+room@gmail.com → `/#/study-room`  
정책: `174-in-page-nav-stay-policy-2026-09-27.md`  
게스트 부속: `174a-guest-click-exit-matrix-2026-09-27.md`

## Top (이탈버그)

| ID | 현상 | 기대 |
| :--- | :--- | :--- |
| R1 | 이용안내 일부(`/guide/registration` 등)·고객센터·공지 「← 메인 홈으로」 → `/#/guest` | `/#/study-room` |
| R2 | 검색 배너 「홈으로」 → `/#/guest` (GNB 「홈」은 `/#/study-room` 정상) | 둘 다 역할 홈 |
| R3 | (개선) 마이페이지 breadcrumb 「마이페이지」 거의 제자리 | 목록 또는 `/#/mypage` |

정상: 홍보·커뮤니티·유료상품 홈 복귀, 카드 상세 팝업, 계정 비밀번호 변경 인페이지, 찾기 `role=study_room` 유지.

## 코드 힌트 (GitHub)

- `guide/shell.js` · `support/shell.js`: `getNavRole()` → 홈 href.
- `state.js` `getNavRole()`: guide/support는 `getGuideContextRole` / `getSupportContextRole` — 여기서 guest로 떨어지면 「메인 홈으로」가 `#/guest`.
- 검색 배너 「홈으로」는 GNB `roleHomeHashPath`와 별도 하드코딩 가능 → 175에서 통일.

## 스크린샷

- 가이드→게스트: `.../assets/259ad30a6fe85ff728f4276c3255ba456eb2ac10296e78a50ebce18f84e279a7.png`
- 검색 배너 홈으로: `.../assets/2c974b324c4427b12e42bfc3a45c32ca963d92a70921e2510f5fe6166c1971fd.png`

실클릭 전체 표는 봇 감사 원문(공부방 세션) 참고. Cursor 범위는 게스트 P1–P3 + 본 R1–R2를 **175**에 통합.
