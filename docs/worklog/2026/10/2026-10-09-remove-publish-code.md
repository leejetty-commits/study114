# 2026-10-09 remove-publish-code — 회원 「공개」 잔재 코드 제거

- 브랜치: `cursor/remove-publish-code-20261009` (base main `908c8f4`)
- 위험도: **높음** (노출 상태·검색 노출 조건 변경). 독립 리뷰는 사용자 지시 시에만.
- 상태: 검수 대기 (승인 전 main 병합 금지)

## 1. 지시 원문

> 남은 코드 정리하고 보고해.

> ㅇㅋ

## 2. 복명복창 (사용자 확인: 「ㅇㅋ」)

1. 공부방·과외쌤·학생 3역할의 회원 공개(publish) 잔재 제거 — 서버·화면·문구. 관리자 숨김/해제는 유지.
2. 과외쌤 검색 노출을 기본등록 필수 8개(정본 73 §0)와 일치.
3. 영향 받는 verify 수정 + 새 verify 추가, 작업기록, 커밋·push. main 병합은 승인 후.
4. DB 변경 없음. 「중등」 데이터 문제는 보고만.
5. 보안 점검은 이후 별도. 위험도 높음 표시, 독립 리뷰는 지시 시에만.

## 3. 정책 (이미 있음)

- 가입 = 계정 + 기본등록. 기본등록은 건너뛸 수 없다.
- 기본등록 완료 = 카드 노출. 회원 공개 버튼·승인·본인 숨김 없음.
- 카드 숨김은 관리자 페이지에서 관리자만.

## 4. 변경 내용

### 서버

- `src/Registration/TutorHubService.php`, `StudyRoomHubService.php`, `StudentHubService.php`: 회원 `publish` 요청과 메서드 제거. 남은 요청 외에는 「지원하지 않는 요청입니다.」.
- `src/Tutor/TutorBasicFields.php`
  - `syncProfileStatus()`: 필수 8개가 다 차면 `published`, 아니면 `draft`. `hidden`(관리자 숨김)은 건드리지 않음. 처음 노출 시 `published_at` 기록.
  - `completeSql()`: 검색 SQL용 필수 8개 완료 조건.
- `src/StudyRoom/StudyRoomBasicExposure.php` (신규): 공부방 기본등록(지역 slot1) 완료 시 `published`, 아니면 `draft`. 관리자 숨김 보존.
- `src/Tutor/TutorRegisterService.php`: 연락 단계에서 입력 `profile_status` 무시·저장 안 함. 공개 시점 상세·사진 게이트 제거. 저장 후 `syncProfileStatus`.
- `src/StudyRoom/StudyRoomRegisterService.php`: 시설 단계에서 입력 `profile_status` 무시. 저장 후 `syncProfileStatus`.
- `src/Auth/BasicRegisterService.php`: 가입 기본등록(과외쌤·공부방) 완료 직후 노출 상태 동기화.
- `src/Search/SearchService.php`: 과외쌤 검색 WHERE에 `TutorBasicFields::completeSql('t')` 추가 → 필수 8개 미완료 카드는 검색에 안 나옴.

### 노출 상태 자동 동기화를 넣은 이유 (복명복창 범위 밖 추가)

공개 버튼을 없애면 `profile_status`를 `published`로 바꿀 경로가 사라진다. 지도 마커(`shared/naver-map.js`는 `published`만 표시), 상태 라벨, 관리자 집계가 이 값을 쓰므로, 기본등록 완료 여부로 저장 시 자동으로 맞춘다. 학생은 이미 `rejudgeExposure`로 같은 방식이었다.

### 화면·문구

- tutor-ui: 연락 단계·상세 단계의 공개 상태 선택 제거, 폼 수집에서 `profile_status` 제거. 섹션명 「소셜홍보」「연락」.
- study-room-ui: 공개 상태 블록·공개 저장 버튼 제거, 폼 수집에서 제거. 요약 라벨 「카드 노출: 노출중 / 관리자 숨김 / 저장중」.
- home-ui: `publishTutor`·`publishStudyRoom`·`publishStudent` 제거. 과외쌤 등록점검 준비도 = 필수 8개만. 라벨 「노출중」「관리자 숨김」「기본등록 미완료」. 허브 버튼 「미리보기·공개」→「등록점검」. 금지어 치환표에서 승인 대기·심사 중·검수 대기 정리.
- auth-ui: 가입 기본등록 안내 「기본등록을 마치면 카드가 검색·목록에 바로 노출됩니다.」
- 관리자 화면·관리자 숨김/해제: 변경 없음.
- 내부 식별자(경로 키 `publish` = 등록점검, `getPublishReadiness`, `canPublish`)는 이름만 남김.

### verify

- `scripts/verify-remove-publish.mjs` (신규, `npm run verify:remove-publish`): 동기화 동작(가짜 PDO), 검색 게이트, 폼·payload·공개 함수 부재, 회원 화면 금지 문구, 과외쌤 준비도 8개.
- `scripts/verify-hide-inquiry-bundle.mjs`: 회원은 상태 변경 불가·관리자 숨김 유지로 기대값 수정.
- `scripts/verify-tutor-search-fields.mjs`: 검색 WHERE의 `completeSql` 1줄 허용.
- `scripts/verify-basic-exposure-gate.mjs`: 허브 publish 요청 기대 오류문 수정.

## 5. 검수 결과 (작업 세션 자체 확인, 승인 아님)

