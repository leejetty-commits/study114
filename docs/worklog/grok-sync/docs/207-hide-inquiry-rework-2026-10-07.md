# 207 · 숨김+문의 묶음 재작업지시서 (2026-10-07)

- **작성:** 우동공과2, 2026-10-07 06:34 KST (종현 t1523 야간 위임 — 배포 직전까지)
- **근거:** docs/206 「§검수 결과 (2026-10-07, ad81b93)」 결함 D1~D7
- **대상:** 같은 브랜치 `cursor/hide-inquiry-20261007`, 지금 HEAD `ad81b93296176d8cf666dc525b820e50ded1aa20`
- **방식:** 이 HEAD 위에 **새 커밋만** 추가합니다(1~2개). amend·rebase·force push는 금지합니다. 새 브랜치나 PR도 만들지 않습니다.
- 206의 정책, 076, backfill, API 모양은 **그대로** 둡니다. 아래 7개만 고치고, 아래에 없는 것은 바꾸지 않습니다.

## 잠긴 정책 (다시 적음, 바꾸지 않음)
- 공개조건 정책은 없습니다. 남은 흔적은 지웁니다.
- 숨김은 관리자만 할 수 있습니다.
- 기본 카드는 기본 가입 필수칸(대표지역1 포함)이 다 차야 노출합니다. 불완전한 카드는 노출하지 않습니다.
- 문의는 1건에 답변 1개입니다. 대화형 스레드는 없습니다.

## 1. 고칠 것 (파일:줄은 ad81b93 기준)

### D6 (잠긴 정책과 어긋난 오류) 다시 보이기 판정에 공부방 「주대상」 누락
- **문제:**
  - `src/Admin/AdminExposureService.php:464-501` `studyRoomUnhideMissing`이 주대상을 확인하지 않습니다.
  - 주대상은 기본 가입 필수칸입니다(`src/Auth/BasicRegisterService.php:1031-1033`).
  - 카드에도 표시됩니다(`src/Search/SearchService.php:578-589`, 테이블 `study_room_primary_audiences`).
- **고침:** `studyRoomUnhideMissing`에서 기존 6칸 확인 뒤에 아래를 추가합니다.
  - `study_room_primary_audiences` 테이블이 있으면 `SELECT COUNT(*) FROM study_room_primary_audiences WHERE study_room_id = ?`를 실행하고, 결과가 0이면 missing에 `'주대상'`을 넣습니다.
  - 테이블 존재 확인은 같은 파일 안 private 함수로 합니다(`SHOW TABLES LIKE 'study_room_primary_audiences'`, StudyRoomRegisterService.php:637과 같은 방식). 결과는 인스턴스 안에서만 기억합니다.
  - 테이블이 없으면 이 확인만 건너뜁니다.
  - 과외쌤 판정(`tutorUnhideMissing`)은 바꾸지 않습니다.
  - 원장 성별·집주소는 넣지 않습니다(종현 확인 13).

### D1 (중간) 「내 문의 내역」이 공용 캐시를 써서 관리자 능력 계정에 남의 문의가 보임
- **문제:**
  - `preview/home-ui/src/mypage/screens.js:466`이 `listTickets()`(공용 `ticketsCache`)를 그대로 씁니다.
  - 공용 캐시는 부트 `hydrateSupportCache`(`support/support-backend.js:61-79`, 관리자면 전체), 옛 운영 화면, `upsertTicketCache`(:115, 관리자 상태·답변 저장 :151-161)가 채웁니다.
  - `hydrateMyTickets`(:44-59)도 같은 캐시를 덮어써서 옛 운영 화면을 망가뜨립니다.
