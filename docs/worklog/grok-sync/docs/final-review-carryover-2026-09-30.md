# 최종 146~180 검수 때 다시 볼 것 (2026-09-30 기록)

- 156-2c: 찜·최근열람·비교·추천 삭제는 실패해도 error_log만 남기고 탈퇴 진행 → 실제 삭제 여부 재검증
- 156-2c: scripts/purge-withdrawn-accounts.php --apply 미실행 → 배포 후 기존 탈퇴 계정 정리 실행
- 156-2c-b: 쪽지 상대 이름은 상대가 withdrawn일 때만 성+○○, 정상 회원은 스냅샷 규칙 유지 → 반영 확인
- 156-1: 홈 과외쌤·학생 축 건수(서울시 데이터 없어 로컬 미확인) 라이브 확인
- 156-2: 「다시 활성」 버튼 화면 미확인(정지 회원 없음) → 라이브 확인
- 156-2b: 결제 있음 1년 보관을 status=withdrawn + 관리자 로그(account_delete)로 식별 → 1년 배치에 충분한지 확인
- 178-8: Playwright 실패 9개가 원래 실패였는지 미확인; 팝업+Esc 두 번, 미인증 계정 이용안내 레일, 로그인 역할 찾기 라이브 확인
- 156-2b-b: 수락(MemberUploadPurge). 재확인 — 인증서류(study_room_verification_documents, tutor_verification_documents) 저장 코드가 저장소에 없음 → 실제 저장 경로가 public/uploads 안인지 확인. 밖이면 삭제 시 「파일 건너뜀」으로만 남음.
- (종현 확정 2026-09-30) 인증서류는 보관·제출 로직 없음=구정책. 위 156-2b-b 인증서류 경로 확인 항목은 「확인」이 아니라 「구알고리즘 걷어내기」로 변경: verification_documents 테이블·관련 코드·삭제 수집 경로 제거 검토.
- 환불 기능 미구현: 환불 신청·환불엔진 계산·PG 취소 코드 없음(PG dev_mock). 노션 정본=회원 요청 후 서버가 환불표로 계산. 탈퇴 회원은 로그인 불가 → 고객센터 접수 창구 결정 필요. 결제사 계약 후 구현. 탈퇴/삭제 고지 문구=「환불은 환불규정에 따라서 조치를 해 드립니다」(156-5c).
- 156-5b: 관리자 탈퇴 확인 창 고지 라이브 확인, purge --apply 시 이미 탈퇴 계정 구독도 종료됨.
- 환불 내부 정책 정리 필요(종현 2026-09-30): 이번엔 156-5c 카피만 반영, 환불 정책·기능은 이후 별도 정리.
- 156-5c 라이브 확인: 본인 탈퇴 화면(mypage 계정 탈퇴 패널)에 「환불은 환불규정에 따라서 조치를 해 드립니다.」 항목 표시(Cursor 미확인). 유료 없는 회원에게도 동일 표시됨.
- (보안 의심) public/api/support/tickets.php GET 전체 목록·PATCH 답변/상태에 관리자 인증 없음(156-4 조사로 확정 예정) → 156-4b로 수정 필요.
- 신고 접수 경로 없음: admin_reports는 시드 INSERT뿐, 사이트에서 신고하는 기능 미구현(156-4 조사로 확정 예정).
- 156-3 조사 결과: (a) 과외쌤 「삭제 처리」가 profile_status=hidden(TutorHubRepository.php 67행)이라 관리자 「다시 보이기」로 주인이 삭제한 카드가 되살아날 수 있음. 공부방 주인 숨김도 같은 컬럼(hidden)이라 관리자가 뒤집을 수 있음. → 정책 결정 필요. (b) 공부방·과외쌤 찾기·상세·지도가 profile_status <> 'hidden'이라 작성 중(draft/pending) 카드가 공개 조회에 남을 수 있음(SearchService 302·552행, StudyRoomPublicReadService 65행, NeighborhoodGreetingService 194행) → 실제로 draft 카드가 생기는지 확인 후 조치. 학생은 published만 노출이라 안전. (c) 156-3 화면 라이브 확인: 탭 3개, 회원 상세 링크, 「전체 보기」. php -l은 PC에 php가 없어 Cursor 보고만 확인.

## 정정 (종현 2026-09-30, 156-3 이후) — 본인 숨김·삭제 기능 없음
- 정책: 공부방·과외쌤은 본인 카드를 숨기거나 삭제할 수 없다. 「삭제」=회원 탈퇴(소프트 제거), 하드 삭제=관리자 회원 삭제뿐. 회원 자체 「카드 삭제」 기능 없음.
- 위 156-3 조사 (a) 「주인 삭제 카드 되살림 정책 결정 필요」는 철회(구정책 코드를 현행으로 오해한 것).
- 걷어낼 구정책 흔적(최종검수 때 티켓화):
  1. tutor-reg/screens.js ~591 「삭제」 위험 영역(data-p21-delete)과 핸들러(~806), tutor-reg/store.js deleteTutor. 과외쌤 노출 상품 탭에 버튼이 실제 그려짐 → 라이브 노출 여부 확인 필요.
  2. study-room-reg/screens.js:691, student-reg/screens.js:569 delete 핸들러 및 store deleteStudyRoom/deleteStudent(버튼 마크업은 이번 조사에서 못 찾음, 죽은 코드 가능).
  3. 서버: StudyRoomHubService·TutorHubService·StudentHubService의 delete 액션, TutorHubRepository.softDelete(profile_status=hidden), StudyRoomHubRepository 74행, StudentHubRepository softDelete.
  4. StudyRoomRegisterService.php:1010 회원 입력으로 받는 'hidden' enum 값.
  5. 프론트 profile_status==='hidden' 분기: tutor-reg/format.js 다수, plans/screens.js 597/620, plans/order-blocks.js 96, compare_eligible 연동. 관리자 「노출 보정」이 만드는 hidden만 남기고 회원 기원 hidden 문구는 정리.
  6. 공개 조회 profile_status<>'hidden' 조건(SearchService 302·552, StudyRoomPublicReadService 65, NeighborhoodGreetingService 194): draft/pending 카드 공개 노출 여부 확인.
- 문서 갱신: 153에 「본인 숨김·삭제 없음」 명시, 4장 노션 「hidden=노출 철회, deleted=작성값 삭제」 설명은 관리자 노출 보정 전용으로 재정의 필요(노션은 사용자 「남겨」 때만 기록).

## 156-6 수락 (2026-09-30, diff 검수)
- 회원 본인 삭제·hidden 경로 제거 수락(로컬 미커밋): 프론트 삭제 영역·핸들러·store 함수, 세 허브 delete 액션·softDelete, 공부방 시설 저장의 hidden 허용값. 후기 softDelete·tutor 사진 삭제(action delete)는 별개라 유지.
- action=delete는 400이 아니라 422(RegistrationApi.php 93–94행이 InvalidArgumentException을 422로 고정) → 최종검수 때 필요하면 조정.
- 남은 구정책: tutor-reg/format.js hidden 표시 문구, 라우터 제목 P19-06·P20-06·P21-07 「삭제」 문자열, plans/screens.js 597/620·order-blocks.js 96 hidden 분기.
- 공개 조회 draft/pending 노출: 공부방·과외쌤 찾기·상세·지도는 profile_status<>'hidden'이라 draft 카드도 남음. 신규 카드는 가입·등록 첫 저장에서 draft로 생성됨 → 실제 노출되는지 최종검수 때 정책 확인(학생은 published만).
- e2e 정리 필요: 운영 스모크 로그 화면 테스트가 「조치 구분:」 문구를 찾아 실패, 노출 패치 「잘못된 target_type」 테스트는 156-3 이후 student가 정상 유형이라 기대값 낡음. 이 e2e가 운영 데이터(학생 1번 숨김→복구)를 건드리고 로그를 지움 → 실행 대상 환경 확인.

## 156-7 철회 (2026-09-30)
- 카드 행은 BasicRegisterService 트랜잭션에서 필수 검증 통과 후에만 생성됨(검증 실패 시 throw로 행 없음). 이어가기는 needsBasicRegister(카드 없으면 기본등록부터)가 담당 → 「기본등록 완료=노출」 이미 구축됨. 미완성 카드 노출 우려는 근거 없음, 156-7 티켓 철회.
- 정리 대상: draft/pending/published 이름은 「기본등록 완료(basic_only)」 표시일 뿐이라 용어 혼동 소지. 최종검수 때 정리 검토. 「공개」 개념/문구 없음 유지.

## 178-8c 수락 (2026-09-30 21:00, 로컬 미배포, 156 묶음과 별도 배포)
- 비로그인 찾기: 화면 구경, 조작(입력·필터·정렬·검색·초기화·지역변경·학생카드 클릭) 시 openDeepAccessLoginGate 팝업. 학생 카드 이름 성+○○.
- 최종검수: 하단 학생 카드 줄(renderGuestStudentStrip)은 신규 추가분 → 라이브에서 위치·모양 확인.
- 최종검수: 이메일 미인증 로그인 회원은 여전히 전체 가입·로그인 카드(정책 미결정).
- 최종검수: 서버 학생 목록 API가 title에 원본 public_display_name을 내려줌(화면만 가림). 직접 호출 시 노출 → 서버 블라인드 검토.
- 최종검수: 이메일 미인증·로그인 회원 찾기 화면 미확인, Playwright 기존 실패 9개(홈 GNB·홈 카드 상세·학생 찜/비교·쪽지) 별도.

## 156-4 / 156-4b 수락 (2026-09-30, 로컬 미배포)
- 배포 후 라이브 확인: 문의 401 안내 문구, 회원 「내 문의」 화면, 결제줄 이메일→회원 상세 클릭.
- 신고 접수 경로 없음(admin_reports 시드 전용), 문의 답변 이메일 발송 코드 없음.

## 178-8d 수락 (2026-09-30 21:55, 로컬 미배포, 178-8c와 함께 별도 배포)
- 인증 전 로그인 회원이 찾기 진입 시 redirectToEmailVerifyWait로 인증 대기 화면 이동. 가입·로그인 카드(renderFindLoginGate) 제거.
- 최종검수: 인증 완료 후 원래 찾기(return_to)로 복귀하는 기능 없음(홈도 동일). 인증 대기 화면 본문 미확인.
- 156 묶음 배포 지시문 21:50경 사용자에게 전달(결과 대기). 178-8c/8d는 그 뒤 「178 배포」.

