# 127 · 상태 어휘 감사 (공개/숨김/작성 중/심사 · draft|pending|published|hidden)

- 작성: 2026-09-25 04:33 KST (read-only · study114 @ `D:\work\study114` · HEAD `8eaf74d`)
- 범위: UI 문자열 · PHP/SQL 필터 · 쪽지 수신 · 게스트 블라인드 · 122 지도 COUNT 권고
- 저장소 **미수정**. 본 문서와 122·125 정정 노트만 box docs에 기록.

## 한 줄 결론 (비개발자용)

- 손님(게스트) 홈·찾기 화면에는 **「숨김」「공개중」「작성 중」「심사」라는 말이 안 나옵니다.**
- 「숨김」은 **내 등록(마이페이지) 관리 화면·유료상품 구매 가드·관리자(A28)** 쪽에 버튼/탭/안내로 남아 있습니다. 손님 블라인드(이름 가리기)와는 **다른 말**입니다.
- 쪽지 설정 UI는 **받음 / 안받음**(또는 「쪽지 받는 중」)이며, 여기에 「숨김」은 없습니다.
- 심사(승인·반려) **흐름은 없습니다.** 코드/문서에 “쓰지 말 것”으로만 남아 있습니다.
- 지도 박스 COUNT는 「공개/숨김」 말로 쓰지 말고, **「가입 필수항목이 채워져 목록에 나오는 등록」** 개수로 잡는 것이 맞습니다. (아래 C)

---

## (A) 사용자-facing vs 내부 전용

| 말 | 손님 홈·찾기 | 내 등록/마이페이지 | 관리자(A28) | DB/코드 내부 |
|---|---|---|---|---|
| `draft` / `pending` / `published` / `hidden` | 화면에 영문 안 보임 | 배지·탭에 한글 라벨로 매핑됨 | 필터·버튼 값으로 사용 | ENUM 컬럼 값 (레거시 잔존) |
| 「저장」「저장중」 | ✕ | ○ (`lifecycle-copy` · 탭 「저장」) | labs 「비공개」 등 | `draft`/`pending`→「저장중」 |
| 「공개중」「공개」 | ✕ (찾기 UI에 상태 배지 없음) | ○ (탭·배지·「N개 공개 중」) | ○ | `published` |
| 「숨김」 | **✕** | **○** (탭·버튼·확인창·「숨김 상태」) | **○** | `hidden` + 주석 |
| 「작성 중」「작성중」 | **문자열 없음** | 근접: 「작성 이어가기」 | ✕ | 가입 이어하기는 「이어서 입력하기」 등 |
| 「심사」 | ✕ (금지어 목록) | 금지어·각주(“심사 없음”) | 빨간줄 안내(“심사처럼 보이지 말 것”) | 플로우 없음 |
| 쪽지 「받음/안받음」 | 카드에 「쪽지 받는 중」류 | ○ 라디오 「받음」「안 받음」 | — | `inquiry_status` / `memo_status` |
| 게스트 블라인드 | 이름 마스킹·「로그인 후…」·「블라인드」 | — | — | `student-blind-teaser.js` (**「숨김」 단어 없음**) |

### 기획자 지적과의 정합

| 지적 | 코드 실측 |
|---|---|
| draft/pending/published/hidden 은 잔여 내부값 · **심사 플로우 없음** | ENUM은 스키마에 존재. `pending`은 UI에서 `draft`로 정규화(`lifecycle-copy.js`). 승인/반려 UI 없음 · 금지어로 명시 |
| 「작성 중」= 가입 중 이탈 후 재개용 내부 표현 | 정확 문자열 「작성 중」**미발견**. 대신 「이어서 입력하기」「상세등록 이어하기」「작성 이어가기」「저장중」 |
| 「공개」는 사용자 용어 아님 · 필수 채우면 기본 노출 | 손님 찾기에는 「공개」 라벨 없음. 다만 **공급자 내 등록**에는 아직 「공개중」 탭/배지 잔존 |
| 「숨김」= 블라인드/모드 비가시일 수 있음 → **단어 실사용 감사** | 블라인드 경로에는 「숨김」**없음**. 「숨김」은 **소유자·관리자 UI + 목록 제외 필터(`<> 'hidden'`)** 에 실사용 |
| 쪽지 UI = 받음/안받음 | 확인됨. 「숨김」 없음 |