- **고침:**
  1. `support-backend.js`에 별도 배열 `myTicketsCache = []`를 만들고, `export function getMyTicketsCache()`가 복사본을 돌려주게 합니다. `resetCaches()`에서 이 배열도 비웁니다.
  2. `hydrateMyTickets()`는 **`myTicketsCache`에만** 씁니다(:47·:57의 `ticketsCache =`를 `myTicketsCache =`로). `ticketsCache`는 건드리지 않습니다.
  3. `apiCreateTicket`(:145-149): 기존 `upsertTicketCache` 호출은 그대로 두고, 같은 행을 `myTicketsCache`에도 넣습니다(같은 id가 있으면 바꾸고, 없으면 맨 앞에 넣고, `ticketSortStamp` 순서로 정렬).
  4. `apiUpdateTicketStatus`·`apiUpdateTicketReply`(:151-161): 기존 호출은 그대로 둡니다. 추가로 `myTicketsCache`에 **같은 id가 이미 있을 때만** 그 행을 바꿉니다(새로 넣지 않음).
  5. `support/ticket-store.js`에 `export function listMyTickets()`를 추가합니다.
     - API 모드면 `getMyTicketsCache()`를 `sortTicketsLatest`로 정렬해 돌려줍니다.
     - 로컬 미리보기 모드면 지금 `listTickets()`와 같게 동작합니다.
  6. `mypage/screens.js:74` import와 `:466`을 `listMyTickets()`로 바꿉니다. 나머지 내 문의 내역 코드(:1382-1400 hydrate 1회 등)는 그대로 둡니다.
  - 옛 `/support/admin/tickets` 화면(`support/admin-screens.js`)은 바꾸지 않습니다.

### D3 (중간) e2e a28-07 Q7 회귀 + 실행 뒤 시드 공부방 3이 draft에 고정
- **문제:**
  - 시드 공부방 3에 slogan·address_text가 없습니다. 그래서 `e2e/a28-07-exposure-patch.spec.js:148` Q7이 `draft`를 받아 실패합니다.
  - afterAll의 `restoreExposureDefaults`(`e2e/helpers/admin-api.js:107-122`) publish도 400 `draft_not_publishable`로 실패해 공부방 3이 draft에 남습니다.
- **고침 (`e2e/a28-07-exposure-patch.spec.js`만 바꿉니다):**
  1. :111 `describe('A28-07 PATCH 핵심 …')` 안에 `beforeAll`을 추가합니다.
     - 공부방 3의 판정 칸 7개(대표지역1, 이름, 교습형태, 주력과목, 슬로건, 사업장주소, 주대상) 중 **빈 칸만** SQL로 채웁니다.
     - 예: `UPDATE study_rooms SET slogan = COALESCE(NULLIF(TRIM(slogan),''),'e2e 슬로건'), address_text = COALESCE(NULLIF(TRIM(address_text),''),'서울 강남구 e2e 주소') WHERE id = 3`.
     - 주대상이 0행이면 `study_room_primary_audiences`에 1행을 넣습니다.
     - 나머지 칸이 비어 있으면 같은 방식으로 채웁니다.
     - 이미 있는 값은 덮어쓰지 않습니다.
  2. Q7은 지금처럼 `published`를 기대합니다.
  3. Q7 바로 뒤에 `Q7b`를 추가합니다.
     - 공부방 3을 숨기고 slogan을 `''`로 바꾼 뒤 publish합니다. 기대 결과: 200, `item.status === 'draft'`, `missing`에 「슬로건」.
     - slogan을 되돌리고 다시 publish합니다. 기대 결과: `published`.
     - Q7b는 끝날 때 반드시 공부방 3을 published로 둡니다. 실패해도 되돌리도록 `try/finally`로 SQL 복구합니다.
  - `e2e/helpers/admin-api.js`는 바꾸지 않습니다.

### D7 (중간) 회원 상세 「운영문의」 링크가 문의 화면을 연 뒤에는 거르지 않음
- **문제:** `preview/home-ui/src/admin/a28-screens-bind.js:2157-2166` `bindTicketsScreen`이 `!state.initialized`일 때만 hash의 q·group을 읽습니다. 그래서 `#/admin/tickets`를 한 번 연 뒤에는 회원 상세 링크(`?q={id}&group=all`)가 무시됩니다.
- **고침:** route 호스트일 때만 바꿉니다.
  - `readRouteTicketQuery()` 결과로 `hashKey = group + '|' + q`를 만듭니다.
  - `hashKey !== '|'`이고 `hashKey !== state.appliedHashKey`이면 아래를 하고 `state.appliedHashKey = hashKey`로 둡니다:
    - `state.q = q`;
    - group이 있으면 `state.group = group`;
    - `state.page = 1`.
  - hash에 q·group이 없으면 `state.appliedHashKey = ''`로만 둡니다(필터는 유지). 그래야 같은 링크를 다시 눌러도 적용됩니다.
  - 필터·검색·쪽 버튼은 지금처럼 **hash를 쓰지 않습니다**.
  - hub 호스트는 hash를 읽지 않습니다.
  - `appliedHashKey`는 상태 기본값(`a28-screens.js:940-950`, `initialized: false` 옆)에 `appliedHashKey: ''` 한 줄로 추가합니다.

