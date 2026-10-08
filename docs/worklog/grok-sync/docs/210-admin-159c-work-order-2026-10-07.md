# 210 · 관리자-159-c 「등록 목록」 — 작업지시서 (2026-10-07)

- **작성:** 2026-10-07 06:54 KST (우동공과2, 종현 수면 중 · t1523 야간 위임 — **검수완료/배포 직전까지만**)
- **선행:** docs/209 점검 **합격**(정정 3·기본안 D1~D7 채택). 숨김 tip **검수완료** `2723c5f`. 162 tip **검수완료** `0a7005c`(쿼리 복사 원본).
- **정본:** docs/159 「등록 목록 확대 잠금」 / docs/202 §3-9·§3-10·§4 Q3·Q4 / docs/205 §1-4 / docs/190 「159-c는 숨김 묶음 위에」 / docs/209 §검수 결과
- **절차:** 이 지시서 발송 → 구현·보고 → 검수 → (필요 시 재작업) → **검수완료 → 종현 보고 → 승인 후 배포**. 이번 단계는 **배포·main 머지·PR 머지 금지**.

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달.

```
# [관리자-159-c] 「등록 목록」 작업지시서 (2단계: 구현 · 배포 직전까지)

## 0. 이번 단계 규칙 (하나라도 어기면 불합격)
- 저장소: leejetty-commits/study114.
- **베이스:** `origin/cursor/hide-inquiry-20261007` tip **`2723c5fdd61102c50adb24af4ede0d16b0ccc493`**.
  시작할 때 `git fetch origin && git rev-parse origin/cursor/hide-inquiry-20261007`를 첫 줄에 적으세요. `2723c5f`가 아니면 **작업하지 말고** 그 SHA만 보고하세요.
- **브랜치:** hide tip에서 `cursor/admin-159c-20261007` 생성(`git checkout -b cursor/admin-159c-20261007 2723c5f` 또는 동등). 이 브랜치에만 커밋.
- **162 복사 원본 tip:** `origin/cursor/admin-162-20261007` = **`0a7005c42367d824bebc44d36fe20b22cd546f1a`**.
  `BasicCardRegisteredQuery.php`·`ReportPeriod.php`는 `git show 0a7005c:경로`로 내용 동일 복사한 뒤, 아래 §1-2대로만 확장.
- **main 푸시·머지·PR 생성·PR 머지·배포 금지.** 플랫폼이 자동 PR을 만들면 Draft로 두고 머지하지 마세요. 보고에 PR 번호만 적으세요.
- **§2 허용 파일 목록 밖을 하나라도 바꾸면 불합격**(새 파일 포함). 스크린샷·임시 스크립트는 저장소 밖(`/tmp` 등)에 두고 커밋하지 마세요.
- rg는 `-g '!node_modules' -g '!dist'`를 붙이세요.
- 결과는 **마지막 메시지 하나에 한국어 보고서**. 라이브 사이트·운영 DB 조작 금지. 로컬 시험 DB·`php -S`·vite는 허용.
- 새 정책을 만들지 마세요. docs/159·202·205·209와 코드가 어긋나면 「잠긴 정책과 어긋난 오류」.

## 1. 만들 것 (정본 그대로. 바꾸지 말 것)

### 1-1. 목표 (Q3·Q4 잠김 = 합의)
- 사이드바 「회원관리」(`grp-members`) → 메뉴 「등록 목록」 1개, 주소 `#/admin/registrations`.
- 안쪽 탭 3개: **공부방 / 과외쌤 / 학생**. 「의뢰」 금지. 용어 「학생」(「학부모」 금지). 과외 탭 지역 칸·필터 문구는 「과외지역」. 「보드」 금지.
- 기본 보기: **최근 1주 = KST(Asia/Seoul) 오늘 포함 7일** — `ReportPeriod::dayRange`로 `[오늘-6일 00:00, 내일 00:00)`. `weekRange`(월요일 달력 주) 사용 금지.
- 날짜: **등록일만**. `users.created_at` 금지. SQL에 `DATE()`로 타임스탬프 자르기 금지(`>= :start AND < :end`만).
- 필터: 지역(시·군·구 `regions.id`, 선택) · 기간(`from`·`to` Y-m-d). 페이지 번호(무한스크롤 금지).
- 포함: 베이직카드·기본정보 필수 완성만(162 `BasicCardRegisteredQuery`와 동일 정의). 가입만 한 계정·지역1 없는 미완성 제외.
- **숨김 카드 포함** + 노출 상태 글자. **삭제 카드 제외**(`includeDeleted=false`). 과외쌤은 `deleted_at` 칼럼이 없으므로 162 SQL 유지(행이 없으면 자연 제외; 탈퇴 주인 행은 162와 같이 포함 — 스키마 추가·`WithdrawnOwnerSql`을 공용 `where()`에 넣지 말 것).
- 칸 4개만: 이름(표시명) · 지역 · 등록일(YYYY-MM-DD) · 노출 상태. 추가 칸 금지.
- 상태 글자: `hidden`→**숨김** · `published`→**게시중** · `draft`→**작성중** · `pending`→**검토중**. draft를 게시중으로 합치지 말 것.
- **허브 5번째 카드 금지.** `ADMIN_TODAY_CARDS` 수정 0. `ADMIN_PREVIEW_PATHS`에 `/admin/registrations` **넣지 말 것**(실화면, 길이 17 유지).
- 관리자 인페이지만(사이트 공개·마이페이지·찾기 영향 0).