---

## (B) 「숨김」 히트 목록 (USER-VISIBLE 중심)

게스트·찾기 화면(preview/search-ui, guest hero/list)에서는 **히트 0**.

### B-1. 손님/공개 탐색 — 없음

- `preview/search-ui/**`: 「숨김」「공개중」「저장중」「작성」 상태 라벨 **0건**
- `preview/home-ui/src/guest-sections.js`: 지도 숫자만 `GUEST_REGION_STATS`(하드코딩 47/62/128). 상태 단어 없음
- `preview/home-ui/src/student-blind-teaser.js`: 마스킹·축약만. **「숨김」 없음**
- `preview/search-ui/src/search-find-surface.js:671`: 「블라인드 · 시장 수요 참고…」(「숨김」 아님)

### B-2. 내 등록(공급자·학부모) — 있음

| 파일:줄 | 화면 | 문맥 |
|---|---|---|
| `preview/home-ui/src/study-room-reg/study-room-reg-copy.js:11` | 공부방 내 등록 목록 탭 | `{ key: 'hidden', label: '숨김' }` |
| `preview/home-ui/src/tutor-reg/tutor-reg-copy.js:11` | 과외쌤 내 등록 목록 탭 | 동일 |
| `preview/home-ui/src/lifecycle-copy.js:12,20` | 상태 배지 공통 | `hidden: '숨김'` |
| `preview/home-ui/src/study-room-reg/screens.js:677,683` | 공부방 숨김 액션 | confirm/alert 「숨김 처리」 |
| `preview/home-ui/src/tutor-reg/screens.js:548-550,712,718` | 과외 위험구역·버튼 | 「숨김은 검색 미노출」·버튼 「숨김」 |
| `preview/home-ui/src/student-reg/screens.js:569,575` | 학생 의뢰 | confirm 「노출을 철회(숨김)」 |
| `preview/home-ui/src/tutor-reg/registration-check-copy.js:12,78` | 등록점검 | 「숨김 · 다시 공개 가능」「지금은 숨김입니다」 |
| `preview/home-ui/src/study-room-reg/format.js` · `tutor-reg/format.js` | 노출 매트릭스 사유 | 「숨김 상태」「숨김 아님」 |
| `preview/home-ui/src/plans/screens.js:598,621` · `order-blocks.js:99` | 유료상품 구매 | 「숨김 상태입니다 · 노출 중지…」 |
| `preview/study-room-ui/src/summary.js:113` | 등록 UI 요약 | `hidden` → 「숨김」 |
| `preview/home-ui/src/student-reg/router.js:64` 등 | 라우트 제목 | 「숨김·삭제」 |

### B-3. 관리자(A28) — 있음 (운영자용)

| 파일:줄 | 문맥 |
|---|---|
| `preview/home-ui/src/admin/a28-copy.js:483,508,513,556` | 「숨김」「프로필 숨김」「제출 숨김」 |
| `preview/home-ui/src/admin/a28-screens.js:451,462,970,1046` | 필터 option · 「「숨김」만 합니다」 |
| `preview/home-ui/src/admin/a28-screens-labs.js:31,106,109` | 상태표·버튼 「숨김」 |
| `preview/home-ui/src/admin/a28-screens-bind.js:1064,1108` | confirm 「숨김 처리」 |
| `src/Admin/AdminExposureRepository.php:191` | `'hidden' => '숨김'` |

### B-4. 알고리즘/주석 (UI 문자열 아님)