## 157-1 (2026-09-30 수락, 로컬 미커밋)
- 화면 이름 정리(공지·안내 글 / 이용안내 / 사이트 기본), 가입 받기 스위치 3개 화면·저장 제거. 서버 변경 없음.
- 최종검수: 「사이트 기본」 묶음(grp-config) 안에 팝업 관리·운영 알림·권한·계정이 같이 있음(157 계획은 이름·점검·가입·약관·운영자). 묶음 이름과 첫 메뉴 이름이 같음.
- 잔재: a28-screens-labs.js 「환경설정 · 운영 알림」, 팝업 도움말 「공개하면」, admin-red-line-copy.js 「공지/가이드 게시 및 수정」(157-2에서 일부 정리).
- 조사: 이용안내(#/guide, guide/copy.js)는 서버 글 미사용 / FAQ 시드 faq-1~19가 API 수정 무시 / 사이트 기본 전부 sessionStorage / 가입 약관 보기는 정적 policy-copy / 우측 배너·채널은 서버 저장되나 손님은 시드 → 157-2(사이트 기본), 157-3(이용안내·FAQ), 157-4(배너)로 처리.
- e2e: Playwright Chromium 실행 파일 없어 브라우저 3건 실패, 무관.

## 156-2e 정책 확정 (2026-09-30 종현)
- 결제는 10원 테스트여도 금융 기록이므로 보존. 회원 삭제는 결제 유무와 관계없이 계정 완전 삭제 + 결제 행 익명 보존(성+○○, 삭제 회원 번호, 이메일·전화 제거).
- 156-2b의 「결제 있음=숨김 보관」 분기는 폐기 대상. 선택 삭제 최대 6명(마스터 전용, 「삭제」 입력 확인).
- 결제 기록 보존기간·PG 계약 후 환불 엔진과 함께 최종검수에서 재확인.

## 157-2 (2026-09-30 수락, 로컬 미커밋·미배포; 157-1과 함께 배포 예정)
- site_settings 테이블(sql/schema/070_site_settings.sql, key=bundle 1행) + 관리자 GET/PUT(최고관리자) + 공개 읽기(public-settings.php). 서버 값 못 읽으면 손님은 점검 없음·정적 약관.
- 점검 켜지면 bootstrap에서 /api/ 쓰기(POST/PUT/PATCH/DELETE) 전부 503. 제외: /api/admin/, login/logout, oauth start·callback, cron, health, public-settings.
- 배포 시 사람이 할 일: 운영 DB에 070_site_settings.sql 적용(적용 전엔 저장만 「테이블이 없습니다」).
- 라이브 확인: 최고관리자로 점검 켬→손님 배너·가입 503·#/admin 열림→끔 / 약관 저장→/policy/terms 반영·가입 「보기」 동일 / 게스트 배너.
- 최종검수: (1) 점검 중 관리자가 공지·고객지원 등 /api/admin/ 밖 API로 쓰면 막힘(공지 편집 등) → 관리자 세션 예외 검토. (2) PG 결제 웹훅 생기면 점검 예외에 추가. (3) 금지어는 적용처 미정으로 미적용, 소셜 가입엔 차단 이메일 미적용. (4) 팝업은 별도 저장(이번 범위 밖). (5) 점검 상태는 새로고침해야 손님에게 반영. (6) php -l 미실행.

## 156-2e (2026-09-30 수락, 로컬 미커밋·미배포)
- 회원 삭제 = 결제 유무와 관계없이 계정 완전 삭제 + provider_payment_orders·provider_position_subscriptions 익명 보존(user_id NULL, deleted_user_ref, deleted_display_name 성+○○). 활성 구독은 삭제 전 종료. hidden_hold 갈래 제거.
- 선택 삭제 POST /api/admin/members-bulk-delete.php (마스터, 최대 6, 「삭제」 입력, 회원별 계속). 마스터·부마스터·본인·탈퇴 계정 거부. 결제 화면은 「삭제된 회원(성+○○)」.
- 배포 시 사람이 할 일: 운영 DB에 sql/schema/071_member_delete_payment_anon.sql 적용(070과 함께). 적용 전엔 삭제가 SQL 안내와 함께 거절됨(안전).
- 라이브 확인: 테스트 계정 결제 없음/있음 각 삭제 → 결제 목록에 삭제된 회원 표시, 7명 선택 거절, 마스터 체크박스 미노출(부마스터), 결제 링크 없음.
- 최종검수: (1) support_tickets에 이메일 남음(삭제 회원). (2) purge-withdrawn-accounts.php가 탈퇴+결제 계정을 어떻게 지우는지 새 익명 보존 방식과 맞는지 확인(FK 풀린 뒤). (3) 결제 FK 해제로 참조 무결성 없음 — deleted_user_ref만. (4) 환불 상태 ENUM 미존재 그대로. (5) php -l·화면 미확인.

## 2026-10-01 157-3 수락 (이용안내·FAQ 손님 노출)
- 같은 slug/id 서버 글이 시드를 덮음(operational-board-store overlayByKey), 서버 없는 시드 유지, 읽기 실패 시 시드. 손님 #/guide 「읽어 볼 글」·#/guide/a/{slug} 상세, 이스케이프 후 문단. FAQ 분류 선택, 기본 글 삭제 차단(alert).
- 이월: 시드 FAQ(faq-7 이후 등 DB 행 없음)를 관리자에서 수정 저장하면 BoardPostService::saveOperational가 없는 post_key를 거절(「게시물을 찾을 수 없습니다」) → 새 질문으로만 저장 가능. 해결하려면 PHP에서 admin 운영 게시판(faq·safe-guide)은 없는 key도 생성 허용(157-3b 제안, 사용자 OK 대기).
- 이월: 이용안내 이미지·요약 칸 없음. 관리자 글 삭제 불가(시드) 정책은 임시.
- 157-2b(손님 배너·점검 띠 가림): 같은 작업 폴더에 diff 있음(.ops-chrome__banners fixed + --ops-chrome-h로 헤더·본문 밀기, 손님 배너 조건 !isLoggedIn). Cursor 보고 대기, 화면 미확인.

## 2026-10-01 갱신 (157-2b·157-3b 수락, 게스트 보완 178-11 발행)
- 157-2b 수락: 손님 배너가 서버엔 정상 저장·DOM엔 그려지는데 고정 헤더(z-index 1000)에 가려진 것이 원인. .ops-chrome__banners fixed(z 1001) + --ops-chrome-h를 헤더 top·본문 padding-top·고정 메뉴(sticky) top에 더함. 손님 배너는 로그아웃이면 홈·찾기·상세 전체(찾기 앱도 mountOpsChrome). 관리자 화면은 띠 없음·높이 0. 라이브 확인: 찾기 화면(Cursor도 못 봄)에서 배너·헤더 겹침 여부, 모바일 두 줄.
- 157-3b 수락: BoardPostService::saveOperational만 수정. 보드 faq + admin + post_key `faq-숫자`면 행이 없어도 그 키로 새 행 생성(재저장은 덮어쓰기). hack-1·다른 보드(공지 등)는 422 거절. 저장소(BoardPostRepository)는 원래 지정 키 INSERT 지원. 로컬 검증: faq-7 첫 저장/재저장/hack-1/notice-missing-1. 이용안내(safe-guide)는 키를 비워 새로 만드는 방식이라 별도 수정 없음.
- 로컬 수락·미배포: 157-3, 157-2b, 157-3b (배포는 사용자 「배포」 대기).
- 게스트 정책(확정, 종현 2026-10-01): 로그인 전 손님은 모든 화면에서 기준 위치가 「서울 대치동」(공부방 축=대치동, 과외쌤·학생 축=서울시). 찾기 화면의 현재위치·지도 위 박스도 대치동으로 고정, 홈 지도 위 박스와 같은 모양·같은 실수치(공부방·과외쌤·학생). 「경기」 같은 광역 단독 표기 금지(공부방=아파트단지/행정동, 과외쌤·학생=시·군). 손님은 GPS로 위치를 덮어쓰지 않음. 빈카드(프라임 빈 슬롯·베이직 빈카드·샘플)는 배지 포함 어디를 눌러도 로그인 유도 팝업(「유료상품 보기」 링크도 팝업).
- 조사 사실(2026-10-01): 홈 박스 수치 = /api/search/region-stats.php가 SearchService::guestAxisCounts로 실제 COUNT(공부방 region_label=대치동, 과외쌤·학생=서울시), 실패 시 「—」. 운영 응답 현재 0/0/0. 찾기 화면 박스는 「목록 N·상태」(화면 카드 수)라 홈과 다름, 운영에서 「목록 11」이 나옴(출처 조사 항목). 「경기」 원인 = search-ui bootFindGpsIfNeeded가 손님에게도 GPS→reverseGeocode로 위치를 덮어씀. 빈카드는 카드 전체 클릭 바인딩이 없고 실카드 클릭 바인딩(detail-decision)도 빈카드에 안 붙음.
- 178-11 티켓 발행(결과 대기): 손님 위치 고정 + 광역 단독 표기 방어 + 찾기 박스를 홈과 같게 + 빈카드 전체 클릭 로그인 유도 + 조사(위치 출처, 목록 11 출처, 카드별 클릭 표). 종현이 다른 게스트 오류를 하나씩 더 전달 예정 → 178-11b 이후로 이어 발행.
- 최종검수 추가: 「목록 11」 출처가 시드·목업이면 정리. 찾기 화면 위치 저장값(localStorage canonical/hope region) 손님 잔재 정리. 광역 단독 표기 방어가 회원에도 필요한지 확인.
- 노션: 작업이 어느 정도 끝나면 종현이 「남겨」 할 때 관련 문서에 한꺼번에 반영(그때까지 이 로컬 문서가 정본).

## 2026-10-01 178-11 ACCEPTED (로컬 미배포)
- 손님 찾기: GPS 호출 안 함, 저장 위치·URL region 무시, 공부방=서울 강남구 대치동(현재위치 대치동), 과외쌤·학생=서울시. 손님이 회원 저장 위치를 덮어쓰지 않음(writeStoredCanonical에서 guest 제외).
- 지도 박스: 손님은 제목 대치동 + 공부방·과외쌤·학생 3칸(region-stats 실수치, 실패 시 —), 목록/상태 제거. 「목록 11」은 클라이언트 시드 EXPOSURE_STUDY_ROOMS 길이였음.
- 빈카드·샘플 카드(data-prime-empty/basic-empty/pick-empty/expo-sample) 전체 클릭 → 로그인 팝업(bindGuestEmptyCardLoginGate, 캡처 단계). 유료상품 보기도 팝업.
- 광역 단독 표기 가드(location-display.js BROAD_REGION_ONLY, placeCaption). formatLocationDisplay가 광역·구만 있으면 빈 문자열 반환하도록 바뀜.
- 배포 후 라이브 확인: 회원(공부방·과외쌤·학생) 찾기 현재위치 한 줄이 비지 않는지(예: 과외쌤 저장 지역이 「서울 강남구」처럼 시·군 없는 값일 때 빈 문자열 → 대표지역 폴백), 로그아웃 뒤 회원 GPS 재허용 동작, 찾기 손님 목록에 프라임 빈 슬롯 없음(요금 링크는 홈에서만).
- 최종검수: formatLocationDisplay 빈 문자열 반환이 다른 호출부(displayLabel 사용처)에 미치는 영향 점검.

## 2026-10-01 178-11 재검토 — 현재위치 정책 근거 (노션 9장 + 로컬 106·185·186) → 178-11b
- 정본(노션 「9장-메인화면 구조 및 역할별 노출 규칙 잠금」): 과외쌤 활동지역 = 광역시 또는 도의 시·군 (광역시는 그 자체, 1차 도·광역시 → 도면 2차 시·군). 학생·학부모 화면의 과외쌤 문법도 「시·군(광역시는 그 자체)」. 공부방 = 행정동·단지. 비회원 데모 = 공부방 대치동, 과외쌤·학생 서울시.
- 106: 과외쌤 「현재위치」= 대표 활동지역(is_primary) 고정, GPS·주소·URL로 안 바뀜. 185: 대표 비면 폴백 「서울시」만. 186: 「서울특별시」 대표 저장 → 홈 「현재위치」 일치가 검증 기준.
- 178-11 결함: BROAD_REGION_ONLY가 서울특별시·부산광역시 등 광역시도 「광역 단독」으로 막아 과외쌤·학생 축 현재위치가 빈 값이 됨(정책상 광역시는 그 자체가 유효 단위). 막아야 할 것은 도 단독(경기·경기도·강원도 등)뿐.
- 조치: 178-11b 티켓 발행.

## 2026-10-01 178-11b 재작성 — 종현 정정(정본 그대로 구현, 새 정책 금지)
- 지역 표기는 분기로 정해진다: 공부방 관련(공부방 홍보지역, 공부방 찾기, 학생이 「공부방 찾기」 분기) = 행정동·아파트단지 / 과외쌤 관련(과외쌤 활동지역, 과외쌤 찾기, 학생이 「과외쌤 찾기」 분기) = 시·군(광역시는 1차로 끝나 그 이름 그대로). 학생은 가입 때의 분기를 따르고 공부방 화면엔 그 동·단지 학생, 과외쌤 화면엔 그 시·군 학생이 나온다. 정본: 노션 14장(가입·기본등록 흐름)·9장.
- 「광역 가드」라는 이름·규칙은 폐기 대상. 178-11의 BROAD_REGION_ONLY/isSiOrGun 기준이 광역시를 막는 것은 정책 위반(과외 축에서 서울특별시 등이 빈 값). 11b는 새 규칙 추가가 아니라 축별 표기(room=동·단지 / tutor=시·군·광역시)를 정본대로 맞추는 작업.

## 2026-10-01 배포 #361 SUCCESS (커밋 13bc179, 26개 파일, 5394208..13bc179)
- 포함: 157-2b, 157-3, 157-3b, 178-11. SQL 없음. purge --apply 미실행.
- 주의: 178-11의 광역 가드(광역시까지 막음)·현재위치 표기 결함이 이미 라이브에 나감. 178-11c 점검 → 정책(공부방=행정동·단지, 과외쌤=시·군/광역시 그 자체, 학생=가입 분기 따라감)대로 보정 티켓 예정.
- 라이브 확인 대기: 찾기 배너·헤더 겹침, 모바일 두 줄 배너, 회원 3종 찾기 현재위치 한 줄.

## 2026-10-01 178-11c 점검 결과 (코드 수정 없음)
- 178-11 광역 가드가 「서울특별시」「부산광역시」등 광역시 정식 명칭(가입·활동지역 라벨 activityLabelForUnit/KOREA_METROS)을 현재위치에서 지움(이전엔 그대로 표시). 과외쌤 대표가 광역시면 찾기 헤더 현재위치 빈칸. 경기도 단독은 막는 게 의도대로.
- 학생 홈·찾기는 students.preferred_lesson_type·preferred_*_region을 읽지 않고 탭(room/tutor)·목업으로 표기(primaryHopeRegionLabel을 search-ui가 호출 안 함).
- 손님 홈 공부방 목록 현재위치는 「서울 강남구 대치동」 전체(guest-sections.js:114), 기대는 대치동.
- 공부방 검색 키·카드 지역은 시 구 동 전체, 현재위치 캡션만 동·단지.
- formatLocationDisplay 빈 문자열이 activeRegionLabel·지역 입력칸·writeStoredHopeRegion·검색 복원 키·카드 지역 문구로 그대로 감.
- 사용자 제안(2026-10-01, 잠금 대기): 과외쌤·학생 광역시는 구 2단계(도→시·군과 같은 방식, 가입 단계 포함), 손님 과외쌤·학생 기준은 서울 강남구(서울시 폐기). 세부 4문항(세종 예외·표기·기존 데이터·집계) 사용자 답 대기.

## 2026-10-01 과외·학생 지역 2단계(구) 정책 — 잠금 초안 (종현 지시 반영, 「잠금」 답 대기)
- 규칙: 구가 있는 시는 모두 2단계(도→시·군, 광역시→구, 일반구가 있는 시→구). 구가 없으면 1단계 종료(세종 등). 구 목록은 행정표준코드 공식 자료 기준(기억 금지, cities 시드 조사로 확정).
- 우선순위: 1) 입력 단계(가입·기본정보·희망지역) 2) 수치 집계 전부 3) 지역 필터 쓰는 검색·조회 전부.
- 손님 과외쌤·학생 기준: 서울 강남구(서울시 폐기). 공부방 손님은 대치동 유지.
- 열린 항목: 기존 저장값(구 없음) 처리, 현재위치 표기 형태(서울 강남구), 집계 기준 전환.
- 티켓 순서 예정: 조사(cities 시드·저장 구조·집계/검색 사용처) → 입력 단계 → 집계 → 검색·필터 → 표기·손님 기준 → 광역 가드 정리.

