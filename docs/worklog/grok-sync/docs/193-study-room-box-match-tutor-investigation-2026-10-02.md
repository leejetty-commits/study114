# 193 공부방 내 박스 → 과외쌤 내 박스 맞춤 조사 (2026-10-02)
근거: 종현 t1179u 「공부방의 내박스를 과외쌤의 내박스와 비교하면 안내글이나 레이아웃이 조금 다를거야. 공부방을 과외쌤에 맞출거니 조사 후 이슈 정리」, docs/191 (공부방 박스 풍성화는 후순위, 과외쌤 박스의 안내글·배지·레이아웃에 맞춤).
상태: 조사 완료(읽기 전용). 종현 승인 전 지시문 없음.

## 핵심 차이
- 구조: 과외쌤=탭 아래 2칸(내 현황 4줄 + 활동지역 분포). 공부방=탭 위 카드 1장(home-mkt-wrap__panel), 안내글 없음, 배지 없음.
- 과외쌤 박스 일부는 목업(MY_TUTOR: 이름·과목·쪽지상태·미확인·등록일, tutor.js:85-98). 공부방은 서버 값. 복사 시 목업 따라오므로 공부방 서버 값 유지.
- 후기함 링크: 과외쌤 /mypage/messages, 공부방 /mypage/messages/reviews. 마이페이지: 공부방 /mypage 고정(getDefaultMypagePath('study_room') 있음).
- 공부방 고유(유지): 홍보1 지역·수업지역 이름, 지도, 지역 바, 홍보1 지역 목록(서버), 학생 수요 부트(4b 재그리기 가드 건드리지 말 것).
- 검사: 박스 내용 직접 검사 스크립트 없음. verify-home-news-row.mjs의 NEXT_BOX.study_room(:653) 셀렉터·순서 확인 필요.
- 용어: 박스 코드 자체 위반 없음. study-room-reg-copy.js:75,89,106 「학부모」 문구는 안내글에 가져오지 말 것.

## 종현 결정 대기 4건
1 오른쪽 칸(활동지역 분포 대응) 처리  2 박스를 탭 아래로 이동  3 후기함 링크  4 과외쌤 목업 값을 서버 값으로 교체 여부

## 종현 결정 (2026-10-02 밤, t1180u)
- 오른쪽 칸 활동지역 분포(옛 1번): 하지 않음.
- 박스는 탭 아래로 이동. 다만 가로가 너무 길어 과외쌤처럼 반폭으로 줄이면 우측이 빔 → 우측에 무엇을 둘지 미정. 지도 위로 박스를 옮기는 안은 박스가 난립해 보여 보류, 「일단 더 고민」. (우측 칸 처리 미결 — 이 부분은 지시문에서 제외하거나 종현 확정 후)
- 공부방 고유값은 유지, 과외쌤 박스와 공통으로 가져갈 수 있는 안내글·레이아웃만 그대로 적용.
- 후기함: 종현이 위치를 물음. 확인 결과 마이페이지 왼쪽 메뉴 「쪽지·후기함」(/mypage/messages) 화면 상단 탭 「쪽지 | 후기함」 중 후기함 탭이 /mypage/messages/reviews. 과외쌤 버튼=쪽지 탭, 공부방 버튼=후기함 탭으로 도착이 달랐음. (링크 결정 대기)
- 과외쌤 목업 값 서버 교체: 이번 작업 제외, 별도 항목으로만 기록 (종현이 설명 요청).

## 종현 확정 (t1181u)
- 「쪽지 후기함」 배지: 쪽지 탭/후기함 탭으로 나누지 않고 마이페이지 좌측 「쪽지·후기함」(/mypage/messages)으로 바로 이동. 「쪽지 N개 미확인」은 고지만 하고 그쪽으로 가보라고 유도. (공부방·과외쌤 공통)
- 과외쌤 박스 목업 값(MY_TUTOR)은 반드시 실제 데이터를 가져와야 함. 이 알고리즘이 작동 안 하면 큰일 → 라이브에서 목업이 노출되는지 즉시 점검 지시.

## 점검 결과: 과외쌤 홈 박스 목업 (2026-10-03 00:35, 코드·빌드 산출물 확인, 실계정 화면은 미확인)
- tutor.js:85,92,93,98 이 data.js:30-38 MY_TUTOR(김우동/수학·영어/memoInbox 3/2026-04-15)를 그대로 표시. 이름·과목·미확인 수·등록일 = 목업(로그인·게스트 무관).
- 쪽지 상태는 「쪽지 받음」 고정 문구(inquiry_status 미사용).
- 조회(ROI lifetime_views)·활동지역(saved_regions)은 서버 값 정상.
- 서버 값 출처: 이름 tutor_display_name, 과목 main_subject_note(대표 1개로 추정), 상태 inquiry_status, 미확인 getUnreadCount(), 등록일은 서버가 안 줌 → TutorHubRepository.php:129 부근에 created_at 추가 필요(공부방 StudyRoomHubRepository.php:129-131 에는 있음). 공부방 readStudyRoomMemberBox(study-room-home-seed.js:131-147) 와 같은 readTutorMemberBox 신설.
- dist 에도 목업 박힘(2026-10-02 05:11 빌드). 배포 여부 미확인.
- 종현: 실제 데이터 필수. 이 건은 공부방 박스 개편보다 앞서 처리 여부를 종현에게 확인 중.

## 종현 결정 (2026-10-03 00:36)
과외쌤 박스 실제 값 수정을 공부방 박스 개편보다 먼저 지시문으로 낸다 (사이트오류-8). 근거: 가짜 값(김우동 등) 라이브 노출, 쪽지 상태 오표시. 공부방 박스 개편은 그 뒤.

## 사이트오류-8 결과 (2026-10-03 00:55, 로컬, 미커밋·미배포)
- 직접 재확인: diff 검토, 신설 verify-tutor-box-real-values.mjs 48/1(남은 1건=김우동 문자열 잔존), home-news-row 226/0, role-home-guard 56/0, php -l OK. 목업 제거·서버 값(등록 API/쪽지 API/ROI)·created_at 추가 확인.
- 규칙: 쪽지 상태 「쪽지 받음/쪽지 안받음」(공부방과 동일 표기), 미확인·조회는 없으면 0, 서버 호출 실패 시만 「—」, 로딩 「…」.
- 잔존 김우동: data.js DUMMY_STUDENTS(사용처 없음) / mypage/preview-data.js:28 PREVIEW_PROFILE(비로그인 폴백, 마이페이지는 로그인 필수라 실노출 낮음) → 8b 로 제거.
- 별도 기록: 미확인 수는 세션 확인 때 1회만 로드(새 쪽지는 새로고침 전 미반영, 공부방 동일). 다른 과외쌤 계정 재로그인 시 조회 캐시 초기화 안 됨(기존 동작). readStudyRoomMemberBox 에 API 모드 확인 없음(공부방 개편 때 함께).

## 학생 로그인 위치 표시 시나리오 (2026-10-03 01:06, 종현 t1185u~t1187u)
- 시나리오: 학생(과외 분기) 「경기도 의정부시」 저장. 종현 확인: 우리 정책대로 논리적 답이 정답 = 홈·찾기 현재위치는 학생 저장 지역(의정부시 → 변경 시 서울특별시 도봉구). 공부방 탭은 저장 지역(시/구) 표시 제안안(종현 「저게 정답」).
- 실제 화면(종현 보고): ①홈 과외쌤 희망지역 표시없음 ②홈 학생 탐색지역 「위치를 선택해 주세요」 ③홈 공부방 「대치동」 ④과외쌤 찾기 「경기 의정부시」(도봉구로 바꿔 저장·새로고침 후에도 동일 → 틀림) ⑤학생 찾기 「424」 ⑥공부방 찾기 「신곡동」(가끔 424).
- 정책 위반: 로그인 회원에게 대치동·위치를 선택해 주세요 노출, 지역 id 숫자 노출, 저장 변경 미반영. 코드 원인 조사 중.

## 정책 확정: 과외 분기 학생의 공부방 탭 기준 (2026-10-03 01:07, 종현 t1188u 「정책을 정하면 돼」 위임 → 우동공과2 제안, 이의 없으면 확정)
- 과외 분기 학생은 공부방 기준(동·단지)이 없다. 홈·찾기의 공부방 탭 현재위치 = 학생 저장 지역(예: 경기도 의정부시 / 서울특별시 도봉구). 구가 있는 시는 구까지.
- 공부방 목록·지도 = 그 시/구 안의 공부방 전체, 지도 중심·줌은 그 시/구 전체가 보이게. 동·단지는 학생이 탭 안에서 직접 좁힐 수 있되 저장하지 않는다(저장 지역은 바꾸지 않음).
- 금지: 로그인 회원에게 「대치동」(게스트 전용), 「위치를 선택해 주세요」, 지역 id 숫자 노출.
- 해당 시/구에 공부방이 0곳이면 감성 빈 문구(「아직 이 동네에 도착한 공부방이 없어요」 후보, 문구는 한 곳에서 관리).

## 조사 결과: 학생 로그인 위치 표시 원인 (2026-10-03 01:15, 코드 확인, 실계정 localStorage/DB 미확인)
- 핵심: students.preferred_tutor_region_id 는 서버에 정상 저장되나 홈·찾기(search-ui)가 학생(parent) 저장 지역을 읽는 코드가 없다. 대신 브라우저 localStorage(study114.studentFind.lastRegionByHope, study114-find-canonical-v1)를 읽음.
- 원인 A 학생 저장 지역 미사용(search-find-surface.js:587-598,987-991,1261-1272) / B 임시값이 계정이 아닌 브라우저 소유, 갱신은 가입완료(signup-complete.js:320-323)·상세등록 저장(student-reg/screens.js:601)뿐, 희망지역은 basic 폼이라 미갱신 / C 임시값에 지역 id 숫자가 라벨 대신 저장(search-find-surface.js:2070 → 「424」 노출, location-display.js:147) / D 마지막 선택값·URL region 이 프로필보다 우선, 학생은 탭별 재고정(:482-484,609-626), GPS 부팅 저장(:721-780) / E 서버 StudentHubRepository.php:508 이 희망 유형 무관하게 studyroom→tutor 순으로 라벨 선택, preferred_tutor_region_label 미전송 / F 로그인 회원에게 GUEST_PLACE_PROMPT 출력(search-find-surface.js:1651-1652, search-map.js:116).
- ③ 「대치동」 출처 미확정(GUEST_BASE_ROOM_LABEL 이거나 게스트 화면). ⑥ 「신곡동」은 GPS 저장값 또는 서버 라벨 추정.
- 최소 수정안: 서버 라벨 정리 → search-ui 회원 지역 모듈 신설(students.php→cities 라벨) → hydrateFindStateFromHash 학생 저장 지역 우선 → 탭별 값(공부방 탭=시/구) → 안내 문구 제거 → 홈 학생 상태 시드 → 임시값 계약을 라벨만으로 통일. 우선순위 제안: URL > 직접 고른 주소 > 서버 저장 지역 > GPS, 학생에게 canonical 저장값 미사용.
- 영향 검사: verify-location-ssot.mjs(우선순위), verify-guest-baseline-map-cards.mjs, verify-home-news-row.mjs. 학생 로그인 시나리오 검사 신설 필요.
- 종현이 공부방·과외쌤 모드에서 같은 현상 먼저 확인 예정(t1190u). 결과 후 합쳐서 지시문.

## 공부방 모드 확인 (2026-10-03 01:16, 종현 t1191u)
- 공부방 모드: 주소를 아파트(민락동 한라비발디아)로 수정. 홈 공부방탭·학생탭 정상 반영, 공부방 찾기 정상, 학생 찾기도 「민락동」 정상. → 공부방 역할은 저장 지역을 읽는 코드가 있어 정상(조사 결과와 일치). 문제는 학생(parent) 역할. 과외쌤 모드는 종현 확인 대기.

## 사이트오류-9 범위·정책 (2026-10-03 01:17, 종현 t1192u 「학생모드에만 집중」)
- 범위: 학생(parent) 로그인 홈·찾기 위치 표시. 공부방·과외쌤 역할은 변경 금지(정상 확인).
- 위치 우선순위(제안, 이의 없어 적용): URL region > 직접 고른 주소 > 서버 저장 지역 > GPS. 학생에게 find-canonical 저장값 미사용.
- 학생 공부방 탭 = 저장 지역 시/구 표시(과외 분기), 로그인 회원에게 대치동·「위치를 선택해 주세요」·숫자 id 금지.

## 과외쌤 모드 확인 (2026-10-03 01:25, 종현 t1195u)
- 과외지역 대표를 경기도 양주시로 수정·저장: 홈 과외쌤탭·학생탭, 과외쌤찾기·학생찾기 모두 정상. 그러나 마이프로필에서는 여전히 「경기도」로 표시 → 오류(마이프로필 표시가 저장 지역을 시/구까지 반영하지 않음). 진단 후 지시문.

## 과외쌤 마이프로필 「경기도」 원인 확정 (2026-10-03 01:28, 코드 확인, DB/API 응답 미확인)
- 서버 TutorHubRepository.php:192-203 primaryRegionLabel() 이 tutor_regions 대표 행의 regions.sido_name 만 읽음 → 양주시 대표도 「경기도」. 응답 primary_region_label/location_label(:96-97)에 실림 → 마이프로필 profile-read.js:88, 허브 인사말, format.js, registration-check-model.js, order-blocks.js, neighborhood-greeting-ui.js, mypage/screens.js:621 등 소비처 전부 영향. 홈·찾기는 saved_regions+도시목록으로 직접 조합(region-cascade.js:89-96)해서 정상.
- 같은 오류: src/Paid/ProviderTicketRepository.php:201-210 primaryRegionLabel(). 공부방은 아님. 학생은 시도 단독은 아니나 사이트오류-9 범위.
- 별개 발견: mypage/preview-data.js getPreviewProfile 이 regionLabel 을 안 채워 mypage/screens.js:958 계정 정보 카드 「대표 지역」이 전 역할 빈칸.
- 조치: 사이트오류-10 (서버 라벨을 TutorPositionAxis.php:163-179 cityLabel() 규칙 「시도+시군구」로). 종현 「오류 수정요망」.

## 2026-10-03 사이트오류-9 진단 결과 (Cursor, 코드 재현·수정 없음)
- ③ 홈 공부방 탭 「대치동」: search-find-surface.js:1491 resolveActiveRegionLabel('room', state) role 인자 없음 → 홈 상태에 role 없어 게스트 판정(:942-943) → GUEST_BASE_ROOM_LABEL(location-display.js:558). 렌더 시 canonical.room에 대치동(fallback) 기록.
- ② 학생 탭 「위치를 선택해 주세요」: 희망유형 기본 tutor(student-hope-type.js:43)와 표시 축 study_room 불일치(location-display.js:491-496) + :1484 게스트 값 덮어쓰기.
- ① 과외쌤 탭 희망지역 빈칸: renderTutorRegionTabs가 role==='tutor'일 때만 저장지역 읽음(:1584-1585). 학생 경로 없음.
- ⑤ 학생 찾기 「424」: search-find-surface.js:2070이 라벨 대신 region id 저장 → :997 읽기 → search-page.js:97-99 표시. 424가 어느 행인지는 운영 DB 필요.
- ④ 과외쌤 찾기 「경기 의정부시」: 카카오 result.sido 약칭(:2133,:2196). 공부방 주소찾기 결과가 SPA 상태로 과외쌤 찾기에 넘어가 canonical.tutor(src=address) 저장(:482-483). 학생 role의 과외쌤 찾기는 DB 희망지역 미독(:590-591).
- ⑥ 공부방 찾기 「신곡동」: 후보 3(카카오 주소찾기/GPS/서버 라벨 StudentHubRepository.php:508). 「424」와 번갈아 나오는 이유는 canonical.room 덮어쓰기(S6)로 확정.
- 마이페이지 희망지역은 기본 폼 저장 시 localStorage 미갱신(student-reg/screens.js:575-586,:601).
- 미확정(DB/계정 필요): regions id=424 행, dong_name '신곡' 행, 학생의 preferred_*_region_id, 계정 localStorage 세 키.
- 재현 스크립트: tmp/siteerr9/ (PC)

## 2026-10-03 사이트오류-9 발행 결정 (t1201u)
- 종현 승인: 진단 결과대로 DB 조회 없이 구조 수정 지시문 발행(「그래」). 범위=학생(parent) 모드만.
- 정본 규칙: 학생 위치=가입 분기(preferred_lesson_type)의 저장 지역. 우선순위 URL region > 직접 고른 주소 > 서버 저장 지역 > GPS. 「대치동」「서울시 강남구」「위치를 선택해 주세요」는 게스트 전용. region id 숫자 노출 금지. 공부방 탭은 저장 시·군·구 라벨, 목록·지도는 그 시·군·구 전체, 0건이면 감성 문구.
- 수정 항목: 서버 라벨(hope type별)+label 필드, search-ui 학생 지역 모듈, hydrateFindStateFromHash 저장지역 우선, 탭별 값, 회원 GUEST_PLACE_PROMPT 제거, 홈 시드, 임시값은 라벨만, 공부방 탭 지도 대치역 고정 제거.

