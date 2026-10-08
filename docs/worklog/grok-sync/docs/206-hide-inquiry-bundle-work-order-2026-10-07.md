# 206 · 숨김 후속 + 문의 관리 묶음 — 작업지시서 (2026-10-07)

- **작성:** 2026-10-07 05:4x KST (우동공과2, 개발팀장 대행)
- **절차 위치 (종현 t1478 잠금):** 점검지시문(docs/203) → 점검 보고 → 검수(docs/203 §검수 결과) → **작업지시서 (이 문서)** → 수행결과 보고 → 재작업 → 검수완료 → 종현 보고 → 종현 승인 후 배포
- **밤사이 범위 (종현 t1523):** 배포 직전까지만. 브랜치에서 검수 통과까지. main 머지·배포·운영 DB SQL 실행은 하지 않음.
- **근거:** docs/203(점검지시문 + 점검 보고 + §검수 결과), docs/202 §15 · t1503 · t1504 · t1505 · t1513 · t1517, docs/190, ssot/28 §3-b-2
- **같이 도는 작업:** 관리자-162 보고서(docs/205, 브랜치 `cursor/admin-162-20261007`, 마이그레이션 **077**). 이 묶음은 **076**만 씀.

> 아래 블록 전체를 클라우드 에이전트(점검을 한 같은 에이전트)에 그대로 전달.

