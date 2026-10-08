# 204 · 관리자-162 보고서(일·주·월 · 일일정산서 · 자정 후 자동 메일) — 점검지시문 (읽기 전용, 2026-10-07)

- **작성:** 2026-10-07 05:1x KST (우동공과2)
- **절차 위치 (종현 t1478 잠금):** **점검지시문 (이 문서)** → 커서 작업 후 보고 → 검수 → 보완 작업지시서 → 수행결과 보고 → 재작업 → 검수완료 → 종현 보고 → 종현 승인 후 배포
- **정본:** docs/162-daily-settlement-report-draft.md (2026-09-25 골격 수락 · 2026-10-07 종현 t1475 정본 확인) / docs/190 2026-10-06·10-07 기록(t1450 큐 고정, t1478 「162 자세히 보기 = 읽기 전용 팝업」, 관리자 페이지 안에서만) / docs/200 §5(구현 0건) / docs/202 §3-9·§3-10·§4-5·§4-6(등록일 정의·KST)
- **같이 도는 작업:** 숨김 후속 + 문의 관리 묶음 점검(docs/203)이 별도 에이전트로 동시에 돈다. 다음 단계에서 두 작업은 서로 다른 브랜치에서 진행되므로, 이 점검은 **겹치는 파일을 반드시 적는다**(Q24).
- 「일일정산서」 = docs/162의 **일간 보고서**(본문 5줄, 화면·인쇄·메일 같은 내용). 별도 문서 양식이 따로 정해진 근거는 없음 → 코드·문서에서 다른 뜻의 근거가 나오면 「종현 결정 필요」로.

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달.

