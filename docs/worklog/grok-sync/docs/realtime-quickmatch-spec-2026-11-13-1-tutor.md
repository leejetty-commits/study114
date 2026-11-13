# 실시간 퀵매칭서비스 구현 지시서 — 1단계 과외쌤 (2026-11-13)

- 선행: `realtime-quickmatch-spec-2026-11-13-0-common.md`(0단계 PR이 **머지·배포되고 089가 운영에 적용된 뒤** 시작). 공통 규칙 A절·금지 C-6절은 이 단계에도 그대로 적용.
- 시안: `assets/realtime-quickmatch-2026-11-13/` — `png/tutor-1-student-register.png`(+`-mobile`), `png/tutor-2-matching-on.png`(+`-mobile`), `png/tutor-3-matching-off.png`, `png/tutor-4-message.png`, `png/tutor-overview.png`. HTML 원본 `tutor-1-student-register.html` 등.
- PR 1개. 커밋·PR까지, **머지 금지, 보고**.

---

## 1-0. 첫 작업 — 조사·보고 (코드 변경 전)

아래를 확인해 표로 보고한다. **이 문서와 다르면 멈추고 보고.**

1. 0단계 산출물(`src/QuickMatch/*`, `/api/quick-match/settings.php`, `thread_origin`, 메뉴·탭)이 main에 있는지.
2. 학생 과외 희망지역 `students.preferred_tutor_region_id`·`preferred_tutor_region_extra_id`(087)와 과외쌤 프라임 광고 지역 `provider_position_subscriptions.city_id`(066)가 **같은 지역 id 체계**(`regions.id`, 시·군)인지. 다르면 변환 방법. (1단계 조사 필요)
3. 과외쌤 과목: 매칭에 등록 과목 `tutor_subject_targets`(subject_master_id/subject_name)를 쓸지, 프라임 포지션의 `primary_subject_id`(066)를 쓸지. 추천: **등록 과목 전체**(필수 「과목」은 등록 정보 읽기 전용이므로). 학생 `student_subject_targets`와 `subject_master_id` 우선, 없으면 이름 비교. (1단계 조사 필요)
4. 교습비 단위: `tutors.preferred_fee_amount`(시드 600000 → 원?)와 `students.preferred_fee_amount`(화면 「예산(천원)」) 단위. (0단계 E-5)
5. 과외쌤 성별 위치: `TutorBasicFields` 주석 「성별은 계정 단계 값」→ `users.gender`인지.
6. 쪽집게 판정: 유료 배지 `provider_paid_badges`의 `jjokjipge`(`PaidBadgeResolver::TUTOR_CODES`)가 지금 활성인지로 볼지. 스카이: `tutors.university_name`이 `SKY_UNIVERSITY_NAMES`(`preview/shared/korean-universities.js` `isSkyUniversityName()`, 서버 `SearchService::skyRankExpr()`)에 드는지. **`university_note`·대학원 문구 파싱 금지**(기존 코드 주석 규칙).
7. **대학원 이상:** 과외쌤 쪽에 판정할 칸이 없다(`university_status`는 재학/휴학/수료/졸업, 대학원은 「기타」 자유입력). 판정 방법이 없으면 이 축은 **구현하지 않고 보고**. (1단계 조사 필요)
8. 0단계 E절 1·2·3·9번에 대한 종현 답(부모 대화). 답이 없으면 해당 축은 빼고 진행.

## 1-1. 매칭 규칙 (과외쌤)