## 2026-10-01 지역 2단계(구) — 내가 직접 읽어 확인한 현재 구조 (PC 코드)
- 과외 지역 저장: tutor_regions(region_id → regions 행, scope_type ENUM city/district/metro). regions는 sido/sigungu/dong 컬럼 구조, 과외용 시 단위는 dong_name='시 대표' 가짜 행(SidoRegionEnsure).
- 1차 광역시·특별시·세종은 그 자체가 1행(예: 서울특별시)으로 끝남, 도는 2차 시·군(src/Region/SidoRegionEnsure.php PROVINCE_CITIES, preview/shared/korea-sidos.js). 수원·성남·고양·용인·창원·청주·전주·천안·포항 등 일반구 있는 시도 「시」 1행으로만 존재(구 없음).
- 구(區) 데이터는 과외용으로는 없음. 구 단위 행을 어떻게 만들지(regions 행 추가/코드 체계)는 미확인 → 점검 필요.
- 지역을 쓰는 서버 지점(확인): BasicRegisterService(저장 656행), SearchService(559·574 과외 지역 조건, 655~677, 790~796 지역 LIKE), TutorPositionAxis, AdminExposureRepository, NeighborhoodGreetingService, TutorHubRepository, ProviderTicketRepository(sido_name), 유료상품 city_id(order-blocks.js·paid-api.js). 프론트: korea-sidos.js, tutor-region-slots.js, signup-basic.js, tutor-reg, student-reg, student-hope-regions.js.
- 결론: 구 2단계는 저장 구조·유료상품 축(city_id)·집계까지 번지므로 작업지시 전에 점검 티켓(178-12) 선행.

## 2026-10-01 작업 우선순위 잠금 (종현)
- 최우선: 지역표기 정확 구현·반영 시리즈(178-12 점검 → 잠금 → 입력 → 집계 → 검색·필터 → 표기·손님 기준 → 178-11 보정). 이 시리즈가 끝난 뒤에 나머지를 순서대로: 손님 오류 잔여 → 157-4 → 158 → 159 → 162 → 178-9 → 178-10 → 146~180 최종검수.

## 2026-10-01 종현 정정 (지역표기)
- 「서울 강남구」 표기는 게스트의 과외쌤·학생 페이지 현재위치에만 해당. 게스트 홈은 공부방 우선이고 게스트 공부방 관련 현재위치는 행정동 「대치동」.
- 서울시 = 서울특별시 (같은 뜻). 문자열이 달라도 같은 지역으로 취급(별칭 정규화 필요, 새 구분 만들지 않음).

## 2026-10-01 178-14 수락 (로컬 미커밋·미배포·운영 SQL 미적용)
- 072_region_unit_level.sql(unit_level/official_code/is_selectable, dong_code NULL 허용, uk official_code), 073_region_official_seed.sql(공식 284행 = 시도16+시군구268, 선택 256 = 구109+광역군23+구없는시군123+세종1), scripts/build-region-official-seed.mjs. 로컬 2회 적용 OK.
- 운영 SQL(072→073)은 178-15(서버 쿼리 수정)와 함께 배포할 때 적용할 것. 먼저 적용하면 공부방/기본등록 목록(dong_name<>'시 대표')에 공식 행 284개가 섞임.
- 최종검수: rest-schema.sql·001_init.sql에 새 칸 미반영(필요 시), 기존 「시 대표」 161행·광주광역시/전라남도 이름 23행 정리, 원본 xlsx는 PC 임시폴더만(저장소 밖), php -l 불가.

## 2026-10-01 178-15 수락 (로컬 미커밋·미배포)
- RegionAlias::canonicalSido(서울시=서울특별시), SidoRegionEnsure(ensure no-op, ensureAndListCities=is_selectable 256행, assertSelectable), 동 조건 unit_level='dong' 정리(BasicRegister·StudyRoomRegister·TutorRegister·RegionEnsure·AddressRegionMatch), 과외 가입/마이페이지/학생 과외 희망지역 저장 시 선택단위 검증.
- cities 응답 kind: metro_gu 70 / metro_gun 23 / city_gu 39 / city 64 / county 59 / sejong 1 (+city_name, gu_name, official_code). 구 전 단계: 도→시→(일반구) 3단, 광역시→구·군 2단, 세종 1단.
- 배포 주의: 178-15는 화면 178-16과 반드시 함께 배포(기존 화면은 kind metro/city만 받음). 운영 SQL 072→073 적용 후 같은 배포. SQL이 먼저 가면 옛 코드의 동 목록에 공식 행 284개가 섞이고, 코드가 먼저 가면 unit_level 쿼리 실패.
- 최종검수: StudentHubRepository 재저장 경로 선택단위 검사 없음, 옛 PHP 가입 폼(basic-tutor.php/basic-student.php)이 listRegions 첫 토큰을 시 옵션으로 씀(동 7행만 남아 옵션 줄어듦), RegionEnsure.php 94행 카카오 이름 가드, 시 대표 161행 및 광주광역시/전라남도 23행 정리, php -l 불가.

## 2026-10-01 178-16 수락 (로컬 미커밋·미배포)
- preview/shared/region-cascade.js 신규(서버 cities 256행만, 1차 시도→2차 city_name→3차 city_gu만 구, 세종 1단, 미완성 시 region_id 빈값). tutor-region-slots·signup-basic·tutor-reg·student-reg 공용 사용. 정적 가짜 id(metro-11, city-41-0)·FALLBACK 제거. StudentHubRepository preferred_tutor_region_id assertSelectable. 빌드 3종·verify:tutor-signup-seed PASS.
- 배포 묶음: 178-14(072·073 SQL)+178-15+178-16 함께. 운영 SQL 072→073 먼저 또는 같은 때(코드가 unit_level 쿼리 사용).
- 최종검수 추가: korea-sidos.js의 KOREA_SIDOS/KOREA_METROS/PROVINCES에 「광주광역시」「전라남도」 남음(공부방 노출지역 화면이 사용) → 공식 「전남광주통합특별시」와 불일치 정리 필요 / tutor-ui step-basic.js 안내문구 / student-reg/store.js 목업 region_id '1' / 학생 공부방 분기 preferred_studyroom_region_id 미검사 / Playwright 미실행 / 로그인 화면 클릭 저장 요청 미확인(라이브 확인).
- 열린 설계: 지역 필터에서 「시」만 고르고 구를 안 고르면 그 시 전체 구 포함? (178-17에서 종현 확인)

## 2026-10-01 178-17 점검 결과(요점)
- 동 7행 중 4행만 공식 구 행과 이름 일치(id1·2·3·4). id90–92(역삼1·논현1·삼성1)는 sido_name '서울' vs '서울특별시'. 동→구 연결 칸 없음. 권고: 시군구코드 5자리(sigungu_code) = 공식 official_code 앞 5자리 조인(새 칸 없음). RegionEnsure 23·63행은 카카오 문자열 그대로 저장, 서울 표기 픽스처 없음(미확인).
- SearchService 지역 조건은 이름 LIKE/부모 id 허용(is_selectable 검사 없음): 공부방 308–325·1136–1171, 과외 557–579, 학생 779–810, 토큰 1110–1127. 「서울특별시 강남구」는 서울 전체로 넓어짐, 「서울시」는 0건.
- 프런트는 표시 라벨 문자열을 보냄(search-find-surface.js 1080–1090, search-api.js 68–78). 시도만·시만 골라도 안 막음.
- 집계: guestAxisCounts 77–91(과외·학생 서울시 LIKE), region-stats.php, AdminExposureRepository dong_name만 읽음, TutorPositionAxis 163–168 sido 우선, tutor-activity-chart.js 41–48.
- 게스트 박스 기준 행: 대치동 dong_code=11680101(로컬 id1), 강남구 official_code=1168000000(로컬 id192). 로컬 학생 건수 모두 0.
- 카드 라벨: 과외 「서울특별시 강남구」, 학생 구만(929–931), 공부방 구만. 178-11 가드는 과외 축에서 「서울특별시 강남구」·세종을 빈 값, 「경기도 수원시 영통구」를 「수원시」로 만듦(구 빠짐).
- 목업·서울시 폴백 목록은 8번 표(search-schema.js, data.js, guest-sections.js, tutor-home-seed.js, tutor-reg/store.js, student-reg/store.js, hope-region-masters.js, tutor-ui/state.js, study-room-ui/state.js, exposure-data.js, mypage/preview-data.js 등).
- 티켓 순서: 17a 집계 서버 → 17b 검색 서버(구 id만) → 17c 검색 화면 → 17d 표기·게스트 기준·목업.
- 미확인: 카카오 서울 표기, 게스트 박스 search() 실제 total.