## 2026-10-03 마이페이지 「계정 정보」 대표 지역 빈칸 조사 (t1198u, 코드 조사만·수정 없음)
- 원인: mypage/screens.js:958 `${esc(profile.regionLabel)}` 의 profile = preview-data.js:87-101 getPreviewProfile(role). PREVIEW_PROFILE.regionLabel 은 '' 고정(preview-data.js:26-30), 로그인 분기(:89-100)도 email/name/displayName/loginId/authRole/oauthProviderLabels 만 채우고 regionLabel 은 안 채움. 코드 전체에서 `.regionLabel =`/채우는 곳 없음. 주입 경로(screens.js:113)도 role 만 넘김 → 3역할 모두 항상 빈칸. 값 출처 자체가 연결돼 있지 않음.
- /api/auth/me.php:76-92 응답에 지역 필드 없음(user_id,email,role_type,name,…,needs_basic_register). profile.php 도 name/email/oauth 만. auth-session.js AuthUser(:28)에도 지역 없음. SSOT 15-mypage-structure.md:136,250 은 user_profiles.default_region_id 라고 적혀 있으나, 가입(SignupService.php:82-85,183-197)이 쓰는 「기본주소」일 뿐이고 region-register-impl-checklist.md:19 B3 로 기본등록 폴백에서 제거된 값 → 올바른 출처 아님(원칙: 기본주소≠노출지역, checklist:4).
- 올바른 출처(역할별):
  · 공부방: study_room_regions.slot=1 is_primary=1 (홍보지역1). 허브 응답 saved_regions[].{region_id,complex_id,region_basis_type,region_label(동/단지),promo_label(시도 시군구 동[·단지]),is_primary} (StudyRoomHubRepository.php:146-192). 클라는 study-room-home-seed.js:31-48 studyRoomPromo1Label(room)=primary 슬롯 promo_label 만 사용(개설 region_label 로 대체 금지). study_rooms.region_id 는 사업장주소 동이라 대표 아님(BasicRegisterService.php:365 vs 슬롯 :380).
  · 과외쌤: tutor_regions.is_primary=1(priority_order 0) = 활동지역1. 허브 응답 saved_regions[].{region_id,scope_type,is_primary}(TutorHubRepository.php:168-189), primary_region_id(:98), primary_region_label(:97)·location_label(:96). 단 primaryRegionLabel()(:192-203)은 regions.sido_name 만 읽어 「경기도」로 나옴(기지 오류, 사이트오류-10). 홈은 tutor-home-seed.js:150-161 이 saved_regions[].region_id → region-cascade.js:202-206 activityLabelFromRegionId(id, getTutorCityUnits()) 로 「시도 시 [구]」(region-cascade.js:89-96) 조합.
  · 학생: students.preferred_lesson_type 분기 — study_room 이면 preferred_studyroom_region_id(+complex_id, region_basis), tutor 면 preferred_tutor_region_id. 응답 StudentHubRepository.php:474-480 preferred_*_region_id/…complex_id/…region_basis/preferred_region_note/region_label(:506-519 resolveStudentRegionLabel: studyroom id ?? tutor id 순서, 「시도 시군구 동」 — hope type 무시라 tutor 학생도 studyroom 값이 있으면 그걸 씀). 클라 조합은 shared/student-hope-regions.js:53-112 hydrateDualHopeRegions + :132-138 primaryHopeRegionLabel(student) (student-reg/format.js:27, store.js:79, profile-read.js:59 가 사용).
- 「대표지역1 없으면 기본정보 등록 불가·카드 미노출」 규칙 실재 여부:
  · 학생: 서버 있음. BasicRegisterService.php:194-213 (공부방=requireExplicitRegionId/complex, 과외=requireExplicitRegionId+assertSelectable) 미충족 시 예외; StudentBasicCompleteness.php:46-58,64 「희망지역」 필수 8칸 중 하나; 미완성은 draft(BasicRegisterService.php:256, StudentHubService.php:98-110 rejudgeExposure 로 수정 시 published→draft 강등); 학생 카드 검색은 exposure_status='published' 만(SearchService.php:197). needs_basic_register(BasicRegisterService.php:63-83)가 draft+미완 시 기본정보로 되돌림, auth-session.js:119 가 guardian_student 만 리다이렉트. → 가장 확실히 지켜짐.
  · 공부방: 가입 서버 있음. BasicRegisterService.php:587-655 normalizeSignupPromoSlots 슬롯1 없으면 「홍보지역 1(대표)을 선택해 주세요.」(:651) — 사업장 주소로 대체 금지(:589-590). 상세 저장도 StudyRoomRegisterService.php:1065-1179 syncSavedRegions 가 DELETE 후 primary 없으면 예외(:1175-1176, saveStep 트랜잭션 롤백). 그러나 카드 노출 조건엔 없음: SearchService.php:445-449 는 hidden 만 제외(주석 :443 「공개·완성도 게이트 없음」), 대표는 LEFT JOIN(:582) → 대표 없어도 카드는 나오고 위치만 빔. 또 우회 보정 2곳이 사업장 지역으로 홍보1을 자동 생성: StudyRoomRegisterService.php:1182-1241 ensurePrimaryRegionRow(:538), StudyRoomHubRepository.php:232-265 seedPrimaryRegionIfMissing(+:210-212 `행정동 #id`/`단지 #id` 라벨 폴백, :285-306 promoLabelFromRoom 은 사업장 동으로 라벨) — 「사업장→홍보 복제 금지」(BasicRegisterService.php:589) 원칙과 충돌.
  · 과외쌤: 가입 서버 있음. BasicRegisterService.php:727-776 normalizeTutorSignupRegions 슬롯0 없으면 「활동지역 1을 선택해 주세요.」(:760). 허점: ① TutorRegisterService.php:417-493 saveRegions 가 DELETE 후 빈 목록을 허용(예외 없음, :483 은 order>0 일 때만 승격) → 'regions' 단계(:155)에서 대표를 전부 지울 수 있음. ② 슬롯1 비고 슬롯2만 채우면 slot 필터링 후 priority 0 이 자동 대표로 승격(:483-491, 클라 tutor-reg/inline-save.js:38-43 도 빈 슬롯을 걸러 통과) → 「1번이 대표」 규칙 우회. ③ 카드: SearchService.php:694-698 은 hidden 만 제외, 대표는 LEFT JOIN(:785) → 대표 없어도 노출. 게시 준비도만 대표 필수(TutorHubService.php:101, TutorDetailCompletionEvaluator.php:70,221, 클라 tutor-reg/store.js:250). 클라 검증은 inline-save.js:43-44, shared/tutor-region-slots.js:37,47,131-145.
- 비어도 되는 경우: (a) getPreviewProfile 의 비로그인 폴백(preview-data.js:90)이지만 마이페이지는 로그인 전용(screens.js:103-110 이 비로그인이면 ''), 관리자 role 도 화면 진입 불가 → 실질적으로 없음. (b) 학생이 기본정보 전(draft·행 없음) / 공부방·과외쌤이 이론상 대표 없는 레거시 행 / API 모드 캐시 hydrate 전(getStudyRooms/getTutors/getStudents 비어 있음)이면 일시적으로 빌 수 있음 → 그때는 「—」 또는 「미설정」로 표시해야 함.
- 영향 검사 스크립트: 계정 카드의 대표 지역을 직접 단언하는 검사는 없음. mypage/screens.js 문자열을 읽는 verify-paid-renewal.mjs:33, verify-tutor-mypage-frame-ia.mjs:27, verify-tutor-mypage-route-integrity.mjs:37(경로 '/mypage/account' :87) 정도이며 지역 단언 없음 → 수정해도 기존 검사 깨질 위험 낮음, 신규 검사 추가 필요.
- 수정 방향(제안, 미적용):
  1. mypage/screens.js renderAccount(:871) 또는 preview-data.js getPreviewProfile 에서 역할별로 regionLabel 합성. 공부방: studyRoomPromo1Label(pickOwnStudyRoom()) (study-room-home-seed.js:45-57) → 홍보1 promo_label. 과외쌤: tutor.saved_regions 의 is_primary 슬롯 region_id → activityLabelFromRegionId(id, getTutorCityUnits()) (tutor-home-seed.js:150-161 방식; ensureTutorCityUnits 선행), 실패 시에만 primary_region_label. 학생: primaryHopeRegionLabel(getStudents()[0]) (student-hope-regions.js:132) — 서버 resolveStudentRegionLabel 는 hope type 무시하므로 클라 조합 우선.
  2. 비면 빈칸 대신 「—」(또는 「등록 전」)으로 표시. 라벨에 region id 숫자(`행정동 #424` 류) 노출 금지.
  3. 서버 정리(별건): TutorHubRepository.php:192-203 primaryRegionLabel 을 「시도+시군구」로(사이트오류-10), saveRegions 가 대표 없는 빈 목록·슬롯1 공백을 거부하게, 공부방 사업장→홍보1 자동 생성 2곳 재검토, 검색 카드 노출 조건에 대표지역 게이트를 둘지 결정 필요(현재는 hidden 만 제외).
  4. 신규 검사: 3역할 계정 카드에 대표 지역이 비지 않는지 + 대표 없는 공부방/과외쌤 저장 거부 확인.

## 2026-10-03 t1205u 종현 논의
- 공부방: 홍보지역(홍보1 대표)=현재위치(종현 제안, 이견 없음, 홍보1 확인 대기).
- 과외 분기 학생에게 시 전체 공부방 노출은 불필요 → 가입 주소(default_region_id)에서 동을 당겨와 미리 채우고 학생이 확인·저장하는 방식 검토(조사 필요, 폴백 제거 정책과 충돌 금지).
- 공부방 분기 학생도 구조 원인(학생 저장지역 미독)은 동일해 영향 가능, 진단은 과외 분기만 수행.
- 용어 불일치: 등록「과외지역」 vs 홈 과외쌤 박스「활동지역」, 표시·규칙 논의와 함께 결정.
- 사이트오류-9 지시문(1:35 발송분)은 공부방 지역 처리 확정 전까지 보류, Cursor에 넘기지 말 것.

## 2026-10-03 t1206u 조사 결과 (읽기 전용, 수정 없음) — 기본주소·시군구 상향 경로
대상: PC D:\work\study114. 주의: 조사 시점 working tree에 사이트오류-9 진행분(미커밋)이 이미 있음 — StudentHubRepository.php(+111줄), SearchService.php, search-ui 5개, 신규 미추적 preview/search-ui/src/student-saved-region.js. 아래 「미커밋」 표시는 이 진행분.

### A. 과외 분기 학생이 공부방 탭에서 가입 「기본주소」를 가져올 수 있나
결론: 지금은 불가. 값은 저장되지만 동 id(default_region_id)는 어디서도 채워지지 않고, 클라이언트가 읽는 API도 없음.
1. 저장 위치(user_profiles): address_zip, address_line1(기본주소 = 카카오 도로명 텍스트), address_line2(상세), default_region_id(BIGINT FK regions, 주석 「기본 동 FK」), default_complex_id — sql/schema/004_member_ssot_align.sql:20-24,31. INSERT는 SignupService.php:180-201.
2. default_region_id는 항상 NULL로 추정(코드 기준; 운영 DB 값은 미확인): SignupService.php:82-83 이 입력을 받지만, 보내는 클라이언트가 없음(저장소 전체 검색에서 default_region_id는 sql·SignupService·AccountWithdrawService뿐, preview/ 0건). 가입 폼 signup-form.js:285-296 accountDraft 에는 address, address_zip, address_line2만 있음. 카카오 결과의 sido/sigungu/sigunguCode/bcode/bname(preview/shared/kakao-postcode.js:112-116)은 signup-form.js:212-216이 zonecode·roadAddress만 쓰고 버림. 즉 기본주소는 「문자열」뿐이고 동·시군구 id가 없음.
3. 필수 여부: 우편번호·도로명 주소는 필수 — 서버 SignupService.php:43(address), :75-79(address_zip 없으면 거부), 클라 signup-form.js:111-112,123-124(readonly+required), :270-273. 상세주소는 선택(:80-81). default_region_id는 선택(null 허용, :82-83). 기본주소 칸은 readonly라 직접 타이핑 불가(카카오 선택값). 단 서버는 카카오 결과인지 검증하지 않음. 상세주소가 엉터리여도 기본주소 저장에는 영향 없음(별도 필드).
4. 「항상 저장」은 아님: 이메일 가입만 필수. 소셜(OAuth) 가입은 address_line1='' 로 생성, 우편번호 없음(OAuthService.php:418-420). 연락처 stub도 ''(AccountContactService.php:167-168). 소셜 가입 학생은 기본주소 자체가 없음. (공부방 역할은 기본등록 때 집주소로 덮어씀: BasicRegisterService.php:384-390, StudyRoomRegisterService.php:696-700 — 학생은 해당 없음.)
5. 읽는 API: 없음. me.php:76-92 응답에 주소·region 필드 없음. auth/profile.php는 표시명 수정만. registrations/students.php GET → StudentHubRepository 응답(:470-505)에도 address/default_region 없음. 주소를 내보내는 곳은 관리자 AdminMemberService.php:369뿐.
6. 동 id를 얻는 기존 부품(가입 시 쓰면 됨): RegionEnsure::fromKakao(pdo, {sido,sigungu,bname,hname,bcode,sigunguCode})(RegionEnsure.php:21-60, bcode 앞 5자리를 sigungu_code로 저장 :42-44; 공부방 홍보지역이 이미 사용 BasicRegisterService.php:612). AddressRegionMatch::match(sido,sigungu,bname)(AddressRegionMatch.php:23, 동 이름 매칭+점수, 공부방 BasicRegisterService.php:517)은 동명이동 오매칭 위험 → RegionEnsure 쪽 권장.
번거로움(신규 규모, 대략): 가입 폼에서 카카오 sido/sigungu/bcode/bname/hname 보관 JS 약 15줄 + SignupService에서 RegionEnsure로 default_region_id 채우기 PHP 약 15줄(실패 시 null 허용해 가입을 막지 않음) + 읽기 API(students 응답 또는 me)에 default_region_id·정식 라벨 추가(StudentHubRepository::officialRegion 재사용) 약 30줄 + 공부방 탭 「이 동네로 찾을까요?」 확인·저장 UI 약 100~150줄 + 신규 검사. 합계 PHP 60~100줄, JS 150~250줄 수준. 구멍: 기존 가입자·소셜 가입자는 값이 없음(백필은 도로명 텍스트 재지오코딩이 필요해 별도 작업, 동 확정 불확실). 이메일 가입자만 대상이 됨.
위험/정책: 「기본등록에서 주소 자동 대체 금지」는 BasicRegisterService.php:185,211 주석(「가입 기본주소 폴백 금지」)이 근거. 서버가 몰래 preferred_studyroom_region_id를 default_region_id로 채우면 충돌. 클라가 값을 읽어 미리 채우고 학생이 확인·저장하면 충돌 없음. 저장 없이 공부방 탭 표시 기준으로만 쓰는 방식은 정본 규칙(현재 위치=서버 저장 희망지역)과 다른 소스를 추가하는 것이라 종현 판단 필요 → 권장은 「미리 채움 + 학생 확인·저장」.

### B. 공부방 분기 학생(동/단지 저장)이 과외쌤 볼 때 상위 시·군·구
결론: 가능하고 서버 부품은 거의 있음(미커밋). 신규 코드 거의 없음.
1. regions 구조: 평면 테이블, parent_id 없음. 001_init.sql:25-40 — sido_code/name, sigungu_code/name, dong_code/name. 072_region_unit_level.sql:19,28,37 로 unit_level(sido|sigungu|dong), official_code(법정동 10자리, UNIQUE :56), is_selectable 추가. 073 시드: 시군구 행 unit_level='sigungu', official_code 예 '1111000000', is_selectable=1(073_region_official_seed.sql:21-22). 동 행은 is_selectable=0, sigungu_code 5자리 보유. 연결 기준 = 동.sigungu_code 앞 5자리 = 선택행.official_code 앞 5자리.
2. 동→시군구 함수: StudentHubRepository::selectableSigunguForDong(:589-603) + officialRegion(:539-582) → 응답 preferred_studyroom_sigungu_region_id/label(:484-485) (미커밋). 구→동 방향은 RegionGuLink::dongIdsUnderGu(RegionGuLink.php:90-113)·guIdByOfficialCode(:66)이고 동→구 공개 함수는 없음(위 private뿐). TutorPositionAxis::cityLabel(TutorPositionAxis.php:163-179)은 city id→「시도 시군구」 라벨 변환이지 동→시 아님. RegionEnsure(RegionEnsure.php:21-60,137-142)는 동 행 생성만, 시도는 카카오 약칭 그대로 저장. SidoRegionEnsure::assertSelectable(:52-63), ensureAndListCities(:32-50)는 선택 단위 검증/목록. JS는 region-cascade.js selectionFromRegionId(:177)/activityLabelFromRegionId(:202)/regionIdFromActivityLabel(:193)이 선택 단위 안에서만 동작(동 id 불가), student-hope-regions.js:44 cityLabelFromRegionLabel은 trim뿐 → 클라 동→시 변환 없음. 신규 student-saved-region.js(미추적)가 서버 sigungu 필드를 읽음(:59-64, branchSigungu :75-79, studentPlaceFor :89-97).
3. 과외쌤 검색 API: search.php:38-86 → SearchService::searchTutors(:713) filters.tutor_region_id. selectableRegionId(:1249-1269)가 is_selectable=1 아니면 422, tutor_regions.region_id 정확 일치(:723-729), tutor_region_label은 거부(:722). 즉 시·군·구(선택 단위) id만 받고 동 id는 못 받음. 과외쌤은 가입 때 선택 단위 id로 저장(BasicRegisterService.php:704-705). → 동에서 시군구 id를 먼저 구해야 하고, 서버가 이미 sigungu_id를 내려줌.
4. 공부방 목록 API 시군구 필터: 있음(미커밋 추가). SearchService.php:473-491 sigungu_region_id(selectable 검증 + dongIdsUnderGu로 본인 지역·홍보지역 전체 매칭), 게스트 허용 키 :136, 클라 사용 search-find-surface.js:368-370. 커밋본은 region_id(동 정확 일치 :452-458)와 region_label만 지원.
번거로움: 서버·클라 부품이 이미 사이트오류-9 진행분에 있음. 남는 일은 과외쌤 탭에서 preferred_studyroom_sigungu_* 를 쓰는 연결과 검사(소규모). 
위험: (a) 동 행의 sigungu_code가 폴백값(sido+'000' 또는 '00000', RegionEnsure.php:45-53)이면 매칭 실패 → sigungu_id null. 이때 값을 임의로 채우지 말고 「활동지역을 선택해 주세요」식 선택 유도로 처리해야 함. (b) 구가 있는 시(예 수원시 영통구)는 선택 단위가 구 단위라 구까지 내려감(SidoRegionEnsure.php:92-97 city_gu) — 표시 문구 확인 필요. 정책 충돌: 읽기 전용 파생 표시면 충돌 없음. 공부방 분기 학생의 preferred_tutor_region_id를 서버가 자동 저장하면 「자동 대체 금지」와 충돌하므로 금지.

### 종합
- 질문 B(공부방 분기→과외쌤)는 쉬움(이미 대부분 구현). 질문 A(과외 분기→공부방)는 새 데이터가 필요: 가입 때 카카오 id를 버리고 있어 default_region_id가 비어 있음. 이메일 가입자 신규분부터만 채워지고 기존·소셜 가입자는 비어 있어 별도 처리 필요.