```
# [숨김 후속 + 문의 관리] 작업지시서 (2단계: 구현)

## 0. 규칙 (어기면 불합격)
- 저장소 leejetty-commits/study114. 기준 = origin/main 11b0c0d (Deploy #393).
  시작할 때 `git fetch origin && git rev-parse origin/main` 결과를 보고 첫 줄에 적으세요. 11b0c0d가 아니면 멈추지 말고 그 SHA를 적고, 아래 파일:줄이 달라졌는지 확인한 뒤 진행하세요.
- 새 브랜치 1개: `cursor/hide-inquiry-20261007` (origin/main 11b0c0d에서 분기). 이 브랜치에만 커밋하고 push합니다.
- 금지: PR 만들기, main에 push·머지, 배포, 운영 DB 접속·SQL 실행, `--amend`, force push, rebase로 이미 push한 커밋 고치기, 다른 브랜치 삭제·생성.
  (도구가 PR을 자동으로 만들면 즉시 닫지 말고 보고에 번호를 적으세요. 아무것도 머지하지 마세요.)
- 허용 파일(§3) 밖의 파일을 1줄이라도 바꾸면 불합격입니다. 허용 파일 안에서도 「무엇만 고침」에 적힌 범위 밖은 고치지 마세요.
- 구조 재설계, 관련 없는 정리, 이름 바꾸기, 포맷 정리, 추가 기능 금지. 대화 스레드(다중 답글) 금지(068 「1건당 답변 1개」 잠금).
- rg는 반드시 `-g '!node_modules' -g '!dist'`.
- 화면 글자는 「학생」(「학부모」·'parent'를 화면에 쓰지 않음. 내부 키 'parent'는 그대로 둠). 숨김 문구에 승인·반려·검토 완료·인증 같은 심사 말 금지(ssot/28:283).
- 「범위 밖」「다음에」로 미루지 마세요. 막히면 「막힘 + 이유 + 풀 방법」을 보고에 적고, 나머지는 끝까지 하세요.
- 결과 보고는 한국어, 마지막 메시지 하나(§6 형식).

## 1. 배경 결정 (바꾸지 말 것)
- t1503 (04:15): 「공개조건」 정책은 오래전 폐지. 카드 노출 조건 = 기본정보 필수 입력뿐. 미완성 카드는 노출되면 안 됨. 숨김은 관리자 전용 조치.
- t1504 (04:17): 숨기면 주인 마이페이지에 한 줄(세 역할, 다시 켜는 버튼 없음):
  「이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.」
  공부방·과외쌤은 숨길 때 사이트 알림 1건. 메일·문자·쪽지 없음. 다시 보이기 때 알림 없음. 학생은 한 줄만. user_notified는 실제로 알림을 만들었을 때만 1.
- t1505 (04:18): 해제 요청 흐름 = 한 줄의 링크 → 고객센터 운영문의 → 관리자 「문의·신고」 답변 + 「홈에 뭐가 보이나」 다시 보이기 → 사용자는 「내 문의 내역」에서 확인.
- t1517 (04:54): 문의를 회원 id에 연결, 계정 이메일 고정(수정 불가), 관리자 목록 처리 전/종료 필터 + 이메일·아이디 검색 + 페이지 나눔, 회원 상세에 그 회원 문의 목록, 유형 「숨김 해제 요청」. 스레드 없음. 전체 목록 유지.

## 2. 작업 항목 (1~7 전부 이번 커밋에서 끝냄)

### 항목 1 — 주인 저장·공개가 관리자 숨김을 풀지 못하게 (서버가 본 수정)
1-a. `StudyRoomRegisterService::saveFacility` (:1011-1056)
   - 저장 전에 현재 `profile_status`를 읽는다(같은 PDO, `SELECT profile_status FROM study_rooms WHERE id = ?`).
   - 현재값이 `hidden`이면 요청값과 상관없이 `hidden` 유지(`published_at`도 바꾸지 않음).
   - 요청에 `profile_status`가 **없거나 빈 문자열**이면 현재값을 그대로 쓴다(`pending`은 `draft`로 읽는 기존 규칙 유지). 지금의 `?? 'draft'`(:1016)를 없앤다.
     이유: 공부방 마이페이지 상세정보2는 공개 칸이 없는데(embedded-panels.js:401-404 `includePublishBlock:false`) 저장할 때마다 공개중 카드가 draft로 내려감. 기본 카드는 필수칸이 차면 자동 노출이라는 잠긴 정책과 어긋남.
   - 요청에 값이 있고 현재값이 hidden이 아니면 지금처럼 그 값(`draft|pending|published`)을 쓴다(마법사 선택 칸 동작 유지).
1-b. `TutorRegisterService::saveContact` (:699-751): `$currentStatus === 'hidden'`이면 `$profileStatus = 'hidden'` 고정, `$isNewPublish = false`. 나머지 그대로(요청이 없으면 현재값을 쓰는 기존 동작 유지).
1-c. `StudyRoomHubService::publish` (:52-64), `TutorHubService::publish` (:53-73): 현재 상태가 `hidden`이면 상태를 쓰지 않고 `['ok' => false, 'reason' => 'not_allowed']` 반환. 모양은 `StudentHubService.php:60-62`와 같게. 위치는 이메일 인증 확인 다음, 다른 검사(대표지역1·publishMissing) 전.
   현재 상태는 `$room['profile_status']`/`$tutor['profile_status']`를 쓰되, `pending→draft`로 바꿔 읽는 hydrate(StudyRoomHubRepository.php:89-90, TutorHubRepository.php:72-74)는 hidden을 그대로 둔다는 것을 보고에 줄 번호로 증명하세요.
   `TutorHubService::publishMissing`(:91-110)의 내용은 바꾸지 마세요.
1-d. 클라이언트: `preview/study-room-ui/src/form-collect.js:354`와 `preview/tutor-ui/src/form-collect.js:163`에서 폼에 `profile_status` 칸이 없으면 `'draft'`를 채우지 않는다.
   칸이 없을 때는 `state.profile_status`를 건드리지 않고, payload(:480 / :220)에서도 값이 비어 있으면 키를 보내지 않는다(빈 문자열이면 서버가 현재값 유지 — 1-a와 같이 동작해야 함).
   `syncFacilityFromForm`·`syncContactFromForm`의 모든 호출처를 rg로 찾아 표로 보고(파일:줄, 그 폼에 profile_status 칸이 있는지).
1-e. **마법사의 「공개 상태」 선택 칸(draft/published)은 이번에 지우지 마세요.** 대신 다음을 조사해 보고의 「종현 확인 필요」에 적으세요:
   study-room-ui `layout.js:362-376`(설명 문구 「저장만 하면 비공개, 공개를 고르면 검색에 나갑니다」 포함), tutor-ui `step-contact.js:85-93`, `step-detail.js:200-203`.
   (근거 자료: 찾기 목록은 공부방·과외쌤의 draft도 보여 줌 — SearchService.php:463-470, :736-741. 즉 이 선택 칸의 「비공개」는 지금 찾기 목록을 실제로 막지 않음. draft/published 차이가 실제로 영향을 주는 곳(지도 핀 naver-map.js:55, 배지 등)을 전부 파일:줄로.)

### 항목 2 — 관리자 「다시 보이기」가 미완성 카드를 노출하지 않게
- `AdminExposureService` 공부방(:134-135)·과외쌤(:191-192) publish 분기: 카드가 기본 필수 조건을 채웠으면 `published`, 아니면 `draft`로 저장.
- 판정 규칙(새 규칙을 만들지 말고 기존 규칙을 그대로 옮김, 보고에 각 칸의 근거 파일:줄을 적을 것):
  - 공부방: (a) 대표지역1 — `StudyRoomHubService::hasPromoSlot1`(:66-75)와 같은 SQL(= SearchService::roomPromoSlot1Sql :297-304). (b) 가입 단계 필수칸 중 카드 테이블(study_rooms)에 저장되는 칸이 비어 있지 않음 — `BasicRegisterService::registerStudyRoom`(:405-420 근처)의 require 목록에서 옮김.
  - 과외쌤: (a) 과외지역1 — SearchService::tutorSlot1Sql(:307 이후)와 같은 조건. (b) `BasicRegisterService::registerTutor`(:760 이후)의 require 목록 중 tutors 테이블 칸.
  - `TutorHubService::publishMissing`(상세등록 완료·프로필 이미지·소개문까지 요구)은 가입 필수보다 넓으므로 **쓰지 않는다.** 이 함수가 폐지된 공개조건 잔재인지는 「종현 확인 필요」에 근거와 함께 적는다.
- 판정은 AdminExposureService 안의 private 메서드 1개(역할별)로. 다른 서비스의 private 메서드를 public으로 바꾸지 말 것.
- draft로 저장했을 때 응답에 `missing`(빈 칸 라벨 목록)을 같이 돌려준다. 로그는 지금처럼 `exposure_correction`, user_notified=0, 알림 0건.
- `rejectDraftPublish`(:271-276)는 그대로(draft/pending 카드는 여전히 올릴 수 없음). 학생(:237-248)은 이미 검사하므로 바꾸지 않음.
- 이전 상태 복원 칼럼은 만들지 않는다.

### 항목 3 — user_notified = 실제로 알림을 만든 경우만 1
- 공부방·과외쌤 hide (:122, :179 근처의 분기):
  1) 트랜잭션 시작 (`Connection::get()`의 같은 PDO — 서비스 생성자 :38).
  2) 현재값이 이미 `hidden`이면 상태 변경·알림 없이 로그만(user_notified=0) — 중복 알림 방지.
  3) `profile_status='hidden'` 저장.
  4) 로그 키를 먼저 만든다: `AdminOperationLogRepository::insert`에 선택 인자 `?string $logKey = null`을 **맨 뒤에 추가**하고, null이면 지금처럼(:42) 만든다. 서비스는 같은 형식(`LOG-YmdHis-6hex`)으로 미리 만든 키를 넘긴다.
     (점검 보고는 「알림 → 로그」 순서와 「dedupe에 로그 키 포함」을 같이 제안했지만, 로그 키는 insert 안에서 만들어져서 그대로는 불가능함 — §검수 결과 참고.)
  5) 카드 주인 user_id를 읽는다(`SELECT user_id FROM study_rooms|tutors WHERE id = ?`. AdminExposureRepository::findStudyRoom/findTutor(:141, :154)는 user_id를 고르지 않음 — 그 파일은 고치지 말 것).
  6) `ProviderReminderRepository::upsertSystemNotice`로 1행:
     - notice_kind = `admin_hide`
     - dedupe_key = `admin_hide:study_room:{id}:{logKey}` / `admin_hide:tutor:{id}:{logKey}` (숨길 때마다 새 행. 191자 이내 확인)
     - title = `홈·찾기 숨김`
     - body = `이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.`
     - action_href = `/support/contact` (가능하면 `/support/contact?category=unhide_request`, 4항과 같은 값)
     이 호출이 예외 없이 끝나면 notified=true. 예외면 notified=false로 두고 계속(MySQL은 실패한 문장만 되돌림. 단 PDO가 트랜잭션이 끝났다고 하면(`inTransaction()===false`) 다시 던짐).
  7) 로그 INSERT(user_notified = notified, logKey 전달). 8) commit. 3~7 중 알림 외 실패는 rollback 후 예외.
- 공부방·과외쌤 publish(다시 보이기): 알림 0건, user_notified=0 (지금과 같음).
- 학생 hide (:232): user_notified **false**(학생 알림함 없음 — notices.php:13 `requireProvider`, PaidApi.php:43-45). 알림 INSERT 없음.
- 제출자료 hide (:298): **false**. 이용제한 `AdminMemberService.php:200` `$action === 'block'` → **false**. 둘 다 보내는 코드가 없으므로 같은 오류(보내지 않은 알림을 보냈다고 기록)를 고치는 것. 새 기능 아님.
- 화면: `preview/home-ui/src/provider-notices.js`
  - :52 버튼 글자: `notice_kind === 'admin_hide'`일 때만 「고객센터 운영문의」, 나머지는 지금처럼 「유료 서비스 안내」.
  - :46 종류 줄은 지금 영문 키를 그대로 보여 줌(「시스템 안내 · admin_hide」가 됨). `admin_hide`일 때만 「시스템 안내」로. 다른 종류의 표시는 건드리지 말 것(보고에 별건으로 적기).
  - 버튼 클릭이 실제로 운영문의 화면(#/support/contact)으로 가는지(`data-mypage-nav` 처리 mypage/shell.js:152) 확인하고, 마이페이지 안에서만 움직이는 처리라 안 가면 이 종류만 일반 링크로.
- 문서: `docs/ssot/28-admin-console-red-line.md` §3-b-2 표(:130-131)의 `user_notified` 기본 칸만 사실대로 고침(공부방·과외 hide = 「알림 1건 생성 시 true」, submission hide = false). 이용제한 행이 그 문서에 있으면 그 칸만. 다른 줄 수정 금지.
- `e2e/a28-07-exposure-patch.spec.js` 기대값: :119·:167(공부방·과외 hide) true 유지 + 알림 행 1건 확인 추가, :210(학생 hide) false, **:300(제출자료 hide) false**(점검 보고에서 빠진 줄).

### 항목 4 — 마이페이지 숨김 안내 한 줄 (세 역할)
- 문구 상수 1개를 `preview/home-ui/src/lifecycle-copy.js`에 추가(PROFILE_STATUS_LABELS 옆). 문구는 t1504 그대로, 링크 글자 「고객센터 운영문의」(문장 안 단어에 링크를 걸거나 문장 뒤 작은 링크 1개 — 어느 쪽이든 1개).
- 렌더 위치(허브 본문 맨 위, 한 번만):
  - 공부방 `study-room-reg/screens.js:288` body 맨 앞(카드가 있으면 목록 대신 허브로 감, :148-155)
  - 과외쌤 `tutor-reg/screens.js:224` body 맨 앞
  - 학생 `student-reg/screens.js:236-240` `p19-hub-body` 안 맨 앞
  - 조건: 공부방·과외 `profile_status === 'hidden'`, 학생 `exposure_status === 'hidden'`. 다른 상태면 0개.
- 링크: `#/support/contact`. 운영문의 화면이 `?category=unhide_request`를 읽어 그 유형을 미리 고르게 하는 것은 `support/screens.js`(허용 파일) 안에서만 가능하면 넣고, 사용자는 다른 유형으로 바꿀 수 있어야 함. 안 되면 「막힘」으로.
- 다시 켜기·공개 신청 버튼 0개. 기존 배지 「비공개」(lifecycle-copy.js:13)는 그대로.

