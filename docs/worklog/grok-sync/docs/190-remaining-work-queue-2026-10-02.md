# 남은 작업 순서 (2026-10-02 04:53 기준, 종현 요청으로 그대로 저장)
종현이 다시 물으면 이 목록을 그대로 나열한다. 변경이 있으면 이 문서를 갱신하고 갱신 시각을 적는다.

## A. 무결성 (지금 진행 중)
1. 무결성-9 (쪽지 첨부 고아 파일 정리): 수락 완료, 로컬에만 있고 미배포.
2. 무결성-10 (학생 수 0/2명 이상 막다른 화면 + 로그인 창): 수락 완료, 로컬에만 있고 미배포.
3. 검사 스크립트 정리: 「Tutor mypage frame IA」 검사(getTutorEntryPath() 위치가 옛 구조 기준)와 verify-tutor-mypage-route-integrity.mjs(「찜한학생」→「관심 학생」)를 현재 구조에 맞게 수정. 배포를 막는 검사는 아니지만 CI가 계속 빨갛게 보임.
4. 서버 ok:false 확인: cron/paid-reminders.php:27, site/public-settings.php:39, auth/phone/send-otp.php:39, verify-otp.php:44에서 성공/실패 응답 덮어쓰기 확인 후 같은 방식으로 수정.
5. 학생 관련 잔여 점검: 요청문 열람권 폐지에 맞춰 남은 옛 paid_only 코드가 없는지 확인.
6. 쪽지 마무리: 공급자↔공급자 첫 쪽지 허용을 정본(ssot/16 §1-2)에 맞게 코드 주석·검사에 반영, 관리자 쪽지 오류 문구 정리(관리자 쪽지 사용 여부는 미결이라 문구만).
- 닫힌 항목: 무결성 1번(쪽지권 우회)은 코드 확인 결과 실제 구멍 없음. 「한 줄 요청문 있음」 필터는 모든 공급자에게 현행 유지.

## B. 무결성 묶음 마감
7. 수락한 묶음 전체를 종현이 「배포」라고 하면 Cursor에 커밋·푸시 지시를 한 번에 준다.
8. 배포 뒤 종현이 직접 하는 라이브 확인: 학생 가입 후 카드 노출, 칸을 비웠을 때 카드 내려감, 고민방 글쓰기 저장. 확인되면 그때 「서버 연결 완료」 기록.
9. 075 SQL(sql/schema/075_concern_comments_reactions.sql) 재적용은 종현 몫.
10. 기존 학생이 있으면 scripts/publish-complete-student-drafts.php 실행 방법을 단계별로 안내(기존 학생이 없으면 불필요).

## C. 사이트 오류 (무결성 뒤, 확정된 것만, 한 번에 하나씩)
11. 게스트 홈·찾기 위치: 공부방 「대치동」(없으면 「대치1동」), 과외쌤·학생 「서울시 강남구」. 샘플 카드는 실제 카드가 0건일 때만 1장.
12. 우측 레일: 고민방 3칸(「공부방 고민방」「과외쌤 고민방」「학생 학부모 고민방」), HOT, 이달의 베스트 고민은 0건이어도 구역·제목 항상 표시. 서버 오류와 0건 구분. 감성 문구는 한 곳에 모음.
13. 정보 게시판 2개(「공부방 쏙쏙정보」「과외쌤 따끈 팁가이드」): 자료실과 같은 위치, 레일 배너 연결, 읽기·쓰기·분류 4개 구현.
14. 홈 공지 「더 보기」를 페이지 이동이 아닌 공지게시판 팝업으로 변경. 「더보기」「전체 N개」 글자 크기를 디자인 규칙에 맞게 축소.
15. 「프리미엄(164)」「오픈 (프리미엄)」 문구: 어느 화면인지 찾아야 하므로 종현의 스크린샷(주소창 포함, 어떤 모드인지) 필요.

## D. 이후 큐
16. 자료실 정리, 로그인·가입 환영 문구와 자체 호스팅 폰트, 월간 콘테스트 설계 답변, 관리자 모드(157-x, 158, 159, 162), 146~180 최종검수.
17. 최종검수 정리 목록: 옛 문서 정리(ssot/13, 16, 18, 09:361, docs 29/30), 옛 basic-student.php 제거, 인증서류와 숨김·삭제 잔재, 환불 기능(PG 계약 대기), 제출함 코드 제거, 관리자용 고민방 글 복구 화면, HOT/BEST 정렬 PHP 이관과 N+1 점검, board_posts.status ALTER 잠금 위험, 화면만 있고 서버 저장이 없는 기능 전수 점검, 샘플 코드 제거.
18. 모든 작업이 끝난 뒤 종현이 「남겨」라고 하면 변경분을 노션에 일괄 반영.

- [추가 2026-10-02] 관리자 페이지 포함 전체 화면의 「학부모」 용어를 「학생」으로 전부 갱신(관리자 페이지 우선 목록화). 「학생 2명 이상」 용어·문구 정리.

- [2026-10-02 05:30] 배포 18fd3a8(무결성-9·10) 완료. 무결성-3(검사 스크립트 2개 수정, frame-ia 29/0, route-integrity 60/0) ACCEPT — 로컬 미커밋·미배포. 다음: 무결성-4(서버 ok:false 덮어쓰기 4곳).

- [2026-10-02 05:35] 무결성-4 점검 완료: send-otp / verify-otp / paid-reminders / public-settings 4곳 모두 `array_merge(['ok'=>true], $결과)` 이고, 각 서비스 결과 배열에 'ok' 키가 없어 ok:false 덮어쓰기 구멍 없음 → 티켓 불필요(종결). 참고: public-settings.php 는 DB 읽기 실패 시 error_log 후 ok:true + 빈 값(점검·약관 없음)으로 응답(의도된 fail-open). 클라이언트 주석(site-settings-store.js:257)은 「실패하면 덮어쓰지 않는다」인데 서버는 실패를 숨김 → 종현 판단 대기. 다음: 무결성-5(paid_only 잔존 코드).

- [2026-10-02 05:45] 무결성-5(요청문 열람권·paid_only 죽은 화면 코드 정리) ACCEPT — 로컬 미커밋·미배포. diff 확인: request-unlock.js·student-detail-modal.js 삭제(참조 0 확인), student-visibility/policy/format/student-reg-copy 정리, 관리자 라벨 「요청문 열람권(폐지)」, 관리자 회원 필터 「학부모 포함」→「학생 포함」.
  - 남은 것 → 무결성-5b: (a) 실제 결함: ProviderReminderRepository::listTicketPackExpiryCandidates(43-48)가 ticket_type을 거르지 않아 남은 request_view 이용권이 있으면 「요청문 열람권」 만료 알림이 발송될 수 있음, (b) 호출처 0건 서버 함수/엔드포인트(request-access.php, ProviderEntitlementService 76~95, canViewPaidRequest, hasRequestUnlock·recordRequestUnlock·studentHasPaidOnlyFields 등), (c) 허용 밖 화면 잔존(provider-status.js, provider-entitlement.js:25, paid-api.js:67-89, plans/store-ui.js 302·310, student-enums/exposure-format 「공급자 공개」, auth-ui register-enums VISIBILITY_OPTIONS, detail-decision/index.js:155 주석, 문서 DOC-CHECKLIST.md:137·SSOT-ALIGNMENT.md:26).
  - 수정 전부터 실패 중인 검사 3건(verify-paid-pr-a: checkout_ignores_client_amount 1건 / verify-paid-renewal: positions 주문요약·적용대상, tutor 가이드 점유·예약대기 금지 카피 2건) → 별도 정리 티켓 필요(순서는 무결성-6 뒤).
  - 「학부모」 남은 곳(관리자·게시판): admin/a28-copy.js:471, board-channel-store.js:24, admin/site-settings-store.js:27 등 → 용어 정리 작업 때.

## 2026-10-02 갱신 — 무결성-6 ACCEPT (로컬, 미커밋·미배포)
- MessagesService.php: 관리자→학생 첫 쪽지 조기 422(쪽지권 조회·차감 전), 학생 차단 문구 「학생은 공급자에게만…」. docs/ssot/16 §1-2: 공급자끼리 첫 쪽지 상호 무료 행 + 학부모→학생. 신규 scripts/verify-message-compose-direction.php(69/69, 미추적), 첨부 검사 21/21.
- 무결성-6b(후속, 미루지 않음): (1) 관리자↔학생 기존 대화 후속 쪽지가 방향 검사 없이 나가는 빈틈(MessagesService 100~104) 처리 결정, (2) 화면 permissions.js(18~19, 31, 50~52, 61~63)가 관리자를 공급자처럼 취급 → 서버와 일치시키기, (3) ssot/16 §1-2 밖 「학부모」 14줄(60,62,81,121,122,150,160,206,208,216,245,248,257,258).
- 무결성-5b에 만료알림 크론 request_view 제외 포함(ProviderReminderRepository 43-48).

## 2026-10-02 갱신 — 무결성-5b 부분 ACCEPT (로컬, 미커밋·미배포)
- 수락: 만료알림 크론 ticket_type='memo' 필터(ProviderReminderRepository), onTicketBalance memo만, ticketLabel 쪽지권 고정, 서버 죽은 메서드 삭제(Entitlement 4개, Ticket canViewPaidRequest, Repo hasRequestUnlock/recordRequestUnlock/studentHasPaidOnlyFields/getStudentVisibility), status 응답 unlocked_student_ids·열람권 라벨 삭제, 화면 잔재 삭제. 새 검사 verify-provider-reminder-ticket-type.php 13/13(원본 2/13). 기존 실패 3건 동일.
- 미완(Must 2 일부) → 무결성-5c: request-access.php(+e2e p18-c-request-view.spec.js, p18-pr-b-browser.spec.js:217, run-paid-pr-a-e2e.ps1:46, package.json e2e:p18-c, e2e helpers/admin-api.js:199), Ticket unlockPaidRequest/getRequestAccessStatus/getRequestAccessList, listUnlockedStudentIds, verify-paid-pr-b-integration.php:317, status request_view 블록(+e2e p18-b-tickets.spec.js:15), 새로 죽은 코드 5개(getRequestViewTicketsRemaining, getRequestViewNearestExpiry, ProviderTicketService 잔여알림 request_view 분기·countRequestViewTickets, ProviderTicketService.php:301 라벨, RegisterEnums.php:145 「공급자 공개」, exposure-schema.js STUDENT_LIST_FIELDS, CSS .plans-card__media--view), student-reg/store.js paid_only 기본값 읽는 곳 4곳(format.js:39,41 / student-request-card.js:98-99 / student-auth-bridge.js:96-100 / search-exposure-mapper.js:169-172).
- DB 정리 순서(종현이 SQL 직접 적용, 코드 정리 배포 뒤): request_view 팩 행·provider_request_unlocks 백업 → request_view 팩 행 삭제 → ALTER ticket_type ENUM('memo') → 외래키 확인 후 DROP provider_request_unlocks → 새 마이그레이션 + rest-schema.sql(1459,1533,1550)·scripts/fixtures/paid-pr-a-temp-db.sql:93·apply-schema-dev.ps1:105 정리.

