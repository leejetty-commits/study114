# 203 · 숨김 후속 + 문의 관리 묶음 — 점검지시문 (읽기 전용, 2026-10-07)

- **작성:** 2026-10-07 05:1x KST (우동공과2)
- **절차 위치 (종현 t1478 잠금):** **점검지시문 (이 문서)** → 커서 작업 후 보고 → 검수 → 보완 작업지시서 → 수행결과 보고 → 재작업 → 검수완료 → 종현 보고 → 종현 승인 후 배포
- **근거 문서:** docs/202 §15(15-1 a~e, 15-B 초안), §15 끝 t1503·t1504·t1505 기록, 「t1513 관리자 문의내역 확인」 절, 「t1517 종현 확정」 절 / docs/190 2026-10-07 기록 / ssot/28 §3-b-2·§9·§10 / docs/161 추가 잠금
- **같이 도는 작업:** 관리자-162 점검(docs/204)이 별도 에이전트로 동시에 돈다. 이 점검은 162 파일을 볼 필요 없음. 단 아래 질문 Q30에서 겹치는 파일을 적는다.

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달.

```
# [숨김 후속 + 문의 관리] 점검지시문 (1단계: 읽기 전용 점검)

## 0. 이번 단계 규칙 (어기면 점검 불합격)
- 저장소: leejetty-commits/study114. 기준 = origin/main `11b0c0d` (운영 라이브, Deploy #393).
  시작할 때 `git rev-parse HEAD`(또는 origin/main)가 11b0c0d인지 보고 첫 줄에 적으세요. 다르면 그 SHA를 적고 그 기준으로 읽으세요.
- **읽기 전용.** 파일 수정 0, 새 파일 0, 커밋 0, 브랜치 생성 0, push 0, PR 0. 자동으로 브랜치·PR이 생기면 즉시 보고에 적고 아무것도 머지하지 마세요.
- 터미널은 읽기 명령만: git log/show/status/rev-parse/grep, rg, ls, cat, wc. npm install·build·테스트 실행·DB 접속·라이브 사이트 조작 금지.
- rg는 반드시 `-g '!node_modules' -g '!dist'` 를 붙이세요(안 붙이면 멈춥니다).
- 결과는 **마지막 메시지 하나에 한국어 보고서**로 씁니다(파일로 저장하지 않음). 끝에 `git status -sb` 출력(깨끗함)을 붙이세요.
- 새 정책을 만들지 마세요. 코드와 정본이 어긋나면 「잠긴 정책과 어긋난 오류」, 판단이 필요하면 「종현 결정 필요」(기본안 1개 포함)로 따로 적습니다.
- **어떤 항목도 「범위 밖」「다음에」로 미루지 마세요.** 아래 1~7은 전부 이번 묶음에서 끝낼 범위입니다. 막히는 점은 「막힘 + 이유 + 풀 방법」으로 적습니다.

## 1. 목적
다음 단계 작업지시서(허용 파일 목록·금지·숫자 합격 기준)를 쓸 수 있게, 아래 7개 항목에서 **바꿔야 할 모든 곳을 파일:줄로** 찾고, 허용 파일 목록 초안을 [관리자] / [사이트·서버·SQL]로 나누어 내고, 위험과 숫자로 된 시험 계획을 제안합니다.
「완료」의 정의 = **서버에 저장되고 새로고침해도 남는 것.** 각 항목마다 화면 → API → 서비스 → 저장소(SQL) → 테이블·칼럼까지 저장 경로를 파일:줄로 증명하세요. 화면 상태(sessionStorage·메모리)만 바뀌는 것은 완료가 아닙니다.

## 2. 배경 결정 (날짜·근거 그대로, 바꾸지 말 것)
- 2026-10-07 04:0x (docs/202 §15-1): 관리자 「홈에 뭐가 보이나」 숨김 = 잠긴 운영자 조치(ssot/28 §1, docs/161 추가 잠금). 문제 유저 대응용 **관리자 전용**이며 사용자 기능이 아님.
- 같은 조사에서 발견한 오류 2건(라이브 미확인, 코드 추적):
  (a) 공부방 마이페이지 「상세정보2」 저장 → form-collect.js가 profile_status='draft'를 채움 → StudyRoomRegisterService::saveFacility가 hidden 확인 없이 저장 → 숨김이 풀려 다시 보임. 공부방·과외쌤 서버 publish(StudyRoomHubService·TutorHubService)도 hidden 확인 없음. 학생은 막혀 있음(StudentHubService.php:60-62).
  (b) 숨길 때 아무것도 보내지 않는데 admin_operation_logs.user_notified=1 고정(AdminExposureService.php 122·179·232 → 로그 insert) → 관리자 로그 「사용자 알림 Y」.
- 2026-10-07 04:15 종현 t1503: 「공개조건」 정책은 오래전 폐지. 카드 노출 조건 = 기본정보 필수 입력뿐. 과외쌤 화면의 공개조건 기반 숨김 배지·로직은 폐지 정책 잔재 → 정리 대상.
- 2026-10-07 04:17 종현 t1504 확정: 숨김이면 주인 마이페이지에 한 줄(세 역할 공통, 조건 무관, 다시 켜는 버튼 없음):
  「이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.」 + 고객센터 운영문의 링크.
  공부방·과외쌤 = 숨길 때 기존 사이트 알림 1건(같은 취지 문구). 메일·문자·쪽지 없음. 다시 보이기 때 알림 없음. 학생 = 사이트 알림함이 없으므로 마이페이지 한 줄만. user_notified는 실제로 알림을 만들었을 때만 1.
- 2026-10-07 04:18 종현 t1505: 숨김 해제 요청 흐름 = 마이페이지 한 줄의 링크 → 고객센터 운영문의 → 관리자 「문의·신고」에서 답변 + 「홈에 뭐가 보이나」에서 다시 보이기 → 사용자는 마이페이지 「내 문의 내역」에서 확인.
- 2026-10-07 04:54 종현 t1517 확정: 문의 관리 보강 4가지 — (1) 문의를 회원 id에 연결, 로그인 계정 이메일 고정(수정 불가) (2) 관리자 문의 목록에 처리 전/종료 필터 + 이메일·아이디 검색 + 페이지 나눔 (3) 회원 상세에 그 회원 문의 목록 (4) 문의 유형 「숨김 해제 요청」 추가. 대화 스레드는 만들지 않음(068 「1건당 최신 답변 1개」 잠금 유지). 전체 목록은 유지.
- 용어: 화면 글자는 「학생」(「학부모」 금지). 숨김 회원 문구에 승인·반려·검토 완료·인증 같은 심사 말 금지(ssot/28:283).

## 3. 점검 질문 (번호대로 전부 답할 것)

### 항목 1 — 주인 저장·공개로 관리자 숨김이 풀리는 경로
Q1. 공부방·과외쌤·학생 각 카드 테이블에서 「관리자 숨김」을 나타내는 칼럼과 값을 확정하세요(profile_status='hidden'인지, exposure_status 등 다른 칼럼도 있는지). 정의 SQL 파일:줄 포함.
Q2. 세 역할의 **모든** 서버 쓰기 경로를 표로: API 파일 → 서비스 메서드 → SQL(UPDATE/INSERT) 파일:줄, 그리고 그 경로가 숨김 칼럼을 쓰는지(쓴다/안 쓴다/조건부)와 hidden일 때 결과(풀림/유지).
   최소 포함: StudyRoomRegisterService(saveFacility·insertDraft·그 밖 save*), TutorRegisterService(save* 전부), BasicRegisterService(학생·공부방·과외 INSERT/UPDATE), StudyRoomHubService·TutorHubService·StudentHubService(publish/unpublish 등), 학생 등록 저장 경로, 탈퇴·복구·관리자 노출 API. 이 밖에 숨김 칼럼을 쓰는 곳이 있으면 전부(rg `profile_status`·`exposure_status`·`'hidden'`).
Q3. 화면 쪽에서 상태값을 실어 보내는 곳(예: study-room-ui form-collect.js:354, tutor-reg/inline-save.js)을 파일:줄로. 화면에서 고칠지 서버에서 막을지 비교하고, **서버에서 막는 안**(hidden이면 요청 상태값 무시·유지, publish는 StudentHubService.php:60-62와 같은 모양으로 거절)의 정확한 고칠 줄을 제안하세요.
Q4. 같은 줄에서 생기는 「공개중 공부방이 상세정보2 저장 때 draft로 바뀜」(docs/202 §15-1 d 별건)의 영향(찾기 노출·159-c 등록 목록 상태 표시·마이페이지 표시)을 파일:줄 근거로 적고, 이번 수정과 같은 줄에서 함께 막는 최소안이 있는지 판단 자료를 내세요(결정은 「종현 결정 필요」로).
Q5. 관리자 「다시 보이기」가 되돌리는 값(published 고정인지, 숨기기 전 값 복원인지)과 근거 줄. 숨기기 전이 draft였던 카드를 다시 보이면 어떻게 되는지.

### 항목 2 — user_notified 사실 기록
Q6. user_notified를 쓰는 모든 곳(AdminExposureService 세 역할, AdminOperationLogRepository insert, 그 밖 AdminMember·Commerce·Report·SubmissionQueue 등)을 파일:줄로. 숨김 외 동작에서도 「보내지 않았는데 1」인 곳이 있는지 각각 판정.
Q7. 숨김 동작에서 「알림을 실제로 만들었을 때만 1」로 바꾸려면 어느 줄이 바뀌는지, 알림 생성과 로그 기록의 순서·트랜잭션(알림 실패 시 숨김은 되고 로그는 0이 되는지)을 제안하세요.

### 항목 3 — 마이페이지 숨김 안내 한 줄 (세 역할)
Q8. 세 역할 마이페이지에서 카드 상태를 받는 API와 응답 필드(파일:줄)를 확인하세요(docs/202 §15-1 b 표: 공부방 study-rooms.php → StudyRoomHubRepository, 과외쌤 tutors.php → TutorHubRepository, 학생 students.php → StudentHubRepository). hidden이 화면까지 전달되는지.
Q9. 각 역할에서 한 줄을 넣을 **정확한 렌더 위치**(파일:줄)를 하나씩 제안하세요. 공부방은 카드가 있으면 목록을 건너뛰고 허브로 가는 점(study-room-reg/screens.js:149-155, 허브 252-290) 주의. 세 역할이 같은 문구 상수 하나를 쓰게 할 위치도 제안.
Q10. 고객센터 운영문의 링크의 정확한 주소(`#/support/contact` 등)와 링크를 그리는 기존 방식(data-sup-nav 등) 파일:줄. 운영문의 화면이 유형 미리 선택(쿼리 등)을 지금 지원하는지 확인만 하고, 지원하지 않으면 「종현 결정 필요」로.
Q11. 다시 켜는 버튼·「해제 후」 같은 말이 남아 있는 곳을 전부: 예) tutor-reg/registration-check-copy.js:12·13·24, plans/order-blocks.js:87, plans/screens.js:598·621(「노출 중지를 해제한 뒤 구매하세요」 = 사용자가 풀 수 있는 것처럼 읽힘). 각각 고칠지·지울지 제안.