### 1-2. 공용 쿼리 계약 (162와 main 동시 착륙 대비 — 깨면 불합격)
1. hide tip에는 두 파일이 없다. 162 tip `0a7005c`에서 **내용 동일**로 복사:
   - `src/Registration/BasicCardRegisteredQuery.php` (141줄 원본)
   - `src/Report/ReportPeriod.php` (188줄 원본)
2. **기존 메서드 본문 불변:** `countByRole` / `listByRole` / `countRole` / `where` / `selectList` / `bounds` / `from`.
   시그니처·SQL·반환 필드(`role`·`id`·`registered_at`·`display_name`)를 `0a7005c`와 바이트 단위로 같게 유지하세요.
   162 `SettlementReportService.php:528` `countByRole($start,$end,true)` · `:534` `listByRole(..., true, $page, 500)` 건수가 이 브랜치에서도 같아야 합니다(둘 다 main에 들어갈 때 충돌 나면 **동일 내용이면 합침**, 본문을 바꾸지 말 것).
3. 지역 필터·노출 상태·지역 라벨이 필요하면 **새 메서드**를 추가하세요(권장 이름 예: `listByRoleForAdmin` / `countByRoleForAdmin`).
   또는 선택 인자(예: `?int $regionId = null`)를 넣되, **인자가 비면 기존 SQL과 문자 단위로 동일**해야 합니다.
   지역 조건은 LIMIT/OFFSET **앞** WHERE에 넣으세요(페이지가 지역 필터 이전 행을 자르면 불합격).
4. 159-c 호출은 항상 `includeDeleted=false`. 숨김(`profile_status`/`exposure_status`)은 WHERE에서 빼지 말 것(count·list 모두 포함).
5. 새 SELECT에 넣을 것: 대표/희망 지역 id(또는 라벨용 id) · 노출 상태 raw 값. 화면 라벨은 `OfficialRegionLabel::resolve`(hide tip에 있음)와 §1-1 상태 글자 표로 조립(`AdminRegistrationListRepository`).
6. 학생 지역: `preferred_lesson_type`이 `tutor`이면 `preferred_tutor_region_id`만, `study_room`이면 `preferred_studyroom_region_id`만 표시·필터. 반대 칼럼 보지 말 것.
7. 공부방 대표 = `study_room_regions.slot=1`. 과외지역 = `tutor_regions.priority_order=0`. 사업장 `study_rooms.region_id`를 대표 홍보지역으로 쓰지 말 것.
8. 지역 필터 매칭: 요청 `region` = 시·군·구 `regions.id`. 카드 대표 region id가 그 id이거나 `OfficialRegionLabel::resolve(...).sigungu_id`가 그 id이면 포함.

### 1-3. API
- 새 `public/api/admin/registrations.php` — **GET만**. 뼈대는 `exposure.php`와 같이 `AdminApi::bootstrap` → `run` → `requireAdmin`. GET 외 → 405.
- `requireMaster` 호출 금지. `menuId=registrations`는 `SUB_MASTER_BLOCKED`에 넣지 않음(부마스터 200).
- 쿼리: `role`=`study_room|tutor|student`(기본 `study_room`) · `from`·`to`(Y-m-d, 없으면 §1-1 최근 1주) · `region`(없으면 전체) · `page`(기본 1) · `perPage`(기본 50, 상한 100).
- 쓰기 0: 파일에 `readJson`·POST/PATCH/DELETE 처리 없음. 정적 검사로 증명.

### 1-4. 화면·메뉴·라우트
- `a28-copy.js`: `grp-members` children에서 「회원 목록」 객체 **다음**에 메뉴 1개 추가(기존 줄 변경·삭제 0):

```javascript
{
  id: 'registrations',
  menuId: 'registrations',
  label: '등록 목록',
  path: '/admin/registrations',
  help: '최근 1주 공부방·과외쌤·학생 등록을 봅니다.',
  screenId: 'A28-159c',
}
```

  + `A28_MENU_ID_LABELS`에 `registrations: '등록 목록',` 1줄.
