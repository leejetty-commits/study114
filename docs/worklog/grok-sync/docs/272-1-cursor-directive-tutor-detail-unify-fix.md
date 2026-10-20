# 272-1 과외쌤 상세정보 통일 — 검수 실패 고치기 (272 이어서)

> **상태: 초안 (2026-10-20, 종현 확정 전).** 이 문서에 적힌 것만 한다. 아래 「허용 파일」 밖은 손대지 않는다.
> 범위 밖 수정이 필요하면 고치지 말고 멈추고 보고한다(8장).

- 작업 번호: 272-1 (272 후속)
- 날짜: 2026-10-20
- 브랜치: **기존 `cursor/272-tutor-detail-unify`에서 이어서** (현재 끝 `17b7cbeb`). 새 브랜치 만들지 않는다.
- 박스 사본: `/workspace/study114/handoffs/272-1-cursor-directive-tutor-detail-unify-fix.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/272-1-cursor-directive-tutor-detail-unify-fix.md`
- 앞 문서: `272-cursor-directive-tutor-detail-unify.md` (5장 검수 기준은 그대로 유효)
- 검수 근거: 우동공과2 로컬 검수 `/workspace/study114/audits/272-review/` (전/후 비교 이미지, `flow1.log`·`flow2.log`)
- 모델: **grok-4.7 high만** 쓴다. fast 모델 금지.
- 요약: 272 결과물은 상세등록 화면은 그대로 두고 저장도 잘 되지만, ① 등록점검 「칸으로 이동」이 끊겼고 ② 마이페이지에서 상세소개·연락 가능 시간을 고칠 수 없게 됐고 ③ 마이페이지 안에 가입용 문구·강한 버튼 2개가 보이고 ④ 390 폭에서 가로로 넘친다. 이것을 고친다.

> 쉬운 말 안내: 종이를 한 장으로 합친 것은 잘 됐는데, 합치면서 몇 칸이 빠졌고, 마이페이지에서 보면 가입 때 쓰는 안내문이 그대로 붙어 있고, 휴대폰에서는 종이가 화면 밖으로 삐져나옵니다. 빠진 칸을 넣고, 안내문을 마이페이지에 맞게 바꾸고, 휴대폰에서 줄이 접히게 합니다.

---

## 0. 결정 확인 (종현 확정값, 임의로 바꾸지 말 것)

| # | 항목 | 확정값 |
|---|---|---|
| 1 | 상세소개(`intro_long`) | **선택 입력** (t2234). 필수 표시 없음, 비워도 저장된다. |
| 2 | 연락 가능 시간(`contact_time_note`) | **선택 입력** (t2234). 필수 표시 없음, 비워도 저장된다. |
| 3 | 두 칸의 위치 | **상세등록 2단계 `step-contact.js`(정본)** 에 넣는다. 그러면 가입과 마이페이지 양쪽에 같이 나온다. |
| 4 | 짧은 소개(`intro_short`) | **폐지** (종현 결정). 다시 넣지 않는다. 화면·검사 어디에도 새로 만들지 않는다. |
| 5 | 상세 완료 조건 | **소개문(intro)을 상세 완료 필수 조건에서 뺀다.** 화면(클라이언트)과 서버 양쪽. 서버는 이 한 가지에 한해 수정 허용. |
| 6 | 픽/프라임 | 픽·프라임 카드에 보이는 칸(상세소개 등)은 **신청·구매 때 필수 + 안내**가 원칙 (t2235-6). **이번 작업으로 이 검사·안내가 약해지면 안 된다.** 없는 검사를 이번에 새로 만들지는 않는다(3-6, 8장). |
| 7 | 디자인 | 마이페이지 틀·폼 디자인이 **깨지거나 나빠지면 실패** (272 5-1 그대로). |

### 0-1. 검수에서 확인된 실패 (17b7cbeb 기준, 우동공과2 로컬 실측)

