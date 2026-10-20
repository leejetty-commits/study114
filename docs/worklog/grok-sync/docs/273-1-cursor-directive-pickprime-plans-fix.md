# 273-1 보완: 구매 화면이 서버 판정을 그대로 쓰게 하기 + 카드 강의스타일 개수 되돌리기

> **상태: 지시서 (2026-10-21, 종현 확정).** 273 검수 불합격 3건과 주교재 필수 빼기(4번)만 고친다. 이 문서에 적힌 것만 한다.
> **⚠ 이번에는 멈춤 조건(7장)을 반드시 지킨다.** 273에서는 「화면 쪽 객체에 값이 없으면 멈추고 보고」(273 지시서 8장 7번)를 지키지 않고 진행해서 불합격이 났다. 7장에 해당하면 **고치지 말고 멈추고 보고**한다. 추측으로 넘어가지 않는다.

- 작업 번호: 273-1
- 날짜: 2026-10-21
- 브랜치: **`cursor/273-pickprime-purchase-gate` 그대로** (새 브랜치 만들지 않음). 기준 `9d7f74d9` 위에 커밋을 **추가**한다.
- 박스 사본: `/workspace/study114/handoffs/273-1-cursor-directive-pickprime-plans-fix.md`
- 상위 지시서: `docs/worklog/grok-sync/docs/273-cursor-directive-tutor-pickprime-gate.md` (main `7b410850`). 거기 0장 결정·3-5 금지·6장 금지는 그대로 유효하다.
- 모델: **grok-4.7 high만**.
- 금지: force-push, rebase·amend로 기존 커밋 바꾸기, `git add -A`, `main` 병합·배포, 실결제.

> 쉬운 말 안내: 서버는 「살 수 있다」고 하는데 구매 화면은 「정보 부족」이라고 막았습니다. 화면이 서버와 다른 자료로 따로 계산했기 때문입니다. 이제 화면은 직접 계산하지 않고 **서버에게 물어본 답**을 그대로 보여 줍니다. 그리고 픽 카드의 강의스타일은 원래대로 1개만 보이게 되돌립니다.

---

## 0. 검수에서 나온 문제 (9d7f74d9, 우동공과2 로컬 실측)

| # | 화면 | 문제 | 원인 |
|---|---|---|---|
| 1 | `/plans` 과외쌤 | 필수 항목을 **다 채운 계정**도 「픽 정보 부족」「프라임 정보 부족 · 주교재」로 막힘. 같은 계정 API 주문은 서버가 200으로 받아 줌 | `plans/screens.js:531` `tutorTierMissing(tutor, tier)`가 화면 객체(`getTutor`)로 판정. 이 객체는 `src/Registration/TutorHubRepository.php`가 주는데 `main_material_note`가 없음 → 늘 빈 값 |
| 2 | `/plans` 공부방 | 서버는 픽 주문 200(상세 완료 아니어도). 화면은 「픽 정보 부족」 + 대표사진·수업 스타일 빠짐으로 막음 | `plans/screens.js:508` `roomTierMissing(room, tier)`가 화면 객체로 판정. 대표사진(사진 목록)·수업 스타일 값이 서버 판정과 다름 |
| 3 | 픽 카드 강의스타일 | `exposure-render.js:473`·`:491`을 늘 `3`으로 바꿔서, 픽 카드(`featureMax: 1`, `:531` 부근)도 3개 + 「외 N」을 보임 | 273 지시서 3-4-1은 「지금 식 그대로」였음 |

- 증거: `/workspace/study114/audits/273-review/` `plans-tutor-allfilled-1280.png`, `plans-room-pickfilled-390.png`, `api-tutor-A.json`, `api-room.json`.

---

## 1. 결정 (종현 확정 2026-10-21, 바꾸지 말 것)