### D2 (낮음) 오래된 'hidden'을 다시 보내면 422
- **문제:**
  - `preview/study-room-ui/src/save-flow.js:7`이 서버 값(hidden 포함)을 state에 넣고, `form-collect.js:495-496`이 그대로 보냅니다.
  - 그 사이 관리자가 다시 보이기를 했으면 `src/StudyRoom/StudyRoomRegisterService.php:1028-1030` `optionalEnum`(:2352~)이 422를 냅니다.
  - `src/Tutor/TutorRegisterService.php:716-718`도 같은 구조입니다.
- **고침 (서버만):** 두 곳 모두 요청 값이 `'hidden'`이면 **요청 없음과 똑같이** 처리합니다(현재 값 유지).
  - 공부방: `$requestedEmpty` 계산에 `|| strtolower(trim((string) $requestedRaw)) === 'hidden'`을 더합니다.
  - 과외쌤: `$requested` 조건에도 같은 조건을 더합니다.
  - 그 밖의 잘못된 값은 지금처럼 422입니다.
  - 숨김은 계속 관리자만 걸 수 있습니다. 소유자의 'hidden' 요청은 숨김을 **걸지도 풀지도 않습니다**.

### D4 (낮음) 문의 목록 필터의 선택 그룹이 안 보임
- **문제:** `preview/home-ui/src/admin/a28-screens.js:1017` `is-on` 클래스에 스타일이 없고 `aria-pressed`도 없습니다.
- **고침:** 같은 파일 :1210 관례를 따릅니다.
  - 선택된 그룹은 `btn btn--primary btn--sm`, 나머지는 `btn btn--secondary btn--sm`으로 씁니다.
  - 모든 버튼에 `aria-pressed="true|false"`를 붙입니다.
  - `is-on`은 지웁니다. CSS는 바꾸지 않습니다.

### D5 (낮음) 숨김 안내 줄의 링크가 링크로 안 보임
- **문제:** `preview/home-ui/src/lifecycle-copy.js:18-25`가 문장 안 「고객센터 운영문의」를 `<a>`로 감쌉니다. 그런데 전역 `a { color: inherit; text-decoration: none; }`(`styles/home.css:23`) 때문에 일반 글자처럼 보입니다.
- **고침:** 206 항목 4가 허용한 두 번째 방식을 씁니다.
  - `ADMIN_HIDE_OWNER_LINE` 문장은 **글자 그대로** 감싸지 않고 둡니다.
  - 같은 `<p class="mp-admin-hide-line" data-admin-hide-line>` 안, 문장 뒤에 링크 1개를 둡니다: `<a class="btn btn--secondary btn--sm" href="#/support/contact?category=unhide_request" data-nav="/support/contact?category=unhide_request">고객센터 운영문의</a>`.
  - 허브당 안내 줄 1개·링크 1개는 그대로입니다.
  - CSS 파일은 바꾸지 않습니다.

## 2. 바꿔도 되는 파일 (206 §3의 부분집합, 이것만)

| 파일 | 범위 |
|---|---|
| src/Admin/AdminExposureService.php | D6: `studyRoomUnhideMissing` + 테이블 확인 private 함수만 |
| src/StudyRoom/StudyRoomRegisterService.php | D2: saveFacility 상태 결정 몇 줄(:1022-1031)만 |
| src/Tutor/TutorRegisterService.php | D2: saveContact 상태 결정 몇 줄(:713-722)만 |
| preview/home-ui/src/support/support-backend.js | D1 |
| preview/home-ui/src/support/ticket-store.js | D1: `listMyTickets` 추가만 |
| preview/home-ui/src/mypage/screens.js | D1: import와 :466만 |
| preview/home-ui/src/admin/a28-screens.js | D4: :1017 필터 버튼, D7: :945 근처 상태 기본값 한 줄만 |
| preview/home-ui/src/admin/a28-screens-bind.js | D7: `bindTicketsScreen` 초기값 부분(:2157-2166)만 |
| preview/home-ui/src/lifecycle-copy.js | D5 |
| e2e/a28-07-exposure-patch.spec.js | D3 |
| e2e/hide-inquiry-20261007.spec.js | 아래 검사 추가만(기존 5개 유지) |
| scripts/verify-hide-inquiry-bundle.mjs | 아래 검사 추가 + D5 마크업 변경에 맞춘 기존 검사 수정만(지우거나 느슨하게 하지 않음) |