| # | 실패 | 근거 |
|---|---|---|
| F1 | 등록점검 → 상세 칸 이동이 칸을 못 찾음. 남은 `data-trc-field`는 `profile_image` 하나 | main: feature_2·intro·monthly_session_count·fee_description·lesson_places·university 모두 찾음 / 브랜치: 모두 MISSING. `verify:tutor-registration-check-frame` main 통과 → 브랜치 실패 4건 (`scripts/verify-tutor-registration-check-frame.mjs:55,152-154`) |
| F2 | 마이페이지에서 상세소개·연락 가능 시간 입력 칸이 사라짐 | main `home-ui/src/tutor-reg/screens.js:576-590`에 있었음. 정본 step-contact에는 없음 |
| F3 | 상세등록 2단계 「등록 완료」가 `contact_time_note`를 빈 값으로 덮음 (**main에도 있던 버그**) | 폼에 칸이 없는데 `form-collect.js` `payloadForStep('contact')`(186행 부근)가 `contact_time_note: ''`를 보냄 |
| F4 | 마이페이지 안에 가입용 문구가 그대로 보임 | `step-lesson.js:83`(「1단계입니다… 다음으로 진행하세요」), `:85`(「· 마이페이지에서 수정」), `:118`(「기본정보는 마이페이지에서 수정」 링크), `step-contact.js:52`(「마지막 단계입니다… 등록을 마쳐 주세요」) |
| F5 | 강한 Primary 「저장」이 2개, 아래 「등록점검」「마이프로필」 버튼이 사라짐, 「저장되었습니다」 안내 없음 | `step-lesson.js:124`, `step-contact.js:98`. main 하단 버튼 3개(상세정보 저장·등록점검·마이프로필) |
| F6 | 등록이 없을 때 상세 탭에 폼만 나오고 저장 버튼이 동작하지 않음 | `screens.js:241` → `embedded-panels.js` `bindEmbeddedTutorDetail`이 tutorId 0이면 바로 끝남 |
| F7 | 390 폭 가로 넘침 615px, 라디오 글자가 한 자씩 세로로 쪼개짐(「단/독」, 「2/명」) | 연령대(`age_band`) 라디오 한 줄이 접히지 않음(오른쪽 끝 598px). 1280에서도 카드가 칸 끝까지 차서 「4명 이상」 줄바꿈, 페이지 길이 2667→3518px |
| F8 | `verify:tutor-basic-required` 실패가 11건 → 16건으로 늘어남 | 스크립트가 지워진 `renderDetailForm`을 찾음 (`scripts/verify-tutor-basic-required.mjs:158,215`) |

### 0-2. 픽/프라임 필수 검사 현황 (우동공과2 코드 확인, 17b7cbeb 기준)

종현 생각: 「픽/프라임 신청 때 상세소개 등은 필수+안내가 이미 있다」. **코드 확인 결과, 과외쌤은 구매를 막는 검사가 없다.** 등록점검 화면의 안내만 있다.

| 위치 | 파일:줄 | 내용 |
|---|---|---|
| 등록점검 안내 (있음) | `home-ui/src/tutor-reg/registration-check-copy.js:76` `TRC_PICK_FIELD_IDS = ['feature_1','student_target']`, `:79` `TRC_PRIME_FIELD_IDS = ['intro_long','feature_2','feature_3']` | 「픽 노출까지 추가 입력」「프라임 노출까지 추가 입력」(`:31-35`) 목록으로 **보여 주기만** 한다 |
| 등록점검 계산 | `registration-check-model.js:321-323, 340-341, 384-385` → `registration-check-render.js:206-207` | 빠진 칸 목록·남은 개수 표시 |
| 구매 화면 (공부방) | `home-ui/src/plans/screens.js:500-507` | 공부방은 픽/프라임 구매 때 `detail_completion_status !== 'expanded_complete'`이면 **구매를 막고** 「등록점검에서 남은 항목을 채우면 구매가 열립니다」 안내 |
| 구매 화면 (과외쌤) | `home-ui/src/plans/screens.js:523` | 주석 「과외쌤 구매 차단은 노출축(시·주력과목)만. 소개문·카드 카피 완성도는 성과 불이익.」 → **과외쌤은 상세소개·특징이 비어도 구매 가능** |
| 서버 주문 | `src/Paid/ProviderCheckoutService.php:51` `createOrder`, `:661` `assertBadgePurchaseAllowed` | 상세소개·특징·상세완료 검사 **없음** |
| 노출 매트릭스 | `home-ui/src/tutor-reg/format.js:219-258` `getExposureMatrix` | 픽/프라임 「ok」를 `detail_completion_status === 'expanded_complete'`로 판단. **표시용**이고 구매를 막지는 않는다 |