### 항목 5 — 과외쌤 「공개조건」 잔재 정리 (점검 보고 Q11·Q16 표 그대로)
- 지움: `tutor-reg/registration-check-copy.js` badges `publishOk`(:10)·`publishHidden`(:12)·`publishNeed`(:13), next `hidden`(:24).
- `tutor-reg/registration-check-model.js`: :345-352 publish 배지는 `published`일 때 「노출 중」(publishLive)만 남기고 나머지 분기는 배지를 만들지 않음. :319-320 hidden next 액션 제거(허브 한 줄이 대신). :287-325에서 hidden이면 픽·프라임 부족 배지를 앞세우지 않음(입력 유도는 필드 보드에만).
- `tutor-reg/format.js`: :361-366 hidden 분기의 「공개 신청하기」 버튼 삭제(보정 버튼 2개는 유지). 호출처 0인 `getProductApplyHint`(:130-137)·`getUnlockCards`(:143~끝) 삭제 — 삭제 전 rg로 호출처 0 재확인, 이 둘만 쓰던 import가 생기면 그것만 정리.
- 바꿈: `plans/order-blocks.js:87`, `plans/screens.js:598`, `:621` → 「숨김 상태입니다. 구매는 홈·찾기에 다시 보인 뒤에 가능합니다.」
- 유지(손대지 말 것): `getExposureMatrix`(format.js:307-323), `tutor-reg-copy.js:41`, `student-reg/store.js:213-214`, 공부방 registration-check-copy.js, `admin-red-line-copy.js:143`, 공부방 format.js:174-179.
- `scripts/verify-tutor-registration-check-frame.mjs`: 지운 키를 읽어 HTML을 만드는 줄(:160 근처)이 깨지면 그 줄만 고침. 검사 삭제·완화 금지. `verify-study-room-registration-check-frame.mjs:116`(공부방 copy에 publishOk 없음 검사)는 그대로 통과해야 함.

### 항목 6 — 문의(support_tickets) 회원 연결·이메일 고정·유형 추가
6-a. SQL `sql/schema/076_support_ticket_user_and_unhide_category.sql` (새 파일, 068 관례: 머리 주석에 「Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용」, information_schema 확인 후 ALTER, 다시 돌려도 안전):
   - `user_id BIGINT UNSIGNED NULL` AFTER email, KEY `idx_support_tickets_user (user_id, status, id)`, FK `fk_support_tickets_user` → users(id) **ON DELETE SET NULL** (RESTRICT는 AdminMemberDeleteService.php:180 회원 삭제를 막고, CASCADE는 문의를 지움).
   - category ENUM에 `unhide_request` 추가(`'bug','policy','account','other','unhide_request'`, NOT NULL 유지).
   - 머리 주석에 되돌리기 SQL(점검 보고 ⑦과 같음).
6-b. backfill은 **따로** `sql/schema/076_support_ticket_user_backfill.sql`: (1) 적용 전 건수 SELECT(total·one_match·zero_match·many_match, `LOWER(TRIM(email))` = EmailNormalizer.php:11과 같음) (2) 1건만 맞는 행만 UPDATE, 0건·2건 이상·탈퇴(withdrawn.* 주소) 행은 NULL 유지 (3) 결과 SELECT(`SUM(user_id IS NOT NULL)` = 앞의 one_match). 점검 보고 Q22·⑦ SQL을 기초로.
6-c. `rest-schema.sql` support_tickets 정의(:1053-1069)만 같은 모양으로. `sql/verify/schema_check.sql` 끝에 `SHOW COLUMNS FROM support_tickets LIKE 'user_id';`, `... LIKE 'category';` 두 줄 + 그룹 SELECT 1줄.
6-d. 서버
   - `public/api/support/tickets.php` POST: `SupportApi::requireUser()` 먼저(비로그인 401). 서비스에 세션 user를 넘김.
   - `SupportTicketService::create`: 요청 `email`·`role`은 무시. `user_id` = 세션 user_id, `email` = DB `users.email`(그 id로 SELECT), `role_type` = 세션 role_type 매핑(`study_room_owner→study_room`, `tutor→tutor`, `guardian_student→parent`, 그 밖 `guest`). ALLOWED_CATEGORIES에 `unhide_request`.
   - `SupportTicketRepository`: INSERT에 user_id. **user_id 칼럼이 없는 DB에서도 깨지지 않게** `hasReplyColumns()`(:21-30)와 같은 방식의 칼럼 확인을 두고, 없으면 지금 INSERT·조회 그대로(배포가 076보다 먼저 되는 사고 대비).
   - 내 목록: `GET tickets.php?mine=1` → requireUser → `WHERE user_id = ? OR (user_id IS NULL AND LOWER(TRIM(email)) = LOWER(TRIM(계정 이메일)))`. 기존 `?email=` 요청은 같은 「내 목록」으로 처리(값은 무시하고 세션 기준) — 이미 열린 옛 화면 호환.
   - 068(답변 1건 덮어쓰기, :125-138)은 바꾸지 않음.
6-e. 화면
   - `support/screens.js:325` 이메일 칸 `readonly`(계정 이메일 표시, 안내 글자 「로그인 계정 이메일로 답변 확인」 정도 1줄 가능), :447-452 payload에서 email·role을 보내도 서버가 무시함(보내지 않아도 됨).
   - `support-copy.js:387-392` TICKET_CATEGORIES에 `{ value: 'unhide_request', label: '숨김 해제 요청' }` 1줄. 관리자(a28-screens.js:938)·내역(mypage/screens.js:457-458)은 이 배열을 그대로 씀.
   - 「내 문의 내역」: `support-api.js:47-51`에 mine 조회, `mypage/screens.js:1396-1402` hydrate가 mine을 부르게, `:465-467`과 `ticket-store.js:132-134`의 **이메일 재필터를 없애고** 서버가 준 목록을 그대로 씀(재필터를 남기면 이메일이 다른 옛 문의가 사라짐).
   - 공부방·과외쌤·학생 세 역할에서 메뉴가 보이고 화면이 그려지는 것을 스크린샷으로 증명(router.js:82 roles, shell.js:63-67·91, navRoleFromAuthUser preview/shared/site-nav-config.js:278-285, screens.js:180).

### 항목 7 — 관리자 문의 목록·회원 상세
7-a. 서버(관리자 전용, `requireAdmin`): `GET tickets.php?admin=1&group=open|closed|all&q=&page=1&per_page=20`
   - group: 처리 전 = `status IN ('open','in_progress')`, 종료 = `closed`, 전체 = 셋. 기본 `open`. (162의 「남은 응대」와 같은 정의 — docs/204 Q3)
   - q: 이메일 부분일치(`email LIKE %q%`, `%`·`_` 이스케이프) 또는 숫자면 `user_id = q`도 OR. (아이디 = 로그인 이메일, users.email UNIQUE 001_init.sql:75. 별도 로그인 아이디 칼럼 없음)
   - per_page 20 고정(관리자 다른 목록에 페이지 크기 상수가 있으면 그것을 쓰고 근거 줄을 적기), `LIMIT/OFFSET`, 응답에 `total`, `page`, `per_page`, `tickets`.
   - `GET tickets.php?admin=1&user_id=N` = 그 회원 문의 전체(최신순, 읽기 전용용).
   - **파라미터 없는 기존 `GET tickets.php`(requireAdmin, 전체 목록 :16-21)는 지금 응답 그대로 둔다.** 옛 고객센터 운영 화면 `/support/admin/tickets`(support/admin-screens.js:146, :263-270)와 부트 시 `activateSupportApi`(main.js:427)가 이 응답을 쓰기 때문(점검 보고에서 빠진 화면).