### 항목 4 — 공부방·과외쌤 사이트 알림 1건 (숨길 때만)
Q12. 기존 사이트 알림 구조를 확인: provider_system_notices(032 SQL), ProviderReminderRepository::upsertSystemNotice, ProviderNoticeService, public/api/paid/notices.php(requireProvider), 화면 provider-notices.js·mypage-notice-strip.js. 알림이 보이는 화면 위치와 읽음 처리 경로 파일:줄.
Q13. 숨김 알림 1건을 넣을 정확한 위치(AdminExposureService 공부방·과외 hide 분기)와 notice_kind·dedupe_key 제안. dedupe_key UNIQUE라서 「숨김 → 다시 보이기 → 다시 숨김」 때 두 번째 알림이 덮어쓰기만 되고 새 알림이 안 생기는 문제가 없도록(예: 로그 키 포함) 제안. 다시 보이기 때 알림 0건 보장 근거.
Q14. 알림 제목·본문·action_href 제안(문구는 t1504 문장 그대로 또는 그 안에서만, 심사 말 금지). 한 사용자가 공부방·과외쌤 카드를 둘 다 가진 경우가 있는지와 처리.
Q15. 학생은 알림함이 없음(notices.php = 공급자 전용)을 코드로 재확인. 학생 숨김 때 알림 0건, user_notified 0이 맞는지.