- 결론: **과외쌤 픽/프라임 신청·구매 때 상세소개 필수 검사는 없음.** 공부방만 「상세 완료」로 막는다. → **별도 항목으로 종현 결정 필요** (이번 272-1에서 구현하지 않는다).
- 주의: 0장 5번대로 서버 상세완료 조건에서 intro를 빼면 `expanded_complete`가 더 쉽게 된다. 과외쌤은 구매를 원래 막지 않으니 구매 동작은 그대로지만, `getExposureMatrix`의 픽/프라임 「ok」 표시는 소개문 없이도 켜질 수 있다. 그래서 3-6을 지킨다.

---

## 1. 시작 조건

1. `git fetch` 후 `origin/cursor/272-tutor-detail-unify`의 끝이 `17b7cbeb`인지 확인한다. 다르면 멈추고 보고한다.
2. 그 브랜치를 받아 이어서 작업한다. **새 커밋만 얹는다.** amend·rebase·force-push 금지.
3. `git status`가 깨끗한지 확인한다.
4. **push까지만 한다. `main` 병합·배포 금지.**

```bash
git fetch origin
git rev-parse origin/cursor/272-tutor-detail-unify   # 17b7cbeb… 이어야 함
git checkout cursor/272-tutor-detail-unify || git checkout -b cursor/272-tutor-detail-unify origin/cursor/272-tutor-detail-unify
git status --short
```

---

## 2. 작업 환경 주의 (Cursor PC)

- Cursor PC에는 **PHP·로컬 API가 없다.** 그래서 Cursor는 **코드 수정 + `npm run build` + vite-node 검증 스크립트**까지 하고 push한 뒤 보고한다.
- PHP 파일을 고쳤으면 `php -l`을 못 돌리니 **고친 줄을 보고서에 그대로 붙인다.**
- 화면 전/후 스크린샷(5-1)과 2회 과정 확인(5-2)은 **우동공과2가 테스트 서버에서 돌린다.** Cursor가 할 수 있는 만큼(빌드 산출물을 정적 미리보기로 열기 등)은 해도 되지만 필수는 아니다.

---

## 3. 수정

### 3-1. 등록점검 칸 이동 되살리기 (F1)

- 정본 `step-lesson.js`·`step-contact.js`의 각 칸 바깥 요소(`.form-group` 등)에 **main 마이페이지와 같은 이름**으로 `data-trc-field`를 붙인다. 상세등록 화면 모양은 바뀌지 않는다(속성만 추가).
- 최소 목록 (main `screens.js` 상세 폼 기준): `fee_basis`, `monthly_session_count`, `student_target`, `student_count_group`, `lesson_places`, `fee_description`, `university`, `major_name`, `university_status`, `feature_1`, `feature_2`, `feature_3`, `intro_long`(3-2에서 넣는 칸), `contact_time_note`(3-2), `profile_image`(지금처럼 embedded-panels).
- `intro` 항목: 등록점검이 `focus=intro`로 보내는 경우가 있으면 상세소개 칸으로 가게 한다. `registration-check-model.js`의 `TRC_FOCUS_FIELD`(105행 부근)에 `intro: 'intro_long'`을 넣거나, 상세소개 칸에 둘 다 찾히게 한다. 방법은 작업자가 정하고 보고한다.
- 칸을 찾으면 지금처럼 `is-rc-focus`로 강조하고 입력칸에 포커스가 간다(`screens.js` `scrollToTutorRcFocus`). 마이페이지 탭은 「불러오는 중」을 먼저 그렸다가 다시 그리므로, **다시 그린 뒤에도** 강조·포커스가 되는지 확인한다.

### 3-2. 상세소개·연락 가능 시간을 정본에 넣기 (F2, F3)

- `step-contact.js`에 두 칸을 **선택 입력**으로 넣는다.
  - 상세소개 `intro_long`: textarea. 라벨은 등록점검 쪽 문구 「상세 소개」(`registration-check-copy.js:109`)를 그대로 쓴다. 필수 표시(`*`, `form-label--required`, `p19-required`) 없음.
  - 연락 가능 시간 `contact_time_note`: input. 라벨 「연락 가능 시간」(main 마이페이지·`step-detail.js:174`와 같음). 필수 표시 없음.
  - 위치: 「학력·경력·특징」 묶음 아래, 「홍보 채널」 위. 라벨 문구는 새로 만들지 않는다.
