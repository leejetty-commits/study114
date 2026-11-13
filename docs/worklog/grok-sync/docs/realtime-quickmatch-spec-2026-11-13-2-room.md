# 실시간 퀵매칭서비스 구현 지시서 — 2단계 공부방 (2026-11-13)

- 선행: 0단계·1단계 PR이 **머지·배포되고 확인된 뒤** 시작. 공통 규칙 A절·금지 C-6절(0단계 문서)은 그대로 적용.
- 시안: `assets/realtime-quickmatch-2026-11-13/` — `png/room-1-student-register.png`(+`-mobile`), `png/room-2-director-age.png`, `png/room-3-matching-on.png`(+`-mobile`), `png/room-4-message.png`, `png/room-overview.png`. HTML 원본 `room-*.html`.
- PR 1개. 커밋·PR까지, **머지 금지, 보고**.

---

## 2-0. 첫 작업 — 조사·보고 (코드 변경 전)

**이 문서와 다르면 멈추고 보고.**

1. 1단계 산출물(`TutorMatcher`, 학생 퀵매칭 묶음 UI)이 main에 있는지. 공부방 매칭기는 같은 구조로 붙인다.
2. 지역: 공부방 프라임 포지션 `region_basis_type`(dong/complex)·`region_id`·`complex_id`(065, `PrimeRegionScope::normalizeFromInput()`)와 학생 `preferred_studyroom_region_id`·`preferred_studyroom_complex_id`·`preferred_studyroom_region_basis` + 추가 3칸(087)의 비교 방법. 동 기준 학생과 단지 기준 프라임이 만나면 어떻게 볼지. 추천: 같은 기준·같은 id만 일치, 단지 프라임은 그 단지가 속한 동과 학생 동이 같으면 일치(가능한지 1단계 조사 필요).
3. 학교급: `study_room_subject_targets.school_level`(elementary/middle/high/other — 유아·성인 값 없음)과 기본등록 「대상 학교급」(시안: 유아·초등·중등·고등·성인)의 실제 저장 위치. 학생 `student_subject_targets.school_level`과 비교 방법. (1단계 조사 필요)
4. 과목: `study_room_subject_targets.subject`(문자열) vs 학생 과목.
5. 수업료: `study_rooms.monthly_fee_manwon`(VARCHAR 만원, 상세 단계 `preview/study-room-ui/src/screens/step-lesson.js`) 숫자 파싱 가능 비율·빈 값 비율. 학생 `preferred_studyroom_fee_amount`(천원)와 단위 맞추기(만원×10). 규칙: **같은 20만 원 구간 또는 바로 옆 구간**(확정안 a58a18c2). 빈 값 처리 0단계 E-6.
6. 원장 성별: 기본등록 「원장성별 — 계정 프로필 성별과 같습니다」(`preview/shared/study-room-basic-form.js`, `src/Views/auth/partials/basic-study-room.php`) → `users.gender`인지.
7. 학생 「희망 원장 성별」: 0단계 E-2 결정(추천: `preferred_tutor_gender` 재사용, 공부방일 때 라벨만 「희망 원장 성별」).
8. 교육청 등록증: `study_rooms.education_office_registered`(005) — 자기 신고 값인지, 서류 승인(`study_room_verification_documents`·`study_room_badges` `education_office`, 009) 기준인지. 추천: **승인 배지 기준**(신뢰). 프랜차이즈: `study_rooms.franchise_flag`.
9. 원장 나이대 저장 경로: 공부방 기본등록 저장 함수(`StudyRoomRegisterService` 또는 `BasicRegisterService::registerStudyRoom()`/`StudyRoomHubRepository`) 중 어디에 `director_age_band`를 넣는지.
10. 학생 동의 문구 `PRIME_MATCH_LABEL`(「프라임 과외쌤에게…」) 변경 여부 — 0단계 E-10 종현 답.

## 2-1. 매칭 규칙 (공부방)