7-b. 화면 `a28-screens.js` renderTicketsAdmin(:935-971): 표 위에 필터 줄(처리 전/종료/전체 버튼, 검색 입력, 검색 버튼), 표 아래 페이지 줄(이전·다음·「n / m쪽 · 총 N건」). 이메일 칸은 `memberAccountLink(t.userId, t.email)`(:1021-1030)로 회원 상세 링크. 답변 폼·상태 선택은 그대로.
7-c. 상태 분리(159-a·b 교훈): 관리자 목록 결과는 support-backend의 공용 `ticketsCache`(마이페이지도 씀)에 넣지 말고 **호스트별(hub / route) 결과·필터 상태**로 따로 둔다. 허브 팝업(a28-today-hub.js가 같은 renderTicketsAdmin을 부름, :138·:164)과 `#/admin/tickets`(:1864)가 서로의 필터·페이지를 보지 않아야 함. 필터 바꿀 때 `location.hash`를 쓰지 않고 `navigate`(bindTicketsScreen 3번째 인자 = 허브 writeHash)를 부르지 않음. 응답이 늦게 와도 그 사이 닫힌 서랍·바뀐 호스트에는 그리지 않음(요청 순번 확인). 저장(상태·답변) 뒤에는 현재 필터·페이지로 다시 조회.
7-d. 회원 상세(a28-screens.js :1400 「횟수권」 다음): 소제목 「운영문의」, 그 회원 문의 목록(번호·유형·상태·접수일·답변 유무, 읽기 전용, 없으면 「없음」). 키 이름은 `supportInquiries`(기존 `tickets` = provider_ticket_packs 횟수권과 혼동 금지, AdminMemberRepository.php:293-316). 각 줄 링크 = `#/admin/tickets?q={user_id}&group=all` — route 호스트가 처음 열릴 때만 hash의 q·group을 읽어 초기값으로 씀. 로드는 a28-screens-bind.js에서 회원 id별 1회.
7-e. `home-admin.css`: 필터 줄·페이지 줄 간격 규칙만, 전부 `.admin-shell`로 시작, **파일 끝에 추가만**.

## 3. 허용 파일 (이 밖 수정 = 불합격)
[관리자]
- preview/home-ui/src/admin/a28-screens.js — renderTicketsAdmin(필터·검색·페이지 줄, 회원 링크), 회원 상세 「운영문의」 목록. 그 밖 함수 수정 금지
- preview/home-ui/src/admin/a28-screens-bind.js — bindTicketsScreen 호스트별 상태·서버 조회, 회원 상세 문의 로드. 그 밖 수정 금지
- preview/home-ui/src/styles/home-admin.css — 끝에 `.admin-shell` 규칙 추가만

[사이트 화면]
- preview/study-room-ui/src/form-collect.js — :354, :480 profile_status 기본값·전송만
- preview/tutor-ui/src/form-collect.js — :163, :220 같음
- preview/home-ui/src/lifecycle-copy.js — 숨김 안내 문구 상수 1개(+ 링크 경로 상수)
- preview/home-ui/src/study-room-reg/screens.js — renderHub 한 줄
- preview/home-ui/src/tutor-reg/screens.js — renderHub 한 줄
- preview/home-ui/src/student-reg/screens.js — renderHub 한 줄
- preview/home-ui/src/tutor-reg/format.js — 「공개 신청하기」 버튼, 호출처 0 함수 2개
- preview/home-ui/src/tutor-reg/registration-check-copy.js — 키 4개 삭제
- preview/home-ui/src/tutor-reg/registration-check-model.js — 그 키를 쓰는 배지·next 분기
- preview/home-ui/src/plans/order-blocks.js — :87 문구
- preview/home-ui/src/plans/screens.js — :598, :621 문구
- preview/home-ui/src/provider-notices.js — admin_hide 종류 버튼 글자·종류 줄(필요 시 링크 방식)
- preview/home-ui/src/support/screens.js — 이메일 readonly, 유형 미리 선택, 제출 payload
- preview/home-ui/src/support/support-copy.js — 유형 1줄(+ 관리자 필터 라벨 상수 필요 시)
- preview/home-ui/src/support/support-api.js — mine 조회, 관리자 목록·회원별 조회 함수
- preview/home-ui/src/support/support-backend.js — mine hydrate(공용 캐시는 내 목록만)
- preview/home-ui/src/support/ticket-store.js — 내 목록 이메일 재필터 제거
- preview/home-ui/src/mypage/screens.js — renderContactHistory(:465 이후)·contact hydrate(:1396-1402)만

[서버 PHP]
- src/StudyRoom/StudyRoomRegisterService.php — saveFacility만
- src/Registration/StudyRoomHubService.php — publish hidden 거절
- src/Tutor/TutorRegisterService.php — saveContact만
- src/Registration/TutorHubService.php — publish hidden 거절(publishMissing 내용 변경 금지)
- src/Admin/AdminExposureService.php — hide 트랜잭션·알림·user_notified, publish 완성도 판정, submission :298
- src/Admin/AdminOperationLogRepository.php — insert()에 맨 뒤 선택 인자 `?string $logKey = null`만
- src/Admin/AdminMemberService.php — :200 한 줄만
- public/api/support/tickets.php — POST 로그인, mine, admin 목록·회원별
- src/Support/SupportTicketService.php — 세션 기준 생성, 유형, 목록 메서드
- src/Support/SupportTicketRepository.php — user_id INSERT·조회, 필터 SELECT·COUNT, 칼럼 확인

[SQL]
- sql/schema/076_support_ticket_user_and_unhide_category.sql — 새 파일
- sql/schema/076_support_ticket_user_backfill.sql — 새 파일
- sql/schema/rest-schema.sql — support_tickets 정의만
- sql/verify/schema_check.sql — 끝에 3줄 추가

[검사·e2e·문서]
- e2e/a28-07-exposure-patch.spec.js — :119·:167 알림 행 확인 추가, :210·:300 false
- scripts/verify-tutor-registration-check-frame.mjs — 지운 키 때문에 깨지는 줄만
- scripts/verify-basic-exposure-gate.mjs — 새 SELECT에 대한 가짜 PDO 답 추가만(검사 삭제·완화 금지). 안 깨지면 수정 0
- scripts/verify-hide-inquiry-bundle.mjs — 새 파일(§4-2)
- e2e/hide-inquiry-20261007.spec.js — 새 파일(§4-3, API 수준 저장 증명)
- docs/ssot/28-admin-console-red-line.md — §3-b-2 user_notified 칸만

건드리면 안 되는 파일(특히): a28-today-hub.js, a28-screens-state.js, a28-copy.js, a28-screens-shared.js, support/admin-screens.js, StudentHubService.php, StudentHubRepository.php, AdminExposureRepository.php, AdminMemberRepository.php, ProviderReminderRepository.php, ProviderNoticeService, SearchService.php, StudyRoomPublicReadService.php, mypage/shell.js(「학부모」 글자는 별건으로 보고만), mypage-notice-strip.js, 068 SQL, 공부방 registration-check-copy.js.

**162와 겹침:** 162(docs/205, 브랜치 cursor/admin-162-20261007)도 a28-screens.js·a28-screens-bind.js·home-admin.css·rest-schema.sql·schema_check.sql을 고칠 수 있음(a28-copy.js는 이 묶음이 안 건드림). 이 파일들에서는 **기존 줄을 옮기거나 다시 쓰지 말고, 필요한 함수 안에서만 최소로 추가·수정**하세요. 파일 끝 추가(CSS·schema_check)는 162와 줄이 겹칠 수 있으니 보고에 추가한 줄 범위를 적으세요. 마이그레이션 번호는 076만.