## 2026-10-02 갱신 — 무결성-5c ACCEPT (로컬, 미커밋·미배포; request-access.php·p18-c spec은 git rm 스테이징 상태)
- 요청문 열람 API·테스트·status/entitlements request_view 응답·죽은 서버/화면/CSS 제거 완료. 소스 grep 0건 재확인. 검증 전후 동일(기존 실패 3건만).
- 보존(의도): 관리자 AdminCommerceRepository.php:46,175 / AdminMemberRepository.php:294 / a28-screens.js:192,197 「요청문 열람권(폐지)」 → DB 정리 SQL 이후 과제. PaidCatalog removed_skus·verify 단정 문자열.
- 무결성-5d(후속, 미루지 않음): 요청문 visibility(paid_only) 값이 판정·표시 어디에도 안 쓰이는 통과 값임이 확인됨 → 4곳(student-reg/format.js:39,41, student-request-card.js:98-99 renderProtectedBlock 미사용 파라미터, student-auth-bridge.js:96-100, search-exposure-mapper.js:169-172) + store.js 기본값/typedef 제거. 단 서버 students.request_summary_visibility 컬럼 처리는 DB 변경 필요 → 종현 SQL 단계에서.
- 빌드 산출물 public/search/assets/index-*.js에 옛 문자열 → 다음 build:dothome 때 소멸.
- 남은 무결성: 6b, 5d, 기존 실패 검사 3건 원인 확인. 이후 「배포」 지시 대기(무결성-3·5·5b·5c·6 로컬 누적).

## 2026-10-02 갱신 — 무결성-6b ACCEPT (로컬, 미커밋·미배포)
- MessagesService: 기존 대화 후속·답장에서도 관리자→학생 차단(assertFollowUpDirection, 상대 주역할 학생 쪽일 때만). permissions.js: 관리자 공급자 취급 제거, 관리자→학생 reason 'role'. ssot/16 학부모 14줄→학생. 검사: compose-direction 142/142, permissions-admin 41/41(원본 34/41), 나머지 전후 동일.
- 무결성-6c(후속, 미루지 않음, 화면 어긋남 3곳): detail-decision/detail-shell.js:62(관리자를 'tutor'로 변환 → 학생 상세에서 서버 422), student-review-ui.js:31·100(reason 'role'이 관리자에게 「로그인 필요」/공급자 등록 링크), compose-flow.js:29(일반 alert), messages-copy.js 답장 불가 문구(관리자에게 「답장할 수 없습니다.」). 관리자 안내 문구는 「관리자 계정은 학생에게 쪽지를 보낼 수 없습니다. 운영 안내는 공지를 이용해 주세요.」로 통일.
- 무결성 남은 순서: 6c → 5d → 기존 실패 검사 3건 원인 확인 → 「배포」 지시 대기(3·5·5b·5c·6·6b·6c 누적).

## 2026-10-02 갱신 — 무결성-6c ACCEPT (화면 전용, 로컬, 미커밋·미배포)
- 관리자 역할 보정 resolveMemoRole(messages-copy.js, authRoleType()==='admin'일 때만 'admin'), 학생 상세 카드·목록 버튼·쪽지 시작·답장 불가 문구를 통일 문구로. 검사 permissions-admin 88/88, 나머지 전후 동일, home-ui/search-ui 빌드 성공.
- 동작 변화: 관리자가 공부방·과외쌤 카드 ✉에서 쪽지 작성창이 열림(정책과 일치).
- 무결성-6d(후속, 미루지 않음): ① state.js:292-298 getActiveRole()이 관리자를 'guest'/저장된 역할로 바꿈 ② messages/screens.js:132,206,279 canReplyInThread에 보정 미적용 → 관리자가 쪽지함에서 공급자 대화 답장 폼이 안 열리고, 저장된 역할이 tutor면 학생 대화 답장 폼이 열릴 수 있음(서버는 422) ③ detail-shell.js:110 data-provider-role 'admin'→'tutor' 변환은 찜 저장용이라 유지(확인만).
- 무결성 남은 순서: 6d → 5d → 기존 실패 검사 3건 원인 확인 → 「배포」 지시 대기.

## 2026-10-02 갱신 — 무결성-6d ACCEPT (쪽지함 관리자 판정, 로컬, 미커밋·미배포) → 쪽지 시리즈(6/6b/6c/6d) 종료
- messages/screens.js 132·279줄 resolveMemoRole 적용. permissions-admin 검사 132/132(원본 120/12), 나머지 전후 동일, 서버 142/142.
- 보고된 getNavRole() 직접 호출 목록(관리자 판정 후보, 미수정): mypage/screens.js:1443,1469 / resume-deep-intent.js:85 / provider-reviews/(sheet.js:36, inbox.js:251, store.js:224,510,531,545,674) / submission-board/submission-screens.js:273,360,396,411, library/library-screens.js:57 / right-rail.js:65 / paid-checkout.js:17, plans/index.js:88,131 / mypage/index.js:66,71. 관리자 동작이 문제되는지는 관리자 모드 작업(157-x/158/159/162)에서 일괄 점검.
- 무결성 남은 순서: 5d(요청문 visibility 값 제거) → 기존 실패 검사 3건 원인 확인 → 「배포」 대기(누적: 3·5·5b·5c·6·6b·6c·6d).

## 2026-10-02 갱신 — 무결성-5d ACCEPT (로컬, 미커밋·미배포)
- 요청문 「공개 범위」 두 값(request_summary_visibility / special_request_visibility): 화면 4곳+시드, 서버 응답·SELECT·PATCH 허용 목록에서 제거. DB 컬럼(ENUM private|paid_only NOT NULL DEFAULT 'private')과 가입 INSERT 'private'(BasicRegisterService.php:316), e2e/helpers/signup-flow.js:66은 의도적으로 유지. 새 검사 verify-student-request-text-exposure.php 82/82(원본 46/82). 원문 노출 규칙(유료 공급자·관리자·본인) 불변 확인. 나머지 검사 전후 동일.
- 후속(종현 SQL 단계, 코드 정리 배포 후): ① 운영 DB DEFAULT 확인(SHOW CREATE TABLE students) → INSERT 316줄·e2e 66줄 제거 배포 → students 백업 → ALTER TABLE students DROP COLUMN 두 개 → 새 마이그레이션 + rest-schema.sql(130,132, 1554 시드 UPDATE) 정리. 이용권 정리(provider_request_unlocks DROP, ticket_type ENUM('memo'))와 함께 묶어 SQL 작성.
- 미사용 잔재(보고만): renderProtectedBlock opts.isPaidProvider 미사용.
- 무결성 남은 순서: 기존 실패 검사 3건 원인 확인(checkout_ignores_client_amount / positions 주문요약·적용대상 / tutor 가이드: 점유·예약대기 금지 카피) → 「배포」 대기(누적: 3·5·5b·5c·5d·6·6b·6c·6d).

## 2026-10-02 갱신 — 무결성-11 조사 결과 (기존 실패 검사 3건 = 모두 「검사가 낡음」, 코드 결함 아님)
- 1) verify-paid-pr-a.mjs:446-452 checkout_ignores_client_amount: createOrder 인자를 6개로 고정. 실제는 8개($badgeCodes,$regionInput 추가, df02c51/a5d324f). 금액 경로: checkout.php는 금액 키를 읽지 않고 createOrder 시그니처에 금액 파라미터 없음, 금액은 PaidCatalog::quote 서버 산출 → 결함 아님(직접 확인).
- 2) verify-paid-renewal.mjs:41-43: renderApplyTargetBlock 호출 문자열 완전일치. 4번째 opts 인자 추가(7b17262)로 깨짐. 기능 정상.
- 3) verify-paid-renewal.mjs:78-83: 과외쌤 부정문 카피 존재를 요구. 정책(docs/internal/65:26,27)은 금지어 자체를 쓰지 않는 것 → 검사가 정책과 반대. 가드(roomPrimeOnly)는 PASS.
- 조치: 무결성-11b 티켓(검사 스크립트 2개만 수정)으로 진행.

## 2026-10-02 갱신 — 무결성-11b ACCEPT (로컬, 미커밋·미배포)
- 낡은 검사 3건 갱신(scripts/verify-paid-pr-a.mjs, verify-paid-renewal.mjs만). pr-a 85/0(PHP 포함 96/0), renewal 38/0. 변이 입력 15/15 기대대로 FAIL 확인. 서비스 코드 무변경.
- 무결성 시리즈 코드 작업 종료. 다음: 「배포」 대기. 누적 배포 대상: 3·5·5b·5c·5d·6·6b·6c·6d·11b.

## 2026-10-02 갱신 — 배포 3d5db57 (53파일, push 성공 18fd3a8..3d5db57)
- 무결성-3·5·5b·5c·5d·6·6b·6c·6d·11b 코드 배포. Actions 결과(Deploy to dothome)는 종현이 브라우저로 확인 필요(Cursor의 gh 미로그인).
- 누락 2건(규칙상 제외됐으나 이번 변경과 맞물림): scripts/verify-paid-pr-b-integration.php(unlockPaidRequest 호출 제거), package.json(e2e:p18-c·e2e:p18-pr-a에서 삭제된 spec 제거) → 후속 배포 1건으로 올림.
- 문서 제외분(docs/, DOC-CHECKLIST.md, SSOT-ALIGNMENT.md)은 아직 미커밋.
- 종현 라이브 점검 대기: 학생 가입→노출/빈칸 수정→내려감, 고민방 글 저장 유지, 관리자→학생 쪽지 차단/→공급자 허용, 관리자 답장.