- `a28-screens.js`: **추가만** import 1 + `renderA28Screen`에서 `/admin/members` 분기 **다음**에
  `else if (path === '/admin/registrations') body = renderRegistrationList();` (이름 동등).
  숨김 tip의 회원 상세 운영문의(`memberSupportInquiries*` 등) 비트 **삭제·이동 금지**.
- `a28-screens-bind.js`: **추가만** import 1 + 회원 분기 옆에 등록 목록 바인딩 1.
  162 settlement 분기와 hunk가 겹치지 않게 **회원 분기 옆**에 두세요.
- 새 `a28-registration-list.js` — 탭·기간·지역·표·페이지·상태. 탭 상태는 이 모듈에만( `a28-screens-state.js` 수정 0).
- 새 `registration-list-api.js` — GET 1개만. `method: 'POST'|'PATCH'|'PUT'|'DELETE'` 0.
- 필요 시 새 `a28-registration-list-copy.js` — 이 화면 글자만.
- `home-admin.css`: 파일 끝(숨김 tip 기준 1042줄 다음)에 `.admin-shell`로 시작하는 규칙만 추가. **새 `@media` 금지.** `/* admin-159 today hub */` 이후 기존 규칙 삭제·변경 0.

## 2. 허용 파일 목록 (이 밖은 한 글자도 바꾸지 말 것)

### [화면] — a28-copy / screens / bind 는 162와 같이 **추가만**
1. `preview/home-ui/src/admin/a28-copy.js` — **추가만:** grp-members 메뉴 객체 1개(약 8줄) + `A28_MENU_ID_LABELS` 1줄. 기존 줄 변경·삭제 0. `ADMIN_PREVIEW_PATHS`·`ADMIN_TODAY_CARDS` 수정 0.
2. `preview/home-ui/src/admin/a28-screens.js` — **추가만:** import 1줄 + `/admin/registrations` 분기 1줄(합 +2 전후). 회원 운영문의·기존 분기 삭제 0.
3. `preview/home-ui/src/admin/a28-screens-bind.js` — **추가만:** import 1줄 + 바인딩 1줄(합 +2 전후).
4. `preview/home-ui/src/admin/a28-registration-list.js` (새) — 탭·필터·표·페이지·상태.
5. `preview/home-ui/src/admin/registration-list-api.js` (새) — GET만.
6. `preview/home-ui/src/admin/a28-registration-list-copy.js` (새, 선택) — 이 화면 글자. 안 쓰면 4번에 두되 「학부모」「의뢰」「보드」 0.
7. `preview/home-ui/src/styles/home-admin.css` — **추가만:** 끝 `.admin-shell` 규칙. 삭제 0 · 새 `@media` 0.

### [서버]
8. `public/api/admin/registrations.php` (새) — GET만 · `requireAdmin`.
9. `src/Admin/AdminRegistrationListRepository.php` (새) — 쿼리 새 메서드 호출 · `OfficialRegionLabel` · 상태 글자 조립. SQL 문자열을 이 파일에 새로 쓰지 말 것(205 이중화 금지).
10. `src/Registration/BasicCardRegisteredQuery.php` — **162 `0a7005c` 내용 동일 복사 후** §1-2 새 메서드(또는 기본값=구 SQL 선택 인자)만 추가. 기존 메서드 본문 불변.
11. `src/Report/ReportPeriod.php` — **162 `0a7005c` 내용 동일 복사.** 이 파일은 수정하지 말 것(162와 충돌 시 동일 내용 합침).

### [검사]
12. `scripts/verify-admin-registration-list.mjs` (새, `npx vite-node`)
13. `scripts/verify-admin-registration-list.php` (새, `php` CLI + 로컬 MariaDB/MySQL 픽스처)

- `verify-admin-today-hub.mjs` · `verify-admin-preview-labels.mjs` · `verify-shop-page` · `package.json` · `a28-screens-state.js` · `SettlementReportService.php` · `SettlementLinesQuery.php` · `a28-settlement*` · `AdminExposure*` 쓰기 · `sql/**` · `src/Search/**` · 사이트 mypage · 공개 등록/찾기 API → **수정 금지.**

## 3. 금지
- 구조 재설계 · 관련 없는 정리 · 허용 목록 밖 사이트 공용 파일 변경
- 허브 5번째 카드 · `ADMIN_PREVIEW_PATHS`에 등록 경로 추가
- 「학부모」 · 「의뢰」 · 「보드」 문구
- `users.created_at` · SQL `DATE(` 로 타임스탬프 자르기
- 스키마/마이그레이션(`sql/**`) · 과외쌤 `deleted_at` 추가
- 통계·차트·162 자세히 보기 팝업 · 쓰기 API
- 공개 찾기/노출 목록을 등록 목록으로 재사용
- 기존 `countByRole`/`listByRole`/`where` 본문 변경(162 계약 파손)
- main 푸시·머지·배포 · 열린 PR 머지