## 2026-10-01 178-17a·17b 수락 (로컬 미커밋·미배포)
- 17a: src/Region/RegionGuLink.php 신규(상수 GUEST_BASE_DONG_CODE=11680101, GUEST_BASE_GU_OFFICIAL_CODE=1168000000), SearchService::guestAxisCounts id 기반(공부방=대치동 id, 과외=강남구 id, 학생=과외칸 강남구 id 또는 공부방칸 강남구 소속 동 id; 분기라 중복 없음 종현 확정). 로컬 공부방1/과외0/학생0.
- 17b: 과외·학생 검색은 is_selectable=1 id만. 라벨/부모 id/문자 지역은 422 「지역은 구(시·군)까지 선택해 주세요.」. 공부방 경로는 그대로. regionLabelToken은 공부방 전용.
- 주의: 17c(화면)가 id를 보내기 전까지 라벨을 보내는 화면(찾기 지역칸, tutor-activity-chart.js, 홈 분포 등)은 422. 17b와 17c는 반드시 같은 배포.
- PHP 실행 미확인(php -l 불가). guestAxisCounts 실제 호출 미확인 → 배포 후 홈 박스 숫자 라이브 확인.

## 2026-10-01 178-17c 수락(조건부, 로컬 미커밋·미배포)
- 과외쌤 탭·학생 탭 과외 분기: region-cascade 구 단위 선택, 구까지 끝나야 요청(guPickIncomplete), 요청은 tutor_region_id / preferred_region_id 숫자만, 옛 라벨 URL은 지역 조건 제거, 홈 분포(tutor-activity-chart.js)는 id 기준이고 못 세면 「—」.
- 열린 문제(점검 필요): 학생 탭의 공부방 분기와 공부방 계정의 학생 찾기는 동 라벨/동 id로 좁히던 경로인데, 17c에서 라벨을 지우고(search-api.js promoteRegionLabelFilters, runFindSearchWithFilters의 promo region id 제거) 서버 17b는 동 id·라벨을 422로 거절 → 공부방 분기 학생 지역 필터가 지금 어떻게 동작하는지 미확인. 동→구 소속(RegionGuLink::dongIdsUnderGu)을 쓰는 방식이 후보.
- 미확인: 브라우저 실제 요청, Playwright 미실행. search-region-feed.js 목업 라벨 비교는 17d.

## 2026-10-01 178-17c-2 수락 (로컬 미커밋·미배포)
- 공부방 희망 학생 검색: preferred_studyroom_region_id(unit_level='dong' id)만 = 같은 동만(구로 넓히지 않음, 종현 확정). 동 id 확정은 ensureRegionFromKakao 재사용. 못 얻으면 「동을 다시 선택해 주세요」, 요청 안 나감. 공부방 계정 홈 학생 목록도 동 id로. 과외 희망은 구 id 유지. 동 id+구 id 동시 422.
- 라이브 확인: 학생 탭 공부방 희망 동 선택 요청, 과외 희망 구 선택 요청, 공부방 계정 홈 학생 목록(홍보1 동 id), 동 id 확정 실패 안내.
- 남은 것: 17d(표기·게스트 기준·가드) → 17e(목업 제거).

## 2026-10-01 178-17d 수락 (로컬 미커밋·미배포)
- location-display.js: 과외 축 tutorAxisLabel(시도·시·군·구 유지, 동 제외), BROAD_REGION_ONLY는 GPS 출처일 때만. REGION_COORDS 서울시 폴백 제거. 게스트 기준: GUEST_BASE_GU_OFFICIAL_CODE='1168000000'(프런트 유일 코드), loadGuestBaseline(region-stats axes.room + cities 기준 구 행), 게스트 과외·학생 문구 「서울시 강남구」(guestSidoShort, 게스트 전용), 행 없으면 「위치를 선택해 주세요」.
- 학생 카드 라벨 분기별(SearchService 994–1002, search-exposure-mapper normalizeApiRegionLabel), AdminExposureRepository::regionDisplayExpr, TutorPositionAxis::cityLabel 구 이름 표시, 게스트 localStorage 오래된 값(discardStaleGuestLocation) 정리.
- 남은 것(17e): search-tier-render.js:26 「|| '서울시'」, MOCK_TUTOR_REGIONS·MOCK_REGIONS·MOCK_RESULT_ROWS(search-schema.js), REGION_COORDS(location-display.js), data.js GUEST_DEMO_REGION(대치동·강남구)·지도 좌표, exposure-data.js 대치동 location_label, naver-map.js 대치동 기본 중심, guest-sections.js 지도 좌표 37.4946/127.0626, tutor-reg/store.js·student-reg/store.js 목업 region_id, hope-region-masters.js 폴백, tutor-ui/state.js id1 대치동, study-room-ui/state.js 목업, mypage/preview-data.js 강남구 대치동.
- 미확인: 브라우저에서 게스트 기준 API가 문구를 채우는 동작, 호스트 php(컨테이너 php -l은 통과).

## 2026-10-01 178-17e 수락 (로컬 미커밋·미배포)
- 지역 목업 제거: search-schema(MOCK_*), search-region-feed(목업 풀), search-map, location-display(REGION_COORDS), naver-map(이름→중심 표), data.js(GUEST_DEMO_REGION·REGIONS), exposure-data, 등록 store 4종, hope-region-masters, tutor-ui/study-room-ui state, layout.js, neighborhood-greeting-ui, search-exposure-mapper. 서버 값 없으면 빈 값·「위치를 선택해 주세요」·기존 빈 상태.
- 지도 중심: regions에 좌표 칼럼 없음 → preview/shared/naver-map.js GUEST_MAP_CENTER(37.4946,127.0626, 대치동 부근) 한 곳. 공식 지오코딩 아님 → 종현 결정 필요(최종검수에서 기준 행 기반 좌표로 교체 여부).
- 남은 문자열(허용 밖): auth-ui login-stage.js:73 「대치동 데모」, student-reg/screens.js:359 예시문구, admin/a28-screens.js:287·marketplace-lab-store.js:97,99 가짜 주소, messages/thread-store.js 585–715·compose-flow.js:43 쪽지 목업, concern/store.js:54 닉네임. 지역 무관 목업: exposure-data 상호·수강료·이미지·유튜브, data.js DUMMY_STUDENTS/MY_STUDY_ROOM/MY_TUTOR, 마이페이지 미리보기 이름·이메일.
- 미확인: 브라우저에서 게스트 빈 상태·서버 목록 동작.

## 2026-10-01 178-17f 수락 (로컬 미커밋 → 배포 묶음 포함)
- naver-map.js: GUEST_MAP_CENTER=대치역(37.494511,127.063369; 위키데이터 Q100860 P625, 조회 2026-10-01), MAP_DEFAULT_ZOOM=17(네이버 신규 타일 최대 21−4). 줌 13/14/16 제거, clampNeighborhoodZoom 13–15 제한 제거, 이름→중심 표 삭제. fitBounds(핀 2개 이상)는 maxZoom 없이 기존대로.
- 최종검수: 카카오 장소검색(SW8, 대치역) 교차 확인(키 필요), 네이버 키 환경에서 map.getMaxZoom()=21 및 줌 17 실제 적용 확인, fitBounds 과확대 여부.
- 지역 묶음 배포 범위: 178-14,15,16,17a,17b,17c,17c-2,17d,17e,17f. 운영 SQL 072→073 선적용 후 배포. 17b·17c 동시.

## 2026-10-01 지역 묶음 배포 완료
- 커밋 67b9a63(13bc179..67b9a63), Deploy to dothome SUCCESS, 49개 파일. 범위: 178-14~17f. 운영 SQL 072→073은 사용자가 적용(배포 전).
- 라이브 확인(사용자, 낮): 게스트 홈 박스 수치·「서울시 강남구」 문구, 과외 구 선택·학생 공부방 희망 동 선택 요청, 공부방 홈 학생 목록, 「동을 다시 선택해 주세요」 안내, 지도 중심·줌 17.
- 다음: 157-4 → 158 → 159 → 162 → 178-9 → 178-10 → 146~180 최종검수.

## 2026-10-01 157-4 수락 (로컬 미커밋·미배포) / 157-5 점검 결과
- 157-4: 상품센터→유료상품 페이지 안내문(plans/index.js), 고객센터 홈 박스 3개 제거(이용안내·안전과외·커뮤니티; 5개 3+2), 로그인 「대치동 데모」 화면 제거, 레일 「지금 고민 HOT」, 홈 레일 추천 카드 1개 제거(HOME_SEASON_ACTION_CARDS 배열 한 곳), 홈 박스 「공부방 카달로그」「과외쌤 카달로그」「우리동네 학생」, 소개 페이지 제목 3개 「…카달로그」.
- 157-4 라이브 확인: 홈 상단 3박스 표기 일관성(학생 박스는 우리동네 학생, 학생 카달로그는 소개 페이지 제목에만), 고객센터 홈 3+2 정렬, 관리자 홍보 칩에 새 제목 노출, 남은 「상품센터」(plans/screens.js 1706, mypage/paid-screens.js 148 링크·탭).
- 157-5 사실: (1) 「보드」 화면 노출 7곳(concern/screens.js 136·149·173·211, concern/copy.js 14, submission-copy.js 60, admin/a28-screens.js 577). (2) 자료실: 다운로드 항상 불가(LIBRARY_FILE_DOWNLOAD_IMPLEMENTED=false), 데이터는 LIBRARY_SEED(시드), 개발용어 노출(library-copy.js 13·15, support/screens.js 418–422, library-store.js 53) → 구정책·시드 정리 대상, 운영 DB 자료 행 미확인. (3) 로그인 첫 화면=실루엣+로고 워드마크, 가입 첫 화면=약관 체크목록(히어로 없음), 글꼴 Pretendard(jsDelivr)·Noto Serif KR(Google Fonts) 외부 로딩, 자체 폰트 파일 없음 → 최종검수: 외부 폰트 로딩 정리. (4) 고민 HOT: 인기글이 서버 API 아닌 시드(concern/store.js 279, 54행 이후; 4행 주석 서버 저장 API 미구현) → 가짜 데이터 정책과 충돌, 최종검수·서버 연동 필요. 게스트는 글 목록 불가라 소개카드만, 소개카드는 제목이 2번 반복. (5) 「브랜드 소개」 박스(RAIL_MEDIA_TEASER)는 소개 페이지 링크, 창업·교육청·운영 팁 채널 없음. (6) 레일 제목 공통 마크업 live-rail-slot__head, 색 띠 없음, 배경 밝음. (7) support_notices에 대상 역할 칼럼 없음, 홈 기본 레일에 공지 미노출(고객지원 레일만), 목록·API 역할 필터 없음.
- 공지 정책(종현 확정): 대상 식별자 전체·공부방·과외쌤·학생. 게스트=전체, 학생=전체+학생, 공부방·과외쌤=고객센터에서 전부(모니터링). 홈 3줄은 전체+내 역할만, 더 보기→고객센터 공지.

## 2026-10-01 157-6 수락 / 157-7a 점검 / 157-9 시작
- 157-6 수락(로컬 미배포): 「보드」→「게시판」 화면 문구 7곳.
- 157-7a 사실: 고민방 글·댓글·반응은 서버 호출 없이 concern/store.js 로컬 전용, 운영 빌드에서는 0건·저장 불가. 서버 board_posts는 목록 읽기만, 쓰기·삭제 차단(BoardPostService.php:150·184), 댓글·반응 테이블 없음, 인기 정렬·닉네임 가림 없음.
- 종현 결정: 우동공과 자체 게시판 엔진에 고민방 글쓰기·댓글·반응 서버 저장 구현. 157-9a(점검)→9b(서버)→9c(화면 연결)→9d(레일 연결). 홈 고민 HOT은 실제 글만, 게스트는 소개 카드(제목 중복만 수정).
- 검수 원칙: 「겉치레 완료」 방지. 완료 기준은 새로고침 후 DB 보존을 코드 경로로 증명.
- 최종검수 추가: 화면만 있고 서버 저장이 없는 기능 전수(자료실 다운로드·시드, 공지 등).