### 항목 5 — 과외쌤 「공개조건」 잔재 정리
Q16. 폐지된 공개조건(노출 조건·publishOk/publishNeed·「노출 조건 충족/부족」·픽·프라임까지 채워야 뜨는 안내 등)에 묶인 코드·문구·검사 스크립트를 전부 표로(파일:줄, 무엇, 지울지/바꿀지). 최소: tutor-reg/registration-check-copy.js(10·12·13·24), registration-check-model.js(286-320·345-352·416 근처), format.js(130·173 호출처 0 함수, 323 P21-06), tutor-reg-copy.js:41, admin-red-line-copy.js의 「공개조건」. 공부방·학생 쪽에도 같은 잔재가 있으면 함께.
   ※ 「노출 조건 = 기본정보 필수」(student-reg/store.js:213, StudentBasicCompleteness)와 유료 상품 노출 조건(픽·프라임 구매 조건)은 폐지 대상이 아닐 수 있음 → 구분해서 적고, 애매하면 「종현 결정 필요」.
Q17. 잔재를 지웠을 때 깨지는 검사 스크립트(scripts/verify-*)·워크플로(.github/workflows/tutor-*.yml 등)와 그 검사 줄.

### 항목 6 — 문의(support_tickets) 회원 연결·이메일 고정·유형 추가
Q18. 현재 저장 경로 전체 파일:줄: support/screens.js(305·325·441-452) → support-api.js/support-backend.js/ticket-store.js → public/api/support/tickets.php(POST 29-32) → SupportTicketService(34-55) → SupportTicketRepository → support_tickets(017 SQL:24-39, 068). 로그인 확인 여부, email·role_type이 어디서 정해지는지.
Q19. user_id 칼럼 추가 마이그레이션 초안: 칼럼 정의·인덱스·외래키 여부(탈퇴·삭제·071 익명화와 충돌 여부), 기존 마이그레이션 관례(068처럼 information_schema 확인 후 ALTER, 「Actions는 실행하지 않음, 운영 phpMyAdmin 먼저」)와 rest-schema.sql·sql/verify/schema_check.sql도 같이 고쳐야 하는지. 새 번호 제안(현재 최고 075, 074 비어 있음 — 162와 겹치지 않게 이 묶음은 076 제안, 다르면 이유).
Q20. 접수 때 서버가 세션 user_id와 **계정 이메일**을 넣고 요청 email은 무시하는 안: 고칠 줄. 화면 이메일 칸을 읽기 전용(계정 이메일 표시)으로 바꿀 줄. 비로그인 접수 경로(role_type 'guest')가 실제로 남아 있는지 — 특히 「계정·로그인」 문의를 로그인 못 하는 사람이 남기는 길이 있는지 확인하고, 있으면 위험으로.
Q21. 유형 「숨김 해제 요청」 추가: category ENUM('bug','policy','account','other') 변경 SQL, 서버 허용값 검사, 화면 선택지(support-copy.js:387-392), 관리자 유형 라벨, 마이페이지 내역 라벨까지 전부 파일:줄. 영문 키 제안.
Q22. 기존 행 user_id 채우기(backfill) SQL 초안: 이메일 정규화 기준(EmailNormalizer와 같게), users.email 중복·대소문자, 탈퇴·익명화 계정, 매칭 0건/2건 이상 처리. 종현이 먼저 돌려 볼 **건수 확인 SELECT**(전체·매칭 1건·0건·2건 이상)도 함께.
Q23. 마이페이지 「내 문의 내역」: 지금 조회가 이메일 기준(tickets.php:22-26)인 것을 user_id 기준으로 바꿀 줄. **공부방·과외쌤 마이페이지에서 실제로 이 화면이 열리는지** 확인: mypage/router.js:82는 roles ['parent','study_room','tutor']로 적혀 있지만, 공부방·과외쌤이 쓰는 마이페이지 셸·메뉴(study-room-reg·tutor-reg 쪽 메뉴 포함)에서 메뉴가 보이고 화면이 그려지는지 렌더 경로 파일:줄로 증명. 없으면 넣을 위치 제안(숨김 대상이 공부방·과외쌤이므로 필수).
Q24. 답변 1건 유지(068): 답변 저장 경로(SupportTicketRepository 125-138)와 운영 DB에 068이 적용됐다고 가정하는 코드(tickets.php:41-43 schema_missing 503)를 파일:줄로. 068 미적용이면 이번 묶음 기능 중 무엇이 깨지는지 목록. 종현이 운영 DB에서 돌릴 **적용 여부 확인 SELECT**(information_schema) 제안.