## 2026-10-02 갱신 — 후속 배포 359f772 (2파일, push 성공 3d5db57..359f772)
- package.json, verify-paid-pr-b-integration.php 반영 → 깨진 참조 해소(grep 0건). 최종 Actions 확인 기준 커밋 = 359f772(종현이 브라우저로 확인, gh 미인증).
- 무결성 시리즈 배포 완료. 종현 라이브 점검은 본인 메모로 진행, 「서버 연결 완료」는 확인 전 기록 안 함.
- 다음(밤): 순서대로 사이트 오류(게스트 위치·샘플카드 → 레일 0건 → 정보 게시판 2개 → 공지 더보기 팝업·글자 크기) 진행. 문서 제외분 미커밋.

## 2026-10-02 14:50 사이트오류-1 수락(로컬, 미커밋·미배포)
- 수정 9파일 + scripts/verify-guest-baseline-map-cards.mjs(신규, 45/72→72/72). 기존 검사 8종 수치 동일. 직접 재실행 72/72 확인.
- 내용: RegionGuLink::guestBaseDongId()(이름 서울·강남구·대치동 또는 코드 11680101/1168010600, 대치1동 대체 없음), search.php 비로그인 지역 서버 강제(guestScopedFilters), 찾기 지도 게스트 중심 대치역·fitBounds 끔·줌17, 홈 비로그인 핀=대치동 목록 전체, 샘플은 피드 응답 뒤(guest&&live)만, 찾기 로딩/오류 문구.
- 대치역 좌표 교차: 위키백과 약 9m 차, 위키데이터·카카오는 접근 불가로 미대조(보고 그대로).
- 홈 프라임·픽 빈자리 샘플은 유료 노출 빈 슬롯 안내라 베이직 샘플 정책과 별개로 판단, 변경 없음(종현 이견 시에만 재논의).
- 종현 확인 필요: 운영 DB `SELECT id,sido_name,sigungu_name,dong_name,dong_code FROM regions WHERE dong_name='대치동'` 결과가 1행인지.
- 다음: 사이트오류-2 레일 지시문(발행됨, Cursor 대기).

## 2026-10-02 15:05 사이트오류-2 레일 (로컬 수락, 미커밋·미배포) + 2b 보완 발행
- 수정: right-rail.js(방 배너 블럭 renderRoomBlock/HOT 분리, 0건·받는중·실패 구분), concern/store.js(실패 상태), concern/copy.js CONCERN_RAIL_COPY(문구 한 곳), board-channel-acl.js canShowBoardInRail(학생 레일에서 공부방·과외쌤 방 제외), home-right-rail.css. 새 검사 verify-rail-concern-banners.mjs 84/150→234/0(직접 재실행 확인). 기존 8종 동일.
- 남은 어긋남(2b로 발행): 서버 ConcernService listHot(544-549)/listBest(617-622)/listLatest(698-704)가 학생에게 공부방·과외쌤 방 제목을 내려보냄 → 서버에서 학생에게 제외 + 이달의 베스트 띠도 학생에게는 두 방 글 제외.
- 사이트오류-3(정보 게시판 2개): 분류 4개·유료 공급자(=픽·프라임 보유, StudentRequestTextAccess::isPaidProvider 재사용, 한 곳에서 변경 가능) 종현 수락. 게시판 본체 먼저, 레일 연결은 2b 수락 뒤.

## 2026-10-02 15:20 사이트오류-3 정보 게시판 2개 지시문 작성(전달 대기, 2b 수락 뒤 Cursor에 전달)
- boardKey: info-room(공부방 쏙쏙정보), info-tutor(과외쌤 따끈 팁가이드). board_posts.board_key는 VARCHAR(50)이라 SQL 불필요, category_id에 분류키. 라우트 #/library/room-info, #/library/tutor-tips.
- 권한: 읽기=공부방·과외쌤·관리자(전체), 게스트=제목까지, 학생·member=차단. 쓰기=관리자 + 유료 공급자(공부방·과외쌤 누구든 두 게시판 모두, 해석 선택 — 종현 확인 요청). 수정=작성자(현재 유료)·관리자, 삭제=작성자 본인(항상)·관리자.
- 댓글·반응·첨부 없음(미정 기능, 이번 범위 아님). 유료 판정은 src/Paid 에 한 곳(PaidProviderGate)으로 모으고 StudentRequestTextAccess가 위임.
- 레일 연결(RAIL_PROVIDER_INFO href)은 3b로 분리(2·2b 수락 뒤).

## 2026-10-02 15:30 사이트오류-2b ACCEPT (로컬, 미커밋·미배포)
- ConcernService: DEMAND_HIDDEN_FEED_KEYS + isHiddenFromFeed, listHot/listBest/listLatest 반복문에서 학생은 공부방·과외쌤 방 제외(limit는 제외 뒤). right-rail.js 베스트 띠도 canShowBoardInRail로 학생에게서 두 방 제외. 직접 재실행: 새 PHP 37/37, rail 249/0, request-text 82/82.
- 남은 사실(보고만): 학생이 두 방 상세 주소로 직접 들어가면 제목 항목은 내려감(본문·작성자·댓글은 차단). 역할 미정(OAuth 직후 guardian_student)은 학생(demand)으로 판정돼 두 방 제목도 못 받음. 제목까지 막으려면 접근 규칙 변경 필요 → 종현 결정 대기.
- 다음: 사이트오류-3 지시문 전달(2b 수락 완료 → 이제 Cursor에 넘길 수 있음).

## 2026-10-02 15:55 사이트오류-3 ACCEPT (로컬, 미커밋·미배포, 서버 연결 완료 아님)
- 직접 재실행: 새 PHP 69/0, 새 클라이언트 45/0, board-channel-acl 66/0(info 7 추가), rail 249/0, request-text 82/82, concern-feed 37/37. diff 확인: InfoBoardService(저장·권한·세션 기준 author), PaidProviderGate 위임, ACL PHP/JS 미러.
- 삭제는 status='deleted'(075 SQL의 ENUM 확장 필요 — 종현 075 적용분 확인 필요). 미인증=게스트 처리(정책 4 우선).
- 남은 것: 실사용 입구 #/support/library(support/screens.js)에 두 게시판 진입 링크 없음 → 사이트오류-3c 지시문 발행. 이후 3b(레일 배너 연결, 학생에게는 블록 자체 없음).
- 라이브 확인 대기: 유료 공급자 글쓰기→새로고침 유지, 무료 공급자 안내, 학생 403, 게스트 제목만.

## 2026-10-02 16:05 사이트오류-3c ACCEPT (로컬, 미커밋·미배포)
- #/support/library 탭 아래 정보 게시판 진입 링크(공급자·관리자·게스트만, 학생·member는 DOM 없음, 역할 확정 전 미표시). 직접 재실행: 클라이언트 58/0, rail 249/0. 라이브 화면 확인은 종현.
- 알려진 사소한 점: 게스트 진입 시 me.php 1회 추가 호출(main.js/auth-session.js에서 세션 완료 이벤트를 내보내면 제거 가능, 필수 아님).
- 다음: 3b(레일 정보글 배너 연결 — RAIL_PROVIDER_INFO href, 학생에게는 블록 자체 없음). 3b 전에 이슈 요약 먼저.

## 2026-10-02 16:10 사이트오류-3b 확정(종현 승인) — 정보 게시판 레일 배너 + 읽기 팝업
- 레일 정보 배너 2개(공부방 쏙쏙정보·과외쌤 따끈 팁가이드): 방마다 최신 글 제목 3개(최신순), 기존 RAIL_PROVIDER_INFO 자리. 보이는 역할=공급자·관리자·게스트(제목만), 학생·member는 블록 자체 없음.
- 글 제목 클릭 = 페이지 이동 없이 팝업(위: 선택 글 본문, 아래: 그 게시판 글 목록 페이지 번호). 홈 이탈 방지. 공용 팝업 틀을 먼저 만들어 정보 게시판 2개에 연결 → 이후 고민방 3개·공지(사이트오류-4)로 같은 틀 확대(종현 동의, 순서 확정).
- 현재 레일 개수: 방 배너 최신 3, HOT 화면 3(학생 1), 베스트 방별 3(반응합 5 이상).

## [2026-10-02 t1149] 사이트오류-3b ACCEPTED (로컬, 미커밋·미배포)
- 레일 정보 게시판 배너 2개 + 공용 읽기 팝업(rail-popup.js, info-rail.js). 새 검사 214/0, 기존 10종 기준 수치 동일(직접 재실행 확인).
- 다음: 사이트오류-4 = 공지|동네인사 2단(박스 테두리, 0건도 칸·제목 유지+감성 문구) + 공지 「더보기」 팝업 + 더보기 글자 축소 + 고민방 3개 레일 팝업 전환. 이후 공부방 박스 풍성화 조사(과외박스 기준).
- [t1154] 사이트오류-4 정책 근거 문서: 191-home-news-row-best-rail-policy-2026-10-02.md (종현: 확정 건은 항상 내부문서에 근거와 함께 남길 것)
- [t1156] 사이트오류-5(프리미엄(164)/오픈(프리미엄) 문구): 종현이 직접 사이트·스샷 확인 후 재개. 패스.
- [t1156] 다음 이슈: 고객센터 홈 본문 이미지박스 순서를 좌측메뉴 순서와 일치시킴 + 자료실(게시판들) 현황 검토 후 새 정책 잠금.

## 2026-10-02 17:55 갱신 — 사이트오류-4 수락(로컬, 미배포)
- 사이트오류-4: ACCEPT. 신규 verify-home-news-row 194/0, 기존 11종 재실행 통과(rail-info 214, rail-concern 249, info-client 58, info-acl 69, concern-feed 37, request-text 82, guest-baseline 72, role-home-guard 56, student-count 28, card-visual, board-channel-acl). 기대값 조정 2건(베스트 레일 이동·고민방 더보기 추가)은 정책 변경에 따른 것으로 타당.
- 홈 동네 인사는 서버(GET /api/neighborhood-greetings.php)에서 읽음. 브라우저 저장소 읽기 코드 제거 확인(readGreetings 호출처 없음).
- 별도 버그 발견(오류-4와 무관, 기존): 홍보1 지역이 없는 공부방 계정 홈 무한 재그리기. study-room-home-seed.js bootStudyRoomStudentDemand(87~111행), await 없는 경로에서 rerender() 동기 호출 → studentBoot 대입 전 재진입. → 사이트오류-4b로 보완 티켓 예정(종현 승인 대기).
- 4b 후보 범위: (1) 위 무한 재그리기 수정, (2) guest-sections.js renderGuestTempNotice 삭제, (3) main.js pullNeighborhoodGreetings의 브라우저 저장소 쓰기 제거(홈 읽는 곳 없음). hydrateNoticeHome은 마이페이지 공지 카드가 써서 유지.