- `form-collect.js`
  - `syncContactFromForm`이 `intro_long`도 읽는다.
  - `payloadForStep('contact')`가 `intro_long`·`contact_time_note`를 보낸다. 서버 `TutorRegisterService.php:619-621`이 contact 단계의 `intro_long`을 이미 받는다(변경 불필요할 것으로 봄, 확인 후 보고).
  - **F3 버그**: 두 칸이 폼에 생기면 「등록 완료」가 빈 값으로 덮지 않는다. 그래도 `syncContactForm`의 「폼에 없는 칸은 덮지 않는다」 보호는 남겨 둔다.
- 짧은 소개 `intro_short`는 넣지 않는다(0장 4번). 기존 값은 서버·DB에 그대로 두고 지우지 않는다.
- `monthly_session_count`(월 총 횟수): 정본 `step-lesson.js:108`에 이미 있다. 마이페이지 전용 칸이 아니므로 **위치는 그대로**, `data-trc-field`만 붙인다(3-1). 보고서에 「이미 정본에 있음」으로 적는다.

### 3-3. 소개문을 상세 완료 필수에서 빼기 (0장 5번)

| 쪽 | 파일:줄 (17b7cbeb) | 바꿀 것 |
|---|---|---|
| 서버 | `src/Tutor/TutorDetailCompletionEvaluator.php:55-56, 65, 78, 91` | `intro` 검사를 상세 완료 필수 목록에서 뺀다. `detail_missing`에 「소개문」이 더 이상 나오지 않는다. 다른 항목은 그대로 |
| 화면 | `home-ui/src/tutor-reg/registration-check-model.js:68-69, 85, 279-283` | `introOk`를 「상세 완료 필수」에 쓰지 않는다. 등록점검 상세 목록에서 「소개문」을 **선택 항목**으로 보이거나 뺀다. 문구는 기존 `TRC_COPY` 안의 것만 쓴다 |
| 화면 | `home-ui/src/tutor-reg/registration-check-copy.js:135` | `intro` 항목 처리 (선택 표시 또는 삭제). **`:79` `TRC_PRIME_FIELD_IDS`의 `intro_long`은 그대로 둔다** (3-6) |
| 화면 | `tutor-ui/src/form-collect.js:113-118` `validateIntroState` | 「소개문을 입력해 주세요」 강제를 상세등록 흐름에서 쓰지 않는다. 지금은 예전 `step-detail.js:235`에서만 쓴다. 지울지 둘지 보고 |

- DB 마이그레이션은 만들지 않는다. 이미 저장된 `detail_completion_status`는 다음 저장 때 다시 계산된다. 일괄 재계산이 필요하면 **하지 말고 보고**한다.

### 3-4. 마이페이지 안 문구·버튼·빈 상태 (F4, F5, F6)

- 옵션 함수에 `embed`(또는 `context: 'mypage'`)를 넘겨, 마이페이지에서는 아래를 **숨기거나 짧은 마이페이지 문구로 바꾼다.** 새 문구는 짧게 하고, 보고서에 원문 그대로 적는다.
  - `step-lesson.js:83` 1단계 안내 → 숨김. 또는 「수업·가격 정보를 고치고 저장하세요.」처럼 한 줄
  - `step-lesson.js:85` 주력과목 줄의 「· 마이페이지에서 수정」 → 「· 기본정보 탭에서 수정」 또는 숨김
  - `step-lesson.js:118` 「기본정보는 마이페이지에서 수정」 링크 → 숨김 (마이페이지 안이므로)
  - `step-contact.js:52` 마지막 단계 안내 → 숨김 또는 한 줄
  - **상세등록 화면(기본값) 출력은 지금과 바이트 단위로 같아야 한다.**
- 버튼 (디자인통일매뉴얼 003 §2·§2-1, 265 지시서 0장·2-0)
  - 탭 전체에 **강한 Primary는 하나만**: 맨 아래 「상세정보 저장」(`#266BC4`, 높이 44, 16px). 이 버튼 하나로 lesson → career → contact를 차례로 저장한다. 순서·중간 실패 처리는 작업자가 정하고 보고한다. 중간 실패면 다음 단계를 보내지 않고 오류를 보인다.
  - 각 묶음 중간 저장이 꼭 필요하면 톤다운 버튼(바탕 `#729FD9`, 글자 `#0B2545`, 높이 30, 14px/600, radius 6)으로만 둔다. 없애도 된다.
  - 하단 「등록점검」「마이프로필」 버튼을 main과 같은 자리·같은 이동으로 되살린다(main 하단 3버튼 구성). 톤다운 기준.
