# 273 픽·프라임 구매 때 필수 항목 검사 — 과외쌤·공부방 같은 규칙

> **상태: 확정 (2026-10-20 종현 결정 t2237·t2238·t2239 반영).** 이 문서에 적힌 것만 한다. 아래 「허용 파일」 밖은 손대지 않는다.
> **272-1이 `main`에 병합된 뒤에 시작한다**(1장). 범위 밖 수정이 필요하면 고치지 말고 멈추고 보고한다(8장).

- 작업 번호: 273
- 날짜: 2026-10-20
- 브랜치 이름: `cursor/273-pickprime-purchase-gate`
- 박스 사본: `/workspace/study114/handoffs/273-cursor-directive-tutor-pickprime-gate.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/273-cursor-directive-tutor-pickprime-gate.md`
- 기준 코드: 272-1 병합 뒤 최신 `origin/main` (조사는 `3e4691f7`)
- 모델: **grok-4.7 high만** 쓴다. fast 모델 금지.
- 요약: 픽·프라임은 **그 등급 필수 항목을 채워야 구매**할 수 있고, 카드는 **구매가 끝나면 바로 노출**된다. 과외쌤은 지금 구매 때 아무 검사가 없고, 공부방은 화면에서만 「상세 전체 완료」로 막고, 서버는 둘 다 막지 않는다. 필수 항목 정의를 한 곳에 두고, 구매 화면·서버·등록점검·상세등록 표시가 모두 그것을 쓰게 한다.

> 쉬운 말 안내: 픽·프라임 카드는 사면 바로 걸립니다. 그래서 카드에 들어갈 칸을 먼저 채워야 살 수 있게 합니다. 어느 칸이 필요한지는 상세등록 화면에 별표와 한 줄 안내로 미리 알려 줍니다. 가입할 때는 비워도 저장됩니다.

---

## 0. 결정 (종현 확정, 바꾸지 말 것)

| # | 항목 | 확정값 |
|---|---|---|
| 1 | 막는 시점 | **구매(주문 만들기) 때만.** 노출은 구매 완료를 따른다(t2238). 항목으로 노출을 막는 장치는 만들지 않는다. |
| 2 | 과외쌤 필수 항목 | **정본 73 §3-3** (`docs/internal/73-tutor-basic-card-lock.md` 3-3절). 픽 = ① 학교·학과 **또는** 경력, ② 주교재, ③ 강의스타일 1개 이상. 프라임 = 픽 + ④ 상세소개(`intro_long`), ⑤ 특징 2, ⑥ 특징 3 (강의스타일은 최대 3개까지 받는다, 1개 이상이면 충족) |
| 3 | 공부방 필수 항목 | 구매 기준을 `expanded_complete`에서 **픽·프라임 필수 항목만**으로 바꾼다. 목록은 기록된 정의를 쓴다: 픽 = `cover`(홍보사진)·`intro_short`(한 줄 소개)·`fee`(월 평균 수업료)·`teaching_style`(수업 스타일), 프라임 = 픽 + `intro_long`·`teaching_style_note`·`lessons_per_week`·`feature_1`. 출처는 `preview/home-ui/src/study-room-reg/registration-check-copy.js:82` `RC_PICK_FIELD_IDS`, `:85-94` `RC_PRIME_FIELD_IDS`, 그리고 이 목록을 정본 기준으로 적은 `docs/worklog/2026/10/2026-10-13-decisions-batch.md:30`, `docs/worklog/2026/10/2026-10-14-handoff.md:49` |
| 4 | 한 곳 정의 | 등급별 필수 항목은 **화면 1곳 + 서버 1곳**에만 정의한다. 등록점검 문구·`/plans` 구매 화면·상세등록 표시·서버 주문 검사가 모두 이것을 쓰고, 두 정의가 같은지 검증 스크립트로 확인한다. |
| 5 | 서버 | `ProviderCheckoutService::createOrder`에서 과외쌤·공부방 모두 검사한다. |
| 6 | 연장 구매 | **연장도 같은 검사**(기본값 확정). 이미 산 카드의 노출은 끄지 않는다. |
| 7 | 상세등록 표시 (t2239) | 공부방·과외쌤 상세등록, 그리고 마이페이지 안 같은 폼(272·272-1 끼워 쓰기)에서 **픽·프라임 필수 칸마다 필수 표시** + 폼 위 **안내 한 줄**: 「* 표시는 픽·프라임 카드 구매에 꼭 필요한 항목이에요」(쉬운 말, 짧게, 개발 용어 없음). **표시는 저장을 막지 않는다.** 상세소개는 가입 때 선택 그대로(272-1). |
| 8 | 안내 문구 | 구매가 막힐 때: 「픽(프라임) 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다」(공부방 `plans/screens.js:503-504` 문구) + 빠진 항목 이름. |