## 2026-10-03 01:52 결정 대기 요약 (t1206u 조사 결과)
- 주의: PC에 사이트오류-9 진행분(StudentHubRepository.php, SearchService.php, search-ui 5개, 신규 student-saved-region.js)이 미커밋으로 존재 — 보류 지시가 Cursor에 넘어간 것으로 보임. 결정 전 수락 금지.
- B(공부방 분기→과외쌤 시군구): 부품 대부분 존재, 소규모.
- A(과외 분기→공부방 기본주소): 가입 폼이 카카오 sido/sigungu/동 정보를 버리고 default_region_id 항상 빈 값. 서버 응답에 주소·지역 없음. 소셜 가입자 주소 없음. 중간 규모.
- 선택지: 1) 가입 때 동 저장+공부방 탭 확인·저장 2) 가입 데이터 변경 없이 공부방 탭에서 시군구 전체+동·단지 선택 유도. 종현 결정 대기.

## 2026-10-03 02:03 t1208u 결정
- 종현: 과외 분기 학생의 공부방 탭은 2번 방식(시군구 전체 표시+동·단지 선택 유도, 학생이 확인·저장, 선택은 필수 아님) 채택(「너를 믿어볼게」). 소셜 가입자도 기본등록(지역 필수)은 해야 함.
- 찾기 필터 지역칸에는 현재위치가 미리 채워져 있고(회색 표시), 바꾸려 손대면 수정(t1197u 입력칸 규칙과 같은 방향). 찾기 화면에 적용할지는 종현 확인 대기.
- 다음: PC의 사이트오류-9 진행분 diff 검토 후 분기별 표로 지시문 재작성.

## 2026-10-03 02:20 사이트오류-9 수락(로컬, 미커밋·미배포)
- 직접 재검증: verify-student-location-flow 228/0, role-home-guard 56/0, tutor-box 49/0, location-ssot 통과, guest-baseline 72/72, php -l 2건 OK. StudentHubRepository(희망유형 우선·라벨 필드·시군구 파생)·student-saved-region.js·SearchService sigungu_region_id(게스트 우회 차단) diff 확인.
- 부작용(수용): 지역 없는 회원(공부방·과외쌤)도 게스트 문구 대신 「마이페이지에서 지역을 등록해 주세요」 표시(문구만 변경).
- 미구현(후속 9b 필요): t1208u 결정 2번 중 「과외 분기 학생이 공부방 탭에서 동·단지를 골라 확인·저장」. 현재는 시군구 전체 표시까지만. 라이브 확인(학생 계정, 의정부→도봉구) 종현 몫.
- 남은 확인: 네이버 지오코더 시·군·구 중심 이동 실제 SDK 미확인, 소셜 가입 학생 경로.

## 2026-10-03 02:35 사이트오류-10 수락(로컬, 미커밋·미배포)
- 직접 재검증: verify-tutor-region-label 103/0, student-location-flow 228/0, role-home-guard 56/0, tutor-box 49/0, php -l 4건 OK. OfficialRegionLabel 신설(학생 헬퍼 이동+sigunguLabel), TutorHubRepository·ProviderTicketRepository 과외쌤 라벨 시도+시군구.
- 주의: 이용권 응답 region_label이 과외쌤 대표 없을 때 null(ProviderTicketService:208) — 클라이언트 표시 확인 필요. 라이브 전제: 운영 DB 072 적용.
- 다음: 사이트오류-9b(과외 분기 학생 공부방 탭 동·단지 선택·확인·저장) 지시문.

## 2026-10-03 — 사이트오류-9b 사전 조사: 과외 분기 학생의 공부방 탭 동·단지 선택 / 확인 후 저장 (읽기 전용 조사)

기준: D:\work\study114, 사이트오류-9(미커밋 로컬) 반영 상태. 코드 수정 없음. 줄 번호는 현재 작업 트리 기준.

### 한 줄 결론
- 「보기 전용 동 선택」은 이미 대부분 있다(주소찾기 → 고른 동으로 공부방 목록 필터, 저장 안 함).
- 「확인 후 서버 저장」은 학생용 공부방 탭에 없다. 단, 서버 저장 API(PATCH students)는 이미 동·단지·기준값을 모두 받는다. 막는 것은 클라이언트 두 곳과 서버 SearchService 부작용 세 곳이다.
- 단지(apartment) 단위는 찾기 쪽 목록 필터가 없다(공부방 검색에 complex 조건 없음). 동 단위가 현실적인 1차 범위다.

### 1. 공부방 탭 지역 선택 UI와 저장 위치 (search-find-surface.js)
- 선택 UI 두 곳, 둘 다 카카오 주소찾기(openKakaoPostcode) 하나뿐이다. 시→구→동 드롭다운(cascade)은 공부방 탭에 없다.
  - 홈(#/parent) 지역 바 「지역 변경」 버튼: :2016-2021 (variant=home, role=parent일 때만). 클릭 처리 :2540-2574.
  - 찾기 화면 필터의 지역(동/단지) 칸 「주소찾기」: :1888-1898 (field.key=region_id), 클릭 처리 :2576-2619.
  - 찾기 화면(variant=search)에서는 상단 지역 바가 숨겨진다(:2110-2113, search-page.js:145 hideRegionBar:true). 그래서 /search/room에서는 필터 칸의 주소찾기만 보인다.
- 고른 값의 행방(학생): canonicalFromKakao(:424-442)가 studentPicks[tab]에 메모리로만 보관, source='address'. 저장소(localStorage)·서버 어디에도 쓰지 않는다.
  - 저장 선택(find-canonical) 미사용: applyCanonicalLocation :744-745(role!=='parent'일 때만 writeStoredCanonical).
  - 임시값(lastRegionByHope) 미사용: 학생이면 writeStoredHopeRegion 건너뜀 :2554, :2604.
  - URL ?region=에는 실린다(address일 때 pinned, :774-777). 새로고침하면 URL 값으로 복원(hydrateStudentPlace :317-348).
  - 탭 이동 시 clearStudentPick(:445-450)는 희망유형 변경 때만 호출. 평소에는 그 탭의 studentPicks가 세션 동안 남는다.
- 목록 필터: studentFeedFilters :356-376.
  - 서버 저장 지역(source='saved') → studentPlaceFilters(student-saved-region.js:106-119) → room은 동이면 region_id, 시·군·구면 sigungu_region_id.
  - 직접 고른 값(source='address') → room 탭: 구 단위면 sigungu_region_id, 그 외(동·단지)는 {region_label: 「경기도 의정부시 신곡동」} 글자 비교(LIKE). → 동 id 정확 일치가 아니다. 검색 버튼 경로(runFindSearch :2344-2361)도 saved일 때만 id로 바꾸고 address는 폼 값(label) 그대로.
  - 공부방 분기 학생의 「학생 찾기」 탭만 예외로 ensureRegionFromKakao로 동 id를 확정한다(confirmStudyroomDong :612-632, 호출 :2563-2565, :2607-2609). 공부방 탭(room)에서는 이 확정을 호출하지 않는다.
- 사이트오류-9 「학생은 찾기 저장 선택 미사용」과의 충돌: 충돌 아님. 그 규칙은 localStorage의 find-canonical에 관한 것이고, 이번 「확인 후 저장」은 서버(PATCH) 저장이라 별개 경로다. 다만 그 규칙 때문에 「저장」이 없는 현재 구조에서는 새로고침/다른 기기에서 고른 동이 사라지는 것이 정상 동작이다.
- 진짜 충돌 지점(저장을 붙이면 깨지는 곳):
  1) student-saved-region.js:93 studentPlaceFor(room): 과외 분기(lessonType='tutor')는 `sigungu || saved.studyroom` 이라 저장된 공부방 동이 있어도 시·군·구가 항상 우선한다. 동을 저장해도 공부방 탭은 계속 시·군·구로 뜬다. → 과외 분기에서 saved.studyroom을 먼저 읽도록 바꿔야 한다.
  2) student-saved-region.js:130-137 syncStoredHopeRegionsFromSaved: study_room 슬롯은 saved.studyroom 라벨을 쓰므로 저장 후에는 자연히 갱신된다(OK).
  3) search-find-surface.js:360-367: studyroom dong를 state.studyroomDongRegionId로 덮는 분기는 tab==='student'&&hope==='study_room' 전용. room 탭 저장 동은 studentPlaceFilters(room, dong)=region_id 로 이미 처리됨(OK).
  4) 지도: naver-map.js:231-240이 저장 지역 중심으로 이동(동 줌 15). source='address'일 때 지도가 고른 동으로 가는지는 별도 확인 필요(시나리오 (e)는 라벨만 검증, 지도는 saved 경로 (f)만 검증).

### 2. 마이페이지(student-reg/screens.js)와 서버 저장 경로 — 재사용 가능한 부분
- 기본 폼 renderBasicForm :252-340: 공부방 패널(:315-335)에 「희망지역 기준」(preferred_studyroom_region_basis: dong/complex) + 동 select(preferred_studyroom_region_id, 전체 regions 목록 basicRegionOptions :237-249) + 단지 select(preferred_studyroom_complex_id, listAllComplexes :275) + 예산. 과외 분기에서는 이 패널이 hidden이고 submit 시 disabled라서 값이 전송되지 않는다(syncBasic :520-534). 즉 과외 분기 학생은 마이페이지에서도 공부방 지역을 저장할 방법이 없다.
- 저장 :562-613: parseStudentForm → updateStudent(store.js:189) → apiStudentAction(PATCH /api/registrations/students.php, registrations-backend.js:127) → 성공 시 syncStoredHopeRegionsFromStudent(:601). 과외 분기는 :575-587이 tutor 지역 필수 검사만 한다(공부방 검사 없음, 유지해도 됨).
- 서버 PATCH 허용 필드: StudentHubRepository.php:127-136 PATCH_COLUMNS에 preferred_studyroom_region_id / preferred_studyroom_complex_id / preferred_studyroom_region_basis 모두 있음. 검증 :335-354 (id는 숫자 + regions/complexes 테이블 is_active=1 존재 확인, basis는 dong|complex). 단지 id만 보내면 소속 행정동을 region_id로 함께 저장 :184-187 (complexRegionId :362-372).
  - 과외 분기 학생이 공부방 동/단지를 PATCH해도 서버가 거부하지 않는다(lesson_type 분기 검사 없음). StudentHubService::update :75-92는 patchStudent 후 rejudgeExposure만 한다. 완성도 판정(StudentBasicCompleteness.php:46-58)은 tutor 분기에서 preferred_tutor_region_id만 보므로 공부방 지역을 채워도 노출 상태는 안 바뀐다(OK).
  - 응답 hydrate :476-485가 preferred_studyroom_region_id/complex_id/region_basis/라벨/시군구 id·라벨을 내려준다. 단지 라벨(complex name)은 응답에 없다(complex_id만) → 단지까지 하려면 서버 응답 보강 필요.
  - 클라이언트는 응답을 getStudentsCache로 받으므로 PATCH 후 캐시 갱신(registrations-backend.js:91-94) → readStudentSavedRegion이 곧바로 새 값을 읽는다.
- 동 id 확정: ensureRegionFromKakao(shared/region-ensure.js:8-28) → /api/auth/regions.php action=ensure(RegionEnsure::fromKakao, regions.php:58-65)는 로그인 불필요, 이미 찾기 화면이 쓰고 있다. 그대로 재사용 가능.
- 단지 확정: 학생 PATCH는 complex_id(기존 행)만 받는다. 카카오 아파트 결과를 complexes 행으로 만드는 ComplexEnsure::ensure는 가입(BasicRegisterService:546, 624)과 공부방 등록(StudyRoomRegisterService:581)에서만 호출되고, 공개 API 액션이 없다. → 찾기에서 카카오로 고른 아파트를 저장하려면 신규 서버 경로(또는 PATCH가 complex_name/address를 받아 ensure) 필요. 또는 1차는 마이페이지의 기존 단지 select(complexes 마스터)로 안내.
- 찾기 화면에서 재사용 가능: ensureRegionFromKakao, confirmStudyroomDong(:612-632) 패턴, updateStudent/apiStudentAction, 서버 PATCH 전체, readStudentSavedRegion/studentSavedRegionFromRecord.

### 3. 두 동작을 넣을 최소 변경 위치와 규모 (제안)
A. 보기 전용 필터(저장 안 함) — 현행 유지 + 보정 (소규모)
 - 동 id로 필터: room 탭에서 주소찾기 직후 confirmStudyroomDong와 같은 방식으로 동 id 확정 → studentFeedFilters :368-371에서 label 대신 region_id 사용. 변경: search-find-surface.js 20줄 내외(:2540-2574, :2576-2619, :368-371). 단지는 목록 필터 없음이라 동으로 올려 보기(단지명은 표시만).
 - 「저장 지역으로 되돌리기」: clearStudentPick(:445) 이미 있음, 버튼 연결만.
B. 확인 후 저장 — 신규 UI + PATCH 연결 (중규모)
 - UI: 고른 위치가 서버 저장값과 다를 때 지역 바/필터 칸에 「이 동네를 희망지역으로 저장」 확인 버튼(또는 확인창). 위치: renderCompactRegionBar :2014-2034 (home/search 두 변형) + 필터 칸 :1888-1898 주변. 약 40~60줄.
 - 저장 동작: 새 함수(예: saveStudyroomRegionFromPick)에서 ensure로 확정한 동 id를 updateStudent(id, {preferred_studyroom_region_id, preferred_studyroom_region_basis:'dong'}) — 학생 id는 pickStudentRecord(student-saved-region.js:40-46)로 얻는다. 약 30줄. 성공 후 clearStudentPick + syncStoredHopeRegionsFromSaved 후 rerender.
 - 읽기 보정: student-saved-region.js:93 (과외 분기도 저장 동 우선) 1줄 수정 + 내부 주석/문서 갱신.
 - 단지까지: 서버 PATCH에 complex_name/address→ComplexEnsure 연결(StudentHubRepository normalize 쪽 30~50줄) + 응답에 complex 라벨 추가 + 공부방 검색에 complex 조건 신설(SearchService searchRooms) — 별도 큰 작업. 1차 비포함 권장.
 - 합계 예상: 클라이언트 JS 약 100~150줄(2~3파일), 서버 변경 0줄(동 단위 한정) , 검사 스크립트 신규 1개 + 기존 1개 기대값 수정.

### 4. 영향받는 검사와 위험
- 영향받는 검사 스크립트(실제 import/참조 확인): verify-student-location-flow.mjs (시나리오 (e) :598-655 「공부방 주소찾기는 저장하지 않음·임시값 안 덮음·서버 저장 그대로」, (f) :657-666), verify-guest-baseline-map-cards.mjs, verify-student-count-halt-and-gate.mjs, verify-card-visual-penetration.mjs(SearchService/StudentHub 참조), verify-tutor-region-label.mjs(OfficialRegionLabel 경유). 저장 기능을 넣으면 (e)의 「저장 안 함」 단정(:637-642)은 「확인 전에는 저장 안 함」으로 바뀌어야 하고, 확인 후 PATCH 호출·캐시 갱신·새로고침 후 유지 시나리오 (g)를 신설해야 한다.
- 위험 1 (서버, 중요) — 과외 분기 학생이 공부방 동을 저장하면 SearchService가 이를 지역 매칭에 쓴다:
  - SearchService.php:174-190 studentGuBaseWhere: `tutor_region = 구 OR studyroom_region IN (구 소속 동)` → 과외 분기 학생이 의정부 과외 + 도봉구 동 저장이면 도봉구 과외쌤 검색/학생 탭/게스트 학생 수(:192~)에 노출·집계됨. 과외 분기 학생에게는 preferred_lesson_type 필터를 같이 걸 때도 영향(:923-926, :942-943).
  - SearchService.php:1032 학생 카드 지역: `COALESCE(preferred_studyroom_region_id, preferred_tutor_region_id)` → 과외 분기 학생 카드(과외 분기는 :1068-1070 시도+시군구로 표시)가 공부방 동 행의 sido/sigungu를 읽게 된다. 동 행의 sigungu_name 표기가 달라지면 카드 지역이 바뀔 수 있음.
  - 대응안: 과외 분기(preferred_lesson_type='tutor')일 때는 studyroom 컬럼을 매칭/카드에서 제외하거나(권장: lesson_type 조건 추가), 공부방 탭 전용 별도 저장 필드를 둔다. 지시문에서 「과외 분기 학생의 공부방 희망은 학생 노출(카드·집계)에 영향 없음」을 Must로 못박고 검사로 고정해야 한다.
  - 공부방 선호 저장이 학생 카드 노출(StudentBasicCompleteness) 상태를 바꾸지는 않음(위 2번).
- 위험 2: 게스트 — 게스트는 guestScopedFilters(SearchService.php:133-163)가 모든 지역 키를 지워 대치동/구 기준으로 고정. 학생 전용 UI·PATCH를 role==='parent'에서만 노출하면 영향 없음. renderCompactRegionBar의 change-region 버튼은 현재 role==='parent' 전용(:2019)이라 안전하지만, 필터 칸 주소찾기(:1888)는 모든 역할이 쓰므로 저장 버튼은 반드시 role==='parent' 가드.
- 위험 3: 공부방·과외쌤 회원 — 같은 renderCompactRegionBar/바인딩 코드가 공유되고 writeStoredHopeRegion(:2554/:2604)은 role!=='parent'에서 동작 중. 새 저장 코드는 role==='parent' 분기 안에만 넣고 기존 분기는 건드리지 말 것.
- 위험 4 (임시값 계약): 사이트오류-9 계약 = 임시값(lastRegionByHope)은 라벨만, 학생은 서버 저장 지역을 비춘다(syncStoredHopeRegionsFromSaved 매 렌더, resolveStudentActivePlace :300-301). 저장 직후에는 PATCH 응답 → 캐시 → sync 순서를 지켜야 하고, 선택(address) 상태에서 sync가 임시값을 덮어쓰는 기존 동작은 그대로 둔다(고른 값을 임시값에 쓰지 않음).
- 위험 5: 서버 검증이 느슨함 — preferred_studyroom_region_id는 is_active 행이면 동이 아닌 시·군·구/시도 행도 통과(:335-350). 클라이언트가 ensure로 얻은 동 id만 보내더라도, 서버에 「동 단위만」 검사를 추가하는 것이 안전(소규모 추가). 과외 분기에서 basis=complex + complex_id 저장 시 region_id 자동 덮어쓰기(:184-187)는 학생 카드 지역(COALESCE)에 영향.
- 위험 6: complex_id를 비우려면(동 기준으로 전환) 명시적으로 null을 보내야 하고(isset(null) 분기 :185), basis='dong' 전환 시 서버가 단지 id를 자동으로 지우지 않는다.
- 위험 7: 운영 전제(072 이후 DB, 네이버 지오코더로 구 단위 중심 이동)는 사이트오류-9와 동일, 브라우저 실검증 불가.

