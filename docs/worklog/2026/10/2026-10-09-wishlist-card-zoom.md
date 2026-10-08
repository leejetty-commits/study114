# 작업 기록: 찜 목록 = 카드 + 확대카드 (wishlist-card-zoom)

- 작업 일자: 2026-10-09
- 작업 브랜치: `cursor/wishlist-card-zoom-20261009` (기준: `origin/main` `90cc0f0`)
- 작업 디렉토리: `D:\work\study114\.wt\wishlist-card-zoom`
- 커밋: `1a668ec` (서버) · `d388cd6` (화면) · `69ecc51` (검증 스크립트) · 이 기록 커밋
- 상태: 검수·승인 대기 (작업 세션은 자기 작업을 승인하지 않는다)

---

## 1. 지시서 원문

````text
study114 저장소(D:\work\study114) 작업자다. 한국어로 기록·보고한다.

## 먼저 읽을 것
- `D:\work\study114\.cursor\rules\study114-workflow.mdc`, `D:\work\study114\.cursor\rules\work-routine.mdc` (규칙 준수: 작업 브랜치만, main push·병합 금지, `git add -A` 금지, push된 커밋 amend 금지, 묻기 전에 정본·기존 코드부터 확인, 이미 있는 것을 새 구조로 덧씌우지 않기).
- 운영 계정·비밀 파일은 쓰지 않는다. 운영 사이트에 로그인하거나 쓰기 하지 않는다.

## 작업 공간
- `cd D:\work\study114; git fetch origin; git worktree add -b cursor/wishlist-card-zoom-20261009 .wt/wishlist-card-zoom origin/main` 으로 새 worktree를 만들어 그 안에서만 작업. 다른 .wt 폴더·메인 작업폴더는 건드리지 않는다.
- 검증에 node_modules 가 필요하면 worktree 안에서 `cmd /c mklink /J node_modules ..\..\node_modules` 및 `preview\<앱>\node_modules` 를 `D:\work\study114\preview\<앱>\node_modules` 로 junction 연결(커밋하지 말 것, worktree 삭제 금지 — junction 대상까지 지워질 수 있음).

## 사용자 결정 (확정, 다시 묻지 말 것)
- 찜은 **카드를 찜하는 것**이다. 마이페이지 찜 목록은 찜한 카드를 카드 모양으로 보여 주고, 카드를 탭하면 **확대카드**까지 보여 준다(홈·찾기에서 카드를 눌렀을 때 뜨는 기존 확대카드와 같은 것을 재사용). 공부방은 확대카드 안의 기존 「마이샵」 버튼으로 마이샵에 갈 수 있으면 된다. 찜 목록에서 곧바로 마이샵/마이프로필로 보내지 않는다.
- 찜 화면의 「찜한 공부방·과외쌤」 섹션(경쟁 업체를 살펴보는 용도)은 의도된 구성이니 유지.

## 고칠 문제 (이미 분석됨)
- 서버 찜 목록 API는 "3번 공부방을 찜함"처럼 대상 번호만 돌려준다. 화면은 카드 이름·사진·지역을 그날 홈/찾기에서 불러온 카드 캐시에서 찾아 그린다. 그날 그 카드를 한 번도 안 불러왔으면 정보가 없어 찜 목록에서 빠진다. 예전엔 같은 번호의 견본(가짜) 카드가 대신 보여 가려졌는데, 견본 데이터는 모두 제거됐다(되살리지 말 것).
- 해결: 서버 찜 목록이 번호와 함께 **카드를 그리는 데 필요한 공개 정보**(카드 렌더러가 쓰는 필드: 이름/표시명, 대표 사진, 지역 표기, 노출 등급 등)를 같이 돌려주고, 화면은 그 데이터로 카드와 확대카드를 그린다. 캐시에 있으면 캐시 우선이어도 되지만 캐시가 없어도 반드시 보여야 한다.