| # | 항목 | 확정 |
|---|---|---|
| 1 | 정본 | 픽·프라임 필수 항목 판정은 **서버 `TierRequirement::missingFor`(`src/Paid/TierRequirement.php:108`) 하나가 정본**이다. 구매 화면은 서버가 내려준 「빠진 항목」 목록으로 막고 안내한다. 화면에서 따로 계산해서 막지 않는다. |
| 2 | 화면 공용 정의 | `preview/shared/pickprime-requirements.js`는 **등록점검·상세등록 `*` 표시용으로 그대로 둔다.** `/plans`의 막기 판정에만 쓰지 않는다. |
| 4 | 과외쌤 주교재 | **주교재(`main_material_note`)는 픽·프라임 필수에서 뺀다.** 픽 = 학교·학과 또는 경력 + 강의스타일 1개 이상. 프라임 = 픽 + 상세 소개·특징 2·특징 3. 주교재 칸은 **선택 항목으로 남기고 `*` 표시만 뺀다.** 카드는 지금처럼 주교재 값이 있을 때만 보인다(카드 표시는 바꾸지 않는다). |
| 3 | 카드 강의스타일 | **픽 카드(`featureMax === 1`)는 1개 + 「외 N」, 프라임 카드는 3개 + 「외 N」.** `exposure-render.js:473`·`:491`의 식을 `featureMax === 1 ? 1 : 3`으로 되돌린다. 학생 카드 2개(`:949`·`:1032`, 2개 + 「외 N」)는 그대로. `exposure-format.js` 「외 N」 함수도 그대로. |

---

## 2. 시작 조건

1. `git fetch` 뒤 `origin/cursor/273-pickprime-purchase-gate`의 끝이 `9d7f74d9`인지 확인. 다르면 멈추고 보고.
2. 그 브랜치를 체크아웃(로컬 브랜치를 `origin`과 같게). `git status` 깨끗.

---

## 3. 수정

### 3-1. 서버: 빠진 항목을 읽어 주는 API (새 파일)

- **새 파일 `public/api/paid/tier-check.php`** (GET, 읽기 전용).
  - 입력: `provider_type` (`tutor`|`study_room`), `provider_id`.
  - 로그인·공급자 확인은 같은 폴더 `status.php:13`처럼 `PaidApi::requireProvider()`.
  - **본인 것만**: `tutors.user_id` / `study_rooms.user_id`가 로그인한 사람이 아니면 403(`PaidApi::fail(403, 'forbidden', …)`). 없는 id도 403(남의 것인지 알려 주지 않음).
  - 출력:
    ```json
    { "ok": true, "provider_type": "tutor", "provider_id": 36,
      "pick":  { "can_buy": false, "missing": [{"id":"main_material_note","label":"주교재"}], "message": "픽 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다" },
      "prime": { "can_buy": false, "missing": [...], "message": "프라임 정보 부족 · …" } }
    ```
    - `missing`은 `TierRequirement::missingFor`(`TierRequirement.php:108`) 결과 그대로. `message`는 `TierRequirement::blockMessage`(`:96`). 빠진 게 없으면 `can_buy: true`, `missing: []`, `message: ""`.
  - 여기서는 **필수 항목만** 본다. 숨김·홍보지역·재고 같은 다른 검사는 지금 화면 코드 그대로 둔다(섞지 않는다).
- `TierRequirement.php`는 3-4의 주교재 두 줄 말고, `ProviderCheckoutService.php`는 전부 **고치지 않는다**(주문 검사 `assertTierFieldsForOrder`는 그대로). `missingFor`를 그대로 부르기만 한다.
- `TutorHubRepository.php`에 필드를 더하는 방법은 **쓰지 않는다**(화면이 다시 따로 계산하게 됨).

### 3-2. 화면: 서버 답으로 막고 안내