### 0-1. 조사 결과 (`3e4691f7`)

**구매 검사 현황**

| 항목 | 공부방 | 과외쌤 |
|---|---|---|
| 구매 화면 | `plans/screens.js:500-507`, `plans/order-blocks.js:92-99`: `expanded_complete`가 아니면 막음 (항목 기준 아님) | `plans/screens.js:523` 주석 「과외쌤 구매 차단은 노출축(시·주력과목)만…」 → **막지 않음** |
| 서버 주문 | `src/Paid/ProviderCheckoutService.php:51` `createOrder`, `:661`: **검사 없음** | **검사 없음** |
| 노출 | `src/Search/SearchService.php:1743-1800`: 유효한 구매만 봄 → 정책과 맞음, 고치지 않음 | 같음 |
| 정의 | `RC_PICK/PRIME_FIELD_IDS` (위 0장 3번) | `tutor-reg/registration-check-copy.js:76` `['feature_1','student_target']`, `:79` `['intro_long','feature_2','feature_3']` → **정본 73 §3-3과 다름** |
| 이력 | — | `2c6d14ab`(2026-09-14)에는 과외쌤도 막았음 → `8d6aabd5`(2026-09-16)에서 결정 기록 없이 삭제. 2026-10-14 「할 일 3-2」로 고치기로 승인됐지만 처리 기록 없음 |

**상세등록 필수 표시 현황 (t2239 감사)**

| 모드 | 파일:줄 | 지금 표시 | 필수 목록과 비교 | 안내 한 줄 |
|---|---|---|---|---|
| 공부방 상세 (수업) | `study-room-ui/src/screens/step-lesson.js:34-37` `starLabel` → `form-label--required` + 「필수」 글자 | `:201` 수업운영방식, `:214` 타임별 원생수, `:230` 주 회수, `:238` 월 평균 수업료, `:259` 수업 스타일, `:263` 수업 스타일 추가설명, `:284` 한 줄 소개, `:288` 소개와 자랑, `:293` 홍보사진 | 목록 8개 중 7개 표시됨. **수업운영방식·타임별 원생수는 목록에 없는데 표시됨(과표시)**. 기본 필수와 같은 클래스라 구분 안 됨 | **없음** (`:184` 코드 주석뿐) |
| 공부방 상세 (시설·경력) | `study-room-ui/src/screens/step-facility.js:25-29` `starLabel` | `:119` 경력특징 1 | 목록과 맞음 (`feature_1`) | **없음** |
| 공부방 마이페이지 | `home-ui/src/study-room-reg/embedded-panels.js:23-24, 377, 401` (위 폼을 그대로 씀) | 위와 같음 | 위와 같음 | **없음** |
| 과외쌤 상세 1 | `tutor-ui/src/screens/step-lesson.js:98` | 산정방식만 `form-label--required` (상세 완료 조건) | 픽·프라임 항목 표시 **0개** | **없음** |
| 과외쌤 상세 2 | `tutor-ui/src/screens/step-contact.js:55`(대학/대학원), `:57`(전공), `:64`(경력구간), `:67`(주교재), `:69-70`(특징 1·2), `:81`(강의스타일) | 표시 **없음**. **특징 3 입력칸 자체가 없음** (정본 73 182행도 같은 지적) | 픽·프라임 항목 표시 **0개** | **없음** |
| 과외쌤 마이페이지 | 272 이후 `home-ui/src/tutor-reg/embedded-panels.js` (상세 1·2 폼을 그대로 씀) | 위와 같음 | 위와 같음 | **없음** |