## 기존 코드 단서 (직접 확인하고 시작)
- API: `public/api/handoff/favorites.php`, `src/Handoff/HandoffApi.php`·`HandoffService.php`·`HandoffRepository.php`, 테이블 `sql/schema/013_handoff_basket.sql`.
- 화면: `preview/home-ui/src/handoff-api.js`·`handoff-backend.js`·`handoff-api-map.js`, `preview/home-ui/src/mypage/screens.js`·`router.js`, `preview/home-ui/src/student-wishlist-state.js`.
- 카드·확대카드: `preview/home-ui/src/exposure-render.js`, `card-visual.js`, `detail-decision/index.js`·`detail-utils.js`. 공개 카드 데이터를 만드는 기존 서버 경로(검색/홈 API의 카드 매퍼)가 있으면 그것을 재사용해 필드를 맞춘다. 새 카드 모양을 만들지 않는다.

## 지켜야 할 것
- 개인정보·권한: 찜 API는 로그인한 본인의 찜만. 카드 정보는 손님/일반 공개 카드에 이미 나가는 필드만(전화·상세주소·이메일 등 비공개 필드 금지). 지금 숨김/비공개/탈퇴된 대상은 카드 정보를 내보내지 말고, 화면에 「지금은 볼 수 없는 카드예요」 같은 상태로 보여 주고 찜 해제는 가능하게.
- 지역 표기 정책은 기존 공통 함수(손님 표기 축 등)를 그대로 쓴다. 학생 2분기(공부방 찾기/과외쌤 찾기) 같은 기존 구조를 바꾸지 않는다.
- SQL(스키마 변경)은 가능하면 피한다. 꼭 필요하면 `sql/schema/` 다음 번호 파일로 만들고 "배포 전 사용자 할 일"로 보고.
- 견본/가짜 데이터·시드 추가 금지 (`npm run verify:no-sample-data` 통과).
- 같은 결과를 확인하는 검증 스크립트 `scripts/verify-wishlist-card-zoom.mjs` 를 만들고 package.json 에 `verify:wishlist-card-zoom` 추가: (1) PHP 저장소/서비스 수준에서 찜 목록 응답에 공개 카드 필드가 있고 비공개 필드가 없음, 남의 찜 안 보임, 숨김 대상은 상태만, (2) 화면 모듈 수준에서 캐시가 비어 있어도 찜 카드가 그려지고 탭하면 확대카드 렌더가 호출됨. 수정 전 코드에서 실패하고 수정 후 통과하는 항목이 있어야 한다(가능하면 `--ref` 로 옛 커밋 비교).
- 관련 기존 게이트도 돌려라: `npm run verify:no-sample-data`, `npm run verify:shop-page`, `npm run verify:location-ssot`, 그리고 handoff/찜 관련 기존 verify 스크립트가 있으면 그것.

## 기록·커밋
- `docs/worklog/2026/10/2026-10-09-wishlist-card-zoom.md` 에 지시서 요약(위 사용자 결정 원문 포함), 원인, 변경 파일, 검증 결과(수정 전/후 숫자), 배포 전 사용자 할 일, 남은 질문을 쓴다.
- 허용 파일만 stage, 의미 단위 커밋, `git push origin HEAD:refs/heads/cursor/wishlist-card-zoom-20261009`. main 에는 절대 push/merge 하지 않는다.

## 최종 보고 (메인에게, 짧게)
- 브랜치·최종 커밋 hash(코드 커밋과 기록 커밋 구분), 변경 파일 목록, API 응답에 추가한 필드 목록, 검증 결과 숫자, SQL 필요 여부, 판단이 애매해서 멈춘 것.
````

## 2. 원인 (코드 확인 결과)

- `HandoffRepository::listFavorites` 는 `user_favorites` 에서 `id·target_type·target_id·created_at` 만 읽는다. `favorites.php` GET 은 그대로 내려준다.
- 화면 `mypage/screens.js` `renderWishlistSection` → `user-actions-state.js` `getWishlistItems` → `getExposureItem` 이 찾기 결과·검색 노출·홈 Basic 풀(`getHomeBasicPool`)에서만 같은 번호를 찾고 `.filter(Boolean)` 으로 못 찾은 찜을 버렸다. 견본 풀(`EXPOSURE_*`)은 이제 빈 배열이라, 그날 홈·찾기에서 안 불러온 카드는 찜 목록에서 사라졌다.
- 찜 목록은 카드가 아니라 이름 한 줄 목록이었고, 카드 탭 → 확대카드 연결도 없었다.

## 3. 이미 있음 / 고친 부분