| 파일:줄 | 동작 |
|---|---|
| `src/Search/SearchService.php:273-276` | 공부방: `profile_status <> 'hidden'` (+ `deleted_at IS NULL`) |
| `src/Search/SearchService.php:523-525` | 과외: `profile_status <> 'hidden'` |
| `src/Search/SearchService.php:738-739` | 학생: `exposure_status = 'published'` (+ `deleted_at IS NULL`) ← **hidden·draft 제외** |
| `preview/home-ui/src/exposure-rules.js:27-34` | 목록 후보: `hidden`만 제외 · draft 포함 명시 |
| `preview/home-ui/src/guest-sections.js:72-74` | 지도 핀 시드: `hidden` 제외 |
| `src/StudyRoom/StudyRoomPublicReadService.php:49` | 샵 상세: hidden·삭제만 제외 |

### B-5. 문서/주석성 「숨김」(UI 아님)

SSOT·internal docs·「섹션 숨김」개발 주석 다수 — 사용자 화면 카피가 아님. (예: 빈 섹션 미렌더 = “숨김 규칙”)

---

## 쪽지 UI (받음/안받음) — 「숨김」 없음 확인

| 위치 | 라벨 |
|---|---|
| `student-reg/screens.js:439-443` | 라디오 **「받음」「안 받음」** |
| `study-room-reg-copy.js` / `tutor-reg/inquiries-copy.js` | 「쪽지 받는 중」「쪽지 안받음」 |
| `screens/tutor.js:83` | 「쪽지 받음 · N개 미확인」 |
| `study-room-home-seed.js:124` | `open`→「받음」 / else「안받음」 |

쪽지 수신과 `profile_status`/`exposure_status`는 독립(`sql/schema/063_student_memo_fulfillment.sql` 주석).

---

## 게스트 블라인드 ≠ 「숨김」

- 구현: `student-blind-teaser.js`, `exposure-render.js` 게스트 티저, `student-visibility.js`
- 사용자에게 보이는 말: 마스킹 이름, 「로그인 후 구조화 조건·쪽지를…」, search-ui 「블라인드」
- **「숨김」 단어 미사용.** 이전 122/125에서 숨김≈블라인드로 읽히게 쓴 표현은 과대 해석 → 정정(아래·122/125 부록).

---

## PHP/SQL: 손님이 목록에서 실제로 빠지는 것 (쉬운 말)

오늘 **검색/지도 목록** 기준:

1. **공부방** — 목록에서 빠진 것: 내부적으로 “목록에서 빼 둔” 등록(`hidden`) + 삭제된 행.  
   **남는 것:** 작성 중인 행(`draft`)도 코드상으로는 목록에 포함될 수 있음(공개 게이트 없음 주석).
2. **과외쌤** — 동일: `hidden`만 제외. `draft` 포함 가능.
3. **학생 의뢰** — **목록에 나온 것만** = 필수 절차를 끝내 “목록용”으로 올라간 행(`published`). 작성 중·목록 제외·삭제 행은 안 나옴.

즉 “심사 탈락”으로 빠지는 것은 **없고**,  
손님 지도/목록에서 빠지는 실체는 대략 **(가) 아직 목록에 안 올린 미완성·작성중 학생 의뢰, (나) 소유자/운영이 목록에서 뺀 등록, (다) 삭제 행** 입니다.  
공부방·과외는 코드가 `draft`도 넣을 수 있어, 기획의 「필수항목 채우면 기본 노출」과 **어긋날 여지**가 있습니다(별도 정리 과제).

스키마 ENUM (잔여):

- `study_rooms` / `tutors`.`profile_status`: `draft|pending|published|hidden`
- `students`.`exposure_status`: `draft|published|hidden|deleted`

---

## (C) 122 지도 COUNT 권고 — 「공개/숨김」 말 없이