## 4. 숫자 합격 기준
4-1. 기존 검사 (11b0c0d에서 먼저 돌린 값과 바꾼 뒤 값을 **둘 다** 보고)
- `npx vite-node scripts/verify-admin-today-hub.mjs` : 55 pass / 0 fail (같거나, 늘었다면 정확한 숫자와 이유)
- `npx vite-node scripts/verify-admin-preview-labels.mjs` : 198 / 0
- `npm run verify:shop-page` : 54 / 0
- `npm run verify:tutor-registration-check-frame` : 기준값과 같은 pass, 0 fail
- `verify-study-room-registration-check-frame.mjs` : 기준값과 같음, 0 fail
- `npx --prefix preview/home-ui vite-node scripts/verify-basic-exposure-gate.mjs` : 기준값과 같음, 0 fail (이 검사는 가짜 PDO로 StudyRoomRegisterService·StudyRoomHubService를 실제로 탐 — saveFacility·publish에 SELECT를 추가하면 깨질 수 있음. 깨지면 그 스크립트의 가짜 PDO에 새 SELECT 답만 추가. 검사 삭제·완화 금지)
- `verify-support-home-library.mjs`, 그 밖에 바꾼 파일 이름을 읽는 모든 scripts/verify-*: rg로 찾은 목록 + 각 전후 숫자
- 바꾼 PHP 파일 전부 `php -l` 통과, `cd preview/home-ui && npm run build` 성공(경고 수 전후)
4-2. 새 `scripts/verify-hide-inquiry-bundle.mjs` (fail=0, 검사 수 보고). 최소 검사:
  (a) saveFacility: 현재 hidden + 요청 published → UPDATE 값 hidden / 요청 없음 + 현재 published → published / 요청 draft + 현재 published → draft(마법사 동작 유지)
  (b) saveContact: 현재 hidden + 요청 published → hidden
  (c) StudyRoomHubService·TutorHubService publish: hidden → reason not_allowed, UPDATE 0회
  (d) AdminExposure 공부방·과외 hide: provider_system_notices INSERT 1회(kind admin_hide, dedupe에 로그 키, 제목·본문 문자열 정확히) + 로그 user_notified=1 / 알림 INSERT 예외 → 숨김 유지·user_notified=0 / 이미 hidden → 알림 0
  (e) 학생 hide·제출자료 hide·이용제한 → user_notified=0, 알림 INSERT 0
  (f) 공부방·과외 publish: 대표지역1 없음 → draft + missing, 있음+필수칸 있음 → published, 알림 0
  (g) 안내 문구 상수 = t1504 문장과 글자 하나까지 같음, 세 허브 렌더 결과에 hidden이면 정확히 1번·아니면 0번, 「다시 켜」「해제 후」「공개 신청」 0건(과외 허브·등록점검·plans 문구 렌더 기준)
  (h) tickets POST: 비로그인 401 / 요청 email 다른 값 → 저장 email = 계정 이메일, user_id = 세션 / category unhide_request 허용
  (i) 관리자 목록 SQL: group=open에 closed 0, group=closed에 open·in_progress 0, LIMIT 20 OFFSET (page-1)*20, total 별도 COUNT, q 숫자면 user_id 조건 포함, `%`·`_` 이스케이프
  (j) 파라미터 없는 GET 응답 모양이 11b0c0d와 같음
  (k) 076 SQL: information_schema 확인 2곳, ON DELETE SET NULL, ENUM 5개, 「Actions는」 주석 / backfill: HAVING n = 1, 건수 SELECT 4칸
  (l) a28 허브·라우트 코드에 필터용 `location.hash =`·navigate 호출 0, 관리자 목록이 공용 ticketsCache를 쓰지 않음
  (m) home-admin.css 추가 규칙 전부 `.admin-shell`로 시작
  (n) 화면 문자열에 「학부모」 0(이번에 바꾼 파일 렌더 기준)
4-3. 새로고침 뒤에도 남는 것 증명(API 수준, 실제 DB. `e2e/hide-inquiry-20261007.spec.js`, a28-07과 같은 helper 사용):
  - 공부방 숨김 → 주인 facility 저장(상세정보2 payload, profile_status 없음) → 주인 publish 시도(not_allowed) → 다시 GET: profile_status=hidden. 과외 contact에 published 넣기 → GET hidden.
  - 숨김 1회 → provider_system_notices 1행(is_read=0), 다시 보이기 → 증가 0, 다시 숨김 → 2행. 학생 숨김 → 0행, user_notified=0.
  - 로그인 접수 1건 → DB user_id = 그 회원, email = users.email. 새로고침(다시 GET mine) 뒤 목록에 있음. 비로그인 POST 401.
  - 관리자 group·q·page 응답 → 같은 요청 다시 → 같은 total·같은 행.
  - 이 환경에서 DB e2e를 못 돌리면 「막힘 + 이유」를 적고 4-2의 가짜 PDO 검사로 SQL 순서를 대신 증명(그래도 완료 처리 아님 — 검수에서 판단).
4-4. 스크린샷(파일 경로와 함께): (1) 공부방·과외쌤·학생 허브 숨김 한 줄(3장) (2) 공부방 또는 과외쌤 마이페이지 시스템 안내 카드(admin_hide, 버튼 「고객센터 운영문의」) (3) 운영문의 화면 — 이메일 readonly + 유형 「숨김 해제 요청」(미리 선택 상태) (4) 관리자 문의 목록 — 처리 전 필터·검색어·페이지 줄이 보이는 상태(허브 팝업 1장, #/admin/tickets 1장) (5) 회원 상세 「운영문의」 목록 (6) 공부방·과외쌤·학생 「내 문의 내역」 각 1장.

## 5. 운영 순서 초안 (보고에 그대로 적을 것, 실행은 종현이 함)
1) phpMyAdmin: 068 적용 확인 SELECT(점검 보고 Q24) → 2행이 아니면 068 먼저 적용
2) backfill 파일의 (1) 건수 SELECT 실행·기록
3) 076 본문 실행 → SHOW COLUMNS user_id·category 확인
4) backfill (2) UPDATE → (3) 결과 SELECT가 one_match와 같은지
5) 종현 승인 → main 반영 → 배포 → 라이브 확인
(Actions는 SQL을 실행하지 않음.)