이미 있음(재사용):
- 서버 공개 카드 매퍼: `SearchService::searchRooms`·`searchTutors` (검색 목록 노출 조건 = 숨김·삭제·탈퇴·홍보지역 1 없음 제외, 지역 표기 = `promoRegionLabel`·`TutorRegionUnit::labelFromRow`, 전화·이메일은 SELECT 에 없음).
- 화면 카드 매퍼: `home-basic-live.js` `mapRoom`·`mapTutor` (검색 응답 → 홈 카드 필드).
- 카드: `exposure-render.js` Basic 카드(`renderBasicRow`). 확대카드: `detail-decision` `openDetailDecision` → `openDetailModal` (공부방은 안의 「공부방 둘러보기」(`data-p24-action="open-myshop"`) 버튼이 기존 마이샵 진입).

고친 부분:
- 서버: `SearchService::publicCardsByIds(type, ids)` — 위 매퍼를 그대로 부르되 대상 번호 조건(`sr.id IN (...)`/`t.id IN (...)`)만 붙인다. 번호 목록은 `search()` filters 로 받지 않는다(`search.php` 가 클라이언트 filters 를 그대로 넘기므로, filters 키로 열면 손님 지역 제한을 우회하는 통로가 된다). 50개씩 나눠 조회.
- 서버: `HandoffService::listFavorites` 가 행마다 `card_status`·`card` 를 붙인다. 공개 카드면 `visible` + 카드, 결과에 없으면 `unavailable` + `card=null`, 카드 조회가 예외면 `unknown` + `card=null`(찜 번호 목록은 그대로 내려가 찜 버튼이 깨지지 않음). 본인 조건(`user_id = ?`)은 기존 저장소 쿼리 그대로.
- 화면: `handoff-backend.js` 가 찜 목록 응답의 카드를 홈 카드 매퍼로 바꿔 보관(`getFavoriteCard`), `refreshFavorites()` 추가.
- 화면: `user-actions-state.js` `getExposureItem` 이 기존 풀에서 못 찾으면 찜 카드로 찾는다(캐시 우선). `getWishlistEntries(kind)` 추가 — 못 찾은 찜도 버리지 않고 `visible`/`unavailable`/`unknown` 상태로 돌려준다.
- 화면: `detail-decision/index.js` `resolveDetailItem` 도 마지막에 찜 카드를 본다(카드 레일의 쪽지 버튼 등 기존 바인더가 찜 카드에서도 동작).
- 화면: `mypage/screens.js` 찜 목록 = 홈 Basic 카드(`renderBasicRow`) + 아래 기존 「비교」「찜 해제」 버튼. 카드 탭·「상세」 → `openDetailDecision({ item, sourceRoute: 'wishlist' })` 로 기존 확대카드. 찜 목록에서 마이샵으로 바로 보내는 버튼·링크는 없다. 볼 수 없는 찜은 「지금은 볼 수 없는 카드예요」 + 찜 해제. 카드 정보가 아직 없는(`unknown`, 막 찜한 카드 등) 찜이 있으면 찜 목록을 한 번 다시 읽어 그린다(같은 번호 묶음으로는 다시 부르지 않음).
- 「찜한 공부방·과외쌤」 메뉴·섹션 구성(공부방/과외쌤 두 칸)은 그대로. 학생 2분기·지역 표기 함수는 손대지 않았다.
- 정본 `docs/ssot/25-decision-handoff-layer.md` 부록 B-3 에 찜 목록 GET 응답 칸을 적었다.

## 4. 변경 파일

