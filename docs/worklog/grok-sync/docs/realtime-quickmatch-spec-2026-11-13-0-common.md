# 실시간 퀵매칭서비스 구현 지시서 — 0단계 공통 기반 (2026-11-13)

- 작성: 우동공과3 (2026-11-13 KST) · 실행: Cursor
- 기준: `origin/main` `5ebf19f` (PR #206 머지 후)
- 근거 문서: `docs/realtime-matching-decisions-final-2026-11-13` 브랜치(a58a18c2)의 확정안, `docs/realtime-matching-open-decisions-2026-11-13` 브랜치(31ef4a04)의 추천안, 2026-11-13 밤 종현 추가 확정(아래 「확정 규칙」)
- 이 문서 묶음: **0 공통(이 파일)** → `realtime-quickmatch-spec-2026-11-13-1-tutor.md` → `realtime-quickmatch-spec-2026-11-13-2-room.md`. 단계마다 PR을 따로 만든다.
- 시안: `assets/realtime-quickmatch-2026-11-13/` (HTML은 같은 폴더의 `css/`·`assets/`를 상대경로로 읽는다. PNG는 `png/`)
- 표기: **「1단계 조사 필요」** = 이 문서를 쓸 때 코드로 끝까지 확인하지 못한 것. 각 단계의 첫 작업(조사)에서 확정한다. **「종현 확인 필요」** = 정책·문구 결정이 남은 것.

---

## A. 확정 규칙 (모든 단계 공통, 바꾸지 말 것)

1. **혜택 성격:** 퀵매칭은 상시 「프라임 회원 전용 혜택」이다. 종료일·금액을 표기하지 않는다. 픽·비프라임 회원에게는 「프라임에서 함께 제공되고 있는 서비스입니다」로 안내하고 **따로 팔지 않는다**(상품·결제·환불 로직 추가 금지).
2. **지역:** 매칭 지역은 프라임이 **지금 광고 중인 지역만**이다. 학생 본 희망지역과 「희망지역 추가」 중 **하나라도** 프라임 광고 지역과 겹칠 때만 매칭한다.
3. **AND 매칭:** 지역 + 필수 전부 + 선택 조건이 모두 맞아야 연결된다. 점수·순위 없음. 안내문(학생 입력부·공급자 설정 화면 공통):
   > 조건을 많이 고를수록 더 꼭 맞는 상대와 연결돼요. 대신 조건이 많으면 연결되는 수는 줄어들 수 있어요.
4. **새 DB 칸(매칭 항목)은 다음 3개뿐이다.**
   - `study_rooms` 원장 나이대 — 공부방 기본등록, 단일선택 20대/30대/40대/50대 이상
   - `students` 「희망하는 원장샘 나이대」 — 다중선택, OR 매칭, 비우면 통과
   - `students` 「희망하는 과외쌤 나이대」 — 다중선택, OR 매칭, 비우면 통과
   - 원장·쌤 나이대가 비어 있으면 나이대 조건은 **건너뛰고 매칭에 포함**한다. 나이대는 카드·공개 화면에 **보이지 않는다**.
   - 그 밖에는 기존 항목만 쓴다. (기존 항목이 한쪽에 없으면 아래 E절 「미확정」에 따른다. 임의로 칸을 만들지 말 것.)
5. **공급자 설정:** 마이페이지 「실시간 퀵매칭서비스」 메뉴. 필수 조건은 등록 정보를 **읽기 전용**으로 보여 주고, 선택 조건만 스위치로 켜고 끈다. 변경은 **소급하지 않고** 다음 새 학생 등록(재매칭 포함)부터 적용. 변경은 **주 1회**, **첫 저장부터** 센다(첫 저장 전에는 여러 번 저장 가능). 화면에 다음 변경일과 「오늘 받은 매칭 쪽지 N건 / 하루 20건」을 표시한다.
6. **알림:** 1차는 **쪽지만**. 공급자당 하루 **20건**. 같은 학생은 한 공급자에게 **한 번만**. 프라임이 끝나거나 환불되면 **즉시** 대상에서 뺀다.
7. **재매칭:** 학생이 매칭 항목(지역·대상/학교급·과목·필수·선택 조건)을 바꾸면 **새로 맞게 된 공급자에게만** 보낸다. 이미 받은 공급자에게는 다시 보내지 않는다. **학생당 하루 1회.** 매칭과 상관없는 항목(소개글·요청문 등)만 고치면 보내지 않는다.
8. **학교 표기 금지:** 스카이·학교명은 쪽지·카드 **어디에도 표기하지 않고** 조건으로만 쓴다. 학생이 받는 쪽지(퀵매칭 탭)에는 「학력 등 조건은 상담할 때 쌤(원장님)의 인증서류로 꼭 확인해 주세요」 류의 조언을 넣는다.
9. **학생 기본등록 UI:** 「실시간 퀵매칭」 제목을 **박스 밖**에 두고, 매칭 항목 옆에 「매칭 필수」「매칭 선택」 태그를 단다. 나이대는 희망 유형에 맞는 **한 줄만** 보인다(과외 → 희망하는 과외쌤 나이대, 공부방 → 희망하는 원장샘 나이대).
10. **마이페이지 메뉴(과외쌤·공부방만):** 계정설정 **바로 위**에 Event 이모티콘 + 「실시간 퀵매칭 / 서비스」 두 줄. **프라임일 때만 황금색**, 아니면 **회색**. 색은 마이페이지가 이미 불러오는 공급자 상태 값에 프라임 활성 여부 하나만 더해 정한다(**요청 추가 금지**). 서버는 **메뉴 진입 API와 저장 API에서 프라임을 다시 확인**한다(주소 직접 입력 차단).
11. **쪽지함·후기함:** 둘 다 「일반」「실시간 퀵매칭」 두 탭.
12. **실시간 채팅은 만들지 않는다.**
13. **블라인드:** 매칭 쪽지의 학생 이름은 `StudentPublicName::mask` 값만. 실명·연락처를 넣지 않는다.
14. **학생 동의:** 기존 `students.prime_match_opt_in = 1`(084, 기본 0)인 학생만 매칭 대상이다. (기존 잠금 「추천 동의 기본 끔」 그대로)

---

## B. 코드 근거 (2026-11-13 `origin/main` grep 결과)

| 영역 | 파일 · 함수/상수 | 확인한 사실 |
|---|---|---|
| 학생 저장 | `src/Registration/StudentHubRepository.php` `PATCH_COLUMNS`, `PATCH_RELATION_KEYS`, `patchStudent()` | 허용 칸 화이트리스트. `preferred_tutor_gender`, `preferred_fee_amount`, `preferred_studyroom_fee_amount`, 지역 6칸, `prime_match_opt_in`, 관계키 `teaching_style_badges`·`subject_names`·`school_level` |
| 학생 수정 흐름 | `src/Registration/StudentHubService.php` `update()` → `patchStudent()` + `rejudgeExposure()` | draft→published 전환 때 `published_at` 기록. **재매칭 훅 자리** |
| 학생 가입 | `src/Auth/BasicRegisterService.php` `register()` → `registerStudent()` → `notifyCardPosted()` | 등록 직후 try/catch 훅이 이미 있음(메일). **첫 매칭 훅 자리**(같은 패턴, 실패해도 등록 결과 유지) |
| 학생 화면 | `preview/home-ui/src/student-reg/screens.js` `renderBasicForm()`, `renderDetailForm()`, `renderExtraHopeControl()`, `bindLessonTypeChange()` | 희망 유형 분기 `student.preferred_lesson_type === 'study_room'`. **희망 과외쌤 성별·희망 강의스타일은 지금 상세정보(`renderDetailForm`)에 있다**(시안은 기본정보) |
| 학생 동의 | `sql/schema/084_student_prime_match_opt_in.sql`, `preview/home-ui/src/mypage/screens.js` `bindPrimeMatchConsentEvents()`·`PRIME_MATCH_LABEL`, `preview/auth-ui/src/screens/signup-basic.js` | 동의 문구가 「프라임 과외쌤에게…」로 과외쌤만 말함 |
| 이름 마스킹 | `src/Registration/StudentPublicName.php` `mask()` | 있음 |
| 프라임 기간 | `sql/schema/028_provider_tickets.sql` `provider_position_subscriptions`(`sku_code` prime/pick), 039 `end_exclusive_on`, 065 지역 스코프, 066 `city_id`·`primary_subject_id` | 활성 = `CURDATE() < end_exclusive_on` (`ProviderTicketRepository::listActivePositions()`) |
| 환불 시 종료 | `src/Paid/RefundService.php` `freezePositionSubscription()` | 환불 시 `end_exclusive_on`을 오늘로 당김 → 위 활성 조건으로 **즉시 제외됨**. `restorePositionSubscription()`은 환불 취소 시 복구 |
| 공급자 상태 | `public/api/paid/status.php` → `ProviderUsageService` → `ProviderStatusService::build()` → `ProviderTicketService` 운영 상태 `exposure.positions[]`(`sku`, `region_*`) | 로그인 때 `preview/home-ui/src/auth-session.js`가 `hydrateProviderStatus()`로 이미 부름. **여기에 `prime_active`만 추가**하면 요청이 늘지 않음 |
| 프론트 상태 캐시 | `preview/home-ui/src/provider-status.js` `applyProviderStatus()`, `getProviderStatus()` | `exposure.positions` 보관 |
| 마이페이지 메뉴 | `preview/home-ui/src/mypage/router.js` `MYPAGE_NAV`, `MYPAGE_PATH_TO_SCREEN`; `preview/home-ui/src/mypage/shell.js` `renderMypageShell()`(`labelLines` 두 줄 지원) | 계정설정 `/mypage/account` 가 배열 마지막 |
| GNB 퀵매칭 | `preview/home-ui/src/policy.js` `MENU_EXCLUDED_PHASE1 = ['quick_match', …]` | GNB용. **이번 작업에서 건드리지 않는다** |
| 쪽지 DB | `sql/schema/014_messages.sql` `message_threads`(UNIQUE `context_kind, context_id, low, high`), `messages`, 015 `message_thread_participant_state` | 스레드에 구분 칸 없음 |
| 쪽지 서버 | `src/Messages/MessagesService.php` `composeMessage()`(`$skipTicketConsume`), `replyMessage()`, `requiresColdMemoTicket()`, `mapThreadSummary()`; `MessagesRepository::createThread()`, `findThreadByContext()`, `listThreadsForUser()`, `threadHasPeerMessage()`, `isThreadBlockedByAnyParticipant()` | 공급자→학생 **신규** 스레드만 쪽지권 차감. 기존 스레드 후속은 무료 |
| 쪽지 화면 | `preview/home-ui/src/messages/router.js` `MESSAGES_TABS = ['inbox','sent','active','archive']`, `REVIEWS_BASE`; `messages/screens.js` `renderMessagesHub()`, `renderList()`; `messages/thread-store.js` `getThreadsForTab()` | 쪽지/후기함 허브 탭은 있음 |
| 후기 | `sql/schema/040_provider_reviews.sql`; `src/Reviews/ProviderReviewService.php` `inbox($auth, $lane, …)`, `assertCanCreate()`; `ProviderReviewRepository::hasMessageThread()`; `ReviewPolicy::ERR_NO_THREAD`; 화면 `preview/home-ui/src/provider-reviews/inbox.js` | 후기는 쪽지 스레드가 있어야 쓸 수 있음. 후기에 스레드 연결 칸 없음 |
| 마이그레이션 번호 | `sql/schema/NNN_이름.sql` + 필요 시 `NNN_이름_rollback.sql`. 머리말에 「Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.」, `information_schema` 확인 후 `PREPARE` 하는 멱등 패턴(084·087 참고) | main 최신 087. **086은 `work/339-pg-portone-sandbox`, 088은 `work/365-identity-design`이 예약** → 이번은 **089**(필요 시 090). 착수 직전 `git ls-remote`로 다시 확인 |

---

## C. 0단계 범위 (PR 1개)

### C-0. 첫 작업 — 조사·보고 (코드 변경 전)

아래를 코드로 확인하고 짧은 표로 보고한다. **B절·이 문서와 다르면 구현하지 말고 멈추고 보고한다.**

1. B절 표의 파일·함수가 그대로 있는지.
2. 마이그레이션 다음 번호가 089인지(원격 브랜치 포함).
3. `message_threads`에 스레드만 있고 메시지가 0개일 때 목록(`listThreadsForUser`)·상세 화면이 깨지지 않는지. (1단계 조사 필요)
4. 공급자 사용자가 `replyMessage()`로 빈 스레드에 첫 메시지를 보낼 수 있는지, 이때 쪽지권이 차감되지 않는지. (1단계 조사 필요)
5. 하루 기준 시간대: `PositionPeriodCalculator::timezone()`이 Asia/Seoul인지, DB `CURDATE()`와 같은 날을 보는지. (1단계 조사 필요)
6. 후기 작성 게이트 `hasMessageThread()`가 메시지 0개 스레드도 통과시키는지. 통과시키면 퀵매칭 스레드는 「공급자 메시지가 1개 이상」일 때만 통과하도록 바꿔야 한다.
7. E절 미확정 항목 중 종현 답이 왔는지(부모 대화로 확인). 답이 없으면 해당 부분은 빼고 진행한다고 보고.

### C-1. DB (089) — 종현이 운영 phpMyAdmin에서 직접 실행. 봇·Actions 실행 금지

파일: `sql/schema/089_quick_match_foundation.sql`, `sql/schema/089_quick_match_foundation_rollback.sql`. 아래 초안을 084·087과 같은 멱등 형식(`information_schema` 확인 → `PREPARE`)으로 옮긴다. 칸 위치(`AFTER`)는 실제 테이블을 보고 정한다.

```sql
-- 089 — 실시간 퀵매칭 공통 기반
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 먼저 적용한다.
USE study114;
SET NAMES utf8mb4;

-- (1) 매칭 항목 칸 3개 — 확정
ALTER TABLE study_rooms
  ADD COLUMN director_age_band ENUM('20s','30s','40s','50_plus') NULL
  COMMENT '원장 나이대. 매칭 전용, 카드·공개 화면 비노출';
ALTER TABLE students
  ADD COLUMN preferred_director_age_bands SET('20s','30s','40s','50_plus') NULL
  COMMENT '희망하는 원장샘 나이대. 다중, OR, 비우면 통과',
  ADD COLUMN preferred_tutor_age_bands SET('20s','30s','40s','50_plus') NULL
  COMMENT '희망하는 과외쌤 나이대. 다중, OR, 비우면 통과';

-- (2) 쪽지 구분 — 최소 변경안(칸 1개). 기존 UNIQUE 키는 바꾸지 않는다.
ALTER TABLE message_threads
  ADD COLUMN thread_origin ENUM('general','quick_match') NOT NULL DEFAULT 'general'
  COMMENT '쪽지함 탭 구분',
  ADD KEY idx_message_threads_origin (thread_origin);

-- (3) 운영 기록표 2개 + 설정표 1개 — 매칭 항목이 아니라 발송·설정 저장용 (종현 확인 필요, E-7)
CREATE TABLE IF NOT EXISTS quick_match_provider_settings (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_type    ENUM('tutor','study_room') NOT NULL,
  provider_id      BIGINT UNSIGNED NOT NULL,
  user_id          BIGINT UNSIGNED NOT NULL,
  optional_toggles JSON NOT NULL COMMENT '{"sky":1,"teaching_style":0,...}',
  first_saved_at   DATETIME NULL,
  last_changed_at  DATETIME NULL COMMENT '주 1회 제한 기준',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qm_settings_provider (provider_type, provider_id),
  KEY idx_qm_settings_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quick_match_dispatches (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       BIGINT UNSIGNED NOT NULL,
  provider_type    ENUM('tutor','study_room') NOT NULL,
  provider_id      BIGINT UNSIGNED NOT NULL,
  provider_user_id BIGINT UNSIGNED NOT NULL,
  thread_id        BIGINT UNSIGNED NULL,
  trigger_kind     ENUM('register','rematch') NOT NULL,
  sent_on          DATE NOT NULL COMMENT 'KST 날짜. 하루 20건 셈',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qm_dispatch_once (student_id, provider_type, provider_id),
  KEY idx_qm_dispatch_provider_day (provider_type, provider_id, sent_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quick_match_student_runs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id    BIGINT UNSIGNED NOT NULL,
  trigger_kind  ENUM('register','rematch') NOT NULL,
  run_on        DATE NOT NULL COMMENT 'KST. 재매칭 학생당 하루 1회',
  matched_count INT UNSIGNED NOT NULL DEFAULT 0,
  sent_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qm_runs_student_day (student_id, run_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

롤백: 위 3개 표 `DROP TABLE IF EXISTS`, `message_threads.thread_origin`·인덱스, 학생 2칸, 공부방 1칸 제거(칸 존재 확인 후).

**코드는 칸이 없을 때도 죽지 않아야 한다.** 084·`SearchService::primeMatchSummaries()`처럼 `information_schema`로 칸 유무를 보고, 없으면 퀵매칭 기능만 조용히 끈다(기존 화면 정상).

### C-2. 서버 공통

새 폴더 `src/QuickMatch/` (이름은 조사 후 조정 가능):

- `QuickMatchPrimeGate` — `isPrimeActive(userId, providerType, providerId): bool`, `activePrimeRegions(...)`. 기준: `provider_position_subscriptions` `sku_code='prime' AND CURDATE() < end_exclusive_on` (`ProviderTicketRepository::listActivePositions()` 재사용). 환불은 `freezePositionSubscription()`이 종료일을 당기므로 별도 처리 불필요 — **조사에서 확인만**.
- `QuickMatchSettingsService` — 설정 읽기/저장. 저장 규칙: `first_saved_at IS NULL`이면 저장 허용 후 `first_saved_at = last_changed_at = NOW()`; 아니면 `NOW() >= last_changed_at + 7일`일 때만 허용, 아니면 409 + 다음 변경일. **필수 조건은 이 API로 받지 않는다**(보내 와도 무시하고 400).
- `QuickMatchDispatcher` — 학생 1명 기준 실행. 흐름:
  1. 학생이 `exposure_status='published'`, `deleted_at IS NULL`, `prime_match_opt_in=1`인지.
  2. 트리거가 `rematch`면 오늘(KST) `quick_match_student_runs`에 rematch가 있으면 중단.
  3. 후보 = 프라임 활성 + 광고 지역 겹침(1·2단계에서 유형별 매칭기 구현) + `quick_match_dispatches`에 이미 없는 공급자.
  4. 공급자별 오늘 발송 수 < 20 인 곳만.
  5. 이미 같은 `context_kind='student', context_id=학생` + 같은 참가자 쌍의 **일반 스레드가 있으면 건너뜀**(UNIQUE 키 충돌 방지, 이미 연락 중). 차단 관계면 건너뜀.
  6. 스레드 생성: `MessagesRepository::createThread()` + `thread_origin='quick_match'`, `context_kind='student'`, `context_id=학생`, 참가자 = 학생 보호자 사용자·공급자 사용자, `initiated_by_user_id` = 공급자 사용자(공급자 후속이 무료가 되도록), `peer_display_name` = `StudentPublicName::mask`, `scope_badge='실시간 퀵매칭'`, `structured_line` = 학생 요약(학교급·학년·과목·희망 성별·예산·지역; **학교명·스카이 금지**), `last_message_preview` = 안내 첫 줄. **쪽지권 차감 없음**, `composeMessage()`를 거치지 않는다.
  7. `quick_match_dispatches`에 기록, `quick_match_student_runs`에 결과 기록.
  - 트랜잭션 밖에서 실행하고 예외는 `error_log`만(등록·수정 결과는 그대로). `BasicRegisterService::notifyCardPosted()`와 같은 패턴.
- 훅 2곳:
  - `BasicRegisterService::register()`에서 학생 등록이 `published`로 끝나면 `register` 트리거.
  - `StudentHubService::update()`에서 (a) draft→published 첫 전환이면 `register`, (b) 이미 published이고 patch 키가 **매칭 키 목록**과 겹치면 `rematch`. 매칭 키 목록은 1·2단계에서 채운다(지역 6칸, `school_level`, `subject_names`/`subject_label`, `preferred_tutor_gender`, `preferred_fee_amount`, `preferred_studyroom_fee_amount`, `teaching_style_badges`, 새 나이대 2칸, `preferred_lesson_type`, `prime_match_opt_in` 0→1). 소개글·요청문·연락시간 등은 넣지 않는다.
- API 새 파일 `public/api/quick-match/settings.php` (GET 읽기, POST 저장). `PaidApi::requireProvider()`로 인증, **GET·POST 둘 다 `QuickMatchPrimeGate`로 다시 확인**. 프라임 아니면 GET은 `{prime_active:false}`와 안내 문구 키만, POST는 403.
- `ProviderStatusService::build()`(또는 운영 상태 묶음)에 `prime_active: bool` 한 칸 추가. **새 요청 만들지 말 것.**
- 학생 저장 화이트리스트: `StudentHubRepository::PATCH_COLUMNS`에 `preferred_tutor_age_bands`, `preferred_director_age_bands` 추가(값 검증: 4개 코드만, 빈 값 → NULL). 공부방 `director_age_band` 저장은 `StudyRoomRegisterService`/`StudyRoomHubRepository` 쪽 기본등록 저장 경로에 추가(어느 함수인지 1단계 조사 필요). **0단계는 서버 저장·읽기만, 화면은 1·2단계.**
- 쪽지 목록 응답(`MessagesService::mapThreadSummary()`·`mapThreadDetail()`)에 `thread_origin` 추가. 학생 쪽에서는 `thread_origin='quick_match'`이고 공급자 메시지가 0개인 스레드를 **목록에서 숨긴다**(`threadHasPeerMessage()` 활용).
- 후기 함(`ProviderReviewService::inbox()`)에 `origin=general|quick_match` 필터. **후기 테이블에 칸을 만들지 않고**, 작성자·공급자 사이에 `thread_origin='quick_match'` 스레드가 있으면 퀵매칭 후기로 분류(읽을 때 JOIN). 일반·퀵매칭 스레드가 둘 다 있으면 퀵매칭으로 본다(종현 확인 필요, E-8).

### C-3. 화면 공통

- `preview/home-ui/src/mypage/router.js` `MYPAGE_NAV`: 계정설정 바로 앞에
  `{ path: '/mypage/quick-match', label: '실시간 퀵매칭서비스', labelLines: ['실시간 퀵매칭', '서비스'], icon: 'event', screenId: 'P15-QM', roles: ['study_room','tutor'] }` (screenId 이름은 조사 후 기존 규칙에 맞춤). `MYPAGE_PATH_TO_SCREEN`·화면 제목 맵에도 추가. 학생(`PARENT_NAV_PATHS`)에는 넣지 않는다.
- `mypage/shell.js` `renderMypageShell()`: 이 메뉴만 `getProviderStatus()?.prime_active`가 참이면 `is-prime`(황금색 글자 + Event 배지 색), 아니면 `is-muted`(회색). 아이콘은 시안처럼 「Event」 글자 배지(이모티콘). 회색이어도 **클릭은 된다**(들어가면 안내 화면).
- 새 화면 `preview/home-ui/src/mypage/quick-match/` (index·screens·copy). 0단계에서는 **공통 틀만**: 상단 「프라임 회원 전용 혜택」 박스, 비프라임 안내(`tutor-3-matching-off.png`), 「오늘 받은 매칭 쪽지 N건 · 하루 20건까지」, 다음 변경일 문구, 저장 버튼 상태. 필수·선택 항목 목록은 1·2단계가 채운다.
- 쪽지함 탭: `messages/router.js`·`messages/screens.js`·`thread-store.js`에 「일반」「실시간 퀵매칭」 탭 추가. 기존 받은/보낸/진행중/보관함은 그 안의 보조 필터로 유지할지, 탭을 2개로 바꿀지는 **조사 후 최소 변경안 보고**(1단계 조사 필요). 퀵매칭 탭 목록에 「실시간 퀵매칭」 태그(`tutor-4-message.png`).
- 학생 쪽 퀵매칭 스레드 상세에는 고정 안내 1줄: 「학력 등 조건은 상담할 때 쌤(원장님)의 인증서류로 꼭 확인해 주세요.」 (문구 종현 확인 필요)
- 후기함: `provider-reviews/inbox.js` 등에 같은 두 탭.
- CSS: 새 규칙은 새 파일로 만들고 기존 CSS 파일 맨 위 `@import` 순서 규칙을 지킨다. **각 CSS 파일은 단독으로 괄호 짝이 맞아야 한다**(#205 사고 재발 방지).

### C-4. 수락 기준

1. 089 미적용 DB에서도 기존 화면·쪽지·후기·결제가 그대로 동작한다(퀵매칭만 비활성).
2. 089 적용 후, 프라임 공급자 계정: 메뉴 황금색. 픽·무료 계정: 회색, 들어가면 「프라임에서 함께 제공되고 있는 서비스입니다」, 금액·종료일 문구 없음.
3. 마이페이지 진입 시 네트워크 요청 수가 0단계 전과 같다(개발자도구로 확인, 캡처).
4. 비프라임 계정으로 `GET/POST /api/quick-match/settings.php` 직접 호출 → GET은 비활성 응답, POST는 403.
5. 설정 저장: 첫 저장 전 여러 번 저장 가능 → 첫 저장 후 같은 주 재저장 시 거절 + 다음 변경일 표시.
6. 쪽지함·후기함에 「일반」「실시간 퀵매칭」 탭. 기존 쪽지는 모두 「일반」에 그대로.
7. 학생 이름은 마스킹만, 학교명·스카이·연락처가 쪽지 어디에도 없다.
8. 바꾼 preview 앱마다 `npm run build`(예: `preview/home-ui`), 루트 `npm run verify:php-syntax`, 관련 기존 verify 스크립트(`verify:tutor-mypage-route-integrity` 등) 통과. CSS 파일별 괄호 깊이 검사 통과.

### C-5. 테스트 계정 확인 절차 (운영 배포 후, 종현)

종현이 보관 중인 테스트 계정을 쓴다(계정 정보는 문서·커밋·보고에 쓰지 않는다).
1. 종현이 089를 운영 phpMyAdmin에서 실행 → 칸·표가 생겼는지 `information_schema`로 확인.
2. 프라임 과외쌤 테스트 계정 → 마이페이지 메뉴 황금색, 설정 화면 진입.
3. 픽 또는 무료 과외쌤 계정 → 회색, 안내 화면.
4. 학생 테스트 계정 → 쪽지함·후기함 두 탭 확인.
5. 결과 캡처를 Cursor 보고에 첨부(개인정보 가림).

### C-6. 금지

- 금액·환불·결제·쪽지권 차감 로직 변경 금지(`src/Paid/*` 계산기·`RefundService` 수정 금지. 읽기 재사용만).
- 운영 SQL 실행 금지(봇·Actions). 089는 종현이 직접.
- force push, `reset --hard`, `stash drop` 금지. 더티 워크트리(`D:\work\study114`, 기존 `.wt\work-*`) 건드리지 말 것. 새 워크트리에서 작업.
- 시크릿·계정 정보를 문서·커밋·로그·보고에 쓰지 않는다.
- 실시간 채팅·웹푸시·알림톡 만들지 않는다.
- GNB `quick_match`(policy.js) 건드리지 않는다.
- **커밋·PR까지. 머지하지 말고 보고.** 조사 결과가 이 문서와 다르면 멈추고 보고.

---

## D. 문구 초안 (종현 확인 필요)

공급자가 받는 퀵매칭 스레드 안내(공통 뼈대, 1·2단계에서 유형별로):
> {마스킹 이름} 님과 조건이 맞아요
> 우동공과 조건이 맞아 연결되었어요. 같은 학생에게는 한 번만 알려 드려요. 답장으로 인사를 시작해 보세요.

학생 쪽 고정 조언:
> 학력 등 조건은 상담할 때 쌤(원장님)의 인증서류로 꼭 확인해 주세요.

비프라임 안내(시안 그대로):
> 프라임에서 함께 제공되고 있는 서비스입니다
> 지금 광고 중인 프라임이 없어요. 프라임으로 지역을 광고하면, 조건이 맞는 학생이 등록할 때 쪽지로 알려 드려요.

---

## E. 미확정 (조사·종현 결정 필요)

1. **학생 쪽 선택 조건 칸이 없다.** grep 결과 `students`에 스카이·쪽집게·대학원 이상(과외) / 교육청 등록증·프랜차이즈(공부방) 「희망」 칸이 없다. 시안에는 학생 기본등록에 이 항목들이 있다. 「새 칸은 나이대 3개뿐」 규칙과 충돌. 선택지:
   - (가) **추천:** `students.quick_match_prefs SET('sky','jjokjipge','grad_school','edu_office','franchise') NULL` **칸 1개**만 추가(090 또는 089에 합침). 종현 승인 필요.
   - (나) 칸을 만들지 않고 이 축들은 학생 쪽에서 빼고, 공급자 스위치도 숨긴다(1차 축소).
   - 답이 오기 전에는 1·2단계에서 이 축을 **구현하지 않는다**.
2. **학생 「희망 원장 성별」 칸이 없다.** 학생에게는 `preferred_tutor_gender`(male/female/any)만 있다. 추천: 희망 유형이 공부방일 때 같은 칸을 「희망 원장 성별」 라벨로 재사용(DB 무변경). 종현 확인 필요.
3. **희망 성별·강의스타일 위치.** 지금 학생 상세정보에 있다. 시안은 기본정보 퀵매칭 묶음. 옮기면(이동, 중복 금지) 「기본정보 완료」 판정(`StudentBasicCompleteness`)에 넣을지 결정 필요. 추천: 옮기되 완료 판정에는 넣지 않는다(매칭 필수는 매칭 조건일 뿐 카드 게시 조건은 아님) → 값이 없으면 그 학생은 매칭에서 빠짐. 종현 확인 필요.
4. **공급자 선택 스위치의 뜻.** 시안 문구 「켠 조건만 학생 조건과 맞춰 봅니다. 끄거나 값이 없으면 그 항목은 보지 않아요.」를 그대로 따르면, 학생이 「스카이 희망」이어도 스위치를 끈 비스카이 쌤에게 연결될 수 있다. 이 문서는 **시안 문구대로** 구현하도록 쓴다. 바꾸려면 종현 결정.
5. **교습비 비교.** 과외쌤 `tutors.preferred_fee_amount`는 단일값(원 단위로 보임, 시드 600000), 학생 `preferred_fee_amount`는 단일값(화면 「예산(천원)」). 범위가 아니므로 「범위 겹침」을 그대로 못 쓴다. 단위 1단계 조사 필요. 추천: 공부방과 같은 규칙(같은 20만 원 구간 또는 바로 옆 구간).
6. **공부방 수업료** `study_rooms.monthly_fee_manwon`은 문자열(만원, 상세 단계 `step-lesson.js`). 숫자 파싱 규칙·빈 값 처리 2단계 조사 필요. 빈 값이면 그 공부방은 매칭 제외인지 통과인지 종현 확인 필요(추천: 필수이므로 제외).
7. **운영 기록표 3개**(`quick_match_provider_settings`, `quick_match_dispatches`, `quick_match_student_runs`)와 `message_threads.thread_origin` 1칸은 매칭 항목이 아니라 발송·설정·탭 구분용이다. 「새 칸은 나이대뿐」 규칙의 예외로 승인 필요.
8. 후기 분류: 같은 학생-공급자 사이에 일반·퀵매칭 스레드가 둘 다 있으면 어느 탭? 추천: 퀵매칭(단, 5번 규칙상 일반 스레드가 있으면 퀵매칭 스레드를 만들지 않으므로 드묾).
9. **학생이 받는 「내 프라임카드 보내기」 하루 5건**(확정안 a58a18c2 「빈도」). 이번 확정 메시지에는 없었다. 넣으면: 퀵매칭 스레드에서 공급자 첫 메시지를 학생 기준 하루 5건으로 제한. 종현 확인 필요 — 확인 전에는 구현하지 않는다.
10. **학생 동의 문구** `PRIME_MATCH_LABEL`이 「프라임 과외쌤에게」만 말한다. 2단계(공부방) 전에 「프라임 과외쌤·공부방에게」로 바꿀지 종현 확인 필요.
11. **시안과 다른 점(지시서 우선):** `tutor-2-matching-on.png`의 스카이 값이 「서울대학교」로 보이는데, 규칙 8에 따라 학교명은 쓰지 않는다 → 설정 화면에서도 「해당」/「해당 없음」으로만. 시안에는 메뉴 회색 상태·쪽지함 두 탭이 아직 없다(목록 태그만).