## 2026-10-01 종현 확정: 제출함 폐기 방향 / 자료실 라이브 오작동
- 제출함(submission-board)은 심사·승인용 자료를 받지 않으므로 불필요(다른 용도가 생기지 않는 한). 구알고리즘 잔재로 최종검수 때 걷어낼 대상(채널·화면·관리자 제출큐·서버 쓰기 경로·ACL).
- 자료실: 라이브에서 제대로 안 열림(증상 상세 대기). 다운로드 항상 불가·시드 데이터. 정책 결정 필요.

## 2026-10-01 157-8 반려 → 157-8b / 157-9a 점검 수령
- 157-8 반려 사유: ① 고객센터 목록이 fetchNotices()를 역할 없이 호출(support-backend.js:46)해 서버 필터 미적용 ② 공지 출처 이원화(isOperationalBoardApiActive면 board_posts notice 경로=targetRole 없음, 157-8은 support_notices에만 추가) ③ 홈 3줄 폴백이 대상 필터 무력화 ④ 서버가 주소의 nav_role을 신뢰(세션 역할 아님). 157-8b로 정본 일원화·세션 필터 지시. 074_notice_target_role.sql은 8b 결과에 따라 삭제 가능(미적용).
- 157-9a 사실: 서버 쓰기는 submission/operational만(save 150행 차단), concern 읽기 목록만. 댓글·반응 테이블 없음. 최신 마이그레이션 074(미적용). users에 닉네임 없음, 표시명은 tutors.tutor_display_name / study_rooms.operator_display_name / students.public_display_name. PHP 테스트 없음. 관리자 신고·숨김 고민방 미연결. 레일 API 후보 A(posts.php 파라미터)/B(concern-hot.php 신규).
- 제안(사용자 확인 대기): 고민방 표시명=역할별 표시명, 없으면 「회원+번호」.

## 2026-10-01 자료실 정책 초안 (종현 방향, 세부 확정 대기)
- 자료실 3개 모드별(공부방/과외쌤/학생). 올리기=유료 사용자, 읽기=모두, 다운로드=횟수제 제안(게스트 미리보기, 무료 일일 N회, 유료 무제한, 업로더 보너스) 확정 대기.
- 건별 검수 없음. 업로드 전 셀프 체크 5문장(직접 제작·허락, 무단 복사 없음, 개인정보 없음, 저작권 책임 본인, 관리자 삭제·제한 동의) 모두 체크해야 업로드. 동의 일시·내용 서버 저장, 신고 누적 시 자동 숨김 후 관리자 확인. 법률 문구는 전문가 검토 권장.
- 자료실 셀프 체크는 큰 항목 3개(① 내 자료·사용 허락 ② 개인정보 없음 ③ 책임 본인·관리자 삭제 동의)로 축소, 하위 문장은 작은 글씨 안내. 3개 체크 시 올리기 활성, 동의 일시·문구 버전 서버 저장, 연속 업로드는 한 번 체크 후 여러 파일 허용 검토.
- 종현 확정(2026-10-01): 고민방 글 작성자는 블라인드하지 않는다(책임감·무게감). 실명(users.name) 대신 등록된 표시명(운영자 표시명/과외쌤 표시명/학생 공개명)을 그대로 노출, 비어 있으면 글쓰기 전 입력 유도. 레일 카드도 작성자 표시명 노출. 157-9b에 반영.

## 2026-10-01 자료실→그누보드 커뮤니티 이전 방향 (노션 23장 확인)
- 노션 23장(2026-09-17): 회원 정본=우리 users, GNU 별도 사이트·DB, 첫 진입 자동 생성·자동 로그인, 글·댓글·파일 비공유, submission 증빙 채널 폐기 잠금.
- 종현: 모든 자료는 커뮤니티(그누보드)로. 우동공과 상단 URL 배지 하나. 자료실 화면·시드·다운로드 구현은 우동공과 안에서 걷어내고 고객센터 자료실 박스는 「커뮤니티 자료실 ↗」 바로가기로 대체 제안. 저작권 셀프 체크 3개는 그누보드 글쓰기에 적용할 내용으로 이관. 커뮤니티 URL 미확정 시 배지 숨김 제안.
- 고민방은 우동공과 게시판 엔진 채널 유지(157-9b~d). 베스트 3등: 홈 본문 홍보 박스 아래 가로 띠, 레일 HOT은 최근 7일, 게스트 제목만. 베스트 노출 범위(자기 방만/서로 보기)는 미확정, 우선 자기 방만.
- 최종검수: 자료실 화면·LIBRARY_SEED·제출함(submission) 관련 코드·테이블 제거.
- 종현 확정(2026-10-01): 우동공과 자료실은 관리자 업로드 전용, 처음 만나는 문제 해결·팁만 분류항목으로 담음(모드별 3개 유지). 회원 업로드·다운로드 횟수제·셀프 체크는 그누보드 쪽으로 이관. 분류 초안: 공부방(처음 시작/학부모 상담/노출·홍보/운영 문제), 과외쌤(교육청 등록/학부모 상담/프로필/수업·정산), 학생(선생님 고르기/첫 상담 준비/쪽지·찜/자주 겪는 문제). 하단 커뮤니티 배지, URL 미정이면 숨김.
- 종현 정정(2026-10-01): 우동공과에는 가장 기본·핵심 게시판만 운용. 각 모드 주체(공부방·과외쌤·학생)가 올리는 글=모드별 고민방 각 1개 게시판(글·댓글·대댓글·반응·베스트, 셀프 체크는 필요 시 이 글쓰기에 적용). 관리자 제공 콘텐츠·팁·자료는 그누보드 커뮤니티로. 우동공과 자료실 별도 구축·관리자 업로드 자료실은 하지 않음(자료실 메뉴는 커뮤니티 바로가기로 대체 또는 제거, 최종 결정 필요).
- 종현 재정정(2026-10-01): 자료실은 취소하지 않음. 우동공과 자료실=간단 운용(관리자 업로드, 처음 만나는 문제 해결·팁, 모드별 3개 분류), 많은 팁·콘텐츠는 그누보드 커뮤니티로. 고민방(모드별 1개 게시판)과 별개로 둘 다 유지.
- 종현 재정정(2026-10-01): 회원 활성화를 위해 우동공과 자료실에도 회원 업로드(유료 사용자 업로드, 읽기 모두)와 저작권 셀프 체크 3개를 유지. 분류항목만 간단하게. 관리자 팁·대량 콘텐츠는 그누보드 커뮤니티.

## 2026-10-01 157-8b 검수
- 정본 board_posts.meta_json.targetRole 일원화 확인, support_notices 쪽 target_role 코드·074 SQL 제거 확인. 결함: BoardPostService::navRoleFromAuth()가 미로그인·미인증·알 수 없는 role_type을 'parent'로 반환 → 게스트가 전체+학생 공지를 받음. view 파라미터 생략 시 필터 우회. 157-8c 발행. 8c 수락 전까지 157-8 미수락.
- 종현 아이디어: 매달 콘테스트(홈 라이브감). 종류·심사·상품 미정, 반응·베스트 구조와 함께 설계 예정.

## 2026-10-01 157-8c 수락 (157-8 최종 수락)
- noticeNavRole 신설(미로그인·미인증·알 수 없는 role_type=guest), view 미지정 비관리자는 center 규칙. 로컬 수락·미배포. 배포 후 라이브 확인: 학생 대상 공지가 게스트·학생·공부방 화면에서 각각 맞게 보이는지. 최종검수: admin_level만 있는 계정 필터 동작, right-rail.js:167 공지 1건이 역할 필터 기준과 같은지, PHP 문법 검사 미수행.

## 2026-10-01 레일 공지 제거·마이페이지 공지 결정
- 종현 동의: 우측 레일 공지 제거, 공지 정본은 게시판 하나 유지, 마이페이지에 같은 공지를 「내 공지」로 표시(새 게시판 없음), 고객센터 공지 목록은 「더 보기」 도착지로 유지. 157-7(레일 정리)·157-10a(마이페이지 점검) 발행.

## 2026-10-01 157-7 수락 / 157-10a 결과 / 157-10 발행
- 157-7 수락(로컬·미배포): 레일 공지 제거, 소개 카드 중복 제목 수정, 슬롯 색 띠(live-rail-slot__band), RAIL_PROVIDER_INFO(href 비면 미생성), 역할별 카드 수(게스트3·공급자3·학생1). 배포 후 라이브: 색 띠 모양. 최종검수: 레일 정보박스 주소 확정 시 상수 1곳 입력.
- 157-10a 결과: 마이페이지 단일 진입 renderMypageScreen(screens.js:101), 공지 캐시 hydrate 이미 됨, 읽음 기능 없음, 홈 strip은 private. 157-10 작업 티켓 발행: 입구 화면 3곳에만 「내 공지」 3건(홈 필터), 새 글=3일, 더보기 #/support/notice.

## 2026-10-01 발행 순서
- Cursor는 멀티 작업 불가: 한 건씩 전달. 순서 157-10(마이페이지 공지) → 157-9b(고민방 서버, 075 마이그레이션: 댓글 2단계·반응 3종·신고 3명 자동숨김, 인기 조회) → 9c(화면) → 9d(레일·베스트 띠). 075 운영 DB 적용은 종현 직접.

## 2026-10-01 157-10 수락 (로컬·미배포)
- 마이페이지 입구 3곳 「내 공지」 3건(noticeHomePosts 캐시), 새 글 3일, 더보기 #/support/notice, 홈 strip export만. 배포 후 라이브: 카드·등록 패널 간격, 모바일 말줄임, 3역할 입구 노출. 최종검수: 읽음 저장 없음(날짜 기준 새 글만).

## 2026-10-01 157-9b 반려 → 157-9b2 발행
- 결함: ①숨김(신고 3명) 글이 목록에 노출(deleted만 필터) ②삭제·숨김 글 수정 시 published로 부활 ③comments.php 목록에 권한/게시상태 검사 없음 ④concern-hot 방별 읽기 권한 무시(본문·작성자 노출) ⑤reactions/reports 유니크 키가 comment_id NULL이라 글 대상 중복 허용(코드로만 방지) ⑥저장 시 htmlspecialchars 이스케이프 → 9c 이중 이스케이프 위험(원문 저장·출력 시 1회 이스케이프로 통일).
- 075는 운영 미적용 상태에서 파일 수정. 보완 수락 뒤 종현 1회 적용. 최종검수: 인기/베스트 쿼리 성능(PHP 정렬), 관리자 숨김 해제 UI 없음, 반응 N+1(myReaction), 미인증 role 처리 확인.

## 2026-10-01 157-9b2 수락 (로컬·미배포·075 운영 미적용)
- 결함 6건 수정 확인(published만 노출, 수정 부활 차단, assertPostAccessible, 인기·베스트 canList 필터, comment_id NOT NULL DEFAULT 0, 원문 저장). 게스트는 인기·베스트에서 빈 배열(방 소개 카드만 정책과 일치). 베스트 띠를 게스트에게 제목만 보일지는 9d에서 결정. 157-9c(화면 연결) 발행. 075 적용·라이브 글쓰기는 종현. 최종검수: PHP 문법 검사 미수행, 관리자 숨김 해제 UI 없음, 인기·베스트 PHP 정렬·N+1(myReaction/mapComment 집계), 075 board_posts.status ENUM 변경 잠금.

## 2026-10-01 게스트 제목만 정책(종현 제안, 가능한 범위에서 기존 정책과 맞춤)
- 게스트: 4개 방 글의 제목·방 이름·날짜·반응 수·댓글 수만, 본문·작성자 이름 비공개, 제목 클릭 시 로그인 안내. 레일 HOT·베스트 띠도 제목만. 서버 보완은 9c 뒤 157-9e로 발행(목록·인기·베스트의 게스트 응답, 공급자 전용 방 제목 노출 여부 확인).

