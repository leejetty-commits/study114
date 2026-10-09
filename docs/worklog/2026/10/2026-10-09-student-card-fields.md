# 2026-10-09 학생 카드 칸 연결 (student-card-fields)

- 브랜치: `cursor/student-card-fields-20261009` (기준 `origin/main` `2f34c476`)
- worktree: `D:\work\study114\.wt\student-card-fields`
- 작업: 메인 에이전트 직접 (하위 에이전트 없음)
- 위험도: 중간 (서버 학생 검색 응답에 칸 추가 · 학생 카드 공통 렌더 변경. DB 구조 변경 없음)

## 1. 지시 원문

> 모든 카드들에 항목이 제대로 연결되어 들어가는지 의심을 하지 않을수 없다.

전체 경로 점검 보고(room-card-slots 2차 작업기록 8절) 뒤 답: 학생 카드 「세 가지 모두 고치기: 홈·대체 변환 바로잡기 + 서버 응답에 칸 추가 + 빈 칸 「—」 (별도 브랜치)」.

작업 범위 확인(복명복창) 뒤 답 (2026-10-09 22:49):

> 1-a 2-b 3-a

- 1-a: 1~5번 범위로 진행
- 2-b: 「한 줄 요청」「특이요청」은 볼 수 없는 사람에게 항목제목 + 잠금 문구(「선생님만 보기」 같은)
- 3-a: 학생 확대카드에 「일정(주회·분)」 넣기 (확대카드 = 모든 칸)

## 2. 점검 결과 (작업 전)

- 서버 학생 응답(`src/Search/SearchService.php` searchStudents)에 주회·분·희망 수업장소·희망 강의스타일이 없음 → 모든 학생 카드에서 이 칸이 늘 빈 값. DB에는 있음(`students.lessons_per_week`·`minutes_per_lesson`, `student_preferred_lesson_places`, `student_preferred_teaching_style_badges`). SQL 필요 없음.
- 홈(`home-basic-live.js` mapStudent)·확대카드 대체(`exposure-bridge.js` mapStudentItem) 변환이 summary 를 `\n` 으로 나눠 과목 칸에 한 줄 전체(「수학 · 강남구 · 그룹과외 · 남 · 2명」)를 넣고 학년·수업형태·인원·예산·요청문을 버림.
- 찾기 변환(`search-exposure-mapper.js`)은 과목이 비면 summary 첫 조각(지역일 수 있음)으로 채움.
- 학생 베이직 가로카드는 값이 없으면 항목을 숨김(`renderHcardMetaItem`), 수업장소가 비면 「(선택)」. 요청문 칸은 공급자가 아니면 「—」 → 숨김.
- 확대카드: 수업형태 값이 없어도 「희망 수업인원: 단독」. 「일정」 칸 없음.

## 3. 변경

| 파일 | 내용 |
|---|---|
| `src/Search/SearchService.php` | 학생 SELECT·응답에 `lessons_per_week`·`minutes_per_lesson`. 새 `loadStudentCodeMap()`으로 `lesson_places`·`teaching_style_badges`를 붙임(과외쌤 `loadTutorCodeMap`과 같은 방식). 요청문 게이트는 그대로 |
| `preview/home-ui/src/home-basic-live.js` | `studentSearchCardFields()` 추가: 학생 카드 칸 값을 응답 그대로. `mapStudent`가 사용. summary 대체 삭제 |
| `preview/home-ui/src/exposure-bridge.js` | `mapStudentItem`도 같은 함수 사용 |
| `preview/search-ui/src/search-exposure-mapper.js` | 학생 과목 summary 첫 조각 대체 삭제 |
| `preview/home-ui/src/student-visibility.js` | `STUDENT_REQUEST_CARD_LOCK`: 「선생님만 보기」(공급자 아님) · 「픽·프라임 이용 시 보기」(이용권 없는 공급자) |
| `preview/home-ui/src/exposure-render.js` | 학생 베이직(가로·표): 칸을 늘 그리고 빈 값 「—」(학년 배지·지역 포함), 「(선택)」 삭제(`optionalStudentPlaces` 삭제), 요청문 칸 잠금 문구, 학생 본인 카드는 자기 원문. 손님 요약 카드는 그대로 |
| `preview/home-ui/src/detail-decision/student-request-card.js` | 확대카드 「일정」 칸 추가, 「희망 수업인원」은 1:1일 때만 「단독」 · 값 없으면 「—」 |
| `docs/ssot/29-empty-error-permission-ux.md` | 6-1 학생 카드 칸 규칙 |
| `scripts/verify-card-field-paths-20261009.mjs` | 학생도 실패로 셈. 학생 9칸 기대값, 서버 응답 칸 정적 검사, 빈 값·잠금 문구·본인 카드·확대카드 「단독」·과목 대체 검사 |
| `scripts/verify-student-search-fields.php` | 새 검사: 가짜 PDO 로 학생 검색 응답 칸 확인(DB 접속 없음) |

