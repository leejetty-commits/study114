# 273 픽·프라임 구매 때 필수 항목 검사 — 과외쌤·공부방 같은 규칙

> **상태: 확정 (2026-10-20 종현 결정 t2237·t2238·t2239, 2026-10-21 기준 커밋 갱신).** 이 문서에 적힌 것만 한다. 아래 「허용 파일」(7장) 밖은 손대지 않는다.
> 범위 밖 수정이 필요하면 고치지 말고 멈추고 보고한다(8장). **11장 결정(종현 확정 2026-10-21)은 바꾸지 않는다.**

- 작업 번호: 273
- 날짜: 2026-10-21 (개정. 처음 2026-10-20)
- 브랜치 이름: `cursor/273-pickprime-purchase-gate`
- 박스 사본: `/workspace/study114/handoffs/273-cursor-directive-tutor-pickprime-gate.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/273-cursor-directive-tutor-pickprime-gate.md`
- 기준 코드: **`e6f8f08a`** (272 묶음 병합·배포 #516, 272-1·272-2 포함). 이 문서의 파일:줄은 모두 `e6f8f08a` 기준이다.
- 모델: **grok-4.7 high만** 쓴다. fast 모델 금지.
- 요약: 픽·프라임은 **그 등급 필수 항목을 채워야 구매**할 수 있고, 카드는 **구매가 끝나면 바로 노출**된다. 과외쌤은 지금 구매 때 아무 검사가 없고, 공부방은 화면에서만 「상세 전체 완료(`expanded_complete`)」로 막고, 서버는 둘 다 막지 않는다. 필수 항목 정의를 한 곳에 두고, 구매 화면·서버·등록점검·상세등록 표시가 모두 그것을 쓰게 한다.

> 쉬운 말 안내: 픽·프라임 카드는 사면 바로 걸립니다. 그래서 카드에 들어갈 칸을 먼저 채워야 살 수 있게 합니다. 어느 칸이 필요한지는 상세등록 화면에 별표와 한 줄 안내로 미리 알려 줍니다. 가입할 때는 비워도 저장됩니다.

---

## 0. 결정 (종현 확정, 바꾸지 말 것)

| # | 항목 | 확정값 |
|---|---|---|
| 1 | 막는 시점 | **구매(주문 만들기) 때만.** 노출은 구매 완료를 따른다(t2238). 구매가 끝나면 **바로 노출**. 항목으로 노출을 막는 장치는 만들지 않는다. |
| 2 | 과외쌤 필수 항목 | **정본 73 §3-3** (`docs/internal/73-tutor-basic-card-lock.md:194-197`). **픽** = ① 학교·학과 **또는** 경력, ② 주교재, ③ 강의스타일 1개 이상. **프라임** = 픽 + ④ 상세 소개(`intro_long`), ⑤ 특징 2, ⑥ 특징 3. **강의스타일은 최대 4개까지 고른다**(5번째 선택 막음, 서버도 4개 제한). 픽·프라임 모두 **1개 이상이면 충족**. 카드에는 3개까지 보이고 나머지는 「외 N」(11장 Q6). |
| 3 | 공부방 필수 항목 | 구매 기준을 `expanded_complete`에서 **픽·프라임 필수 항목만**으로 바꾼다. 목록은 지금 등록점검 정의 그대로: 픽 = `cover`(홍보사진)·`intro_short`(한 줄 소개)·`fee`(월 평균 수업료)·`teaching_style`(수업 스타일), 프라임 = 픽 + `intro_long`·`teaching_style_note`·`lessons_per_week`·`feature_1`. 출처 `preview/home-ui/src/study-room-reg/registration-check-copy.js:82` `RC_PICK_FIELD_IDS`, `:85-94` `RC_PRIME_FIELD_IDS`. |
| 4 | 한 곳 정의 | 등급별 필수 항목은 **화면 1곳 + 서버 1곳**에만 정의한다. 등록점검(`TRC_PICK/PRIME_FIELD_IDS`·`RC_PICK/PRIME_FIELD_IDS`)·`/plans` 구매 화면·상세등록 표시·서버 주문 검사가 모두 이것을 쓰고, 두 정의가 같은지 검증 스크립트로 확인한다. |
| 5 | 서버 | `ProviderCheckoutService::createOrder`(`src/Paid/ProviderCheckoutService.php:51`)에서 과외쌤·공부방 모두 검사한다. |
| 6 | 상세등록 표시 (t2239) | 공부방·과외쌤 상세등록과 마이페이지 안 같은 폼에서 **픽·프라임 필수 칸마다 필수 표시** + 폼 위 **안내 한 줄**: 「* 표시는 픽·프라임 카드 구매 때 필요한 항목이에요」. **표시는 저장을 막지 않는다.** 상세 소개는 가입 때 선택 그대로(272-1). |
| 7 | 안내 문구 | 구매가 막힐 때: 「픽(프라임) 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다」(공부방 `plans/screens.js:504` 문구) + 빠진 항목 이름. |
| 8 | 결제 테스트 | 274로 결제 완료(`completeOrder`)는 **기본 막힘**(`src/Paid/PaidCheckoutGate.php:18`, `ProviderCheckoutService.php:349-350`). 구매 검사 중 결제 완료·노출까지 보는 테스트는 **`STUDY114_PAID_MOCK_COMPLETE=1`을 켠 로컬·CI에서만** 한다(5장). 운영·스테이징 설정에 이 값을 넣지 않는다. |

### 0-1. 현황 (`e6f8f08a` 조사)

**구매 검사**

| 항목 | 공부방 | 과외쌤 |
|---|---|---|
| 구매 화면 | `plans/screens.js:500-507` (`getEligibility` `:468`), `plans/order-blocks.js:92-99`: `expanded_complete`가 아니면 막음 (항목 기준 아님) | `plans/screens.js:523` 주석 「과외쌤 구매 차단은 노출축(시·주력과목)만…」 → **막지 않음** |
| 서버 주문 | `ProviderCheckoutService.php:51` `createOrder`: **검사 없음** | **검사 없음** |
| 결제 완료 | `:347` `completeOrder` → `:349` `PaidCheckoutGate::mockCompleteAllowed()` 아니면 거절(274) | 같음 |
| 노출 | `src/Search/SearchService.php`: 유효한 구매만 봄 → 정책과 맞음, 고치지 않음 | 같음 |
| 등록점검 정의 | `RC_PICK_FIELD_IDS` `:82`, `RC_PRIME_FIELD_IDS` `:85-94`, 합친 목록 `RC_REQUIRED_FIELD_IDS` `:97` (현황판·폼 필수 마크) | `tutor-reg/registration-check-copy.js:76` `TRC_PICK_FIELD_IDS = ['feature_1','student_target']`, `:79` `TRC_PRIME_FIELD_IDS = ['intro_long','feature_2','feature_3']` → **정본 73 §3-3과 다름**. 쓰는 곳 `registration-check-model.js:14-15`, 픽·프라임 남은 항목 문구 `registration-check-copy.js:136` `TRC_PROMO_MISSING_DEFS`, `registration-check-model.js:119` |

**272에서 바뀐 구조 (273이 따라야 할 것)**

- 과외쌤 상세 칸의 **공용 정의**: `preview/shared/tutor-detail-fields.js:110` `TUTOR_DETAIL_FIELDS`. id·라벨·탭(`detail`/`detail2`)·`focus`가 여기 있다. 등록점검 현황표와 상세 화면이 이것을 쓴다. 273 과외쌤 필수 항목의 **라벨·focus는 이 정의에서 가져온다**(값을 다시 적지 않는다). 쓰는 id: `university_name` `:200`, `career_year_band` `:230`, `main_material_note` `:240`, `feature_2` `:260`, `feature_3` `:270`, `teaching_style_badges` `:290`, `intro_long` `:300`.
- 과외쌤 마이페이지는 상세정보1·2 두 탭: `home-ui/src/tutor-reg/embedded-panels.js:104` `detailFormsHtml(tutor, section)`, `:109` 상세2 = `renderContactFormHtml`, `:114` 상세1 = `renderLessonFormHtml`. 등록점검 「입력하러 가기」는 칸이 있는 탭(`detail`/`detail2`)으로 간다.
- **특징 3 칸은 272-2에서 이미 들어갔다** (`tutor-ui/src/screens/step-contact.js:83`). 273에서 다시 넣지 않는다.

**상세등록 필수 표시 현황**

| 모드 | 파일:줄 | 지금 표시 | 필수 목록과 비교 | 안내 한 줄 |
|---|---|---|---|---|
| 공부방 상세 (수업) | `study-room-ui/src/screens/step-lesson.js:34-37` `starLabel` → `form-label--required` + 「필수」 글자 | `:201` 수업운영방식, `:214` 타임별 원생수, `:230` 주 회수, `:238` 월 평균 수업료, `:259` 수업 스타일, `:263` 수업 스타일 추가설명, `:284` 한 줄 소개, `:288` 소개와 자랑, `:293` 홍보사진 | 목록 8개 중 7개 표시. **수업운영방식·타임별 원생수는 목록에 없는데 표시(과표시)**. 기본 필수와 같은 클래스라 구분 안 됨 | **없음** (`:184` 주석뿐) |
| 공부방 상세 (시설·경력) | `study-room-ui/src/screens/step-facility.js:26-29` `starLabel` | `:119` 경력특징 1 | 목록과 맞음 (`feature_1`) | **없음** |
| 공부방 마이페이지 | `home-ui/src/study-room-reg/embedded-panels.js:23-24, 377, 401` (위 폼 그대로) | 위와 같음 | 위와 같음 | **없음** |
| 과외쌤 상세 1 | `tutor-ui/src/screens/step-lesson.js:135` | 산정방식만 `form-label--required`(상세 완료 조건) | 픽·프라임 항목은 상세 1에 없음 | 해당 없음 |
| 과외쌤 상세 2 | `tutor-ui/src/screens/step-contact.js:59`(대학/대학원), `:74`(경력구간), `:78`(주교재), `:81`(특징 2), `:83`(특징 3), `:92`(강의스타일), `:97`(상세 소개) | 표시 **없음** | 표시 **0개** | **없음** |
| 과외쌤 마이페이지 | `home-ui/src/tutor-reg/embedded-panels.js:109` (상세2 폼 그대로) | 위와 같음 | 위와 같음 | **없음** |

- 강의스타일 개수 제한: `step-contact.js:49`(체크박스)·`form-collect.js:141`(모으기)·서버 `src/Tutor/TutorRegisterService.php:743-775`(저장) 모두 **개수 제한 없음**.
- 카드 강의스타일 표시: `preview/home-ui/src/exposure-format.js:131` `formatTeachingStyleBadges(badges, max)`는 앞 `max`개만 잘라 보이고 **「외 N」을 붙이지 않는다**. 부르는 곳: `exposure-render.js:473`·`:491`(과외쌤 픽·프라임 카드, `featureMax === 1 ? 1 : 3`), `:949`·`:1032`(2개만 보이는 카드).

---

## 1. 시작 조건

1. `origin/main`에 `e6f8f08a`(272 병합)가 들어 있는지 확인한다. 없으면 시작하지 않는다.
2. 최신 `origin/main`에서 `cursor/273-pickprime-purchase-gate`를 만든다. 같은 이름이 있으면 멈추고 보고한다.
3. `git status` 깨끗. **push까지만. `main` 병합·배포·force-push 금지. 실결제 금지.**

---

## 2. 작업 환경

- Cursor PC에는 PHP·로컬 API가 없다. Cursor는 **코드 + `npm run build` + vite-node 검증 스크립트 + PHP 검증 스크립트 작성**까지 하고 push한다. PHP는 고친 함수 원문을 보고서에 붙인다.
- 화면·과정 확인(5-1·5-2)은 **우동공과2가 로컬 테스트 서버에서 두 번** 한다. 결제 완료까지 보는 단계만 로컬 서버를 `STUDY114_PAID_MOCK_COMPLETE=1`로 띄워서 한다(가짜 결제, 실결제 아님).

---

## 3. 수정

### 3-1. 한 곳 정의

- **화면**: 새 파일 `preview/shared/pickprime-requirements.js`
  - `TUTOR_PICK_IDS`, `TUTOR_PRIME_IDS`, `ROOM_PICK_IDS`, `ROOM_PRIME_IDS`
  - 판정 함수 `tutorTierMissing(tutor, 'pick'|'prime')`, `roomTierMissing(room, 'pick'|'prime')` → 빠진 항목 `{id, label, focus, tab}` 목록
  - 과외쌤 라벨·`focus`·`tab`은 `shared/tutor-detail-fields.js` `TUTOR_DETAIL_FIELDS`에서 가져온다. 묶음 항목(`school_or_career`)의 라벨만 이 파일에 둔다.
- 과외쌤 항목 (정본 73 §3-3):

| id | 라벨 | 충족 조건 | 등급 | 공용 정의 id |
|---|---|---|---|---|
| `school_or_career` | 학교·학과 또는 경력 | `university_name` 있음 **또는** `career_year_band` 있음 | 픽·프라임 | `university_name`, `career_year_band` |
| `main_material_note` | 주교재 | 빈 값 아님 | 픽·프라임 | 같음 |
| `teaching_style_badges` | 강의스타일 | 1개 이상 | 픽·프라임 | 같음 |
| `intro_long` | 상세 소개 | 빈 값 아님 | 프라임 | 같음 |
| `feature_2` | 특징 2 | 빈 값 아님 | 프라임 | 같음 |
| `feature_3` | 특징 3 | 빈 값 아님 | 프라임 | 같음 |

- 「학교·학과」는 `university_name` 하나로 센다(11장 Q1).
- `tutor-reg/registration-check-copy.js:76·79` `TRC_PICK_FIELD_IDS`·`TRC_PRIME_FIELD_IDS`와 `study-room-reg/registration-check-copy.js:82·85` `RC_PICK_FIELD_IDS`·`RC_PRIME_FIELD_IDS`는 **새 공용 파일을 가져다 쓰게** 바꾼다(값을 두 번 적지 않는다). `RC_REQUIRED_FIELD_IDS`(`:97`)도 그대로 합집합으로 둔다.
- `tutor-reg/registration-check-model.js`(`:14-15`, `:119` 부근) ok 맵·남은 항목 목록이 새 id를 계산한다. `TRC_PROMO_MISSING_DEFS`(`registration-check-copy.js:136`)는 새 목록에 맞춰 줄을 바꾸고, 「입력하러 가기」 링크는 공용 정의의 `tab`·`focus`로 간다(`school_or_career`는 `university_name` 칸).
- 등록점검 「전체 프로필 현황」 표(272-2)는 그대로 둔다. 바뀌는 것은 위쪽 픽·프라임 남은 항목 목록과 배지 계산뿐이다.
- **서버**: 새 파일 `src/Paid/TierRequirement.php`. 같은 id·같은 판정을 PHP로 둔다. `missingFor(PDO, 'tutor'|'study_room', int $id, 'pick'|'prime'): list<array{id,label}>`.
  - 공부방 `cover`는 대표 홍보사진 존재, `teaching_style`은 수업 스타일 1개 이상. 기존 `StudyRoomRegisterService`(`:1452-1460` 완성도 계산 부근) 판정과 같게 한다.

### 3-2. 구매 화면

- `plans/screens.js` `getEligibility`(`:468`)
  - 과외쌤(`:523` 주석 자리): `pick`/`prime`이면 `tutorTierMissing`. 빠진 게 있으면 `canBuy=false`, 0장 7번 문구 + 빠진 항목 이름. `:523` 주석은 지운다.
  - 공부방(`:500-507`): `expanded_complete` 검사를 `roomTierMissing`으로 **바꾼다.** 홍보지역 검사(`:508-512`)는 그대로.
  - 과외쌤 판정에 쓸 값(`university_name`·`career_year_band`·`main_material_note`·`teaching_style_badges`·`intro_long`·`feature_2`·`feature_3`)이 `getTutor`가 주는 객체에 없으면, 허용 파일 안에서 채우는 방법을 찾고 안 되면 멈추고 보고.
- `plans/order-blocks.js:92-99`도 같은 판정으로 바꾸고, 과외쌤도 같은 모양으로 막는다.
- 막힘 안내 옆 「등록점검」 이동 버튼: 배지 규칙(`#729FD9`/`#0B2545`, 높이 30, 14px/600, radius 6). 공부방 `…/study-rooms/{id}/publish`, 과외쌤 `…/tutors/{id}/publish`.

### 3-3. 서버 주문 검사

- `ProviderCheckoutService::createOrder`(`:51`)에서 상품이 `pick`/`prime`(최초·연장 모두)이면 `TierRequirement::missingFor`로 검사한다. 빠졌으면 주문을 만들지 않는다.
  - 응답: 기존 오류 형식에 맞춰 `error: 'tier_fields_missing'`, `missing: [라벨…]`, `message`: 0장 7번 문구. 상태 코드는 기존 검증 실패와 같게.
- 결제 완료(`completeOrder` `:347`)·노출 처리 경로에는 검사를 넣지 않는다(t2238). 274 결제 막힘(`:349-350`)은 그대로.
- 관리자 지급·무료 지급 등 `createOrder`를 거치지 않는 경로가 있으면 **고치지 말고 목록만 보고**한다.
- `preview/home-ui/src/paid-api.js`(또는 주문 호출부)가 `tier_fields_missing`을 받으면 같은 안내를 보인다.

### 3-4. 상세등록 필수 표시 + 안내 한 줄 (t2239)

- **표시 모양 하나로 통일**: 픽·프라임 필수 칸 라벨 옆에 `*`. 기본(가입) 필수 표시 `form-label--required`와 **다른 클래스**(예: `form-label--tier`)를 쓴다. 두 종류가 화면에서 구분돼야 한다.
- **안내 한 줄**: 표시가 있는 폼 맨 위에 한 번 「* 표시는 픽·프라임 카드 구매 때 필요한 항목이에요」.
- **공부방**
  - `step-lesson.js:34-37`·`step-facility.js:26-29`의 `starLabel`을 새 표시로 바꾼다.
  - 표시 대상은 3-1 공부방 목록 8개만. 수업운영방식(`:201`)·타임별 원생수(`:214`)는 표시를 뺀다(11장 Q3). 이 둘이 다른 이유(기본 필수 등)로 필수면 그 표시를 유지하고 보고.
- **과외쌤**
  - `step-contact.js`에서 3-1 과외쌤 목록 칸에 표시: 대학/대학원(`:59`)·경력구간(`:74`)(「또는」 한 묶음, 칸 옆에 「둘 중 하나」), 주교재(`:78`), 강의스타일(`:92`), 상세 소개(`:97`), 특징 2(`:81`), 특징 3(`:83`). 상세 1(`step-lesson.js`)에는 표시할 칸이 없다.
  - 강의스타일 **최대 4개**: 5번째를 고르면 선택을 막고 짧은 안내(「강의스타일은 4개까지 고를 수 있어요」). 이미 5개 이상 저장된 계정은 화면에서 지우지 않고 그대로 저장되며, 새로 더 고르는 것만 막는다(11장 Q5). 칸 안내에 「최대 4개」.

### 3-4-1. 강의스타일 서버 제한·카드 「외 N」 (11장 Q5·Q6)

- **서버**: `TutorRegisterService.php:743-775` 강의스타일 저장에서 보낸 목록이 4개를 넘으면 거절한다(기존 검증 실패 형식, 메시지 「강의스타일은 4개까지 고를 수 있어요」). **단, 보낸 목록이 지금 DB에 저장된 목록과 같으면(순서 무관) 개수와 관계없이 그대로 저장한다**(5개 이상 기존 계정 보존). 상세2 저장 때 강의스타일을 건드리지 않은 5개 이상 계정이 막히면 실패.
- **카드**: `exposure-format.js:131` `formatTeachingStyleBadges`가 `max`보다 많으면 끝에 「 외 N」(N = 남은 개수, 알 수 없는 코드는 세지 않음)을 붙인다. 예: 4개·max 3 → 「열정 · 꼼꼼 · 친절 외 1」.
  - `exposure-render.js:473`·`:491`(픽·프라임)은 3개까지(지금 `featureMax === 1 ? 1 : 3` 그대로) + 「외 N」.
  - `:949`·`:1032`는 **2개까지 그대로** 두고 「외 N」만 같은 모양으로 붙는다(함수 하나라 자동).
  - 카드 칸이 「외 N」으로 줄바꿈·잘림이 생기면 멈추고 보고(1280·390 실측).
- **마이페이지**: 공부방(`study-room-reg/embedded-panels.js:377, 401`)·과외쌤(`tutor-reg/embedded-panels.js:109` 상세정보2)이 상세등록 폼을 그대로 쓰므로 표시·안내가 같이 나와야 한다. 마이페이지 레이아웃이 깨지면 실패.
- **저장은 막지 않는다.** 표시 칸이 비어도 상세등록 「다음」·마이페이지 「저장」은 그대로 된다.

### 3-5. 하지 않는 것

- 노출 로직(`SearchService.php`, 홈·찾기 카드 쿼리) 변경 금지.
- 결제 PG·가격·재고·지역 축·DB 스키마 변경 금지. 274 결제 막힘(`PaidCheckoutGate`) 변경 금지.
- 기본(가입) 필수 항목·표시를 늘리거나 줄이지 않는다.
- 과외쌤 `intro_short`를 다시 넣지 않는다. 카드는 강의스타일 「외 N」(3-4-1) 말고 바꾸지 않는다. 특징 3 칸은 272-2에서 끝났으니 다시 만들지 않는다.
- 272-2 등록점검 「전체 프로필 현황」 표의 줄·순서를 바꾸지 않는다.

---

## 4. 기대 결과

- 과외쌤·공부방 모두 픽(프라임) 필수 항목이 비면 `/plans` 구매가 막히고, 빠진 항목과 「등록점검에서 남은 항목을 채우면 구매가 열립니다」가 보인다. 다 채우면 열린다. 공부방은 상세 전체 완료를 요구하지 않는다.
- API로 바로 주문해도 서버가 막는다. 연장도 같다.
- 구매 완료 뒤 카드는 바로 노출된다(변화 없음).
- 상세등록·마이페이지 상세 폼에 픽·프라임 필수 칸마다 `*`, 폼 위에 안내 한 줄. 비워도 저장된다.

---

## 5. 검수 (하나라도 실패면 멈추고 보고)

### 5-1. 디자인 (우동공과2 로컬, Cursor는 가능한 범위)

- 1280·390, 전/후 나란히 비교: `/plans` 과외쌤·공부방 픽·프라임(막힘/열림), 공부방 상세 수업·시설, 과외쌤 상세 2, 마이페이지 공부방 상세정보1·2·과외쌤 상세정보2.
- 실측: `*` 크기·색이 공부방·과외쌤에서 같음, 기본 필수 표시와 구분됨, 안내 한 줄 글자 크기, 버튼은 배지 규칙(「등록 완료」·결제 버튼만 `#266BC4`), 390 가로 넘침 0, 같은 종류 칸 간격 차이 0.
- 표시 칸 수가 3-1 목록과 정확히 같다(공부방 8, 과외쌤 6 묶음: 대학·경력은 한 묶음).

### 5-2. 과정 두 번 (우동공과2 로컬 테스트 서버, 새 계정, 실결제 없음)

회차마다 과외쌤 1명 + 공부방 1명 새 계정으로 따로:
1. 기본등록만 → 상세등록 화면에 `*`·안내 한 줄 보임 → 비운 채 「다음」·저장 **성공**.
2. `/plans` 픽 → **막힘** + 빠진 항목(과외쌤: 학교·학과 또는 경력, 주교재, 강의스타일) + 안내 + 「등록점검」 이동.
3. 픽 항목만 채움(마이페이지 상세 탭에서) → 픽 **열림** / 프라임 **막힘**(상세 소개·특징 2·3 표시).
4. 프라임 항목까지 채움 → 프라임 **열림**.
5. 공부방: `expanded_complete`가 아니어도 픽 항목만 채우면 픽 **열림**(기준 변경 확인).
6. 항목 빈 계정으로 주문 API 직접 호출(새 구매·연장 둘 다) → **서버 거절**(상태 코드·`error`·`missing` 기록), DB에 주문 행 없음.
7. **결제 완료·노출** (로컬 서버를 `STUDY114_PAID_MOCK_COMPLETE=1`로 띄운 경우만): 항목을 채운 계정으로 주문 → 가짜 결제 완료 → 카드가 바로 노출. 이 값 없이 띄운 서버에서는 결제 완료가 274 문구로 거절되는 것도 확인.
8. 강의스타일: 5번째 선택 막힘·안내, 4개 저장·다시 열기, API로 5개 보내면 서버 거절, DB에 5개 미리 넣은 계정이 강의스타일을 안 건드리고 상세2 저장 성공(5개 그대로), 픽·프라임 카드에 「앞 3개 외 N」, 2개 카드에 「앞 2개 외 N」(1280·390).
9. 272 회귀: 상세 소개·연락 가능 시간을 비운 저장 성공, 상세정보1·2 탭 저장이 다른 탭 값을 지우지 않음, 등록점검 「수정」·「입력하러 가기」가 칸을 찾음.
- 회차·계정마다 표로 보고(URL·해시, 뒤로 가기, API 요청/응답, DB 값).

### 5-3. CI·빌드 (Cursor 필수)

- `home-ui`·`tutor-ui`·`study-room-ui` `npm run build` 통과.
- 기존 통과 유지(원래 실패는 `e6f8f08a` 비교 목록): `verify:paid-pr-a`, `verify:paid-renewal`, `verify:paid-catalog`, `verify:paid-pricing`, `verify:paid-complete-gate`, `verify:tutor-registration-check-frame`, `verify:tutor-detail-fields-ssot`, `verify:tutor-basic-required`, `verify:tutor-mypage-frame-ia`, `verify:tutor-lesson-optional-step`, `verify:study-room-registration-check-frame`.
- 새 `scripts/verify-pickprime-purchase-gate.mjs`(vite-node, 결제 완료 불필요):
  - 공용 정의 ↔ PHP `TierRequirement.php` 항목 id 같음
  - `TRC_*`·`RC_*`가 공용 정의를 가져다 씀(값 중복 0), 과외쌤 라벨이 `TUTOR_DETAIL_FIELDS`와 같음
  - `getEligibility` 과외쌤에 `:523` 주석 없음, 공부방 판정에 `expanded_complete` 없음
  - 빈 항목이면 `canBuy=false` + 안내 문구
  - 상세등록 렌더 HTML에서 표시 칸 = 목록, 안내 한 줄 있음, 저장 막는 검사 없음, 강의스타일 5번째 선택 막힘(4개는 됨)
  - `formatTeachingStyleBadges`: 0개 「—」, 3개·max 3 「외」 없음, 4개·max 3 「… 외 1」, 5개·max 2 「… 외 3」, 프라임 판정은 1개면 충족
- 새 `scripts/verify-pickprime-purchase-gate.php`: 판정 함수 빈 값/채운 값, `createOrder` 거절 경로, 강의스타일 5개 저장 거절·기존 5개와 같은 목록 저장 허용. 결제 완료까지 보는 부분은 **`STUDY114_PAID_MOCK_COMPLETE=1`일 때만** 실행하고, 값이 없으면 「건너뜀」을 출력한다(실패로 치지 않음). CI는 이 값을 이미 켜는 워크플로(`.github/workflows/paid-catalog-pr-a.yml:42`, `paid-ticket-pr-b.yml:41`) 안에서만 돌린다. 운영 `.htaccess`·배포 설정에 이 값을 넣지 않는다(`verify:paid-complete-gate`가 확인).

---

## 6. 금지 범위

1. 허용 파일(7장) 밖 수정 금지.
2. 노출 로직·결제 PG·가격·재고·지역 축·DB 스키마·274 결제 막힘 변경 금지.
3. 기본 필수 항목·표시 변경 금지(공부방 과표시 2칸 정리만 예외, 3-4).
4. 272-1의 「상세 소개·연락 가능 시간 가입 때 선택」, 272-2의 상세정보1·2 탭·현황표 되돌리기 금지.
5. `git add -A` 금지, force-push 금지, `main` 병합·배포 금지, 실결제 금지.

---

## 7. 허용 파일

| # | 파일 | 바뀔 것 |
|---|---|---|
| 1 | `preview/shared/pickprime-requirements.js` (새 파일) | 등급별 항목·판정 한 곳 |
| 2 | `preview/home-ui/src/tutor-reg/registration-check-copy.js` | `TRC_PICK/PRIME_FIELD_IDS`·`TRC_PROMO_MISSING_DEFS`를 공용 정의로 |
| 3 | `preview/home-ui/src/tutor-reg/registration-check-model.js` | 새 id ok 계산 |
| 4 | `preview/home-ui/src/study-room-reg/registration-check-copy.js` | `RC_PICK/PRIME_FIELD_IDS`(·`RC_REQUIRED_FIELD_IDS`)를 공용 정의로 |
| 5 | `preview/home-ui/src/study-room-reg/registration-check-model.js` | 필요할 때만 (공용 판정 연결) |
| 6 | `preview/home-ui/src/plans/screens.js` | `getEligibility` 과외쌤·공부방 판정 |
| 7 | `preview/home-ui/src/plans/order-blocks.js` | 주문 요약 판정 |
| 8 | `preview/home-ui/src/paid-api.js` | `tier_fields_missing` 안내 (필요할 때만) |
| 9 | `preview/tutor-ui/src/screens/step-contact.js` | 표시·안내 한 줄, 강의스타일 최대 4개 |
| 10 | `preview/tutor-ui/src/form-collect.js` | 강의스타일 4개 제한 (필요할 때만) |
| 10-1 | `preview/home-ui/src/exposure-format.js` | `formatTeachingStyleBadges` 「외 N」만 (`:131`) |
| 10-2 | `preview/home-ui/src/exposure-render.js` | 필요할 때만: `:473`·`:491` 최대 개수 인자. `:949`·`:1032` 개수는 그대로 |
| 10-3 | `src/Tutor/TutorRegisterService.php` | 강의스타일 저장 4개 제한·기존 목록 보존 (`:743-775`만) |
| 11 | `preview/study-room-ui/src/screens/step-lesson.js` | `starLabel` → 새 표시, 과표시 2칸 정리, 안내 한 줄 |
| 12 | `preview/study-room-ui/src/screens/step-facility.js` | `starLabel` → 새 표시, 안내 한 줄 |
| 13 | `preview/shared/register-form-primitives.css` | 새 표시 클래스 1개 (공부방·과외쌤 공용). 다른 칸 모양 변경 금지 |
| 14 | `preview/home-ui/src/styles/mypage-ops.css` | 마이페이지 안 표시·안내 줄 정렬 (필요할 때만, `.mp-room-embed` 아래만) |
| 15 | `src/Paid/TierRequirement.php` (새 파일) | 서버 판정 |
| 16 | `src/Paid/ProviderCheckoutService.php` | `createOrder`에서 검사 호출 (`completeOrder`·274 게이트는 손대지 않음) |
| 17 | `src/Paid/PaidApi.php` | 오류 응답 형식 (필요할 때만) |
| 18 | `scripts/verify-pickprime-purchase-gate.mjs`, `.php` (새 파일) | 5-3 |
| 19 | `package.json` | 검증 스크립트 1줄 |
| 20 | `scripts/verify-tutor-registration-check-frame.mjs`, `scripts/verify-study-room-registration-check-frame.mjs`, `scripts/verify-paid-renewal.mjs`, `scripts/verify-tutor-detail-fields-ssot.mjs` | 새 구조에 맞출 때만 (검사를 약하게 하지 않는다) |
| 21 | `docs/ssot/20-study-room-registration-management.md` | `:211`·`:243` 「Pick/Prime 구매 = `expanded_complete`」를 「픽·프라임 필수 항목」으로 (문서만) |
| 22 | `docs/internal/73-tutor-basic-card-lock.md` | §3-3(`:194-197`)에 「반영됨(273)」 (문서만) |

- 빠진 것(272-2에서 끝남): `step-lesson.js`(과외쌤) 표시 없음, 특징 3 칸 추가 없음.
- 그 밖의 파일이 필요하면 멈추고 보고한다(8장). 특히 `tutor-detail-fields.js`를 고쳐야 하면 멈추고 보고.

---

## 8. 멈추고 보고할 때

1. 허용 파일 밖을 고쳐야 할 때.
2. 노출 로직이나 274 결제 막힘을 건드려야 할 것 같을 때.
3. `createOrder`를 거치지 않는 구매·지급 경로가 있거나, 서버 검사로 기존 정상 구매가 막힐 것 같을 때.
4. 화면 정의와 서버 정의를 하나로 맞출 수 없을 때.
5. 필수 표시 때문에 상세등록·마이페이지 저장이 막히거나, 기본 필수 표시가 바뀔 때.
6. 공부방 판정이 기존 `StudyRoomRegisterService` 판정(사진·수업 스타일)과 다를 때.
7. `/plans` 과외쌤 판정에 필요한 값이 화면 쪽 객체에 없을 때(3-2).
8. 디자인(5-1)이 나빠지거나 CI(5-3)가 실패할 때.

---

## 9. 작업 순서와 커밋 나누기

1. 시작 조건(1장) → 브랜치.
2. 커밋 (예시):
   - `273-1 feat(shared): 픽·프라임 필수 항목을 한 곳에 정의한다` (1·2·3·4·5번)
   - `273-2 feat(paid): 서버 주문 때 픽·프라임 필수 항목을 검사한다` (15·16·17번)
   - `273-3 fix(plans): 구매 화면을 필수 항목 기준으로 막고 안내한다` (6·7·8번)
   - `273-4 feat(register): 상세등록에 픽·프라임 필수 표시와 안내 한 줄, 강의스타일 4개 제한·카드 외 N` (9-14번, 10-1~10-3)
   - `273-5 test: 픽·프라임 구매 검사 검증 스크립트` (18·19·20번)
   - `273-6 docs: 정본 20·73 구매 기준 반영` (21·22번)
3. 빌드·검증(5-3) → 파일 이름으로 add → `git push origin cursor/273-pickprime-purchase-gate` → **멈춤.**

---

## 10. 완료 보고 형식

1. 커밋: 브랜치, 해시 전부(순서대로), 시작 기준 `origin/main` 해시(`e6f8f08a` 포함 확인).
2. 바뀐 파일:줄. PHP는 고친 함수 원문.
3. 판단 사항: 11장 결정을 어디에 어떻게 반영했는지(파일:줄), `createOrder` 밖 경로 목록, 강의스타일 기존 목록 비교 방식.
4. 표시 감사 표: 고친 뒤 모드별 표시 칸(파일:줄)이 0-1 표와 3-1 목록에 맞는지.
5. CI 결과(5-3) 출력 요약. `STUDY114_PAID_MOCK_COMPLETE` 없이 「건너뜀」이 나온 항목 표시.
6. 범위 확인 문장: 「7장 밖 파일, 노출 로직(카드 강의스타일 「외 N」 말고), 결제·가격·재고·지역 축, DB 스키마, 274 결제 막힘, 기본 필수 항목은 건드리지 않았습니다. 실결제는 하지 않았습니다.」
7. 상태: push까지 했고 병합·배포는 하지 않았다. 5-1·5-2는 우동공과2 로컬 테스트 서버 확인 대기.

---

## 11. 결정 (종현 확정 2026-10-21)

| # | 질문 | 확정 |
|---|---|---|
| Q1 | 「학교·학과」 판정 | 대학명(`university_name`)만 있으면 충족 |
| Q2 | 「산정방식」을 픽 필수에 넣을지 | 넣지 않음 |
| Q3 | 공부방 수업운영방식·타임별 원생수 「필수」 표시 | 뺌 (기본 필수면 유지하고 보고) |
| Q4 | 연장 구매 검사 | 최초 구매와 같은 검사 |
| Q5 | 강의스타일 개수 | **최대 4개**(5번째 선택 막음, 서버도 4개 제한). 이미 5개 이상 저장된 계정은 그대로 두고 새로 고를 때만 제한 (3-4, 3-4-1) |
| Q6 | 프라임 강의스타일 조건·카드 표시 | 1개 이상이면 충족. 픽·프라임 카드(`exposure-render.js:473`·`:491`)는 3개까지 보이고 나머지 「외 N」. 2개만 보이는 카드(`:949`·`:1032`)는 개수 그대로, 「외 N」 모양은 같게 (3-4-1) |
| Q7 | 공부방 프라임 목록 | 지금 등록점검 정의 그대로 |
| Q8 | `createOrder` 밖 지급 경로 | 막지 않고 목록만 보고 |
| Q9 | `prime_eligible` 표시(`StudyRoomHubRepository.php:131`, `SearchService.php:778, 1028`) | 이번엔 바꾸지 않음(노출 쪽, 범위 밖). 보고만, 따로 후속 작업 |