### 항목 7 — 관리자 문의 목록·회원 상세
Q25. 관리자 문의 화면 렌더·바인딩·로드 경로: renderTicketsAdmin(a28-screens.js:935-971 근처), bindTicketsScreen(a28-screens-bind.js), 허브 문의·신고 팝업(a28-today-hub.js:157-166, 같은 렌더러), 로드 키 ticketAdminLoadedFor·adminBindHost, GET 전체 조회(tickets.php:16-21 → SupportTicketRepository::listAll 40-50) 파일:줄.
Q26. 상태 필터(「처리 전」= open+in_progress, 「종료」= closed, 「전체」 — 이 묶음 기본안, 다르게 읽히는 근거가 있으면 적기), 이메일·아이디 검색, 페이지 나눔을 **서버 쪽**(쿼리 파라미터·LIMIT/OFFSET·전체 건수)에 넣는 안. 「아이디」가 이 시스템에서 무엇인지(users에 별도 로그인 아이디 칼럼이 있는지, 이메일이 곧 아이디인지) 확정. 기본 필터·한 페이지 건수 제안.
Q27. 허브 팝업과 `#/admin/tickets` 두 곳에서 필터·검색·페이지 상태가 섞이지 않는 방법(159-a·b 교훈: 허브 모드에서 location.hash 쓰기 금지, 호스트별 로드 키, 저장 후 해당 칸만 재그리기, 닫은 서랍이 응답 뒤 되살아나지 않기). 고칠 줄 제안.
Q28. 회원 상세(AdminMemberRepository·AdminMemberService·a28-screens.js renderMembers 상세 1326~1400 근처)에 그 회원 문의 목록을 붙일 위치와 API(관리자 전용, user_id 기준). 지금 회원 상세의 'tickets'는 이용권(provider_ticket_packs, 「횟수권」)이라 이름이 겹침 → 혼동 없는 키·라벨 제안.
Q29. 관리자 화면 표에 user_id·회원 링크(회원 상세로 이동)를 넣을지 — 숨김 해제 요청 처리 동선(문의 → 회원 → 홈에 뭐가 보이나 다시 보이기)에 필요한 최소 연결을 제안.

