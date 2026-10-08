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

## 6. 배포 전 사용자 할 일 (적용하지 않음, 초안)

기존 카드 중 기본등록은 끝났는데 `draft`로 남은 카드는 다음 저장 때 `published`로 바뀐다. 즉시 맞추려면 운영 phpMyAdmin에서 아래를 한 번 실행한다(적용 전 SELECT로 건수 확인).

```sql
-- 공부방: 지역 slot1 있음 + draft → published
UPDATE study_rooms sr
SET sr.profile_status = 'published',
    sr.published_at = COALESCE(sr.published_at, NOW())
WHERE sr.profile_status = 'draft'
  AND EXISTS (
    SELECT 1 FROM study_room_regions r
    WHERE r.study_room_id = sr.id AND r.slot = 1
      AND r.region_id IS NOT NULL AND r.region_id <> 0
  );
```

과외쌤은 필수 8개 판정이 여러 테이블에 걸쳐 있어 SQL 대신 각 과외쌤 저장 시 자동 동기화에 맡기는 것을 권장. 일괄 처리가 필요하면 별도 지시로 PHP 1회 스크립트를 만든다.

## 7. 보고만 (이번에 고치지 않음)

- 자동저장된 기존 「중등」 `school_level` 데이터: 현재 값 목록에 없어 필수 8개 판정에서 대상 미완료로 잡힐 수 있음. 정리 SQL 필요(별도 지시).
- 관리자 통계 `BasicCardRegisteredQuery`의 과외쌤 집계는 지역 slot1만 본다(필수 8개와 다름).
- `hasPrimaryRegion`은 지역 라벨까지 요구, 검색 slot1 SQL은 요구 안 함(작은 차이).
- 정본 19/20/21 화면 ID 표에 「공개」 문구 잔존(문서 정리 때).

## 8. 승인 기록

- (대기) 사용자 승인 커밋 hash:
