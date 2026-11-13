# 366-보완 홈에서는 본인 이름도 가린다 (2026-11-12)

지시서: `docs/worklog/grok-sync/docs/366-home-name-mask-2026-11-12.md`  
브랜치: `work/366-home-name-mask` (main `a485af0d`에서 생성). 머지하지 않음.

## 한 일

- 홈·찾기 카드 제목은 본인 로그인·`selfView`여도 `student_name` 원문으로 바꾸지 않는다. 서버가 가린 `public_display_name`(검색 `title`)만 그린다.
- 찾기 변환은 응답에 `student_name` 키가 있어도 카드 객체에 남기지 않는다.
- 마이페이지 카드 미리보기는 `studentToExposureRow`가 이름 전체를 `public_display_name`에 넣은 뒤 같은 카드를 그린다. 기본정보 읽기·수정, 가입 기본정보는 그대로다.
- 고민방·정보게시판은 서버가 준 가린 작성자 이름을 그대로 그린다. 화면에서 원문으로 되돌리는 코드는 없었다.
- 가림 함수·스키마·과외쌤 표시명·사이트 표시명·관리자·공부방 이름은 바꾸지 않았다.

## 검증

- `php scripts/verify-board-student-displayname-fallback.php` — 0 failed
- `php scripts/verify-student-search-fields.php` — 10 PASS / 0 FAIL
- `php scripts/verify-student-tips-board.php` — 230 passed / 0 failed
- `npx vite-node scripts/verify-card-detail-mask-20261009.mjs` — 65 passed, 0 failed
- st1 브라우저 캡처(1280·390)는 로그인 세션이 없어 하지 않았다.

## 셀프검수

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 홈·찾기·홈에서 연 상세에서 본인 이름이 가려짐 | 코드 PASS, 캡처 없음 | `exposure-render.js` 제목은 `public_display_name`만. 상세 `detail-shell.js` `itemTitle`도 같은 필드. 검증 「본인 카드여도 홈 제목은 가린 값」 |
| 2 | 마이페이지·가입 기본정보는 이름 전체, 수정 가능 | 코드 PASS, 캡처 없음 | `format.js`가 미리보기에 이름 전체를 넣음. `profile-read.js`·`signup-basic.js`·`basic-student.php` 미변경. 검증 「마이페이지 미리보기는 이름 전체」 |
| 3 | 고민방·정보게시판에서 본인 이름을 원문으로 되돌리지 않음 | PASS | `concern/store.js`는 `authorDisplayName`만, `info-board-screens.js`는 `authorLabel`만 |
| 4 | 가림은 `StudentPublicName::mask`만, 규칙 불변, 화면 재가림 없음 | PASS | `StudentPublicName.php` 미변경. 화면 마스크 함수 없음 |
| 5 | 공개 API에 이름 원문·`student_name` 키 없음 | PASS | 검색 검증: 4자 이름 제목 `학**1`, 원문 키 없음 |
| 6 | 과외쌤·사이트 표시명·관리자·공부방 이름 미변경 | PASS | 해당 파일 diff 없음 |
| 7 | 스키마·`public_display_name` 컬럼 미삭제 | PASS | SQL·스키마 diff 없음 |
| 8 | 관련 verify PASS, 공통 금지 위반 없음 | PASS | 위 네 명령. 머지·운영 DB·실명 기록 없음 |

## 발견

- `scripts/verify-card-field-paths-20261009.mjs`는 이번 변경과 무관한 공부방 소개·과외쌤 확대카드 칸에서 14 FAIL. 학생 이름 경로는 PASS. 범위 밖이라 고치지 않았다.