### 공통
Q30. 이 묶음이 고칠 파일 중 **관리자-162(보고서) 작업과 겹칠 가능성이 있는 파일**(예: a28-copy.js·a28-screens.js·a28-screens-bind.js·a28-screens-state.js·home-admin.css·support_tickets 상태 정의·admin_operation_logs·rest-schema.sql·schema_check.sql·마이그레이션 번호)을 적으세요. 「남은 응대」(162 ②)가 support_tickets 상태를 세므로, 이번 「처리 전」 정의가 162와 같아야 함을 확인.
Q31. 마지막에 아래 §4-⑦ SQL 목록을 실행 순서대로 정리(종현이 운영 phpMyAdmin에서 돌림, Actions는 SQL을 실행하지 않음).

## 4. 보고 형식 (한국어, 마지막 메시지 하나)
① 기준 SHA, 점검 중 수정·브랜치·PR 0건 확인(사용한 명령 목록)
② Q1~Q31 답 — 질문 번호 그대로. 근거는 항상 `파일:줄`.
③ **바꿔야 할 곳 지도** 표: | 항목(1~7) | 파일:줄 | 지금 | 바꿀 내용(한 줄) | 사이트 영향 있음/없음 |
④ **저장 경로 증명** 표(항목별): 화면 → API → 서비스 → SQL → 테이블.칼럼, 새로고침 후 다시 읽는 GET 경로.
⑤ **허용 파일 목록 초안** — [관리자] / [사이트·서버·SQL] 두 묶음으로 나누고 파일마다 「무엇만 고침」 한 줄. 새 파일은 이름까지. 이 밖은 수정 금지가 되는 전제로 빠짐없이.
⑥ **건드리면 안 되는 파일 제안**(공용 파일·검색·공개 조회 등)과 이유.
⑦ **SQL 목록**: 번호·파일명 제안, 전문 초안, 되돌리기 SQL, 적용 전 확인 SELECT, 실행 순서. 068 적용 확인 SELECT 포함.
⑧ **숫자 합격 기준 초안**(예시 수준이 아니라 측정 가능한 숫자로): 예) 숨긴 공부방 상세정보2 저장 1회 → DB profile_status='hidden' 유지·찾기 결과 0건 / 숨김 1회 = 알림 행 1건·다시 보이기 = 0건·user_notified=1, 학생 숨김 = 알림 0건·user_notified=0 / 세 역할 마이페이지 안내 한 줄 정확히 1번·다시 켜기 버튼 0개 / 접수 1건 = user_id 채워짐·요청 email 무시 / 필터 「처리 전」에 closed 0건 / 페이지당 N건·마지막 페이지 건수 / 회원 상세 문의 수 = DB 해당 user_id 건수 / 새로고침 후 같은 값.
⑨ **위험** 목록(심각도 높음/중간/낮음, 근거 파일:줄, 막는 방법).
⑩ 「잠긴 정책과 어긋난 오류」 / 「종현 결정 필요」(기본안 1개씩) 분리.
⑪ 마지막: `git status -sb` 출력.

