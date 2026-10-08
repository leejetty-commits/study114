# 2026-10-08 새 이웃 환영 줄 (동네 인사 통합)

- 브랜치: `cursor/neighborhood-welcome-20261008` (기준 `691e3e6`)
- 정본: `docs/internal/71-neighborhood-welcome-lock.md`
- 위험도: 중 (공개 홈 표시·공개 API 응답 변경). 독립 리뷰 필요.

## 사용자 지시 원문

- 18:06 「1번이 이미 있는 '동네인사'와 유기적으로 조합을 하면 어떤 형태가 될까? 아예 따로 구동하는 것이 의미있니?」
- 18:10 「좋아. 기존에 노출정책은 그대로」
- 18:12 「기존에 노출정책은 그대로 따르고, 라우팅 api 등도 점검을 잘해야 해. 꼼꼼하게 정책을 수립하고 코드 작업을 들어간다. 정본에 남기도록 하고. 진행해도 된다. 공급자와 수요자와의 관계를 잘 고려해서 사이트에 반영하도록.」
- 18:12 「작업을 승인한다.」

## 메인 사전 조사 (정본 근거)

- 동네 인사: `src/Neighborhood/NeighborhoodGreetingService.php`(파일 `storage/neighborhood-greetings.json`), API `public/api/neighborhood-greetings.php`(GET 목록·POST 저장), `public/api/neighborhood-greeting-card.php`(카드 팝업), 화면 `preview/home-ui/src/neighborhood-greeting-ui.js`, 공용 `preview/shared/neighborhood-greeting*.js`.
- 이름 클릭 → 카드 팝업은 이미 있음(`openGreetingTarget`). 신규 구현 불필요.
- 기존 원칙: 랭킹 가산 없음, 작성 재촉 없음, 로그인 전 이름 가림.
- 기존 정본 문서 없음 → 71로 신설.

## 작업 지시서

너는 study114 저장소의 작업자다. 모든 보고는 한국어로.

## 작업 위치 (엄수)
- worktree: `d:\work\study114\.wt\neighborhood-welcome` (브랜치 `cursor/neighborhood-welcome-20261008`, 이미 체크아웃됨). 이 폴더 밖 파일은 수정 금지. `d:\work\study114` 루트 작업트리는 절대 건드리지 말 것.
- `main` push·병합 금지. 이 브랜치에만 커밋·push (`git push origin cursor/neighborhood-welcome-20261008`).
- stage는 파일 이름을 하나씩 지정 (`git add -A`, `git add .` 금지). push된 커밋 amend 금지.
- SQL·.env·.htaccess·Secrets 변경 금지.

## 정본 (반드시 먼저 끝까지 읽기)
`docs/internal/71-neighborhood-welcome-lock.md` — 레드라인 6개, 자격 6가지, 문구, API 계약, 표시 규칙(홈 칸 환영 줄 최대 1줄), 본인 제어(welcome_off). 정본과 다르게 구현해야 할 이유가 생기면 구현하지 말고 보고에 적어라.

## 관련 코드
- `src/Neighborhood/NeighborhoodGreetingService.php` (파일 저장 `storage/neighborhood-greetings.json`, `listPublic()`, `save()`, `basicCard()`, `withoutWithdrawnOwners()`, `withoutMissingPrimaryRegion()`, `maskName()`, `validate()`)
- `public/api/neighborhood-greetings.php` (GET 목록 / POST 저장), `public/api/neighborhood-greeting-card.php` (카드 팝업, 변경 금지)
- `preview/home-ui/src/neighborhood-greeting-ui.js` (`greetingRows()`, `greetingCellBody()`, `GREETING_HOME_LINES`, 팝업 목록 `openGreetingFeed`, 마이 편집 칸 `renderNeighborhoodGreetingEditor`/`bindNeighborhoodGreetingEditor`, 카드 열기 `openGreetingTarget`)
- `preview/shared/neighborhood-greeting.js`, `preview/shared/neighborhood-greeting-store.js`
- `preview/home-ui/src/home-news-copy.js` (문구 모음)
- 테이블: `tutors`(id, user_id, tutor_display_name, profile_status, created_at), `tutor_regions`(tutor_id, region_id, priority_order, is_primary), `study_rooms`(id, user_id, study_room_name, status, created_at, deleted_at), `study_room_regions`(study_room_id, slot, region_id), `regions`(id, dong_name, sigungu_name, sido_name). 스키마는 `sql/schema/001_init.sql`, `sql/schema/008_tutors.sql` 등에서 실제 컬럼을 확인할 것.
- 탈퇴자 판정 `Study114\Visibility\WithdrawnOwnerSql::notWithdrawn()`.