## 6. 보고 형식 (한국어, 마지막 메시지 하나)
① 기준 SHA, 브랜치명, 커밋 SHA 전부, `git diff --stat origin/main...HEAD`, 바뀐 파일 목록(허용 목록과 1:1 대조표), PR 0건·main push 0건 확인 명령
② 항목 1~7별: 바꾼 파일:줄, 저장 경로(화면 → API → 서비스 → SQL → 테이블.칼럼 → 다시 읽는 GET)
③ 검사 숫자표(4-1 전후, 4-2, 4-3), 빌드 결과
④ 스크린샷 목록
⑤ SQL 전문(076 본문, backfill, 되돌리기)과 §5 운영 순서
⑥ 위험(높음/중간/낮음, 근거 줄, 막은 방법)
⑦ 「종현 확인 필요」 — 최소: 1-e 마법사 공개 상태 칸이 공개조건 잔재인지(근거 포함), TutorHubService::publishMissing이 잔재인지, 항목 2 판정 규칙의 칸 목록, 찾기 목록이 draft 공부방·과외쌤도 보여 주는 현재 설계, provider-notices 다른 종류의 영문 키 표시, mypage/shell.js:73 「학부모」, 옛 /support/admin/tickets 화면 존치
⑧ `git status -sb` (깨끗함)
```

---

## §검수 결과 (2026-10-07, ad81b93)

검수: 우동공과2 (2026-10-07 05:40~06:34 KST). 대상: `origin/cursor/hide-inquiry-20261007` = `ad81b93296176d8cf666dc525b820e50ded1aa20` (부모 `11b0c0d`, 1커밋, 39파일 +1763/−244). 별도 worktree `/workspace/study114-wt-hide`(ad81b93), 기준 비교용 `/workspace/study114-wt-base`(11b0c0d)에서 검사. 저장소 브랜치·main·PR은 건드리지 않음.

### 판정: **보완 필요**

잠긴 정책과 어긋난 오류 1건(D6, 원인은 이 지시서 항목 2 판정 규칙의 허점), 중간 3건(D1·D3·D7), 낮음 3건(D2·D4·D5). 범위 이탈 0, 금지 파일 수정 0, 용어 위반 0. 재작업지시서: `docs/207-hide-inquiry-rework-2026-10-07.md`.

### 1. 기본 확인

| 확인 | 결과 |
|---|---|
| main | `11b0c0d` 그대로 |
| 브랜치 커밋 수 | 1 (`11b0c0d..ad81b93`), 강제 푸시 흔적 없음 |
| 새 PR | 없음 (최신 #29·#28 닫힘, #27 예전 것) |
| 예상 밖 브랜치 | 없음 |
| 바뀐 파일 39개 | 전부 §3 허용 목록 안. AdminMemberService 1줄(`:200` false), AdminOperationLogRepository 끝 인자 `?string $logKey = null`만, home-admin.css 끝에 붙이기(1013~1041, 전부 `.admin-shell` 시작)만. verify-basic-exposure-gate·verify-tutor-frame 미수정 |
| php -l (바뀐 PHP 10개) | 전부 OK |
| 용어 (추가된 줄) | 「학부모」·「보드」·「수업지역」 0건 (주석 1·내부 키 `'parent'`만) |

### 2. 항목별 판정

| 항목 | 판정 | 근거 (ad81b93 기준 file:line) |
|---|---|---|
| 1 숨김 보존 | PASS (+D2 낮음) | StudyRoomRegisterService.php:1018~1031 hidden이면 hidden 유지, 빈 요청은 현재 값, published_at은 published일 때만 COALESCE. TutorRegisterService.php:713~722 동일. form-collect(공부방 :354~356·:495~496, 과외쌤 :163~165·:229~230) 값 있을 때만 상태 변경·빈 값이면 키 생략. 박스에서 숨김 카드 저장 후 hidden 유지 확인 |
| 1 publish API 차단 | PASS | StudyRoomHubService.php:57~59, TutorHubService.php:58~60 `not_allowed`. 화면 호출처 없음 |
| 2 다시 보이기 판정 | **FAIL (D6, 잠긴 정책과 어긋난 오류)** | AdminExposureService.php:464~534. 대표지역1·이름·교습형태·주력과목·슬로건·사업장주소 / 과외지역1·표시명·주력과목 확인은 정확(실측: 빠짐 → draft+missing[슬로건, 사업장주소], 다 차면 published, 과외지역1 없음 → draft+missing[과외지역1]). 그러나 공부방 「주대상」 누락 |
| 3 숨김 알림 | PASS | AdminExposureService.php:~373 hideProviderCard: 트랜잭션, 첫 숨김만 알림 1건(dedupe `admin_hide:{type}:{id}:{logKey}`), 이미 숨김이면 알림 0·user_notified 0, 학생·제출 숨김 false(:270, :336). 실측: 첫 숨김 알림 1·user_notified 1, 두 번째 알림 0, 다시 보이기 알림 0 |
| 3 user_notified 정직화 | PASS | src/Admin 아래 logs->insert 전부 false(알림 실제 쓴 경우만 true), AdminMemberService.php:200 false |
| 4 소유자 숨김 안내 | PASS (+D5 낮음) | lifecycle-copy.js:10~25, 세 허브 첫머리 1회. 링크 → `#/support/contact?category=unhide_request`, 분류 미리 선택·이메일 읽기 전용 실측 |
| 5 남은 키·보조 함수 정리 | PASS | tutor-reg 남은 키·미사용 함수 2개 제거, rg 결과 끊긴 참조 0 (verify-study-room 틀 :116·옛 문서 1줄만) |
| 6 문의 본인 확인 | PASS | tickets.php: 무인자 GET·`admin=1` 관리자만(공부방 계정 403), 비로그인 401, `mine`/`email`은 세션 user_id로만(`?email=남` → 본인 것만). POST requireUser·이메일은 users.email |
| 6 076·backfill | PASS | 박스 MariaDB에서 3회 반복 적용 OK, FK `ON DELETE SET NULL`, 인덱스 3칼럼. backfill: 대소문자·공백 차이 매칭 채움, 탈퇴 주소 NULL 유지, one_match 2 = 채움 2, 재실행 변화 0 |
| 6 내 문의 내역 | **FAIL (D1 중간)** | mypage/screens.js:466이 공용 캐시 `listTickets()`를 그대로 씀 → 관리자 능력 계정에서 남의 문의가 보임 |
| 7 관리자 문의 목록 | PASS (+D4 낮음, D7 중간) | 그룹(처리 전=open+in_progress / 처리 완료 / 전체)·검색(LIKE 이스케이프 `a%b_c` 1건, 주입 문자열 0건, 숫자 q는 user_id도)·20건 쪽 나눔(29건 → 2쪽 9건) 실측 OK. hash를 쓰지 않음·hub/route 상태 독립 실측 OK. 회원 상세 「운영문의」 목록 OK |
| e2e a28-07 갱신 | **FAIL (D3 중간)** | Q7 회귀 + afterAll 복구 실패로 dev 시드 공부방 3이 draft에 고정 |
| 문서(ssot 28) | 부분 | :130~131만 갱신, :132 publish 행 「→ published」가 이제 틀림 (종현 확인 11) |

### 3. 결함 (재작업 대상)

**D6 (잠긴 정책과 어긋난 오류)** — 다시 보이기 판정에서 공부방 「주대상」 누락.
- 위치: AdminExposureService.php:464~501 `studyRoomUnhideMissing`.
- 근거: 주대상은 기본 가입 필수(BasicRegisterService.php:1031~1033, 없으면 예외)이고 카드에 표시됨(SearchService.php:578~589 `$audienceExpr`, `study_room_primary_audiences`). 잠긴 정책 「기본 카드 노출 = 기본 가입 필수칸 전부」에 들어가는 칸인데 판정에서 빠져, 주대상 없는 카드가 published로 돌아갈 수 있음.
- 원인: 이 지시서 항목 2가 판정 칸을 카드 테이블 칼럼으로 좁혀 적음(지시서 허점). 에이전트 이탈 아님.
- 원장 성별·집주소는 user_profiles 계정 칸이고 카드에 안 나옴 → 판정에 넣을지 종현 확인 13.

**D1 (중간)** — 공용 문의 캐시 충돌, 관리자 능력 계정의 「내 문의 내역」에 다른 회원 문의가 보임.
- 위치: mypage/screens.js:466 (`const tickets = listTickets()`). 공용 캐시는 support-backend.js:61~79 `hydrateSupportCache`(부트 시 무인자 GET = 관리자면 전체), 옛 /support/admin/tickets 화면, :115 `upsertTicketCache`(:151~161 관리자 상태·답변 저장)가 남의 문의를 채움. :44 `hydrateMyTickets`도 같은 캐시를 덮어씀.
- 재현(박스 실서버, room-owner2에 admin_level 임시 부여 = 시장 역할+관리자 능력 계정): ad81b93 첫 화면 30건(전체), mine 로드 뒤 1건, /support/admin/tickets 다녀온 뒤 다시 30건. 11b0c0d는 1건 고정. 스크립트 `/workspace/review/hide/d1-repro.mjs`.
- 지시서 §3 「support-backend.js — mine hydrate(공용 캐시는 내 목록만)」 위반. 보고의 「hydrateMyTickets만 공용 캐시에 씁니다」는 사실과 다름.

**D3 (중간)** — e2e a28-07 회귀와 dev 시드 손상.
- 위치: e2e/a28-07-exposure-patch.spec.js:148 Q7, e2e/helpers/admin-api.js:107~122 restoreExposureDefaults.
- 11b0c0d: 23 통과(실패 1 = 기존 「잘못된 target_type → 422」, student가 유효 대상이 되어 200). ad81b93: 22 통과, Q7 실패(Expected "published", Received "draft") — 시드 공부방 3에 slogan·address_text가 없음. afterAll의 publish도 `draft_not_publishable`(400)로 실패해 실행 뒤 공부방 3이 draft에 고정, 다음 실행부터 Q7은 400.
- 보고에서 위험으로 적었지만 고치지 않았고, §4 e2e 통과 기준을 못 채움.

**D7 (중간)** — 회원 상세 「운영문의」 링크가 문의 화면을 이미 연 뒤에는 거르지 않음.
- 위치: a28-screens-bind.js:2157~2166 `bindTicketsScreen`. `!state.initialized`일 때만 hash의 q·group을 읽음.
- 재현(박스 실브라우저, `/workspace/review/hide/memberlink.mjs`): `#/admin/tickets` 열기 → 회원 상세 → 링크 클릭. hash는 `#/admin/tickets?q=1&group=all`인데 목록은 「1 / 2쪽 · 총 29건」, 검색칸 빈칸.
- 원인: 지시서 7-d 「처음 열릴 때만」 문구를 그대로 따름(지시서 허점).

**D2 (낮음)** — 소유자 폼이 오래된 'hidden'을 다시 보내면 422.
- 위치: study-room-ui save-flow.js:7·tutor-ui save-flow.js:27이 서버 값(hidden 포함)을 state에 넣고, study-room-ui form-collect.js:495~496이 그대로 보냄. 관리자가 그 사이 다시 보이기를 하면 StudyRoomRegisterService.php:1028~1030 `optionalEnum`(:2352~)이 「profile_status: 유효하지 않은 값입니다.」로 422. TutorRegisterService.php:716~718 requireEnum도 같은 구조.
- 11b0c0d에서는 폼이 늘 'draft'로 덮어써서 생기지 않던 오류.