---

## 1. 시작 조건

1. **272-1이 `main`에 병합됐는지** 확인한다. 아니면 시작하지 않는다. 같은 파일(`step-contact.js`, `step-lesson.js`, `registration-check-copy.js`, `registration-check-model.js`, `embedded-panels.js`)을 고치기 때문이다.
2. 최신 `origin/main`에서 `cursor/273-pickprime-purchase-gate`를 만든다. 같은 이름이 있으면 멈추고 보고한다.
3. `git status` 깨끗. **push까지만. `main` 병합·배포·force-push 금지. 실결제 금지.**

---

## 2. 작업 환경

- Cursor PC에는 PHP·로컬 API가 없다. Cursor는 **코드 + `npm run build` + vite-node 검증 스크립트 + PHP 검증 스크립트 작성**까지 하고 push한다. PHP는 고친 함수 원문을 보고서에 붙인다.
- 화면·과정 확인(5-1·5-2)은 **우동공과2가 로컬 테스트 서버에서 두 번** 한다. 결제 직전까지만 하고 실결제는 하지 않는다.

---

## 3. 수정

### 3-1. 한 곳 정의

- **화면**: 새 파일 `preview/shared/pickprime-requirements.js`
  - `TUTOR_PICK_IDS`, `TUTOR_PRIME_IDS`, `ROOM_PICK_IDS`, `ROOM_PRIME_IDS`
  - 판정 함수 `tutorTierMissing(tutor, 'pick'|'prime')`, `roomTierMissing(room, …)` → 빠진 항목 `{id, label}` 목록
  - 라벨은 등록점검 라벨 그대로
- 과외쌤 항목 id와 판정 (정본 73 §3-3):

| id | 라벨 | 충족 조건 | 등급 |
|---|---|---|---|
| `school_or_career` | 학교·학과 또는 경력 | `university_name` 있음 **또는** `career_year_band` 있음 | 픽·프라임 |
| `main_material` | 주교재 | `main_material_note` 빈 값 아님 | 픽·프라임 |
| `teaching_style` | 강의스타일 | `teaching_style_badges` 1개 이상 (최대 3개는 입력 제한) | 픽·프라임 |
| `intro_long` | 상세 소개 | 빈 값 아님 | 프라임 |
| `feature_2` | 특징 2 | 빈 값 아님 | 프라임 |
| `feature_3` | 특징 3 | 빈 값 아님 | 프라임 |

- 「학교·학과」를 대학명만으로 셀지 학과까지 볼지는 정본 73 문구대로 `university_name` 기준으로 하고 보고한다. 학과까지 필요하다고 판단되면 멈추고 보고.
- `tutor-reg/registration-check-copy.js` `TRC_PICK_FIELD_IDS`·`TRC_PRIME_FIELD_IDS`, `study-room-reg/registration-check-copy.js` `RC_PICK_FIELD_IDS`·`RC_PRIME_FIELD_IDS`는 **새 공용 파일을 가져다 쓰게** 바꾼다(값을 두 번 적지 않는다). `registration-check-model.js` ok 맵도 새 id를 계산한다.
- 공부방 `RC_FORM_STAR_FIELD_IDS`(현황판·폼 필수 마크, `study-room-reg/registration-check-copy.js:96` 부근)도 같은 정의에서 나오게 한다.
- **서버**: 새 파일 `src/Paid/TierRequirement.php`. 같은 id·같은 판정을 PHP로 둔다. `missingFor(PDO, 'tutor'|'study_room', int $id, 'pick'|'prime'): list<array{id,label}>`.
  - 공부방 `cover`는 대표 홍보사진 존재, `teaching_style`은 수업 스타일 1개 이상. 기존 `StudyRoomRegisterService`·`RegistrationHub` 판정과 같게 한다.