| 구분 | 축 | 학생 값 | 공부방 값 | 일치 |
|---|---|---|---|---|
| 지역 | 홍보지역 | 학생 공부방 희망지역 본+추가 | **활성 프라임** 포지션 지역 스코프 | 하나라도 겹침(2-0 #2) |
| 필수 | 학교급 | `student_subject_targets.school_level` | 2-0 #3 | 겹침 |
| 필수 | 과목 | 학생 과목 | `study_room_subject_targets.subject` | 하나라도 겹침 |
| 필수 | 수업료 | `preferred_studyroom_fee_amount` | `monthly_fee_manwon` | 같은 20만 원 구간 또는 옆 구간 |
| 필수 | 원장 성별 | E-2 결정 칸 | 2-0 #6 | any·빈 값 통과 |
| 선택 | 교육청 등록증 | (E-1 승인 시) `edu_office` | 2-0 #8 | 선택 축 공통 |
| 선택 | 프랜차이즈 | (E-1) `franchise` | `franchise_flag` | 〃 |
| 선택 | 원장 나이대 | `students.preferred_director_age_bands`(089) | `study_rooms.director_age_band`(089) | OR. 어느 쪽이든 비면 통과 |

- 선택 축 공통·필수 빈 값 처리는 1단계 1-1과 같다.
- 수업형태는 학생 쪽 칸이 없어 **매칭에서 뺀다**(확정안).
- 매칭 키 목록에 공부방 축 키 추가: 공부방 지역 6칸, `preferred_studyroom_fee_amount`, `preferred_director_age_bands`, (E-2 결과) 성별 칸, (E-1) `quick_match_prefs`.

## 2-2. 바꿀 파일 (예상 — 조사 후 확정해 보고)

- 서버
  - `src/QuickMatch/StudyRoomMatcher.php`(새), `QuickMatchDispatcher`에 희망 유형 `study_room` 분기.
  - `QuickMatchSettingsService`: 공부방 필수 4개 읽기 전용(학교급·과목·수업료·원장 성별), 선택 스위치 `edu_office`·`franchise`·`age_band`.
  - 공부방 기본등록 저장·읽기에 `director_age_band`(0단계에서 서버를 했으면 화면만).
- 화면
  - 공부방 기본등록 「나이대」 단일선택(20대/30대/40대/50대 이상), 원장성별 바로 아래, 힌트 「매칭에만 쓰이며, 카드나 공개 화면에는 보이지 않아요. 비워 두어도 매칭에는 들어가요.」(시안 `room-2`). 대상 파일: `preview/shared/study-room-basic-form.js`, `preview/study-room-ui/src/screens/step-basic.js`, 마이페이지 공부방 기본정보 편집(`preview/home-ui/src/study-room-reg/*` 중 해당 파일 — 조사 후 확정). **요약·카드(`study-room-ui/src/summary.js`, 마이샵·카드)에는 넣지 않는다.**
  - 학생 기본등록: 희망 유형 공부방일 때 퀵매칭 묶음 + 「희망하는 원장샘 나이대」 한 줄, 태그(학교급·예산·희망과목·희망 원장 성별 = 필수 / 교육청 등록증·프랜차이즈·나이대 = 선택, 시안 `room-1`).
  - `preview/home-ui/src/mypage/quick-match/*`: 공부방 화면(시안 `room-3`) — 광고 홍보지역 칩, 필수 4개 읽기 전용, 선택 스위치, 다음 변경일, N/20건.
  - 쪽지 퀵매칭 탭 공부방 안내(시안 `room-4`).

## 2-3. DB

없음(089 사용). E-1이 (가)로 승인돼 있어야 교육청·프랜차이즈 축을 켤 수 있다. 새 SQL이 필요해지면 **멈추고 보고**. SQL은 종현이 직접 실행.

## 2-4. 공부방용 매칭 쪽지 문구 초안 (종현 확인 필요)

공부방(원장님)이 받는 퀵매칭 스레드:
> **{김*수} 님과 조건이 맞아요** · 실시간 퀵매칭
> 학생 요약: {중2} · {수학} · 희망 원장 성별 {여} · 예산 월 {35}만 원 · {경기 성남시 분당구}
> 우동공과 조건이 맞아 연결되었어요. 같은 학생에게는 한 번만 알려 드려요. 답장으로 인사를 시작해 보세요.

학생이 보게 되는 퀵매칭 스레드 고정 안내(원장님이 첫 답장을 보낸 뒤):
> 실시간 퀵매칭으로 조건이 맞는 프라임 공부방이 보낸 쪽지예요.
> 교육청 등록 등 조건은 상담할 때 원장님의 인증서류로 꼭 확인해 주세요.

## 2-5. 수락 기준

1. 공부방 기본등록에 「나이대」 단일선택이 있고 저장·다시 열기가 된다. 카드·마이샵·공개 화면에는 나이대가 없다.
2. 학생(공부방) 기본등록에 퀵매칭 묶음과 「희망하는 원장샘 나이대」 한 줄. 과외로 바꾸면 「희망하는 과외쌤 나이대」로 바뀐다(한 줄만).
3. 조건이 모두 맞는 **프라임 공부방**에만 스레드가 생긴다. 픽·무료·만료·환불 공부방은 제외.
4. 학생 희망지역 본·추가 중 하나만 프라임 홍보지역과 겹쳐도 매칭.
5. 원장 나이대 빈 공부방은 나이대 조건과 무관하게 매칭.
6. 1단계 수락 기준 5·6·7·8·9·10을 공부방에도 똑같이 만족.
7. 1단계 과외쌤 매칭이 그대로 동작(회귀 없음).

## 2-6. 테스트 계정 확인 절차 (운영 배포 후, 종현)

종현 보관 공부방·학생 테스트 계정 사용(계정 정보는 어디에도 쓰지 않음).
1. 프라임 공부방 계정: 기본정보에서 나이대 저장 → 카드에 안 보이는지 확인.
2. 「실시간 퀵매칭서비스」에서 원장 나이대 스위치 켜고 저장.
3. 학생 계정: 추천 동의 켬 → 공부방, 같은 홍보지역·학교급·과목, 예산 맞게, 희망 원장샘 나이대에 원장 나이대 포함해 저장.
4. 공부방 쪽지함 「실시간 퀵매칭」 탭 1건, 1/20건. 원장 답장 → 학생 퀵매칭 탭과 안내 확인.
5. 학생이 나이대를 원장과 다른 값으로만 바꿔 다른 날 저장 → 새로 맞는 곳이 없으면 발송 없음.
6. 픽·무료 공부방 계정 → 스레드 없음, 메뉴 회색.
7. 캡처(개인정보 가림)를 Cursor 보고에 붙인다.

## 2-7. 금지

0단계 C-6 전부 + 다음.
- 공부방 카드·마이샵·검색 결과에 나이대를 넣지 않는다.
- 학생 쪽에 새 칸을 만들지 않는다(E-1·E-2 결정 범위 밖).
- 프라임 재고·지역 스코프 계산(`PrimeRegionScope` 재고 로직)을 바꾸지 않는다. 읽기만.
- **커밋·PR까지, 머지 금지, 보고.** 조사 결과가 이 문서와 다르면 멈추고 보고.