## 4. 숫자 합격 기준 (전부 숫자로 보고 · 전·후 둘 다)

### 4-1. 기존 검사 (베이스 = 숨김 tip `2723c5f` 실측)
1. `npx vite-node scripts/verify-admin-today-hub.mjs`
   - 전(hide tip): **`pass=59 fail=0`**
   - 후: **`pass=59 fail=0`** (허브 카드 4 유지·등록 목록 카드 0). 59가 아니면 늘어난/줄어든 검사 이름 전부.
2. `npx vite-node scripts/verify-admin-preview-labels.mjs`
   - 전: **`pass=198 fail=0 previewScreens=17 realHits=0`**
   - 후: **`pass=202 fail=0 previewScreens=17 realHits=0`**
     (실메뉴 1개 → real-menu·real-title·real-notice·real-body +4. 162 settlement와 동일). 202·17이 아니면 이름 전부.
3. `npm run verify:shop-page` → **`pass 54 / fail 0`** 그대로.
4. `cd preview/home-ui && npm run build` 성공. dist에 `/admin/registrations`·탭 라벨(공부방/과외쌤/학생) 존재(grep 줄 보고).
5. 새 PHP 파일 전부 `php -l` 통과(파일별 결과).

### 4-2. 새 `scripts/verify-admin-registration-list.mjs` — **최소 35개 검사, fail=0**
최소 포함:
- (a) `flattenAdminNav()`에 `/admin/registrations` 1개, label 「등록 목록」, `grp-members`에서 회원 목록 다음, `ADMIN_PREVIEW_PATHS`에 없음, `ADMIN_TODAY_CARDS`에 없음
- (b) 최고관리자·부마스터 세션 둘 다 `canAccessAdminPath('/admin/registrations')` true (today-hub와 같은 `/api/auth/me.php` 목업 + `initAuthSession()`, 뒷문 변수 금지)
- (c) `renderA28Screen('/admin/registrations')` 제목 「등록 목록」, 탭 3(공부방/과외쌤/학생), 「의뢰」0 · 「학부모」0 · 「보드」0
- (d) 허브 `renderA28Screen('/admin')`의 `data-today-card` 최고관리자 4 · 등록 목록 카드 0
- (e) registration-list-api.js에 POST/PATCH/PUT/DELETE 0, GET 1
- (f) home-admin.css 이번 추가분 선택자는 모두 `.admin-shell`로 시작, 새 `@media` 0
- (g) a28-copy.js·a28-screens.js·a28-screens-bind.js의 `git diff 2723c5f` **지운 줄 0**
- (h) `git diff --name-only 2723c5f` 전부 §2 목록 안
- (i) 소스·렌더에 `users.created_at` 0 · 허용 PHP에 `DATE(` 0(주석 제외)
- (j) `ADMIN_PREVIEW_PATHS.length === 17`

### 4-3. 새 `scripts/verify-admin-registration-list.php` — **최소 40개 검사, fail=0**
로컬 MariaDB/MySQL 시험 DB(운영 DB 아님). 최소 포함:
1. 기본 구간: 오늘 00:05 KST 등록 1건 포함 · 8일 전 0 · 기간 밖 0.
2. 숨김 픽스처(공부방·과외·학생 각 `hidden`) count·list **≥1** 포함, 상태 글자 「숨김」.
3. 공부방·학생 `deleted_at` 찍힌 행 → 목록 **0**. 과외쌤은 행 DELETE → 목록 **0**(칼럼 없음 증명).
4. 지역 필터: 타 시·군·구 **0**, 대표/희망 지역 일치 **≥1**. 학생은 `preferred_lesson_type`과 다른 칼럼만 채운 행 **0**.
5. draft·지역1 없는 공부방/과외 · `published_at` null 학생 → **0**.
6. 상태 글자: published→게시중 · draft→작성중 · pending→검토중 · hidden→숨김 각각 ≥1 픽스처.
7. `includeDeleted=false` 경로만 호출. 같은 DB에서 원본 `countByRole`/`listByRole`(true)를 162와 같은 인자로 호출해 **0a7005c 계약 회귀**(건수 불변) 1회.
8. API(로컬 `php -S`): 부마스터·최고관리자 GET **200** · 비관리자 **403** · POST/PATCH/DELETE **405**.
9. 응답 칸: name·region·registered_at(Y-m-d)·status 라벨만(추가 필드 보고).

### 4-4. 스크린샷 (로컬 preview만 · 라이브 금지) — `/tmp` 저장, 커밋 0
1. 사이드바 회원관리: 「회원 목록」 아래 「등록 목록」
2. 등록 목록 — 공부방 탭(기본 1주·표 4칸)
3. 과외쌤 탭(「과외지역」 문구)
4. 학생 탭
5. 숨김 행이 「숨김」으로 보이는 상태
6. 지역 필터 적용 후(타지역 0)
7. 회원 상세에 운영문의가 **그대로** 있는 회귀 1장(숨김 tip 비트 유지)