**권고 정의(화면 문구용):**  
**「가입(등록) 필수항목이 채워져, 손님 홈·찾기 목록에 나오는 등록」** 의 지역별 개수.

**구현 정렬(코드 쪽, 어휘는 화면에 쓰지 않음):**

| 칸 | COUNT 대상 | 목록과 맞추는 필터(오늘 검색과 동일) |
|---|---|---|
| 공부방 | `COUNT(DISTINCT study_rooms.id)` + 지역(본·홍보) | 삭제 아님 · **목록 제외 상태 아님** (`<> 'hidden'`) |
| 과외쌤 | `COUNT(DISTINCT tutors.id)` + `tutor_regions` | **목록 제외 상태 아님** (`<> 'hidden'`) |
| 학생 | `COUNT(DISTINCT students.id)` + 희망 지역 축 | **목록에 나온 상태만** (`exposure_status`가 목록용) · 삭제 아님 |

- 유료(Prime/Pick) 여부는 **세지 않음**(베이직=등록 전부 중 목록에 나오는 것).
- **「숨김도 숫자에는 포함」**(122·125 §9 이전 잠금)은 **철회.**  
  손님 박스 숫자는 **목록에 나오는 등록**과 같아야 허수가 아닙니다.
- 화면/기획 문서에는 `published`/`hidden`/`공개`/`숨김` 대신 위 권고 정의만 씁니다.

### 이전 과대 서술과의 차이

| 이전(122·125 §9) | 이번(127) |
|---|---|
| draft~hidden 전부 포함, 숨김도 COUNT | **목록에 나오는 등록만** COUNT |
| 상태 ENUM을 사용자 개념처럼 설명 | ENUM=내부 잔여 · 화면 용어로 쓰지 않음 |
| 블라인드와 숨김 혼동 여지 | 블라인드 ≠ 「숨김」 단어 |

---

## 부록 · 기타 UI 문자열 메모

- 「심사」: 사용자 화면 카피로 쓰이지 않음. `FORBIDDEN_*` · A28 빨간줄 · SSOT “심사 없음”.
- 「공개중」: 손님 찾기 ✕ / 내 등록 탭·배지 ○ (`P20_LIST_TABS`·`P21_LIST_TABS`·`PROFILE_STATUS_LABELS`).
- mypage: `screens.js:213` 「N개 공개 중」 / 「작성 이어가기」 — 소유자용.
- 지도 숫자 하드코딩: `preview/home-ui/src/data.js:61-65` `GUEST_REGION_STATS = {47,62,128}`.

## 근거 경로 요약

- 검색 필터: `src/Search/SearchService.php` 273+, 523+, 738+
- 상태 라벨: `preview/home-ui/src/lifecycle-copy.js`
- 목록 탭: `study-room-reg-copy.js` · `tutor-reg-copy.js`
- 게스트 블라인드: `student-blind-teaser.js`
- 쪽지: `student-reg/screens.js` settings · `*-inq*-copy.js`

## 사용자 확인: 내 등록 상단메뉴에 숨김 없음

2026-09-25 KST에 공부방·과외쌤의 `마이페이지 → 내 등록`에서 사용자가 실제로 여는 단일 등록 허브를 다시 대조했다. 사용자가 보는 상단메뉴에는 「숨김」이 없다는 관찰이 맞다. 소스의 상단탭 배열도 이를 뒷받침한다.

- 공부방 단일 허브는 `#/mypage/registrations/study-rooms/{id}`(P20-02)이고, 상단탭은 마이샵·기본정보·상세정보1·상세정보2·쪽지설정·등록점검뿐이다 (`preview/home-ui/src/study-room-reg/router.js:109-116`; 렌더링은 `preview/home-ui/src/study-room-reg/screens.js:95-104`). 「숨김」은 이 허브의 상단메뉴가 아니다.
- 과외쌤 단일 허브는 `#/mypage/registrations/tutors/{id}`(P21-02)이고, 상단탭도 마이프로필·기본정보·상세정보·쪽지설정·등록점검뿐이다 (`preview/home-ui/src/tutor-reg/router.js:115-121`; 렌더링은 `preview/home-ui/src/tutor-reg/screens.js:61-82`). 과외쌤에도 상단 「숨김」은 없다. 즉 공부방의 상세정보2가 과외쌤에 없는 차이는 있지만, 「숨김」이 양쪽 상단에 없는 점은 같다.