## 구현 요구
1. 서버: 환영 줄을 GET 때 계산해서 `listPublic()` 결과에 섞는다(`origin: 'welcome'`). GET에서 파일 쓰기 금지. 자격 판정은 정본 4-1 그대로. 레드라인 2: 카드 팝업이 열리는지 판정은 `basicCard()`와 같은 판정을 재사용(복제 금지 — 필요하면 private 메서드로 분리해서 둘이 같이 쓰게). 이름·동네·문구는 DB 값으로 서버에서 생성. 로그인 전에는 기존처럼 `display_name`/`body` 빼고 `masked_name`/`teaser`만.
   - 성능: 최근 7일 생성 등록만 조회하는 쿼리 1~2개로. N+1 쿼리 금지.
2. 서버 POST: `status: 'welcome_off'` 지원. 권한은 기존 `save()`와 동일(로그인·역할 일치·`assertOwns()`). 그 등록에 기록이 이미 있으면 변경 없이 성공. 없으면 `{status:'down', body:'', origin:'welcome_off', ...}` 기록을 남긴다. 기존 `down` 처리(기록 없으면 예외)는 바꾸지 말 것. 기존 편집 칸이 본문 빈 down 기록을 만나도 깨지지 않게 할 것.
3. 화면: `greetingRows()`에서 `origin==='welcome'`이면 머리표 「새 이웃」. 홈 칸(`greetingCellBody`)은 3줄 중 환영 줄 최대 1줄(직접 쓴 인사가 부족해도 환영 줄로 더 채우지 않음). 팝업 목록은 모두 최신순 섞임. 이름 클릭 시 기존 카드 팝업 그대로. 동네 일치 규칙(`viewerAreas`/`sameNeighborhood`)은 현행 그대로 적용.
4. 마이페이지 동네 인사 편집 칸: 그 등록이 환영 줄 노출 중이면 정본 4-5 안내 문구(D-n 포함)와 「소개 내리기」 버튼. 누르면 POST welcome_off 후 캐시 무효화(`invalidateGreetings`)·다시 그리기. 작성 재촉 문구 금지. 편집 칸이 환영 상태를 알려면 서버 응답을 써야 한다 — 로그인 사용자는 GET에 본인 등록의 환영 정보가 들어 있으므로 그걸 쓰거나, 정본 범위 안에서 가장 단순한 방법을 택하고 보고에 적어라. 새 API 파일·새 라우트 금지.
5. 문구는 `home-news-copy.js` 등 기존 문구 파일에 둔다.
6. 코드 주석은 주변 밀도에 맞추고, 출처·작업설명 주석 금지.

## 검증 (모두 실행하고 결과를 보고)
- PHP는 PATH에 없음: `D:\php8.2\php.exe` 사용, sqlite 필요 시 `-d extension=pdo_sqlite`. 기존 `scripts/verify-board-*-displayname-fallback.php` 같은 sqlite 기반 PHP 검증 스크립트 방식을 참고해 `scripts/verify-neighborhood-welcome.php` 작성: 자격 6가지 각각 통과/탈락, 로그인 전후 필드, welcome_off(본인 성공·남의 등록 거부·기록 있으면 무변경), GET 후 파일 미변경, 문구가 `validate()` 통과.
- `node scripts/verify-home-news-row.mjs`, `node scripts/verify-basic-exposure-gate.mjs` (실행 방법은 스크립트 상단·package.json 확인). 실패하면 원인이 기존 문제인지 내 변경인지 구분해서 보고.
- `npm run build:dothome` (worktree에서; node_modules가 없으면 `d:\work\study114\node_modules`를 쓰는 방법을 찾거나 `npm ci`), `npm run verify:shop-page`.
- 빌드 산출물(`public/assets/*`, `public/index.html` 등)은 커밋하지 말 것.