- 저장 성공 뒤 「저장되었습니다.」 안내를 되살린다(main은 `alert('저장되었습니다.')`). 기본정보 탭의 `basicSaveFlash`처럼 화면 안 안내로 해도 된다. 방법 보고.
- 「등록점검으로 돌아가기」(return=registration-check)로 들어왔을 때 저장 뒤 등록점검으로 돌아가는 지금 동작은 유지한다.
- **빈 상태 (F6)**: 등록이 없을 때(`tutorBlankPath('detail')`) 동작이 안 하는 폼을 보이지 않는다. main 빈 상태와 같은 안내(기본등록 먼저)와 이동 버튼을 보인다. main의 빈 상태 동작을 확인해 같게 하고 보고한다.

### 3-5. 레이아웃 (F7)

- 390: 가로 넘침 0 (`document.documentElement.scrollWidth === 390`). 라디오 카드는 **여러 줄로 접히고**, 글자가 한 자씩 끊기지 않는다(`white-space`·`min-width`·`flex-wrap` 등).
- 1280: 마이페이지 상세 탭 전체 길이가 **고치기 전(main, 2667px 기준, 같은 데이터)보다 크게 늘지 않아야 한다.** 새 칸 2개가 늘어난 만큼은 허용하고, 늘어난 px와 이유를 보고한다. 마이페이지 안(`.mp-room-embed.register-flow`)에서는 라디오를 **촘촘하게(compact)** 보인다.
- CSS는 **`.mp-room-embed.register-flow` 아래 범위로만** 고친다. 상세등록 화면 CSS에는 영향이 없어야 한다(상세등록 전/후 스크린샷 픽셀 차이 0).

### 3-6. 픽/프라임 검사를 약하게 만들지 않기 (0장 6번, t2235-6)

- **규칙: 가입 때 상세소개를 선택으로 바꾸는 것이 픽/프라임의 필수 검사·안내를 약하게 만들면 안 된다.**
  - `registration-check-copy.js:79` `TRC_PRIME_FIELD_IDS`(`intro_long`, `feature_2`, `feature_3`)와 `:76` `TRC_PICK_FIELD_IDS`는 **지우거나 줄이지 않는다.**
  - 등록점검 「프라임 노출까지 추가 입력」 목록에 상세소개가 비어 있으면 계속 나와야 한다.
  - `format.js` `getExposureMatrix`의 픽/프라임 표시가 상세 완료 조건 변경 때문에 소개문 없이 「신청 가능」으로 바뀌면 안 된다. 바뀌면 **멈추고 보고**한다. 고치는 방법은 종현 결정.
- 과외쌤 픽/프라임 **구매 차단**(0-2: 지금 없음)은 **이번에 만들지 않는다.** 보고서 「별도 항목」에 적는다.

---

## 4. 수정 후 (기대 결과)

- 등록점검의 상세 칸 링크가 전부 마이페이지 상세 탭의 해당 칸으로 가서 강조·포커스된다.
- 상세소개·연락 가능 시간이 상세등록 2단계와 마이페이지에 같이 있고, 비워도 저장된다.
- 상세등록 「등록 완료」가 연락 가능 시간을 지우지 않는다.
- 소개문이 없어도 상세 완료가 된다. 단, 프라임 추가 입력 안내에는 상세소개가 계속 나온다.
- 마이페이지 상세 탭: 가입용 안내 문구 없음, 강한 저장 버튼 1개, 하단 「등록점검」「마이프로필」, 「저장되었습니다」 안내, 빈 상태 안내.
- 390 가로 넘침 없음, 1280 길이 거의 같음.
- 상세등록 화면 모양은 새 칸 2개 말고는 그대로다.

---

## 5. 검수 (필수 — 하나라도 실패면 멈추고 보고)

### 5-1. 디자인 — 272 5-1과 같음 + 아래 추가

