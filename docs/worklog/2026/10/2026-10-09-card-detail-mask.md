# 2026-10-09 카드 「상세」 버튼 삭제 · 학생 이름 가리기 마지막 글자만 (card-detail-mask)

- 브랜치: `cursor/card-detail-mask-20261009` (기준 `origin/main` `3763a8c8`)
- worktree: `D:\work\study114\.wt\card-detail-mask`
- 작업: 메인 에이전트 직접 (하위 에이전트 없음)
- 위험도: 낮음 (화면 카드 버튼 삭제·이름 가리기 함수 1개. 서버·DB 변경 없음)

## 1. 지시 원문

> 지금 공부방으로 로그인한 상태인데, 학생찾기에서 검색으로 나왔는데, 이름은 이공0 이런 식으로 블라인드 되는게 아닌가?
> 그리고 저 카드박스에서 상세는 어디로 가는거지? 확대카드는 되는데, 저 상세는 누르면 반응이 없어.
>
> 우리가 수정하는 것들은 전체 공통모듈이 변경되는 거지(각 역할에서)?

점검 보고 뒤 선택 (2026-10-09):

> 학생 이름 가리기를 마지막 글자만 가리는 방식으로 바꾸기 (이공○)
> 상세배지 제거하고 현재처럼 카드 클릭만 해도 확대되는 상태를 유지하도록. 즉 '상세'라는 배지만 제거해.

범위 확인 답:

> 공부방, 과외샘, 학생 까지, 베이직, 픽, 프라임에 있으면 모두 뺀다. 왜냐하면 카드클릭만으로 확대가 되고 있잖아.
> (진행)

## 2. 점검 결과 (작업 전)

- 「○학생」: 이름 가리기 함수(`preview/home-ui/src/student-blind-teaser.js` `maskPublicDisplayName`)는 동작했다. 서버가 표시명이 비면 「학생」을 보내고(`src/Search/SearchService.php` 1248행), 이름 부분이 없어 「○학생」이 됐다. 그 학생의 실제 표시명은 미확인.
- 학생 검색은 「노출 중」만 보고 기본정보 완료(표시명 포함)는 보지 않는다(`SearchService.php` 1083행). 과외쌤 검색은 기본정보 8개 완료만(835행). 이번 작업에는 넣지 않음(사용자 미선택).
- 「상세」 무반응: 학생 카드 클릭 처리(`preview/home-ui/src/detail-decision/index.js`)가 「누른 곳이 버튼이면 무시」인데 「상세」도 버튼이라 늘 무시됐다. 공부방·과외쌤 카드의 「상세」는 다른 연결(`search-open-detail`)이라 열렸다.
- 「상세」 버튼은 베이직 가로카드 4곳(공부방·과외쌤·학생 손님·학생 로그인)에만 있었다. 픽·프라임 카드에는 없음. `search-ui/src/search-handoff.js`의 `renderSearchRowActions`(「상세」 버튼 포함)는 어디서도 쓰지 않는 코드였다(`docs/internal/core-flow-audit-checklist.md` 39행에도 dead code로 기록).

## 3. 변경