| 파일 | 내용 |
|---|---|
| `src/Search/SearchService.php` | `publicCardsByIds` · `cardIdsSql` 추가, `searchRooms`·`searchTutors` 에 내부 전용 `?array $cardIds` 인자 |
| `src/Handoff/HandoffService.php` | `listFavorites` → `attachPublicCards` (card_status·card), SearchService 주입 가능 |
| `docs/ssot/25-decision-handoff-layer.md` | 부록 B-3 찜 목록 응답 · 변경 이력 |
| `preview/home-ui/src/handoff-backend.js` | 찜 카드 보관 `getFavoriteCard` · `refreshFavorites` · `applyFavoriteRows` |
| `preview/home-ui/src/home-basic-live.js` | `mapRoom`·`mapTutor` 를 `mapSearchRoomItem`·`mapSearchTutorItem` 으로 export |
| `preview/home-ui/src/user-actions-state.js` | `getExposureItem` 찜 카드 폴백 · `getWishlistEntries` |
| `preview/home-ui/src/detail-decision/index.js` | `resolveDetailItem` 찜 카드 폴백 |
| `preview/home-ui/src/exposure-render.js` | 기존 `renderBasicRow` export (모양 변경 없음) |
| `preview/home-ui/src/mypage/screens.js` | 찜 목록 카드 렌더 · 탭→확대카드 · 상태 카드 · 재조회 |
| `preview/home-ui/src/mypage/mypage-copy.js` | 「지금은 볼 수 없는 카드예요」「카드 정보를 불러오지 못했어요」 |
| `preview/home-ui/src/styles/home-member-flows.css` | 찜 카드 묶음 간격·아래 버튼 줄 (6줄) |
| `scripts/verify-wishlist-card-zoom.mjs` | 묶음 실행 · `--ref` 옛 커밋 비교 |
| `scripts/verify-wishlist-card-zoom.php` | PHP 저장소/서비스 검사(가짜 PDO) |
| `scripts/verify-wishlist-card-zoom-screen.mjs` | 화면 모듈 검사(vite-node · 가짜 fetch · 작은 가짜 DOM) |
| `package.json` | `verify:wishlist-card-zoom` |

## 5. 찜 목록 API 응답에 추가한 필드

행마다(기존 `id`·`target_type`·`target_id`·`created_at` 유지):
- `card_status`: `visible` | `unavailable` | `unknown`
- `card`: `visible` 일 때만 객체, 아니면 `null`. 내용은 검색 API(`/api/search/search.php`) 카드와 같은 필드다.
  - 공부방: `id, title, region_label, summary, price_amount, price_label, main_subject_note, grade_band, intro_short, intro_long, feature_1~3, slogan, teaching_style, lesson_place_type, capacity_per_time, lesson_operation_type, facility_summary, inquiry_status, profile_status, education_office_registered, career_years, business_registration_available, detail_completion_status, prime_eligible, position_sku, exposure_tier, latitude, longitude, published_at, created_at, is_new, recommend_count, review_count, paid_badges, image_path_prime, image_path_basic, image_path, images`
  - 과외쌤: `id, title, region_label, summary, price_label, preferred_fee_amount, main_subject_note, university_name, major_name, university_status, proof_document_available, career_year_band, lessons_per_week, minutes_per_lesson, detail_completion_status, profile_status, prime_eligible, position_sku, exposure_tier, published_at, created_at, is_new, recommend_count, review_count, paid_badges`
- 전화·이메일·상세주소·주인 user_id 는 없다(검색 SELECT 에도 없음). `latitude`·`longitude` 는 검색 카드(지도 핀)에 이미 나가는 칸이라 같이 온다.

## 6. 검증 (worktree, 2026-10-09)

새 검사 `node scripts/verify-wishlist-card-zoom.mjs` (= `npm run verify:wishlist-card-zoom`):

| 기준 | PHP | 화면 | 합계 |
|---|---|---|---|
| 수정 전 `--ref 90cc0f0` | 4 PASS / 11 FAIL | 10 PASS / 14 FAIL | **14 PASS / 25 FAIL** |
| 수정 후 (작업 트리 = `69ecc51`) | 15 PASS / 0 FAIL | 24 PASS / 0 FAIL | **39 PASS / 0 FAIL** |

- 수정 전에도 통과하는 항목: 찜 SQL 본인 조건·남의 찜 안 보임·기존 칸 유지·`search()` filters 의 card_ids 무시, 화면 로그인·전제(캐시 빔)·마이샵 바로가기 없음.
- 수정 전 실패 → 수정 후 통과: 카드 필드·비공개 칸 없음·숨김/탈퇴/삭제 상태만·검색 카드와 같은 필드·조회 실패 unknown, 캐시 없이 공부방/과외쌤 카드·볼 수 없는 카드 상태·탭→확대카드·확대카드 안 마이샵 버튼·「상세」→확대카드·볼 수 없는 카드 찜 해제·카드 없는 찜 재조회.

기존 게이트(수정 후):