- **`preview/home-ui/src/paid-api.js`**: `PAID_ENDPOINTS`(`:9-15` 부근)에 `tierCheck: '/api/paid/tier-check.php'` 추가, `fetchTierCheck(providerType, providerId)` 함수 추가(기존 `fetchPaidStatus` `:50`과 같은 모양, `CREDENTIALS` 사용).
- **`preview/home-ui/src/plans/screens.js`**
  - `getEligibility`(`:471`) 안 공부방 `:508-512`, 과외쌤 `:531-535`의 `roomTierMissing`·`tutorTierMissing` 호출을 **서버 답 캐시 읽기**로 바꾼다.
    - 캐시: `{ [providerType:providerId]: { pick, prime, loadedAt } }`. 구매 화면을 열 때·프로필(공부방/과외쌤)을 바꿀 때·등록점검에서 돌아올 때 `fetchTierCheck`로 채우고 다시 그린다(`:583`, `:756`, `:918` 호출부는 그대로 동기 함수로 캐시만 읽는다).
    - `missing`이 있으면 `canBuy=false`, 안내 = 서버 `message` + 서버 `label`들(지금 모양 그대로 「…채우면 구매가 열립니다 · 주교재, 상세 소개」). `registerCheckHref`·「등록점검」 버튼은 지금 그대로.
    - **아직 못 받았을 때**: 구매 버튼을 잠시 막고 「구매 조건을 확인하고 있어요」.
    - **받다가 실패했을 때**: 구매 버튼을 막고 「구매 조건을 확인하지 못했어요 · 다시 시도」(누르면 다시 요청). 화면에서 따로 계산해서 대신 판정하지 않는다.
  - `pickprime-requirements.js`의 `roomTierMissing`·`tutorTierMissing` import는 `/plans`에서 쓰지 않으면 지운다(`tierBlockMessage`도 서버 `message`로 대체).
- **`preview/home-ui/src/plans/order-blocks.js`**: `:96` `roomTierMissing(room, productCode)`, `:146` `tutorTierMissing(tutor, productCode)`도 같은 캐시를 읽게 바꾼다(`screens.js`에서 캐시 읽기 함수를 내보내 같이 쓰거나, 작은 공용 함수 하나). 안내 모양은 지금 그대로.
- 주문 API가 `tier_fields_missing`(422)을 돌려주면(화면 캐시가 오래된 경우) 지금처럼 안내하고, **캐시를 그 응답의 `missing`으로 바꾼 뒤** 다시 그린다.

### 3-3. 카드 강의스타일 개수 되돌리기

- `preview/home-ui/src/exposure-render.js:473`·`:491`: `formatTeachingStyleBadges(item.teaching_style_badges, 3)` → `formatTeachingStyleBadges(item.teaching_style_badges, featureMax === 1 ? 1 : 3)` (e6f8f08a 때 식).
- `:949`·`:1032`(학생 카드, `2`)는 건드리지 않는다. `exposure-format.js`는 건드리지 않는다.
- 결과: 픽 카드 「열정 외 4」(5개일 때), 프라임 카드 「열정 · 꼼꼼 · 친절 외 2」.

### 3-4. 주교재를 필수에서 빼기 (종현 확정 2026-10-21)