- 게스트 제목만 정책 종현 확정(2026-10-01 19:36). 9c 결과 검수 후 157-9e 발행.

## 2026-10-01 157-9c 수락 (로컬·미배포) / 157-9e 발행
- 9c: concern/store.js·screens.js 서버 API 연결, 로컬 저장 제거, 캐시 reset 연결. fetchHotPosts/fetchBestPosts는 호출처 없음(9d). 최종검수: alert() 안내를 사이트 UI로, 글 종류(type) 선택 서버 미지원, 글 수정 화면 없음, 목록 서버 정렬·페이징 없음, concern-hot 스키마와 목록 스키마 정규화, 레일 getLatestConcernSamples는 방문한 방 캐시만 사용, copy.js SEED_COMMUNITY_BOARDS는 방 메타(글 시드 아님).
- 9e: 읽기 권한 없는 사람(게스트·학생의 director/tutor 방)은 제목만(본문·작성자 없음). 이후 9d(레일·베스트 띠).

## 2026-10-01 19:50 157-9c 수락 철회 -> 157-9c2 발행
- 종현: 기능 누락 금지, 지금 전부 구현. 9c의 type 선택 제거·수정 화면 없음·클라 정렬·alert 안내는 최종검수로 미루지 않고 9c2에서 구현. 큐: 9c2 -> 9e -> 9d. 앞으로 Cursor 보고의 서버 부족/범위 밖 항목은 수락하지 않고 즉시 보완 티켓.

## 2026-10-01 20:00 157-9e 수락 (로컬·미배포)
- 제목만 응답(7필드) BoardPostService::listConcernTitles + ConcernService::mapTitleOnly/mapHotTitleOnly, accessKind titles. 쓰기 API 게스트 401 유지. 큐: 9c2(+9e 보충) -> 9d.
- 최종검수: PHP 문법 검사 미실시(9b/9b2/9e 전부), concern/ alert 10건은 9c2에서 제거 대상.

## 2026-10-01 20:10 게스트 기본 위치 이슈 -> 178-18a 점검 발행
- 정책: 게스트 공부방=대치동(카드 없으면 빈 채), 과외쌤·학생=서울 강남구 전체. 표기 공부방 대치동/과외쌤·학생 강남구. 샘플은 수치에 포함 제안(샘플 제거 때 같이 걷어낼 한 곳). 찾기 3화면 지역 목록 로드 실패 오류도 점검. 큐: 9c2 -> 178-18a -> 178-18b -> 9d.

## 2026-10-01 20:30 157-9c2 수락 (로컬·미배포) / 157-9d 발행
- 9c2: type(meta_json), 본인 글 수정(403/404/422), 서버 sort·type·limit/offset·total, alert/confirm 0건, 매퍼 통일(mapListItem/mapTitleOnly), 키 난수 버그 수정. 한계: 정렬·자르기 PHP 처리(글 수천 건이면 SQL화), PHP 문법·DB·브라우저 미확인(075 적용 후 라이브 글쓰기·종류·수정·더보기 확인).
- 9d 발행: 레일 HOT/최신 서버 연결, 이달의 베스트 띠(위치 상수, 홈 프로모 박스 아래), 게스트 제목만. 큐: 9d -> 178-18a -> 178-18b.

## 2026-10-01 21:10 157-9d 수락 (로컬·미배포) / 157-9f(문서 정정) 발행
- 9d: 레일 HOT/최신/베스트 서버 연결, 캐시에 계정·역할 기록, 베스트 띠 상수 HOME_BEST_STRIP_PLACEMENT=after_trio, 0건·실패 시 DOM 없음. 결정: 정본 문서(09-main-screen-roles.md)를 게스트 제목만 정책에 맞게 고침(되돌리지 않음).
- 라이브 확인: 게스트 로그인 직후 레일 갱신, 띠 위치, 글 0건 때 칸 사라짐. 상세 슬롯(detail/plans)엔 고민방 미연결(관리자가 추가해야 최신 모드 사용). fetchHotPosts/fetchBestPosts는 실패 시 throw(스토어 내부만 사용).
- 큐: 9f -> 178-18a -> 178-18b. 고민방 묶음(9b~9f) 배포는 075 운영 적용과 함께 사용자 「배포」 대기.

## 2026-10-01 21:45 157-9f 수락 (문서, 로컬) / 157-9g 발행
- 9f: 09번 문서 정정, 해결후기는 공부방·과외쌤도 작성 가능(코드 기준 예외). intro_only는 실제로 allow와 동일(block만 게스트 숨김). canShowBoardInRail 정의는 board-channel-acl.js.
- 9g: 29·30·internal 23 문서와 intro_only 주석 5곳 정정(동작 변경 금지). 큐: 9g -> 178-18a -> 178-18b.

## 2026-10-01 21:55 157-9g 수락 (문서·주석, 로컬) / 157-9h 발행
- 9g: 29·30·internal23 문서, intro_only 주석 정정(동작 변경 0). 파일 경로 정정: board-channel-acl.js 등은 preview/home-ui/src 바로 아래.
- 9h: board-channel-acl.js:432/450/208, BoardChannelAcl.php:430, empty-state-copy.js:73/79 「소개만 볼 수 있어요」 문구 추적·정정. 큐: 9h -> 178-18a -> 178-18b.
- 남은 확인: docs/internal/23-board-menu-boundary-audit.md:170-171은 값만 적혀 있어 유지.

## 2026-10-01 22:00 157-9h 수락 (로컬)
- board-channel-acl.js 431/450 문구 2줄 정정. 나머지(432, 208, empty-state-copy room_only/tutor_only 미사용, php 430)는 고민방 화면에 안 떠서 유지. 게스트 0건 화면은 방 이름+로그인 안내(소개문 없음) 유지.
- 문서 후속: docs/ssot/29:47 예시 문구 「소개만 볼 수 있어요」 정리(배포 비포함 문서).
- 고민방 묶음 로컬 수락 완료. 배포 전 사용자가 075 운영 적용 -> 「배포」 지시 대기. 이후 178-18a.

## 2026-10-01 22:55 배포 (157 묶음)
- 501100c push 후 CI의 PHP Board ACL 3개 검사 실패(intro→titles). 157-9i로 검증 스크립트·JS getBoardAccess·canDeleteBoard 정렬, 커밋 57157f7, Deploy to dothome SUCCESS. 운영 사이트 200 확인만 됨.
- 대기: 종현이 075 SQL 운영 적용 + 라이브 글쓰기/댓글/반응/신고/제목만/HOT/BEST/내 공지 확인. 그 전엔 「서버 연결 완료」 기록 금지.
- 최종검수 추가: board-api.js에서 서버가 titles를 안 줬는데 로컬 판정이 titles일 때 빈 목록에 access:titles가 실리는 경우(노출 없음, 정리 대상). JS canDeleteBoard는 화면 미사용.

## 2026-10-02 사이트 점검 추가 (종현 t1022u)
- 학생모드 마이페이지>내 등록>기본정보: 희망지역 칸에 「지역 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.」 표시, 지역 변경 불가. 마이프로필에는 「대치동」 정상 표시. 학생 노출 follow-up 티켓(학생 기본정보)에 묶어 원인(지역 목록 API 호출/regions.php 경고/로그인 학생 경로) 조사·수정.

## 2026-10-02 결정·진행 정리 (우동공과2)
### 확정 결정
- 게스트 위치: 공부방=「대치동」, 과외쌤·학생=「서울시 강남구」. 「위치를 선택해 주세요」 금지. 샘플은 같은 지역 라벨, 합계에 넣지 않음.
- 우측 레일: 고민방·HOT·이달의 베스트는 0건이어도 구역·배너 제목 유지. 서버 실패와 0건 구분. 감성 문구 기본안(미도착중 계열) 한곳에 모아 관리.
- 정보 게시판 2개(공부방을 위한 쏙쏙정보 / 과외쌤 따끈 팁가이드): 쓰기=관리자+유료 공급자, 공부방·과외쌤 서로 전체 열람, 게스트 제목만, 학생 칸 없음(제안), 분류 각 4개.
- 공지: 홈·마이페이지 「더보기」는 공지게시판 팝업(페이지 이동 없음).
- 학생 노출: 기본정보 전부 입력해야 베이직카드 노출, 중도 이탈은 절대 노출 금지, 재로그인 시 처음부터 다시.
- 요청문: 열람권 폐지, 학생 숨김 기능 없음. 원문은 「픽·프라임 이용 중」 유료 공급자·관리자·학생 본인만. 그 외 서버가 빈 문자열(키 유지).
- 학생은 공급자가 먼저 보낸 쪽지에 무료로 답장 가능(18§3). 학생→학생 첫 쪽지는 불가.
### 무결성 진행 (모두 로컬 수락·미배포, 커밋 없음)
- 무결성-1 서버 ok() 덮어쓰기 수정: 수락.
- 무결성-2 요청문 원문 유료 공급자 한정(StudentRequestTextAccess 단일 기준): 수락.
- 무결성-3 skip_ticket_consume 클라이언트 우회 차단, 쪽지방 요청문은 학생 DB값 사용: 수락.
- 무결성-3b 쪽지방 생성 트랜잭션화, 배지·힌트 서버 계산: 수락(차감 쿼리·알림은 3c).
- 무결성-4 학생 답장 허용(permissions.js 1줄): 수락(상대 차단은 4b).
- 진행 대기: 3c(차감 UPDATE remaining>0 + 영향행 확인, 알림 커밋 후), 4b(상대 차단 양방향).
### 남은 무결성 (3c·4b 제외)
1. 학생 노출 후속(완성 시 노출·수정으로 비면 내림·지역 메모 불인정·관리자 되살림 검사·필수 항목 불일치·저장 검증·500 메시지 노출 + 희망지역 목록 오류).
2. ok 덮어쓰기 잔여 4곳: cron/paid-reminders.php:27, site/public-settings.php:39, auth/phone/send-otp.php:39, verify-otp.php:44.
3. assertComposeDirection 비어 있음(학생→학생 첫 쪽지), 알 수 없는 role_type=학부모 취급.
4. 학생이 공급자 홈·일부 마이페이지 직접 접근, inferSchoolLevel 학년 망가짐, 학생 수 0/2+ 막다른 문구, request-access.php 빈 줄, verify 「찜한학생」→「관심 학생」, 로그인 창 현상.
### 최종검수 추가
- 쪽지 작성 창 미리보기 배지(클라이언트 계산)와 전송 후 서버 배지가 다를 수 있음.
- structured_line은 정리(태그·길이)만 적용, DB 값 재구성 안 함.
- 쪽지 잔액 알림 커밋 전 발송(3c에서 처리), 첨부 파일 롤백 시 디스크 잔존.
- 관리자·학부모 학생 대상 새 쪽지는 쪽지권 검사 면제(원 정책, 확인 필요).
- 옛 문서 정리 대상: ssot/13:99,151, ssot/16:21,119,174,259(paid_only·열람권), ssot/18 다수(40,59,86,95,104,114,152,184,243,253,271,332,471,481,495,498,502), ssot/09 §레일 0건 문구(09:361, docs 29·30 동일 문장).
- 학생 대상 새 쪽지의 has_request_summary 필터는 누구나 요청문 유무를 알 수 있음(현 정책 유지, 재검토).
- (10-02) 무결성-3c 수락: 쪽지권 차감 단일 UPDATE(remaining>0, 영향행 1), 알림은 커밋 후. 무결성-4b 수락: 차단 양방향(보내기 전 검사·isBlocked), 새 컬럼 없음.
- (10-02) 쪽지 차단 해제 기능 없음(정본 16에도 해제 규정 없음, 「차단 목록·안내 요약 △」만). 정책 확인 항목: 쪽지 차단을 해제할 수 있어야 하는지.
- (10-02) 무결성-5 지시문(ok 잔여 4곳·쪽지 첫 방향 검사·역할 폴백) 발행.