- 3화면 × 2폭(1280·390) × 전/후 = 12장, 전/후 나란히 비교 이미지. 「전」은 `98820df6`(main)과 `17b7cbeb` 둘 다.
- 실측 (`getBoundingClientRect`·`getComputedStyle`, 눈대중 금지):
  - 390 `scrollWidth`가 390
  - 1280 마이페이지 상세 탭 전체 높이 (전 2667px 대비 증감과 이유)
  - 강한 Primary 개수 = 1 (`#266BC4`·44·16px), 나머지 버튼 `#729FD9`/`#0B2545`·30·14px/600·radius 6
  - 같은 종류 칸 사이 간격 차이 0px
- 상세등록 1·2단계: 새 칸 2개 영역 말고는 전/후 픽셀 차이 0.
- **Cursor는 이 항목을 못 하면 「우동공과2 테스트 서버에서 확인 예정」으로 적는다.**

### 5-2. 전체 과정 확인 두 번 — 272 5-2와 같음 + 아래 추가 (**우동공과2가 테스트 서버에서 실행**)

- 새 계정 2개로 각각 따로: 가입 → 이메일 인증 → 기본등록 → 상세1 → 상세2 → 등록점검 → 마이페이지 상세 탭 수정 → 저장 → F5 → 다시 열기.
- 「이전」「다음」「나중에 하기」, 브라우저 뒤로 가기, L-02(상세1 이전 후 재진입, 마이페이지 다른 탭 갔다 오기).
- 추가 확인:
  1. 등록점검의 상세 링크마다(`focus=feature_2`, `intro`, `monthly_session_count`, `fee_description`, `lesson_places`, `university` 등) 칸을 찾아 강조·포커스되는지
  2. 상세소개·연락 가능 시간을 **비운 채** 저장 성공, **넣고** 저장한 뒤 F5에도 남음
  3. 상세등록 「등록 완료」 뒤 DB `contact_time_note`가 그대로 (F3)
  4. 홍보 채널(instagram·youtube 등)이 상세등록·마이페이지 저장 뒤에도 남음
  5. 마이페이지에서 고친 값이 상세등록에 보이고, 그 반대도 보임
  6. 「저장되었습니다」 안내, 하단 「등록점검」「마이프로필」 이동, 빈 계정(기본등록 전)의 상세 탭 안내
  7. `register.php` 요청마다 action/step·응답 코드·`detail_missing`(「소개문」이 없어야 함)
- **픽/프라임 회귀 확인 (t2235-6)**:
  - 상세소개·특징 2·3을 비운 계정으로 등록점검 「프라임 노출까지 추가 입력」에 「상세 소개」「특징 2」「특징 3」이 **나오는지**. 고치기 전(`98820df6`)과 같은지 비교
  - 픽 목록(`feature_1`, `student_target`)도 같음
  - 노출 매트릭스(`getExposureMatrix`)의 픽/프라임 표시 문구가 고치기 전과 같은 입력에서 같은지
  - `/plans` 구매 화면에서 과외쌤 픽/프라임 안내·차단이 고치기 전과 같은지 (0-2: 지금은 차단 없음 → 그대로 없어야 함, 더 약해지면 실패)
- 회차마다 표로 따로 보고한다(272 5-2 표 형식).

### 5-3. CI·빌드 (**Cursor 필수**)

- `home-ui`·`tutor-ui` 각각 `npm run build` 통과.
- `npm run verify:tutor-mypage-frame-ia`, `npm run verify:tutor-lesson-optional-step` 통과 (워크플로 `tutor-mypage-frame-ia.yml`, `tutor-lesson-step-gate.yml`).
- `npm run verify:tutor-registration-check-frame` **통과** (main처럼).
- `npm run verify:tutor-basic-required`: 이번 변경 때문에 생긴 실패 0건. main에서 원래 실패하던 11건은 그대로 두되, 목록을 보고서에 붙인다. 원래 실패를 고치는 것은 이번 범위가 아니다.
- `npm run verify:tutor-register-same-tab`, `verify:tutor-mypage-route-integrity`, `verify:tutor-inquiries-settings`, `verify:tutor-signup-seed` 통과 유지.
- 끝으로 아래 명령을 돌려 출력을 붙인다.