```
# [관리자-162] 보고서(일·주·월, 일일정산서, 자정 후 자동 메일) 점검지시문 (1단계: 읽기 전용 점검)

## 0. 이번 단계 규칙 (어기면 점검 불합격)
- 저장소: leejetty-commits/study114. 기준 = origin/main `11b0c0d` (운영 라이브, Deploy #393).
  시작할 때 `git rev-parse HEAD`(또는 origin/main)가 11b0c0d인지 보고 첫 줄에 적으세요. 다르면 그 SHA를 적고 그 기준으로 읽으세요.
- **읽기 전용.** 파일 수정 0, 새 파일 0, 커밋 0, 브랜치 생성 0, push 0, PR 0. 자동으로 브랜치·PR이 생기면 즉시 보고에 적고 아무것도 머지하지 마세요.
- 터미널은 읽기 명령만: git log/show/status/rev-parse/grep, rg, ls, cat, wc. npm install·build·테스트 실행·DB 접속·라이브 사이트 호출(cron URL 포함)·메일 발송 금지. 닷홈 호스팅 cron 지원 여부는 공개 문서 웹 검색으로만 확인(계정 로그인 금지).
- rg는 반드시 `-g '!node_modules' -g '!dist'` 를 붙이세요(안 붙이면 멈춥니다).
- 결과는 **마지막 메시지 하나에 한국어 보고서**로 씁니다(파일로 저장하지 않음). 끝에 `git status -sb` 출력(깨끗함)을 붙이세요.
- 새 정책을 만들지 마세요. 정본(docs/162)과 코드가 어긋나면 「잠긴 정책과 어긋난 오류」, 정본에 없는 판단은 「종현 결정 필요」(기본안 1개 포함)로 따로 적습니다.
- **어떤 항목도 「범위 밖」「다음에」로 미루지 마세요.** 화면·일·주·월·일일정산서·자세히 보기·자동 메일 전부 이번 162 범위입니다. 막히는 점은 「막힘 + 이유 + 풀 방법」으로 적습니다.

## 1. 목적
다음 단계 작업지시서(허용 파일 목록·금지·숫자 합격 기준)를 쓸 수 있게, 보고서 5줄 각각의 **데이터 출처(테이블·칼럼·조건)**, 보고서를 올릴 관리자 화면, 메일 발송 수단, 자정 후 자동 실행 수단(닷홈 PHP 호스팅), KST 경계 처리를 코드 근거(파일:줄)로 확정하고, **있는 것 / 없는 것**을 나눕니다.
「완료」의 정의 = 서버에 저장·집계되고 새로고침해도 같은 숫자가 나오는 것. 「지금」 기준 숫자(②·⑤)를 지난 날짜에도 보여 주려면 무엇이 저장되어야 하는지까지 증명하세요.

## 2. 배경 결정 (날짜·근거 그대로, 바꾸지 말 것)
- 2026-09-25 골격 수락(docs/162 잠금 1~6): 보고서 본문 = 요약만(합계 + 역할 분류). 상품(쪽지권·픽·프라임 등) 건건이는 「자세히 보기」에서만. Nice 없음. 일간을 누적해 주간·월간도 같은 골격. 마감은 Asia/Seoul. 관리자 자동 메일 = 마감 후 다음날 0:00~0:30 안.
- 2026-10-07 02:22 종현 t1475 정본 확인(docs/162 「2026-10-07 정본 브리핑」):
  ① 오늘 결제 — 그날 총 건수·총 금액 + 공부방/과외쌤/학생별 건수·금액. 상품별 내역은 본문에 없음.
  ② 남은 응대 — 아직 처리 안 한 문의/신고 개수. 일간은 보고서를 만드는 「지금」 기준. 주간·월간은 기간 중 새로 들어온 문의·신고 건수.
  ③ 오늘 등록 — 베이직카드 등록일 기준(계정 가입일 아님), 역할별.
  ④ 오늘 탈퇴·삭제 — 본인 탈퇴와 관리자 삭제를 따로, 각각 역할별.
  ⑤ 지금 홈 팝업 — 만드는 시점에 켜져 있는 홈 팝업 개수. 주간·월간은 기간 마지막 시점 스냅샷.
  제외: 노출 변경 기록, Nice(본인인증) 기록.
  기간: 일간 0:00~자정 / 주간 월 0:00~일 자정 / 월간 1일 0:00~말일 23:59:59 (전부 KST). 메일: 각 마감 직후 0:00~0:30, 받는 사람 = 관리자(마스터 등), 본문 = 5줄만(자세히 보기 목록 제외, 링크는 선택).
- 2026-10-07 종현 t1478: 관리자 페이지 안에서만. 「162 자세히 보기 = 읽기 전용 팝업」(관리자 안). 동선 = 메일 숫자 → 자세히 보기 목록 → 159 카드에서 처리.
- docs/162 §H: ③ 「자세히 보기」 = 159 등록 목록(159-c, 아직 미구현 — 숨김 묶음 다음 순서). 「159 먼저, 162는 재사용」 구성은 t1473 제안이며 종현 미확정.
- docs/202 §3-9·§4-5·§4-6: 등록일 정의 = 「베이직카드·기본정보를 필수 다 채워 올린 날」. 학생 = students.published_at(최초 완성, COALESCE 유지). 공부방·과외쌤 = BasicRegisterService 경로 행의 created_at만 정의와 맞고, insertDraft 우회 행(StudyRoomRegisterService:379, TutorRegisterService:397)은 다를 수 있음. 기본정보 미완성(draft) 행은 제외. 정의에 맞는 칼럼이 없으면 스키마를 추가하지 말고 멈추고 보고. 하루 = KST 0시~자정이어야 159 등록 목록과 숫자가 맞음.
- docs/200 §5: 관리자 트리에 settlement/정산 코드 0건(구현 0).
- 용어: 화면 글자는 「학생」(「학부모」 금지). 내부 키(guardian_student·parent 등)는 그대로.

## 3. 점검 질문 (번호대로 전부 답할 것)

### A. 줄별 데이터 출처
Q1. ① 결제: 결제 테이블 전부 확인(provider_payment_orders 031 SQL — 주석상 「PG 더미 주문(dev mock)」, status pending/paid/failed/cancelled, paid_at, amount_won / 그 밖 실제 PG·학생 결제·구독 테이블이 있는지). 「결제된 건」 판정(status='paid' + paid_at의 KST 날짜?), 환불·취소가 나중에 생긴 건의 처리, 금액 칼럼, 역할(공부방/과외쌤/학생) 판정 방법(주문 → users 역할 칼럼 또는 카드 테이블)을 파일:줄로. 학생 결제가 실제로 존재하는지.
Q2. ① 결제의 삭제 안전성: fk ON DELETE CASCADE(031)와 071_member_delete_payment_anon.sql·AdminMemberDeleteService가 회원 삭제 때 결제 행을 지우는지 익명화하는지 → 지난 기간 합계가 나중에 바뀌는지.
Q3. ② 남은 응대 — 문의: support_tickets(017·068) status open/in_progress/closed. 「처리 안 한 것」 = open+in_progress로 읽는 근거(관리자 화면 라벨 support-copy.js:394-398 등). 동시 진행 중인 숨김·문의 묶음(docs/203)이 같은 정의(「처리 전」= open+in_progress)를 쓸 예정이니 어긋나는 근거가 있으면 적기.
Q4. ② 남은 응대 — 신고: 관리자 「신고」 화면이 읽는 테이블(admin_reports 024, board_post_reports 075, ConcernReportRepository 등 — 어느 것이 관리자 신고 목록에 합쳐지는지)과 미처리 상태값을 파일:줄로(public/api/admin/reports.php → AdminReportService → AdminReportRepository). 주간·월간용 「기간 중 새로 들어온 건」의 접수 시각 칼럼.
Q5. ③ 등록: 역할별 등록일 칼럼과 정의 일치 증거(위 §2 202 근거 재확인). 운영 DB에 insertDraft 우회 행이 있는지 판별할 **확인 SELECT**(종현이 돌림)를 제안. 기본정보 완성 판정(학생 StudentBasicCompleteness, 공부방·과외쌤은 무엇)과 삭제·탈퇴 카드 제외 조건. 159-c 등록 목록과 **같은 쿼리를 한 곳에서** 쓰는 방법(공용 저장소 클래스 위치 제안)과, 162가 먼저 만들면 159-c가 재사용, 159-c가 먼저면 162가 재사용하는 두 경우의 충돌.
Q6. ④ 탈퇴·삭제: 본인 탈퇴(public/api/auth/withdraw.php → AccountWithdrawService, users.status='withdrawn'·deleted_at) 시각 칼럼, 관리자 삭제(AdminMemberDeleteService → admin_operation_logs action_kind 값, 071) 시각 칼럼. **탈퇴·삭제·익명화·purge(scripts/purge-withdrawn-accounts.php) 뒤에도 그 사람의 역할(공부방/과외쌤/학생)을 알 수 있는지** — 없어지면 지난 기간 숫자를 다시 셀 수 없음. 필요하면 최소 기록 방법(로그 칼럼 또는 스냅샷) 제안.
Q7. ⑤ 홈 팝업: home_popups(069) 칼럼, 「켜져 있음」 판정(활성 플래그 + 기간 — HomePopupService.php:96은 Asia/Seoul 날짜 사용) 파일:줄. 지난 기간의 「기간 마지막 시점」 스냅샷을 나중에 다시 만들 수 있는지(수정·삭제 이력이 남는지).
Q8. 제외 확인: 노출 변경(hide_profile·exposure_correction 로그)과 Nice 인증 기록이 위 쿼리에 섞이지 않는지(같은 admin_operation_logs를 쓰면 action_kind로 거르는 조건).

### B. 저장 여부(스냅샷)
Q9. ②(지금 기준)·⑤(그 순간 스냅샷)는 나중에 다시 계산할 수 없다. 지난 날짜 보고서를 화면에서 다시 보거나 주간·월간 ⑤를 만들려면 **보고서 결과를 저장하는 테이블**이 필요한지 판단하고, 필요하면 최소 스키마 초안(기간 종류·시작일·5줄 숫자·생성 시각·메일 발송 결과·중복 방지 UNIQUE)을 제안. ①③④도 저장값을 쓸지 매번 다시 셀지 비교(나중 환불·삭제로 숫자가 바뀌는 문제와 함께).
Q10. 새 마이그레이션 번호 제안: 현재 최고 075, 074 비어 있음. 숨김·문의 묶음이 076을 쓸 예정 → 162는 077 제안(다르면 이유). 기존 관례(068처럼 information_schema 확인, 「Actions는 SQL을 실행하지 않음, 운영 phpMyAdmin 먼저」), rest-schema.sql·sql/verify/schema_check.sql도 같이 고쳐야 하는지.

### C. 시간대(KST 경계)
Q11. PHP 기본 시간대(date_default_timezone_set 여부, bootstrap.php·config), DB 연결 때 time_zone 설정 여부(Database\Connection), DATETIME 칼럼이 CURRENT_TIMESTAMP·PHP date() 중 무엇으로 채워지는지 테이블별로(결제 paid_at, 문의 created_at, 신고, 등록일, 탈퇴 deleted_at, 로그). 시간대 처리 기존 예(PositionPeriodCalculator::BUSINESS_TZ, HomePopupService:96).
Q12. 저장값이 KST가 아닐 가능성이 있으면 경계 처리 방법 제안. 종현이 운영 DB에서 돌릴 확인 SQL(`SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();`) 포함. 일·주(월요일 시작)·월 경계를 계산할 한 곳(함수 위치) 제안.

### D. 관리자 화면(보고서 · 일일정산서 · 자세히 보기)
Q13. 보고서 화면을 올릴 위치: 관리자 메뉴(a28-copy.js 메뉴 정의)·라우트(renderA28Screen 분기 a28-screens.js:1846 근처)·바인딩(bindA28ScreenEvents)·권한(admin-permissions.js, canAccessAdminPath). **이름 충돌 주의:** 기존 `/admin/reports`·`public/api/admin/reports.php`·renderReports = 「신고」 → 162는 다른 경로·파일 이름을 제안(예: settlement). 일반 관리자/부마스터 권한 중 누구에게 보일지 근거(근거 없으면 「종현 결정 필요」).
Q14. 화면 구성 최소안: 일간/주간/월간 전환, 기간(날짜) 고르기, 5줄 본문, 인쇄(일일정산서 = 같은 5줄을 인쇄). 인쇄를 지금 관리자에서 하는 기존 방식이 있는지(window.print·인쇄용 CSS) 파일:줄. 숫자·차트 추가 금지(5줄만).
Q15. 자세히 보기 = 관리자 안 **읽기 전용 팝업**: 기존 관리자 서랍(renderDetailDrawer/bindDetailDrawer, a28-screens-shared.js:56-84)과 159-d 가운데 큰 팝업 CSS(home-admin.css 끝 `.admin-shell [data-today-drawer-host]` 규칙, 허브 안에서만 적용)를 재사용할 수 있는지, 보고서 화면에서 같은 모양을 쓰려면 무엇이 필요한지. 5줄 각각의 목록 칸(결제: 시각·회원·상품명·금액 / 응대·등록·탈퇴삭제·팝업) 제안. ③ 목록은 159-c와 같은 데이터. 편집 버튼 0개(읽기 전용), 처리 동선은 159 카드 링크.
Q16. 새 관리자 API 초안(GET만, AdminApi::requireAdmin 등 기존 권한 함수): 보고서 숫자 GET, 자세히 보기 목록 GET(페이지 나눔). 파일 이름 제안.

### E. 자정 후 자동 메일
Q17. 메일 발송 수단: src/Mail/*(MailTransportFactory·Resend HTTPS), AuthMailer(인증 메일 전용 클래스인지, from 주소 @study114.net 검사, 로그 방식), config/auth.php mail_transport(resend|fake|disabled), config/dothome.env.example. 보고서 메일에 재사용할 클래스와 재사용 시 바꿀 줄(인증 메일 쪽을 건드리지 않는 방법).
Q18. 받는 사람: 「관리자(마스터 등)」를 코드로 고르는 방법(users의 admin_level 값 super_admin·sub_master 등, admin-permissions.js·AdminApi) 파일:줄. 받는 사람 목록을 설정에서 고칠 곳이 있는지(SiteSettings 등). 없으면 기본안.
Q19. 자동 실행 수단: 기존 `public/api/cron/paid-reminders.php`(POST + X-Cron-Key, config paid.cron_key)를 **무엇이 부르는지** 저장소·문서·워크플로에서 찾기(.github/workflows에 schedule 없음 확인, docs/internal·README·deploy.yml·SiteSettingsService.php:484 `/api/cron/` 예외). 닷홈 호스팅의 cron 지원 여부(공개 문서), GitHub Actions schedule을 대안으로 쓸 때의 지연 위험(0:00~0:30 창을 놓칠 수 있음), 외부 웹 cron 대안. 각 안의 장단점과 기본안.
Q20. 한 번만 보내기(중복 방지): 같은 기간 메일이 두 번 나가지 않게 하는 방법(Q9 저장 테이블 UNIQUE 또는 provider_reminder_dispatches 같은 기존 dedupe 패턴 032 SQL), 실패 때 재시도 범위(0:30까지), 발송 결과 기록 위치.
Q21. 일·주·월이 같은 날 겹칠 때(월요일이 1일인 날 등) 메일을 3통 보낼지 1통에 묶을지 — 정본에 없으면 「종현 결정 필요」(기본안 포함).
Q22. 메일 본문 5줄 형식(docs/162 §D 예시와 같은 줄 구성), 「학생」 용어, 링크(선택) 포함 여부.

### F. 있는 것 / 없는 것 · 공유 파일
Q23. 표로 정리: 보고서 각 부분(①~⑤ 쿼리, 저장 테이블, 화면, 인쇄, 자세히 보기, API, 메일 클래스, 받는 사람, 자동 실행, 중복 방지, KST 경계) | 있음/일부/없음 | 근거 파일:줄 | 새로 만들 것.
Q24. **숨김·문의 묶음(docs/203)과 겹칠 수 있는 파일**을 전부 적으세요: 예) preview/home-ui/src/admin/a28-copy.js·a28-screens.js·a28-screens-bind.js·a28-screens-state.js·a28-screens-shared.js·home-admin.css, support_tickets 관련(SupportTicketRepository 등), admin_operation_logs·AdminOperationLogRepository, rest-schema.sql·schema_check.sql, 마이그레이션 번호, verify 스크립트. 겹침을 피하는 방법(예: 162 화면을 새 파일로 분리하고 기존 파일은 메뉴 1줄·라우트 1줄만)도 제안.
Q25. 159-c(등록 목록, 숨김 묶음 다음 순서)와 겹치는 부분(③ 쿼리·자세히 보기)을 어떻게 나눌지 제안.

## 4. 보고 형식 (한국어, 마지막 메시지 하나)
① 기준 SHA, 점검 중 수정·브랜치·PR 0건 확인(사용한 명령 목록)
② Q1~Q25 답 — 질문 번호 그대로. 근거는 항상 `파일:줄`.
③ **5줄 데이터 출처 표**: | 줄 | 일간 셈 SQL 조건(초안) | 주간·월간 셈 | 테이블.칼럼 | 시각 칼럼·시간대 | 역할 판정 | 삭제·환불 뒤 안정성 |
④ **있는 것/없는 것 표** (Q23).
⑤ **허용 파일 목록 초안** — [관리자] / [사이트·서버·SQL] 두 묶음, 파일마다 「무엇만 고침」 한 줄, 새 파일은 이름까지. 사이트 화면 파일은 0개가 목표(관리자 페이지 안에서만). 서버 cron 엔드포인트·메일 클래스가 사이트 공용이면 이유와 최소 변경 줄.
⑥ **docs/203(숨김·문의)과 겹치는 파일 목록**과 피하는 방법(Q24), 159-c와 나누는 방법(Q25).
⑦ **SQL 목록**: 번호·파일명, 전문 초안, 되돌리기, 적용 전 확인 SELECT(시간대·우회 행·068 적용 여부 등), 실행 순서(종현이 운영 phpMyAdmin에서 돌림).
⑧ **숫자 합격 기준 초안**(측정 가능한 숫자): 예) 픽스처 결제 공부방 3건 20만·과외쌤 2건 30만 → ① 5건 50만·역할별 일치 / 23:59:59 KST 결제는 그날, 00:00:00 KST 결제는 다음날 / 주간 = 월~일 일간 합과 같음(①③④) / ② 일간 = 생성 시점 open+in_progress 수 / 노출 변경·Nice 0건 섞임 / 자세히 보기 행 수 = 본문 숫자, 편집 버튼 0개 / 같은 기간 메일 0:00~0:30 안 정확히 1통, 재실행해도 1통 / 새로고침 후 같은 숫자 / 「학부모」 0건.
⑨ **위험** 목록(높음/중간/낮음, 근거, 막는 방법) — 최소: 시간대 어긋남, 결제 테이블이 dev mock일 가능성, 삭제·purge 뒤 역할 소실, cron 미지원·지연, 메일 중복, 「reports」 이름 충돌, 159-c와 쿼리 이중화.
⑩ 「잠긴 정책과 어긋난 오류」 / 「종현 결정 필요」(기본안 1개씩) 분리.
⑪ 마지막: `git status -sb` 출력.

## 5. 하지 말 것
- 코드·문서·설정 수정, 새 파일, 커밋, 브랜치, push, PR, 머지 — 전부 금지. cron URL 호출·메일 발송·DB 접속 금지.
- 보고서 본문에 5줄 밖 숫자·차트·상품별 내역 넣는 제안 금지. 노출 변경·Nice 포함 제안 금지.
- 159 「오늘 할 일」 4카드 구조·허브 변경 제안 금지. 사이트 화면 변경 제안 금지(관리자 페이지 안에서만).
- 「범위 밖」으로 미루기 금지.
```

