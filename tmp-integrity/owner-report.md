# 운영 사이트 공부방 원장(로그인) 시점 무결성 점검 보고서

- **점검 시각**: 2026-10-08 13:56 ~ 14:25 (KST)
- **점검 대상**: 운영 사이트 `https://study114.net`
- **점검 세션**: `study_room_owner` (계정 닉네임: `이종현룸`, 공부방: `가능동베스트`, ID 7)
- **테스트 환경**: Playwright (Chromium 1228), PC 1440×900, 모바일 390×844 (isMobile: true, hasTouch: true)
- **산출물 및 스크린샷 경로**: `d:\work\study114\.wt\integrity\tmp-integrity\shots\owner\`

---

## 1. 요약표

| 심각도 | 건수 | 요약 내용 |
|---|:---:|---|
| **장애** | 3건 | 1. 원장 계정에서 관리자 전용 공지 관리 화면(`/#/support/admin/notices`) 인가 없이 진입 및 편집 UI 노출 (인가 취약점)<br>2. 공부방 고민방(`/#/community/director/new`) 글쓰기 시 서버 422 반환으로 글 저장 불가 (`operator_display_name` 미등록 및 아파치 에러 핸들러)<br>3. 전 화면 공통 고객센터 문의 티켓 API(`tickets.php`) 파라미터 누락으로 403 Forbidden 반복 호출 |
| **정책 위반** | 1건 | 관리자 화면 접근 통제 미비 (비관리자 권한으로 관리자 라우트 UI 렌더링) |
| **데이터** | 1건 | 공부방 상세(ID 7 가능동베스트) 대표 사진에 관리자/홈 화면 캡처 이미지가 등록되어 손님에게 노출됨 |
| **문구·디자인** | 5건 | 1. 원장 로그인 후 `/#/myshop` 진입 시 내 마이샵 대신 홈(`/#/study-room`)으로 리다이렉트<br>2. `/#/community/director` 직접 URL 진입 시 세션 로드 타이밍 문제로 '비회원 제목만 보기' 안내 노출 (SPA 이동 시에는 정상 노출)<br>3. 운영 사이트 전체 HTML `<title>`에 "프리뷰" 문구 노출<br>4. 홈 상단 배너 오타 ("카달로그", "인태형 만들기")<br>5. 공부방 찾기 검색 상단 히어로 배너에 "우리동네 과외쌤 찾기" 버튼 기본 노출 |
| **사용자 확인** | 2건 | 1. 관리자 티켓 관리(`/#/support/admin/tickets`) 화면 UI 진입 후 403 에러로 "요청을 처리하지 못했습니다." 표시<br>2. 2단계 시험 중 접수된 1:1 문의 1건(`[테스트] 무결성 점검 — 답변 불필요`) 취소/삭제 기능 미제공으로 잔여 |

---

## 2. 발견 사항 표