- **`src/Paid/TierRequirement.php`**: `:16` `TUTOR_PICK_IDS`에서 `'main_material_note'` 제거 → `['school_or_career', 'teaching_style_badges']`. `:19-26` `TUTOR_PRIME_IDS`에서 `:21` `'main_material_note'` 줄 제거. `:46` 라벨(`'주교재'`)과 `:365` 조회 칸은 그대로 둬도 된다(판정에 안 쓰이면 무해). 판정 로직 다른 부분은 고치지 않는다.
- **`preview/shared/pickprime-requirements.js`**: `:13` `TUTOR_PICK_IDS`에서 `'main_material_note'` 제거(프라임은 `:14`에서 픽을 펼쳐 쓰므로 자동으로 빠짐). `:33` 안내 문구는 지워도 되고 둬도 된다.
- **`preview/tutor-ui/src/screens/step-contact.js:84`**: 주교재 라벨의 `form-label--tier` 클래스만 빼서 `*`를 없앤다. 입력칸·`name`·값 저장은 그대로(선택 항목).
- **등록점검 픽 목록**: `preview/home-ui/src/tutor-reg/registration-check-copy.js:77`·`:80`, `registration-check-model.js:74`는 공용 목록을 그대로 따라가므로 **코드 수정 없이** 주교재가 픽·프라임 목록에서 빠지는지 확인만 한다. `registration-check-copy.js:108`(`required: false`)는 그대로. 따라가지 않으면 멈추고 보고.
- **검사 스크립트**: `scripts/verify-pickprime-purchase-gate.mjs:64`의 목록에서 `'main_material_note'` 제거, `:100` 빈 계정 이름 검사에서 `'주교재'` 대신 「주교재가 **없음**」을 확인. `scripts/verify-pickprime-purchase-gate.php:42`·`:49`·`:59` 예시 계정 중 하나는 주교재를 비워서도 픽·프라임 통과하는지 확인. 상세등록 `*` 개수 검사가 있으면 7 → **6**.
- **정본 문서(이번 브랜치 273-6 문서 보완)**:
  - `docs/internal/73-tutor-basic-card-lock.md` `:166` 표 「픽 | 베이직 + 학교·학과 **또는** 경력 + 강의스타일 1개」, `:198` 「픽 = 학교·학과(대학명) 또는 경력, 강의스타일 1개 이상(최대 4개).」, `:514` 「픽 = 학교·학과 또는 경력, 강의스타일 1개」, `:228` 6-3 행의 「픽 조건」을 「선택(값 있으면 카드 표시)」으로. 3-3절 끝에 한 줄 추가: 「주교재는 2026-10-21 종현 확정으로 필수에서 뺐다. 선택 항목이고 값이 있을 때만 카드에 보인다.」
  - `docs/ssot/20-study-room-registration-management.md`: 273-6에서 고친 줄은 「픽·프라임 필수 항목」이라는 말만 있고 주교재 언급은 없다. 주교재·과외쌤 필수 목록을 적은 줄이 있으면 같이 고치고, 없으면 고치지 않는다(보고에 「20은 바꿀 줄 없음」).
  - 그 밖의 문서(`docs/ssot/14`, worklog, 273 지시서 원본)는 고치지 않는다.

---

## 4. 하지 않는 것

- `TierRequirement.php` 판정 내용(3-4 주교재 제거 말고), `ProviderCheckoutService.php` 주문 검사, 274 결제 막힘(`PaidCheckoutGate`) 변경 금지.
- `TutorHubRepository.php`·`StudyRoomHubRepository.php`·등록점검·상세등록 `*` 표시 변경 금지.
- 숨김·홍보지역·재고·가격·노출 로직·DB 스키마 변경 금지.
- `exposure-render.js`에서 `:473`·`:491` 두 줄 말고 다른 줄 변경 금지. **주교재 카드 표시는 바꾸지 않는다.**
- 주교재 입력칸·저장·DB 칸 삭제 금지(선택 항목으로 남김).

---

## 5. 검수 (우동공과2 로컬, 새 계정, 실결제 없음. 하나라도 실패면 불합격)

1. **과외쌤** 새 계정, 1280·390 각각:
   - **주교재만 비운 계정(나머지 픽·프라임 항목은 다 채움)**: `/plans` 픽·프라임 **열림**, `tier-check` `missing: []`, API 픽·프라임 주문 만들기 **200**(결제 완료 없음). 화면·응답 어디에도 「주교재」가 빠진 항목으로 나오지 않음.
   - 빈 계정: `/plans` 픽·프라임 막힘. 화면 항목 이름 = `tier-check.php` 응답 `label` = 주문 API 422 `missing` (세 곳 글자까지 같음).
   - 픽 항목만 채움: **픽 구매 버튼 열림**(주문 만들기까지, 결제 완료 없음), 프라임 막힘 [상세 소개, 특징 2, 특징 3].
   - 다 채움: **픽·프라임 모두 열림**. (273 검수 때 「주교재」로 막혔던 경우)
2. **공부방** 새 계정, 1280·390 각각:
   - 시스템 기본 사진만: 픽 막힘 [대표사진] (서버와 같음).
   - 픽 항목만 채움(상세 완료 아님): **픽 열림**, 프라임 막힘 [서버가 준 4개 이름 그대로].
   - 다 채움: 픽·프라임 열림.