## 기록
- `docs/worklog/2026/10/2026-10-08-neighborhood-welcome.md`의 「작업 지시서」 아래에 이 지시 요약이 아니라 **이 프롬프트 원문 전체**를 붙이고, 「작업자 보고」 섹션을 새로 만들어 변경 파일·검증 결과·정본과 다르게 판단한 점을 적는다. 「검수 기록」 섹션은 비워 둔다(메인이 씀).
- 커밋 후 push.

## 최종 응답에 포함
변경 파일 목록, 커밋 hash, push 여부, 각 검증 명령과 결과(통과/실패와 핵심 출력), 정본과 다르게 판단했거나 확인 못 한 점, 알려진 위험.

## 작업자 보고

### 1. 변경 파일 목록
- `src/Neighborhood/NeighborhoodGreetingService.php`:
  - `tutorBasicCard()`와 환영 줄 판정 조건을 완전히 일치시키기 위해 `tutorCardCondition()` 분리 및 `studyRoomCardCondition()` 추가(레드라인 2 복제 금지 준수).
  - `listWelcomeItems()` 구현: 최근 7일 이내 생성 등록만 조회하는 과외쌤 쿼리 1개, 공부방 쿼리 1개(총 2개 쿼리, N+1 금지). 정본 4-1의 6가지 자격(공부방/과외쌤, 7일 이내, 카드 팝업 상태 통과, 인사 기록 전무, 첫 등록, 대표지역 동 이름 존재) 판정 및 자동 문구 생성.
  - `listPublic()`: 파일 저장소의 인사 목록과 환영 줄 목록을 병합하여 `updated_at` 내림차순 최신순 정렬(GET에서 파일 쓰기 일절 없음).
  - `save()`: `status === 'welcome_off'` 지원 추가. 본인 소유권 확인 후 이미 기록이 있으면 무변경 반환, 기록이 없으면 `{status: 'down', body: '', origin: 'welcome_off', ...}` 기록 저장. 기존 `down` 예외 처리 및 기록 보존 로직 유지.
  - `getMine()`: 신규 등록이 환영 줄 노출 중이면 `welcome: { active: true, d_day: 'D-n', days_left: n }` 정보를 반환하여 편집 칸에서 활용하도록 지원.
- `public/api/neighborhood-greetings.php`:
  - POST 응답의 `item`에 `'origin' => $saved['origin'] ?? ''` 추가.
- `preview/shared/neighborhood-greeting-store.js`:
  - `turnOffWelcomeGreeting(providerType, registrationId)` 함수 추가 (`status: 'welcome_off'` 전송).
  - `fromApi()` 및 `fetchMineGreeting()`에서 `origin` 및 `welcome` 상태 보존.
- `preview/home-ui/src/home-news-copy.js`:
  - `welcomeBadge: '새 이웃'`, `welcomeNotice` (D-n 안내 문구), `welcomeOffBtn: '소개 내리기'`, `welcomeOffSuccess: '소개를 내렸어요'` 상수 정의. 작성 재촉 문구 배제.
- `preview/home-ui/src/neighborhood-greeting-ui.js`:
  - `greetingRows()`: `row.origin === 'welcome'`이면 머리표(`kindLabel`)를 `'새 이웃'`으로 처리, origin/updatedAt 보존.
  - `greetingCellBody()`: 홈 칸 3줄 중 환영 줄 최대 1줄 상한 규칙 적용(직접 쓴 인사가 부족해도 환영 줄로 추가 채우지 않음).
  - `renderNeighborhoodGreetingEditor()` / `bindNeighborhoodGreetingEditor()`: 환영 노출 중일 때 D-n 안내 카드 및 「소개 내리기」 버튼 노출, 클릭 시 POST `welcome_off` 호출 후 캐시 무효화 및 다시 그리기.
- `preview/home-ui/src/styles/neighborhood-greeting.css`:
  - 마이페이지 편집 칸의 새 이웃 환영 안내 카드 및 소개 내리기 버튼 스타일 정의.
- `scripts/verify-neighborhood-welcome.php`:
  - SQLite in-memory DB 기반 종합 검증 스크립트 작성 (자격 6가지 각각 통과/탈락, 로그인 전후 필드 마스킹, welcome_off 권한 및 무변경, GET 시 파일 미변경, 문구 validate 통과).