## 2026-10-02 17:51 종현 확정(t1161): 사이트오류-4b를 6A보다 먼저 진행. 지시문 발행.
순서: 4b → 6A → 6B → 5(보류) → 배포.

## 2026-10-02 18:50 사이트오류-4b ACCEPT (로컬, 미배포)
- 무한 재그리기 수정(study-room-home-seed.js 87-117, Promise 선대입·rerender는 then 안 1회), renderGuestTempNotice 삭제 완료. 새 검사 226/0(4b 32항목), 기존 11종 숫자 유지. 수정 전 파일로 되돌려 돌리면 4건 실패(검사가 실제로 잡음).
- Must 3(pullNeighborhoodGreetings 저장소 쓰기 제거)은 못 함 — 내 사전 전제(읽는 곳 0)가 틀렸음. study114-neighborhood-greetings-v1 키를 마이페이지 인사 편집기(greetingForRegistration)와 shared/neighborhood-greeting-store.js, 가입완료 화면이 읽음. 저장(publish/unpublish)은 서버 응답 ok 뒤에만 로컬 반영(서버 선저장), pull은 서버→로컬 동기 캐시. 즉 파사드 아님, 정상 구조. 홈 칸은 이 키를 읽지 않음.
- 판단: 추가 티켓 없음. 편집기가 로컬 캐시 대신 서버 응답을 직접 읽게 하는 정리는 「정리 항목」에 기록(기능 영향 없음, 종현 지시 시 진행).
- 큐: 다음은 사이트오류-6A.

## 2026-10-02 19:30 사이트오류-6A ACCEPT (로컬, 미배포)
- 직접 재실행: support-home-library 49/0(신규), info-boards-client 58/0(기대값 10항목 조정: 샘플 탭→자료실 제목, 링크 글자→aria-label — 타당), rail-info 214, rail-concern 249, home-news-row 226, guest-baseline 72/72, role-home-guard 56, student-count 28, info-acl 69, board-channel-acl 통과.
- 홈 박스는 SUPPORT_NAV 순회로 생성(순서 한 곳). 자료실은 역할별 게시판 입구 카드. LIBRARY_SEED·library-store.js·샘플 탭 삭제.
- 6B에 합칠 잔여(미루지 않음, 6B 티켓 Must로): (1) board-backend.js 자료실 게시판 3개 hydrate 요청·getLibraryPostsCache 정리, (2) support/router.js getSupportLibrarySection 미사용 제거, (3) empty-state-copy.js library 항목·.pdf-card/.pdf-grid CSS 미사용 제거, (4) 역할 확인(me.php) 실패 시 자료실 본문이 빈 채로 남음 → 감성 문구 실패 상태 표시.
- 다음: 6B(학생 꿀팁 가이드) — 이슈 요약 먼저 제시 후 종현 승인 뒤 지시문.

## 2026-10-02 20:10 사이트오류-6B ACCEPT (로컬 커밋 d20a549는 6B 일부만 포함, 미푸시)
- 직접 재실행: student-tips mjs 121/0·php 114/0, support-home-library 49, rail-info 255(학생 꿀팁 배너 기대 추가·공급자 배너 0 유지), info-client 58, rail-concern 249, home-news-row 226, info-acl 69, concern-feed 37, request-text 82, channel-acl php ok.
- DB 변경 없음. 075 SQL(반응 테이블·deleted 상태)은 종현이 이미 2회 적용.
- 연락처 차단 함수는 정보 게시판에 원래 없었음(내 지시문의 「같은 필터」 전제가 틀렸음). 현재 info-student에만 적용. info-room·info-tutor 적용 여부는 종현 결정 대기.
- 배포 주의: 커밋 d20a549(60파일)가 6B 작업 도중 만들어져 6B 일부 파일(board-backend.js, empty-state-copy.js, info-pages.css, zip-visual-v2.css, support/router.js, reactions.php, verify-student-tips-board.mjs/.php)이 빠져 있음. 푸시 전(원격=359f772 확인)이므로 추가 커밋 후 한 번에 푸시.
- 6B 이후 큐: 5(보류), 배포, 이후 목록.

## 2026-10-02 20:15 배포 완료(푸시) — d20a549 + c2c3372 (origin/main). 사이트오류-1,2,2b,3,3b,3c,4,4b,6A,6B 반영. Actions 결과는 종현 확인 대기.
- 남은 큐: 5(보류, 종현 사이트 확인), 연락처 차단을 공급자 정보 게시판 2개에도 걸지 결정 대기, 이후 목록.

## 2026-10-02 20:35 사이트오류-7 ACCEPT (로컬, 미커밋·미푸시, HEAD c2c3372)
- 직접 재실행: student-tips php 165/0, mjs 147/0, info-acl 69, request-text 82, info-client 58, rail-info 255. 기대값 조정 1건(공부방 게시판 전화번호 글 200→422, 정책 변경이라 타당).
- 차단 분기에서 isStudentTipsBoard 조건 제거(InfoBoardService.php:269), 세 게시판 공통. 읽기·삭제는 차단 안 함.
- 오탐 사례(결정 대기): hometax.go.kr, adiga.kr, www.sen.go.kr, 세무서 02-123-4567, 「카카오맵」은 막힘. 공공기관(.go.kr 등) 예외 여부는 종현 결정 대기.

## 2026-10-02 20:36 사이트오류-7b 지시문 발행(공공 도메인 .go.kr/.ac.kr 예외). 이후 배포는 7+7b 수락 뒤 묶어서.

## 2026-10-02 21:10 사이트오류-7b ACCEPT (로컬, 미커밋·미푸시, HEAD c2c3372)
- 직접 재실행: student-tips php 230/0, mjs 204/0, info-acl 69, request-text 82, concern-feed 37, info-client 58, rail-info 255, support-home-library 49, php -l 통과.
- .go.kr/.ac.kr 호스트 단위 예외(위장 도메인·@ 우회·경로 내 다른 도메인 차단). 이메일·메신저·전화 판정 불변. 안내 문구 한 문장 추가(library-copy.js 94행).
- 미배포 수락분: 7, 7b (파일: InfoBoardService.php, library-copy.js, verify-student-tips-board.mjs/.php 4개). 배포는 종현 「배포」 시.

## 2026-10-02 22:15 배포(푸시) 완료 — a7f9db2(7·7b) + 789060b(info-board-screens.js 보충). origin/main=789060b. Actions 결과는 종현 확인 대기.
- 남은 큐: 5(무한 보류, 종현이 문구 위치를 알려 줄 때까지), 이후 목록(공부방 박스 풍성화 조사, 로그인 환영 메시지, 월간 콘테스트, 관리자 모드, 146–180 최종검수 등).

## 추가 (2026-10-03 01:26, 종현 t1196u)
- 마이페이지 「내 공지」: ① 마이페이지 전역(모든 하위 화면)에서 상단에 계속 표시 ② 본문과 구분되게 블록 아래 라인을 지금보다 진하게. 현황 조사 후 이슈 요약 → 승인 → 지시문. (진행 중인 위치 진단 순서는 유지)
- (2026-10-03 01:28, t1197u) 마이페이지 전역 입력칸: 값이 채워진 칸=회색 바탕, 빈 칸=흰색, 포커스(수정 중)=흰색으로 반전해 수정 중임을 표시. 「내 공지」 상단 고정·구분선(t1196u)과 함께 마이페이지 공통 디자인 묶음으로 현황 조사 후 이슈 요약.
- (2026-10-03 01:37, t1198u) 마이페이지 계정 카드 「대표 지역」 조사 완료(docs/193 참조): 표시 문제(regionLabel 미연결, preview-data.js:26-30)+규칙 문제(공부방 카드 노출·자동 복제 2곳, 과외쌤 대표 삭제 우회 3곳). 지시문은 9·10 이후, 한 묶음/분리는 종현 결정 대기.
- (2026-10-03 02:05, t1209u) 입력칸 규칙 확장: 이미 데이터가 채워진 입력칸은 전부 회색(저장된 값, 손대면 수정), 빈 칸은 흰색, 수정 중(포커스)은 흰색. 마이페이지뿐 아니라 찾기 필터 칸(현재위치 미리 채움)에도 같은 규칙 적용 방향. 조사 시 찾기 화면 포함. 순서는 사이트오류-9 이후.
- (2026-10-03 02:07, t1210u) 입력칸 회색/흰색 규칙은 모든 입력폼(마이페이지 기본·상세정보, 공부방·과외쌤 상세등록폼, 찾기 필터)에 적용 대상이나 후순위. 일이 커지면 폼 단위로 차츰 적용. 지금은 오류 수정(사이트오류-9, 10 등)이 먼저.

## 2026-10-03 03:41 남은 작업 순서 갱신(t1241u)
1. 사이트오류-11 (학생 홈·찾기 분기 2탭 + 분기 변경 초기화/새로고침 안내) — 지시문 발행, Cursor 결과 대기 → 내가 diff·검사 재확인 후 수락
2. B: 과외쌤 홈 「우리동네 학생」 탭 0건 고정 오류 수정
3. C: 공부방 홍보2·3 의미(베이직 노출·통계·프라임/픽 지역별 구매) 논리 점검(읽기 전용, 난제는 오퍼스 검사용으로 정리)
4. 「내 공지」 마이페이지 상단 고정 — 조사 결과 대기 → 이슈 요약 후 승인
5. 마이페이지 대표 지역 표시+규칙(표시/규칙 분리, 과외지역 vs 활동지역 용어)
6. 공부방 박스 풍성화(우측 질문 미정, 지시문 제외)
7. 입력칸 회색/흰색 규칙(전 폼, 낮은 우선순위)
- 사이트오류-5 무기한 보류. 이후: 로그인 환영문구, 월간 콘테스트, 관리자 모드, 146~180 최종 검수·정리, 「남겨」 시 노션 일괄 반영, 문서 정리(종현 시간 날 때).
- 종현 몫: Actions 확인(d20a549, c2c3372, a7f9db2, 789060b), 배포 후 라이브 확인, SQL(075 등)·마이그레이션 072 적용 확인, 로컬 DB 학생 두 지역값 보유 행 확인.
- 배포: 8, 8b, 9, 10, 11(+B) 묶음 후 종현 「배포」 시.