| 번호 | 심각도 | 화면 (경로) | 내용 | 원인 추정 (소스 코드) | 증거 스크린샷 파일명 | 재현 순서 |
|:---:|:---:|---|---|---|---|---|
| **B1** | **장애** / **정책 위반** | 관리자 공지 관리<br>(`/#/support/admin/notices`) | 원장 계정으로 관리자 전용 화면에 접속 시 차단(리다이렉트/403)되지 않고 관리자 공지 추가·수정·삭제 폼 전체가 노출됨 | 프론트엔드 라우터에서 관리자 권한 가드 부재 (`preview/home-ui/src/support/screens.js`의 `renderNoticeAdminSection`에서 `isAdminUser()` 권한에 따른 라우트 차단 미흡) | `shots/owner/B-32-forbidden-admin-notices-pc.png`<br>`shots/owner/B-32-forbidden-admin-notices-m.png` | 1. 원장 로그인 세션으로 `https://study114.net/#/support/admin/notices` 접속<br>2. 관리자 공지 관리 UI 및 수정/삭제/시드 복원 폼 노출 확인 |
| **B2** | **장애** | 공부방 고민방<br>(`/#/community/director/new`) | 원장이 글 작성 후 '올리기' 클릭 시 `POST /api/board/posts.php` 422 반환으로 글 저장 실패 | 1. 백엔드 `AuthorDisplayNameResolver.php` 65~71행에서 `study_rooms.operator_display_name`을 조회하나, 해당 원장 계정 DB에 이 값이 비어 있어 `ConcernService.php` 78행에서 422 `display_name_required` 발생<br>2. 아파치 웹서버가 422 응답 시 기본 HTML 에러 페이지를 반환하여 프론트엔드에서 상세 사유 없이 "글 저장에 실패했습니다."로만 표출 | `shots/owner/B-write3-comm-02-compose-form.png`<br>`shots/owner/B-write3-comm-03-detail-created.png` | 1. 원장 로그인 후 홈에서 커뮤니티 → 공부방 고민방 → 글쓰기 진입<br>2. 제목, 본문 입력 후 '올리기' 클릭<br>3. "글 저장에 실패했습니다." 에러 발생 및 등록 불가 확인 |
| **B3** | **장애** | 홈 / 마이페이지 / 커뮤니티 전 화면 공통 | 원장 로그인 접속 시 고객센터 문의 티켓 API(`tickets.php`)를 `email` 파라미터 없이 호출하여 403 Forbidden 에러 유발 | `public/api/support/tickets.php` 17~21행에서 `email` 쿼리가 없으면 `requireAdmin()`을 실행함. 프론트엔드가 관리자가 아닌 일반 회원 화면에서도 무인자 `tickets.php`를 호출하여 403 유발 | `shots/owner/B-01-home-pc.png`<br>콘솔/네트워크 로그 (`[403] /api/support/tickets.php`) | 1. 원장 로그인 후 `https://study114.net/` 또는 `/#/mypage` 접속<br>2. 개발자 도구 콘솔/네트워크 탭에서 403 Forbidden 지속 발생 확인 |
| **B4** | **문구·디자인** | 내 마이샵<br>(`/#/myshop`) | 원장이 `/#/myshop` URL로 접근 시 자신의 마이샵 화면(`/#/myshop/study-room/7`)이 열리지 않고 홈 화면(`/#/study-room`)으로 강제 리다이렉트됨 | `preview/home-ui/src/state.js` 및 라우터에서 `/#/myshop` 진입 시 원장의 공부방 ID 매핑 로직 누락 또는 기본 홈으로 폴백 처리 | `shots/owner/B-15-myshop-owner-pc.png`<br>`shots/owner/B-15-myshop-owner-m.png` | 1. 원장 로그인 후 주소창에 `https://study114.net/#/myshop` 입력<br>2. URL이 `https://study114.net/#/study-room`으로 바뀌며 홈 화면 노출 |
| **B5** | **문구·디자인** | 공부방 고민방<br>(`/#/community/director`) | URL 직접 입력으로 진입 시 비동기 세션 로드 완료 전에 렌더링되어 '비회원 제목만 보기' 안내 노출 | `preview/home-ui/src/state.js` 170행의 `sessionNavRole()`이 `/api/auth/me.php` 비동기 응답 완료 전에 동기 평가되어 `guest`로 판정되고, 세션 로드 완료 후 재렌더링 누락. (홈에서 GNB 클릭 이동 시에는 정상 노출) | `shots/owner/B-18-community-director-pc.png`<br>`shots/owner/B-18-community-director-spa-pc.png` | 1. 브라우저 주소창에 `https://study114.net/#/community/director` 직접 입력<br>2. "지금은 제목만 볼 수 있어요" 안내 및 글쓰기 버튼 미노출 확인<br>3. 상단 GNB '홈' 클릭 후 다시 '커뮤니티' → '공부방 고민방' 클릭 시에는 정상적으로 '글쓰기' 버튼 노출 확인 |
| **B6** | **문구·디자인** | 전 화면 공통 (브라우저 `<title>`) | 실제 운영 중인 사이트임에도 브라우저 탭 타이틀에 "프리뷰" 문구 노출 | `index.html` 정적 제목 및 각 화면 라우터의 타이틀 문자열에 "프리뷰" 하드코딩 ("우동공과 — 메인 화면 프리뷰", "우동공과 — 검색 프리뷰") | 전 스크린샷 탭 타이틀 | 1. `https://study114.net/` 접속<br>2. 브라우저 탭 타이틀 확인 |
| **B7** | **문구·디자인** | 홈 상단 배너 카드 | 외래어 표기 오류 ("공부방 카달로그") 및 오타 ("학생, 인태형 만들기") 노출 | `preview/home-ui/src/home-marketing-banner.js` 하드코딩 문구 | `shots/owner/B-01-home-pc.png`<br>`shots/owner/B-01-home-m.png` | 1. 홈 화면 상단 3개 카드 배너 확인<br>2. 첫 번째 배너 "공부방 카달로그", 세 번째 배너 "인태형 만들기" 노출 |
| **B8** | **문구·디자인** | 검색 화면<br>(`/search/#/search/room`) | 공부방 원장이 공부방 찾기 검색 진입 시 상단 히어로 배너에 "우리동네 과외쌤 찾기" 버튼이 기본 노출 | 검색 페이지 히어로 배너 버튼의 기본 타겟 고정 | `shots/owner/B-30-search-room-pc.png`<br>`shots/owner/B-30-search-room-m.png` | 1. `https://study114.net/search/#/search/room` 접속<br>2. 상단 히어로 배너 파란색 CTA 버튼 확인 |
| **B9** | **데이터** | 공부방 공개 상세<br>(`/#/myshop/study-room/7`) | 원장 본인 공부방의 메인 대표 사진으로 홈 화면/배너 캡처 이미지가 등록되어 손님에게 노출됨 | 운영 DB의 공부방 대표 사진 레코드에 홈 화면 스크린샷 파일이 등록되어 있음 | `shots/owner/B-16-myshop-public-7-pc.png`<br>`shots/owner/B-16-myshop-public-7-m.png` | 1. `https://study114.net/#/myshop/study-room/7` 접속<br>2. 메인 히어로 대표 사진 확인 |
| **B10** | **사용자 확인** | 관리자 티켓 관리<br>(`/#/support/admin/tickets`) | 원장 계정으로 관리자 티켓 화면 접근 시 헤더는 노출되나 본문에서 `tickets.php` 403 발생으로 "요청을 처리하지 못했습니다." 에러 노출 | 관리자 전용 URL임에도 라우트 레벨에서 접근 차단(가드)하지 않아 비관리자가 UI에 진입함 | `shots/owner/B-33-forbidden-admin-tickets-pc.png`<br>`shots/owner/B-33-forbidden-admin-tickets-m.png` | 1. `https://study114.net/#/support/admin/tickets` 접속<br>2. "요청을 처리하지 못했습니다." 에러 박스 노출 확인 |