## 5. 하지 말 것
- 코드·문서·설정 수정, 새 파일, 커밋, 브랜치, push, PR, 머지 — 전부 금지.
- 구조 재설계·관련 없는 정리 제안을 허용 파일 목록에 섞지 말 것(필요하면 위험 칸에 따로).
- 대화 스레드(다중 답글) 설계 금지(068 잠금).
- 숨김을 사용자 기능처럼 만드는 제안 금지(사용자가 숨기기·다시 켜기 버튼 등).
- 「범위 밖」으로 미루기 금지.
```

---

## §검수 결과 (2026-10-07 05:4x KST, 우동공과2)

- **대상:** 클라우드 에이전트 bc-d388febd-d9af-544b-ba27-63123d83ced0 점검 보고(전사본 마지막 줄 전체, ①~⑪ + 종현 결정 필요).
- **방법:** 박스 워크트리 `/workspace/study114-wt159ab`에서 `git fetch origin` 뒤 `git show origin/main:<path>`로 파일:줄 직접 대조(저장소 수정 0). origin/main = `11b0c0d82769ba27fa0792be59550e0aa14f233d` 확인.
- **판정: 합격 (보완 반영 후 작업지시서 docs/206 발송 가능).** 핵심 주장은 거의 다 맞음. 다만 빠지거나 그대로 쓰면 구현이 막히는 곳 7건을 docs/206에 반영함.

### 1. 점검 규칙 준수
| 확인 | 결과 |
|---|---|
| 에이전트 커밋·브랜치·push | 0건. `git ls-remote origin`에 숨김·문의 관련 새 ref 없음. heads/main = 11b0c0d |
| 열린 PR | #27(cur-007-phone-identity, 2026-09-21)만. 새 PR 0 |
| 보고 끝 `git status -sb` | `## main...origin/main` (깨끗) |
| 참고(이 에이전트와 무관) | 원격에 `cursor/admin-159ab-20261007`(c51d7d2), `cursor/admin-159d-20261007`(11b0c0d)가 아직 남아 있음 |