3. `tier-check.php`: 로그인 안 함 401/403, 남의 `provider_id` 403, 응답 모양이 3-1과 같음.
4. 확인 중·실패 화면: API를 일부러 실패시키면(예: 서버 끔) 버튼 막힘 + 「다시 시도」, 다시 켜고 누르면 정상.
5. 화면 캐시가 오래된 경우: `/plans`를 연 채로 다른 탭에서 항목을 비우고 주문 → 422 안내 + 화면이 새 `missing`으로 바뀜.
6. 카드: 강의스타일 5개 계정으로 픽 카드 「1개 외 4」, 프라임 카드 「3개 외 2」, 학생 카드 2개 + 「외 N」 그대로. 1280·390 한 줄·잘림 없음.
6-1. 주교재: 상세등록 2단계 주교재 라벨에 `*` 없음(1280·390), 입력·저장 그대로 됨, `*` 개수 6개. 등록점검 픽·프라임 목록에 주교재 없음. 주교재 값 있는 계정의 카드에 주교재 그대로 보임, 없는 계정은 안 보임(바뀌기 전과 같음).
7. 273 통과 항목 회귀 없음: 서버 주문 검사(빈 계정 422, 연장 422), 274 결제 막힘 403, 강의스타일 4개 제한·5개 보유 계정 저장, 상세 `*` 표시, 272 저장 보존, 390 가로 넘침 0.
8. 빌드·검사: `home-ui`·`tutor-ui`·`study-room-ui` 빌드, `verify:pickprime-purchase-gate`, `verify:paid-*`, `verify:tutor-*`, `verify:study-room-registration-check-frame` — `e6f8f08a`에서도 실패하던 것 말고 새로 깨진 것 0.
9. `scripts/verify-pickprime-purchase-gate.mjs`에 추가: `/plans`(`screens.js`·`order-blocks.js`)가 `roomTierMissing`·`tutorTierMissing`을 부르지 않음, `tier-check` 캐시를 읽음, `exposure-render.js` 두 줄이 `featureMax === 1 ? 1 : 3`. `scripts/verify-pickprime-purchase-gate.php`에 추가: `tier-check.php` 응답이 `missingFor`와 같음, 남의 id 403.

---

## 6. 허용 파일

| # | 파일 | 할 일 |
|---|---|---|
| 1 | `public/api/paid/tier-check.php` (새 파일) | 3-1 읽기 API |
| 2 | `preview/home-ui/src/paid-api.js` | `tierCheck` 주소·`fetchTierCheck` |
| 3 | `preview/home-ui/src/plans/screens.js` | `getEligibility` `:508-512`·`:531-535`를 캐시 읽기로, 캐시 채우기·확인 중·실패 안내 |
| 4 | `preview/home-ui/src/plans/order-blocks.js` | `:96`·`:146`을 캐시 읽기로 |
| 5 | `preview/home-ui/src/exposure-render.js` | `:473`·`:491` 두 줄만 |
| 6 | `scripts/verify-pickprime-purchase-gate.mjs`, `scripts/verify-pickprime-purchase-gate.php` | 5장 9번 + 3-4 주교재 |
| 7 | `src/Paid/TierRequirement.php` | **3-4만**: `:16`·`:21` 주교재 제거 |
| 8 | `preview/shared/pickprime-requirements.js` | **3-4만**: `:13` 주교재 제거 (`:33` 문구 정리 가능) |
| 9 | `preview/tutor-ui/src/screens/step-contact.js` | **3-4만**: `:84` 주교재 `*` 제거 |
| 10 | `docs/internal/73-tutor-basic-card-lock.md`, `docs/ssot/20-study-room-registration-management.md` | 3-4 정본 문구 |

- `src/Paid/PaidApi.php`는 403 응답에 필요한 게 이미 있으면(`fail` `:86`) 고치지 않는다. 고쳐야 하면 멈추고 보고.
- 이 6개 밖은 **손대지 않는다.**

---

## 7. 멈추고 보고할 때 (⚠ 이번엔 반드시 지킨다)

아래에 하나라도 걸리면 **그 자리에서 고치기를 멈추고**, 무엇이 왜 필요한지(파일:줄)만 보고한다. 「이렇게 하면 될 것 같아서」 진행하지 않는다.