```bash
git diff --stat 17b7cbeb..HEAD
git diff --name-only 98820df6..HEAD
rg -n "renderDetailForm|saveTutorDetailInline|FEE_BASIS_OPTS|GENDER_GROUP_OPTS|STUDENT_COUNT_OPTS" preview/home-ui/src/tutor-reg   # 0건
rg -n "data-trc-field" preview/tutor-ui/src/screens/step-lesson.js preview/tutor-ui/src/screens/step-contact.js
rg -n "intro_short" preview/tutor-ui/src/screens   # 새로 생긴 줄 0건
rg -n "TRC_PRIME_FIELD_IDS|TRC_PICK_FIELD_IDS" preview/home-ui/src/tutor-reg/registration-check-copy.js   # 값 변경 없음
```

---

## 6. 금지 범위

1. **허용 파일(7장) 밖 수정 금지.**
2. 서버는 `TutorDetailCompletionEvaluator.php`의 소개문 조건 한 가지만. 필요하면 `TutorRegisterService.php`의 contact 단계 `intro_long`·`contact_time_note` 받기만. 그 밖의 PHP·DB·마이그레이션·토큰 변경 금지.
3. 상세등록 화면 모양·동작 변경 금지. 새 칸 2개, `data-trc-field` 속성, F3 버그 수정만 예외.
4. 짧은 소개(`intro_short`) 새로 만들기 금지. 라벨 새로 만들기 금지(3-4 마이페이지 짧은 문구만 예외, 원문 보고).
5. 픽/프라임 목록(`TRC_PICK_FIELD_IDS`·`TRC_PRIME_FIELD_IDS`)·구매 화면(`plans/*`)·결제 서버 변경 금지.
6. 기본정보 탭, 공부방·학생 화면 금지.
7. `git add -A` 금지(파일 이름으로 add). amend·rebase·**force-push 금지**. `main` 병합·배포 금지.

---

## 7. 허용 파일

| # | 파일 | 바뀔 것 |
|---|---|---|
| 1 | `preview/tutor-ui/src/screens/step-lesson.js` | `data-trc-field`, 마이페이지용 문구 숨김 옵션, 저장 버튼 정리 |
| 2 | `preview/tutor-ui/src/screens/step-contact.js` | 상세소개·연락 가능 시간 칸(선택), `data-trc-field`, 마이페이지 옵션, 저장 버튼 정리 |
| 3 | `preview/tutor-ui/src/form-collect.js` | `intro_long` 읽기·보내기, `validateIntroState` 정리 |
| 4 | `preview/tutor-ui/src/state.js` | `intro_long`·`contact_time_note` 초기값 (필요할 때만) |
| 5 | `preview/home-ui/src/tutor-reg/embedded-panels.js` | 저장 버튼 1개·순차 저장, 하단 버튼, 저장 안내, 빈 상태, 포커스 재적용 |
| 6 | `preview/home-ui/src/tutor-reg/screens.js` | 빈 상태 연결, 포커스 재적용, 저장 안내 연결 |
| 7 | `preview/home-ui/src/tutor-reg/registration-check-model.js` | `introOk` 필수 제외, `TRC_FOCUS_FIELD`에 `intro` |
| 8 | `preview/home-ui/src/tutor-reg/registration-check-copy.js` | `intro` 항목(`:135`)만. **`:76`·`:79` 목록 변경 금지** |
| 9 | `src/Tutor/TutorDetailCompletionEvaluator.php` | 소개문 필수 조건 제거 (이것만) |
| 10 | `src/Tutor/TutorRegisterService.php` | contact 단계 `intro_long`·`contact_time_note` 받기 (확인 결과 필요할 때만) |
| 11 | `preview/home-ui/src/styles/mypage-ops.css` | `.mp-room-embed.register-flow` 아래 라디오 접힘·compact·버튼 |
| 12 | `preview/home-ui/src/styles/home-member-flows.css` | 같은 범위 (해당 규칙이 이 파일에 있을 때만) |
| 13 | `scripts/verify-tutor-registration-check-frame.mjs` | 새 구조(정본 폼의 `data-trc-field`)에 맞추기 |
| 14 | `scripts/verify-tutor-basic-required.mjs` | `renderDetailForm` 대신 정본·embedded-panels 기준으로 맞추기. 검사를 약하게 하지 않는다 (상세 칸·프로필 사진 검사 유지) |
| 15 | `e2e/helpers/mypage-flow.js` | 선택자만 (필요할 때만) |