| 검사 | 결과 |
|---|---|
| `verify:remove-publish` | 57 통과 / 0 실패 |
| `verify-hide-inquiry-bundle` | OK 55 |
| `verify-tutor-search-fields` | 65 통과 / 0 실패 |
| `verify:shop-page` | 통과 |
| PHP `php -l` (변경 파일 전체) | 통과 |
| vite 빌드 home-ui·tutor-ui·study-room-ui·auth-ui | 4개 모두 통과 (임시 폴더 출력) |

main `908c8f4`에서도 똑같이 실패하는 기존 실패(이번 변경과 무관, 실패 줄 동일):
paid-renewal, cur-006-email-sent-ui, cur-006-email-verify-inventory, cur-006-post-verify-role, study-room-basic-register-api, tutor-registration-check-frame, tutor-basic-required, student-hope-hidden-required, basic-exposure-gate(과외쌤 등록 테스트에서 `TutorBasicFields:74` 예외), cur-006-email-verify-flow(docker API 필요), WSL bash 필요 스크립트(php-syntax, paid-pr-a-ci, paid-pr-b-ci).

위 기존 실패의 원인 조사와 수정은 `docs/worklog/2026/10/2026-10-09-verify-stale-fix.md`.

## 6. 배포 전 사용자 할 일

- 없음. 가입자가 없어 노출 상태를 맞출 기존 카드가 없다. 앞으로 가입하는 카드는 기본등록 저장 시 노출 상태가 자동으로 정해진다(9절).
- SQL·환경변수·Secrets·`.htaccess` 변경 없음.

## 7. 보고만 (이번에 고치지 않음)

- 「중등」: 해당 없음. 이전 가입 화면이 대상을 `middle`로 고정 저장했으나(`docs/worklog/2026/10/2026-10-09-tutor-basic-required.md` 43·72행) 그 고정은 main `a5b0e6b`(2026-10-09 04:37)에서 없어졌고, 가입자가 없어 해당 카드도 없다.
- 관리자 통계 과외쌤 집계: 고칠 것 없음. 사용자 지시 「과외쌤 집계는 과외쌤 카드갯수로」. `BasicCardRegisteredQuery`는 과외지역 1이 있는 과외쌤 행을 센다. 카드 행은 기본등록 필수 8개를 통과해야만 생기고(`BasicRegisterService::registerTutor` → `TutorBasicFields::normalizeInput`), 기본정보 수정도 8개를 다 요구하므로(`TutorRegisterService::saveBasic`) 이 수가 곧 카드 수다. tutor-ui `insertDraft`는 이름만 있는 행을 만들 수 있으나 과외지역 1이 없어 집계에 안 잡힌다.
- `hasPrimaryRegion`은 지역 라벨까지 요구, 검색 slot1 SQL은 요구 안 함(작은 차이).
- 정본 19/20/21 화면 ID 표에 「공개」 문구 잔존 — 사용자 지시 「작업순서에 맞추어서」.

## 9. 보고 정정 (2026-10-09 07:01~07:11)

사용자 지적 원문:

> 2. 기존 카드 노출 상태 맞추기를 왜 맞추지...? 지금 비정상적인 카드가 없는데... 가입자가 없는데...

> 검색 API … ===> 이게 뭔 소리야? 전국 결과가 왜 나와? 로그인하면 본인이 등록된 지역에 맞는 것만 나오는데...?? 어디에 기준을 두고서 이런 망언을 하는거니?

> 지역 값은 가입할 때 기본등록정보에 있는 홍보지역이나 과외지역의 대표1을 불러와서 지도와 '현재위치'에 반영을 하고 있다. 만약 홈화면의 지역값을 바꾸고자 한다면 마이페이지의 내등록의 기본등록정보에서 수정을 하고 새로고침을 하면 지역이 변경된다. 이게 정본에 있는 내용이고, 정석인데, 넌 근거도 없이 마구 내뱉고 있다.

정정:

- 기존 카드 SQL 초안(이전 6절): 운영 가입자 여부를 확인하지 않고 쓴 것. 삭제.
- 「중등」(이전 7절): "미완료로 잡힐 수 있음"은 반대였다(고정값 `middle`은 완료로 판정). 해당 카드도 없음.
- 검색 API "로그인하면 전국 결과": 서버 코드 일부만 보고 한 잘못된 주장. 근거:
  - 정본 `docs/worklog/grok-sync/docs/193-study-room-box-match-tutor-investigation-2026-10-02.md` 606행 — 로그인 공부방 지도 = 홍보1(대표). 대치동은 비로그인 게스트만.
  - 정본 `106-tutor-student-find-primary-location-ticket.md`·`107-tutor-student-find-106-acceptance.md` — 과외쌤 현재위치 = 대표 활동지역(과외지역 1).
  - 코드 `preview/home-ui/src/study-room-home-seed.js` 30~93행 — 기본등록 `saved_regions`의 대표 슬롯을 현재위치 라벨·지도 질의에 쓰고 다른 값으로 대체하지 않는다.
  - `public/api/search/search.php`: 비로그인은 게스트 지역으로 고정, 로그인은 위 대표지역 기준 요청을 받는다. 문제 없음. 검사 실패는 분류표 누락(낡은 검사).

## 8. 승인 기록

- 2026-10-09 07:21 사용자 승인: 「승인한다. 진행해」
  - 대상: `0cdfa5a`(작업), `39cd2ca`(작업기록 정정). 후속 검사 수정 브랜치 `cursor/verify-stale-fix-20261009`의 `d22af85`까지 함께 병합 (`2026-10-09-verify-stale-fix.md`).
- 독립 리뷰: 사용자 지시 없음 → 진행하지 않음.