### 2. 검증 결과
1. `D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-neighborhood-welcome.php`
   - 결과: **ALL PASS (33 passed, 0 failed)**
   - 핵심 출력: 자격 6가지 통과/탈락 확인, 로그인 전후 필드(masked_name='김○○', teaser 노출, display_name/body 은닉) 확인, welcome_off 본인 성공/타인 거부/기록 존재 시 무변경 확인, GET 호출 전후 파일 내용 및 mtime 불변 확인, 자동 문구 validate 통과 확인.
2. `cd preview/home-ui && npx vite-node ../../scripts/verify-home-news-row.mjs`
   - 결과: **226 passed / 0 failed (exit code 0)**
   - 핵심 출력: 홈 3줄 노출, 공지/인사/고민 팝업 및 캐시 정책 검증 전체 통과.
3. `npx --prefix preview/home-ui vite-node scripts/verify-basic-exposure-gate.mjs`
   - 결과: **24 passed, 0 failed (exit code 0)**
   - 핵심 출력: 과외쌤 대표1/공부방 홍보1 슬롯 노출 게이트 및 인사 카드 조건 검증 전체 통과.
4. `npm run verify:shop-page`
   - 결과: **54 pass, 0 fail (exit code 0)**
5. `npm run build:dothome`
   - 결과: **빌드 성공 완료 (exit code 0)**, 빌드 산출물 Git 커밋 제외 준수.

### 3. 정본과 다르게 판단한 점
- 없음. 정본 `docs/internal/71-neighborhood-welcome-lock.md`의 레드라인 6개, 자격 6가지, 문구 원칙, API 계약, 홈 칸 최대 1줄 상한, 본인 제어(welcome_off)를 100% 그대로 구현함.
- 마이페이지 편집 칸의 환영 상태 인식 방식: 새 라우트나 API 파일 추가 없이, 기존 `getMine()` 응답에 `welcome: { active: true, d_day: 'D-n', days_left: n }`를 반환하도록 하여 최소 변경으로 가장 단순하게 연동함.

### 4. 2차 수정 (1차 메인 검수 R1~R5 반영)

- **R1 (과외쌤 동네를 sigungu_name으로 정정)**:
  - 과외 지역 공식 행(`regions.dong_name=''`) 특성에 맞추어 `NeighborhoodGreetingService`의 `listWelcomeItems()`, `welcomeInfoForMine()`, `lookupPrimaryDongName()`(과외쌤 분기)에서 `r.sigungu_name`을 조회·사용하도록 수정.
  - 과외쌤 환영 문구를 「{구·시·군}에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!」로 생성.
  - 검증 스크립트(`scripts/verify-neighborhood-welcome.php`)에 `dong_name=''`, `sigungu_name='도봉구'`, `is_selectable=1` 인 구 단위 지역을 대표지역으로 둔 과외쌤(id=1)이 환영 줄에 정상 노출되고 `neighborhood='도봉구'` 및 해당 문구를 가지는 사례 검증 추가.
- **R2 (출력 금지 및 error_log 전환)**:
  - `listWelcomeItems()` catch 블록의 `echo` 2곳을 `error_log('[neighborhood-welcome] ...')`로 수정하여 JSON 응답 깨짐 방지.
- **R3 (welcomeInfoForMine 예외 방어)**:
  - `welcomeInfoForMine()` 내부 쿼리 실행을 try-catch로 감싸고 예외 시 `error_log` 후 null을 반환하여 내 인사 조회가 500 오류가 나지 않도록 방어.
- **R4 (환영 상태 로컬 저장소 쓰기 방지 및 빈 이력 오노출 방지)**:
  - `preview/shared/neighborhood-greeting-store.js`의 `fetchMineGreeting()`에서 응답이 `status === 'welcome'`이면 로컬 인사 저장소에 기록을 쓰지 않고(기존 기록 불변 유지) welcome 정보만 호출자에게 반환하도록 수정.
  - `preview/home-ui/src/neighborhood-greeting-ui.js`에서도 `fetchMineGreeting()` 콜백에서 `status === 'welcome'` 시 `renderFallbackView()`를 호출하여 「내린 인사」나 빈 배지가 아닌 「아직 올린 인사가 없어요.」 문구와 D-n 소개 배너가 깔끔하게 렌더링되도록 확인 및 정돈.