### 2. 직접 대조해서 맞은 주장
| 주장 | 근거(origin/main) | 결과 |
|---|---|---|
| 숨김 칼럼: 공부방·과외 `profile_status='hidden'`, 학생 `exposure_status='hidden'` | 005:22, 008:42, 004:92, rest-schema 159·234·408 | ✅ |
| saveFacility가 `?? 'draft'`로 profile_status를 덮어씀, hidden 확인 없음 | StudyRoomRegisterService.php:1015-1016, :1032, :1050 | ✅ |
| form-collect.js:354 칸 없으면 'draft', :480 payload | study-room-ui form-collect.js:354, :480 / 상세정보2 `includePublishBlock:false` embedded-panels.js:401-404 | ✅ |
| saveContact: 요청 있으면 그 값, 없으면 현재값, hidden 확인 없음 | TutorRegisterService.php:699-721, :751 / 마이페이지 인라인은 키 안 보냄 inline-save.js:139-146 | ✅ |
| StudyRoomHubService publish: hidden 확인 없이 published | StudyRoomHubService.php:52-63 (대표지역1 검사만) | ✅ |
| StudentHubService: hidden 거절, rejudge는 hidden·deleted 제외 | StudentHubService.php:60-62, :98-111 | ✅ |
| AdminExposureService user_notified true | :122, :179, :232, :298 / publish false :123·:180·:233·:299 | ✅ |
| AdminMemberService block → true | AdminMemberService.php:200 `$action === 'block'` | ✅ |
| 다시 보이기 = published 고정, draft/pending만 거절 | AdminExposureService.php:128-135, :185-192, :271-276 | ✅ |
| provider_system_notices 구조·dedupe 전역 UNIQUE | 032:3-18 (:14) | ✅ |
| upsertSystemNotice ON DUPLICATE가 is_read·created_at 안 바꿈 | ProviderReminderRepository.php:101-119 | ✅ |
| notices.php requireProvider, 학생 403 | notices.php:13, PaidApi.php:43-45 | ✅ |
| tickets POST 로그인 없음, 요청 email·role 신뢰 | tickets.php:29-32, SupportTicketService.php:34-55 | ✅ |
| 내 목록 email 기준(본인 확인은 세션 이메일 비교) | tickets.php:22-26, SupportTicketRepository.php:53-65 | ✅ |
| 「내 문의 내역」이 공부방·과외쌤에서도 열림 | router.js:82 roles 3개, shell.js:63-67·91 필터, navRoleFromAuthUser `preview/shared/site-nav-config.js:278-285`(보고는 경로를 `site-nav-config.js`로만 적음), screens.js:180→:465, mypage/index.js에 공급자 차단 없음 | ✅ (코드상 증명. 화면 캡처는 docs/206에서 요구) |
| 관리자 목록 렌더·라우트·허브·바인드·로드키 | a28-screens.js:935-971, :1864, :1879 / bind :2081-2119, :486, :520-524 / today-hub :133-144, :157-166 | ✅ |
| 전체 조회 LIMIT 없음 | SupportTicketRepository.php:40-50 | ✅ |
| 회원 상세 `tickets` = 횟수권 | a28-screens.js:1400 | ✅ |
| 076 비어 있음(최고 075, 074 없음), users.id BIGINT UNSIGNED, email UNIQUE | sql/schema 목록, 001_init:66·75 | ✅ |
| 과외 잔재 위치 | registration-check-copy.js:10·12·13·24, format.js:130-137·143·361-366, order-blocks.js:87, plans/screens.js:598·621, getProductApplyHint·getUnlockCards 호출처 0 | ✅ |