### 4-5. 유지(새로고침) 증명
- 목록 GET → 필터·탭·page 선택한 뒤 **브라우저 새로고침(또는 동일 GET 재호출)** → 같은 조건의 JSON/화면이 다시 나옴(서버 상태 변경 없음 = 읽기 전용).
- 보고에 요청 URL·응답 건수·새로고침 후 건수(같음)를 숫자로.

## 5. 보고 형식 (한국어, 마지막 메시지 하나)
1. 첫 줄: 시작 hide tip SHA · 브랜치 · 최종 커밋 SHA(들) · 시간 KST. `git log --oneline 2723c5f..HEAD`. `git ls-remote --heads origin 'cursor/admin-159c*'` · 열린 PR(있으면 번호·Draft 여부).
2. §2 파일마다 「무엇을 했는지」 한 줄. a28-copy.js·a28-screens.js·a28-screens-bind.js·home-admin.css는 **diff 원문 전부**(추가만인지 보이게).
3. §1-2 계약 증명: `countByRole`/`listByRole`/`where`/`selectList`가 `0a7005c`와 동일하다는 diff 또는 checksum. 새 메서드 시그니처·지역 WHERE 위치(LIMIT 앞).
4. §4-1~4-3 검사 숫자(전·후). fail>0이면 이름 전부.
5. `php -l` · build · shop-page.
6. 스크린샷 경로(박스 `/tmp`) · 4-5 새로고침 숫자.
7. 「잠긴 정책과 어긋난 오류」 / 위험 / 막힘(있으면 풀 방법).
8. §6 종현 확인 기본안으로 구현했는지 체크.
9. 마지막: `git status -sb` · `git diff --stat 2723c5f` · 허용 밖 파일 0 증명.

## 6. 종현 확인 필요 (지금은 아래 기본안으로 구현 — 바꾸기 쉬운 자리 · 블로커 아님)
1. **지운 과외쌤:** 스키마 추가 없이 162 SQL 유지(행 삭제=제외, 탈퇴 주인 행은 162와 같이 포함).
2. **최근 1주:** KST 오늘 포함 7일(`[오늘-6, 내일)`). `weekRange` 안 씀.
3. **상태 글자:** 숨김/게시중/작성중/검토중 4단(draft≠게시중).
4. **지역 필터:** 시·군·구 id · OfficialRegionLabel sigungu · 학생은 lesson_type 해당 칼럼만.
5. **쿼리 확장:** 새 메서드(또는 기본값=구 SQL 선택 인자). 기존 count/list 본문 불변.
6. **탭 상태:** `a28-registration-list.js`(state.js 수정 0).
7. **API 기본:** role=study_room · page=1 · perPage=50(상한 100).
8. **메뉴 위치·허브:** Q3 합의(회원관리·허브 카드 0) 그대로.
9. **숨김 포함:** Q4 합의 그대로.

## 7. 운영(있으면) — 에이전트·우동공과2는 실행 안 함
- 이번 단계 운영 DB·cron·Secret 추가 **없음**(읽기 API만).
- 162·숨김과 같이 main 반영·배포는 **종현 승인 후 별도 지시**.
- 162가 먼저 main에 들어가면 159-c rebase 시 `BasicCardRegisteredQuery.php`·`ReportPeriod.php`는 내용 동일 합침(재복사로 이중 정의 만들지 말 것).