## 2026-10-03 03:50 t1242u 순서 변경·배포 요청 처리
- 순서 변경: 3(C 홍보2·3 점검)은 7(입력칸 색) 뒤로, 4(내 공지)는 2(B) 뒤로. 새 순서: 11 → B → 내 공지 → 마이페이지 대표지역 → 공부방 박스 풍성화 → 입력칸 색 → C.
- 배포 요청: 로컬 상태 확인(HEAD=origin/main=789060b). 미배포 8/8b/9/10 파일과 사이트오류-11 진행분(verify-student-branch-two-tabs.mjs 신규 존재, route-access/site-nav-config/parent.js 등 변경)이 같은 작업트리에 섞여 있음 → 11 완료·수락 전 배포하면 미수락 11 일부가 같이 나감. 종현 판단 대기.
- 마이그레이션 072 = sql/schema/072_region_unit_level.sql (regions에 unit_level·official_code·is_selectable 컬럼 추가). 073 official_seed가 다음. 종현이 둘 다 적용했다고 함.

## 2026-10-03 04:06 배포: 사이트오류-8/8b/9/10/11 묶음 → ee12aca (789060b..ee12aca, 31파일, 사전점검 전부 통과). Actions 결과는 종현 확인 대기. 남은 확인: 분기 로딩 실패 시 과외 기본값, 공용 GNB 반대 찾기 메뉴 노출(종현이 Cursor에 분석 요청 예정). 다음: B(과외쌤 홈 학생 탭) → 내 공지 → 대표지역 → 공부방 박스 → 입력칸 색 → C.

## 2026-10-03 04:15 t1250u 오늘 마무리 지점
- 종현이 수면을 위해 오늘은 사이트오류-12(B) 지시문까지만 진행. Cursor 결과는 일어난 뒤 검수.
- 재개 순서: 12(B) 결과 검수 → 13(GNB 분기 세션 전달, 승인됨) → 내 공지 → 마이페이지 대표지역 → 공부방 박스 풍성화 → 입력칸 색 → C(홍보2·3 논리 점검).
- 배포 ee12aca Actions 확인은 종현 몫.

## 2026-10-05 종현(t1338u): 입력칸 회색·흰색 규칙 확대 작업은 저녁에 진행. 그 전까지 시작하지 않음. (23번까지 배포 완료, 라이브 확인은 종현)