### 숨김이 정의된 위치와 실제 도달성

1. **별도 다중 등록 목록(P20-01/P21-01/P19-01)에 남은 잔재**
   - 공부방은 `#/mypage/registrations/study-rooms/tab/hidden`을 파서가 인정한다 (`preview/home-ui/src/study-room-reg/router.js:25-32`). 목록 탭의 「숨김」도 `P20_LIST_TABS`에 정의돼 있다 (`preview/home-ui/src/study-room-reg/study-room-reg-copy.js:7-13`)며 목록 렌더러가 그 배열을 소비한다 (`preview/home-ui/src/study-room-reg/screens.js:179-200`). 다만 방이 하나라도 있으면 P20-01을 곧바로 첫 방 허브로 바꾸므로 (`preview/home-ui/src/study-room-reg/screens.js:134-145`) 현재 사용자처럼 등록이 있는 계정에서는 그 목록/탭이 화면에 남지 않는다. 따라서 클릭 경로는 없고, 빈 목록 상태에서만 남은 레거시 화면이다.
   - 과외쌤도 `#/mypage/registrations/tutors/tab/hidden`을 파서가 인정한다 (`preview/home-ui/src/tutor-reg/router.js:37-44`). 그러나 P21-01은 과외 등록이 있으면 첫 허브로 리다이렉트하고, 없으면 빈 상태를 렌더링한다 (`preview/home-ui/src/tutor-reg/screens.js:90-105`). `P21_LIST_TABS`의 「숨김」(`preview/home-ui/src/tutor-reg/tutor-reg-copy.js:7-13`)을 소비하는 목록 렌더러가 현재 없으므로 이 탭 라벨은 현재 라우트에서 렌더되지 않는 죽은 코드다.
   - 학생 의뢰도 파서에는 `#/mypage/registrations/students/tab/hidden`이 남아 있다 (`preview/home-ui/src/student-reg/router.js:19-28`). 하지만 P19-01은 목록을 그리지 않고 단일 학생 허브로 보내며 (`preview/home-ui/src/student-reg/screens.js:135-181`), 학생 상단탭도 허브·기본정보·상세정보·쪽지설정뿐이다 (`preview/home-ui/src/student-reg/router.js:88-93`). 학생의 「숨김」 목록 경로 역시 현재 사용자 화면으로는 나오지 않는다.

2. **등록점검 내용인가?**
   - 과외쌤 등록점검(`#/mypage/registrations/tutors/{id}/publish`)에는 `profile_status === 'hidden'`일 때만 「지금은 숨김입니다」 계열 안내와 다시 공개 버튼이 나온다 (`preview/home-ui/src/tutor-reg/registration-check-render.js:207-232`; 문구 정의 `preview/home-ui/src/tutor-reg/registration-check-copy.js:12,70-78`). 이것은 상단메뉴 항목이 아니라 등록점검 본문 안의 상태 안내이며, 현재 프로필이 hidden이 아니면 보이지 않는다.
   - 공부방 등록점검 렌더러에는 같은 「숨김」 본문 분기가 없다. 공부방 `format.js`의 숨김 사유/노출 매트릭스 보조함수(`:105-169`)는 현재 화면에서 호출되지 않는다. 따라서 사용자가 열어 본 공부방 등록점검에서 「숨김」을 못 본 것이 정상이다.