### 3-2. 구매 화면

- `plans/screens.js` `getEligibility`
  - 과외쌤(523행 주석 자리): `pick`/`prime`이면 `tutorTierMissing`. 빠진 게 있으면 `canBuy=false`, 0장 8번 문구 + 빠진 항목 이름.
  - 공부방(500-507행): `expanded_complete` 검사를 `roomTierMissing`으로 **바꾼다.**
  - 523행 「성과 불이익」 주석은 지운다. 노출축(시·주력과목)·홍보지역·숨김 검사는 그대로.
- `plans/order-blocks.js:92-99`도 같은 판정으로 바꾸고, 과외쌤도 같은 모양으로 막는다.
- 막힘 안내 옆에 「등록점검」 이동 버튼(톤다운 `#729FD9`/`#0B2545`, 높이 30). 공부방 `…/study-rooms/{id}/publish`, 과외쌤 `…/tutors/{id}/publish`.

### 3-3. 서버 주문 검사

- `ProviderCheckoutService::createOrder`에서 `sku_code`가 `pick`/`prime`(연장 포함)이면 `TierRequirement::missingFor`로 검사한다. 빠졌으면 주문을 만들지 않는다.
  - 응답: 기존 오류 형식에 맞춰 `error: 'tier_fields_missing'`, `missing: [라벨…]`, `message`: 0장 8번 문구. 상태 코드는 기존 검증 실패와 같게(예: 422/400).
- 주문을 만든 뒤 결제 완료·노출 처리 경로에는 검사를 넣지 않는다(t2238).
- 관리자 지급·쿠폰·무료 지급 등 `createOrder`를 거치지 않는 경로가 있으면 **고치지 말고 목록만 보고**한다.
- `preview/home-ui/src/paid-api.js`(또는 주문 호출부)가 `tier_fields_missing`을 받으면 같은 안내를 보인다.

### 3-4. 상세등록 필수 표시 + 안내 한 줄 (t2239)

- **표시 모양 하나로 통일**: 픽·프라임 필수 칸 라벨 옆에 `*`. 기본(가입) 필수 표시 `form-label--required`와 **다른 클래스**를 쓴다(예: `form-label--tier`, `register-tier-mark`). 두 종류가 화면에서 구분돼야 한다.
- **안내 한 줄**: 표시가 있는 폼(묶음) 맨 위에 한 번 「* 표시는 픽·프라임 카드 구매에 꼭 필요한 항목이에요」. 문구는 이것 그대로. 바꿀 필요가 있으면 보고.
- **공부방**
  - `step-lesson.js`·`step-facility.js`의 `starLabel`을 새 표시로 바꾼다.
  - 표시 대상은 3-1 공부방 목록 8개만. **수업운영방식(`:201`)·타임별 원생수(`:214`) 표시는 뺀다**(목록에 없음). 단, 이 둘이 다른 이유(기본 필수 등)로 필수면 그 표시를 유지하고 보고.
- **과외쌤**
  - `step-lesson.js`·`step-contact.js`에서 3-1 과외쌤 목록 칸에 표시: 대학/대학원·경력구간(「또는」 한 묶음, 안내에 「둘 중 하나」), 주교재, 강의스타일, 상세소개, 특징 2, 특징 3.
  - **특징 3 입력칸을 `step-contact.js`에 새로 넣는다**(특징 2 옆, 같은 모양, 라벨 「특징 3」). 저장 payload에 `feature_3`이 이미 있다(`form-collect.js` career).
  - 강의스타일 최대 3개 선택 제한이 없으면 넣는다(4번째 선택 시 막고 짧은 안내).
- **마이페이지**: 공부방·과외쌤 모두 상세등록 폼을 그대로 쓰므로 표시·안내가 같이 나와야 한다. 마이페이지 레이아웃이 깨지면 실패.
- **저장은 막지 않는다.** 표시 칸이 비어도 상세등록 「다음」·마이페이지 「저장」은 그대로 된다. 상세소개는 가입 때 선택(272-1) 그대로.