### 5. 소셜 가입 학생도 같은 경로로 저장 가능한가
- 가능. 소셜 가입도 계정 생성 후 complete-role(OAuthRoleService.php:16 student→guardian_student, :55 needs_basic_register=studentNeedsBasicInfo) → 기본등록(BasicRegisterService.registerStudent :181~, 과외 분기는 tutor 지역 필수 :210-214, 공부방 지역은 null)으로 일반 가입과 같은 students 행을 만든다. 저장 API(students.php)는 requireAuth + requireRole('guardian_student')만 보므로 가입 경로(소셜/일반)와 무관하게 동일하게 PATCH 가능.
- 전제: 기본등록이 끝나 students 행이 있어야 한다(없으면 studentNeedsBasicInfo로 기본등록 화면). 이메일 인증 게이트(EmailVerificationRequiredException)는 publish에서만 요구하고 update는 요구하지 않음(StudentHubService :54 publish 한정). 소셜 가입 학생이 이메일 미인증이어도 PATCH update는 통과하는지는 RegistrationApi::requireAuth 구현까지 확인 필요(미확인).

### 6. 지시문(사이트오류-9b)에 담을 결정 사항 (종현 확인 필요)
1) 1차 범위: 동 단위만(권장) vs 단지까지(서버 ComplexEnsure 연결 + 단지 라벨 응답 + 공부방 검색 complex 조건 필요, 큼).
2) 서버 부작용 대응: 과외 분기의 공부방 희망 저장이 학생 노출/집계(SearchService :188-189, :1032)에 영향 주지 않도록 lesson_type 조건 추가 — 승인 필요(SearchService 수정 허용 목록에 추가).
3) 저장 확인 방식: 확인창 vs 지역 바 안의 「희망지역으로 저장」 버튼, 저장 후 과외 분기 학생이 마이페이지에서 공부방 지역을 보고 수정할 수 있게 할지(현재 과외 분기에서는 공부방 패널 숨김).
4) 저장 시 preferred_lesson_type은 바꾸지 않음(과외 분기 유지) 확정.

### 부록: 확인한 주요 파일:줄
- preview/search-ui/src/search-find-surface.js: 203-215, 296-310, 317-348, 356-376, 424-450, 592-632, 736-755, 762-791, 1862-1898, 2014-2034, 2110-2113, 2324-2362, 2540-2619
- preview/search-ui/src/student-saved-region.js: 40-46, 52-66, 69-72, 89-97, 106-119, 130-149
- preview/home-ui/src/student-reg/screens.js: 237-249, 252-340, 520-534, 562-613 / store.js:189-200 / hope-region-masters.js:27-71
- src/Registration/StudentHubRepository.php: 127-136, 148-224, 323-372, 452-485 / StudentHubService.php: 75-111 / StudentBasicCompleteness.php: 36-80
- src/Search/SearchService.php: 133-190, 441-491, 915-945, 1021-1075
- public/api/auth/regions.php:58-65, shared/region-ensure.js:8-28, public/api/registrations/students.php, src/Auth/BasicRegisterService.php:181-214, OAuthRoleService.php

## 2026-10-03 02:36 9b 결정 제안(종현 확인 대기, 무응답 시 동의)
1) 동 단위만(단지 제외) 2) SearchService에 과외 분기 학생의 공부방 컬럼 매칭 제외 조건 추가(SearchService.php:188-189,1032) 3) 지역 바 「희망지역으로 저장」 버튼+확인 후 서버 PATCH, 마이페이지 공부방 지역 표시 4) preferred_lesson_type 유지. 서버 PATCH_COLUMNS에 이미 컬럼 있음. 보기 전용 필터는 이미 존재(studentPicks).

## 2026-10-03 02:50 9b 설계 논리 검토 결과 (Cursor 질의 회신) — 제안 설계 철회
- 결론: preferred_studyroom_region_id NOT NULL ⇒ 공부방 분기 학생이라는 암묵 불변식에 서버 4곳 의존(SearchService.php:188-189 구 단위 학생 지역/게스트 학생 수, :929-944 학생 검색, :1032·1069 카드 지역(약칭 시도 노출), AdminExposureRepository.php:20-26,90-93,170-174 관리자 라벨). 과외 분기 학생이 이 컬럼에 쓰면 모두 어긋남.
- 추가: PATCH가 동 여부 미검증(StudentHubRepository.php:335-350, 시군구·「시 대표」 허용), 지역 저장이 rejudgeExposure로 카드 노출 상태를 뒤집음(StudentHubService.php:98-110), 분기 변경 경로 존재(student-reg/screens.js:303,546), complex_id 잔존, 저장 후 studentPicks 미정리로 쿼리 불일치, bname/hname 라벨 차이.
- 대안: A) 서버 저장 없이 탭별 sessionStorage 보기 전용 pick(권장, 변경 최소) B) students 전용 컬럼 신설(DDL, 운영 선적용) C) 현 설계+10곳 변경(회귀 위험 최대).
- 종현 결정 대기: 「새로고침 유지」면 A, 「다른 기기·다음 로그인 유지」면 B.

## 2026-10-03 02:58 t1223u 종현 단순화 확정(9b 철회·대체)
- 종현: 학생은 가입 분기(공부방/과외) 하나만. 과외 분기=홈 탭 2개(우리동네 과외쌤, 우리동네 학생), 공부방 분기=홈 탭 2개(우리동네 공부방, 우리동네 학생). 마이페이지에서 분기 변경 시 지역설정 초기화+「수정해야 한다」 안내, 새 분기의 지역설정 로직으로 입력. 반대도 동일.
- 9b(과외 분기 학생의 공부방 동 저장/선택) 철회. 사이트오류-9의 「과외 분기 학생 공부방 탭 시군구」 처리는 정리 대상.
- 확인 대기(추천안): 1) 홈·찾기 모두 2탭 2) 초기화는 확인창 동의 후 저장 시점 3) 지역 비면 카드 노출 내려감 유지+안내 4) 기존 양쪽 값 보유 학생은 현재 분기 값만 사용.

## 2026-10-03 03:00 t1224u/t1225u 종현 확정
- 1~3 추천안 확정(홈·찾기 2탭 / 확인창 동의 후 저장 시 초기화 / 지역 비면 카드 노출 내림+안내).
- 교습형태(분기) 변경 후 등록 저장하면 반드시 「새로고침해 주세요」 안내(상위메뉴 반영).
- 지역·정보 수정으로 노출 카드가 갱신돼야 하는 경우에도 동일하게 새로고침 안내 문구를 붙인다.
- 4번: 두 지역값 동시 보유 학생이 샘플이면 종현이 직접 삭제. 기존 데이터 보정 알고리즘은 만들지 않고 지금부터 생성되는 값에만 강제 적용.

## 2026-10-03 03:05 학생 분기 교차 조사 결과(읽기 전용, 수정 없음)
- 두 지역값 동시 보유: 가입(BasicRegisterService:189-214)은 한쪽만. 마이페이지 분기 변경 저장 시 숨긴 패널 값까지 전송(student-reg/screens.js:125-154,562-613)+서버 patchStudent(StudentHubRepository:148-198)가 반대쪽을 안 비워 동시값 생김. 레포 SQL 샘플(012_search_dev_seed, rest-schema)엔 동시값 없음. 로컬 DB 실데이터는 미확인(확인 SELECT: students 에서 두 컬럼 NOT NULL).
- 제거: student-saved-region.js branchSigungu 반대쪽 폴백(74-79), StudentHubRepository resolveStudentRegionLabel 반대축 폴백(511-530).
- 수정: provider-home.js PROVIDER_HOME_MODES.parent(3탭→분기별 2탭), state.js parentTab 기본값, site-nav-config.js parent(find_room/find_tutor 중 분기 하나), route-access.js 반대 분기 직접 URL 차단, search-page.js 축 고정, search-find-surface.js(studentHope/ensureParentHope 219-238, studentTarget, studentFeedFilters 355-375, HOPE_REGION_STORAGE_KEY, qHope 교차, resolveStudentSearchHope 1623-1637, 필터 폴백), student-saved-region.js(52-66,89-119,130-147), shared/student-hope-regions.js(hydrateDualHopeRegions), StudentHubRepository(452-456,476-485 studyroomSigungu 교차 제거 후보), student-reg/screens.js(분기 변경 확인창·반대 패널 비전송·저장 후 새로고침 안내).
- 핵심 서버: patchStudent 에서 preferred_lesson_type 변경 시 반대쪽 지역·complex_id·region_basis NULL 정리.
- 유지: SearchService sigungu_region_id 필터(공부방 탭 검색용), 학생 검색 필터, StudentBasicCompleteness, student-auth-bridge, renderTutorRegionTabs(과외쌤 모드), getProviderHomeMode 폴백.

## 2026-10-03 03:13 t1228u 종현 지시: 과외쌤 홈 검색 블록 제거
- 공부방 홈=지역 카드 바로 노출, 우리동네 학생 탭=지역 베이직카드 바로 노출(홈에 검색 없음, 더 찾기는 「학생찾기에서 더 찾아보기」 링크배지). 검색은 찾기 페이지에서만.
- 과외쌤 홈(우리동네 과외쌤 탭·우리동네 학생 탭)의 검색 블록 제거. 공급자 지역 필터링된 카드 바로 노출, 없으면 공부방처럼 샘플카드 1장+나머지 슬롯 빈카드박스. 기준은 공부방 홈 구성·학생 탭.
- 절차: 공부방 홈/학생 탭 vs 과외쌤 홈 「정본/현재/차이」 표 → 승인 → 지시문.

## 2026-10-03 03:16 공부방 홈 vs 과외쌤 홈 조사 결과(읽기 전용)
- 과외쌤 홈(공급자) 검색 폼은 이미 숨김(provider-home.js:150-153, tutor.js:140). 학생(parent) 홈은 3탭 모두 검색 폼+change-region 버튼 노출(screens/parent.js).
- 과외쌤 홈 과외쌤 탭 카드=서버 조회 아님. getProviderSelfFeed가 목업 EXPOSURE_TUTORS id=1 한 장 강제(search-provider-self.js:44-50, search-region-feed.js:41-48). 샘플1+빈카드 구성 미적용.
- 과외쌤 홈 학생 탭: 활동지역 3탭(renderTutorRegionTabs) 남음, liveStudentItems 연결 없음→항상 0건 안내(provider-home.js:1152-1155, search-region-feed.js:31-34).
- 공부방 홈 학생 탭: searchApi('student',{preferred_lesson_type:'study_room',preferred_studyroom_region_id}) + 「학생찾기에서 더 찾아보기」 배지(provider-home.js:200).
- search-tier-render.js:60 !items.length 가 샘플+빈칸보다 먼저 0건 안내 반환 → 홈 공급자 0건일 때 샘플+빈칸 안 나옴(공부방 포함 점검 필요).
- 필요: bootTutorHomeTutors(searchApi tutor, tutor_region_id=대표 활동지역), bootTutorStudentDemand(preferred_lesson_type tutor, 대표 구), 홈+공급자 0건 샘플+빈칸 분기. 서버 API 신규 불필요(SearchService searchTutors:723-728, 학생 923-944).

## 2026-10-03 03:18 t1229u 종현 정정(치환)
- t1228u의 「과외쌤 홈 검색블록」은 오해 정정: 대상은 **학생 홈(parent)**. 학생 홈에 검색 블록 불필요. 분기별 2탭(과외: 우리동네 과외쌤+우리동네 학생 / 공부방: 우리동네 공부방+우리동네 학생)이 지역 카드를 바로 노출(공부방 홈 방식), 없으면 샘플 1장+빈카드박스, 더 찾기는 「찾기」 링크배지. 검색은 찾기 페이지에서만.
- 과외쌤 모드 홈의 목업 자기카드(search-provider-self.js)·학생 탭 연결 누락·활동지역 3탭은 별도 항목으로 큐에 기록(진행 순서 새치기 안 함).

## 2026-10-03 03:19 t1230u 종현: 과외쌤 모드 홈은 정상. 위 03:18의 「별도 항목 큐」 기록은 철회(과외쌤 모드 홈은 손대지 않음). 범위는 학생 홈·찾기 정리뿐.

## 2026-10-03 03:24 t1232u 종현 판단(과외쌤 모드 홈)
1. 샘플카드가 내 지역을 정확히 읽어 노출하면 로직 OK(현재 코드는 목업 id=1 강제 → 지역 읽기 여부 확인 필요).
2. 우리동네 학생 탭 항상 0건 = **오류**. 지역 필터된 베이직카드가 나와야 하고, 없으면 「없다」 카피.
3. 활동지역 3탭: 3지역 모두 베이직카드 노출이 정본. 대표지역은 픽/프라임. 2·3지역에 픽/프라임 광고를 걸고 싶으면 그 알고리즘이 미구축일 가능성(코드 확인 필요, 정책 논의 필요).
- 큐 제안: A 학생 홈·찾기 정리(승인 대기) → B 과외쌤 홈 학생 탭 오류 → C 활동지역 2·3 베이직 노출/픽·프라임 광고 구조 점검(정책 논의). 순서 승인 대기.

## 2026-10-03 03:27 t1234u 종현 확정
- 공부방 홍보2·3 의미 확정: 홍보1=대표=현재위치. 홍보2·3은 (1) 그 지역 목록 베이직카드 노출 (2) 그 지역 통계 열람 (3) 프라임·픽은 지역별 별도 구매. 단, 논리 오류 없는지 Cursor 읽기 전용 점검 후 확정(티켓 C).
- A(학생 홈·찾기 정리+분기 변경 처리), B(과외쌤 홈 학생 탭 오류) 진행 승인. 순서 A→B→C. 티켓은 한 번에 하나씩 전달.

## 2026-10-03 03:32 t1237u 종현 지시: 히스토리(문서) 기록 강화
- 작업 추적을 위해 모든 확정·지시문 발행·수락/반려 결과를 날짜·근거(종현 발언 번호, 코드 위치)와 함께 문서에 남긴다.
- 사이트오류-11(학생 홈·찾기 분기 정리+분기 변경 처리) 지시문 발행 완료(03:27). 수락 시 확인한 검사·diff 근거를 같은 문서에 기록. 다음: B(과외쌤 홈 학생 탭 오류), C(홍보2·3 논리 점검, 읽기 전용).

## 2026-10-03 03:58 사이트오류-11 수락(로컬, 미배포)
- 근거: 내 쪽 재검사 전부 기대치 일치 — branch-two-tabs 115/0(신규, home-ui 안에서 실행 필요), student-location-flow 188/0(의도된 감소), role-home-guard 56/0, home-news-row 226/0, tutor-region-label 103/0, tutor-box-real-values 49/0, guest-baseline 72/72, location-ssot 통과, student-count-halt 28/0, info-boards-client 58/0, php -l OK.
- diff 확인: patchStudent/dropOppositeBranchRegion(StudentHubRepository:148-267, FOR UPDATE, 분기 변경 시 4컬럼 NULL, 반대쪽 요청값 무시), SearchService:1032 분기 CASE, student-saved-region 반대 폴백 제거, search-tier-render:331-337 학생 홈 0건 샘플(학생·조회완료일 때만), provider-home 학생 홈 한정, student-reg/screens 확인창·취소복원·새로고침 안내, nav/route 가드 학생 한정. Forbid 위반 없음.
- 남은 사항: 라이브 쓰기·브라우저 클릭 테스트는 종현 몫. 학생 목록 로딩 실패 시 분기 기본 과외 간주. 공용 GNB 일부 화면에서 반대 찾기 메뉴 보임(눌러도 내 분기로 이동). 허용 밖 잔여: 마케팅 배너·툴바 「학부모」 문구, 학생 예산 필터 COALESCE.
- 로컬 미배포 묶음: 8, 8b, 9, 10, 11. 다음 B(과외쌤 홈 학생 탭)는 파일이 겹치므로 배포 후 발행 제안.

## 2026-10-03 04:12 Cursor 분석(남은 2건) — 사이트오류-12 후보
- GNB 반대 찾기 메뉴: (1) auth-ui(이메일 인증 대기·연락처·비번 재설정)·등록 SPA는 student-saved-region 미등록 번들 → parentBranch() null → PARENT_BRANCH_HIDDEN_GNB[''] 빈 배열이라 숨김 없음. (2) 마이페이지는 main.js:231 분기가 sessionChecked 게이트(239)보다 앞 → 첫 페인트 role=guest → 전체 메뉴(일시적).
- 권장: me.php(76~92행)에 student_branch 추가 → shared 보관소 → home-ui/auth-session.js(123~134), shared/chrome-session.js(56~67)에서 저장 → site-nav-config.js:147 기본 소스 교체. 분기 null이면 find_room/find_tutor 둘 다 hide+세션 확정 플래그. 마이페이지 세션 확정 전 GNB 비움. 분기 저장 응답으로 보관소 갱신. 검증: verify-student-branch-two-tabs.mjs 확장.
- 종현 승인 대기. 순서(B 먼저/12 먼저) 미정 → 기본 B 먼저.

## 2026-10-03 04:15 사이트오류-12(B) 지시문 발행: 과외쌤 모드 홈 「우리동네 학생」 탭 지역 필터 학생 베이직카드 노출(liveStudentItems 연결 누락, 0건/실패/지역없음 구분, 활동지역 탭 전환 재조회). 종현이 사이트오류-12 번호 기준 GNB 분기 세션 전달건은 「13」으로 번호 이동 필요(B가 12). 종현 「ㅇㅋ」로 12 GNB 방안 추천안 승인(t1249u): me.php에 student_branch 추가, 모르면 찾기 메뉴 숨김, 마이페이지 세션 확정 전 GNB 비움. B 수락 후 발행.

## 2026-10-03 04:35 t1251u 종현 제보: 마이페이지 학생 기본정보 희망지역 변경 시 행정동·아파트단지 목록이 옛 샘플 주소 몇 개만 나옴. 가입(기본정보 받을 때)과 같은 알고리즘(실지역 데이터)이 들어가야 함. 읽기 전용 조사 진행(원인·재사용 방법). 이슈 요약 후 승인 → 지시문. (사이트오류-12 B 진행 중이므로 번호는 14로 예정)