---

## 3. 쓰기 시험 표

| 시험 항목 | 원래 값 | 바꾼 값 | 원복 결과 | 증거 스크린샷 |
|---|---|---|---|---|
| **1. 동네 인사** | `아직 올린 인사가 없어요.` | `[테스트] 무결성 점검`<br>(마이페이지 `게시 중` 표시, 홈 화면 "우리 동네에 새로 왔어요"에 `가능동베스트 [테스트] 무결성 점검` 정상 노출) | **원복 성공**<br>(내리기 및 `×` 삭제 실행, confirm 승인 후 `아직 올린 인사가 없어요.`로 복구 완료. 홈 화면에서도 즉시 삭제 확인) | `B-write1-greeting-01-before.png`<br>`B-write1-greeting-02-posted.png`<br>`B-write1-greeting-03-home.png`<br>`B-write1-greeting-04-reverted.png`<br>`B-write1-greeting-05-home-reverted.png` |
| **2. 쪽지설정** | `쪽지 안받음 · 잠시 쉼`<br>(공개 상세: `문의 안내\n현재는 잠시 쉬는 중입니다`) | `쪽지 받는 중`<br>(공개 상세: `문의 안내\n현재 쪽지 가능` 즉시 반영 확인) | **원복 성공**<br>(`쪽지 안받음`, `잠시 쉼` 선택 후 저장하기 클릭. 공개 상세에서 `현재는 잠시 쉬는 중입니다` 원복 확인) | `B-write2-inquiry-01-before.png`<br>`B-write2-inquiry-02-public-before.png`<br>`B-write2-inquiry-03-saved.png`<br>`B-write2-inquiry-04-public-changed.png`<br>`B-write2-inquiry-05-reverted.png`<br>`B-write2-inquiry-06-public-reverted.png` |
| **3. 커뮤니티 글쓰기**<br>(`#/community/director`) | `(글 없음)` | 제목: `[테스트] 무결성 점검 — 곧 삭제`<br>본문: `[테스트] 자동 점검 글입니다.` | **글 작성 실패 (DB 잔여 없음)**<br>서버에서 HTTP 422 반환(`글 저장에 실패했습니다.`). 원인: DB `study_rooms.operator_display_name` 부재로 `display_name_required` 발생. 글이 DB에 등록되지 않았으므로 수정/삭제/댓글 시험 진행 불가 및 DB 잔여 없음. | `B-write3-comm-01-list-before.png`<br>`B-write3-comm-02-compose-form.png`<br>`B-write3-comm-03-detail-created.png`<br>`B-write3-comm-04-list-with-post.png` |
| **4. 내 등록 편집**<br>(`#/mypage/registrations/study-rooms/7/detail`) | `intro_long`: `조용합니다.`<br>(공개 상세: `조용합니다.`) | `intro_long`: `조용합니다. [테스트]`<br>(공개 상세: `조용합니다. [테스트]` 반영 확인) | **원복 성공**<br>(`intro_long`을 원래 문구 `조용합니다.`로 다시 입력 후 저장. 공개 상세에서 정상 원복 확인) | `B-write4-reg-01-before.png`<br>`B-write4-reg-02-public-before.png`<br>`B-write4-reg-03-saved.png`<br>`B-write4-reg-04-public-changed.png`<br>`B-write4-reg-05-reverted.png`<br>`B-write4-reg-06-public-reverted.png` |
| **5. 쪽지 보내기** | `(쪽지함 비어있음)` | 수신 대상: 학생 `이종현학생1`, 과외쌤 `이종현과외`, `이종현선생2` | **경로 없음 (미전송)**<br>원장 받은 쪽지함(`/#/mypage/messages`)이 비어 있고(`쪽지가 없습니다`), 검색 화면(`신곡동` 기준)에서도 지정된 테스트 계정이 노출되지 않아 전송 경로 없음. 억지로 생성하지 않고 규칙 준수. | `B-write5-messages-empty-pc.png` |
| **6. 1:1 문의**<br>(`#/support/contact`) | `(기존 문의 내역 없음)` | 유형: `오류·장애`<br>내용: `[테스트] 무결성 점검 — 답변 불필요` | **접수 완료 (취소/삭제 미지원)**<br>접수 후 `/#/mypage/contact`에서 `[테스트] 무결성 점검 — 답변 불필요` 등록 확인됨. 사용자 취소/삭제 기능이 제공되지 않아 **남겨진 흔적으로 유지**됨. | `B-write6-contact-01-before.png`<br>`B-write6-contact-02-submitted.png`<br>`B-write6-contact-03-history.png` |
| **7. 계정설정** | 표시명 `이종현룸`<br>이메일 `leejetty+room@gmail.com` | (변경 시도하지 않음) | **원형 유지**<br>(지침에 따라 저장·수정 시도하지 않고 화면 및 필드 노출만 점검) | `B-03-mypage-account-pc.png`<br>`B-03-mypage-account-m.png` |