### 3-5. 하지 않는 것

- 노출 로직(`SearchService.php`, 홈·찾기 카드 쿼리) 변경 금지.
- 결제 PG·가격·재고·지역 축·DB 스키마 변경 금지.
- 기본(가입) 필수 항목·표시를 늘리거나 줄이지 않는다.
- 짧은 소개(과외쌤 `intro_short`)를 다시 넣지 않는다.

---

## 4. 기대 결과

- 과외쌤·공부방 모두 픽(프라임) 필수 항목이 비면 `/plans` 구매가 막히고, 빠진 항목과 「등록점검에서 남은 항목을 채우면 구매가 열립니다」가 보인다. 다 채우면 열린다. 상세 전체 완료는 요구하지 않는다.
- API로 바로 주문해도 서버가 막는다. 연장도 같다.
- 구매 완료 뒤 카드는 바로 노출된다(변화 없음).
- 상세등록·마이페이지 상세 폼에 픽·프라임 필수 칸마다 `*`, 폼 위에 안내 한 줄. 비워도 저장된다.

---

## 5. 검수 (하나라도 실패면 멈추고 보고)

### 5-1. 디자인 (우동공과2 로컬, Cursor는 가능한 범위)

- 1280·390, 전/후 나란히 비교:
  - `/plans` 과외쌤·공부방 픽·프라임 (막힘/열림)
  - 공부방 상세 수업·시설
  - 과외쌤 상세 1·2
  - 마이페이지 공부방·과외쌤 상세 탭
- 실측(`getComputedStyle`·`getBoundingClientRect`):
  - `*` 표시 크기·색이 공부방·과외쌤에서 같음
  - 기본 필수 표시와 구분됨
  - 안내 한 줄 글자 크기
  - 버튼은 매뉴얼 003 §2·§2-1 기준
  - 390 가로 넘침 0
  - 같은 종류 칸 간격 차이 0
- 표시 칸 수가 3-1 목록과 정확히 같다(공부방 8, 과외쌤 6: 대학·경력은 한 묶음).

### 5-2. 과정 두 번 (우동공과2 로컬 테스트 서버, 새 계정, 실결제 없음)

회차마다 과외쌤 1명 + 공부방 1명 새 계정으로 따로:
1. 기본등록만 → 상세등록 화면에 `*`·안내 한 줄 보임 → 비운 채 「다음」·저장 **성공**.
2. `/plans` 픽 → **막힘** + 빠진 항목(과외쌤: 학교·학과 또는 경력, 주교재, 강의스타일) + 안내 + 「등록점검」 이동.
3. 픽 항목만 채움(마이페이지 상세 탭에서) → 픽 **열림**(결제 직전까지) / 프라임 **막힘**(상세 소개·특징 2·3 표시).
4. 프라임 항목까지 채움 → 프라임 **열림**.
5. 공부방: `expanded_complete`가 아니어도 픽 항목만 채우면 픽 **열림**(기준 변경 확인).
6. 항목 빈 계정으로 주문 API 직접 호출(새 구매·연장 둘 다) → **서버 거절**(상태 코드·`error`·`missing` 기록), DB에 주문 행 없음.
7. 노출 회귀: DB·관리자로 구매 완료 행을 만든 계정 카드가 바로 노출됨(항목 비어도).
8. 272-1 회귀: 상세소개·연락 가능 시간을 비운 저장 성공, 등록점검 이동 정상.
- 회차·계정마다 표로 보고(URL·해시, 뒤로 가기, API 요청/응답, DB 값).

### 5-3. CI·빌드 (Cursor 필수)

- `home-ui`·`tutor-ui`·`study-room-ui` `npm run build` 통과.
- 기존 통과 유지(원래 실패는 main 비교 목록):
  - `verify:paid-pr-a`, `verify:paid-renewal`, `verify:paid-catalog`, `verify:paid-pricing`
  - `verify:tutor-registration-check-frame`, `verify:tutor-basic-required`, `verify:tutor-mypage-frame-ia`, `verify:tutor-lesson-optional-step`
  - `verify:study-room-registration-check-frame`