## 8. 하지 말 것 (재확인)
- main 푸시·머지·배포 · PR 머지
- 허용 목록 밖 수정 · 구조 재설계 · 스키마 추가
- 허브 카드·미리보기 경로 오염 · 162 계약 파손
```

---

## §발송·검수 메모 (우동공과2)

- 2026-10-07 06:54: 209 점검 합격 → 이 문서 작성. 클라우드 발송은 부모 에이전트. git push·클라우드 직접 접촉 0.
- 숫자 기준(hide tip 실측): today-hub 59/0 · labels 198→**202** · shop 54/0 · previewScreens 17 · 새 mjs≥35 · 새 php≥40.
- 베이스 (a) 유지: hide `2723c5f` + 162 쿼리 두 파일 복사.

---

## §검수 결과 (2026-10-07, 4c865bd)

- **검수:** 2026-10-07 07:15 KST, 우동공과2 (종현 수면 중 · t1523 야간 위임). 대상 보고: 클라우드 `bc-784766e2-0c1f-58fc-baf2-05479afc8b33` 마지막 메시지(구현 보고 §1~§9).
- **방법:** `git fetch` 후 새 워크트리 `/workspace/study114-wt-159c`(detached `4c865bd`)에서 13개 파일 hunk 전부 읽음 → 숨김 tip(`/workspace/study114-wt-hide`, 읽기 전용 실행만)과 브랜치에서 검사 직접 재실행 → 박스 MariaDB(127.0.0.1:3306 `study114_dev`, 시험 전용 DB 새로 만듦)와 `php -S 127.0.0.1:8159`로 API 직접 확인. **브랜치 수정·push·PR·클라우드 재접촉 0.**

### 판정: **검수완료** — 배포 직전·종현 승인 대기

「잠긴 정책과 어긋난 오류」 **0건** · 결함(차단) **0건** · 관찰(비차단) 4건(아래 §5). 재작업지시서(213) **만들지 않음**.

### 1. 커밋·브랜치·PR

| 검사 | 결과 |
|---|---|
| `origin/main` | `11b0c0d82769ba27fa0792be59550e0aa14f233d` (변동 없음) |
| `origin/cursor/hide-inquiry-20261007` | `2723c5fdd61102c50adb24af4ede0d16b0ccc493` |
| `origin/cursor/admin-162-20261007` | `0a7005c42367d824bebc44d36fe20b22cd546f1a` |
| `origin/cursor/admin-159c-20261007` | `4c865bd45447045f5372f315eeb45c3771c909f6` — `feat(admin): 회원관리에 등록 목록을 더한다` (2026-10-07 07:09 KST, Cursor Agent) |
| 부모 / `git log 2723c5f..4c865bd` | 부모 = `2723c5f` 정확히 1개 · 커밋 1개 · force 흔적 없음(hide tip이 조상) |
| PR | GitHub API `head=leejetty-commits:cursor/admin-159c-20261007` state=all → **0건** |
| `git diff --stat 2723c5f..4c865bd` | **13 files, +1687 / -0** — 전부 §2 허용 목록(1~13) 안 · 허용 밖 0 |
| 추가만(a28-copy/screens/bind/css) | numstat `9/0`·`2/0`·`2/0`·`12/0` · `^-` 지운 줄 **0** |
| `a28-screens-state.js` · `sql/**` · `SettlementReportService` · today-hub/labels/shop 스크립트 · `package.json` | diff **0** |

### 2. hunk 대조 (전부 합격)

| 항목 | 근거 | 판정 |
|---|---|---|
| 메뉴 위치 | `a28-copy.js:221-228` `grp-members` children에서 「회원 목록」(`members`) **다음** · §1-4 객체와 글자 단위 동일 · `A28_MENU_ID_LABELS`에 `registrations: '등록 목록'` 1줄 | 합격 |
| 라우트·바인딩 | `a28-screens.js` import 1 + `/admin/members` 분기 바로 다음 1줄 · `a28-screens-bind.js` import 1 + 회원 분기 바로 다음 1줄(162 settlement hunk와 떨어짐) · 운영문의 비트 삭제·이동 0 | 합격 |
| 탭 | `a28-registration-list-copy.js` 공부방/과외쌤/학생 3개 · 지역 칸 홍보지역/**과외지역**/희망지역 · 칸 4개(이름·지역·등록일·노출 상태) | 합격 |
| 금지 문구 | 새 파일·추가 줄에 「학부모」「의뢰」「보드」 0 (`a28-copy.js:566-567` 「학부모」는 숨김 tip 기존 치환표, 이번 diff 아님) | 합격 |
| 탭 상태 | `a28-registration-list.js`의 모듈 변수 + 주소 `#/admin/registrations?role=…&page=…` · state.js 0 · 페이지 번호(이전/다음), 무한스크롤 0 | 합격 |
| 숨김 포함 | `where()`에 `profile_status`/`exposure_status` 조건 없음 · 새 `selectAdmin`이 raw 상태값 SELECT · 상태 글자표 hidden→숨김·published→게시중·draft→작성중·pending→검토중(`AdminRegistrationListRepository:19-24`) | 합격 |
| 삭제 제외 | 호출은 `listByRoleForAdmin(..., false, ...)` 1곳뿐(`AdminRegistrationListRepository:71`) → 공부방 `sr.deleted_at IS NULL` · 학생 `s.deleted_at IS NULL` · 과외 162 SQL 그대로(`WithdrawnOwnerSql` 0) | 합격 |
| 지역 라벨·필터 | 라벨 = `OfficialRegionLabel::resolve()['label']` · 필터 = 대표 id 일치 OR (시·군·구 행 자신) OR (동 행 `sigungu_code` 앞 5 = 요청 시·군·구 `official_code` 앞 5, `is_selectable=1`) — `OfficialRegionLabel::selectableSigunguForDong`과 같은 기준 · 조건은 `WHERE` 안, `ORDER BY … LIMIT` **앞**(`BasicCardRegisteredQuery.php:179-181`) | 합격 |
| 대표 지역 칼럼 | 공부방 `study_room_regions.slot=1` · 과외 `tutor_regions.priority_order=0` · 학생 `CASE preferred_lesson_type` 해당 칼럼만 · `study_rooms.region_id` 미사용 | 합격 |
| 최근 1주 | `range()` = `now()->modify('-6 days')` → `dayRange(시작일)['start']` ~ `dayRange(오늘)['end']` = `[오늘-6 00:00, 내일 00:00)` · 실측 응답 `from=2026-10-01 to=2026-10-07` · `weekRange` 호출 0 | 합격 |
| 162 계약 | `countByRole`·`listByRole`·`countRole`·`where`·`selectList`·`bounds`·`from`·`assertRole` 8개 본문을 `0a7005c`와 추출 비교 → **바이트 동일**(예: where sha256 앞16 `fc182b44c927dc30` 양쪽 같음). 1~141줄 원본 그대로, 142줄 이후에만 새 메서드 추가 | 합격 |
| ReportPeriod | sha256 `2003b20be9de824e01e96baffa894ebced428fae43dc9ab20b7da9c9829db22c` = `git show 0a7005c:src/Report/ReportPeriod.php` · `diff` 0 | 합격 |
| API | `registrations.php` = `bootstrap → run → requireAdmin → method()!=='GET'→405` · `requireMaster` 0 · `readJson` 0 · `perPage` 상한 100 · 기본 role=study_room/page=1/perPage=50 · SQL 문자열은 Repository에 없음(205 이중화 0) | 합격 |
| 클라이언트 API | `registration-list-api.js` `method: 'GET'` 1 · POST/PATCH/PUT/DELETE 0 (`readJson`은 응답 파싱 함수 이름, 쓰기 아님) | 합격 |
| 미리보기·허브 | `ADMIN_PREVIEW_PATHS` 17 그대로·등록 경로 없음 · `ADMIN_TODAY_CARDS` 4 그대로 · 허브 5번째 카드 0 | 합격 |
| 날짜 | `users.created_at` 0 · 허용 PHP에 `DATE(` 0 · `>= :start AND < :end`만 | 합격 |
| CSS | 파일 끝(숨김 tip 1042줄 다음) `.admin-shell .a28-reg-table…` 규칙 2개만 · 새 `@media` 0 · 기존 규칙 변경 0 | 합격 |