## 4. 검수 (이 PC)

- `verify-card-field-paths-20261009.mjs`: **50 passed, 0 failed** (공부방 16 · 과외쌤 12 · 학생 6 경로·카드 + 서버 4 + 빈 값·잠금 12). 수정 전(`.wt/room-card-slots`, main `2f34c476`과 같은 코드): 32 passed, 18 failed.
- `D:\php8.2\php.exe scripts/verify-student-search-fields.php`: **9 PASS / 0 FAIL**. 수정 전(`SSF_ROOT=.wt/room-card-slots`): 3 PASS / 6 FAIL.
- 기존 검사 실패 0: room-card-slots-20261009, card-detail-mask-20261009, detail-card-all-fields, card-visual, card-visual-penetration, guest-baseline-map-cards, student-home-tutor-tier, tutor-home-student-tab, student-branch-two-tabs, student-count-halt-and-gate, home-news-row, tutor-search-fields, student-mypage-metrics, wishlist-card-zoom, wishlist-card-zoom-screen, integrity-fix-20261009, student-location-flow, role-home-guard, tutor-box-real-values
  - 중간에 tutor-search-fields 가 실패: 과외쌤 조회 함수를 학생과 합치며 결과 칸 이름을 바꿔서. 과외쌤 함수는 원래대로 두고 학생 함수를 따로 만들어 해결.
- 배포 전 검사: `verify:shop-page`, `verify:tutor-inquiries-settings`, `verify:study-room-inquiries-samples`, `verify:board-acl:js`, `verify:no-sample-data`, `check-no-committed-secrets.sh` 성공. `php -l SearchService.php` 문법 이상 없음.
- `npm run build:dothome`: 성공
- 로그인 화면 눈확인·운영 DB 응답 확인: 하지 않음(미확인).
- 독립 리뷰: 사용자 지시 없어 하지 않음.

## 5. 미확인 · 남은 것

- 카드의 이용권 판정은 확대카드와 같은 화면 쪽 `isPaidProviderViewer`(쪽지 이용권 기준). 서버 판정(`PaidProviderGate`, 픽·프라임 노출 중)과 어긋나면 이용권 있는 과외쌤이 요청문 없는 학생에서 「—」 대신 잠금 문구를 볼 수 있음. 원문이 오면 늘 원문을 보여 줌.
- 손님 학생 카드(로그인 유도 요약)는 그대로.

## 6. 배포 전 사용자 할 일

- 없음 (SQL·환경변수·Secrets·`.htaccess` 변경 없음). 쓰는 표·칸은 학생 등록 코드가 이미 저장에 쓰는 것: `src/Registration/StudentHubRepository.php` 134행(`lessons_per_week`·`minutes_per_lesson`), 519·541행(희망 수업장소·강의스타일 표), `src/Auth/BasicRegisterService.php` 919·929행.

## 7. 승인·main 반영

- 작업 전 확인: 사용자 2026-10-09 22:49 「1-a 2-b 3-a」.
- 작업 커밋 `fd95fafc`. 브랜치 CI: Verify bundle·Board ACL gate 성공.
- main 병합: 사용자 승인 대기.