- 새 `scripts/verify-pickprime-purchase-gate.mjs`(vite-node):
  - 공용 정의 ↔ PHP `TierRequirement.php` 항목 id 같음
  - `TRC_*`·`RC_*`가 공용 정의를 가져다 씀(값 중복 0)
  - `getEligibility` 과외쌤에 523행 주석 없음
  - 공부방 판정에 `expanded_complete` 없음
  - 빈 항목이면 `canBuy=false` + 안내 문구
  - 상세등록 렌더 HTML에서 표시 칸 = 목록, 안내 한 줄 있음, 저장 막는 검사 없음
  - 특징 3 칸 있음
- 새 `scripts/verify-pickprime-purchase-gate.php`(테스트 서버·CI에서 실행): 판정 함수 빈 값/채운 값, `createOrder` 거절 경로.

---

## 6. 금지 범위

1. 허용 파일(7장) 밖 수정 금지.
2. 노출 로직·결제 PG·가격·재고·지역 축·DB 스키마 변경 금지.
3. 기본 필수 항목·표시 변경 금지(공부방 과표시 2칸 정리만 예외, 3-4).
4. 272-1의 「상세소개·연락 가능 시간 가입 때 선택」 되돌리기 금지.
5. `git add -A` 금지, force-push 금지, `main` 병합·배포 금지, 실결제 금지.

---

## 7. 허용 파일

| # | 파일 | 바뀔 것 |
|---|---|---|
| 1 | `preview/shared/pickprime-requirements.js` (새 파일) | 등급별 항목·판정 한 곳 |
| 2 | `preview/home-ui/src/tutor-reg/registration-check-copy.js` | `TRC_PICK/PRIME_FIELD_IDS`를 공용 정의로, 새 항목 라벨(기존 라벨 재사용) |
| 3 | `preview/home-ui/src/tutor-reg/registration-check-model.js` | 새 id ok 계산 |
| 4 | `preview/home-ui/src/study-room-reg/registration-check-copy.js` | `RC_PICK/PRIME_FIELD_IDS`·`RC_FORM_STAR_FIELD_IDS`를 공용 정의로 |
| 5 | `preview/home-ui/src/study-room-reg/registration-check-model.js` | 필요할 때만 (공용 판정 연결) |
| 6 | `preview/home-ui/src/plans/screens.js` | `getEligibility` 과외쌤·공부방 판정 |
| 7 | `preview/home-ui/src/plans/order-blocks.js` | 주문 요약 판정 |
| 8 | `preview/home-ui/src/paid-api.js` | `tier_fields_missing` 안내 (필요할 때만) |
| 9 | `preview/tutor-ui/src/screens/step-lesson.js` | 표시·안내 한 줄 |
| 10 | `preview/tutor-ui/src/screens/step-contact.js` | 표시·안내 한 줄, **특징 3 칸**, 강의스타일 최대 3개 |
| 11 | `preview/tutor-ui/src/form-collect.js` | 특징 3·강의스타일 제한 (필요할 때만) |
| 12 | `preview/study-room-ui/src/screens/step-lesson.js` | `starLabel` → 새 표시, 과표시 2칸 정리, 안내 한 줄 |
| 13 | `preview/study-room-ui/src/screens/step-facility.js` | `starLabel` → 새 표시, 안내 한 줄 |
| 14 | `preview/shared/register-form-primitives.css` | 새 표시 클래스 1개 (공부방·과외쌤 공용). 상세등록 다른 칸 모양 변경 금지 |
| 15 | `preview/home-ui/src/styles/mypage-ops.css` | 마이페이지 안 표시·안내 줄 정렬 (필요할 때만, `.mp-room-embed` 아래만) |
| 16 | `src/Paid/TierRequirement.php` (새 파일) | 서버 판정 |
| 17 | `src/Paid/ProviderCheckoutService.php` | `createOrder`에서 검사 호출 |
| 18 | `src/Paid/PaidApi.php` | 오류 응답 형식 (필요할 때만) |
| 19 | `scripts/verify-pickprime-purchase-gate.mjs`, `.php` (새 파일) | 5-3 |
| 20 | `package.json` | 검증 스크립트 1줄 |
| 21 | `scripts/verify-tutor-registration-check-frame.mjs`, `scripts/verify-study-room-registration-check-frame.mjs`, `scripts/verify-paid-renewal.mjs` | 새 구조에 맞출 때만 (검사를 약하게 하지 않는다) |
| 22 | `docs/ssot/20-study-room-registration-management.md` | 211·243행 「Pick/Prime 구매 = `expanded_complete`」를 「픽·프라임 필수 항목」으로 (문서만) |
| 23 | `docs/internal/73-tutor-basic-card-lock.md` | §3-3 「바꾼다」를 「반영됨(273)」으로 (문서만) |