## 3. 금지
- amend, rebase, force push, 새 브랜치, PR 생성, main 병합, 배포, 운영 DB SQL 실행을 하지 않습니다.
- 위 표 밖의 파일은 바꾸지 않습니다. 특히 아래는 건드리지 않습니다.
  - sql/076·backfill·rest-schema·schema_check;
  - CSS 파일 전부;
  - verify-basic-exposure-gate·verify-tutor-frame;
  - support/admin-screens.js;
  - e2e/helpers;
  - ssot 문서.
- 정책을 새로 만들지 않습니다.
  - 공개조건을 되살리지 않습니다.
  - 소유자가 숨김을 걸거나 풀 수 없습니다.
  - 문의 스레드를 만들지 않습니다.
- 화면 글자는 「학생」(학부모 금지), 「게시판」(보드 금지), 「과외지역」을 씁니다.
- 기존 검사 기대값을 낮추거나 지우지 않습니다.

## 4. 합격 기준 (숫자)

1. 커밋: `ad81b93..HEAD` 새 커밋 1~2개, 부모 체인이 ad81b93으로 이어짐. 바뀐 파일은 전부 §2 표 안.
2. `npx vite-node` 검사(206 §검수 결과 5절과 같은 목록)는 숫자가 **같거나 늘어야** 합니다:
   - today-hub 59/0, preview-labels 198/0, shop-page 54/0;
   - tutor-frame 98 통과·3 FAIL(기존과 같은 3개), study-room-frame 100 OK, basic-exposure-gate 24/0;
   - support-home-library 49/0, region-save-rules 46/0;
   - room-basic-register-api 4 FAIL(기존과 같은 4개);
   - paid-renewal 38/0, tutor-draft-reuse 10/0, tutor-region-label 103/0;
   - inquiries·lesson 3종 OK;
   - `npm run build` OK(경고 3줄 그대로).
3. `verify-hide-inquiry-bundle`: **48 + 추가 검사 수 / 0**. 추가 검사는 최소 7개입니다:
   - (D1-a) `hydrateMyTickets` 본문에 `ticketsCache =`가 없음;
   - (D1-b) mypage/screens.js가 `listMyTickets`를 쓰고 `listTickets(`는 0건;
   - (D2) 두 서비스에 'hidden' 요청을 요청 없음으로 보는 조건;
   - (D4) 필터 버튼에 `aria-pressed`가 있고 `is-on`은 0건;
   - (D5) 안내 줄에 `btn btn--secondary btn--sm` 링크 1개, 문장 안 `<a`는 0건;
   - (D6) `studyRoomUnhideMissing`에 `'주대상'`;
   - (D7) `appliedHashKey`.
4. `php -l`: 바꾼 PHP 3개 전부 OK.
5. e2e (박스 MariaDB 기준, 검수자가 다시 돌림). 에이전트 환경에 MySQL이 없으면 실행하지 못한 이유를 적으면 됩니다.
   - `e2e/hide-inquiry-20261007.spec.js`: 6개 이상 전부 통과. 추가할 테스트(최소 1개): 관리자 능력 계정의 `mine=1` 응답 건수가 본인 user_id 문의 수와 같음.
   - `e2e/a28-07`(`--grep-invert "잘못된 target_type"`): 실패 0, 통과 수 = 11b0c0d 통과 수 + 1(Q7b).
   - 같은 DB에서 연속 2회 실행해도 실패 0, 실행 뒤 `study_rooms.id=3`의 profile_status = `published`.
6. 검수자 실측 기준(참고): D1 재현 스크립트(`/workspace/review/hide/d1-repro.mjs`)에서 내 문의 내역 건수가 첫 화면·옛 운영 화면 다녀온 뒤 모두 본인 건수(1건)여야 합니다. D7 재현(`memberlink.mjs`)에서는 링크 뒤 검색칸 = 회원 id, 목록 = 그 회원 문의만이어야 합니다.

## 5. 보고 형식
① 새 커밋 SHA(전체)와 `git log --oneline ad81b93..HEAD`
② `git diff --stat ad81b93..HEAD` (파일이 §2 표 안인지 한 줄 확인)
③ D1~D7 각각: 바꾼 file:line, 한 줄 설명
④ 검사 전후 표(§4-2·3 숫자 그대로, 기존 FAIL 이름 포함)
⑤ e2e: 실행했으면 통과/실패 수, 못 했으면 정확한 이유
⑥ 남은 위험·모르는 것 (없으면 「없음」)
⑦ `git status -sb` (깨끗함)