| 구분 | 축 | 학생 값 (기존 칸) | 과외쌤 값 (기존 칸) | 일치 |
|---|---|---|---|---|
| 지역 | 지역 | `preferred_tutor_region_id`, `preferred_tutor_region_extra_id` | **활성 프라임** 포지션 `city_id` | 둘 중 하나라도 프라임 광고 시·군과 같음 |
| 필수 | 대상 | `student_subject_targets.school_level` | `tutor_subject_targets.school_level` | 겹침 |
| 필수 | 과목 | `student_subject_targets` | `tutor_subject_targets` | 하나라도 겹침 |
| 필수 | 추천 성별 | `students.preferred_tutor_gender` (female/male/any) | 과외쌤 성별(`users.gender`, 1-0 #5) | any·빈 값이면 통과(E-3 결정 따름) |
| 필수 | 교습비 | `students.preferred_fee_amount` | `tutors.preferred_fee_amount` | 1-0 #4 단위 맞춘 뒤 **같은 20만 원 구간 또는 바로 옆 구간**(0단계 E-5, 종현 확인 필요) |
| 선택 | 스카이 | (E-1 승인 시) `quick_match_prefs` 의 `sky` | `isSkyUniversityName(university_name)` | 아래 「선택 축 공통」 |
| 선택 | 쪽집게 | (E-1) `jjokjipge` | 활성 `jjokjipge` 배지 | 〃 |
| 선택 | 강의스타일 | `student_preferred_teaching_style_badges` | `tutor_teaching_style_badges` | 하나라도 겹침(OR) |
| 선택 | 대학원 이상 | (E-1) `grad_school` | 1-0 #7 결과 | 판정 불가면 미구현 |
| 선택 | 쌤 나이대 | `students.preferred_tutor_age_bands`(089) | `tutors.age_band` 7칸 → 4칸 매핑 | OR. 어느 쪽이든 비면 통과 |

- **나이대 매핑:** 20s = `early_20s`·`late_20s`, 30s = `early_30s`·`late_30s`, 40s = `early_40s`·`late_40s`, 50_plus = `over_50`. 찾기 화면 연령대 필터 7칸(`SearchService` `applyEnum(... 'age_band')`, `search-enums.js` `AGE_BAND_LABELS`)은 **그대로** 둔다.
- **선택 축 공통(시안 문구대로, 0단계 E-4):** 과외쌤이 스위치를 켠 축만 본다. 켰더라도 학생 값이 비었거나 「상관없음」이면 통과. 끈 축은 보지 않는다.
- 필수 4개 중 과외쌤 값이 비어 있으면(기본등록 필수라 드묾) 그 과외쌤은 제외. 학생 필수 값이 비면 그 학생은 매칭하지 않음.
- 매칭 키 목록(0단계 `StudentHubService` 재매칭 훅)에 과외 축 키를 채운다: `preferred_tutor_region_id`, `preferred_tutor_region_extra_id`, `school_level`, `subject_names`/`subject_label`, `preferred_tutor_gender`, `preferred_fee_amount`, `teaching_style_badges`, `preferred_tutor_age_bands`, (E-1 승인 시) `quick_match_prefs`, `preferred_lesson_type`, `prime_match_opt_in`.

## 1-2. 바꿀 파일 (예상 — 조사 후 확정해 보고)

- 서버
  - `src/QuickMatch/TutorMatcher.php`(새): 위 표대로 후보 SQL. 프라임 활성·지역은 `QuickMatchPrimeGate`.
  - `src/QuickMatch/QuickMatchDispatcher.php`: 희망 유형 `tutor`일 때 `TutorMatcher` 호출.
  - `src/QuickMatch/QuickMatchSettingsService.php`: 과외쌤 필수 4개 읽기 전용 값(대상·과목·성별·교습비 표시용), 선택 스위치 키 `sky`·`jjokjipge`·`teaching_style`·`grad_school`·`age_band`(E-1·1-0 #7 결과에 따라 숨김 가능).
  - `src/Registration/StudentHubRepository.php`: `preferred_tutor_age_bands` 읽기(`mapStudent` 류 반환 배열, 736행 근처 `prime_match_opt_in` 옆) — 0단계에서 했으면 생략.
- 화면
  - `preview/home-ui/src/student-reg/screens.js` `renderBasicForm()`: 희망 유형이 과외일 때 「실시간 퀵매칭」 제목(**박스 밖**) + 안내문 + 매칭 항목 태그 + 「희망하는 과외쌤 나이대」 한 줄(20대/30대/40대/50대 이상 다중, 힌트 「여러 개를 고를 수 있어요. 비워 두면 나이대는 보지 않아요. 이 정보는 카드나 공개 화면에 보이지 않아요.」). 분기는 `bindLessonTypeChange()`와 같은 방식. 희망 성별·강의스타일 이동은 E-3 결정 따름.
  - 태그: 학교급·예산·희망과목·희망 과외쌤 성별 = 「매칭 필수」, 스카이·쪽집게·희망 강의스타일·대학원 이상·나이대 = 「매칭 선택」(시안 `tutor-1`).
  - `preview/home-ui/src/student-reg/student-reg-copy.js`: 문구.
  - `preview/home-ui/src/mypage/quick-match/*`: 과외쌤 화면 — 프라임 광고 지역 칩, 필수 4개 읽기 전용(「내용을 바꾸려면 내 등록 · 기본정보에서 수정해 주세요.」), 선택 스위치, 다음 변경일, 오늘 N/20건(시안 `tutor-2`). **스카이 값은 학교명 없이 「해당」/「해당 없음」.**
  - 쪽지 「실시간 퀵매칭」 탭에서 과외쌤용 안내 블록(시안 `tutor-4`).
- **나이대는 카드·공개 화면·찾기 결과에 넣지 않는다.** `exposure-schema.js`·`exposure-format.js` 수정 금지.

## 1-3. DB

없음(089 사용). E-1이 (가)로 승인되면 그 칸이 089 또는 090으로 먼저 적용돼 있어야 한다. 이 단계에서 새 SQL을 만들 필요가 생기면 **멈추고 보고**. SQL은 종현이 직접 실행.

## 1-4. 과외쌤용 매칭 쪽지 문구 초안 (종현 확인 필요)

과외쌤이 받는 퀵매칭 스레드:
> **{김*수} 님과 조건이 맞아요** · 실시간 퀵매칭
> 학생 요약: {중2} · {수학} · 희망 성별 {여} · 예산 월 {40}만 원 · {서울 강남구}
> 우동공과 조건이 맞아 연결되었어요. 같은 학생에게는 한 번만 알려 드려요. 답장으로 인사를 시작해 보세요.

학생이 보게 되는 퀵매칭 스레드 고정 안내(과외쌤이 첫 답장을 보낸 뒤 목록에 나타남):
> 실시간 퀵매칭으로 조건이 맞는 프라임 과외쌤이 보낸 쪽지예요.
> 학력 등 조건은 상담할 때 쌤의 인증서류로 꼭 확인해 주세요.

(학생 요약에 학교명·스카이·대학 문구 금지. 지역은 매칭된 시·군 하나만.)

## 1-5. 수락 기준

1. 학생(과외) 기본등록에 퀵매칭 묶음과 태그, 「희망하는 과외쌤 나이대」 한 줄이 보이고, 희망 유형을 공부방으로 바꾸면 이 줄이 사라진다.
2. 조건이 모두 맞는 **프라임** 과외쌤에게만 퀵매칭 스레드가 생긴다. 픽·무료·프라임 만료·환불 과외쌤에게는 생기지 않는다.
3. 학생 희망지역 2곳 중 하나만 프라임 광고 시·군과 겹쳐도 매칭, 둘 다 안 겹치면 미매칭.
4. 나이대: 학생이 30대만 골랐을 때 `late_30s` 쌤은 매칭, `early_40s` 쌤은 미매칭(스위치 켠 경우). 쌤 `age_band`가 비면 매칭. 학생이 비우면 나이대 무시.
5. 같은 학생-쌤 쌍에는 두 번 보내지 않는다. 과외쌤 하루 21번째부터 보내지 않는다.
6. 재매칭: 학생이 과목을 바꾸면 새로 맞는 쌤에게만 감. 같은 날 두 번째 수정은 보내지 않음. 요청문만 고치면 보내지 않음.
7. 설정 화면: 필수 4개 읽기 전용, 선택 스위치만 저장, 첫 저장 후 7일 제한, 오늘 N/20건 표시.
8. 쪽지·카드·설정 화면 어디에도 학교명이 없다. 학생 이름은 마스킹.
9. 매칭 쪽지는 쪽지권을 차감하지 않고, 과외쌤의 첫 답장도 쪽지권을 차감하지 않는다.
10. 빌드·`verify:php-syntax`·관련 verify 통과, CSS 파일별 괄호 검사 통과.

## 1-6. 테스트 계정 확인 절차 (운영 배포 후, 종현)

종현 보관 테스트 계정 사용(계정 정보는 어디에도 쓰지 않음).
1. 프라임 과외쌤 계정: 마이페이지 「실시간 퀵매칭서비스」 → 선택 스위치 1개 켜고 저장 → 다음 변경일 표시 확인.
2. 학생 테스트 계정: 추천 동의 켬 → 과외, 프라임 쌤 광고 시·군, 같은 대상·과목, 성별·예산 맞게 기본등록 저장.
3. 프라임 쌤 쪽지함 「실시간 퀵매칭」 탭에 새 스레드 1건, 오늘 1/20건.
4. 쌤이 답장 → 학생 쪽지함 「실시간 퀵매칭」 탭에 스레드와 인증서류 안내 확인.
5. 픽 또는 무료 과외쌤 계정으로 같은 조건 → 스레드 없음, 메뉴 회색.
6. 학생이 같은 날 과목을 다시 바꿈 → 추가 발송 없음.
7. 캡처(개인정보 가림)를 Cursor 보고에 붙인다.

## 1-7. 금지

0단계 C-6 전부 + 다음.
- 과외쌤 연령대 7칸 값·찾기 필터 동작을 바꾸지 않는다.
- 나이대를 카드·공개 화면·검색 결과에 넣지 않는다.
- `university_note`·대학원 문구를 파싱하지 않는다.
- 공부방 매칭은 이 단계에서 하지 않는다.
- **커밋·PR까지, 머지 금지, 보고.** 조사 결과가 이 문서와 다르면 멈추고 보고.