### 3. 틀리거나 빠진 주장 (docs/206에 반영)
1. **TutorHubService publish는 「무조건 published」가 아님.** :61-69에 `publishMissing`(8개 조건) 검사가 먼저 있음. 빠진 것은 hidden 확인뿐. (Q2 표의 표현 정정)
2. **찾기 노출 설명이 불완전함(Q4·Q5).** 찾기 목록은 hidden 제외에 더해 **대표지역1이 있어야** 나옴(SearchService.php:297-304·469, 과외 :307 이후·740). 그리고 공부방·과외쌤은 draft/published가 찾기 목록을 전혀 막지 않음(주석 :463, :736 「공개·완성도 게이트 없음」). draft/published 차이는 지도 핀(naver-map.js:55)·배지 정도. → 항목 2(미완성이면 draft)의 효과 범위와 마법사 「공개 상태」 칸 의미를 「종현 확인 필요」로 올림.
3. **알림·로그 순서 제안이 그대로는 구현 불가(Q7·Q13).** dedupe_key에 로그 키를 넣자고 했지만, 로그 키는 `AdminOperationLogRepository::insert` 안(:42)에서 만들어져 알림 INSERT 시점엔 없음. 또 `findStudyRoom`/`findTutor`(AdminExposureRepository.php:141, :154)는 **user_id를 고르지 않아** 알림 받을 주인 id가 없음. → docs/206: insert에 선택 인자 `?string $logKey = null` 추가(허용 파일에 AdminOperationLogRepository 추가), 주인 id는 서비스에서 따로 SELECT.
4. **e2e 줄 누락(Q17).** `e2e/a28-07-exposure-patch.spec.js:300`(제출자료 hide `userNotified: true`)이 빠짐. :298을 0으로 고치면 깨짐 → docs/206에 포함.
5. **세 번째 관리자 문의 화면 누락(Q25·Q30).** 옛 고객센터 운영 화면 `/support/admin/tickets`(support/admin-screens.js:146, :263-270)와 부트 `activateSupportApi`(main.js:427)가 파라미터 없는 GET 전체 목록을 씀. 서버 기본 응답을 페이지·필터로 바꾸면 그 화면이 조용히 20건만 보임. → docs/206: 파라미터 없는 GET은 그대로, 새 조회는 `admin=1` 쿼리로.
6. **내 목록 이메일 재필터 누락(Q23).** 화면이 서버 결과를 다시 이메일로 거름(ticket-store.js:132-134, mypage/screens.js:467). user_id로 바꿔도 이 필터가 남으면 다른 이메일로 남긴 옛 문의가 사라짐. → 제거 지시.
7. **배포 순서 사고 대비 누락(Q19·Q20).** 코드가 076보다 먼저 올라가면 user_id INSERT가 실패해 운영문의 접수가 전부 막힘. 기존 `hasReplyColumns()`(:21-30) 같은 칼럼 확인을 두도록 지시.
8. (작은 것) provider-notices.js:46이 `notice_kind`를 그대로 보여 줘서 숨김 알림이 「시스템 안내 · admin_hide」로 보임. 보고에 없음 → admin_hide만 「시스템 안내」로. 다른 종류(position_expiry_7d 등)도 영문 키가 보이는 기존 문제는 별건으로 보고만.
9. (작은 것) `scripts/verify-basic-exposure-gate.mjs`는 가짜 PDO로 StudyRoomRegisterService·StudyRoomHubService를 실제로 태움. saveFacility에 SELECT를 추가하면 깨질 수 있는데 Q17에 없음 → 가짜 답 추가만 허용.

### 4. 보고의 「종현 결정 필요」 처리
| 보고 기본안 | 처리 |
|---|---|
| saveFacility는 요청 상태를 안 쓰고 DB 값 유지 | **부분 채택.** 요청에 값이 없을 때만 현재값 유지, 값이 있으면(마법사) 지금처럼 씀, hidden은 항상 유지. 마법사 선택 칸 삭제는 안 하고 잔재 여부를 보고받음(종현 지시) |
| 다시 보이기 published 고정 | **변경(종현 결정).** 공부방·과외쌤도 미완성이면 draft. 이전값 복원 칼럼은 안 만듦 |
| 운영문의 유형 미리 선택 `?category=unhide_request` | 채택(허용 파일 안에서 되면) |
| 제출자료 숨김·이용제한 user_notified 1 유지 | **기각(종현 결정).** 보내는 코드가 없으므로 같은 오류 → 0 |
| admin-red-line-copy.js:143, tutor-reg-copy.js:41 유지 | 채택(유지) |

### 5. 종현 확인 필요 (아침 보고에 올림)
1. 마법사 「공개 상태」 선택 칸(study-room-ui layout.js:362-376, tutor-ui step-contact.js:85-93·step-detail.js:200-203)이 폐지된 공개조건 잔재인지 — 에이전트 조사 결과로 판단.
2. `TutorHubService::publishMissing`(:91-110)이 상세등록 완료·프로필 이미지·소개문까지 요구 — t1503 「노출 조건 = 기본정보 필수뿐」과 어긋나는 잔재인지. 이번엔 안 바꿈.
3. 공부방·과외쌤 찾기 목록이 draft도 보여 주는 지금 설계(게이트 = 숨김 제외 + 대표지역1) 유지 여부.
4. 운영 DB 068 적용 여부(phpMyAdmin 확인 SELECT).
5. 비로그인 운영문의 경로가 없어짐 → 로그인을 못 하는 사람의 「계정·로그인」 문의 창구 없음(오늘도 화면상은 없음).
6. backfill에서 0건·2건 이상 맞는 옛 문의는 user_id NULL로 둠(관리자 이메일 검색으로는 찾힘).
7. 마이페이지 셸 역할 글자 「학부모」(mypage/shell.js:73) — 「학생」 규칙 위반, 이번 허용 밖. 별건 처리 여부.
8. 옛 고객센터 운영 화면 `/support/admin/tickets` 존치 여부.