---

## 4. 수신 계정에서 사용자가 확인할 항목

1. **고객센터 관리자 계정 (운영팀 콘솔)**:
   - **확인 대상**: 1:1 운영 문의 접수 건
   - **작성자 이메일**: `leejetty+room@gmail.com` (원장 계정)
   - **문의 유형**: `오류·장애`
   - **문의 내용**: `[테스트] 무결성 점검 — 답변 불필요`
   - **접수 시각**: 2026. 10. 08. 오후 02:19
   - **요청 사항**: 무결성 점검용 자동 테스트 데이터이므로 실제 조치 및 답변 불필요. 관리자 콘솔에서 상태 종결 처리 요망.
2. **학생 `이종현학생1`, 과외쌤 `이종현과외`, 과외쌤 `이종현선생2` 계정**:
   - 원장 화면에서 이들 계정으로 쪽지를 보낼 수 있는 경로가 없어 발송하지 않았으므로, 수신 계정에서 확인하거나 정리할 쪽지 내역 없음.

---

## 5. 이상 없음 화면 목록 및 미점검 사유

### 이상 없음 화면 목록
1. `/#/mypage/account` (계정설정): 원장 표시명(이종현룸), 이메일, 비밀번호 변경 필드 정상 노출.
2. `/#/mypage/plans`, `/#/mypage/plans/my`, `/#/mypage/plans/history` (유료상품/구매이력): 플랜 카드 및 구매 이력 안내 정상 노출, 결제 버튼 미클릭 안전 확인.
3. `/#/mypage/recent` (최근열람): 최근 열람 내역 빈 상태 정상 안내.
4. `/#/mypage/wishlist` (관심 학생/찜한 공부방): 찜 목록 탭 및 빈 상태 정상 노출.
5. `/#/mypage/student-review` (후기함): 후기함 탭 및 안내 정상 노출.
6. `/#/mypage/submission-board`, `/#/mypage/submission-docs`: "공부방은 이 제출 기능을 쓰지 않습니다. 교육청 등록은 상세정보 2단계에서 진행합니다." 정책 안내 카드 정확히 노출.
7. `/#/mypage/registrations/study-rooms/7/basic`: 기본정보 현황 카드 정상 노출.
8. `/#/mypage/registrations/study-rooms/7/detail`: 수업 정보 현황 및 편집 폼 정상 동작.
9. `/#/mypage/registrations/study-rooms/7/detail2`: 경력/신뢰/시설 현황 카드 정상 노출.
10. `/#/mypage/registrations/study-rooms/7/inquiries`: 쪽지 받기/안받음 설정 및 공개 상세 연동 정상 동작.
11. `/#/mypage/registrations/study-rooms/7/publish`: 등록점검 탭 정상 노출.
12. `/#/community` (커뮤니티 허브): 4개 게시판 바로가기 및 역할별 안내 정상 배치.
13. `/#/community/parent`, `/#/community/tutor`, `/#/community/admission`, `/#/community/solved`: 타 역할 게시판 제목 열람 및 권한 안내 정상 동작.
14. `/#/support/notice`, `/#/support/faq`, `/#/support/library`, `/#/support/policies`: 공지사항, FAQ, 자료실, 정책 문서 뷰어 모두 깨짐 없이 정상 렌더링.
15. `/search/#/search/room`, `/search/#/search/tutor`: 신곡동 기준 네이버 지도 및 필터 렌더링, '주소찾기' 버튼 클릭 시 지역 선택 다이얼로그 정상 팝업.
16. `/#/register/tutor`: 원장 계정으로 과외쌤 등록 URL 진입 시 홈(`/#/study-room`)으로 안전하게 튕김 확인.