## 2026-10-03 04:38 조사 결과: 마이페이지 학생(공부방 분기) 희망지역 샘플 목록
- 원인: student-reg/screens.js:320-334 renderBasicForm 공부방 분기가 <select> 2개(preferred_studyroom_region_id, _complex_id). 목록=regions.php action=list(DB 행 그대로, hope-region-masters.js:32). DB엔 개발 시드(012_search_dev_seed, 037: 은마아파트·대치래미안 등)만 → 샘플 몇 개.
- 가입(signup-basic.js:174/462)은 shared/study-room-basic-form.js renderStudentHopeRegion/bindStudentHopeRegion/readStudentHopeRegion(카카오 우편번호 → regions.php ensure → complex_name → 서버 ComplexEnsure). 공부방 마이페이지(embedded-panels.js:468)·과외쌤 마이페이지·과외 분기 학생은 정상.
- 필요: 프런트 select→공용 카카오 컴포넌트 교체(분기 변경 확인창 bindLessonTypeChange:500-522 연동), 서버 학생 PATCH(StudentHubRepository:127-135,186-187)가 complex_name(+address) 받아 ComplexEnsure로 complex_id 얻도록(BasicRegisterService::resolveStudyRoomComplexId:531 private) — 동 기준은 ensure region_id만으로 서버 변경 없음. 사이트오류-11 dropOppositeBranchRegion 규칙과 정합 필요.
- 종현 승인 대기 → 사이트오류-14 지시문. 순서: 12(B) → 13(GNB) → 14.

## 2026-10-03 04:42 사이트오류-12(B) 수락(로컬, 미배포, HEAD ee12aca)
- 근거: 재검사 일치 — role-home-guard 56/0, tutor-box-real-values 49/0, tutor-region-label 103/0, guest-baseline 72/72, location-ssot 통과, home-news-row 226/0, student-location-flow 188/0, branch-two-tabs 115/0, 신규 tutor-home-student-tab 63/0. PHP·SQL 변경 없음.
- diff: tutor-home-seed bootTutorStudentDemand(preferred_lesson_type tutor, preferred_region_id, 5상태, studentKey 가드), search-find-surface regionFeedContext 과외쌤 학생 탭 liveStudentItems 연결(원인 1줄), 활동지역 3탭 학생 탭 재사용·클릭 재조회, 실패/0건/지역없음 구분 카피(TUTOR_HOME_STUDENT_COPY), 공부방·학생·게스트 불변.
- 유의: 오류 후 같은 지역 재시도 없음, 같은 키 캐시. 라이브(과외쌤 계정으로 학생 카드 노출·탭 전환)는 종현 몫. 상대경로 import는 vite alias와 같은 모듈로 풀림(빌드 영향 낮음, 일부 파일은 미열람).
- 다음: 13(GNB 분기 세션 전달) → 14(마이페이지 공부방 분기 주소검색). 종현 수면으로 일시 중단.

## 2026-10-04 사이트오류-13 지시문 발행 (GNB 학생 분기를 세션에서 받기)
- 근거: 종현 t1249u 「ㅇㅋ」로 방향 승인, t1254u 「다음 이슈는?」으로 진행 지시.
- 원인 1) auth-ui·가입 SPA가 student-saved-region.js 미등록 → parentBranch() null → 반대쪽 찾기 메뉴 미숨김. 2) 마이페이지 main.js:231이 sessionChecked 게이트(239)보다 먼저 돌아 첫 그림이 guest.
- 방향: me.php에 student_branch 추가, 공용 저장소를 모든 번들이 사용, 분기를 모르면 find_room·find_tutor 둘 다 숨김(과외 가정 금지), 마이페이지는 세션 확인 후 메뉴 1회 그림, 분기 저장 응답으로 즉시 갱신, 새로고침 안내 유지.
- 12(B)는 수락(로컬 미배포). 13 결과 수락 후 12(B)+13(+14) 묶음 배포 예정(종현 「배포」 시).

## 2026-10-04 사이트오류-13 지시문 수정판 (코드 대조 후 원인 정정)
- 근거: 종현 t1255u 「먼저 확인해 보지 않아도 되나?」 → PC 코드 읽기 전용 대조.
- 정정 1) 가입 SPA(study-room-ui, tutor-ui)는 student-saved-region.js를 우회 import로 등록하지만 activateRegistrationsApi 미호출로 학생 캐시가 비어 분기가 항상 'tutor'(DEFAULT_STUDENT_HOPE_TYPE, student-hope-type.js:43). 공부방 학생에게 find_room이 숨는 반대 결과.
- 정정 2) parentBranch()가 null인 번들은 auth-ui뿐(연락처 입력, 비밀번호 재설정의 로그인 학생). 이메일 인증 대기는 guest라 분기 버그 아님(제외).
- 정정 3) 마이페이지: isMypageRoute 분기(main.js:231)에 sessionChecked 게이트 없음. 부트 첫 그림은 shouldPaintBeforeSession으로 막혀 있으나 hashchange/auth:profile로 세션 확인 전 render()가 불리면 ACTIVE_ROLE 저장값+기본 'tutor'에 기댐. guest 번쩍임은 아님. 라이브 확인 필요.
- 확인: me.php에 분기 필드 없음, 서버 분기=students.preferred_lesson_type, 학생 행 여러 개면 id 오름차순 첫 행(pickStudentRecord). 분기 저장 응답(PATCH)은 preferred_lesson_type 포함.
- 방향 유지: me.php student_branch + 공용 저장소, 분기 모르면 둘 다 숨김('tutor' 가정 금지), 마이페이지 세션 확인 전 메뉴 비움, 저장 응답으로 즉시 갱신, 새로고침 안내 유지. 수정판 지시문 발행(Cursor 전달은 종현).

## 2026-10-04 사이트오류-15 지시문 발행 (「우리동네 과외쌤」 목록 화면 디자인 5건)
- 근거: 종현 t1256u. (1) 희망 지역 아래 선 2줄→1줄 (2) 픽과외쌤·윗블록 여백 증가 (3) 베이직과외쌤·윗영역 여백도 같은 값으로 증가 (4) 「등록하면 여기에 나와요」 빈카드박스를 위측 배치(베이직 구역에서 샘플 위로 해석, 확인 대기) (5) 「과외쌤찾기에서 더 찾아보기」 배지 이 화면에서 제거.
- 로직 변경 없음, 영향 범위(다른 화면) 보고 요구. 사이트오류-13 수정판과 별개로 대기, Cursor는 한 번에 한 티켓.

## 2026-10-04 사이트오류-15 M4 교체
- 근거: 종현 t1257u·t1258u 「현재 있는 샘플박스 우측으로 배치(병렬), 우측이 비어 있다」.
- M4: 베이직과외쌤 구역에서 「등록하면 여기에 나와요」 빈카드박스를 샘플 카드 오른쪽 빈 자리에 가로 병렬 배치(기존 「위측」 해석 철회). 모바일은 세로(샘플 먼저).

## 2026-10-04 사이트오류-13 수락 (로컬, 미배포)
- 근거: Cursor 보고(M1~M9 구현함) + 우동공과2 PC 재검증(diff 읽기, 검사 재실행). role-home-guard 56/0, tutor-box-real-values 49/0, tutor-region-label 103/0, guest-baseline-map-cards 72/72, location-ssot 통과, home-news-row 226/0, student-location-flow 188/0, student-branch-two-tabs 162/0(기존 115), tutor-home-student-tab 63/0, php -l 통과.
- 구현: me.php student_branch(guardian_student만, id 오름차순 첫 비삭제 행), 공용 저장소 preview/shared/student-branch-store.js, site-nav-config.js parentBranch/숨김(분기 모름=둘 다 숨김, 이메일 인증 대기만 제외), main.js 마이페이지 세션 확인 전 비움, screens.js:675 저장 응답으로 갱신.
- 알려진 동작: 학생 행이 없는 신규 계정은 찾기 메뉴 둘 다 숨음(티켓 M4 의도). 라이브 확인 필요(종현). 마이페이지는 sessionChecked 전까지 빈 화면.
- 배포 대기 묶음: 12(B) + 13 (+15). 커밋 시 docs/, _16x~_177 review_export, teaser-*.js, tmp/, run-paid-pr-a-e2e.ps1 등은 제외.

## 2026-10-04 사이트오류-14 지시문 발행 (마이페이지 학생 공부방 분기 희망지역 → 카카오 주소검색)
- 근거: 종현 t1260u~t1261u 「ㅇㅋ」(이슈 요약 승인). 과외 분기/공부방·과외쌤 마이페이지는 변경 금지.
- 문제: 마이페이지 선택 상자가 개발 샘플(은마아파트 등)을 노출. 가입은 카카오 주소검색(동+단지). 서버 PATCH는 complex_name 미수용 → 방식 A(서버 ensure)/B(프런트 ensure 후 id) 중 Cursor가 선택·이유 보고.
- 유지: 사이트오류-11 분기 변경 규칙(반대 지역 초기화, 새로고침 안내). 입력칸 색 규칙(채움=회색, 수정=흰색)은 이 화면 희망지역 칸에 적용.

## 2026-10-04 사이트오류-15 반려 + 보강 지시문 (M4만 수락)
- 근거: PC 재검증(diff 읽기, 검사 9종 재실행 모두 기대치). 15번 7항목 중 M4(빈카드를 샘플 오른쪽 병렬: exposure-render.js:1111-1115, search-tier-render.js:81-84)만 구현. M1(선 2줄→1줄), M2·M3(픽·베이직 여백, 변수 하나), M5(배지 제거), M7(검사)은 변경 0건(CSS diff 없음).
- 보강: M5는 학생 홈 「우리동네 과외쌤」 탭에서만 배지 제거. 공부방 탭·학생 탭·공급자 홈 학생 탭 배지는 유지(verify-tutor-home-student-tab.mjs:363, verify-student-branch-two-tabs.mjs:551이 요구). 공부방 탭 동일 제거는 종현 확인 대기.
- 13은 수락 유지(로컬, 미배포).

## 2026-10-04 사이트오류-15 보강 수락 (로컬, 미배포)
- 근거: Cursor 보강 보고 + PC 재검증(diff·신규 verify 직접 읽기, 검사 10종 재실행). role-home-guard 56/0, tutor-box-real-values 49/0, tutor-region-label 103/0, guest-baseline-map-cards 72/72, location-ssot 통과, home-news-row 226/0, student-location-flow 188/0, student-branch-two-tabs 162/0, tutor-home-student-tab 63/0, student-home-tutor-tier(신규) 24/0.
- 구현: M1 home-listings.css:310-312(결과 구역 위 선 제거, 학생 홈 과외쌤 탭만), M2·M3 --tier-section-gap 1.25rem 하나(정의 316-318, 사용 320-322·324-326), M5 provider-home.js:202(과외쌤 탭 배지 제거, 다른 배지 유지), M4 유지, M7 scripts/verify-student-home-tutor-tier.mjs 신규.
- 리스크: 라이브 시각 확인 필요(종현), M1 규칙은 인접 형제 선택자, 이 탭만 간격 20px(다른 화면 16/12px).
- 배포 대기 묶음: 12(B)+13+15. 배포 시 신규 파일 포함: preview/shared/student-branch-store.js, scripts/verify-tutor-home-student-tab.mjs, scripts/verify-student-home-tutor-tier.mjs. 제외: docs/, _16x~_177 review_export, teaser-*.js, tmp/, run-paid-pr-a-e2e.ps1.

## 2026-10-04 배포 지시문 발행 (12(B)+13+15)
- 근거: 종현 t1265u 「배포」. 기준 HEAD=origin/main=ee12aca5f8462320f6483cbcaee8f0445cc68783.
- 담는 파일 19개: auth-session.js, exposure-render.js, main.js, provider-home.js, screens/tutor.js, student-reg/screens.js, student-reg/student-reg-copy.js, styles/home-listings.css, tutor-home-seed.js, search-find-surface.js, search-tier-render.js, student-saved-region.js, shared/chrome-session.js, shared/site-nav-config.js, shared/student-branch-store.js(신규), public/api/auth/me.php, scripts/verify-student-branch-two-tabs.mjs, scripts/verify-student-home-tutor-tier.mjs(신규), scripts/verify-tutor-home-student-tab.mjs(신규).
- 제외: docs/ 전체, DOC-CHECKLIST.md, SSOT-ALIGNMENT.md, run-paid-pr-a-e2e.ps1, _164~_177 review_export, teaser-*.js, tmp/. SQL 없음. Actions 확인은 종현 몫. 사이트오류-14는 아직 코드 미반영(Cursor 대기).

## 2026-10-04 배포 푸시 완료: fe48bb8 (12(B)+13+15)
- 근거: Cursor 보고 SUCCESS. ee12aca..fe48bb8, origin/main = fe48bb849d7478fc5e6846d48822278759e4010e. 파일 19개, 제외 파일 미포함, 사전 점검 수치 모두 기대치.
- Actions(Deploy to dothome) 결과는 종현 확인 대기. 라이브 확인 항목: 과외쌤 학생 탭 카드·지역 탭 재조회, 학생 계정 상단 메뉴 분기 숨김, 학생 홈 과외쌤 탭 선·간격·배지·빈카드 배치.
- 다음: 사이트오류-14 Cursor 결과 대기.

## 2026-10-04 사이트오류-16 지시문 발행 (픽·베이직 구분선 여백 확대)
- 근거: 종현 t1267u 「1.여백을 좀더 늘려주고, 2. 1의 여백만큼 벌려줘」(구분선 노란 표시 캡처). 해석: 구분선 위 여백 확대 + 선과 제목 사이도 같은 값. --tier-section-gap 하나로 관리(제안 1.25rem→2rem). 학생 홈 과외쌤 탭만. 해석 확인은 종현에게 열어 둠.
- 배포 fe48bb8은 Actions 확인 대기 중이며, 16은 그 위에 로컬 변경으로 쌓임.

## 2026-10-04 사이트오류-14 수락 (로컬, 미배포)
- 근거: Cursor 보고(M1~M7 구현함, 서버 보강 방식 A) + PC 재검증(diff 읽기, 검사 11종 재실행). role-home-guard 56/0, tutor-box-real-values 49/0, tutor-region-label 103/0, guest-baseline-map-cards 72/72, location-ssot 통과, home-news-row 226/0, student-location-flow 188/0, student-branch-two-tabs 162/0, tutor-home-student-tab 63/0, student-mypage-hope-region(신규) 38/0, student-home-tutor-tier 24/0, php -l StudentHubRepository.php 통과.
- 구현: 마이페이지 공부방 분기 희망지역을 shared Kakao 주소검색(renderStudentHopeRegion/bindStudentHopeRegion/readStudentHopeRegion)으로 교체. 서버 StudentHubRepository::applyNamedStudyRoomComplex가 학생 UPDATE와 같은 트랜잭션에서 ComplexEnsure::ensure 호출(롤백 시 단지도 롤백), 과외 분기 전환 시 단지 미생성. 샘플 선택지(은마·대치래미안)·listAllComplexes 제거. 회색 #f3f4f6/포커스 흰색은 이 화면 희망지역 칸만. DB 스키마 변경 없음.
- 변경 파일: student-reg/screens.js, student-reg-copy.js, shared/study-room-basic-form.js(+2, onApplied 옵션), src/Registration/StudentHubRepository.php, 신규 scripts/verify-student-mypage-hope-region.mjs.
- 리스크(경미): 마이페이지 생성 단지는 주소 빈값 저장(readStudentHopeRegion이 complex_address '' 반환), 서버가 동 단위 여부는 검사하지 않음(기존부터), 가짜 PDO 검사라 카카오 팝업·실저장은 라이브 확인 필요.
- 라이브 확인(종현): 새 단지 저장·재저장, 분기 양방향 전환, 회색/흰색.
- 배포 대기: 14(+16). 사이트오류-16 Cursor 결과 대기. 다음: 「내 공지」 마이페이지 상단 수정.

