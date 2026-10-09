# 194. 입력칸 채움 색 규칙 (2026-10-05 종현 「진행」 t1341u로 확정)

## 규칙
- 값이 있는 입력칸 = 회색 #f3f4f6, 비어 있거나 포커스 중 = 흰색 #fff. background-color만 바꾼다(테두리·포커스 링·오류 표시 유지). disabled 칸은 대상 아님.
- 근거: 사이트오류-17(2026-10-04, 학생 마이페이지 기본정보에 처음 적용), 2026-10-05 확대 범위 제안을 종현이 「진행」으로 승인.

## 적용 범위 (폼 단위로 켬, 칠하기 코드·CSS는 공통 1곳)
- 넣는 곳: 과외쌤·공부방·학생 마이페이지 기본·상세, 등록확인 수정 서랍, 계정 정보 폼, 가입(auth-ui), 등록 앱(tutor-ui, study-room-ui).
- 빼는 곳: 찾기·필터·정렬·메뉴 선택칸, 관리자 화면, checkbox·radio·file, 긴 글쓰기 칸(고민방·게시판·쪽지·후기·문의).
- 읽기전용 주소칸도 같은 규칙(값 있으면 회색, 없으면 흰색). 기존 gray-50/#fff7ee 대체.
- 코드가 값을 넣는 칸(카카오 주소검색, 홍보1 자동 채움, 지역 단계 선택, 대학명)은 값 대입 후 다시 칠한다.

## 지시문
- 사이트오류-24로 발행(2026-10-05).

## 2026-10-05 사이트오류-24 검수: ACCEPT-with-notes (로컬만, 미커밋)
- 재검수(ljh_work, HEAD 7fb4c87): M1–M7 구현 확인. verify-input-fill-rule 274/0, hope-region 70/0, study-room-box-shape 45/0(preview/home-ui), 기타 기대치 일치. tutor-region-label만 102/1(tutor-reg/screens.js 인라인 칠하기 제거가 HEAD 잠금에 걸림 — 커밋 후 103/0 예상, 검사 스크립트 허용 목록 수정은 별도 승인).
- student-mypage-stage5b.css:117 background shorthand는 2026-09-24부터 기존. 채움 색은 data-input-fill이 이김. select 화살표는 별도 작업.
- 못 본 것: 브라우저 육안, 모바일, 서버 PHP 가입 화면.

## 2026-10-05 배포 FAIL 조사 (t1346u): verify-home-news-row 225/1 → 24번 원인 아님
- Cursor 실패: B_order_trio_row_mybox_study_room (tabThenBox:false, boxAfterTabs:true).
- study-room.js·verify-home-news-row·provider-home는 HEAD와 동일(24번이 홈 DOM 미변경). 재실행 226/0.
- 조치: 보완지시 없이 home-news-row만 재실행 후 226/0이면 기존 배포 지시 재진행.

## 2026-10-05 배포 FAIL 2차 (t1347u): verify-input-fill-rule 272/2 → 24번 결함 아님
- 실패: T4 tutor_univ_detail 값 빈칸·흰색. 원인: tutor-ui main.js가 initChromeSession(me.php)과 initApi를 동시에 시작해 masters가 me보다 먼저 오면 loadTutor가 호출되지 않음(HEAD부터 존재). study-room-ui 동일 구조.
- 재현: me 지연 시 value "". 전체 검사 단독 3회 모두 274/0.
- 조치: input-fill-rule만 단독 재실행 → 274/0이면 배포 진행. 경쟁 조건 수정은 24번에 넣지 않고 별도(가칭 25)로 큐에 기록.

## 2026-10-05 15:28 KST — 사이트오류-24 배포 완료
- 커밋 `79e8c343d2cf2c9e2e0122ad38daa7e7d8279a89` origin/main 반영(종현 푸시 SUCCESS t1348u).
- Deploy to dothome #380 success (headSha 79e8c34). 보조 Actions(Board ACL / Tutor register same-tab / Tutor lesson step / Study-room registration-check / ShopPage / Tutor inquiries / Tutor mypage frame IA) 전부 success.
- 라이브 확인은 종현 몫. 다음 큐(대기): 가칭 25 tutor-ui·study-room-ui me.php 경쟁조건(24번에 넣지 않음).