## 2026-10-02 학생 노출 후속 — 정본 대조표(초안, 종현 확인 대기)
순서 규칙(종현 t1037u): 노션 정본 → 내부 문서 순으로 참조, 충돌 시 내부 문서(최근 정책)가 잠금.

| 항목 | 노션 정본 | 내부(최근 잠금) | 현재 코드 | 차이 |
|---|---|---|---|---|
| 노출 시점 | 19장 §4-4: Basic 카드 노출은 기본, 입력한 만큼 반영 / 9장: 가입 필수정보 → 기본 노출, 운영자 심사 없음 | 기본정보를 모두 채워야 베이직카드 노출. 중도 이탈은 절대 노출 금지 | 가입 시 draft, published 전환은 StudentHubService::publish 뿐이고 호출 화면 없음 → 기본정보를 다 채워도 노출 안 됨 | 내부 잠금으로 가면 서버가 기본정보 완료 시 노출로 전환해야 함 |
| 이탈 후 재개 | 19장: 마지막 입력 단계부터 이어서 / 14장: 다음 로그인 때 기본정보부터 다시 | 처음부터 다시(양이 적음). 임시저장 이어가기는 복잡하면 생략 | 미구현 | 내부 잠금(처음부터 다시) 적용 |
| 기본정보 칸 | 아홉 칸: 표시명, 학교급/학년, 희망유형, 희망지역, 희망과목, 수업형태, 수업인원, 예산, 한 줄 요청문 | (동일, 086/087 수락) | 서버 publishMissing은 옛 19장 기준 14개+상세(희망 과외쌤 성별, 출생연도, 성별, 강의스타일 등)까지 요구 | 노출 판정 기준이 아홉 칸과 다름 → 아홉 칸 기준으로 통일 필요 |
| 지역 조건 | 희망지역 필수 | 지역 메모(note)로 통과하면 안 됨 | region_label(메모)로 통과 | 수정 필요 |
| 관리자 되살림 | 심사 없음이나 노출 조건은 동일 | 동일 조건 적용 | AdminExposureService 무검사 | 수정 필요 |
| 희망지역 목록 오류 | — | — | regions.php 7번 줄 경고가 JSON 앞에 출력 → 파싱 실패 → 「지역 목록을 불러오지 못했습니다」. 로컬 수정 완료·미배포 | 배포 시 해소. 로그인 학생 전용 원인은 추가 없음 |

## 2026-10-02 무결성-5 수락(로컬, 미커밋·미배포)
- Must1·2·5 수락: 4곳 array_merge 교정, 동일 패턴 전수 검색 완료, 기존 무결성 변경 보존. 직접 diff 확인.
- Must3 부분: 학생/학부모→학생 첫 쪽지 서버 차단(신규 thread에서만, 답장·후속 제외). 공급자→공급자 첫 쪽지는 정본 16§1-2에 없는 방향인데 화면은 허용 → 종현 정책 확인 대기.
- Must4 부분: plans/profiles.js:53만 guest로 교정. 미결: profiles.js:52 admin→parent, site-nav-config.js:223 navRoleFromAuthUser, state.js:138·296, mypage/shell.js:70, neighborhood-greeting-ui.js:548, exposure-render.js:937, src/Board/BoardPostService.php:384(서버 unknown→parent). → 무결성-6으로 처리(최소권한: 알 수 없는 역할=guest, admin은 별도 처리).
- 학생 노출 정본 대조 확정(2026-10-02): 한 줄 요청문은 선택, 나머지 여덟 칸이 차면 노출.
- 종현 확정(2026-10-02): 공급자↔공급자 첫 쪽지는 상호 허용·상호 무료. 현재 코드(허용, 쪽지권은 student 대상만 차감)와 일치 → 코드 변경 없음. 정본 ssot/16 §1-2 표에 「공급자 ↔ 공급자 선연락·답장 free」 행 추가 필요(문서 정리 목록).

## 2026-10-02 무결성-6 수락(로컬, 미커밋·미배포) / 6b 발행
- 수락: 지정 7곳 + 추가 11곳(서버 LoginService·AccountContactService·AuthController·callback.php·BoardPostService 포함). 원칙: 알 수 없는 역할·대기=guest, guardian_student만 parent, admin은 학부모 화면 아님. 서버 diff 직접 확인.
- 동작 변화: 활성 역할이 없는 계정은 이제 학생이 아니라 손님으로 로그인.
- 무결성-6b 발행: chrome-session.js의 역할 선택 대기 표시 전달(머리말이 학부모로 보이는 문제), main.js 관리자 #/parent 직접 접근, cur-006-post-verify-role 검사를 HEAD worktree에서 실제 비교.
- 관리자 쪽지함: 정본 16장에 관리자 방향 없음. 기본=관리자 쪽지함 없음(관리자 콘솔 이동 유지). 종현 확인 대기.
- 순서: 6b → 7(학생 노출).