3. **기능 플래그·labs 여부**
   - 확인한 역할별 라우터·상단탭·등록점검 코드에는 숨김을 켜는 feature flag/labs 가드가 없다. 목록 탭 정의는 정적이고, 실제 조건은 라우트의 레거시 리다이렉트와 과외 등록점검의 `profile_status === 'hidden'` 조건뿐이다 (`tutor-reg/registration-check-render.js:207-232`).
   - 과외쌤의 별도 노출 화면은 직접 `#/mypage/registrations/tutors/{id}/exposure`로 들어가면 P21-06을 렌더하며 (`preview/home-ui/src/tutor-reg/router.js:51-69`, `preview/home-ui/src/tutor-reg/screens.js:525-556`), 그 안에 「숨김」 버튼이 있다(`:546-551`). 상단탭이나 허브의 클릭 링크는 아니므로 현재 IA의 정상 클릭 경로에는 포함되지 않는 딥링크 잔재다.

### DEAD 코드와 후속 제거 후보(이번에는 삭제하지 않음)

- **DEAD/미사용 후보**: 과외 `tutor-reg-copy.js:7-13`의 `P21_LIST_TABS` 전체(목록 렌더러 없음), 학생 `student-reg/router.js:64`의 P19-06 숨김·삭제 화면 제목과 `student-reg/store.js:210-213`의 목록 필터 보조 함수(현재 목록 렌더러 없음), 학생 `student-reg/screens.js:566-577`의 `data-p19-hide` 이벤트 핸들러(현재 대응 마크업 없음), 공부방 `study-room-reg/screens.js:674-686`의 `data-p20-hide` 이벤트 핸들러(현재 대응 마크업 없음), 그리고 호출처가 없는 공부방 노출 매트릭스/허브 CTA 보조함수(`study-room-reg/format.js:105-190`)를 후보로 분리한다.
- **조건부로 아직 살아 있는 코드**: 공부방 `P20_LIST_TABS`의 hidden 항목(`study-room-reg-copy.js:7-13`)은 빈 목록에서만 렌더될 수 있어 즉시 DEAD라고 단정하지 않는다. 과외 등록점검의 hidden 상태 문구(`tutor-reg/registration-check-copy.js:12,70-78`)와 과외 P21-06 노출 화면의 버튼(`tutor-reg/screens.js:525-556`)은 직접/상태 조건으로 도달 가능하므로 제거 전 정책 확인이 필요하다.
- **후속 티켓에서 제거/정리할 것**: (a) P19/P20/P21 `tab/hidden` 파서·레거시 목록 탭·P19-06 제목의 존치 여부 결정, (b) 현재 IA에 없는 공부방/학생 hide 핸들러와 store/포맷 보조함수의 호출 그래프 확인 후 제거, (c) 과외 P21-06 딥링크와 등록점검 hidden 안내를 유지할지 결정, (d) 유지한다면 사용자 안내/문서의 클릭 경로를 명시하고, 제거한다면 `profile_status=hidden` 데이터 전환 자체와 관리자 기능은 건드리지 않고 사용자 화면 코드만 정리한다.

**플래너용 한 줄:** 「숨김」은 내 등록 상단메뉴에 있는 기능이 아니다. 공부방은 `#/mypage/registrations/study-rooms/tab/hidden`이라는 빈 목록용 레거시 정의만 남았고, 과외는 그 목록 탭이 죽은 코드이며 P21-06 딥링크/hidden 상태 등록점검에서만 조건부로 남아 있다. 학생도 상단메뉴와 목록 화면에는 없고 파서·헬퍼 잔재만 있다.


---

## 후속 (2026-09-25)

정책 잠금·제거 티켓: [161-member-card-hide-retire-ticket.md](161-member-card-hide-retire-ticket.md)
- 회원 자발적 카드 숨김 **폐기**
- 일일결산 「오늘 노출 변경」 **제외**
- 마이페이지 숨김 구잔재 **제거**(관리자 노출·DB `hidden`·검색 필터·탈퇴 연쇄는 유지)