- 그 밖의 파일이 필요하면 멈추고 보고한다(8장).

---

## 8. 멈추고 보고할 때

1. 허용 파일 밖을 고쳐야 할 때.
2. 272-1이 병합되지 않았을 때.
3. 노출 로직을 건드려야 할 것 같을 때.
4. `createOrder`를 거치지 않는 구매·지급 경로가 있거나, 서버 검사로 기존 정상 구매가 막힐 것 같을 때.
5. 화면 정의와 서버 정의를 하나로 맞출 수 없을 때.
6. 필수 표시 때문에 상세등록·마이페이지 저장이 막히거나, 기본 필수 표시가 바뀔 때.
7. 공부방 판정이 기존 `StudyRoomRegisterService` 판정(사진·수업 스타일)과 다를 때.
8. 디자인(5-1)이 나빠지거나 CI(5-3)가 실패할 때.

---

## 9. 작업 순서와 커밋 나누기

1. 시작 조건(1장) → 브랜치.
2. 커밋 (예시):
   - `273-1 feat(shared): 픽·프라임 필수 항목을 한 곳에 정의한다` (1·2·3·4·5번)
   - `273-2 feat(paid): 서버 주문 때 픽·프라임 필수 항목을 검사한다` (16·17·18번)
   - `273-3 fix(plans): 구매 화면을 필수 항목 기준으로 막고 안내한다` (6·7·8번)
   - `273-4 feat(register): 상세등록에 픽·프라임 필수 표시와 안내 한 줄, 과외쌤 특징 3 칸` (9-15번)
   - `273-5 test: 픽·프라임 구매 검사 검증 스크립트` (19·20·21번)
   - `273-6 docs: 정본 20·73 구매 기준 반영` (22·23번)
3. 빌드·검증(5-3) → 파일 이름으로 add → `git push origin cursor/273-pickprime-purchase-gate` → **멈춤.** 5-1·5-2는 우동공과2 로컬 테스트 서버에서 두 번.

---

## 10. 완료 보고 형식

1. 커밋: 브랜치, 해시 전부(순서대로), 시작 기준 `origin/main` 해시(272-1 병합 포함 확인).
2. 바뀐 파일:줄. PHP는 고친 함수 원문.
3. 판단 사항: 「학교·학과」 판정 기준, 공부방 과표시 2칸 처리, 강의스타일 3개 제한 방식, `createOrder` 밖 경로 목록.
4. 표시 감사 표: 고친 뒤 모드별 표시 칸(파일:줄)이 0-1 감사 표와 3-1 목록에 맞는지.
5. CI 결과(5-3) 출력 요약.
6. 범위 확인 문장: 「7장 밖 파일, 노출 로직, 결제·가격·재고·지역 축, DB 스키마, 기본 필수 항목은 건드리지 않았습니다. 실결제는 하지 않았습니다.」
7. 상태: push까지 했고 병합·배포는 하지 않았다. 5-1·5-2는 우동공과2 로컬 테스트 서버 확인 대기.