---

## 검수 결과 (2026-10-07 05:3x KST, 우동공과2)

- **대상:** 클라우드 에이전트 bc-e7ff8438-9a61-503e-a3bf-4d77a959fba7 점검 보고(transcript 마지막 줄). 기준 origin/main `11b0c0d82769ba27fa0792be59550e0aa14f233d`.
- **방법:** 박스 worktree `/workspace/study114-wt159ab`에서 `git fetch origin` 뒤 `git show origin/main:<경로>`로 주요 파일:줄 직접 대조. 저장소 수정 0.
- **판정: 점검 합격 (핵심 사실 정확).** 단, 아래 「틀림·빠짐」 4건은 작업지시서(docs/205)에 고쳐서 반영함.

### 직접 확인한 것 (맞음)
| 항목 | 근거 |
|---|---|
| 결제 = `provider_payment_orders` 하나, status `pending/paid/failed/cancelled`, `paid_at` = markPaid의 `NOW()`(pending→paid 1회), `pg_provider='dev_mock'` | 031:2·19-22, ProviderCheckoutRepository.php:92·179-184 |
| `refunded`는 ENUM에 없는데 삭제 쪽은 paid·refunded를 결제로 셈 | 031:19, AdminMemberDeleteService.php:396-405 |
| 031 FK CASCADE, 071은 FK 풀고 user_id NULL + deleted_user_ref·deleted_display_name, 삭제 서비스는 071 없으면 예외·있으면 익명화 | 031:26-27, 071:12-50, AdminMemberDeleteService.php:240-267 |
| 문의 status `open/in_progress/closed`, 라벨 접수/확인 중/종료, role_type에 `parent` | 017:29-31, SupportTicketService.php:13-14, support-copy.js:394-398 |
| 신고 `admin_reports` status `open/protect/resolved/dismissed`, API 체인 reports.php→Service→Repository | 024:16, AdminReportService.php:13·28-30·96, AdminReportRepository.php:16-26, reports.php:12-19 |
| 학생 등록일 = published_at(완성 때 date(), COALESCE 유지) / 공부방·과외쌤 published_at = 최초 공개(허브) / insertDraft 줄 | BasicRegisterService.php:313·360, 016:22, StudyRoomHubService.php:61, TutorHubService.php:70, StudyRoomRegisterService.php:379, TutorRegisterService.php:397 |
| 관리자 삭제 로그 `account_delete`/`user`/`member_ops` + 메모, 이후 카드·역할·users 삭제 | AdminMemberDeleteService.php:152-180·581-592 |
| 홈 팝업 창 판정·Asia/Seoul 오늘 | HomePopupRepository.php:112-126, HomePopupService.php:96 |
| `date_default_timezone_set` 0건, `SET time_zone` 0건(Connection.php:21-36), KST 예는 PositionPeriodCalculator:36 | git grep origin/main |
| 메일 = MailTransportFactory(기본 resend, fake/disabled, smtp·mail() 거절), AuthMailer From @study114.net 검사 | MailTransportFactory.php:27-63, AuthMailer.php:30-57·74-90 |
| cron = paid-reminders.php POST + X-Cron-Key, 부르는 곳은 e2e뿐, workflows에 schedule 0, `/api/cron/` 점검모드 쓰기 예외 | paid-reminders.php:11-23, e2e/p18-e-reminders.spec.js:32, SiteSettingsService.php:478-490 |
| 메뉴·라우트·권한: A28_MENU, renderA28Screen 분기(/admin/reports = 신고), bindA28ScreenEvents, canAccessAdminPath→canAccessAdminMenu(부마스터 금지 permissions·settings·system), AdminApi::requireAdmin | a28-copy.js:120-478, a28-screens.js:1852-1871, a28-screens-bind.js:544, admin-guard.js:13-19, admin-permissions.js:25·59-64, AdminApi.php:89-100 |
| 가운데 팝업 CSS는 `.admin-shell [data-today-drawer-host]`에만 | home-admin.css:977-1011 |
| docs/162·190·200·202·203은 저장소에 없음(박스 docs에만 있음) — 정상 | `git ls-tree origin/main docs/` |
| 에이전트 커밋·브랜치·PR 0: `git ls-remote`에 162 관련 cursor/* 없음(남은 cursor/admin-159ab-20261007=c51d7d2·cursor/admin-159d-20261007=11b0c0d는 이전 작업, 둘 다 main에 포함), 열린 PR은 #27(2026-09-22 KST)뿐 | ls-remote, GitHub list_pull_requests |

사소한 줄 차이: A28_MENU는 120-364가 아니라 120-478(364는 고객응대 그룹 끝). 판단에 영향 없음.

### 틀림·빠짐 (작업지시서에서 고침)
1. **③ 우회 행 확인 SELECT가 위험을 재지 못함.** 제안 SELECT는 「필수칸이 빈 행」을 세는데, 그런 행은 완성 판정으로 어차피 빠짐. 실제 위험은 「카드를 먼저 만들고 나중에 완성해서 created_at이 앞당겨진 행」이고 이건 그 SELECT로 안 잡힘. 또 BasicRegisterService의 정상 INSERT도 `profile_status='draft'`(519·537·813)라서 공부방·과외쌤은 profile_status로 draft를 거르면 정상 등록이 빠짐 → 완성 판정 = BasicRegisterService와 같은 「지역1 존재」(55-117). 코드상 insertDraft는 같은 트랜잭션에서 지역1까지 저장하는 것으로 보임(StudyRoomRegisterService 196-275의 basic_all, TutorRegisterService 137-155·185-187) → 에이전트에게 증명시킴. 「1건이라도 있으면 ③ 중단」은 쓰지 않고, 옛 행 수를 재는 확인 SQL(지역1 created_at > 카드 created_at + 10분)로 바꿈.
2. **cron 키 위험을 놓침.** 운영 `.htaccess`(public/.htaccess:77-92)와 deploy.yml(91-145)에 `STUDY114_CRON_KEY` 주입이 없음 → `config/paid.php:8` 기본값 `dev-cron-key`로 떨어질 수 있음. 이 값은 공개 저장소 e2e/p18-e-reminders.spec.js:13에 있고, paid-reminders.php:18은 `?key=` 쿼리도 받음. 운영에 실제로 따로 넣었는지는 확인 못 함(라이브 호출 안 함). → 162는 전용 키 `STUDY114_REPORT_CRON_KEY` + fail closed + 헤더만. 기존 paid-reminders는 162에서 안 고침(종현 확인 필요).
3. **시간대 「KST 아니면 멈춤」은 불필요.** 코드가 실행할 때 DB 오프셋(`TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), NOW())`)과 PHP 시간대(`date_default_timezone_get()`)를 직접 잴 수 있음. 값 소스가 섞여 있음(PHP date(): students.published_at, users.deleted_at / MySQL: 나머지) → 변환 함수 하나에 소스 인자('db'|'php')를 둠. 운영 DB 확인 SQL은 기록용으로만.
4. **관리자 삭제 메모의 역할 파싱이 단순하지 않음.** 메모 `역할 %s · 공부방 %d · 과외쌤 %d · 학생 %d`(152-161)에서 `%s`는 roleLabel()이 같은 구분자 ` · `로 이은 값(462-477) → 「역할 뒤를 집계」하면 숫자 칸까지 섞임. 다중 역할 계정 처리도 정해야 함. → 정규식 하나로 숫자 칸 앞까지만 읽게 지시, 다중 역할은 역할마다 1(기본안).
5. (보완) 메뉴를 최상위 항목으로 넣으면 운영 홈 허브 카드가 하나 늘어 159 허브가 바뀜(verify-admin-preview-labels.mjs:134-142·215-222) → 「마켓·결제」 그룹 끝에 넣음. 실제 메뉴 1개당 labels 검사 4개 증가(190-207) → 기준 198→202.
6. (보완) rest-schema.sql·schema_check.sql은 203이 같은 파일 끝을 고침 → 162는 손대지 않고 077 파일 끝에 확인 SELECT를 둠.
7. (보완) 받는 사람: 점검 기본안(활성 최고관리자)에 환경값 `STUDY114_REPORT_MAIL_TO` 우선을 더함.

### 종현 결정 필요 (작업지시서 §7에 기본안으로 구현)
화면 열람 등급(둘 다) · 메뉴 위치·이름 · 메일 받는 사람 · 겹치는 날 3통 · 00:30 넘으면 안 보냄 · 외부 웹 cron 00:05/00:20 · 메일 링크 1개 · 고민방 신고 제외 · 같은 날 등록 후 탈퇴 둘 다 셈 · 다중 역할 역할마다 1 · 학생 결제 0 표시·역할 미확인 따로 · 지난 기간도 저장값 · 팝업 아래 처리 화면 링크 · 전용 cron 키. 별건: 기존 paid-reminders cron 키 기본값 문제(위 2).

- **다음:** docs/205 작업지시서 → 같은 에이전트에게 보냄(우동공과2가 보냄). 브랜치 `cursor/admin-162-20261007`, 배포 직전까지.