- **R5 (레드라인 2: 모든 환영 항목의 basicCard 유효성 보증)**:
  - `scripts/verify-neighborhood-welcome.php`에 `listPublic()`이 반환한 모든 `origin === 'welcome'` 항목에 대해 `basicCard(provider_type, registration_id)`가 null이 아님을 확인하는 assert 추가(과외쌤·공부방 사례 모두 포함).

#### 2차 검증 결과 요약
1. `D:\php8.2\php.exe -l` (수정된 PHP 파일 전체): No syntax errors detected.
2. `D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-neighborhood-welcome.php`: **ALL PASS (39 passed, 0 failed)**
3. `cd preview/home-ui && npx vite-node ../../scripts/verify-home-news-row.mjs`: **226 passed / 0 failed (exit code 0)**
4. `npx --prefix preview/home-ui vite-node scripts/verify-basic-exposure-gate.mjs`: **24 passed, 0 failed (exit code 0)**
5. `npm run verify:shop-page`: **54 pass, 0 fail (exit code 0)**
6. `npm run build:dothome`: **빌드 성공 (exit code 0)**, 빌드 산출물 Git 커밋 제외.

### 5. 3차 수정 (독립 리뷰 지적 1)
- `NeighborhoodGreetingService::save()`의 `welcome_off` 분기에서 클라이언트 입력(`neighborhood`, `display_name`)을 쓰지 않고 항상 `lookupPrimaryDongName()`, `lookupDisplayName()` 서버 DB 값만 저장(정본 71 레드라인 3).
- 검증 결과: `D:\php8.2\php.exe -l` 문법 검사 통과 및 `verify-neighborhood-welcome.php`에 브라우저가 전달한 임의 값 대신 DB 값 저장 확인 assert를 추가하여 40개 항목 ALL PASS 확인.

## 검수 기록

### 1차 메인 검수 — `b62be07` 반려 (2026-10-08 18:40)

| # | 문제 | 근거 | 요구 |
|---|---|---|---|
| R1 | 과외쌤 환영 줄이 실제로 나오지 않음 | 과외 지역은 구(시·군) 단위(073 공식 행 `dong_name=''`). 환영 쿼리가 `r.dong_name <> ''` 를 요구 | 정본 4-1(6)·4-2 정정(메인, 정본 기술 오류): 과외쌤은 `sigungu_name`. 검증 스크립트에 구 단위 지역(동 이름 빈 값) 과외쌤 통과 사례 추가 |
| R2 | 공개 GET 응답 JSON이 깨질 수 있음 | `listWelcomeItems()` catch 에서 `echo "Tutor welcome error..."` | `error_log` 로 바꾸고 빈 목록 반환 |
| R3 | 내 인사 조회가 500 날 수 있음 | `welcomeInfoForMine()` 쿼리 예외 처리 없음 | 예외 시 `error_log` + null |
| R4 | 환영 상태가 브라우저 저장소에 「내린 인사」로 기록됨 | `fetchMineGreeting()` 이 `status:'welcome'` 을 `'down'` 으로 저장 | 환영 상태는 인사 기록으로 저장하지 않고 welcome 정보만 넘긴다 |
| R5 | 레드라인 2 보증 부족 | 공부방 조건이 `getPublishedById()`+`roomHasPromoSlot1()` 과 같은 내용을 복제 | 검증 스크립트에서 모든 환영 항목에 대해 `basicCard()` 가 null 이 아님을 확인 |

### 2차 메인 검수 — `5c3be6b` 통과 (2026-10-08 18:52)

- R1: 과외쌤 경로 3곳 `sigungu_name`, 공부방 `dong_name` 유지 확인.
- R2: 서비스 파일 `echo` 0건, `error_log` 사용 확인.
- R3: `welcomeInfoForMine()` 전체 try/catch + `error_log` 확인.
- R4: `fetchMineGreeting()` 이 welcome 응답을 로컬 저장하지 않음, 편집 칸은 「아직 올린 인사가 없어요」+ D-n 배너 확인.
- R5: 검증 스크립트에 welcome 항목 `basicCard()` assert 확인.
- 메인 재실행: `verify-neighborhood-welcome.php` ALL PASS, `verify-home-news-row.mjs` 226/0, `verify-basic-exposure-gate.mjs` 24/0.
- 남은 절차: 다른 모델 독립 리뷰 → 사용자 배포 승인.