### 3. 검사 숫자 (박스 직접 실행, 전 = 숨김 tip `2723c5f`, 후 = `4c865bd`)

| 검사 | 전 | 후 | 기준 | 판정 |
|---|---|---|---|---|
| `verify-admin-today-hub.mjs` | `pass=59 fail=0` | `pass=61 fail=0` | 59→61(css 2) | 합격 — 늘어난 이름 `css-admin-shell-20`·`css-admin-shell-21`만(추가 `.admin-shell` 규칙 2개 자동 집계) · 줄어든 이름 0 · 허브 카드 검사 그대로 |
| `verify-admin-preview-labels.mjs` | `198/0 previewScreens=17 realHits=0` | `202/0 previewScreens=17 realHits=0` | 202·17 | 합격 — 늘어난 이름 `real-body/real-menu/real-notice/real-title /admin/registrations` 4개 |
| `npm run verify:shop-page` | `pass 54 / fail 0` | `pass 54 / fail 0` | 54 | 합격 |
| `verify-admin-registration-list.mjs` | — | `pass=46 fail=0` | ≥35 | 합격 (에이전트 46과 같음) |
| `verify-admin-registration-list.php` | — | `pass=69 fail=0` | ≥40 | 합격 (에이전트 69와 같음) |
| `php -l` 5개 | — | 전부 `No syntax errors detected` | 통과 | 합격 |
| `npm run build` | — | 성공 · `dist/assets/index-CcH3Y-sl.js`(에이전트 보고와 같은 해시) · `/admin/registrations` 5회 · `role:"study_room",label:"공부방"},{role:"tutor",label:"과외쌤"},{role:"student",label:"학생"}` 있음 | 성공 | 합격 |

### 4. API 직접 확인 (박스 `php -S 127.0.0.1:8159`, php 검사가 남긴 시험 데이터)