## 2026-10-05 입력칸 회색·흰색 규칙 확대 사전 점검 (HEAD 7fb4c87, 읽기 전용)
- 현재: student-basic-fill.css(채움 #f3f4f6, 빈칸·포커스 #fff, background-color만, disabled 제외), JS가 data-fill 속성 부여(student-reg/screens.js:482-525), [data-p19-basic] 폼 하나에만. 정책 문장은 docs에 없음(코드 주석·검사뿐) → 확정 시 문서 신설 필요.
- 다른 폼: 과외쌤·공부방 마이페이지 기본·상세(.p19-input #fff), 등록확인 서랍, 계정 폼, 가입(auth-ui .form-input), 등록 앱(register-form-primitives.css), 글쓰기류(고민방·게시판·쪽지·후기·문의, 테두리만), 찾기 필터·정렬·메뉴 select, 관리자.
- 충돌: 검색·정렬·메뉴 select는 처음부터 값이 있어 늘 회색 → 제외 필요. 읽기전용 주소칸 현재 gray-50/#fff7ee(빈 칸도 회색) → 규칙 적용 시 빈 칸 흰색. JS 값 대입(카카오 주소, 홍보1 자동, 지역 단계, 대학명)은 다시 칠하기 연결 필요. checkbox/radio/file 제외. verify-student-mypage-hope-region :950, :419-421, :408-411 단언 수정 필요. verify-study-room-box-shape :276-278 구간에 hex 금지.
- 우동공과2 제안(종현 확인 대기): 회원 등록·정보 입력 폼(3역할 마이페이지 기본·상세, 등록확인 서랍, 계정, 가입, 등록 앱)에 폼 단위로 켬, 공통 코드·CSS를 shared/로. 제외: 찾기·필터·정렬·메뉴 선택, 관리자, 체크·라디오·파일, 긴 글쓰기 칸(고민방·게시판·쪽지·후기·문의). 읽기전용 주소칸도 같은 규칙.

## [2026-10-05 15:28 KST] 사이트오류-24 배포
- 커밋 79e8c34, Deploy to dothome #380 + 보조 Actions 전부 success. 라이브 확인 대기.
- 다음(대기·새치기 금지): 가칭 25(tutor-ui/study-room-ui register race: me.php 완료 전 role guard). 종현 「진행」 후 지시문.

## [2026-10-05 15:49 KST] 가칭25 진단 (지시문 전, HEAD 79e8c34)

### 무슨 문제
- tutor-ui·study-room-ui가 `initChromeSession()`(me.php)과 `initApi()`를 `Promise.all`로 동시 시작.
- `initApi`는 masters만 기다린 뒤 `getChromeNavRole()`로 가드 → me가 늦으면 role=guest → `gate.mode !== 'form'` → `loadTutor`/`loadRoom` 미호출 → Promise.all 후 render는 form인데 **빈 폼**.
- Promise.all은 44381c1(2026-07-16), 가드는 19c77e9(2026-07-17). 79e8c34는 main.js 미변경.
- 24번과 원인 무관(검사가 우연히 드러냄). 원래 verify-input-fill-rule은 지연 fixture 없어 간헐 실패.

### 어디서 충돌
- `preview/tutor-ui/src/main.js` ~143–144, `preview/study-room-ui/src/main.js` ~149–150
- `preview/shared/chrome-session.js` currentUser 초기 null, 재시도 없음
- 영향: 등록 앱 + 마이페이지「수정」링크(이 앱으로 진입). home-ui 임베드 패널·auth-ui·학생 가입은 해당 패턴 없음.
- 코드상 부작용 추정: 과외쌤은 tutor_id 없이 기본저장 시 새 draft INSERT 가능(스키마 UNIQUE 미확인). 공부방은 findLatestRoomId로 중복은 안 나지만 빈 값 덮어쓰기 가능.

### 재현
- me 지연 0ms: 정상. 30ms+ : 활동명·대학명·공부방명 빈칸(probe). 라이브 실측 빈도·저장 부작용은 미확인.

### 해결 선택지 (종현 확인 대기, 지시문 미작성)
1. 각 앱 main.js: masters 병렬 유지, 가드·load만 me 완료 후 — 영향 최소
2. chrome-session에 세션 준비 Promise — 공용이지만 auth-ui도 쓰는 파일
3. 클라이언트 역할 가드 제거, 서버 401/소유권에 맡김 — 게스트도 1회 요청
- 보완(어느 안이든): 과외쌤 saveStep null tutorId 시 기존 draft 재사용; 지연 me fixture 검사 고정

## [2026-10-05] 사이트오류-25 지시문 발행 (종현 t1352u)
- 방향: main.js 순서 수정 + 과외쌤 draft 재사용 + me 지연 검사.

## [2026-10-05 16:56] 사이트오류-25 ACCEPT-with-notes (로컬 미배포)

## [2026-10-05 17:04] 사이트오류-25 배포 지시 전달

## [2026-10-05 17:20] 사이트오류-25 배포 efeb5fd + Actions success

## [2026-10-05 17:31] C 홍보2·3 자체 점검 완료 · Cursor 교차점검 대기

## [2026-10-05] C 교차점검 대조 완료 · 수정 우선순위 대기

## [2026-10-05] 사이트오류-26 지시문 발행 (종현: 1번부터)

## [2026-10-05] 사이트오류-26 ACCEPT-with-notes (배포 대기)

## [2026-10-05 17:54] 사이트오류-26 배포 지시 전달

## [2026-10-05 18:00] 사이트오류-26 배포 완료 a832a01 #382

## [2026-10-05] 사이트오류-27 지시문 발행 (오류2 사업장 폴백)

## [2026-10-05] 사이트오류-27 ACCEPT (로컬 미배포)

## [2026-10-05 18:24] 사이트오류-27 배포 지시 전달

## [2026-10-05] 사이트오류-27 배포 완료 68cce94

## [2026-10-05] 사이트오류-28 지시문 발행


## [2026-10-06 00:39] 사이트오류-31 배포 완료 · C(홍보2·3) 시리즈 종료
- 45a14e1 · Deploy #387 success. 오류1~5+재고 폴백 완료.
- 보류(손대지 않음): 26번 잔여 region_label/구 티어, 현재위치·지도·주소필터(종현 전반점검).
- 다음 후보: 178-1 찾기·등록 인페이지 레일. 사이트오류-5 무기한 보류. 이후 목록(로그인 환영·월간 콘테스트·관리자·146~180 최종검수 등).

- 2026-10-06: 178-1 슬롯 잠금(docs/198). 찾기·등록 남은 C→인페이지. 티켓 사이트오류-32.

- [2026-10-06] 사이트오류-32 ACCEPT — 178-1 찾기·등록 레일 인페이지(C→A). 로컬만(HEAD 45a14e1), 미커밋·미배포. concern 255/0 · info 268/0. 배포 「배포」 대기. 보류 유지: 26번 잔여·지도/현재위치/주소필터·사이트오류-5.

- [2026-10-06] 사이트오류-32 배포 완료: 5ad14ee → origin/main, Deploy to dothome #37343598768 success. 라이브 실클릭은 종현.

- [2026-10-06] 종현: 075 SQL 재적용 완료.

- [2026-10-06] 종현(t1423): 178-9·178-10은 이슈 아님(작업 원칙). 대기 이슈 목록에서 제외.

- [2026-10-06] 종현(t1424): 「현재위치·지도·주소필터」는 종현이 직접 정리 중 → 우동공과2 대기 이슈에서 제외. 보류 설명 요청=26번 잔여·사이트오류-5만.

- [2026-10-06] 종현(t1425): 26번 잔여+현재위치·지도·주소필터는 묶어서 진행(종현 정리 후). 사이트오류-5는 오프라인 검수 때. 

## [2026-10-06 t1426] 큐 재정렬 (종현)

### 이번 라운드 순서
1. **로그인·가입 환영 문구 · 자체 호스팅 폰트** — 사이트오류-33 **배포 완료** (docs/199). `8844df1`(#389) + 배선 `80ee85c`(Actions 37357573448). 라이브 확인=종현.
2. **관리자 모드 1차 정비** (157-x, 158, 159, 162) — 158 ACCEPT 로컬 미배포. **다음=159** 오늘 할 일 4카드. 「학부모」→「학생」(관리자) 같이. ← **지금 활성**
3. **146~180 최종검수 · 옛 코드·문서 정리** — 관리자 1차 정비 **후**.
4. **「남겨」 시 노션 일괄** — 보류(종현 「남겨」 때만).

### 보류(이번 라운드 밖 · 라운드 종료 후 다시 정비)
- 월간 콘테스트 설계
- 26번 잔여 + 현재위치·지도·주소필터 (묶음, 종현 정리 후)
  - 편입(2026-10-06): 공부방 학생찾기 지역 2단계(시·군·구 / 동·단지) 결정 — docs/201. 187:21 「같은 동만」 잠금 해제, 050 기본 목록 → 홍보1 시·군·구 방향. 미결: 홈 「우리동네 학생」 탭·과외 쪽·26번 티어.
- 사이트오류-5 (오프라인 검수 때)

- [2026-10-06] 종현(t1427): 「남겨」/노션 일괄도 보류. 1번(환영 문구·폰트)부터 — 우동공과2 추천 후 진행.

- [2026-10-06] 사이트오류-33 지시 발행: 환영 카피(해요체)+Pretendard 자체 호스팅. docs/199.

- [2026-10-06] 종현(t1430): 가입 확인 메일은 현행 유지(범위 밖). 33은 화면 카피·폰트만.
- [2026-10-06] 사이트오류-33 **ACCEPT 로컬 미배포** (HEAD base 5ad14ee, PC 미커밋). 카피·Pretendard 자체 호스팅·SSOT A-5. docs/199 ACCEPT. 배포 「배포」 대기.
- [2026-10-06] 다음 활성(배포 후): 관리자 모드 1차 정비(157-x·158·159·162) + 「학부모」→「학생」 남은 화면 같이 → 이후 146~180 최종검수. 보류 유지: 월간 콘테스트·26번 잔여+지도/현재위치/주소필터 묶음·사이트오류-5·「남겨」/노션 일괄.


- [2026-10-06] 사이트오류-33 **배포 완료**: `8844df1` fonts+카피모듈 Deploy #389; 배선 후속 `80ee85c` Actions run 37357573448 success. 라이브 확인=종현. docs/199.
- [2026-10-06] **지금 활성**: 관리자 모드 1차 정비(157-x·158·159·162) + 「학부모」→「학생」 남은 화면 같이 → 이후 146~180 최종검수. 보류 유지: 월간 콘테스트·26번 잔여+지도/현재위치/주소필터 묶음·사이트오류-5·「남겨」/노션 일괄.

- [2026-10-06 04:09] **관리자 1차 감사 완료**(읽기 전용, HEAD `80ee85c`) → docs/200. High: 158 미리보기 표시(17화면 TODO)·159 홈 4카드 TODO / Med: 관리자 「학부모」 카피·159 등록목록 / Low: 157 메뉴 순서·학부모 시드 / DONE: 159 운영로그 경로·162 정산 0건·상품센터/가입받기 0건.
- [2026-10-06] **다음 구현 = 관리자-158**(미리보기 접두 + 상단 연습용 안내 + 허브 카드). 사이드바 접힘(이미 동작)·159 허브 재설계·162·가이드/FAQ 학부모 제외. 이후 159 → 관리자 학부모 카피 → 159 등록목록. 지시문 발행 대기(종현 전달).

- [2026-10-06] **관리자-158 ACCEPT** (로컬 미배포, HEAD `80ee85c` 위 미커밋). 17화면 「미리보기 · 」+연습용 안내·허브 카드. verify 198/0. docs/200 §10 · docs/158 §5. 배포 「배포」 대기.
- [2026-10-06] **다음 = 관리자-159** (`#/admin` 오늘 할 일 4카드 + 미리보기 안내). 이후: 관리자 「학부모」→「학생」 카피 → 159 등록목록 → Low(157 순서·시드)·162 후순위.


## 2026-10-06 갱신 — 관리자-158 배포 보류
- 커밋 `1d48c2c` origin/main 푸시 완료(allowlist 7파일: a28-copy/screens-shared/screens/screens-labs/shell, home-admin.css, verify-admin-preview-labels.mjs).
- Deploy to dothome #391 (run 37364093708): verify 3잡 성공, ftp-deploy만 GitHub hosted runner 할당 장애로 미실행. 종현 보류 → 장애 해소 후 Re-run failed jobs.
- 운영 반영: 아직 #390(`80ee85c`). 코드 amend 없음.
- 다음 코딩 후보: 159(오늘 할 일 4카드). 158 라이브 확인은 재배포 성공 후.


## 2026-10-06 갱신 — 관리자-162 예정 잡기
- 종현(t1450): 코딩이 후순위여도 **예정 작업에 잡아야** 함.
- 정본: `docs/162-daily-settlement-report-draft.md` (2026-09-25 골격 수락).
- 범위: 일·주·월 정산 요약 화면 + 관리자 자동 메일(마감 후 익일 0:00~0:30, 결제·등록·탈퇴·삭제 등 숫자 요약).
- 순서: 관리자 1차(158 배포 재시도 → 159 → 학부모→학생) **뒤**, 146~180 최종검수와 병행 가능하나 **162는 큐에 고정**. 코딩·배포 전 「후순위」상태 유지하되 **누락 금지**.


## 2026-10-06 갱신 — 공부방 학생찾기 지역 2단계 결정 (문서만)
- 종현(t1466 20:25, t1467): 공부방이 공부방 희망 학생을 찾을 때 지역 = 상위 시·군·구(아래 동·읍·면·리·단지 포함) / 하위 원래 등록 단위(동·단지) 중 선택. 예전 「같은 동만(AND)」 잠금 해제.
- 기본 목록: 홍보1 동 → 홍보1이 속한 시·군·구 방향(t1454·t1455: 베이직카드가 적으니 시·군 단위로, 수요 늘면 동·단지로 좁힘).
- 문서: docs/201 신규 · docs/187 21행 대체 메모 · docs/050 §0-2 대체 메모. 코드·지시문 없음.
- 발견: A 세종 코드 불일치(확정) · B AddressRegionMatch 이름 폴백(확정) · C 개편지역 코드 · D 동명 리 병합(미확인). 운영 DB 확인 2건.
- 큐: 보류 묶음 「26번 잔여 + 현재위치·지도·주소필터」에 편입. 현재 순서(158 재배포 → 159 → 학부모→학생 → 162 → 146~180) 변경 없음.

## 2026-10-07 갱신 — 관리자-158 배포 완료
- 종현 Re-run failed jobs(01:41 KST) → Deploy #391 attempt 4 success(01:42 KST). 운영 = `1d48c2c`. 라이브 확인=종현.
- 다음: 159. 우동공과2 제안(t1473, 종현 미확정): 관리자 작업을 2개로 — 작업1 159(오늘 할 일 4카드+등록목록, 학생 문구 같이), 작업2 162(보고서 화면+자정 후 메일, 숫자→159 목록/작업기록 연결).

- [2026-10-07] 관리자-162 **정본 브리핑 기록** (종현 t1475, 02:22 KST): docs/162 상단 「2026-10-07 정본 브리핑 (종현 확인 t1475)」 — 목적·자정 마감/익일 0:00~0:30 메일·본문 5줄 세는 법·예시·자세히 보기·주간/월간·제외·159 연결. 구현 0건(docs/200 §5). 코딩 후순위·큐 고정 유지. 159 먼저/162 재사용 구성은 t1473 제안(미확정).

## 2026-10-07 갱신 — 관리자 2작업 확정·절차 잠금 (종현 t1478)
- 종현: 「효율성과 동선을 감안한 너의 제안을 수용」. 사이트 영향 없이 **관리자 페이지 안에서만**.
- 159 인페이지 방식 확정: 신고·문의, 홈 팝업 = 수정용 팝업 / 회원 정리, 홈·찾기 노출 = 카드 아래 펼치기 / 162 자세히 보기 = 읽기 전용 팝업. 공통 선행: 화면 그리기·버튼 연결을 주소가 아닌 삽입 위치 기준으로 분리, 저장 후 해당 칸만 재그리기.
- 작업 분리: 작업1 = 관리자-159(오늘 할 일 4카드+인페이지/팝업 구조+등록 목록+관리자 「학생」 문구) / 작업2 = 관리자-162(보고서+자정 후 메일).
- **절차 잠금:** 점검지시문 → 커서 작업 후 보고 → 검수 → 보완 작업지시서 → 수행결과 보고 → 검수 후 보완 재작업지시 → 검수완료 → 종현 보고 → 종현 승인 후 배포지시서 → 배포 → 배포 후 검수.
- 실행 주체 확인 중: 「클라이언트에이전트」 = Cursor 클라우드 에이전트인지 종현 확인 대기.

## 2026-10-07 02:37 갱신 — 클라우드 에이전트 작업 범위 한정 규칙 (종현 t1482·t1483)
- 근거: 「겉만 보고 진행하고, 코드를 엉키게 하거나, 작업을 더 복잡하게 벌리면서 일을 키울수 있어. 그래서 작업의 범위를 분명하게 한정해 줘야 해.」 / 「정한 절차대로 바로 진행해. 나중에 너의 보고를 보면 내가 확인할게.」
- 모든 작업지시서: ① 허용 파일 목록(관리자 쪽만, 그 밖 수정=불합격) ② 금지(구조 재설계·무관 코드 정리·기능 추가·사이트 공용 파일 변경) ③ 숫자형 합격 기준(예: 4카드 화면이동 없이 열림, 저장 후 새로고침 시 DB 유지).
- 검수: origin/main(라이브 1d48c2c) 기준 변경 줄 전부 직접 대조, 점검 단계 PR·브랜치 생성 여부 확인(생기면 오류 보고·머지 금지), 사이트 영향 0 파일 목록 증명.
- 보완 지시서는 종현 사전 확인 없이 절차대로 진행 → 검수완료 후 종현 보고 → 승인 후 배포지시서.
- 현재: 159 점검지시문 발송(클라우드 에이전트 bc-50415b73-4ea5-5f75-8fe5-e1b5fbdae771, 읽기 전용), 보고 대기.

## 2026-10-07 02:50 갱신 — 관리자-159 점검 보고 검수 완료·보완 작업지시서 작성 (절차 3→4단계)
- 검수 결과·지시서: [202](202-admin-159-work-order-2026-10-07.md). 점검 단계 PR·브랜치·커밋 0건(ls-remote 확인). 보고서 사실 오류 0건(줄 ±1만). 누락 위험 10건 추가(저장 후 전체 재그리기 제안 = 「해당 칸만 재그리기」 잠금과 어긋남, 카드별 권한 게이트, 칸 재그리기 시 data-a28-nav 죽은 링크, 노출 해시 쓰기 1513·1543, 공통 바인딩 중복, CSS 누수, 홍보 데스크 「학부모」, 등록일 칼럼 역할별 차이, KST).
- 결정 7건 중 5건 문서 근거로 정리, 진짜 질문 Q1~Q4(기본안 포함, 202 §4). 다음: 159-a·b 지시서 발송 대기(배포 없음), 159-c는 a·b 검수완료+Q3·Q4 확정 후.
- 2026-10-07 02:5x: 159 점검보고 검수 완료(docs/202 §1~4, PR·브랜치 0, 주장 29개 중 오류 0, 누락 위험 10건 지시서 반영). 159-a·b 보완 작업지시서(docs/202 §5, Q1 문의·신고 탭·Q2 홍보 데스크 라벨은 기본안 반영) 클라우드 에이전트에 발송. 159-c는 a·b 검수완료 + Q3(등록 목록 위치)·Q4(숨긴 카드 포함 여부) 확정 후 발송 — 종현 보고 때 함께 질문.

## 2026-10-07 03:20 갱신 — 관리자-159-a·b 수행결과 검수: 재작업 필요 (절차 5→6단계)
- 대상 `cursor/admin-159ab-20261007` `6be10d3`. 범위 8파일 전부 허용 안, 금지 파일 0줄, 옮긴 5블록 원문 일치(호스트 키·navigate만), 기존 주소 동작 같음, 라벨 합격. 직접 실행: today-hub 46/0, preview-labels 198/0(기준 198/0), shop-page 54/0(기준 54/0), build 성공.
- 재작업 R1~R4([202](202-admin-159-work-order-2026-10-07.md) §9): 카드 권한 시험용 뒷문 제거·실세션 검사 / 노출 저장 후 목록 GET 생략(seal) 제거 → 기존 주소와 요청 수 같게 / 비동기 응답 뒤 닫은 칸·서랍 되살아남 막기 / 전체 그리기 때 서랍·링크 중복 바인딩 제거. 실DB 새로고침 확인은 배포후 검수 체크리스트(§10).
- 보고만: 고민방 이름 코드 「학생/학부모 고민방」(board-engine-copy.js:436·440 등) ≠ 잠긴 「학생 학부모 고민방」 → 사이트 공용, 최종검수 큐.
- 2026-10-07 03:2x: 159-a·b 재작업지시(R1 권한 뒷문 제거·R2 노출 재조회·R3 닫힌 칸 되살아남·R4 중복 바인딩) 클라우드 에이전트 발송. 별건 보고 대기: 고민방 이름 코드 「학생/학부모 고민방」 vs 잠긴 「학생 학부모 고민방」(board-engine-copy.js:436·440, board-channel-acl.js:140, concern/copy.js:45) — 사이트 공용, 159 범위 밖, 최종검수 대기 목록.

## 2026-10-07 03:35 갱신 — 관리자-159-a·b 재작업 c51d7d2 검수: 합격·검수완료 (절차 → 종현 보고 대기)
- `6be10d3`→`c51d7d2` 새 커밋 1개(amend·force·PR·main 반영 없음), 허용 3파일만, bind 삭제 5줄만. R1~R4 jsdom 직접 재현 + 6be10d3 음성 대조로 결함 해소 확인(노출 저장 요청 수 허브=기존, 닫은 칸·서랍 되살아남 0, 전체 그리기 중복 바인딩 0). today-hub 49/0 · preview-labels 198/0 · shop-page 54/0 · build OK. 근거 [202](202-admin-159-work-order-2026-10-07.md) §11.
- 다음: 종현 보고(Q1·Q2 기본안 확인, 고민방 이름 어긋남 보고) → 승인 후 배포지시서 → 배포 → §10 배포후 검수. 배포 금지 유지. 159-c는 Q3·Q4 확정 후.
- 2026-10-07 03:39: 종현 t1497 「배포하도록 해」 승인 → 159-a·b 배포지시서 발송(main ff-only 1d48c2c→c51d7d2, 2커밋, 푸시 전 검사 4개, Deploy 결과 보고). 다음 §10 배포후 검수.

## 2026-10-07 03:4x 갱신 — 찾기 3종 주소 단위 통일 방향 (종현 t1495, 문서만)
- 보류 묶음 「26번 잔여 + 현재위치·지도·주소필터」에 편입: 1단계 시·도(단독 검색 차단) / 2단계 시·군·구(필수, 공부방도 허용) / 3단계 동·단지(공부방·학생 열림+분기, 과외쌤 회색). 대조·질문 Q1~Q4: [201](201-studyroom-student-find-region-levels-2026-10-06.md) 「2026-10-07 t1495」 절. 신규 오류(라이브 미확인): 공부방 로그인 학생찾기 첫 검색이 표시된 홍보1 동 없이 전국 검색. 큐 순서 변경 없음.
- 2026-10-07 03:44: 159-a·b 배포 완료 c51d7d2 Deploy #392 success, 라이브 번들 반영 확인. 관리자 로그인 저장 검수는 종현 차례. 다음=159-c(Q3·Q4 기본안 대기).
- 2026-10-07 04:0x: 종현 t1498 질문 2건 조사(코드 무수정, [202](202-admin-159-work-order-2026-10-07.md) §15). ① 관리자 숨김=잠긴 허용 조치 맞음(28 §1·161 추가잠금). 주인 화면: 서버는 세 역할 모두 상태 반환, 화면은 공부방·학생 표시 없음·과외쌤 일부(정책 없음). 알림 발송 0인데 로그 「사용자 알림 Y」 = 잠긴 정책과 어긋난 오류(28 §3-b-2·§9). 추가 오류: 공부방 상세정보2 저장 시 숨김→draft로 풀려 다시 보임(라이브 미확인). ② 서랍=우리 지시서 해석(t1478 「팝업」 모양 미지정), 폭 24rem(home-admin.css:559-570). 추천 = 허브 두 서랍만 가운데 큰 팝업, CSS 1파일(159-d 초안 §15-A). 숨김 유지 서버 수정 초안 §15-B(사이트 파일, 종현 승인 필요). 발송 없음.
- 2026-10-07 04:0x: 159-d(허브 두 서랍→가운데 큰 팝업, home-admin.css만) 작업지시서 §15-A 클라우드 에이전트 발송(t1498 종현 지적 대응). 숨김 오류 2건(로그 user_notified 허위·공부방 상세정보2 저장 시 숨김 풀림)과 마이페이지 표시·알림 기본안은 종현 보고·승인 대기(§15-B 사이트 파일이라 승인 필요).
- 2026-10-07 04:15 종현(t1503): 공개조건 정책 폐지(오래전), 숨김=관리자 전용 조치. 공개조건 코드 잔재 점검 필요.
- 2026-10-07 04:18: 숨김 후속 묶음(풀림 오류·마이페이지 한 줄·알림·운영문의 링크) 확정(t1504·t1505), 159-d 다음 순서.
- [2026-10-07 04:4x] t1508 코드 확인(읽기 전용, `c51d7d2`): 학생찾기 「과외쌤+공부방」=화면만 있는 죽은 선택지(골라도 되돌아감, 검색엔 항상 tutor/study_room; 손 URL만 `both`→0건). 정의 search-enums.js:70 공용 → 공부방 모드만이면 역할 조건 필요. 단지 분기는 서버 조건 신설 필요. ssot/13:182 `both` ↔ DB ENUM 불일치. 질문 2건: [201](201-studyroom-student-find-region-levels-2026-10-06.md) t1508 절. 큐 순서 변경 없음.
- 2026-10-07 04:4x: 159-d 검수 → if(media()) 브라우저 호환 불합격, 재작업지시 발송.
- 2026-10-07 04:43 t1511: both 옵션 전 모드 제거, 단지 검색은 가입 단지추출 알고리즘 재사용으로 확정(201 기록).
- 2026-10-07 04:5x: 159-d 재작업 11b0c0d 검수 통과, 종현 보고·배포 승인 대기.
- 2026-10-07 04:51 t1514: 단지 이름 규칙 1개로 통일, 기존 3규칙 제거(201 기록).
- 2026-10-07 04:54 t1517: 문의 관리 보강 4개를 숨김 후속 묶음에 편입(202 기록).
- 2026-10-07 05:00 t1519: 사업장 bname 폴백도 제거, 단지 통일 범위 확정(201).
- 2026-10-07 05:01: 159-d 배포 지시 발송.
- 2026-10-07 05:04: 159-d 배포 #393 success(11b0c0d), 라이브 확인. 다음: 숨김+문의 묶음 ∥ 162 동시, 159-c는 숨김 묶음 위에.
- 2026-10-07 05:11: 점검-203(숨김+문의) bc-d388febd-d9af-544b-ba27-63123d83ced0, 점검-204(162) bc-e7ff8438-9a61-503e-a3bf-4d77a959fba7 발송(읽기 전용, 기준 11b0c0d). 야간 위임 t1523: 전부 배포 직전까지.
- 2026-10-07 05:29: 203 점검 검수 통과(정정 9건) → 작업지시서 206 발송, 브랜치 cursor/hide-inquiry-20261007. 종현 확인 8건은 206 「종현 확인 필요」. (원격 159ab·159d 브랜치는 배포된 작업 브랜치라 유지, 지운 것은 여분 e771뿐.)
- 2026-10-07 05:31: 162 점검 검수 합격(정정 4·보완 3) → 작업지시서 205 발송, 브랜치 cursor/admin-162-20261007, 077. 종현 확인 14건·운영작업 7건은 205. 별건: 기존 paid-reminders cron 키 기본값(dev-cron-key 공개) 위험 — 아침 보고에 포함.
- 2026-10-07 06:26: 162 구현(02dd20e) 검수 — 보완 필요(중간2·낮음5·증거1, 잠긴 정책 어긋남 0). 검사 55/0·202/0·54/0·build·mjs45/0·php98/0(박스 MariaDB). 재작업지시서 208 작성(미발송). 종현 확인 +4(15~18), 운영 8단계는 205 §검수 결과.
- 2026-10-07 06:34: 숨김+문의 구현(ad81b93) 검수 — 보완 필요(잠긴 정책 어긋남 1[D6 주대상, 206 지시서 허점]·중간3·낮음3). 검사 59/0·198/0·54/0·24/0·49/0·mjs48/0·build, 기존 FAIL만 동일. 박스 e2e: hide-inquiry 5/5, a28-07 Q7 회귀(D3). 재작업지시서 207 작성(미발송). 종현 확인 14건은 206 §검수 결과.
- 2026-10-07 06:39: 162 재작업(0a7005c) 재검수 — **검수완료**·배포 직전(main 미반영)·종현 승인 대기. D1~D8 해소, 검사 55/0·202/0·54/0·build·mjs53/0·php108/0. 근거 [205](205-admin-162-work-order-2026-10-07.md) §재검수 결과. 209 불필요.
- 2026-10-07 06:4x: 159-c 점검지시문 초안 작성(docs/209), 숨김 검수완료 대기. 잠정 작업지시 골격은 209 §잠정(발송 금지). 권장 베이스=숨김 tip+(a) 162 BasicCardRegisteredQuery·ReportPeriod 복사.
- 2026-10-07 06:45: 숨김+문의 재작업(2723c5f) 재검수 — **검수완료**·배포 직전(main 미반영)·종현 승인 대기. D1~D7 해소, 검사 59/0·198/0·54/0·hide-bundle 55/0·build, e2e hide 6/6·a28-07 24/24(×2). 근거 [206](206-hide-inquiry-bundle-work-order-2026-10-07.md) §재검수 결과. 210 불필요.
- 2026-10-07 06:47: 숨김+문의 검수완료(2723c5f) → 159-c 점검지시문 209 발송 준비(베이스=숨김 tip, BasicCardRegisteredQuery는 162 0a7005c 복사).
- 2026-10-07 06:48: 159-c 점검 에이전트 발송(bc-784766e2, starting_ref=hide tip 2723c5f, 읽기전용·PR금지). 숨김·162는 배포직전 대기.
- 2026-10-07 06:49: 보류 묶음(찾기 주소 통일·단지·bname) 점검지시문 초안 작성(docs/211)·잠정 골격 포함(발송 금지). 베이스=origin/main 11b0c0d·브랜치 예정 cursor/hold-find-address-20261007. 찾기 핵심은 hide/162/159-c와 경로 겹침 거의 0(StudyRoomRegisterService 파일만 숨김과 줄 분리 겹침). **159-c 검수완료 후** 점검 발송·배포 직전 정지. git·클라우드 미접촉.
- 2026-10-07 06:54: 159-c 점검(bc-784766e2) **합격**(정정3·PR/브랜치0) → 작업지시서 [210](210-admin-159c-work-order-2026-10-07.md) 작성(베이스 hide `2723c5f`+162 쿼리 복사, 브랜치 `cursor/admin-159c-20261007`, today-hub 59·labels 198→202·shop 54, 발송 대기). git push·클라우드 미접촉.
- 2026-10-07 06:55: 159-c 점검 합격(정정 3) → 작업지시서 210 발송(bc-784766e2), 브랜치 cursor/admin-159c-20261007 ← hide 2723c5f.
- 2026-10-07 06:56: 보류묶음 점검 에이전트 발송(bc-492ae05d, main 11b0c0d, 읽기전용). 159-c 구현과 병행.
- 2026-10-07 07:0x: 보류묶음 점검(bc-492ae05d) **합격**(커밋·PR·브랜치0 · 핵심주장 스팟체크 전원 맞음 · Q14 등 기본안 채택) → 작업지시서 [212](212-hold-bundle-work-order-2026-10-07.md) 작성(브랜치 예정 `cursor/hold-find-address-20261007` ← main `11b0c0d`). **미발송**·git·클라우드 미접촉. 근거 [211](211-hold-bundle-inspect-2026-10-07.md) §검수 결과. 배포 직전 정지(t1523).
- 2026-10-07 07:06: 보류묶음 점검 합격 → 작업지시서 212 발송(bc-492ae05d), 브랜치 cursor/hold-find-address-20261007 ← main 11b0c0d.
- 2026-10-07 07:15: 159-c 구현(4c865bd, hide 2723c5f 위 1커밋·13파일 +1687/-0·PR 0) 검수 — **검수완료**·배포 직전(main 미반영)·종현 승인 대기. 검사 today-hub 59→61(css2)·labels 198→202·shop 54/0·mjs46/0·php69/0·php -l 5/5·build, API 401/403/200/405·새로고침 동일. 162 계약 8메서드 바이트 동일·ReportPeriod sha 동일. 스크린샷 박스 미복사(증거 공백·비차단). 근거 [210](210-admin-159c-work-order-2026-10-07.md) §검수 결과. 213 불필요.
- 2026-10-07 07:5x: 보류묶음 구현(ab68b05, main 11b0c0d 위 1커밋·21파일 +712/−339·PR 0) 검수 — **보완 필요**(잠긴 정책 어긋남 2[D1 게스트 단지키로 지역고정 우회·D3 구 검색 후 현재위치/현황박스 홍보1 고정]·회귀 2[D2 region+complex 목록 축소: tier 24/0→23/1·19/0→18/1, D4 promo-region-match Fatal]·검사완화 1[D5]·중간3·낮음3). 나머지 검사 동일(hope 71/0·input-fill 3F 기존 동일·build 5/5), 프로브: 구=베이직 21/21·페이지 21→2·세종 0→1·complex-by-name INSERT 0. 재작업지시서 [213](213-hold-bundle-rework-2026-10-07.md) 작성(미발송). 근거 [212](212-hold-bundle-work-order-2026-10-07.md) §검수 결과. 종현 확인 C11~C15 추가.
- 07:53 보류묶음: ab68b05 검수=보완 필요(D1 게스트 지역잠금 우회·D3 현재위치 미추종=잠긴 정책 오류, D2·D4 회귀, D5 단언 약화 등 12건) → 보완지시서 213 Cursor 전달(bc-492ae05d, 같은 브랜치 새 커밋). 재검수 대기.
- 2026-10-07 09:2x: 보류묶음 213 보완(06f9dc5, ab68b05 위 1커밋·8파일 +591/−180·PR 0·허용 밖 0) 재검수 — **보완 필요**. R1·R2·R4~R12 해결(게스트 단지 우회 부산 1→강남 2·타지역 단지 0→대치동 3, region+complex 1→3, tier 24/0·19/0, promo 38/0, basic-register 27P/4F 같은 이름, 3단계 막기 요청 0·구만 21건, 페이지 경쟁 OK, hold verify 76/0·ab68b05에 대면 6F). 남은 것: E1 잠긴 정책(새로고침·공유 URL 복원 뒤 현재위치 홍보1 복귀, 과외 「27」은 11b0c0d부터) · E2 student-location-flow 189→187/2 · E3 location-display 공유 규칙 변경(apartmentName·GPS 광역) · 낮음 E4·E5 · E6 같은 스크린샷 2장. 2차 지시서 [214](214-hold-bundle-rework2-2026-10-07.md)(미발송). 별건 C16: 초기화 무한 재렌더(11b0c0d부터, 초당 DOM 변이 180~390 무한). 머지 순서 숨김→162→159-c→보류(214 뒤), 4개 합친 머지 충돌 0. 근거 [212](212-hold-bundle-work-order-2026-10-07.md) §재검수 결과.
- 08:52 보류묶음: 06f9dc5 재검수=보완 필요(E1 새로고침·공유URL 시 현재위치 홍보1 복귀=잠긴 정책 오류, E2 student-location-flow 189/0→187/2, E3 location-display 공통규칙 범위초과, E4~E6) → 2차 보완지시서 214 Cursor 전달. 별건 C16 초기화 무한루프(11b0c0d부터, 운영 영향 가능) 종현 보고 대상.
- 09:09 보류묶음: 214 보완 커밋 26cadd3 도착(06f9dc5..26cadd3, 6파일). 재검수2 시작.
- 2026-10-07 09:4x: 보류묶음 214 2차 보완(26cadd3, 06f9dc5 위 1커밋·6파일 +266/−68·PR 0·허용 밖 0) 재검수2 — **검수완료/배포 직전**. S1~S6 실측 통과(복사 DB: 새로고침·공유 URL 시군구 유지·숫자 id 깜빡임 0, location-flow 189/0, location-display 구조필드 변화 0, 동 표기 「대치동」통일, 막힌 3종 요청 0·표시 유지, hold verify 119/0·06f9dc5에 대면 15F). R1·R2 회귀 0. build 5/5. C16 초기화 루프는 지시대로 미수정(별건). 머지 순서 숨김→162→159-c→보류(26cadd3). 근거 [212](212-hold-bundle-work-order-2026-10-07.md) §재검수2 결과.

- 2026-10-07 13:1x: 숨김+문의 **배포지시서** [215](215-hide-inquiry-deploy-order-2026-10-07.md) 작성(tip `2723c5f`·main `11b0c0d` ff-only·SQL-first 076·머지/Deploy/운영SQL 미실행). 종현 t1526 순차: 이 검수 통과 전 162 금지.
- 13:28 숨김+문의: 종현 SQL완료·「배포」 → Cursor 배포 중(bc-94177f81, tip 2723c5f ff→main).
- 13:31 숨김+문의 배포 성공: main 2723c5f, Deploy #394 success. 배포후 검수 중(종현 관리자·사이트, 게스트 스모크 병행).
- 13:35 숨김+문의 게스트 스모크 **OK**: https://study114.net 홈·/search 로드·콘솔 치명0(게스트 tickets 401만)·학부모 가시 1(기존 「학생/학부모 고민방」)·번들 `index-BkqNkP6S.js`에 `unhide_request`×2·Deploy #394/`2723c5f`(관리자·운영DB 미접촉).
- 15:29 숨김+문의 종현 배포후 검수 **OK**(관리자·사이트). → 15:3x 162 **배포지시서** [216](216-admin-162-deploy-order-2026-10-07.md) 작성(tip `0a7005c`, main `2723c5f` → ff 불가·리베이스 dry run 충돌0, SQL-first 077, GitHub Secret STUDY114_REPORT_CRON_KEY, 외부 cron 00:05·00:20 KST POST; 머지/Deploy/운영SQL 미실행).
