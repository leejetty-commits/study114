# 15. 공부방 마이페이지 — 비밀번호 실패 안내, 홍보지역 2·3 지우기, 경력 최소 1, 계정 이름 문구

기준: `origin/main` `410588ab` (PR #250 뒤). 작성: 우동공과3(검수). 코드 변경 없음. 문서만.
PR만 연다. 머지 금지. 11-18 종현 결정(1·2·3·5) 반영.

**수업 그룹별 월 수업료를 숫자+천원으로 바꾸는 일은 이 문서가 아니라 15b**에서 한다. 스키마·기존 서술 값·공개 화면이 걸려 범위가 넓다. 15b는 **이 15 PR이 머지되고 운영 확인이 끝난 뒤** 시작한다(`StudyRoomRegisterService.php`를 이어서 고친다).

## 0단계 (필수) — 먼저 진단하고 보고. 고치기 전에.

1. `git fetch origin && git switch -c work/study-room-mypage-fixes origin/main` 뒤 `git rev-parse --short HEAD`를 적는다. `410588ab`가 아니어도, 최신 main이면 그 해시를 적고 진행한다. 아래 줄 번호가 다르면 같은 함수를 찾아 보고하고, 의미가 달라졌으면 멈추고 보고한다.
2. 아래 「지금 구조」의 함수·줄을 직접 열어 그대로인지 확인한다. 특히:
   - `preview/home-ui/src/mypage/screens.js` 1233행 `PASSWORD_RULE_HINT`, 1352~1362행 `validatePassword`(email·name·phone을 빈 값으로 넘김), 1390~1401행 `data.message || \`변경 실패 (HTTP ${res.status})\``
   - `src/Auth/PasswordPolicy.php` 38~99행, `PasswordChangeService.php` 51~72행, `public/api/auth/password/change.php` 54~60행(422 + `message`)
   - `preview/shared/study-room-basic-form.js` `renderPromoSlot()` 172~176행(툴바에 제목·대표만, 지우기 없음), 358~360행 안내, 191~198행 readonly 주소칸, `collectStudyRoomBasicFields` 774~793행, `validateStudyRoomBasicFields` 852행
   - `src/StudyRoom/StudyRoomRegisterService.php` `syncSavedRegions` 1087~1191행(1101행 `DELETE` 후 빈 칸 `continue`, 1189행 홍보1 필수), `saveCareer` 948~991행, `optionalInt` 2519~2531행(하한 없음)
   - `preview/study-room-ui/src/screens/step-facility.js` 112~117행 `type="number"`만 있고 `min` 없음
   - `preview/home-ui/src/mypage/screens.js` 계정 설정: 1074행 눈썹 「사이트에 보이는 이름」, 1076행 안내 「표시명·집주소·로그인·보안을 한곳에서 관리합니다.」, 1079행 토스트 「사이트 표시명이 저장되었습니다.」, 1086~1087행 카드 제목 「표시 정보」·설명, 1092행 라벨 「사이트 표시명」, 1095행 「표시명 수정」, 1100행 필드 라벨 「사이트 표시명」, 1102행 기존 힌트, 1106행·1686행 「표시명 저장」, 1648행 「사이트 표시명은 2자 이상이어야 합니다.」. `name="display_name"`, `#mypage-display-name`, `data-action="toggle-display-name"`, `data-form="change-display-name"`, 세션 키 `study114.displayName.justSaved`는 그대로인지 확인한다.
3. 고칠 줄 목록(파일:함수:줄)과 홍보 2·3 차단 문구, 계정 이름 문구 대응표를 **먼저 보고**한다.
4. 문서와 다르거나, 애매하거나, **허용 파일 밖을 고쳐야 할 것 같으면 멈추고 보고한다. 고치지 않는다.**

## 목적 (11-18 종현)

- 비밀번호 변경이 규칙에 걸려도 「변경 실패 (HTTP 422)」처럼 번호가 보인다. **규칙은 그대로** 두고, 실패는 한글 안내만 보여 준다.
- 홍보지역 1은 필수, 2·3은 선택인데 한 번 넣은 2·3을 지울 수 없다. **지우기**를 2·3에만 둔다. 그 칸에 **이용 중인 프라임·픽 구독** 또는 **프라임 예약대기**(상태가 `registered`·`notified`)가 있으면 화면과 서버 모두 막는다.
- 상세정보2 교습경력·학원경력에 마이너스를 넣을 수 있다. **값이 있을 때만 최소 1.** 빈 칸은 그대로 허용. 1을 미리 채워 넣지 않는다.
- 계정 설정의 「사이트 표시명」이 와 닿지 않는다. 화면에 보이는 글자만 「내 계정 이름」으로 바꾼다. API·필드 이름·키는 그대로다.

## 지금 구조 (직접 읽음, `410588ab`)

### A. 비밀번호 변경

- 화면: 마이페이지 로그인 관리 → 비밀번호 변경. 규칙 안내는 이미 있다: 「8~14자 · 영문, 숫자, 특수문자 포함 · 쉬운 비밀번호 사용 불가」(`password-policy.js` `PASSWORD_RULE_HINT`, `screens.js` 1233행).
- 제출 전 클라이언트 검사 `validatePassword`. 숫자만 넣으면 「영문, 숫자, 특수문자를 모두 포함해 주세요.」로 막혀야 한다.
- API: `POST /api/auth/password/change.php` → `PasswordChangeService` → `PasswordPolicy`. 실패는 HTTP 422와 `message`. 영문·숫자·특수 부족은 「영문, 숫자, 특수문자를 모두 포함해 주세요.」, 휴대폰 뒤 4자리·이름·이메일 금칙은 「사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.」(SSOT 9장: 금칙 상세는 사용자에게 노출하지 않음).
- 화면은 `data.message`가 있으면 그 글을 쓰고, JSON을 못 읽으면 `변경 실패 (HTTP ${res.status})`를 보여 준다(`screens.js` 1389~1401). 이 번호 문구만 없앤다.
- `PasswordPolicy.php`·`password-policy.js`의 **규칙은 한 줄도 바꾸지 않는다.**

### B. 홍보지역 2·3

- 안내: 「1번은 필수, 2·3번은 선택」. 슬롯 툴바에 지우기가 없고, 주소칸은 readonly라 다른 주소로만 바꿀 수 있다.
- 저장 API는 이미 비울 수 있다. `syncSavedRegions`가 `study_room_regions`를 모두 지운 뒤 채워진 칸만 다시 넣는다. 빈 2·3은 행을 만들지 않는다. 홍보1이 없으면 거절. `region_id`는 NOT NULL이라 빈 행을 INSERT하면 안 된다.
- 검색 목록은 홍보 1·2·3 행으로 매칭한다. 2·3을 지우면 그 지역 목록에서 카드가 빠진다. 카드 「위치」는 홍보1이라 라벨은 안 바뀐다.
- 공부방 프라임·픽은 `provider_position_subscriptions`에 지역이 묶여 있고, 프라임 예약대기는 `study_room_exposure_waitlists`(`payment_status`가 `registered`·`notified`면 유효). `syncSavedRegions`는 지금 이것을 보지 않는다. 지운 뒤에도 구독 행은 남지만, 그 지역 목록에는 안 나와 유료 노출이 끊긴다.
- 10km 거리 제한은 홍보 2·3 저장 검사에 없다. 이번 범위도 아니다.

### C. 교습경력·학원경력

- 마이페이지 상세정보2는 `study-room-ui` `step-facility.js` 폼을 그대로 쓴다(`study-room-reg/embedded-panels.js`가 불러 옴). `type="number"`만 있고 `min`이 없다.
- 서버 `optionalInt`는 빈 값만 null, `(int)`만 해서 음수도 통과한다. 스키마는 `SMALLINT UNSIGNED NULL`. 0=신입 규정은 없다. 빈 값(null)은 선택 항목이다.

### D. 계정 설정 「사이트 표시명」 문구 (`410588ab` `screens.js`)

마이페이지 → 계정/설정. 사용자가 보는 글자만 해당한다.

| 위치 | 지금 | 바꿀 글자 |
|---|---|---|
| 안내(1076) | 표시명·집주소·로그인·보안을 한곳에서 관리합니다. | 계정 이름·집주소·로그인·보안을 한곳에서 관리합니다. |
| 저장 토스트(1079) | 사이트 표시명이 저장되었습니다. | 내 계정 이름이 저장되었습니다. |
| 요약 라벨(1092) | 사이트 표시명 | 내 계정 이름 |
| 버튼(1095) | 표시명 수정 | 이름 수정 |
| 필드 라벨(1100) | 사이트 표시명 | 내 계정 이름 |
| 저장 버튼(1106, 1686행 복구) | 표시명 저장 | 이름 저장 |
| 클라이언트 오류(1648) | 사이트 표시명은 2자 이상이어야 합니다. | 내 계정 이름은 2자 이상이어야 합니다. |

같은 폼의 저장 버튼·짧은 오류도 「표시명」이 남아 있으면 어색해서 같이 바꾼다.

이번엔 그대로 둔다: 1074행 「사이트에 보이는 이름」, 1086행 「표시 정보」, 1087행 카드 설명, 1102행 「예: 카카오 과외쌤, 종현 과외쌤 — 2~50자 · 이메일 형태 불가」.

힌트를 **추가**한다(기존 2~50자 힌트는 남김): 「상단 「로그인: ○○○」 표시와 인사말에만 보여요. 공부방명·과외쌤 이름은 등록 정보에서 바꿔요.」

`name="display_name"`, `id="mypage-display-name"`, `data-*`, 세션 키, `POST /api/auth/profile.php` 요청 본문 키는 바꾸지 않는다.

서버(`ProfileDisplayNameService.php`, `public/api/auth/profile.php`) 문구는 이번 범위가 아니다. 서버가 거절하면 옛 「사이트 표시명」 문구가 그대로 보일 수 있다.

#### 검사 스크립트 (직접 검색, `410588ab`)

아래 **정확한 화면 문구**를 `scripts/`에서 찾아 보면 **한 파일도 없다.** `사이트 표시명`, `표시명 수정`, `표시명·집주소`, `사이트 표시명이 저장되었습니다.`, `표시명 저장`.

관련 있는 검사:
- `scripts/verify-input-fill-rule.mjs` H5(566~578행): 선택자 `[data-form="change-display-name"]`, `#mypage-display-name`만 쓴다. **이 선택자·id를 바꾸면 실패한다.** 테스트 제목에 「표시명」이 있어도 화면 글자는 검사하지 않는다.
- `scripts/verify-tutor-basic-required.mjs` 469행: 과외쌤 기본정보의 `표시명</span>`을 본다. **계정 설정과 다른 화면**이다. 과외쌤 파일은 고치지 않는다.
- 그 외 verify의 「표시명」은 주석, 테스트 제목, 또는 `tutor_display_name` 같은 필드 이름이다. 이번 문구 변경과 무관하다.

## 바꿀 것

### A. 비밀번호 실패 안내 (`preview/home-ui/src/mypage/screens.js`만)

1. 1391행 `throw new Error(data.message || \`변경 실패 (HTTP ${res.status})\`);`를 고친다. `data.message`가 있으면 그대로 쓰고, 없으면 「비밀번호를 변경하지 못했습니다. 규칙을 확인해 주세요.」처럼 한글만. HTTP 번호·상태 코드를 사용자에게 보여 주지 않는다.
2. 이미 있는 규칙 안내(`PASSWORD_RULE_HINT`)와 제출 전 `validatePassword`는 그대로.
3. `password-policy.js`, `PasswordPolicy.php`, `PasswordChangeService.php`, `change.php`는 수정 금지.

### B. 홍보지역 2·3 지우기 + 유료/대기 차단

#### B-1. 화면 (`preview/shared/study-room-basic-form.js`)

1. `renderPromoSlot()` 툴바: **idx가 1 또는 2**(홍보 2·3)이고 칸에 값이 있을 때만 「지우기」 버튼을 둔다. 홍보1(idx 0)에는 넣지 않는다. 기존 버튼 클래스만 쓴다(`btn btn--ghost btn--sm` 등). **새 CSS 파일·공용 CSS·`mypage-ops-register.css`는 금지.**
2. 지우기를 누르면:
   - 그 칸에 이용 중인 프라임·픽 또는 유효 예약대기가 있으면 칸을 비우지 않고, 슬롯 아래 빨간 글자로 알린다. 예: 「이 홍보지역에는 이용 중인 프라임 또는 픽이 있어 지울 수 없습니다. 기간이 끝난 뒤에 지울 수 있습니다.」 / 「이 홍보지역에는 프라임 예약대기가 있어 지울 수 없습니다. 대기를 취소한 뒤에 지울 수 있습니다.」 둘 다 해당하면 구독을 먼저 알린다.
   - 없으면 그 칸의 표시·숨은 값(`region_id`, `complex_id`, 주소·라벨 등)을 모두 비운다. 기준(행정동/단지) 선택은 기본값으로 되돌린다. 홍보1·다른 칸·사업장주소는 건드리지 않는다.
3. 유료/대기 확인은 **이미 있는 API만** 쓴다. `preview/home-ui/src/paid-api.js`의 `fetchPaidStatus`·`fetchPrimeWaitlist`를 import 해서 가져와도 된다. **`paid-api.js` 자체는 수정 금지.**
   - 구독: `exposure.positions`에서 `provider_type === 'study_room'`이고 이 공부방 id이며 `sku`가 `prime` 또는 `pick`인 행. 단지는 `complex_id`, 행정동은 `region_id`(단지가 아닌 행)로 이 칸과 맞춘다.
   - 대기: `fetchPrimeWaitlist(roomId)`의 목록에서 `payment_status`가 `registered` 또는 `notified`이고 같은 지역인 행.
   - API를 못 받아 판단을 못하면 칸을 비우지 말고 「지금 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.」를 보여 준다. 서버가 최종으로 막는다.
4. 저장은 지금처럼 빈 2·3을 그대로 보낸다. 클라이언트 검사(홍보1 필수)는 그대로.

#### B-2. 서버 (`StudyRoomRegisterService.php` `syncSavedRegions`)

1. **`DELETE` 하기 전에** 지금 DB의 홍보 2·3 행과, 이번 요청에서 채워질 칸을 비교한다. 기존 2·3이 새 목록에 없으면(지우기 또는 다른 지역으로 바꿈) 그 지역에 대해:
   - `provider_position_subscriptions`: `provider_type='study_room'` AND `provider_id=이 공부방 id` AND `sku_code IN ('prime','pick')` AND `CURDATE() < end_exclusive_on`, 지역은 단지=`complex_id`, 행정동=`region_id`(단지 아님).
   - `study_room_exposure_waitlists`: `study_room_id=이 공부방 id` AND `payment_status IN ('registered','notified')`, 같은 지역 맞춤.
2. 하나라도 있으면 `InvalidArgumentException`으로 저장을 거절한다. 문구는 화면과 같은 한글. 트랜잭션이 있으면 롤백되어야 한다(지금 `saveStep` 흐름 유지).
3. 해당이 없으면 지금처럼 DELETE 후 채워진 칸만 INSERT. 홍보1 필수·빈 칸 행 안 만들기 규칙은 그대로.
4. 새 API·새 PHP 클래스는 만들지 않는다. 위 테이블을 이 함수 안에서 조회한다. `src/Paid/**` 파일은 수정 금지.

### C. 교습경력·학원경력 최소 1

1. `preview/study-room-ui/src/screens/step-facility.js` 112~117행: 두 칸에 `min="1"` `step="1"`. `required`는 넣지 않는다. 기본값 1을 value에 미리 넣지 않는다. 라벨은 그대로.
2. `StudyRoomRegisterService.php` `saveCareer`: `career_years`·`academy_career_years`는 빈 값이면 지금처럼 null. 값이 있는데 1 미만(0, 음수)이면 거절. 예: 「교습경력은 1 이상 입력해 주세요.」 / 「학원경력은 1 이상 입력해 주세요.」 `optionalInt` 공용 함수 자체를 바꾸면 다른 칸에 영향이 있으니, 경력 두 칸만 따로 검사한다.

### D. 계정 이름 문구 (`preview/home-ui/src/mypage/screens.js`만, 보이는 글자만)

1. 위 대응표대로 바꾼다. 저장 버튼은 1106행과 저장 후 1686행 `submitBtn.textContent = '표시명 저장'`을 함께 「이름 저장」으로 맞춘다.
2. 필드 라벨 아래(기존 2~50자 힌트 **위 또는 아래**, 기존 힌트는 삭제하지 않음)에 힌트를 추가한다.
   `상단 「로그인: ○○○」 표시와 인사말에만 보여요. 공부방명·과외쌤 이름은 등록 정보에서 바꿔요.`
3. `name`, `id`, `data-action`, `data-form`, 세션 키, fetch URL, JSON 키 `display_name`은 그대로. 이 폼 저장 실패 폴백(1668행)에 HTTP 번호가 있으면 1번과 같이 한글만 쓴다.
4. `src/Auth/**`, `public/api/auth/profile.php`, SSOT 문서는 수정 금지.

## 허용 파일 (이것만)

1. `preview/home-ui/src/mypage/screens.js` — 비밀번호 실패 문구(A)와 계정 이름 화면 문구(D)만
2. `preview/shared/study-room-basic-form.js` — 홍보 2·3 지우기·유료/대기 안내(B-1)만
3. `src/StudyRoom/StudyRoomRegisterService.php` — `syncSavedRegions` 저장 전 차단(B-2)과 `saveCareer` 경력 하한(C)만. 다른 메서드 금지
4. `preview/study-room-ui/src/screens/step-facility.js` — 경력 두 칸 `min`/`step`만
5. 기록 1개: `docs/worklog/2026/11/2026-11-18-study-room-mypage-fixes.md` (수락 캡처 경로 포함)

## 금지

- **모든 `main.js`.**
- `preview/tutor-ui/**`, `preview/home-ui/src/tutor-reg/**`(특히 `embedded-panels.js`, `screens.js`).
- `preview/home-ui/src/styles/mypage-ops-register.css`와 지시서 14·14b 허용 파일.
- `preview/shared/*.css`, `password-policy.js`, `src/Auth/**`(표시명 서버 문구 포함), `public/api/auth/password/**`, `public/api/auth/profile.php`, `src/Paid/**`, `preview/home-ui/src/paid-api.js`(import만 허용).
- 수업 그룹 교습비·`step-lesson.js`·스키마(그건 15b).
- 비밀번호 규칙 완화, 테스트 계정 비밀번호를 문서·채팅·커밋에 적기, 운영 SQL 실행.

## 위험

| 위험 | 막는 법 |
|---|---|
| 홍보1을 지움 | 버튼은 2·3만. 서버는 홍보1 없으면 지금처럼 거절. |
| 유료 지역을 지워 노출이 끊김 | 화면과 서버 모두 차단. 서버는 DELETE 전에 검사. |
| 주소 검색으로 유료 지역을 바꿈 | 서버는 빠지는 2·3을 같이 막는다. 저장 실패 문구를 보여 준다. |
| `optionalInt`를 바꿔 다른 칸이 깨짐 | 경력 두 칸만 별도 검사. |
| 과외쌤 마이페이지(14)가 바뀜 | 과외쌤 파일·`mypage-ops-register.css` 금지. 수락에서 과외쌤 메뉴 확인. |
| paid-api 응답 모양이 문서와 다름 | 0단계에서 응답 키를 확인하고, 다르면 멈추고 보고. |
| 계정 이름 선택자를 바꿔 입력칸 색 검사가 실패 | `#mypage-display-name`, `[data-form="change-display-name"]` 유지. `verify-input-fill-rule` H5를 돌린다. |
| 과외쌤 「표시명」 기본정보 검사가 실패 | 과외쌤 파일·`tutor_display_name` 화면은 손대지 않음. |

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 공부방·과외쌤·학생 계정으로, **일반 창과 시크릿 창**에서 보이는 메뉴를 모두 누른다.
2. 비밀번호: 규칙에 안 맞는 새 비밀번호(예: 숫자만, 또는 영문 없는 값)로 저장 → 한글 안내만 보이고, `HTTP`·`422` 숫자가 안 보인다. 규칙 안내 문장은 그대로. **실제 비밀번호·전화번호를 채팅·PR에 적지 않는다.** 성공 저장은 검사 계정으로만, 운영 심사 계정의 비밀번호는 바꾸지 않는 것이 좋다.
3. 홍보 2·3에 값이 있는 공부방: 지우기 → 칸이 비고, 저장 뒤 다시 열면 비어 있다. 홍보1은 지우기 버튼이 없다. 홍보1만 남긴 채 저장이 된다. 찾기·홈에서 지운 지역 목록에 안 나오고, 대표 위치 글자는 홍보1 그대로다.
4. 홍보 2 또는 3에 이용 중인 프라임·픽 또는 예약대기가 있으면: 지우기를 눌러도 칸이 남고 한글 안내가 보인다. 저장으로 비워도 서버가 같은 취지의 한글로 거절한다. (해당 구독이 있는 계정으로. 없으면 PR에 「해당 계정 없음」을 적고, 서버 분기는 코드 검토·로컬로 확인했다고 적는다.)
5. 상세정보2: 교습경력·학원경력에 -1·0을 넣고 저장하면 거절. 빈 칸은 저장된다. 1 이상은 저장되고 다시 열면 같다. 마이페이지와 공부방상세등록 화면을 모두 본다(같은 `step-facility.js`).
6. 계정/설정(공부방·과외쌤·학생, 일반·시크릿): 「내 계정 이름」「이름 수정」「계정 이름·집주소…」가 보이고, 「사이트 표시명」「표시명 수정」은 이 화면에 없다. 힌트 「상단 「로그인: ○○○」 표시와 인사말에만 보여요. 공부방명·과외쌤 이름은 등록 정보에서 바꿔요.」가 있다. 기존 2~50자 힌트도 있다. 이름을 저장하면 「내 계정 이름이 저장되었습니다.」 토스트. 상단 「로그인: ○○○」이 새 이름과 같다. 공부방명·과외쌤 등록 이름은 그대로다. 1자만 넣고 저장하면 「내 계정 이름은 2자 이상이어야 합니다.」
7. 빌드 `npm run build:dothome`. Verify bundle은 지금 실패 중인 4건 말고 새 실패가 없어야 한다. `verify-input-fill-rule` H5(계정 표시명 입력칸 색)가 작업 전과 같아야 한다.
8. **마지막 확인:** `git diff --stat origin/main...HEAD`에 위 허용 파일만 나와야 한다. 다른 파일이 보이면 PR을 열지 말고 멈추고 보고. 결과를 PR 본문에 붙인다.
9. PR 본문에 0단계 보고, 계정별 표(통과/실패, 캡처 경로). 비밀번호는 적지 않는다.

## 다음

- 15b(`15b-study-room-class-fee-cheonwon.md`): 수업 그룹별 월 수업료를 숫자+천원으로. **이 15가 머지되고 운영 확인이 끝난 뒤에만** 시작한다. 그 전에 종현이 15b 문서의 읽기 전용 SQL로 기존 값을 본다.

## Cursor 한 줄 명령

`최신 origin/main에서 docs/worklog/grok-sync/reapply-2026-11-17/15-study-room-mypage-fixes.md 그대로 실행. 먼저 0단계 진단을 보고하고, 애매하거나 허용 파일 밖을 고쳐야 하면 멈추고 보고해. 모든 main.js, tutor 파일, mypage-ops-register.css, 지시서 14 파일, Auth/비밀번호 규칙, profile.php, 교습비(15b) 수정 금지. 계정 설정은 보이는 글자만 바꾸고 name·id·data·API 키는 그대로. 수락을 공부방·과외쌤·학생 계정으로 일반·시크릿 창에서 확인하고, git diff --stat에 허용 파일만 있는지 확인한 뒤 PR만 올려줘. 머지는 하지 마.`

## 되돌리기

`git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