| 확인 | 결과 |
|---|---|
| 비로그인 GET | **401** |
| 비관리자(guardian_student) GET / POST | **403** / **403** |
| 부마스터 GET · 최고관리자 GET | **200** · **200** |
| 최고관리자 POST·PUT·PATCH·DELETE | 전부 **405** `method_not_allowed` |
| 새로고침(같은 GET 2회) | 공부방 4=4 · 과외 1=1 · 학생 4=4 · **응답 본문 동일** · 추가 GET 후 `CHECKSUM TABLE`(5개 표) 변동 0 → 읽기 전용 |
| 숨김 포함 | 숨김공부방·숨김과외·숨김학생 모두 목록에 「숨김」으로 나옴 |
| 삭제 제외 | 삭제공부방(`deleted_at` 있음)·삭제학생 **안 나옴** · 과외는 행 DELETE 후 0(php 검사 `tutor-delete-after`) |
| 상태 글자 | 게시중·작성중·검토중·숨김 각 1 이상 |
| 기본 1주 | 8일 전(옛공부방 09-29)·먼공부방(09-07) 기본 보기에서 0 · `from=2026-09-01&to=2026-10-07`이면 6건 |
| 지역 필터 | `region=1`(강남구) 공부방 4 · `region=3`(해운대구) 공부방/과외/학생 **0/0/0** · 학생 `region=1` 3(엇갈린학생 제외) |
| 응답 칸 | 항목 키 `name·region·registered_at·status` 4개만 · 등록일 `YYYY-MM-DD` |
| 기타 | `perPage=500`→100 · `role=parent`→422 · `from`만→422 · `page=2&perPage=2`→다음 2건 |

### 5. 관찰 (비차단 · 재작업 불요)

1. **스크린샷 증거 공백.** 보고의 `/tmp/159c-1~7-*.png`은 에이전트 VM에만 있고 `/workspace/cloud-agent-artifacts/bc-784766e2-…` 폴더가 **없음**(박스 `/tmp`에도 없음). 화면은 mjs 렌더 검사(제목·탭 3·칸·과외지역·`member-inquiry-kept`)·build dist·API 실측으로 대신 증명되어 불합격 사유는 아님. 종현 눈 확인은 배포 전 로컬 미리보기 1회 권장(아래 확인 목록 7).
2. **php 검사 뒤 `php -S :8092`가 남음.** `stopApi()`의 `pkill -f 'php -S 127.0.0.1:8092'`가 실제 명령(`php -d session.save_path=… -S …`)과 안 맞아 프로세스가 고아로 남음(이번 검수에서 직접 종료). 검사 결과에는 영향 없음. 나중에 손볼 거리.
3. **mjs `diff-allowed`가 추적 안 된 파일도 셈.** 워크트리에 `node_modules` 심볼릭 링크·shop 결과물이 있으면 FAIL(박스 첫 실행 45/1). 깨끗한 상태(추적 안 됨 0)에서 46/0. 코드 결함 아님·검사 환경 민감.
4. **지역 필터 동→시·군·구 매칭은 상위 집합.** SQL은 앞 5자리가 같은 선택 가능 행 **아무거나**와 맞추고, `OfficialRegionLabel`은 그중 **id 가장 작은 1개**를 고름. 같은 앞 5자리 선택 가능 행이 둘 이상인 데이터에서만 차이(필터가 더 넓게 포함). 현재 지역표 구조상 드묾. 정책 위반 아님.

### 6. 「배포 직전·종현 승인 대기」

- 159-c `4c865bd`는 **검수완료**. main 머지·배포·PR 생성은 **하지 않음**(종현 승인 후 별도 지시).
- 착륙 순서 메모: 159-c는 숨김 tip 위 1커밋 → 숨김(`2723c5f`) 먼저 또는 함께. 162(`0a7005c`)와는 `BasicCardRegisteredQuery.php`(1~141줄 동일 + 159-c 추가분)·`ReportPeriod.php`(동일)만 겹침 → **동일 내용 합침**(재복사·이중 정의 금지, §7).

### 7. 종현 확인 목록

1. 지운 과외쌤: 스키마 추가 없이 162 SQL 유지(행 삭제=제외, 탈퇴 주인 행은 포함) — 이대로 둘지.
2. 최근 1주 = KST 오늘 포함 7일(`[오늘-6, 내일)`), 달력 주(월요일) 아님 — 이대로 둘지.
3. 상태 글자 4단(숨김/게시중/작성중/검토중), 작성중을 게시중에 합치지 않음 — 이대로 둘지.
4. 지역 필터 입력이 **숫자 칸(regions.id)** — 지금 화면은 시·군·구 번호를 직접 넣는 방식. 드롭다운은 이번 범위 밖. 운영자가 쓰기에 괜찮은지.
5. 학생의 희망지역이 수업 방식과 반대 칼럼에만 있으면 목록에는 나오되 지역 칸이 **빈칸**(필터 시에는 제외) — 이대로 둘지.
6. 메뉴 「회원관리 → 등록 목록」, 허브 카드 없음(Q3) · 숨김 카드 포함(Q4) 최종 확인.
7. 배포 전 로컬 미리보기로 화면 1회 눈 확인(에이전트 스크린샷 7장이 박스에 없음).
8. 착륙 순서: 숨김 → (162 / 159-c) 묶음 승인 여부와 순서.

- **다음:** 종현 승인 → main 반영·배포 별도 지시. 우동공과2는 여기서 정지.