- `preview/shared/register-flow.css`, `register-form-primitives.css`, `preview/tutor-ui/src/styles/register.css` 등 **상세등록 화면에 영향이 가는 CSS는 허용 밖.** 필요하면 멈추고 보고.
- 그 밖의 파일(`profile-photos.js`, `plans/*`, `format.js`, `registration-check-render.js`, 다른 PHP, `scripts/verify-*` 나머지)이 필요하면 **멈추고 보고**(8장).

---

## 8. 멈추고 보고할 때

1. 허용 파일 밖을 고쳐야 할 때.
2. 상세등록 화면 모양·동작이 3-2·3-1 예외 말고 조금이라도 바뀔 때.
3. 5-1에서 고치기 전보다 나빠졌을 때 (390 넘침, 1280 길이 크게 늘어남, 강한 버튼 2개 이상).
4. 저장값이 지워지거나(홍보 채널·연락 가능 시간·상세소개) 저장 뒤 캐시가 갱신되지 않을 때.
5. **픽/프라임 필수 검사·안내가 약해질 때** (3-6). 예: 프라임 추가 입력에서 상세소개가 빠짐, 노출 매트릭스가 소개문 없이 「신청 가능」으로 바뀜.
6. 상세 완료 조건 변경 때문에 기존 데이터 일괄 재계산이나 마이그레이션이 필요해 보일 때.
7. CI(5-3)가 실패할 때.
8. 시작 조건(1장)이 안 맞을 때.

---

## 9. 작업 순서와 커밋 나누기

1. 시작 조건(1장).
2. 커밋을 논리 단위로 나눈다 (예시, 번호는 이어서):
   - `272-4 fix(tutor-ui): 상세 칸에 등록점검 이동 표시를 붙인다` (1·2번 파일)
   - `272-5 feat(tutor-ui): 상세소개·연락 가능 시간을 상세등록 2단계 선택 칸으로 넣는다` (2·3·4번, F3 포함)
   - `272-6 fix(tutor): 소개문을 상세 완료 필수에서 뺀다` (7·8·9번, 필요 시 10번)
   - `272-7 fix(mypage): 상세 탭 문구·저장 버튼·하단 버튼·저장 안내·빈 상태를 맞춘다` (1·2·5·6번)
   - `272-8 style(mypage): 상세 탭 라디오 접힘·촘촘하게` (11·12번)
   - `272-9 test: 등록점검·기본필수 검증 스크립트를 새 구조에 맞춘다` (13·14번, 필요 시 15번)
3. 빌드 → 검증 스크립트(5-3) → 파일 이름으로 `git add` → 커밋 → `git push origin cursor/272-tutor-detail-unify` (force 없이).
4. **push 후 멈춤.** 5-1·5-2 화면·과정 확인은 우동공과2가 테스트 서버에서 한다.

---

## 10. 완료 보고 형식

1. **커밋**: 브랜치 이름, 새 커밋 해시 전부(순서대로), 시작 기준 `17b7cbeb`.
2. **바뀐 파일:줄**: 파일별 추가/삭제 줄 수. PHP는 고친 줄 원문.
3. **결정 사항**: 3-1 `intro` 포커스 방법, 3-3 `validateIntroState` 처리, 3-4 순차 저장·실패 처리, 마이페이지 문구 원문, 저장 안내 방식, 빈 상태 처리, `monthly_session_count` 위치(「이미 정본 step-lesson에 있음」 확인).
4. **CI 결과**(5-3): 각 명령 출력 요약, `verify:tutor-basic-required` 남은 실패 목록(main 기존 11건과 비교).
5. **픽/프라임 확인**(3-6): `TRC_PICK_FIELD_IDS`·`TRC_PRIME_FIELD_IDS` 변경 없음 확인, `getExposureMatrix` 영향 분석.
6. **별도 항목 (종현 결정 필요)**: 「과외쌤 픽/프라임 신청·구매 때 상세소개 등 필수 차단·안내 없음 (`plans/screens.js:523`, `ProviderCheckoutService.php` 검사 없음). 공부방은 `plans/screens.js:500-507`에서 상세 완료로 차단.」
7. 범위 확인 문장: 「7장 밖 파일, 그 밖의 서버·DB, 토큰, 기본정보 탭, 공부방·학생 화면, 픽/프라임 목록·구매 화면은 건드리지 않았습니다.」
8. 상태: push까지 했고 병합·배포는 하지 않았다. 5-1·5-2는 우동공과2 테스트 서버 확인 대기.