### 미점검 항목 및 사유
1. **커뮤니티 글 수정, 삭제, 댓글 시험**:
   - 사유: 글쓰기 시 서버 422 에러(`operator_display_name` 미등록)로 글 생성이 차단되어 하위 단계인 수정/삭제/댓글을 진행할 수 없었음.
2. **지정 계정(`이종현학생1`, `이종현과외`, `이종현선생2`)으로의 쪽지 발송**:
   - 사유: 원장 화면의 수신함이 비어있고 검색 목록에 해당 사용자가 노출되지 않아 전송 경로 없음 (지침 준수).
3. **계정설정 저장/탈퇴 시험**:
   - 사유: 계정 손상 및 세션 파괴 방지를 위해 지침상 화면 열람만 허용됨.

---

## 6. 콘솔 / 네트워크 오류 원문 목록 (화면별)

| 화면 | 콘솔 오류 원문 (`console.error` / `pageerror`) | 네트워크 오류 원문 (4xx / 5xx) |
|---|---|---|
| 홈 (`/#/study-room`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 마이페이지 허브 (`/#/mypage`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 계정설정 (`/#/mypage/account`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 내 문의 내역 (`/#/mypage/contact`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 쪽지함 (`/#/mypage/messages`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 내 등록 (`/#/mypage/registrations/*`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 플랜 / 구매이력 (`/#/mypage/plans/*`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 마이샵 상세 (`/#/myshop/study-room/7`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 커뮤니티 전 화면 (`/#/community/*`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 커뮤니티 글쓰기 제출 (`POST /api/board/posts.php`) | `[console.error] Failed to load resource: the server responded with a status of 422 ()` | `[422] https://study114.net/api/board/posts.php` (아파치 HTML 에러 페이지) |
| 고객센터 전 화면 (`/#/support/*`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` | `[403] https://study114.net/api/support/tickets.php` |
| 관리자 티켓 관리 (`/#/support/admin/tickets`) | `[console.error] Failed to load resource: the server responded with a status of 403 ()` (2회) | `[403] https://study114.net/api/support/tickets.php` (2회) |
| 검색 화면 (`/search/#/search/*`) | 없음 (200 OK) | 없음 |

---

## 7. 쓰기 시험에서 남겨진 흔적 안내

- **1:1 문의 접수 1건**:
  - 접수 제목: `[테스트] 무결성 점검 — 답변 불필요`
  - 접수 경로: `https://study114.net/#/support/contact`
  - 접수자 이메일: `leejetty+room@gmail.com`
  - 상태: 접수됨 (고객센터에 취소/삭제 API가 구현되어 있지 않아 DB에 보존됨)
  - 확인 계정: 관리자 계정의 고객센터 문의 관리 화면에서 열람 가능.