1. 6장 허용 파일 밖을 고쳐야 할 때, 또는 허용 파일이라도 적힌 줄 말고 고쳐야 할 때 (`TierRequirement.php`·`pickprime-requirements.js`는 3-4 줄만, `PaidApi.php`·Hub 저장소·카드 표시는 금지).
1-1. 주교재를 빼면 등록점검·상세등록·카드 중 어디가 깨지거나, 공용 목록을 따라가지 않는 곳이 있을 때.
2. **`/plans` 판정에 필요한 값이 서버 답(`tier-check.php`)에 없거나, 화면이 서버 답 말고 다른 객체로 판정해야 할 것 같을 때** (273 지시서 8장 7번과 같은 조건. 이번 불합격의 원인).
3. 본인 확인에 쓸 `user_id` 칸이 `tutors`·`study_rooms`에 없거나 다른 이름일 때.
4. `getEligibility` 호출부(`:583`·`:756`·`:918`)를 비동기로 바꿔야만 할 것 같을 때.
5. 5장 검수 중 하나라도 실패할 때.

---

## 8. 커밋

- `273-7 feat(paid): 픽·프라임 빠진 항목 읽기 API` (1번)
- `273-8 fix(plans): 구매 화면이 서버 판정으로 막고 안내한다` (2·3·4번)
- `273-9 fix(cards): 픽 카드 강의스타일 1개 + 외 N으로 되돌림` (5번)
- `273-10 fix(tier): 과외쌤 주교재를 픽·프라임 필수에서 뺀다` (7·8·9번)
- `273-11 docs: 정본 73(·20) 주교재 필수 제외 반영` (10번)
- `273-12 test: 구매 화면 서버 판정·카드 개수·주교재 선택 검사` (6번)
- 파일 이름으로 add → `git push origin cursor/273-pickprime-purchase-gate` (force 아님) → **멈춤.**

---

## 9. 완료 보고 형식

1. 브랜치, 시작 끝(`9d7f74d9`), 추가 커밋 해시 전부(순서대로), push 뒤 끝 해시.
2. 바뀐 파일:줄. PHP(`tier-check.php`)는 전체 원문.
3. 5장 1·2번 결과 표: 계정 상태 × 픽/프라임 × 1280/390 → 화면 버튼(열림/막힘), 화면 항목 이름, `tier-check` `label`, 주문 API 결과. 세 곳 이름이 같은지 ○/×.
3-1. 주교재만 비운 계정 결과(화면 열림, `tier-check` `missing`, 주문 상태 코드), `*` 개수, 등록점검 목록.
4. 5장 3~6번 결과(상태 코드·화면 문구·카드 글자).
5. 빌드·검사 결과(5장 8·9번), `e6f8f08a`에서도 실패하던 목록 따로.
6. 7장 멈춤 조건에 걸린 게 있었는지: 「없었다」 또는 걸린 항목과 멈춘 지점.
7. 범위 확인 문장: 「6장 밖 파일, 서버 판정·주문 검사, 274 결제 막힘, Hub 저장소, 노출 로직, 카드 주교재 표시, 주교재 입력칸·DB 칸, DB 스키마는 건드리지 않았습니다. 실결제는 하지 않았습니다. force-push 하지 않았습니다.」

---

## 추가 허용 (2026-10-21 03:45, 우동공과2 — Cursor 멈춤 보고 반영)

- 허용 파일 11번: `scripts/verify-tutor-registration-check-frame.mjs` **130행 한 줄만**. 고정된 픽 목록 문자열 `school_or_career,main_material_note,teaching_style_badges`를 `school_or_career,teaching_style_badges`로 바꾼다.
- 그 밖의 줄, 다른 검사 내용은 바꾸지 않는다. `registration-check-copy.js`는 공용 목록을 따르므로 고치지 않는다.
- 이 수정 뒤 `verify:tutor-registration-check-frame`은 통과해야 한다. 그 밖의 다른 곳이 새로 실패하면 다시 멈추고 보고한다.
- 이 허용으로 서버 API, 구매 화면, 카드 개수, 주교재 `*` 제거를 포함한 273-1 전체를 진행한다.