## 2026-10-02 무결성-6b 수락(로컬, 미커밋·미배포)
- 수락: 역할 선택 대기(oauth_role_pending, 서버 me.php 기존 필드) → 머리말·홈 손님 처리(chrome-session.js, site-nav-config.js, home-ui/src/auth-session.js), 관리자 #/parent → #/admin(main.js). 임시 worktree 제거 확인. cur-006 실패 2건은 HEAD도 동일(통과 59/실패 2).
- 남은 항목(이월 (2)번에 합류): 다른 역할이 남의 홈 경로(#/parent, #/study-room, #/tutor)를 주소창으로 직접 열면 화면이 보임(데이터는 서버가 막음). 홈 경로 역할 가드 없음 → 무결성-8 후보.
- 다음: 무결성-7(학생 노출) Cursor 전달 대기.

## 2026-10-02 무결성-7 수락(로컬, 미커밋·미배포·DB 미확인)
- 수락: StudentBasicCompleteness(여덟 칸, 요청문 선택, 지역 메모 불인정) 단일 기준. 가입 저장·마이페이지 수정 재판정·학생 노출 요청·관리자 되살림·일괄 스크립트(publish-complete-student-drafts.php, 기본 dry-run, --apply는 종현이 실행)가 모두 이 함수 사용. hidden은 학생 수정으로 되살아나지 않음(transitionExposureStatus WHERE 현재상태 조건). 학생 허브 500 응답 일반 문구화. 희망지역 목록 오류 원인 확인(regions.php 경고), 학교급 저장 복원·가입 화면 단지 기준 지역 서버 요구 불일치 수정.
- 미취학 예외(학교급 미취학이면 학년 없이 통과): 정본 「학교급/학년」과 모순 없음, 수락.
- 종현 확인 대기: 예산 0원을 미입력으로 볼지(StudentBasicCompleteness::amount 한 곳). 현재 0=입력함, 카드 표시는 「—」.
- 후속 지시: RegistrationApi.php:97 공통 500 응답이 과외쌤·공부방 허브에서 예외 메시지 노출 → 한 줄 수정 티켓(무결성-7b).
- 운영 확인 대기(종현): 배포 후 스크립트 dry-run → --apply, 가입 후 카드 노출, 수정 후 카드 내림 라이브 테스트. 「서버 연결 완료」는 그 뒤에만 기록.
- 종현 확정(2026-10-02): 예산 0원도 입력한 것으로 보고 노출. 카드 표시는 「—」. StudentBasicCompleteness::amount() 현행 유지. 무결성-7b 티켓 발행(RegistrationApi.php:97 500 응답 일반 문구화).
- 종현 정정(2026-10-02 t1049u): 예산 0원은 미입력으로 본다(앞선 「0도 입력」 철회). 0이면 노출하지 않고 예산 칸을 채우라고 안내. 무결성-7b 티켓을 「amount() 0 미입력 + 클라 min=1 + 500 응답 일반 문구화」로 통합 재발행.

## 2026-10-02 무결성-7b 수락(로컬, 미커밋·미배포)
- 수락: amount() 1 이상만 입력, 가입·마이페이지 min=1 및 0 입력 시 예산 안내, 마이페이지 0 저장 버그 제거, store.js:232 정렬, RegistrationApi 500 일반 문구.
- 후속: basic-student.php:137,143 min=0 -> 무결성-7c 발행, 종현이 Cursor에 전달함(10-02 t1051u).
- 다음: 게스트 홈·찾기·우측 레일 정본 대조표(노션 정본 -> 내부 문서 순).
- 2026-10-02 무결성-7c 수락(로컬): basic-student.php:137,143 min=1, 운영은 .htaccess 302로 미도달(옛 잔재, 최종검수 때 제거). 무결성-8은 종현이 Cursor에 전달함(t1053u). 7/7b/7c 묶음 배포 대기.
- 2026-10-02 무결성-8 수락(로컬, 미커밋·미배포): route-access.js guardRoleHomeAccess(screenKey, loggedIn, navRole) 직접 확인(비로그인→#/guest, 타 역할→자기 홈, 관리자→#/admin, guest 화면 항상 허용), main.js 호출부에서 세션 확인 전 판정 건너뜀, verify-role-home-guard.mjs 56/56. 7/7b/7c/8 묶음 배포 대기.

## 2026-10-02 배포 51004c1 + 정본 대조표(188) 답변
- 배포 SUCCESS: 커밋 51004c1(68개 파일), Deploy to dothome #365 success. 무결성 1~8, 178-18b 보완, 미커밋분 포함. 별도 검사 Tutor mypage frame IA #57은 HEAD 이전부터 실패(verify-tutor-mypage-frame-ia.mjs:57 getTutorEntryPath 옛 기대값) -> 현재 구조에 맞게 검사 수정 소티켓 필요(종현 결정 불필요).
- 라이브 확인 대기(종현): 학생 가입 후 카드 노출, 수정 후 카드 내림, 고민방 글쓰기 저장. 스크립트 publish-complete-student-drafts.php는 운영 DB에서 돌리는 방법을 별도 안내 후 실행(기존 학생 없으면 불필요).
- 종현 확정(t1059u): 고민방 3개 이름 = 「공부방」「과외쌤」「학생 학부모」(「원장」 제거). 이달의 베스트 = 이번 달 글의 긍정 이모티콘 반응 합계 순(긍정 분류표는 코드의 반응 종류 보고 제안). 코드의 「반응 5 이상」 폐기. 정보 게시판 링크는 레일 배너 유지, 도착지는 고민방과 같은 게시판 메뉴 묶음(제안, 자료실과 분리). 게스트 찾기: 실카드 없으면 샘플 베이직카드 1장씩, 통계 제외. (실카드 있을 때 샘플 병행 여부는 확인 대기)
- 「프리미엄(164)」「오픈 (프리미엄)」: 소스에 없음, 화면 위치(모드·위치·스크린샷) 종현 제공 대기.
- 종현 확정(2026-10-02 t1061u, 이전 「샘플 1장+실카드」 정정): 샘플 베이직카드는 기준 지역(공부방=대치동, 과외쌤·학생=서울시 강남구)에 실제 카드가 하나도 없을 때만 1장 표시. 실카드가 있으면 샘플 금지. 통계 제외. 188 대조표의 샘플·실카드 필터 행에 반영할 것.

## 정본 운영 원칙(종현 2026-10-02 t1062u)
- 노션 정본을 새로 다시 쓰지 않는다. 노션 정본 = 기본, 내부문서에는 「새로 갱신·확정된 정책 변경분」만 기록한다(188 대조표도 이 변경분 기준으로 정리).
- 작업이 모두 끝나면 변경분만 노션에 일괄 반영(노션 쓰기는 종현의 「남겨」 때).

## 2026-10-02 종현 확정 (t1069) — 노션 반영 대기 변경분
- 고민방 이름: 「공부방 고민방」「과외쌤 고민방」「학생 학부모 고민방」 (노션 「원장 고민방」 등을 대체)
- 정보 게시판 정식명칭: 「공부방 쏙쏙정보」「과외쌤 따끈 팁가이드」. 자료실과 같은 위치(상위 메뉴 없음, #/library/* 계열), 우측 레일 배너로 연결. 읽기/쓰기/분류는 앞서 확정(공부방·과외쌤 읽기, 쓰기=관리자+유료 공급자, 분류 4개).
- 이달의 베스트: **보류**(반응 종류·기준 미정, 신규 개발 금지). 구상만 기록: 고민방 글 중 가장 많이 어필된 글, 우측 레일 맨 위.
- 레일 공지 제거 → 홈 최상단 공지 띠로 이동(노션 레일 공지 허용분을 대체).
- 게스트 공부방 위치: 행정동 데이터에 「대치동」이 있으면 「대치동」, 없으면 「대치1동」. 과외쌤·학생: 「서울시 강남구」(광역 「서울시」를 대체).
- 게스트 찾기 화면은 열어 둠(샘플 1장은 실제 카드 0건일 때만). 재질문 금지.
- 「한 줄 요청문 있음」 필터: 모든 공급자에게 현재대로 열어 둠(종결).
- 원칙: 이 대화에서 확정한 것이 노션보다 우선하는 정본이다.

## 2026-10-02 코드 현황 점검(읽기 전용)
- 공지: 우측 레일(right-rail.js)에는 공지 없음. 홈 공지 띠 = home-marketing-banner.js:237-257, 3칸 카드 바로 위(:278). 「더 보기」는 #/support/notice 페이지 이동(팝업 아님) → 확정 방향(팝업)과 불일치, 추후 수정 대상.
- 이달의 베스트: 구현돼 있음(보류 대상, 건드리지 않음). 표시 right-rail.js:639-718 제목 「이달의 베스트 고민」, 위치 홈 3칸 카드 아래(home-marketing-banner.js:264 after_trio). 서버 ConcernService.php:604-682 이번 달·방별 3개·반응합(empathy+helpful+cheer) 5 이상. 프런트(:644)·서버(:659)에 5가 각각 하드코딩. 구상(레일 맨 위·기준)은 미정.

## 2026-10-02 정정 (t1071)
- 이달의 베스트 고민: 종현과 이미 합의해 구현 완료된 현행 유지(홈 3칸 카드 아래, 이번 달, 방별 3개, 반응합 내림차순, 5 미만 제외). 위 「보류」 및 t1059u 「반응 5 이상 폐기」 기록은 철회. 변경 없음, 재질문 금지.

## 2026-10-02 반응 이모티콘 확정(코드 현행 = 종현 합의, t1072)
- 고민방 글 반응 3종(현행 구현, 종현 합의 완료): ❤️ 공감해요(empathy) · 👍 도움됐어요(helpful) · 🎉 응원해요(cheer). 근거: preview/home-ui/src/concern/copy.js:185-187, screens.js:91-93, 서버 ConcernReactionRepository::POST_KINDS.
- 이달의 베스트 = 위 3종 반응 합계(5 이상, 이번 달, 방별 3개). 노션 부록의 4종(😮 의외예요·😢 걱정돼요)은 채택하지 않음 → 노션 반영 시 변경분으로 기록. 긍정/부정 분류 질문은 소멸(3종 모두 긍정, 재질문 금지).

## 2026-10-02 무결성 1번(쪽지권 우회) 코드 확인 — 종결, 지시문 없음
- 학부모: MessagesService::assertComposeDirection(:349-367)에서 차단. 관리자: 사전검사 assertColdMemoAllowed(:392-406)는 통과하나 트랜잭션 내 consumeColdMemoTicket(:135-139) → ProviderTicketRepository::resolveMemoProvider(:402-443)에서 프로필 없어 예외 → 대화 미생성. skipTicketConsume는 내부 호출 전용(요청 입력 미사용).
- 실제 우회 없음. 잔여: 관리자 차단 시 오류 문구가 어색함(관리자 쪽지 사용 여부 미결 → 보류, 최종검수 목록).

## 2026-10-02 무결성-9(첨부 고아 파일 정리) — 로컬 수락, 미커밋·미배포
- MessageAttachmentService: lastStoredPaths()/deleteStoredFiles() 추가, storeForMessage 성공 시에만 경로 보관. MessagesService: insertMessageWithFiles catch에서 rollBack 후 정리, composeMessage catch에서 $ownTxn일 때 정리. 성공 경로 삭제 호출 없음. 검증 scripts/verify-message-attachment-cleanup.php 21/21(신규 파일).
- 한계(기록): 바깥 트랜잭션에서 insertMessageWithFiles 성공 후 호출자가 롤백하면 파일 잔존. commit 응답 직전 연결 끊김 시 DB 행만 남고 파일이 지워질 수 있음(극히 드묾).
- 남은 작업 순서 정본 목록: docs/190-remaining-work-queue-2026-10-02.md (종현이 물으면 그대로 나열)

## 2026-10-02 무결성-10(학생 수 0/2+ 막다른 화면 + 로그인 창) — 로컬 수락, 미커밋·미배포
- renderStudentCountHalt(student-reg/screens.js:183-): 0명 → 감성 문구 + 「기본정보 입력」(auth-ui #/signup/basic?role=student, basicRegisterPathForMe 경유), 2명 이상 → 문구 + 「운영문의」(#/support/contact). 문구는 student-reg-copy.js STUDENT_COUNT_HALT_COPY 한 곳.
- bindGuestEmptyCardLoginGate: 클릭 시점에 isViewerLoggedIn()(chrome-session isChromeLoggedIn() 또는 home-ui auth-role authRoleType()) 이면 통과. 비로그인 기존 동작 유지. 검증 scripts/verify-student-count-halt-and-gate.mjs 28/28.
- 지시와 달랐던 점 2건 모두 타당해 수락: (1) P19-03a는 학생 id 필요 → 앱이 학생 없는 학부모를 보내는 auth-ui 기본정보 화면 사용. (2) isLoggedIn() 직접 import는 auth-ui 번들에 home-ui 모듈 67개가 딸려 들어가 빌드 경계 위반 → 두 곳의 기존 상태만 읽음.
- 잔여 한계: 화면 학생 0명인데 서버가 needs_basic_register=false이면(삭제 상태 학생만 남은 경우) 버튼이 원래 화면으로 되돌아옴. oauth_role_pending 상태에서는 빈카드 클릭 시 로그인 창이 뜰 수 있음(실제 거의 안 마주침).

## 2026-10-02 용어 확정: 「학부모」는 보조단어
- 종현: 학부모는 주된 용어 아님. 화면 카피·지시문 모두 「학생」. 필요할 때만 「학생(학부모)」 병기(노션 19장·6장과 같은 방향). 고민방 이름 「학생 학부모 고민방」은 예외로 유지.
- 정리 대상(학부모/우리 아이 표현이 많은 파일, preview/home-ui/src): guide/copy.js(12), support/support-copy.js(10), guide/screens.js(10), promo/parent-content.js(6), concern/copy.js(5), study-room-content.js(4), home-marketing-banner.js(4), board-channel-acl.js, mypage-copy.js, policy-copy.js 등. 확인 후 「노션/현재/차이」 표로 종현 승인 받은 뒤 티켓화.
- 「학생 0명」 = 학생 모드로 로그인했는데 그 계정에 삭제 안 된 학생 기본정보 행(students.guardian_user_id)이 없는 상태. BasicRegisterService::studentNeedsBasicInfo 가 같은 조건(행 없음 → 기본정보부터).

## 2026-10-02 종현 메모: 「학생 2명 이상」 용어 폐기 + 관리자 페이지 학부모 용어 전부 갱신
- 「학생 2명 이상」은 계정 1개=학생 1명 원칙상 생길 수 없는 경우. 이 용어가 종현에게 혼란을 줌 → 앞으로 화면 설명·지시문·답변에서 쓰지 않는다. (무결성-10의 2+ 분기 문구/코드는 정리 대상으로 재검토. 단 코드 방어 분기는 종현 확인 후 결정)
- 관리자 페이지(admin)에 「학부모」 용어가 온통 남발돼 있음 → 전부 「학생」으로 갱신해야 함(필수 병기가 아니면 학부모 삭제). 정본 대조표(노션/현재/차이)로 목록 확인 후 티켓화. 관리자 모드 작업(157-x/158/159/162) 때 함께 처리.

## 2026-10-02 14:55 종현 확정(신규 정책): 정보 게시판 2개 (사이트오류-3)
- 분류 4개 수락. 공부방 쏙쏙정보: 운영 노하우 / 학생 모집·홍보 / 시설·행정·세무 / 입시·교육 소식. 과외쌤 따끈 팁가이드: 수업 노하우 / 상담·학생 매칭 / 계약·정산·세무 / 입시·교육 소식.
- 「유료 공급자」 = 픽카드·프라임카드를 구매한 사용자에 한함(운영 중 정책 변경 가능 → 판정을 한 곳에 모아 바꾸기 쉽게). 쓰기 = 관리자 + 유료 공급자.
- 신규 정책이다(노션에 없음). 노션에 올릴 때는 신규 문서 또는 관련 문서의 서브 문서로 작성한다(「남겨」 때).
- 순서: 게시판 본체 먼저, 레일 배너 연결은 사이트오류-2 수락 뒤.

## [2026-10-02 t1147] 홈 상단 공지·동네인사 2단 배치 (합의, 지시문 전)
- 합의: 공지와 동네인사를 한 줄 2단(박스 테두리로 구분, 모바일은 위아래). 내 박스(공부방 박스/과외박스)는 그 아래 가로 전체.
- 동네인사 기준 = 보는 사람 본인 지역(공부방+과외쌤 섞어 최신순). 현재 홈 5줄·팝업 페이지당 5개. 홈 줄 수(3줄 안)는 미확정.
- 현재 순서(코드): 마케팅 배너 → 공지 띠(renderHomeNoticeStrip, home-marketing-banner.js) → 동네인사 레일 → (과외쌤: 탭 → 내 과외박스+활동지역 분포 2단 / 공부방: 내 공부방 박스 단일 패널).
- 공부방 박스 풍성화(과외박스 최신형 기준)는 별도 조사 건. 2단 배치와 독립(박스는 그 아래).
- 학생·게스트 홈에도 공통 모듈 사용. 0건 처리는 172 §8.1(0건 숨김)과 감성 빈 화면 방침이 충돌 → 종현 결정 대기.
- 순서 새치기 아님: 사이트오류-4에 포함 예정.

## [2026-10-02 t1148] 종현 확정 (공지·동네인사 2단)
- 2단 순서 확정: 랜딩배너 → [공지 | 동네인사](박스 테두리) → 내 박스. 모바일 위아래.
- 0건이어도 모든 역할(공급자·학생·게스트)에서 칸과 제목 유지(숨김 금지, 172 §8.1 「0건 숨김」은 폐기). 0건이면 애교 있고 읽고 기분 좋아지는 감성 문구. 문구는 CONCERN_RAIL_COPY처럼 한곳에 모음.
- 공부방 박스 풍성화: 후순위. 과외쌤 박스의 안내글·배지·레이아웃에 맞춰 통일(별도 조사 후 티켓). 사이트오류-4 이후.

## [2026-10-02 t1152] 이달의 베스트 위치 변경 (종현 제안, 해석 확인 대기)
- 본문(3칸 카드 아래 띠)에서 빼서 우측 레일 맨 위로 이동. 방별 1개씩만 표시(총 3개), 클릭하면 팝업(공용 읽기 팝업 틀)에서 그 방의 베스트 3개까지 보여줌.
- 기존 규칙 유지: 이번 달·방별·반응합 많은 순·5 미만 제외, 0건이어도 구역·제목 유지(「베스트글이 없습니다」 계열 감성 문구), 학생은 학생 방만.
- 홈 본문 순서 결과: 랜딩 3칸 카드 → [공지|동네 인사] 2단 → 내 박스. 이전 「레일 이동 철회」 기록은 이번 종현 새 제안으로 대체.