| 파일 | 내용 |
|---|---|
| `preview/home-ui/src/student-blind-teaser.js` | `maskPublicDisplayName`: 마지막 글자만 가림. 3자 이상 앞 두 글자 + ○, 2자 첫 글자 + ○, 1자 ○, 끝 「학생」은 다시 붙임. 빈 값 `○○학생`·「학생」뿐 `○학생`은 그대로 |
| `preview/home-ui/src/exposure-render.js` | 공부방·과외쌤·학생(손님·로그인) 베이직 가로카드의 「상세」 버튼 삭제. 카드 클릭 표시(`data-provider-*`·`data-action="open-student-detail"`)는 그대로 |
| `preview/search-ui/src/styles/search-visily.css` | `.expo-hcard__detail` 스타일 삭제 |
| `preview/home-ui/src/detail-decision/index.js` | 「상세」 버튼 전용 클릭 연결(`search-open-detail`) 삭제. 카드 클릭 → 확대카드 연결은 그대로 |
| `preview/home-ui/src/mypage/screens.js` | 찜 목록의 「상세」 버튼 전용 클릭 연결 삭제(카드 클릭은 그대로) |
| `preview/search-ui/src/search-handoff.js` | 쓰이지 않던 `renderSearchRowActions`와 그 import 삭제 |
| `docs/internal/29-exposure-gnb-decisions.md` | 학생 표시명 가리기 규칙을 「마지막 글자만」으로, 예시 갱신 |
| `docs/internal/core-flow-audit-checklist.md` | dead code 관찰 줄에 삭제 기록 |
| `scripts/verify-wishlist-card-zoom-screen.mjs` | 과외쌤 「상세」 클릭 항목 → 「상세」 없음 + 카드 탭으로 확대 |
| `e2e/core-flow-search-detail.spec.js` | 손님 학생 카드 이름 기대값 `○○` → `○` (새 규칙은 ○ 한 개) |
| `scripts/verify-card-detail-mask-20261009.mjs` | 새 검사 |

동네인사 이름(김○○)·탈퇴 회원 쪽지 이름(최○○)은 다른 규칙이라 그대로.

## 4. 검수 (이 PC)

- 새 검사 `cd preview/home-ui && npx vite-node ../../scripts/verify-card-detail-mask-20261009.mjs`: **65 passed, 0 failed**
  - 「상세」 버튼 클래스·연결 0, 이름 가리기 9가지(이공영→이공○, 남궁민수→남궁○, 이준→이○, 김→○, 김민수학생→김민○학생, 민수학생→민○학생, 학생→○학생, 빈 값·null→○○학생)
  - 손님·공부방·과외쌤·학부모 × 공부방·과외쌤·학생 베이직(가로·표) × 공부방·과외쌤 픽·프라임: 「상세」 없음, 카드 클릭 표시 유지, 학생 이름 「이공○」
  - 수정 전 `origin/main`에서 같은 검사: 36 passed, 29 failed → 이번 변경을 잡는 검사임을 확인
- 기존 검사 (모두 실패 0): wishlist-card-zoom-screen 28/0, card-visual-penetration, student-branch-two-tabs 162/0, student-location-flow 189/0, student-home-tutor-tier 24/0, guest-baseline-map-cards, study-room-box-shape 45/0, tutor-home-student-tab 63/0, tutor-search-fields, student-count-halt-and-gate, tutor-region-label 115/0, mypage-account-region 41/0, signup-home-fix-20261009 45/0, student-tips-board, home-news-row, info-boards-client, student-mypage-metrics, mypage-notice-top 49/0, location-ssot, role-home-guard, tutor-box-real-values, tutor-register-same-tab
- 배포 전 검사: `verify:shop-page`, `verify:tutor-inquiries-settings`, `verify:study-room-inquiries-samples`, `verify:board-acl:js`, `verify-no-sample-data`, `check-no-committed-secrets.sh` 모두 성공
- `npm run build:dothome`: 성공 (산출물은 커밋하지 않음)
- e2e(Playwright)는 로컬 서버가 필요해 돌리지 않음(미확인).
- 독립 리뷰: 사용자 지시 없어 하지 않음.

## 5. 미확인

- 「○학생」 카드 학생의 실제 표시명(비어 있는지)은 DB를 보지 않아 미확인. 비어 있으면 새 규칙에서도 「○학생」.
- 운영 화면 눈확인은 배포 후.

## 6. 배포 전 사용자 할 일

- 없음 (SQL·환경변수·Secrets·`.htaccess` 변경 없음).

## 7. 승인·main 반영

- 작업 전 확인: 사용자 2026-10-09 범위 답 + 「진행」.
- main 병합: **대기** (커밋 hash 단위 사용자 승인 후).