## 2026-10-04 사이트오류-17 지시문 발행 (학생 마이페이지 기본정보 입력칸 회색/흰색)
- 근거: 종현 t1270u 「학생모드 마이페이지 기본정보 항목 안 입력값들이 회색으로 안 변해 있어. 일단 이것만 먼저 봤어」. 원인: 사이트오류-14에서 회색 규칙을 희망지역 칸에만 적용(paintHopeRegionChrome, screens.js:482-507).
- 규칙(사이트 공통, 종현 확정): 채움=회색(#f3f4f6), 비움=흰색, 포커스=흰색. 이번엔 학생 마이페이지 기본정보 전체 칸만, 공통 함수/클래스로 만들어 다른 페이지는 후속 적용.

## 2026-10-04 사이트오류-17 수락 (로컬, 미배포)
- 근거: Cursor 보고(M1~M6 구현함) + PC 재검증(diff 읽기, 검사 11종 재실행, 임시 outDir 빌드 성공, build:dothome 미실행). role-home-guard 56/0, tutor-box-real-values 49/0, tutor-region-label 103/0, guest-baseline-map-cards 72/72, location-ssot 통과, home-news-row 226/0, student-location-flow 188/0, student-branch-two-tabs 162/0, tutor-home-student-tab 63/0, student-mypage-hope-region 69/0, student-home-tutor-tier 24/0.
- 구현: preview/home-ui/src/student-reg/student-basic-fill.css(변수 2개, [data-p19-basic] 한정, background-color만, :not(:disabled)), screens.js bindBasicFillChrome/paintBasicFillChrome(입력·change 버블·주소 적용·다시 그림), 폼 속성 data-p19-basic(screens.js:296). paintHopeRegionChrome 제거(일반화). 상세정보·쪽지설정·다른 역할·가입·찾기 필터 영향 없음.
- 리스크(경미): 숫자 0은 회색, 색 검사는 Chromium 없이 특이도 계산(라이브 시각 확인 필요), screens.js에 14와 17이 함께 있어 같이 배포.
- 후속: 입력칸 색 규칙 다른 페이지(공부방·과외쌤 마이페이지, 찾기 필터) 적용은 별도 순서.
- 배포 대기 묶음: 14+17(+16 결과 확인 후). 신규 파일: student-basic-fill.css, verify-student-mypage-hope-region.mjs.

## 2026-10-04 사이트오류-16 수락 (로컬, 미배포)
- 근거: Cursor 보고(M1~M5 구현함) + PC 재검증(diff 읽기, 검사 11종 재실행 전부 기준치 일치: 56/0, 49/0, 103/0, 72/72, 통과, 226/0, 188/0, 162/0, 63/0, 24/0, 69/0).
- 구현: home-listings.css `--tier-section-gap` 1.25rem→2rem(한 곳), .home-shell--parent .content-section--blue 의 픽·베이직에 margin-top(선 위)·border-top 1px var(--gray-200)·padding-top(선 아래) 모두 같은 변수. 공부방 탭·게스트·과외쌤 홈·찾기 변화 없음. verify-student-home-tutor-tier.mjs 기대값 갱신(24건 유지).
- 배포 대기 묶음: 14 + 16 + 17. git status 상 docs/·DOC-CHECKLIST·SSOT-ALIGNMENT·run-paid-pr-a-e2e.ps1·teaser-*.js·_16x export·tmp 는 제외 대상.

## 2026-10-04 배포 지시문 발행 (14+16+17, 종현 「배포」 t1273u)
- 기준: HEAD/origin = fe48bb8. 커밋 대상 8개: screens.js, student-reg-copy.js, student-basic-fill.css(신규), home-listings.css, shared/study-room-basic-form.js, StudentHubRepository.php, verify-student-home-tutor-tier.mjs, verify-student-mypage-hope-region.mjs(신규).
- 제외: _164~_177 export, docs/ 전체, DOC-CHECKLIST, SSOT-ALIGNMENT, run-paid-pr-a-e2e.ps1, teaser-*.js, tmp/, dist. build:dothome 없음. Actions 결과·라이브 확인은 종현.

## 2026-10-04 「내 공지」 마이페이지 상단 고정 — 이슈 요약 (종현 승인 대기)
- 현황(HEAD 3b5b347, 코드만 읽음): 블록 renderMypageNoticeStrip(mypage/mypage-notice-strip.js:19)은 mypage/screens.js의 _withNotice(:114-116,:163-165)와 막힌 경로 리다이렉트(:131,:132,:143,:144,:160)에서 입구 경로일 때만 붙음 → 하위 화면에서 사라짐. 마이페이지 틀 renderMypageShell(mypage/shell.js:61, bodyHtml :132)은 3역할·전 화면 공통이고 이동 시 전체 재그림(main.js:237).
- 선: .mypage-notice(mypage-ops.css:1696) 1px var(--uds-line) #e5e7eb, 별도 아래선 없음. 토큰 --gray-300 #cbd5e1, --gray-400 #94a3b8.
- 제안: shell.js 본문 위 1회 삽입(guest 제외) + screens.js 호출 5곳·_withNotice 제거 + 아래선 2px --gray-300 + 중복/하위화면 1회 검사 + 공지 캐시 로드 후 마이페이지 재그림(선택→포함 제안). 위치=제목 아래 유지(제목 위는 종현 요청 시).
- 주의: 학생 0명/2명 이상 정지 화면에도 노출, 높이 약 100px, 더보기 이동은 그대로(팝업 아님).

## 2026-10-04 20:17 사이트오류-18 지시문 발행 (종현 「진행」 t1278u)
- 내용: 「내 공지」를 mypage/shell.js renderMypageShell 본문 위 1회 삽입(guest 제외), screens.js 호출 5곳·_withNotice 제거, 아래선 2px --gray-300, 공지 캐시 로드 후 마이페이지일 때만 재그림, 검사 scripts/verify-mypage-notice-top.mjs 신규. 더보기는 이동 유지(팝업 아님). 위치=제목 아래.
- 허용 파일: shell.js, screens.js, mypage-notice-strip.js, mypage-ops.css, main.js(M6), 신규 검사. 결과 대기.

## 2026-10-04 사이트오류-18 수락 (로컬, 미배포)
- 근거: Cursor 보고(M1~M8 구현함) + PC 재검증(diff 읽기, 검사 12종 재실행 일치: verify-mypage-notice-top 49/0 포함, 임시 빌드 성공). 참고: verify-mypage-notice-top 은 preview/home-ui 폴더에서 `npx vite-node ../../scripts/...` 로 실행해야 함(루트 실행 시 별칭 오류).
- 구현: shell.js:133 renderMypageNoticeStrip 1회(제목 아래·본문 위·guest 제외), screens.js 호출 5곳·_entryPath·_withNotice 제거, mypage-ops.css .mypage-notice border-bottom 2px var(--gray-300), main.js hydrateNoticeHome().then 재그림(세션확인·마이페이지·공지≥1·DOM에 블록 없을 때만).
- 알려진 경미 사항: 공지 도착 전 입력 중인 폼이 첫 진입 직후 1회 지워질 수 있음(입력 포커스 가드는 종현 요청 시 추가). 학생 수 정지 화면에도 노출.
- 변경 파일: main.js, mypage/screens.js, mypage/shell.js, styles/mypage-ops.css, 신규 scripts/verify-mypage-notice-top.mjs. 배포 대기. 다음: 마이페이지 대표 지역 표시·규칙.

## 2026-10-04 20:39 배포 지시문 발행 (18, 종현 「배포」 t1280u)
- 기준 HEAD/origin 3b5b347. 커밋 대상 5개: main.js, mypage/screens.js, mypage/shell.js, styles/mypage-ops.css, scripts/verify-mypage-notice-top.mjs. 제외·절차는 이전 배포와 동일(build:dothome 없음). 결과 대기.

## 2026-10-04 20:57 사이트오류-18 배포 결과 + 「대표 지역」 이슈 요약 (종현 「다음 이슈 정해줘」 t1281u)
- 18: 커밋 068b2b5, Actions 3건(Deploy #376) success. 라이브 확인은 종현 대기.
- 재확인(HEAD 068b2b5): D1 대표 지역 칸 3역할 항상 빈칸(preview-data.js:29 regionLabel '' 고정, 채우는 코드 없음). 출처: 공부방 studyRoomPromo1Label(study-room-home-seed.js:45-48), 과외쌤 tutorHomePrimaryLabel(tutor-home-seed.js:117-121)/서버 primary_region_label(TutorHubRepository.php:193-204, 사이트오류-10으로 시도+시군구, 대표 없으면 null), 학생 primaryHopeRegionLabel(student-hope-regions.js:132-138, preferred_lesson_type 기준; 마이페이지에서는 미사용).
- 규칙 구멍: R1 공부방 seedPrimaryRegionIfMissing(StudyRoomHubRepository.php:232-265, 허브 조회 중 INSERT, :208)·promoLabelFromRoom·`행정동 #id`(:177,:211, ProviderTicketService.php:288) 잔존, ensurePrimaryRegionRow(:1182-1240)은 syncSavedRegions(:1175-1177)가 슬롯1 없으면 던져서 사실상 도달 어려움. R2 과외쌤 TutorRegisterService.php:417-493 빈 목록 허용·2번만 남으면 승격(:483-491), 클라 inline-save.js:38-43 은 0칸만 막음. R3 SearchService.php 공부방 :445-449/:603, 과외쌤 :716-719/:806 대표 없어도 노출, 위치 ''.
- 용어: 「과외지역」 17줄(내 등록 화면), 「활동지역」 40줄, 「활동 지역」 25줄(프로모션·상세), 「대표 활동 시」 9줄, 안내문 「활동 시·군」. 찾기 필터에는 둘 다 없음.
- 제안: 티켓 19=표시+용어(활동지역 통일, 빈 값은 「등록 전」), 티켓 20=규칙(과외쌤 대표 삭제·승격 차단, 공부방 자동 생성/#id 문구 제거). 카드 숨김 여부는 종현 결정(권장=숨김, 옛 계정 수 확인 후). 숨김 결정 전까지 20에서 제외.

## 2026-10-04 20:59 종현 확정 (t1283u): 과외쌤 지역 용어 = 「과외지역」
- 종현: "직관적이게 '과외지역'으로 표기하자." 우동공과2 찬성(학생 과외 분기와 이어지고 직관적). 적용: 활동지역/활동 지역/대표 활동 시/활동 시·군 → 과외지역·대표 과외지역. 코드 키·주석·공부방 「홍보지역」·활동 통계 의미는 변경 제외.
- 종현 지시: 일단 점검부터. 문구 전수 목록(화면/서버 메시지/검사 단언/안내문 분류) + 규칙 구멍 재확인 진행 중. 티켓 19(표시+용어), 20(규칙)은 점검 결과 후.

## 2026-10-04 21:05 「과외지역」 용어 통일 전수 점검 결과 (읽기 전용, HEAD 068b2b5)
- 대상 hit: 화면문구(A) 40건, 서버 메시지(B) 9건, 가이드·홍보·마케팅(F) 21건, 검사 단언(E) 수정 필요 2곳(verify-tutor-signup-seed.mjs:42,43)+갱신 권장 1곳(verify-tutor-home-student-tab.mjs:112 「활동지역을 등록하면」 부정 단언). 식별자(D) 0건. 주석(C) 소스 ~29, 스크립트 5. 빌드 산출물 143파일 ~3,290건은 재생성되므로 수정 금지. 목록 원본: PC C:\Users\jetty\terminals\inv.txt.
- A 상세: auth-ui signup-basic.js(299,302,675), empty-state-copy.js:211, handoff-copy.js:141, tutor-activity-chart.js:134, detail-decision/tutor-detail.js:31, plans/order-blocks.js:315, plans/period-cards.js:162, plans/screens.js:1033, screens/tutor.js(70,71,98,117,119,124), student-reg-copy.js:71, tutor-reg/format.js(84,102,171,229,241), tutor-reg/store.js:250, registration-check-copy.js:148, search-find-surface.js(1964,1973,1993,1994,2022,2045,2046), search-schema.js:49, shared/tutor-region-slots.js(139,145,151,165,172), src/Views/auth/partials/basic-tutor.php(23,24,32; 사용 여부 확인 필요).
- B 상세: BasicRegisterService.php(744,745,760,768), TutorPositionAxis.php(58,131), SidoRegionEnsure.php:61, TutorHubService.php:101, TutorDetailCompletionEvaluator.php:84. 「대표 활동 시」는 TutorHubService/Evaluator/store.js:250/registration-check-copy.js:148 네 곳 중복 정의 → 동시 변경.
- F 상세: guide/copy.js(353,357,404,445,470), guide/screens.js:354, promo/tutor-content.js(11곳), promo/catalog.js:34, promo/study-room-content.js:84, home-marketing-banner.js(83,221).
- 제외: 학생 희망 과외 지역(search-find-surface.js:1083 주석, 학생 「희망 지역」 뱃지), 클래스 my-box--activity/act-*/data-tutor-activity-bars, 관리자 목업 a28-copy.js:492 및 SQL 024/rest-schema 신고 사유(샘플·DB 값 불변), preview 내 DOC-CHECKLIST·SSOT-ALIGNMENT 4건, 공부방 verify-study-room-registration-check-frame.mjs:146은 공부방 항목 수정 시 함께 갱신.
- 우동공과2 결정(종현 이의 없으면 확정): ①대표 활동 시→대표 과외지역(대표 규칙 유지) ②시 단위 힌트는 입력 라벨·안내문에 「과외지역(시 단위)」 ③활동지역 분포→과외지역 분포 ④공부방 내 등록 점검표 study-room-reg/store.js:62 「활동 지역」→「대표 홍보지역」(+검사 갱신) ⑤관리자 샘플·SQL 제외 ⑥preview 문서 제외.
- 티켓 순서 제안: 19 대표 지역 표시(「등록 전」), 20 용어 통일, 21 규칙(숨김 결정 전까지 숨김 제외).

## 2026-10-04 21:06 사이트오류-19 지시문 발행 (종현 「진행」 t1284u)
- 내용: 마이페이지 계정 정보 카드 「대표 지역」을 3역할 실제 값으로(공부방=홍보1 promo_label, 과외쌤=과외지역1 라벨, 학생=가입 분기 1번), 없으면 「등록 전」, `#번호` 노출 금지, 로드 전 깜빡임 방지, 합성 함수 1곳, 신규 검사 verify-mypage-account-region.mjs. 서버·SQL·라벨 글자·용어 통일 제외. 결과 대기. 이후 20(용어), 21(규칙).

## 2026-10-04 21:25 다음 이슈 정리: 공부방 내 박스 풍성화 (종현 t1285u, 큐 순서 19→20→21→공부방 박스→입력칸 색→C)
- 확정 사항 재정리(재질문 금지): 과외쌤 박스에 맞춤(안내글·레이아웃), 공부방 고유값 유지, 박스 탭 아래 이동, 오른쪽 활동지역 분포 대응 칸 만들지 않음, 쪽지 배지→/mypage/messages 직행(공통), 과외쌤 목업→서버 값은 사이트오류-8로 완료.
- 미결 1건: 박스 반폭 시 우측 빈 공간. 우동공과2 제안 A안(전체 폭 유지+내 현황 4줄 2열+안내글·배지 동일 문구/순서, 권장), B안(반폭+우측 홍보1~3·프라임·픽 현황, 홍보2·3 점검 후), C안(우측 비움, 비권장). 종현 이의 없으면 A안 확정 → 현재 코드와 과외쌤 박스 안내글·배지 문구 비교 점검 후 지시문.

## 2026-10-04 21:23 종현 확정 (t1286u): 공부방 내 박스 = 과외쌤 박스 형태 그대로, 기능은 공부방 유지
- 종현: "과외쌤 박스안의 형태를 그대로 가져가도 돼. 단 기존 기능들은 공부방박스를 유지하면 돼." (A안/B안 논의 대체: 형태는 과외쌤 그대로, 공부방 고유 기능·값 유지, 우측 분포 칸은 이미 만들지 않기로 함.)
- 진행: 두 박스 코드 비교 점검(구조·행·링크·배지·반응형·영향 검사) 후 이슈 정리 → 지시문.

## 2026-10-04 공부방 내 박스 ↔ 과외쌤 내 박스 비교 조사 결과 (읽기 전용, HEAD 068b2b5)
- 과외쌤 박스: screens/tutor.js:62-107 renderStatusBoxShell, 탭 아래(:144-145), 2칸 그리드 tutor-home-split(:129-135, home-listings.css:2191-2201), 768px 미만 1열. 오른쪽 칸=「활동지역 분포」.
  - row1 이름+배지「과외쌤 박스」+버튼(쪽지 후기함 #/mypage/messages :95, 마이페이지 getDefaultMypagePath('tutor') :96) / row2 활동지역 pill 3개(대표 표시)+안내글(:98 "활동지역을 수정하려면 '마이페이지-내 등록-기본등록'에서 해 주세요.") / row3 과목·상태(`문의 · N개 미확인`)+안내글(:99-103 쪽지설정) / row4 조회·등록.
  - 「N개 미확인」은 별도 배지가 아니라 상태 셀 텍스트. 이름 옆 배지는 고정문구「과외쌤 박스」. 색은 udx-std-apply.css:461-482(.home-shell--tutor, 청록 --role-accent-tutor).
- 공부방 박스 현재: screens/study-room.js:32-52, 탭 위·home-mkt-wrap--with-panel 안(:60-65). 안내글 없음. 쪽지 후기함 링크가 /mypage/messages/reviews(:47)로 유일하게 어긋남 → /mypage/messages 로 통일 필요. 마이페이지 버튼 #/mypage 고정.
  - 데이터: study-room-home-seed.js:131-147 readStudyRoomMemberBox (name/region=홍보1 promo_label/inquiry/unread/views/registered). 유지 기능: applyStudyRoomHomePromo, bootStudyRoomHome(liveKey 가드), bootStudyRoomStudentDemand(studentKey 가드), 지역 바, 지도.
- 박스를 래퍼 밖으로 옮기면 home-mkt-wrap--with-panel 수식어와 home-mkt-wrap__panel 제거 필요(죽은 규칙 home-marketing-banner.css:350-353이 배너 폭을 줄이고 있음).
- 공부방에는 .home-shell--tutor .my-box--status 같은 색 오버라이드가 없음(기본 파랑). 색 결정 필요.
- 영향 검사: verify-home-news-row.mjs:653 NEXT_BOX.study_room(패널 제거해도 .provider-home-tabs로 통과), :279-293 정책 리터럴, verify-tutor-box-real-values.mjs:34-46(tutor.js의 box.xxx 사용 정규식 — tutor 코드를 공용화하면 깨짐), verify-tutor-home-student-tab.mjs:69-71.
- 「학부모」 금지: study-room-reg-copy.js:75,89,106. 과외쌤 안내글 두 개는 「활동지역→홍보지역」, 「기본등록→공부방 해당 탭 이름」만 바꾸면 됨. 공부방 쪽지설정 탭명은「쪽지설정」, 기본등록 대응 탭명은 미확인(지시문 전 확인 필요).
- 지시문 전 정할 것: (1) 옵션A 전체폭 단일칸(권장) vs B 반폭 (2) 마이페이지 버튼 경로 (3) 과목 행·지역 pill 3칸 대응(공부방은 홍보1 한 칸) (4) 색 청록 그대로 vs 공부방 파랑.
- 순서: 티켓 19 검수 → 20 → 21 → 이 건(종현 「진행」 후 지시문).

## 2026-10-04 사이트오류-19 수락 (마이페이지 계정 카드 「대표 지역」 3역할 실제 값)
- 재검증: 변경 파일 3개(screens.js +26/-5, account-region-label.js 신규, verify-mypage-account-region.mjs 신규). PHP/SQL/main.js/preview-data.js 변경 없음. 검사 13종 모두 기준과 일치(account-region 39/0 포함), 임시 빌드 성공. 아직 로컬(미커밋·미배포).
- 확인: 라벨「대표 지역」유지, 빈 값「등록 전」, #숫자/숫자만 라벨 버림, 공부방=홍보1만(사업장 동 폴백 없음), 학생=가입 분기 1번 지역(반대 분기 무시), 로드 전 빈 칸 후 해당 칸만 갱신(폼 유지), ensureTutorCityUnits는 과외쌤 계정화면에서만, 순환 import 없음.
- 경미한 위험 2건: (1) 과외쌤 is_primary 행이 없는 옛 데이터는 1번 슬롯이 대표로 표시됨(account-region-label.js:51-54) → 티켓 21(자동 승격·대표 없음 차단)에서 함께 제거, (2) 역할 전환 직후 registrationsSettled가 true로 남아 「등록 전」이 잠깐 보일 수 있음(곧 정정됨).
- 수락. 다음: 티켓 20(과외지역 용어 통일).

## 2026-10-04 사이트오류-20 지시문 발행 (과외쌤 지역 용어 「과외지역」 통일) — 종현 「진행」(t1289u)
- 근거: t1283u 확정(활동지역·활동 지역·대표 활동 시·활동 시·군 폐기 → 「과외지역」, 코드 키·주석·공부방 「홍보지역」·활동 통계 의미 제외). 목록은 PC C:\Users\jetty\terminals\inv.txt(HEAD 068b2b5).
- 규칙: 「활동지역/활동 지역」→「과외지역」, 「대표 활동 시」→「대표 과외지역」, 「활동 시·군/활동 시/활동시」→「과외지역」, 공부방 쪽(study-room-reg/store.js:62, promo/study-room-content.js:84)→「대표 홍보지역」/「홍보지역」. 제외: 주석, a28-copy.js:492·SQL 2건(신고 사유 목업), 학생 「희망 과외 지역」, 미리보기 문서 md, 클래스·data 속성, public/ 빌드 산출물, 검사 스크립트 테스트 이름. 「학부모」 문구(guide/copy.js:353)는 이번에 건드리지 않음(별도 정리 대기).
- 갱신할 검사: verify-tutor-signup-seed.mjs:42,43, verify-tutor-home-student-tab.mjs:112 외 문구 단언, verify-study-room-registration-check-frame.mjs:146.

## 2026-10-04 진단(종현 t1292u): 지역 1·2·3 베이직카드 노출 / 프라임·픽 지역별 판매·표시 (읽기 전용, HEAD 068b2b5)
- 베이직 노출: 과외쌤 SearchService.php:723-729 (tutor_regions 어느 슬롯이든 매칭, is_primary 조건 없음), 공부방 SearchService.php:452-458, 473-490, 1327-1362 (study_room_regions 모든 슬롯 + 사업장 동 sr.region_id). 통계도 같은 식. 과외쌤 홈 지역 탭 3개는 각 슬롯 regionId로 검색. 공부방 본인 홈은 홍보1로만 검색(홍보2·3 탭 없음). 카드에 찍히는 지역 글자는 대표/홍보1 하나(:806,:603).
- 구매: 과외쌤 TutorPositionAxis.php:120-133 (tutor_regions에 그 시가 있으면 슬롯 무관 통과, city_id+주력과목 축), 공부방 PrimeRegionScope.php:114-179 (어느 슬롯이든 통과, 재고 키 dong:/complex:, 지역별 3자리 한도 ProviderCheckoutService.php:630,775). 픽은 지역 스코프 없음.
- **갭(확인됨)**: SearchService::activePositionSku(:1434-1473)가 provider_type/id·sku(prime,pick)·기간만 보고 city_id/region_id/complex_id/primary_subject_id를 보지 않음. 호출 :633(공부방), :841(과외쌤). → 한 지역 프라임/픽을 사면 모든 지역 검색에서 프라임/픽으로 표시, 공부방 지역별 3자리 한도는 구매 단계에서만 막고 표시 단계에서 안 막음, 과외쌤은 다른 과목 축 구독도 모든 과목 검색에 표시.
- 정책 확인 필요: 공부방 사업장 동(sr.region_id) 매칭으로 홍보지역에 없는 동에도 카드 노출. 확인 못함: 065·066 마이그레이션 라이브 적용 여부.
- 내부 근거: repo docs/internal/65-paid-renewal-checklist.md:23,25, 67:124, 68. 

## 2026-10-04 사이트오류-20 검수: 조건부 수락(문구) + 보완 20b 발행
- 재검증: 32개 파일(코드 29+검사 3) diff 188줄 전부 한국어 문구 치환, 클래스·키·선택자·로직 변경 없음. 눈에 보이는 옛 문구 잔존 0건(남은 건 주석 24건 + a28-copy.js:492 목업). 검사 14종 기준과 같음, PHP -l 6파일 통과, 임시 빌드 성공.
- 실패 1건: verify-tutor-region-label 102/1 (기준 103/0) — scripts/verify-tutor-region-label.mjs:300-308 의 「클라이언트 라벨 코드 무변경」 락이 git diff --name-only 로 format.js 변경 여부만 봐서 문구 정정에도 실패(오탐). 락 대상 5개: tutor-reg/profile-read.js, registrations-backend.js, tutor-reg/screens.js, tutor-reg/format.js, tutor-reg/inline-save.js.
- 보완 20b: (1) 락을 「+/- 줄이 활동 시↔과외지역·대표 활동 시↔대표 과외지역 정규화 후 일치하면 통과」로 수정(로직 변경은 계속 잡도록 유지) (2) 어색한 표현 2곳 정리: plans/order-blocks.js:315 「과외지역 시 1·2·3」→「과외지역 1·2·3」, TutorPositionAxis.php:58 「과외지역 시 1개를…」→「과외지역 1개를…」.
- 20은 20b 수락 후 최종 수락. 배포는 종현 「배포」 때.

## 2026-10-04 사이트오류-20 + 20b 최종 수락 (로컬, 미커밋·미배포)
- 20b 재검증: verify-tutor-region-label.mjs:300-346 잠금이 -/+ 줄을 모아 용어 4종만 정규화해 비교(개수·내용 다르면 실패, 헤더 줄만 제외). format.js diff=용어 5줄, 나머지 4개 잠금 파일 diff 없음. &&false 임시 수정 잔존 0건. order-blocks.js:315 「과외지역 1·2·3」, TutorPositionAxis.php:58 「과외지역 1개를…」. 검사: region-label 103/0, role-home-guard 56/0, tutor-box-real-values 49/0, tutor-home-student-tab 63/0, php -l 통과.
- 잠금 한계(경미): 커밋 후 diff가 비어 항상 통과(일시적 잠금), 같은 순서 줄 쌍만 비교.
- 현재 로컬 미배포 묶음: 19, 20, 20b. 다음: 티켓 21(규칙; 대표 없는 카드 숨김 부분은 종현 결정 전까지 제외, account-region-label.js:51-54의 1번 슬롯 폴백 제거 포함).
- 별도 대기: 프라임·픽 지역별 표시 갭(activePositionSku가 지역·과목 미확인) — 종현 순서 결정 대기.

## 2026-10-04 사이트오류-21 지시문 발행 (종현 「진행」 t1297u)
- 범위: 과외쌤 saveRegions 빈 목록·2번만 거부 + 2번 승격 제거(서버·공용 검증), 공부방 seedPrimaryRegionIfMissing·promoLabelFromRoom 사업장 동 대체·#id 라벨 폴백·ensurePrimaryRegionRow 정리, 계정 카드 1번 슬롯 폴백 제거(account-region-label.js:51-54), 신규 verify-region-save-rules.mjs.
- 제외(종현 결정 대기): 대표 지역 없는 카드 검색·홈 숨김(권장=숨김), 프라임·픽 지역별 표시 수정(activePositionSku).

## 2026-10-04 종현 확정(t1299u): 대표지역1 필수 = 베이직카드 생성 조건
- 기본등록에서 대표지역 1(과외쌤 과외지역1, 공부방 홍보1)은 반드시 설정한다. 이 값이 없으면 베이직카드가 만들어지지 않는다. 베이직카드가 노출되는 순간부터 모든 검색에서 검색 가능하다.
- 해석: 「대표 없는 카드 숨김」은 새 정책이 아니라 이 정책의 집행이다(대표1 없음=카드 없음). 숨김 여부 질문은 해소. 옛 대표 없는 계정은 검색·홈에서 제외하고 기본등록(대표1)을 하면 노출된다.
- 후속: 티켓 21 수락 후, 검색·홈 노출 조건에 「대표1 존재」를 강제하는 티켓(21b) 이슈 요약 → 종현 「진행」 → 지시문. 가입·마이페이지에서 대표1 없이 베이직 등록이 완료되는 경로가 있는지도 같이 점검.

## 2026-10-04 기본등록 게이트 조사 (종현 t1301u: 「정책도 구현도 끝난 걸로 안다, 대표 없는 카드는 불법·삭제 대상」) — 결론: 게이트 미완성 (읽기 전용, HEAD 068b2b5)
- 판정 조건이 「행 존재」: BasicRegisterService.php:39-61 needsBasicRegister() = tutors / study_rooms 행 유무만 봄(tutor_regions·study_room_regions·is_primary 미조회). me.php:116-121 → needs_basic_register. 이동은 클라이언트: login.js:138-144 → auth-redirect.js:316-318. signup-basic.js:413은 행이 있으면 재진입 차단.
- 구멍1: 대표 없는 카드 행이 하나라도 있으면 기본등록 안 감. 구멍2: register API가 기본등록 거치지 않고 카드 행 생성 — TutorRegisterService.php:131-141,327-347(insertDraft, 지역 없이 tutors 행; 기존 행 확인 없음), StudyRoomRegisterService.php:204-212,356-390(insertDraft, 지역 없이 study_rooms 행). 구멍3: saveRegions(:417-493) 빈 목록 허용, 클라이언트가 보낸 is_primary 그대로 저장(대표 여러 개 가능), 슬롯 당겨 채움. 구멍4: 노출 쿼리가 대표를 요구하지 않음(SearchService.php:716-718,806 / :445-449,603 / NeighborhoodGreetingService.php:190-196, 대표는 LEFT JOIN 표시용; 과외쌤은 draft도 hidden만 아니면 노출). 구멍5: home-ui auth-session.js:136은 guardian_student만 기본등록으로 보냄 → 과외쌤·공부방은 URL 직접 진입 가능; 서버 API(RegistrationApi, PaidApi, MessagesApi, register.php)는 대표·기본등록 완료 미검사. 구멍6: 공부방 공개(StudyRoomHubService.php:52-60)에 대표 검사 없음(과외쌤 공개는 TutorHubService.php:101에 있음). 구멍7: TutorHubRepository.php:115,193-203 has_primary_region이 슬롯1 여부 미확인. 구멍8: DB 제약 없음(tutor_regions에 slot 컬럼 없음, 슬롯1=priority_order 0).
- 슬롯 정의: tutor_regions 슬롯1=priority_order=0, study_room_regions slot 1~3 + is_primary. 테이블 saved_regions는 없음(API 키 이름).
- 위반 조회 SQL: /workspace/outputs/violating-accounts-no-primary-region.sql (종현이 실행). 공부방은 읽기 중 자동 INSERT(StudyRoomHubRepository.php:208,232-265, StudyRoomRegisterService.php:538,1182-1241)가 만든 홍보1 행은 위반으로 안 잡힘(구분 불가). 삭제 경로 public/api/admin/members-bulk-delete.php 존재(내용 미확인).
- 조치 계획: 21(진행 중)에 없는 항목 = 구멍1·2·4·5·6·7 → 21b(기본등록 게이트·카드 생성·노출 조건)에 포함, 구멍3 일부는 21에 이미 포함, 21 보고 후 재점검.

## 2026-10-04 종현 확정(t1302u): 베이직카드 자동 노출 조건
- 기본등록 필수항목이 모두 입력되면 베이직카드가 자동 노출된다. 지역은 대표지역 1개만 있으면 되고 2·3은 옵션(공부방·과외쌤 동일). 처음부터 이 정책이며 그렇게 구현돼 있어야 한다.
- 따라서 노출 조건 = 「기본등록 필수항목 전부 완료」(대표1 포함). 행 존재/임시 저장(draft) 상태만으로는 노출 금지 → 조사 구멍2·4 해당. 티켓 21b 범위에 포함.
- 티켓 21은 그대로 전달 가능(1번 필수, 2·3 옵션, 2번만 있으면 거부 — 이 정책과 일치). 21에 없는 insertDraft 차단·게이트 조건·노출 조건은 21b.

## 2026-10-04 21b 선행 점검 결과 (종현 t1304u: "점검부터, 이미 구축돼 있으면 이중일")
- 가입 경로(BasicRegisterService): 필수항목+대표1(과외지역1/홍보1) 없으면 행 자체가 생성되지 않음 → "필수 완료 ⇒ 베이직 자동 노출"은 이미 구현됨. 새 노출조건 로직 불필요.
- profile_status 기본값 'draft'(008_tutors.sql:42, 005_study_room_ssot_align.sql:22). 검색은 <> 'hidden' 이라 draft도 노출(SearchService.php:446,:717 등). hidden 전환은 관리자 hide뿐.
- 진짜 구멍: 가입 시드를 우회하는 길 — TutorRegisterService::insertDraft(:335), StudyRoomRegisterService::insertDraft(:373)가 지역 없이 draft 행 생성 → 노출됨. saveRegions 빈 목록 허용(21 M1 대상). 공부방 읽기시 홍보1 자동생성(21 M4 대상).
- needs_basic_register는 행 존재만 판정(노출과 무관, 리다이렉트용).
- 21b 범위 축소안: (1) insertDraft 지역 없는 행 생성 차단 (2) needs_basic_register에 대표1 포함 (3) 필요 시 검색 안전망. 운영DB 대표 없는 행 건수는 미확인(SQL 파일 제공됨).
- 미확인: rejectDraftPublish 내용, 공부방 saveBasicAndLocation/saveLocation의 홍보1 요구 여부, tutor-ui/register-api.js의 tutor_id=null 경로 실사용 여부.

## 2026-10-04 사이트오류-21 검수: ACCEPT (로컬, 미커밋·미배포)
- 근거: 실제 diff 검수 + 검사 16종 재실행(기준 동일, account-region 39→41은 신규 2검사, region-save-rules 25/0). M1~M5, M7~M10 충족, M6은 PHP src 충족·preview/home-ui/src/plans/order-blocks.js 5곳(:44,46,65,146,156) `행정동 #·단지 #·시 #` 잔존 → 21b로 이관(범위밖 수용 아님).
- 21 변경 파일: tutor-region-slots.js, tutor-ui step-basic.js, ProviderTicketService.php, TutorPositionAxis.php, StudyRoomHubRepository.php, TutorHubRepository.php, StudyRoomRegisterService.php, TutorRegisterService.php, account-region-label.js(신규), verify-mypage-account-region.mjs(신규), verify-region-save-rules.mjs(신규). BasicRegisterService.php는 21 범위 밖의 기존 로컬 변경(문구 정정 4+/4-).
- 회귀 주의: 홍보지역 행 없는 기존 공부방은 saved_regions=[] (사업장 동 자동 홍보1 제거), 대표 표시 없는 기존 과외쌤은 계정 카드 「등록 전」.

## 2026-10-04 사이트오류-21b 지시문 발행 (종현 「진행」 t1305u)
- 범위: (1) 지역 없는 임시행 생성 차단 (2) needsBasicRegister에 대표1 포함 + 재진입 시 기존 불완전 행 완성 (3) 검색·홈 노출 안전망(대표1 없는 카드 제외) (4) 공부방 publish 대표1 검사, has_primary_region 슬롯1 기준 (5) order-blocks.js `#id` 라벨 제거.
- 근거: 가입 시드는 이미 필수완료⇒노출 구현(BasicRegisterService), 우회로만 차단. profile_status 기본 draft는 노출 상태이므로 지역 없는 draft는 안전망 필요.

## 2026-10-04 발견: 공부방 로그인 홈 지도 중심 불일치 (종현 t1311u)
- 증상: 공부방 로그인(우동공과 민락점, 의정부 민락동 한라비발디아), 홈 「우리동네 공부방」 카드는 「민락동 1개」인데 지도는 대치역(대치동) 중심. 종현: "좋은 발견, 완벽히 검수돼야 함". 동네·현재위치 불일치는 서비스 기초 문제(모토 우리동네공부방과외).
- 조치: 읽기 전용 원인 추적 시작(지도 중심 좌표 출처, 카드와 같은 출처인지, 다른 지도 인스턴스 영향). 21b 결과 검수 및 공부방 박스 작업보다 우선 여부는 종현이 직접 짚은 사안으로 조사만 선행, 수정 지시문은 원인 확정 후 별도 티켓.
- 공부방 박스 작업 방향(t1310u): 박스 반폭(왼쪽) + 오른쪽 반에 「동네 공부방 현황」 카드 이동, 홍보1만 표시(2·3 등록 시만 추가), 공부방 파랑, 마이페이지 버튼은 과외쌤 방식. 지시문은 종현 「진행」 대기.

## 2026-10-04 공부방 홈 지도 중심 불일치 원인 (읽기 전용 추적, 확정)
- 원인(코드 확정): 공부방 홈 지도에 넘어가는 좌표가 항상 null. location-display.js:333-336 coordsFromLabel()=null 고정(67b9a63, 10-01에서 REGION_CENTER_FALLBACKS 삭제 후), naver-map.js:44-46 matchRegionCenter()=null 고정, regions/complexes 테이블에 좌표 컬럼 없음(001_init.sql:25-60), study_rooms.latitude/longitude는 NULL 허용이고 가입 INSERT(BasicRegisterService.php:506-539)·화면(study-room-ui state.js:181-182)이 채우지 않음 → 핀 0개 → naver-map.js:101-119 resolveMapCenter 기본값 GUEST_MAP_CENTER(대치) 폴백. search-map.js:108-111은 viewerRole==='parent'(학생)일 때만 data-geocode-region 부여(ee12aca) → 공부방은 지오코딩 없음.
- 카드 문구(민락동·1개)와 지도 중심은 서로 다른 원천(라벨 vs 좌표), 연결 코드 없음. 21/14/16/17/18/19/20 변경과 무관한 기존 결함. 레이스 아님.
- 영향: 공부방 홈, 로그인 후 공부방 찾기(코드상 동일 경로, 라이브 미확인), 공부방 상세 위치 지도(방 좌표 NULL이면 대치). 게스트(대치 정책)·학생(지오코딩)·과외쌤(지도 없음)은 해당 없음.
- 정책 충돌: 「대치동은 게스트 기준」인데 로그인 공부방이 조용히 대치로 폴백. 현재위치=홍보1 정책 위반.
- 수정안 후보: A 공부방 홈·찾기에도 지오코딩(질의는 홍보1 시·동 기준), B 비게스트는 대치 폴백 금지(지오코딩 실패 시 안내문), C 서버 좌표 저장(근본, 정책 결정·DB 필요). 권장 A+B, C 별도. 검증: scripts/verify-map-center-by-role.mjs(가짜 naver·가짜 지오코더, 조건 제거 자체검증), 게스트 72/72 유지, 실제 지도·라이브 DB는 배포 전 브라우저 확인.
- 확인 못함: 라이브 DB 좌표, 네이버 지오코더의 해당 라벨 응답, 공부방 찾기 실제 동작, exposure-data.js 목업 유입.

## 2026-10-04 공부방 지도 중심 — 기록 대조 결과 (종현 t1314u/t1316u: 잠근 정책인데 왜 안 됐나)
- 정책(잠금): 044/048(09-24) 「지도 = 홍보1 중심·라벨, 게스트 대치동 폴백 금지」, Notion 7장·9장·044 「공부방 홈=홍보1」. 핀: Notion 4장 §10-2·5장 「지도 핀 = 사업장주소 변환 lat/lng」(study_rooms.latitude/longitude nullable, sql 005).
- 구현 이력: 09-24 이름→좌표 하드코딩 표(f6b8498 가능동 추가). 066~068에서 정방향 geocode는 「후순위」, 미등록 동네는 대치 기본으로 한계 인정(민락은 처음부터 표에 없음). 10-01 67b9a63(178-17e 지역 목업 제거)이 표 삭제 + coordsFromLabel/matchRegionCenter null 고정 — 로그인 공부방 중심 대체 경로 없이 삭제(부작용, 검토 기록 없음). carryover에 「공식 지오코딩 아님 → 종현 결정 필요」 남았으나 결정 기록 없음. 10-03 ee12aca가 지오코딩을 학생에만 도입.
- 결론: 정책은 확정, 중심을 구하는 수단이 구현된 적 없음(표는 목업이라 제거됨). 현재 동작은 044/048과 충돌. 핀 좌표(사업장주소 변환 저장)도 정본(4장·5장)에 있으나 가입·등록이 채우지 않음.
- 계획: 사이트오류-22 = 중심(홍보1 시·동·단지명 지오코딩, 비게스트 대치 폴백 금지) 종현 「진행」 대기. 22b = 핀 좌표 저장(사업장주소 → lat/lng, 4장·5장). 

## 2026-10-04 사이트오류-21b 검수: ACCEPT (로컬, 미커밋·미배포)
- 근거: 실제 diff 검수 + 검사 17종 재실행 모두 기준 동일(verify-basic-exposure-gate 24/0 신규, php -l 14개 OK). M1~M6, M8~M10 충족, M7은 has_primary_region이 슬롯1 존재가 아니라 지역명 해석 기준(수정 전부터 동일 의존, 수용), 루프·오탐 없음.
- 정책 구현: 지역 없는 임시행 생성 차단(과외쌤 마법사는 기본+과외지역1 한 요청, 공부방 basic 신규 거부), needsBasicRegister=행+대표1, 불완전 행은 같은 id UPDATE 완성, SearchService:296-313 헬퍼로 검색·홈·지도수치·인사 노출 게이트, 공부방 publish 홍보1 검사, order-blocks # 라벨 제거.
- 배포 전 확인: (1) 운영 DB 대표1 없는 과외쌤·공부방 건수 SQL(violating-accounts-no-primary-region.sql) (2) 서버와 프런트 번들 동시 배포(옛 2단계 마법사 번들이 남으면 첫 저장 거부) (3) paid e2e 픽스처가 지역 없이 만들어져 검색 의존 시 영향.
- 21c 후보(필수 아님, 종현 지시 시): 불완전 행 완성 때 과목·대상 DELETE 후 재삽입 → 보존; 카드·인사 라벨 조인 is_primary→슬롯1 통일; 게이트 검사에 정상 신규 저장·수정 시 지역 유지·listPublic 케이스 추가; loadForUser가 published/hidden 불완전 행도 프리필; 이용권 ProviderTicketRepository is_primary 옛 데이터 불일치.
- 참고: verify-tutor-region-label 마지막 가드가 「무변경」→「용어 정정만 허용」으로 완화됨(20 때문, 로직 변경은 여전히 검출).

## 2026-10-04 공부방 지도 = 홍보1 연결 점검 (종현 t1317u/t1318u/t1319u)
- 종현 정정: 위도·경도는 게스트 대치역(위치 불분명) 때문에만 썼다. 공부방은 행정동·아파트단지 이름으로 네이버 지도검색이 되므로 좌표 저장 불필요. 사업장주소 → 홍보1 자동 채움은 이미 잠금 정책(031/040/041), 홍보1은 필수라 항상 존재, 홍보1이 항상 지도 위치. 비어 있으면 문법(구현) 오류. ⇒ 22b(좌표 저장)는 폐기, 노션 4장·5장 「사업장 lat/lng 핀」은 이 결정으로 대체(변경분).
- 코드 확인: (1) 사업장→홍보1 자동 채움 구현됨·유지(study-room-basic-form.js fillPromo1FromOpening :602-615, 호출 :641-646, 수동 보호 data-promo1-manual, 안내 PROMO1_MISMATCH_COPY; 가입·마이페이지·마법사 3곳 공용; 6bf408a 09-24, 이후 로직 변경 없음). (2) 서버 필수 검증 일관(BasicRegisterService normalizeSignupPromoSlots :684-752, 거부 :747-749). (3) 홍보2·3을 대표로 옮기는 별도 UI 없음 — 서버는 배열 위치=순서, 슬롯1만 대표(StudyRoomRegisterService :1147). (4) 지도: 홍보1 라벨(promo_label 「시도 시군구 동 · 단지명」)이 지도까지 도착하나 위치로 바뀌지 않음 — search-map.js:108 지오코딩 조건이 viewerRole==='parent'만, matchRegionCenter/coordsFromLabel null 고정(67b9a63) → GUEST_MAP_CENTER. 상세 지도 studyroom-detail.js:23, detail-shell.js:352도 동일. 검증 스크립트 공백: verify-location-ssot.mjs:259-261은 「라벨만으로 좌표 없음」을 정상으로 고정, 공부방 로그인 지도 중심 검사 없음.
- 빠진 연결: 홍보1 라벨 → 이름 지오코딩(단지명 질의 → 시·동 질의 폴백, 실패 시 대치 대신 안내문) — 사이트오류-22.

## 2026-10-05 공부방 지도 중심 — 홍보지역 기준(동/단지)별 저장·도착 조사 결과 (코드 읽기만)
- 저장: 슬롯마다 region_basis_type(dong|complex). 동=region_id(시도·시군구·동), 단지=complex_id → complexes.address(도로명)·name. complexes에 좌표 컬럼 없음(001_init.sql:46).
- 읽기 응답(StudyRoomHubRepository::savedRegions :146-193): region_id, complex_id, region_basis_type, region_label, promo_label, is_primary. complex_address/complex_name은 없음.
- promo_label: 동=「경기도 의정부시 민락동」, 단지=「… 민락동 · 한라비발디아」.
- 클라이언트 peekStudyRoomPromo1()은 promo_label 문자열만 반환, region_basis_type·complex_id는 쓰지 않음. geocodeRegionCenter는 기준 구분 없이 라벨 통째 질의(naver-map.js:154-177). 공부방은 data-geocode-region 미부착(search-map.js:108-111)이라 대치 기본값으로 떨어짐.
- 빠진 부분 5가지: (1) 허브 응답에 단지 주소·이름 탑재 (2) 클라이언트가 대표 슬롯 {기준, 라벨, 단지주소} 반환 (3) 지도가 기준별 질의 생성(동=라벨, 단지=도로명) (4) 공부방 역할에 지오코딩 켜기 (5) 실패 시 대치 대신 안내 문구.
- 정정: 「단지 먼저→동 폴백」은 틀린 표현. 저장된 기준을 따른다(종현 t1320u).
- 미확인: 네이버 지오코더 실제 응답(단지명 섞인 질의), 라이브 DB의 complexes.address 공백 여부.

## 2026-10-05 지도 전 화면 중심 경로 점검 (종현 t1322u: 지도는 공부방 계열에만 있고 학생 모드 공부방 탭·공부방 찾기에도 있음)
- 지도 있는 화면: 공부방 홈/찾기, 학생 공부방 탭/공부방 찾기, 게스트 홈/찾기, 공부방 상세. 과외 탭·과외쌤 찾기·과외쌤 모드는 지도 없음. 공통: bindStudyRoomMapSection(naver-map.js:342)→mountStudyRoomMap(:202).
- resolveMapCenter(naver-map.js:101-119) 우선순위: 명시 좌표 → 핀 평균 → 지역명 매칭(항상 null) → GUEST_MAP_CENTER(대치역). 지오코딩은 data-geocode-region=true(viewerRole==='parent'만, search-map.js:108-111)이고 출처가 default일 때만.
- 학생 홈/찾기: 저장 희망지역(공부방 분기=행정동) 지오코딩, 못 찾으면 안내 문구(대치로 안 감, naver-map.js:232-240).
- 문제 후보: (1) 핀 좌표가 하나라도 있으면 핀 평균이 지오코딩보다 먼저(학생 중심이 희망지역이 아니라 핀 위치가 될 수 있음) (2) 학생 단지(preferred_studyroom_complex_id)가 클라이언트 중심 계산에 안 들어감(student-saved-region.js:54-63) (3) 공부방 계정 홈/찾기는 지오코딩 미적용 → 대치 (4) 공부방 상세 지도는 핀 null이면 대치 중심·핀 없음 (5) 로그인 학생이 #/guest 직접 진입, 역할 대기(navRole 'guest')면 대치 고정.
- 미확인: 브라우저 렌더링, 라이브 DB의 study_rooms.latitude/longitude(UI에 채우는 코드 못 찾음), 네이버 지오코더의 단지명·도로명 실제 응답.

## 2026-10-05 지도 중심: 잠긴 정책 대 코드 대조 (종현 t1323u 분노 지적 후 재조사, 읽기 전용)
- 종현 재확인(리마인드): 대치동/대치역은 비로그인 게스트 현재위치에만. 로그인 공부방은 지도가 무조건 홍보1(대표). 대치가 뜨면 홍보1을 대치동으로 등록한 카드일 때만. 이전 보고에서 '대치로 가는 곳이 더 있다'를 정책처럼 쓴 것은 우동공과2의 서술 오류(코드 폴백은 정책 위반 오류로 구분해야 함). 학생 찾기를 '저장 희망지역만 본다'고 단정한 것도 오류.
- 잠금 근거: 044:45,69,73 / 051:23,41,71 / 187:2,5 / 164:35,91-93 / 193:585(공부방은 이름 검색, 홍보1 항상 존재).
- 코드 사실: resolveMapCenter·mountStudyRoomMap은 역할을 모르고 마지막에 무조건 GUEST_MAP_CENTER(naver-map.js:101-119, :118). 역할 구분은 호출자 HTML 속성뿐. 지도 호출자 3곳: search-map.js:204, detail-shell.js:352, guest-sections.js:282.
- 오류 경로(정책 위반): P1 공부방 홈, P2 공부방 찾기, P3 공부방 상세(로그인 전 역할) — 홍보1 라벨은 도착하나 위치 변환 없음+핀 좌표 NULL이면 대치. P5 로그인 사용자가 #/guest 렌더(route-access.js:192가 막지 않음).
- 학생: 지오코딩 있고 못 찾으면 안내 문구(대치 아님). 단 핀 평균이 지오코딩보다 먼저(naver-map.js:108-113,:231): 핀=사업장 좌표(홍보지역 아님), 목록 매칭은 사업장 동 OR 홍보 슬롯(SearchService.php:474-477)이라 선택 지역 밖에 핀이 찍힐 수 있음. 선택 단지: 목록은 동 단위(regionLabelToken '·' 앞 토큰), 도로명 주소 버려짐(canonicalFromKakao), 마이페이지 저장 단지는 찾기에서 미사용(student-saved-region.js:54-63).
- 문서끼리 충돌: 067:25,31-33·068-acceptance:63(미등록 동네 대치 기본 수락, 09-24) vs 044:69·051:23(대치=게스트만). 종현 최신 확정으로 후자가 정본.
- 경위: f6b8498(09-24 대치 기본값+좌표표) → 67b9a63(10-01 좌표표 삭제, 공부방 중심 대체 경로 검토 없음) → ee12aca(10-03 지오코딩 학생만).
- 못 본 것: 라이브 DB 핀 좌표·홍보1 대치동 계정 유무, 브라우저 렌더링, 네이버 지오코더 응답, #/guest 링크 전수, '학생 찾기를 단지 단위로 목록·지도 모두 검색한다'는 단독 잠금 줄(docs에서 못 찾음; 193:49-53,173-177,219는 단지는 동으로 올려 보기).

## 2026-10-05 배포: 사이트오류-19·20·20b·21·21b 한 묶음
- 종현 「현재까지 작업해 놓은 것만 배포」(t1325u). 파일별 귀속 확인(50개 diff 판독, 기타 0건) 후 배포 지시문 발행.
- 결과: 커밋 1cfc4072c1d7c21034f035e8444ef2d5dfe596b4, 파일 51개(2743+/443-), origin/main 푸시. 사전 PHP 14개 문법 OK, 검사 17종 기대치 일치.
- Actions: Deploy to dothome #377 success + Board ACL / Tutor inquiries / Tutor lesson step / ShopPage gate 모두 success.
- 라이브 확인은 종현 몫(미확인). 지도 중심 이슈(공부방 로그인 지도가 대치/민락 아님)는 이 배포에 포함되지 않음 — 종현이 전수조사 중이라 대기.

## 2026-10-05 사이트오류-22 지시문 발행 (종현 「진행」, t1327u: 민락 공부방 로그인 지도가 대치역 — 미수정 확인)
- 범위: 로그인 공부방 홈·찾기 지도 = 홍보1(저장된 기준 dong→promo_label, complex→complex_address) 지오코딩, 핀 평균은 중심 결정 안 함, 비게스트 대치 폴백 금지(안내 문구), 상세 지도도 대치 금지, 게스트 대치 고정 유지, 학생·과외쌤 변경 없음, 좌표 저장·핀 없음. '단지 먼저→동' 폴백은 쓰지 않음.
- 신규 검사 verify-map-center-by-role.mjs(변이 자체 검증). 결과 대기. 종현 현재위치 전수조사 결과와 충돌하면 그쪽이 우선.

## 2026-10-05 사이트오류-22 결과: ACCEPT (로컬만, 미커밋·미배포)
- Cursor 보고 M1~M10 구현함. 직접 재검증: 변경 파일 7+신규 1 외 변경 없음, 검사 18종 기대치 일치(verify-map-center-by-role 42/0은 preview/home-ui에서 `npx vite-node ../../scripts/verify-map-center-by-role.mjs`로 실행해야 함; 루트 실행은 alias 오류).
- 구현 요지: 서버 savedRegions에 단지 슬롯만 complex_name/complex_address; 클라 peekStudyRoomPromo1MapSlot·studyRoomGeocodeQuery(dong=promo_label, complex=complex_address, 주소 없음/「(주소 미등록)」이면 대체 없이 안내 문구); 공부방 홈·찾기·로그인 상세 data-member-map → 대치 폴백 대신 안내 문구(empty-state-copy.js STUDY_ROOM_MAP_COPY); 공부방 data-pin-center=false로 핀 평균·맞춤이 중심 안 옮김; 게스트 명시 좌표 불변, 학생 홈·찾기 불변.
- 약점: 변이 검증 3건 중 2건이 약함(문자열 includes·지역변수 비교, 항상 통과), bindStudyRoomMapSection DOM 속성 파싱 실행 검증 없음. 우려: 한라비발디 complexes.address 비어 있으면 안내 문구, 네이버 지오코더 실제 응답 미확인, 상세 지도 data-member-map은 학생 포함 비게스트 전체(대치=게스트만 정책과 일치).
- M9 동선: 로그인 사용자가 #/guest로 가는 경로 목록 확보(route-access.js:192 통과, main.js:337-338 등). 수정은 안 함.

## 2026-10-05 사이트오류-23 지시문 발행 (종현 「진행」 t1334u): 공부방 내 박스 = 과외쌤 박스 형태
- 사전 점검(HEAD 616f8e5): 현황 카드 = search-map.js:127-132 aside.hero-map__banner(지도 안, absolute). 박스 오른쪽 칸으로 이전(확정: 오른쪽 분포 칸 만들지 않고 현황 카드). 박스 위치 탭 아래, 반폭 768px 분할, 배지 「공부방 박스」, 4행, 안내글(홍보지역/쪽지설정), 마이페이지 getDefaultMypagePath('study_room'), 쪽지·후기함 /mypage/messages, 알약은 홍보1(+등록된 2·3만), 공부방 파랑 CSS 신규, --with-panel 죽은 CSS 제거.
- 우동공과2 결정: renderStatusBoxShell 공유 안 함(공부방 자체 렌더러, tutor.js 불변), 「과목」 칸 추가 안 함, 알약 라벨=region_label, 쪽지설정 문장은 메뉴 존재 확인 후.
- 영향 검사: verify-home-news-row NEXT_BOX.study_room(:650-655) 수정 필요, guest-baseline-map-cards 72/72 불변. 신규 verify-study-room-box-shape(실변이 검증).
- 22번 배포: 616f8e5 푸시, 보조 Actions 성공, Deploy #378 진행 중 확인 시점. 결과 대기.

## 2026-10-05 사이트오류-23 검수 결과: ACCEPT (로컬 변경만, 미커밋·미배포)
- 변경: study-room.js, study-room-home-seed.js, study-room-reg-copy.js(STUDY_ROOM_HOME_BOX_COPY), search-map.js(readStudyRoomProviderHomeBanner), search-find-surface.js(:2168 variant==='home'일 때만 지도 배너 생략), udx-std-apply.css, home-marketing-banner.css, verify-home-news-row.mjs, 신규 verify-study-room-box-shape.mjs(45/0).
- 확인: tutor.js·getDefaultMypagePath·PHP 불변, renderFloatMap 게스트 분기·heading 식 글자 불변(git diff), 알약 홍보1+등록된 2·3만, 쪽지·후기함 /mypage/messages, 안내글 리터럴은 copy 파일에만, 새 색값은 #fff 하나(그라데이션 끝), 죽은 CSS 사용처 0. 19종 검사 기대치 일치(home-news-row 226/0 chromium 포함).
- 단서: 신규 검사 변이 자식 프로세스는 단언 복제본, 변이 중 추적파일 임시 수정(강제종료 시 잔존 가능), renderStudyRoom이 previewState.studyRoomFind.homeSelf를 먼저 세팅(충돌 없음).
- 23과 무관한 추적 파일 변경 8개(docs/internal/23, docs/ssot/09·16·29·30, DOC-CHECKLIST.md, SSOT-ALIGNMENT.md, run-paid-pr-a-e2e.ps1)가 02:47에 생김 — 배포 시 제외 목록 그대로 유지.
- 못 본 것: 브라우저 육안, 768px 전환, 운영 DB 값. 라이브 확인은 배포 후 종현.
- 22번 배포: 616f8e5, Deploy #378 success.

## 2026-10-05 종현 「배포」(t1336u): 사이트오류-23 → 커밋 7fb4c87(9개 파일) origin/main 푸시, Deploy to dothome #379 및 보조 Actions 3건 success. 라이브 확인은 종현(공부방 홈 박스 탭 아래·반폭·알약·오른쪽 현황 카드, 768px 전환).

## 2026-10-04 푸시·배포 결과 (14+16+17)
- 커밋 3b5b347 (origin/main 일치). GitHub Actions 3건(Deploy #375 포함) success 확인(cursor-github 조회). 라이브 확인은 종현 대기.
- 다음 순서: 「내 공지」 마이페이지 상단 수정(이슈 요약 후 승인 대기).