**D4 (낮음)** — 관리자 문의 목록 필터에서 선택된 그룹이 안 보임.
- 위치: a28-screens.js:1017 `is-on` 클래스(.btn에 스타일 없음, aria-pressed 없음). 같은 파일 :1210·today-hub :161 관례는 `btn--primary` + `aria-pressed`.

**D5 (낮음)** — 숨김 안내 줄의 링크가 일반 글자처럼 보임.
- 위치: lifecycle-copy.js:18~25. 전역 `a { color: inherit; text-decoration: none; }`(home.css:23) 때문에 「고객센터 운영문의」가 링크로 안 보임(캡처 r-01).

### 4. 증거 결함 (에이전트 캡처)

- 11-history-student.png: 보고에 있으나 파일 없음.
- 06-admin-hub: 필터·쪽 나눔이 안 보임. 08-member: 회원 상세가 아닌 목록. 09·10: 같은 조각 화면.
- 전부 메뉴 없는 조각 렌더라 역할별 메뉴 증거가 없음.
- → 박스 실서버(MariaDB+PHP+vite)에서 직접 캡처로 대체: `/workspace/review/hide/shots/r-01-room-hub.png` ~ `r-06-member.png`.

### 5. 검사 전후 (`npx vite-node`, 박스)

| 검사 | 11b0c0d | ad81b93 |
|---|---|---|
| verify-today-hub | 55/0 | 59/0 (css-admin-shell-16~19 추가) |
| verify-preview-labels | 198/0 | 198/0 |
| verify-shop-page | 54/0 | 54/0 |
| verify-tutor-frame | 98 통과 / 3 FAIL (기존: render publish wrap, page CTA after board, copy BASIC kicker) | 동일 |
| verify-study-room-frame | 100 OK | 100 OK |
| verify-basic-exposure-gate | 24/0 | 24/0 |
| verify-support-home-library | 49/0 | 49/0 |
| verify-hide-inquiry-bundle (신규) | — | 48/0 |
| verify-region-save-rules | 46/0 | 46/0 |
| verify-room-basic-register-api | 4 FAIL (기존) | 4 FAIL (동일) |
| verify-paid-renewal | 38/0 | 38/0 |
| study-room-inquiries-samples / tutor-inquiries-settings / tutor-lesson-optional | OK | OK |
| verify-tutor-draft-reuse | 10/0 | 10/0 |
| verify-tutor-region-label | 103/0 | 103/0 |
| npm run build | OK (경고 3줄) | OK (같은 경고 3줄) |

### 6. e2e (박스에서 실행함)

- 환경: MariaDB 11.8 별도 인스턴스(127.0.0.1:3307, study114_dev), 스키마 001~076+backfill을 apply-schema-dev.ps1 순서대로 적용, PHP 8.4 `php -S :8080`, vite `:5174`, docker 대체 shim, Playwright chromium. 재현 방법 `/workspace/review/hide/README-e2e.md`.
- e2e/hide-inquiry-20261007.spec.js: **5/5 통과**, 같은 DB에서 연속 2회 통과.
- e2e/a28-07: 11b0c0d 23 통과(기존 실패 1) → ad81b93 22 통과 + Q7 실패(D3).
- 새로고침 뒤 유지(실측): 숨김 상태(소유자 저장 뒤 새 GET에서 hidden), 숨김 알림(소유자 새 요청 `GET /api/paid/notices.php`에 그대로), 076 user_id·backfill 결과(DB 재조회), 허브 숨김 안내 줄(새 페이지 로드에서 1회 표시, 캡처 r-01). 관리자 문의 상태·답변 저장 뒤 유지는 이번에 따로 재확인하지 않음 — 재작업 검수 때 확인.

### 7. 관찰 (결함 아님, 기록)

- 숨김 판정 시 현재 상태를 트랜잭션 밖에서 잠금 없이 읽음 → 동시에 두 번 숨기면 알림 2건 가능(드묾).
- 옛 무인자 GET 응답에 `userId` 키가 늘어남(추가만).
- listMine의 「user_id NULL + 같은 이메일」 보완 조회: 기존 동작과 같음. 탈퇴(행 삭제→SET NULL) 뒤 같은 이메일로 새로 가입하면 옛 문의가 보일 수 있음(낮음).
- 문의 번호 날짜가 UTC 기준(기존).

### 8. 종현 확인 필요

203 §5에서 이어받은 8건:
1. 마법사 「공개 상태」 칸(1-e)이 공개조건 잔재인지.
2. TutorHubService::publishMissing이 잔재인지.
3. 찾기 목록이 draft 공부방·과외쌤도 보여 주는 현재 설계 유지 여부. **보강:** 실측으로 다시 보이기 결과가 draft여도 `searchVisible=true` — 항목 2의 draft가 찾기 노출을 막지 못함. 잠긴 정책 「불완전 카드는 노출 안 함」과 어긋난 기존 설계(이번 묶음 밖)로 판단.
4. 068 운영 적용 여부.
5. 비회원 문의 경로가 없어져 로그인 못 하는 사람의 계정·로그인 문의 창구가 없음.
6. backfill에서 매칭 0건·2건 이상인 옛 문의는 user_id NULL로 남음(운영 실행 전 (1) 집계 숫자 확인).
7. mypage/shell.js:73 「학부모」 문구.
8. 옛 /support/admin/tickets 화면 존치 여부.

새로 추가:
9. 운영 데이터 점검: 지금 published·hidden인 카드 중 슬로건·사업장주소·표시명·주력과목·대표지역1/과외지역1·주대상이 빠진 수 — 이 카드들은 다시 보이기 시 draft가 됨(읽기 전용 SQL, 운영 실행은 종현).
10. provider-notices의 다른 종류 영문 키 표시(⑦ 요구 항목, 이번 범위 밖).
11. ssot 28:132 publish 행이 이제 부정확(문서 정정 필요 여부).
12. admin_hide 알림은 /mypage/plans·/plans 화면 배너에만 표시됨(허브 안내 줄로 보완됨 — 이대로 둘지).
13. 원장 성별·집주소(가입 필수, 계정 칸, 카드 미표시)를 다시 보이기 판정에 넣을지.
14. 076·backfill 운영 실행 순서(§5) — Actions는 실행 안 함, 종현이 직접.

## §재검수 결과 (2026-10-07, 2723c5f)

검수: 우동공과2 (2026-10-07 06:42~06:45 KST). 대상: `origin/cursor/hide-inquiry-20261007` = `2723c5fdd61102c50adb24af4ede0d16b0ccc493` (부모 `ad81b93`, main `11b0c0d` 기준 2커밋, 강제 푸시·새 PR 없음). 재작업지시서 docs/207. worktree `/workspace/study114-wt-hide`(detached 2723c5f). 브랜치·main·PR·배포·운영 SQL은 건드리지 않음. 박스 MariaDB 3307(`/tmp/s114-my.cnf`, 기본 3306과 별개) 재사용.

### 판정: **검수완료** · **배포 직전 (main 미반영)·종현 승인 대기**

D1~D7 전부 해소. 범위 이탈 0(12파일 = 207 §2 표와 일치, +215/−26), 금지 행위 0, 기존 FAIL(tutor-frame 3 · room-basic-register-api 4) 동일. 재작업지시서(docs/210) 불필요.

### 1. 기본 확인