| 검사 | 결과 |
|---|---|
| `npm run verify:no-sample-data` | OK (415 파일) |
| `npm run verify:shop-page` | 통과(exit 0) |
| `npm run verify:location-ssot` | All passed |
| `npm run verify:tutor-inquiries-settings` · `verify:study-room-inquiries-samples` · `verify:board-acl:js` · `php scripts/verify-board-channel-acl.php` (배포 게이트) | 모두 통과 |
| `php scripts/verify-position-region-tier.php` | 19/0 |
| `php scripts/verify-room-promo-region-match.php` | 38/0 |
| `php scripts/verify-student-request-text-exposure.php` | 82/82 |
| vite-node: card-visual 34/0, card-visual-penetration, mypage-account-region 41/0, tutor-mypage-route-integrity, guest-baseline-map-cards 78/78, position-region-tier 19/0, student-mypage-metrics, hide-inquiry-bundle, mypage-notice-top 49/0, student-home-tutor-tier 24/0, tutor-home-student-tab 63/0, parent-review-positive, student-branch-two-tabs 162/0, student-location-flow 189/0, student-mypage-hope-region 75/0, smoke-paid-badges-proof | 모두 통과 |
| `php -l` (SearchService · HandoffService · 새 PHP 검사) | 문법 오류 없음 |
| `preview/home-ui` `vite build` (임시 폴더 출력, public/ 미변경) | 성공 |

수정 전에도 실패하던 검사(같은 숫자로 실패, 이번 변경과 무관): `verify-tutor-mypage-frame-ia`, `verify-basic-exposure-gate`, `verify-input-fill-rule`, `verify-hold-find-address`, `verify-paid-renewal`(tutor 가이드 카피 1건).

`verify-tutor-region-unit`: 수정 전 127/7 → 수정 후 126/8. 늘어난 1건은 「공부방 검색 searchRooms 본문 = origin/main 과 같음」 잠금이다. 이번 과제가 `searchRooms` 에 대상 번호 조건(기존 호출은 항상 `null`)을 넣었기 때문이며, 이 잠금은 실행 시점의 `origin/main` 과 비교하므로 병합 뒤에는 다시 같아진다. 나머지 7건(「main 읽기 실패」 등)은 수정 전과 같다. → 8절 질문 1.

## 7. 배포 전 사용자 할 일

- SQL: **없음** (스키마 변경 없음, 기존 테이블 SELECT 만).
- 환경변수·Secrets·`.htaccess`: **없음**.
- 서버(PHP)와 프런트(번들)가 같이 배포돼야 캐시 없는 찜 카드가 보인다. 프런트만 먼저 나가면 응답에 `card_status` 가 없어 `unknown` 으로 보고 한 번 재조회 후 「카드 정보를 불러오지 못했어요」+ 찜 해제로 보인다(깨지지는 않음).

## 8. 남은 질문 · 판단

1. `verify-tutor-region-unit` 의 「searchRooms 본문 = origin/main」 잠금이 이 브랜치에서 1건 늘어난다(위 6절). `searchRooms` 를 건드리지 않고 번호 조회를 하려면 공개 조건을 복제하거나 전체 목록을 읽어 거르는 방법뿐이라, 같은 매퍼·같은 노출 조건 재사용을 택했다. 잠금 의도(과외 단위 작업이 공부방 검색을 바꾸지 않음)와 충돌하지 않는지 검수에서 확인 바람.
2. 찜 카드의 노출 등급(`exposure_tier`·`position_sku`)은 지역 없는 검색과 같은 기준(기간 안 구독 전체)이다. 특정 동·시 검색 맥락의 등급과 다를 수 있다.
3. 찜 카드 레일의 추천(👍) 버튼은 마이페이지에서 따로 바인딩하지 않았다(로그인 홈 카드도 카드 레일 추천은 바인딩이 없고, 확대카드 안 추천은 동작). 필요하면 별도 과제.
4. 찜 해제 직후 같은 화면에서 재조회가 겹치면(카드 없는 찜이 있을 때만 재조회) 잠깐 해제 전 목록이 보일 수 있다. 다음 렌더에서 맞춰진다.

## 9. 검수 · 승인

- 검수: (다른 세션 / 다른 모델)
- 승인: 사용자 (커밋 hash 단위)
