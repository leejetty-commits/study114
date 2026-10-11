# 2026-10-10 후기 기능이 서버를 안 부르는 문제 — 조사 보고 (읽기 전용)

- 브랜치: `cursor/review-api-diag-20261010` (기준 `origin/main` = `709f2c59`, T6 병합·배포 #435 뒤)
- 이 브랜치의 커밋은 이 문서 1개뿐. 앱 코드·SQL·설정·배포는 건드리지 않았다.
- 운영 확인 시각: 2026-10-10 11:47~11:57 (KST). 운영 JS 번들 `index-DNlmZ0L6.js`.

---

## 0. 지시서 원문

```
[조사 지시 — 후기 기능이 서버를 안 부르는 문제 / 읽기 전용]
기준: origin/main 최신. 앱 코드 수정·커밋·배포 금지. 결과 보고서 문서 1개만 커밋 허용.
순서: T6 병합·배포가 끝난 뒤 시작한다(T6 작업 순서를 끊지 않는다).

■ 배경 (T6 작업 중 발견, 우동공과2 확인)
- preview/home-ui/src/provider-reviews/store.js 24행 apiMode()는
  sessionStorage 'study114-api-mode'==='1' 또는 window.STUDY114_API_MODE===true 일 때만 /api/reviews/index.php 를 부른다.
- 저장소 전체에서 이 두 값을 켜는 코드가 없다(git grep 결과 store.js 자신과 T6 작업기록뿐).
- 쪽지는 auth-session.js 172행에서 activateMessagesApi()로 로그인 때 서버 연결을 켠다. 후기에는 이런 연결이 없다.
- 서버 쪽 파일은 있다: public/api/reviews/index.php, src/Reviews/ProviderReviewApi.php·Repository·Service.

■ 확인할 것
1. 운영 실제 동작: 운영 사이트에서 로그인 후 마이페이지 후기함, 상세의 후기 시트, 후기 쓰기 화면을 열고
   네트워크 탭에 /api/reviews/ 요청이 한 번이라도 나가는지. 화면별로 「서버 호출 있음/없음」 표.
2. 영향 범위: store.js에서 apiMode()로 갈리는 함수 7곳(292·309·365·397·428·446·473행 근처)이
   각각 어떤 화면·기능(후기 요약·목록·쓰기·삭제·후기차단·작성 횟수 등)에 쓰이는지 표로.
   카드·검색에 보이는 후기 수(SearchService.php 등)가 서버 값인지 브라우저 값인지도 구분.
3. 실제 피해: 지금까지 회원이 쓴 후기가 서버 DB에 저장됐는지, 브라우저에만 있다가 사라졌는지.
   운영 DB는 직접 보지 말고, 종현이 phpMyAdmin에서 돌릴 SELECT 문만 써 줄 것(행 수, 최근 작성일). 쓰기·변경 SQL 금지.
4. 서버 API 준비 상태: index.php가 운영에서 응답하는지(로그인 없이 GET 한 번, 응답 코드만),
   필요한 테이블 마이그레이션 번호와 운영 적용 여부를 확인하는 SELECT.
5. 경위: apiMode()가 처음 들어온 커밋과 그 뒤 변경 이력(git log -S). 원래 켜는 코드가 있다가 빠졌는지,
   처음부터 없었는지.

■ 보고 형식 (docs/worklog/2026/10/2026-10-10-review-api-diag.md 로 커밋, 해시 보고)
- 무슨 문제인지 → 어디서 끊겼는지(파일·행) → 해결안 2~3개와 각각의 영향(바뀌는 파일 수, 기존 브라우저 데이터 처리, 위험)
- 위 1~5 표와 증거(네트워크 캡처, 명령 결과)
- 추측은 「추측」이라고 표시. 직접 확인 못 한 것은 따로 목록.

■ 금지
- 앱 코드·SQL 실행·설정 변경·배포 금지. 해결은 보고 후 종현 결정에 따라 별도 지시서로 한다.
```

---

## 1. 결론 요약

- **운영에서 후기 화면은 서버를 한 번도 부르지 않는다.** 로그인한 공부방(room1)·학부모(student1)로 후기함·후기 시트·상세 후기 섹션·후기 쓰기 화면을 열었을 때 `/api/reviews/` 요청은 **0건**이었다. 같은 시간에 쪽지·검색 등 다른 API 요청은 정상으로 잡혔다.
- **후기는 처음부터 서버에 연결된 적이 없다.** 스위치(`apiMode()`)는 2026-08-10 첫 커밋 `58baf262` 때부터 있었고, 켜는 코드는 어떤 브랜치에도 한 번도 들어온 적이 없다.
- **화면에서 쓴 후기는 그 브라우저 탭에만 저장됐다가 탭을 닫으면 사라진다.** 저장 위치는 처음부터 지금까지 `sessionStorage`다. 상대방(공부방·과외쌤)은 볼 수 없었다.
- **카드·검색의 후기 수만 서버 값이다.** `SearchService.php`가 `provider_reviews`를 센다. 반면 후기 시트·상세 후기 섹션·마이샵 후기 미리보기의 숫자는 브라우저 값이다.
- **서버 API는 살아 있다.** 로그인 없이 GET 한 번에 **200**이 왔다. 코드상 이 요청은 `provider_reviews` 테이블을 그대로 읽으므로, 200이면 040 테이블은 운영에 있다고 본다. 057(삭제·작성 횟수·후기차단·작성 닫기)은 이 요청으로는 확인할 수 없어서, 확인용 SELECT를 §5에 적었다.

---

## 2. 무슨 문제인지 → 어디서 끊겼는지

### 2-1. 문제

후기 쓰기·읽기·숨기기·삭제·후기차단·후기함이 모두 브라우저 안의 미리보기용 저장소(`sessionStorage`)로만 동작한다. 서버 API(`/api/reviews/index.php`)와 DB 테이블은 만들어져 있지만 화면이 그쪽을 부르지 않는다.

### 2-2. 끊긴 곳

| 위치 | 내용 |
|---|---|
| `preview/home-ui/src/provider-reviews/store.js` L24–30 | `apiMode()`는 `sessionStorage 'study114-api-mode' === '1'` 또는 `window.STUDY114_API_MODE === true`일 때만 참. 저장소 어디에도 이 값을 켜는 코드가 없다 (아래 명령 결과). |
| `preview/home-ui/src/auth-session.js` L168–181 `hydrateSessionDependencies()` | 로그인 때 공급자·쪽지(L172 `activateMessagesApi()`)·등록·노출을 서버 모드로 켠다. **후기는 이 목록에 없다.** 로그아웃·세션 실패 때 끄는 곳(L190–195, L211–216, L230–235)에도 후기는 없다. |
| `store.js` L303–305 (`fetchReviewSummary`) | 서버 모드에서도 실패하면 **조용히 브라우저 값으로 대체**한다. 연결을 켠 뒤에도 서버 오류가 화면에 드러나지 않는 원인이 된다 (위험 항목). |
| `store.js` L588·606·654 | 브라우저 모드의 "받은 후기" 계산이 `provider_id === 1`로 고정돼 있다 (미리보기 전용 논리). 운영 공부방·과외쌤의 받은 후기함은 항상 비어 보인다. |

명령 결과 — 현재 저장소 전체(빌드 산출물·node_modules 제외)에서 스위치 이름 검색:

```
> rg -n "study114-api-mode|STUDY114_API_MODE" (node_modules·dist·public/assets 제외)
.\docs\worklog\2026\10\2026-10-10-mypage-t6.md:42  (T6 측정 기록 — 측정 때 시험 브라우저에만 넣었다는 설명)
.\docs\worklog\2026\10\2026-10-10-mypage-t6.md:78  (T6 발견 기록)
.\preview\home-ui\src\provider-reviews\store.js:26  return sessionStorage.getItem('study114-api-mode') === '1' || window.STUDY114_API_MODE === true;
```

운영 번들 확인 (공개 파일 GET):

```
/assets/index-DNlmZ0L6.js len=1506553 api-mode=1 STUDY114_API_MODE=1 reviewsApi=1
```

운영 번들에도 스위치를 읽는 코드 1곳만 있고 켜는 코드는 없다.

---

## 3. 확인 1 — 운영 실제 동작 (화면별 서버 호출)

### 3-1. 방법

- Playwright로 운영 `https://study114.net`에 room1(공부방)·student1(학부모)로 로그인했다. 계정은 스크립트가 비밀 파일에서 읽었다.
- 스위치는 **넣지 않았다** (T6 측정 때와 다름). 운영 그대로의 동작이다.
- 로그인 뒤에는 검색(`/api/search/search.php`, 조회용 POST)만 통과시키고, 나머지 GET이 아닌 요청은 모두 막았다. 후기 제출 버튼은 누르지 않았다.
- 모든 `/api/` 요청을 화면 단계별로 기록했다.

### 3-2. 결과

| 화면 | 계정 | 여는 방법 | `/api/reviews/` 요청 | 화면에 나온 내용 |
|---|---|---|---|---|
| 마이페이지 후기함 `#/mypage/messages/reviews` | room1 | 주소 이동 + 새로고침, 5초 대기 | **없음 (0건)** | 「아직 받은 후기가 없어요. 좋은 수업은 언젠가 꼭 기억으로 돌아와요.」 |
| 마이페이지 후기함 | student1 | 같음 | **없음 (0건)** | 「작성한 후기가 없습니다. 쪽지 상담 후에 후기를 남기면 여기에 모입니다.」 |
| 후기 시트 | room1 | 홈 카드의 💬 버튼(공부방 10) 실제 클릭 | **없음 (0건)** | 「후기 0 … 아직 등록된 후기가 없습니다. 후기는 이용자(학부모/학생)만 남길 수 있어요」 |
| 후기 시트 | student1 | 동네(동춘동)에 공부방 카드가 0개라서, 카드와 같은 `data-action="open-review-sheet"` 버튼을 화면에 임시로 붙여 클릭(공부방 12). 카드 버튼과 같은 문서 전체 클릭 처리기를 탄다. | **없음 (0건)** | 「후기 0 … 아직 등록된 후기가 없습니다. 후기 남기기」 |
| 상세(확대카드) 후기 섹션 | room1 | 홈의 공부방 10 카드 클릭 | **없음 (0건)** | 「후기 실제 이용자들이 남긴 이야기 아직 등록된 후기가 없습니다.」 |
| 상세 후기 섹션 | student1 | 카드가 없어 열지 못함 | 미확인 (§9) | — |
| 후기 쓰기 화면 | student1 | `data-review-view="write"` 버튼(공부방 12) | **없음 (0건)** | 「후기 작성은 쪽지(상담/문의) 경험 후 가능해요」. 입력창은 나오지 않음 (이 계정은 공부방 12와 쪽지가 없다) |
| 후기 쓰기 화면 | room1 | 같음(공부방 10) | **없음 (0건)** | 「후기는 이용자(학부모/학생)만 남길 수 있어요」 |

- 두 계정 모두 측정 중 `sessionStorage`의 `study114-api-mode`는 `null`, `window.STUDY114_API_MODE`도 `null`이었다.
- 브라우저 후기 저장 키 4개는 모두 없음(absent)이었다. 이 탭에서 쓴 후기가 없으니 정상이다.
- 같은 단계에서 다른 API는 정상으로 기록됐다. 예: `GET /api/messages/threads.php`, `POST /api/search/search.php`, `GET /api/handoff/student-reviews.php`. 따라서 "기록이 안 된 것"이 아니라 "요청이 없었던 것"이다.

증거(스크립트가 남긴 기록에서 발췌, 원본은 로컬 `%TEMP%\s114-t3\rv-live\room1.json`·`student1.json`과 화면 캡처 PNG 7장 — 커밋하지 않음):

```
room1    : "reviewsApiTotal": 0   (2026-10-10T02:47:40Z)
student1 : "reviewsApiTotal": 0   (2026-10-10T02:54:52Z)
막은 쓰기 요청(후기와 무관): POST /api/auth/regions.php, POST /api/search/region-stats.php, POST /api/handoff/recent.php
페이지 오류: 0건
```

---

## 4. 확인 2 — 영향 범위

### 4-1. `apiMode()`로 갈리는 곳과 쓰이는 화면

지시서의 7곳에 더해 같은 스위치를 쓰는 곳이 2곳 더 있어 모두 9곳이다.

| store.js 행 | 함수 | 기능 | 쓰는 화면 (호출 위치) | 운영에서 실제로 하는 일 |
|---|---|---|---|---|
| L292 | `fetchReviewSummary` | 후기 요약(개수·태그·최근 후기·쓰기 가능 여부) | 후기 시트 열기·새로고침(`sheet.js` 316·408), 상세 후기 섹션(`ui.js` 29 ← `detail-shell.js` 356), 마이샵 후기 미리보기(`teaser.js` 70 ← `myshop-render.js` 266), `inbox.js` 255(호출하는 화면 없음) | 브라우저 값 |
| L309 | `fetchReviewList` | 특정 대상의 후기 목록(페이지) | 후기함의 대상별 보기(`inbox.js` 155) | 브라우저 값 |
| L365 | `createProviderReview` | 후기 쓰기 | 후기 시트 쓰기 화면 제출(`sheet.js` 369) | **탭의 sessionStorage에만 저장** |
| L397 | `updateProviderReview` | 후기 고치기 | 후기 시트(`sheet.js` 363) | sessionStorage만 고침 |
| L428 | `hide/unhide/deleteProviderReview` (공통 `setLocalStatus`) | 숨기기·다시 보이기·삭제 | 후기함(`inbox.js` 228·234·241), 후기 시트(`sheet.js` 322·328·335) | sessionStorage만 고침 |
| L446 | `blockReviewAuthor` | 후기차단 | 후기함(`inbox.js` 208) | sessionStorage만 |
| L473 | `unblockReviewAuthor` | 후기차단 풀기 | 후기함(`inbox.js` 218) | sessionStorage만 |
| L494 | `setReviewWriteStatus` | 후기 작성 열기/닫기 | `inbox.js` 273 `bindWriteStatusControl` — 이를 그리는 화면을 찾지 못함 | (화면 없음) |
| L624 | `fetchReviewInbox` | 마이페이지 후기함 목록 | 마이페이지 후기함(`inbox.js` 156). `fetchMypageReviewSnapshot`(L699)도 이것을 쓰지만, 받는 쪽 `mypage/screens.js` 220 `hydrateMypageReviewPanel`이 찾는 `[data-mypage-review-list]` 칸을 그리는 화면이 없어 사실상 동작 안 함 | 브라우저 값 |

작성 횟수(최대 3회)는 따로 갈리는 함수가 없다. 쓰기(L365)와 요약(L292) 안에서 브라우저 저장소의 쿼터 키(`study114-preview-review-quotas-v1`)로만 센다.

스위치와 상관없이 **항상 브라우저 값**인 함수:

- `getReviewCount` (L227)
- `syncReviewCountForItem` (L703) — 호출처 없음
- `countWrittenReviewsPreview`·`countReceivedReviewsPreview` (L708·712) — `mypage/preview-data.js` 138–141의 `providerReviewCount`에서 쓰지만, 이 값을 보여 주는 화면은 찾지 못함

### 4-2. 후기 수 — 서버 값인지 브라우저 값인지

| 보이는 곳 | 값의 출처 | 근거 |
|---|---|---|
| 홈·찾기 카드의 💬 숫자 | **서버** (`provider_reviews`에서 `review_status='visible'` 개수) | `src/Search/SearchService.php` L461–469 `reviewCountExpr`(테이블이 없으면 `'0'`), L696·790·935·1038에서 사용 → 앱 `home-basic-live.js` 79·143, `search-exposure-mapper.js` 81·117, `card-visual.js` 181이 `item.review_count`를 그대로 씀 |
| 후기 시트 제목 「후기 N」 | 브라우저 | `fetchReviewSummary` → `summary.review_count` |
| 상세 후기 섹션 제목 숫자 | 브라우저 | `ui.js` 40 `summary.review_count` |
| 마이샵 후기 미리보기 | 브라우저 | `teaser.js` 70 |

운영 검색 응답에서 실제로 받은 값: 공부방 10·11·12와 과외쌤 11 모두 `review_count: 0`이었다. 지금은 카드(서버 0)와 시트(브라우저 0)가 같아 보인다. 서버에 후기 행이 생기면 카드는 N, 시트는 0으로 어긋난다.

---

## 5. 확인 3 — 실제 피해

### 5-1. 코드로 확인한 것

- 운영 화면의 쓰기 경로는 `store.js` L365 브라우저 분기 하나뿐이다. 이 분기는 `fetch`를 하지 않고 `sessionStorage`에 넣는다. 따라서 **화면에서 쓴 후기가 서버 DB로 간 경로는 없다.**
- 저장 위치는 `58baf262`·`1601a882`·`8db5efdc`·`3bf63d06`·`709f2c59` 모두 `sessionStorage`다 (각 커밋의 store.js에서 `localStorage.` 0회, `sessionStorage.` 3회). 탭을 닫으면 사라지고, 같은 사람의 다른 탭·기기, 상대방 공부방·과외쌤에게는 보이지 않는다.
- 브라우저 모드에서 쓰기가 허용되는 조건(`store.js` L201–210):
  - 학부모·학생 역할
  - 후기차단 아님, 작성 닫힘 아님, 남은 횟수 있음
  - 그 대상과의 쪽지가 있음 (`previewHasThread` L86 → `messages/thread-store.js` L165 `getThreads()`)

  운영은 로그인 때 쪽지 서버 모드가 켜지므로 `getThreads()`는 **서버의 실제 쪽지 목록**을 돌려준다. 즉 실제로 공부방·과외쌤과 쪽지를 주고받은 학부모·학생은 후기 쓰기 화면을 열고 "등록"까지 할 수 있었다. 그 후기는 그 탭에만 있었고 지금은 남아 있지 않다.
- 몇 건이 그렇게 사라졌는지는 알 수 없다. 서버에 아무 기록이 남지 않는 구조다.
  - 「추측」 운영 쪽지 상대가 있는 실제 학부모·학생 수가 적어 많지는 않았을 것이다.
- 「추측」 2026-10-09 커밋 `3bf63d06`(「마이페이지 데모 시드(…공급자 후기) 제거」) 전에는 브라우저가 데모 후기를 만들어 보여 줬다. 이 기간 운영 후기 시트·후기함에 보인 후기는 실제 회원 후기가 아니었을 가능성이 크다. 커밋 제목 근거이며 화면으로 확인하지는 않았다.

### 5-2. 종현 님이 phpMyAdmin에서 돌릴 SELECT (읽기 전용)

모두 SELECT만이다. 쓰기·변경 문장은 없다. 한 문장씩 따로 실행해 주세요. 테이블이 없으면 그 문장만 오류가 나고 다른 문장에는 영향이 없다.

```sql
-- [1] 후기 테이블 4개가 운영에 있는지 (040: provider_reviews·provider_review_replies / 057: provider_review_quotas·provider_review_blocks)
SELECT TABLE_NAME, CREATE_TIME
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME IN ('provider_reviews', 'provider_review_replies', 'provider_review_quotas', 'provider_review_blocks')
 ORDER BY TABLE_NAME;

-- [2] 057 칼럼이 적용됐는지
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND ((TABLE_NAME = 'provider_reviews' AND COLUMN_NAME IN ('review_status', 'deleted_at'))
     OR (TABLE_NAME IN ('study_rooms', 'tutors') AND COLUMN_NAME = 'review_write_status'))
 ORDER BY TABLE_NAME, COLUMN_NAME;

-- [3] 057 인덱스 교체(1인 1건 UNIQUE 해제)가 적용됐는지
SELECT DISTINCT INDEX_NAME, NON_UNIQUE
  FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'provider_reviews'
   AND INDEX_NAME IN ('uk_provider_review_author', 'idx_provider_review_author');

-- [4] 후기 행 수·최근 작성일 (상태별)
SELECT review_status, COUNT(*) AS n, MIN(created_at) AS first_at, MAX(created_at) AS last_at
  FROM provider_reviews
 GROUP BY review_status;

-- [5] 040 개발용 시드 모양(작성자 6 → 대상 1)과 나머지 구분
SELECT (author_user_id = 6 AND provider_id = 1) AS seed_like, COUNT(*) AS n, MAX(created_at) AS last_at
  FROM provider_reviews
 GROUP BY seed_like;

-- [6] 딸린 테이블 행 수·최근 날짜
SELECT COUNT(*) AS n, MAX(created_at) AS last_at FROM provider_review_replies;
SELECT COUNT(*) AS n, MAX(updated_at) AS last_at FROM provider_review_quotas;
SELECT COUNT(*) AS n, MAX(created_at) AS last_at FROM provider_review_blocks;
```

결과 읽는 법:

| 결과 | 뜻 |
|---|---|
| [1]이 4줄 | 040·057 테이블 모두 있음 |
| [1]이 2줄(reviews·replies) | 040만 적용, 057 미적용 |
| [2] `review_status`가 `enum('visible','hidden','deleted')`이고 `deleted_at`·`review_write_status` 2줄이 있음 | 057 칼럼 적용됨 |
| [2] `review_status`가 `enum('visible','hidden','reported')` | 057 미적용 |
| [3]에 `uk_provider_review_author`(NON_UNIQUE=0)가 있음 | 057 미적용 (같은 대상에 두 번째 후기를 쓰면 서버 오류) |
| [4]가 0행 | 서버에 후기가 한 건도 없음. §5-1 코드 결론과 맞음 |
| [4]에 행이 있고 [5] `seed_like=1`만 있음 | 040을 운영에 적용할 때 개발용 시드 2건이 들어간 것 (실제 회원 후기 아님) |
| [5] `seed_like=0`에 행이 있음 | 화면이 아닌 다른 경로(직접 API 호출·시험·수동 입력)로 들어간 행. `last_at`으로 시기 확인 |

---

## 6. 확인 4 — 서버 API 준비 상태

### 6-1. 응답 코드 (로그인 없이 GET 1회)

```
GET https://study114.net/api/reviews/index.php?action=summary&provider_type=study_room&provider_id=12
→ status=200   (2026-10-10 11:56 KST 무렵)
```

PowerShell 첫 시도는 지원되지 않는 옵션 때문에 요청을 보내기 전에 실패했다. 실제로 나간 요청은 위 1회다. 응답 본문은 보지 않았다.

200의 뜻 (코드 근거):

- `summary`는 `ProviderReviewService::getSummary` L53 → `ProviderReviewRepository::countVisible` L16–25의 `SELECT COUNT(*) FROM provider_reviews …`를 확인 장치 없이 실행한다.
- 테이블이 없으면 예외가 나고 `ProviderReviewApi::run` L99–101이 **500**을 돌려준다.
- 따라서 200이면 **운영에 `provider_reviews`(040)는 있다.** 이것은 코드로 낸 결론이며, DB를 직접 확인하지는 않았다.
- 057의 `review_write_status`는 `columnExists`로, 작성 횟수·후기차단 테이블은 `tableExists`로 미리 확인하고 없으면 건너뛴다 (Repository L313·326·335·509). 그래서 200만으로는 **057 적용 여부를 알 수 없다** → §5-2 [1]~[3].

### 6-2. 필요한 마이그레이션

| 번호 | 파일 | 만드는 것 | 빠지면 |
|---|---|---|---|
| 040 | `sql/schema/040_provider_reviews.sql` | `provider_reviews`, `provider_review_replies` (+ 개발용 시드 2건: 작성자 6 → 공부방 1·과외쌤 1, 그 사용자·대상이 있을 때만) | 요약·목록·쓰기 모두 500. 단, 운영 200으로 보아 적용된 것으로 판단 |
| 057 | `sql/schema/057_provider_review_engine.sql` | `review_status`에 `deleted` 추가, `deleted_at` 칼럼, 1인 1건 UNIQUE 해제, `provider_review_quotas`, `provider_review_blocks`, `study_rooms`·`tutors.review_write_status` | 삭제·다시 보이기(`deleted_at`·`deleted` 사용, Repository L194·203)와 같은 대상 두 번째 후기(UNIQUE 충돌)가 500. 작성 횟수·후기차단·작성 닫기는 조용히 건너뜀(제한이 안 걸림) |

저장소 문서에서 040·057을 운영에 적용했다는 기록은 찾지 못했다. 정본 `docs/ssot/05-study-room-db.md` L262와 `08-tutor-registration-db.md` L163은 파일 이름만 적고 있다. 2026-10-09 운영 계정 삭제 기록(`2026-10-09-remove-dev-operator.md` §3-1)의 CASCADE 표에 후기 테이블이 있지만, 그 표는 "저장소 스키마 기준"이라고 적혀 있어 운영 근거가 아니다.

---

## 7. 확인 5 — 경위

명령 결과:

```
> git log --all -S"study114-api-mode"   (STUDY114_API_MODE, -S"api-mode" 도 같은 결과)
d84b248e 2026-10-10 05:45 | T6 … (작업기록에 언급만)
58baf262 2026-08-10 03:08 | feat: 공부방·과외쌤 공급자 후기 1차(본문·태그·답글)와 마이페이지 요약을 추가한다

> git log -G"apiMode\(\)" -- preview/home-ui/src/provider-reviews/store.js
1601a882 2026-08-22 02:49 | feat(reviews): 공부방·과외쌤 공통 후기 엔진 잠금 (쿼터·차단·시트·후기함)
58baf262 2026-08-10 03:08 | feat: 공부방·과외쌤 공급자 후기 1차 …

> git log -- preview/home-ui/src/provider-reviews/store.js
3bf63d06 2026-10-09 | chore: 마이페이지 데모 시드(찜·관심학생·제출자료·공급자 후기) 제거
f0b83ff4 2026-08-29 | fix(detail): 찾기 SPA에서 확대카드 이동이 홈 앱으로 이어지게 한다
938f31bb 2026-08-28 | feat(messages): 쪽지함 단순화와 읽음·중요·증빙 첨부를 넣는다
8db5efdc 2026-08-22 | feat(reviews): 쪽지·후기함을 3축 UX와 inbox API에 정합
e3f04a98 2026-08-22 | fix(cards): 공급자도 공통 레일을 보고, 후기 작성만 학부모/학생으로 제한
1601a882 2026-08-22 | feat(reviews): 공부방·과외쌤 공통 후기 엔진 잠금 (쿼터·차단·시트·후기함)
e1c33dc4 2026-08-10 | fix: 후기 태그를 작성폼 보조칩·저장 후기 행으로만 노출한다
58baf262 2026-08-10 | feat: 공부방·과외쌤 공급자 후기 1차 …
```

| 시점 | 커밋 | 일어난 일 |
|---|---|---|
| 2026-08-10 | `58baf262` | store.js·`apiMode()`·서버 API(`index.php`·`src/Reviews/*`)·040 SQL을 한 커밋으로 함께 추가 (24파일). 스위치를 켜는 코드는 이때도 없음 |
| 2026-08-22 | `1601a882` | 후기 엔진 잠금(057 쿼터·차단). `apiMode()` 분기를 늘림. 켜는 코드는 여전히 없음 |
| 2026-08-22 | `8db5efdc` | 후기함을 inbox API에 맞춤 (서버 분기 쪽 정리). 켜는 코드 없음 |
| 2026-10-09 | `3bf63d06` | 브라우저 데모 후기 시드 제거 |

결론: **켜는 코드가 있다가 빠진 것이 아니라, 처음부터 없었다.** 모든 브랜치(`--all`)에서 스위치 문자열이 들어간 커밋은 `58baf262`(스위치를 읽는 코드)와 T6 작업기록뿐이다. 쪽지처럼 로그인 때 켜는 연결은 후기에는 한 번도 만들어지지 않았다.

---

## 8. 해결안 (결정은 종현 님)

세 안 모두 배포 전에 §5-2 [1]~[3]으로 057 적용 여부를 먼저 확인해야 한다. 미적용이면 057을 운영 phpMyAdmin에 적용하는 것이 **배포 전 사용자 할 일**이다.

### 안 A — 로그인 때 켜기 (쪽지와 같은 방식)

- **바꾸는 것:**
  - `store.js`: `apiMode()`를 모듈 안 상태값으로 바꾸고 켜기·끄기 함수를 내보냄
  - `auth-session.js`: `hydrateSessionDependencies()`에서 켜고, 로그아웃·세션 실패 3곳에서 끔
- **바뀌는 파일:** 2개
- **기존 브라우저 데이터:** `sessionStorage`라 닫힌 탭의 데이터는 이미 없다. 열린 탭에 남은 값은 서버 모드에서 읽지 않는다. 켤 때 4개 키를 지울지는 선택.
- **위험:**
  - 로그인하지 않은 사람의 상세 후기 섹션은 계속 브라우저 값이다. 카드는 서버 N, 상세는 0으로 어긋난다.
  - 057 미적용이면 삭제·두 번째 후기가 500.
  - 요약 실패 시 조용히 브라우저 값으로 대체돼 오류가 안 보인다 (L303–305).

### 안 B — 운영은 항상 서버, 개발 화면만 브라우저

- **바꾸는 것:** `store.js`의 `apiMode()`를 "개발 서버(`import.meta.env.DEV`)·localhost가 아니면 참"으로 바꿈. 지금의 스위치는 개발용 강제 켜기로 남김.
- **바뀌는 파일:** 1개
- **기존 브라우저 데이터:** 안 A와 같다.
- **위험:**
  - 로그인하지 않은 사람도 서버 요약을 본다 (`summary`는 로그인 없이 허용, `index.php`). 카드와 상세 숫자가 맞는다. 상세를 열 때마다 서버 요청이 1회 는다.
  - 057 위험과 조용한 대체 위험은 안 A와 같다.
  - 로컬 미리보기와 검사 스크립트(`scripts/verify-parent-review-positive.mjs` 등)는 그대로 브라우저 모드라 영향 없음.

### 안 C — 브라우저 분기 삭제 (서버 전용)

- **바꾸는 것:**
  - `store.js`의 9개 분기와 브라우저 전용 도우미(시드·쿼터·차단 저장, `provider_id === 1` 고정 논리)를 삭제
  - `mypage/preview-data.js`의 미리보기 개수와 `mypage/screens.js`의 쓰이지 않는 후기 패널을 정리
  - 후기 관련 검사 스크립트 3개 수정
- **바뀌는 파일:** 4~6개 「추측」. store.js는 수백 행이 바뀐다.
- **기존 브라우저 데이터:** 읽는 코드 자체가 없어진다.
- **위험:**
  - 변경이 가장 크고 검수 부담이 크다.
  - 로컬 미리보기에서도 후기에 서버(Docker API)가 필요해진다.
  - 057 위험은 같다.

의견(결정 아님): 안 B로 먼저 연결하고, 조용한 대체(L303–305) 처리와 안 C의 정리는 다음 과제로 나누는 것이 바뀌는 범위가 가장 작다.

---

## 9. 직접 확인하지 못한 것

| 항목 | 이유 |
|---|---|
| 운영 DB의 후기 행 수·057 적용 여부 | 지시대로 DB를 직접 보지 않음 → §5-2 SELECT 결과 필요 |
| student1의 상세(확대카드) 후기 섹션 | 그 계정 동네에 공부방·과외쌤 카드가 0개라 열 카드가 없었음. 같은 화면은 room1으로 확인(0건) |
| 마이샵 후기 미리보기(`teaser.js`) 운영 화면 | 화면을 열지 않음. 코드상 `fetchReviewSummary`라 같은 결과로 판단 |
| 후기 실제 제출 | 쓰기 금지. 코드상 L365 브라우저 분기(`fetch` 없음)로 판단 |
| 과외쌤 계정 | 과외쌤 시험 계정 로그인 불가(기존과 같음). 같은 store.js 경로 |
| 로그인하지 않은 상태의 상세 후기 섹션 | 열지 않음. 코드상 같은 브라우저 분기 |
| 실제 회원이 브라우저에만 쓰고 잃은 후기 건수 | 서버에 기록이 남지 않는 구조라 알 수 없음 |
| 040·057 운영 적용 날짜 | 저장소 문서에 기록 없음 |

## 10. 함께 발견한 것

- **T6 작업기록 정정:** `2026-10-10-mypage-t6.md` L78에 브라우저 저장소를 「localStorage」로 적었으나 실제는 `sessionStorage`다 (모든 이력 같음). 이 문서가 맞는 기록이다.
- student1 후기 시트(공부방 12)의 읽기 화면에는 「후기 남기기」 버튼이 보였다. 그런데 같은 대상의 쓰기 화면은 「쪽지 경험 후 가능해요」라고 막았다.
  - 「추측」 읽기 화면의 버튼 조건(`canOfferWriteCta`)이 쪽지 여부를 보지 않기 때문으로 보인다.
  - 이번 조사 범위 밖이라 원인은 보지 않았다.
- 서버를 연결하면 공부방·과외쌤의 "받은 후기함"이 처음으로 실제 값을 보여 준다. 지금은 브라우저 논리가 `provider_id === 1`로 고정돼 있어 운영에서는 항상 비어 보인다.

## 11. 검수·승인

- 작업 세션은 이 보고를 승인하지 않는다. 검수·승인은 종현 님이 커밋 hash 단위로 한다.
- 위험도: 보고서뿐이라 낮음. 해결안 실행은 별도 지시서.