| 확인 | 결과 |
|---|---|
| main | `11b0c0d` 그대로 |
| 브랜치 | `11b0c0d`→`ad81b93`→`2723c5f` (2커밋, 부모 체인 정상, force 흔적 없음: `ad81b93..2723c5f` 1커밋·역방향 0) |
| 새 PR | 없음 (열린 PR은 예전 #27 cur-007-phone-identity만) |
| 바뀐 파일 12개 | 전부 207 §2. e2e 2 · home-ui 6 · verify 1 · PHP 3 |
| php -l (바뀐 PHP 3) | 전부 OK |
| 용어 | 추가 줄에 「학부모」·「보드」·「수업지역」 0 |

### 2. D1~D7 판정

| ID | 판정 | 근거 (2723c5f file:line) |
|---|---|---|
| D6 | **PASS** | AdminExposureService.php:501~508 주대상 COUNT, :512~524 `hasPrimaryAudienceTable`(SHOW TABLES, 인스턴스 캐시). 실측: 주대상 0행 publish → `draft` + missing `['주대상']`, 1행 채운 뒤 hide→publish → `published`. tutorUnhideMissing 미변경 |
| D1 | **PASS** | support-backend.js:20 `myTicketsCache`, :52·:61 hydrateMyTickets만 기록, :92 `getMyTicketsCache`, create는 insert·status/reply는 같은 id만 갱신(:171·:180·:189). ticket-store.js:133 `listMyTickets`, mypage/screens.js:74·:466. 실측 d1-repro(room-owner2에 임시 sub_master→복구): 첫 화면·mine 후·옛 /support/admin/tickets 다녀온 뒤 모두 1건 `["my own"]` |
| D3 | **PASS** | a28-07:112~137 beforeAll이 빈 칸만 채움(슬로건·주소·주대상 등). :191 Q7b(빈 슬로건→draft+missing「슬로건」, 채움→published, finally published 복구). Q7 통과. 연속 2회 `--grep-invert "잘못된 target_type"` **24/24**, 실행 뒤 study_rooms.id=3 = `published` |
| D7 | **PASS** | a28-screens.js:946 `appliedHashKey: ''`. a28-screens-bind.js:2160~2171 route 호스트에서 hashKey로 q·group·page 재적용, hash 비면 appliedHashKey만 비움. 실측 memberlink: 1차 방문 `1/2쪽·총31건 q=` → 회원 링크 후 hash `?q=1&group=all`, pager `1/1쪽·총18건`, q=`1` |
| D2 | **PASS** | StudyRoomRegisterService.php:1023~1025 · TutorRegisterService.php:717~719 — 요청 `'hidden'`을 요청 없음과 동일. 숨김 유지는 기존 `currentStatus === 'hidden'` 분기 |
| D4 | **PASS** | a28-screens.js:1018 `btn--primary`/`btn--secondary` + `aria-pressed`, `is-on` 제거 |
| D5 | **PASS** | lifecycle-copy.js:21 문장 뒤 `<a class="btn btn--secondary btn--sm" …>고객센터 운영문의</a>` |

### 3. 검사 (`npx vite-node` / npm, 박스)

| 검사 | ad81b93 | 2723c5f |
|---|---|---|
| verify-admin-today-hub | 59/0 | **59/0** |
| verify-admin-preview-labels | 198/0 | **198/0** |
| verify-shop-page | 54/0 | **54/0** |
| verify-tutor-registration-check-frame | 3 FAIL (render publish wrap · CTA after board · BASIC kicker) | **동일 3 FAIL** |
| verify-study-room-registration-check-frame | 100 OK | **OK** |
| verify-basic-exposure-gate | 24/0 | **24/0** |
| verify-support-home-library | 49/0 | **49/0** |
| verify-hide-inquiry-bundle | 48/0 | **55/0** (D1-a·D1-b·D2·D4·D5·D6·D7 + D5 마크업 갱신) |
| verify-region-save-rules | 46/0 | **46/0** |
| verify-study-room-basic-register-api | 4 FAIL | **동일 4 FAIL** |
| verify-paid-renewal | 38/0 | **38/0** |
| study-room-inquiries-samples / tutor-inquiries-settings / tutor-lesson-optional | OK | **OK** |
| verify-tutor-draft-reuse | 10/0 | **10/0** |
| verify-tutor-region-label | 103/0 | **103/0** |
| php -l (PHP 3) | — | **OK** |
| npm run build (preview/home-ui) | OK (경고 3줄) | **OK (같은 경고 3줄)** |

### 4. e2e (박스 MariaDB 3307 · PHP :8080 · vite :5174 · docker shim)

재현: `/workspace/review/hide/README-e2e.md`. 로그: `/workspace/review/hide/rereview/`.

| 스위트 | 결과 |
|---|---|
| `e2e/hide-inquiry-20261007.spec.js` | **6/6** 통과 ×2회 (신규: 관리자 mine=1 = 본인 user_id 건수) |
| `e2e/a28-07` (`--grep-invert "잘못된 target_type"`) | **24/24** 통과 ×2회 (= 11b0c0d 23 + Q7b 1). 실행 뒤 room 3 = published |
| a28-07 전체(기존 실패 포함) | 기존 「잘못된 target_type → 422」만 FAIL(Received 200) — 이번 범위 밖·사전 존재 |

### 5. 유지(새로고침) 실측

| 항목 | 결과 |
|---|---|
| 숨김 상태 | hide 후 소유자 새 세션 GET `profile_status=hidden` 유지. DB도 hidden |
| 숨김 알림 | hide 전 9 → 후 10. 소유자 새 세션 `GET /api/paid/notices.php`에 `admin_hide` 유지(`홈·찾기 숨김`) |
| 문의 user_id | POST 생성 `userId:1`, DB `support_tickets.user_id=1`, 새 세션 목록에도 동일 |
| 관리자 상태·답변 | PATCH status=`closed` · reply=`재검수 답변 유지 확인` 후 새 세션 GET·DB 모두 유지 |
| 코드 경로 | SupportTicketRepository INSERT에 user_id(칼럼 있을 때), updateStatus/updateReply → DB. hideProviderCard 알림 insert+dedupe. myTicketsCache는 서버 mine 응답만 hydrate |

### 6. 관찰 (결함 아님)

- 시드 공부방 1은 주대상 0행이라 재검수 중 다시 보이기가 한 번 draft+missing「주대상」이 됨 → 주대상 1행 채운 뒤 published로 복구. 종현 확인 9(운영 데이터 점검)와 같은 유형.
- a28-07 「잘못된 target_type → 422」는 student가 유효 대상이 되어 200(기존, 이번 묶음 밖).

### 7. 종현 확인 필요 (14건 유지·갱신)

203§5·직전 검수에서 이어받은 목록을 그대로 둔다(이번 재작업 범위 밖).

1. 마법사 「공개 상태」 칸(1-e)이 공개조건 잔재인지.
2. TutorHubService::publishMissing이 잔재인지.
3. 찾기 목록이 draft 공부방·과외쌤도 보여 주는 현재 설계 유지 여부. (실측: 다시 보이기 결과가 draft여도 searchVisible 가능 — 잠긴 「불완전 카드 비노출」과 어긋난 기존 설계, 이번 묶음 밖.)
4. 068 운영 적용 여부.
5. 비회원 문의 경로가 없어져 로그인 못 하는 사람의 계정·로그인 문의 창구가 없음.
6. backfill에서 매칭 0건·2건 이상인 옛 문의는 user_id NULL로 남음(운영 실행 전 집계 확인).
7. mypage/shell.js:73 「학부모」 문구.
8. 옛 /support/admin/tickets 화면 존치 여부.
9. 운영 데이터 점검: published·hidden 카드 중 슬로건·사업장주소·표시명·주력과목·대표지역1/과외지역1·**주대상** 빠진 수 — 다시 보이기 시 draft(읽기 전용 SQL, 운영 실행은 종현). 박스 시드 공부방 1도 주대상 0행이었음(재검수에서 확인).
10. provider-notices의 다른 종류 영문 키 표시(이번 범위 밖).
11. ssot 28:132 publish 행이 이제 부정확(문서 정정 필요 여부).
12. admin_hide 알림은 /mypage/plans·/plans 배너에만 표시(허브 안내 줄로 보완 — 이대로 둘지).
13. 원장 성별·집주소(가입 필수·계정 칸·카드 미표시)를 다시 보이기 판정에 넣을지.
14. 076·backfill 운영 실행 순서(§5) — Actions 미실행, 종현이 직접.

### 8. 다음 절차

**배포 직전 (main 미반영)·종현 승인 대기.** 승인 후: main ff-only 반영 → 배포 → 076·backfill 운영 적용(§5) → 라이브 확인. 이 단계까지 브랜치 push·PR·배포·운영 SQL 금지 유지.
