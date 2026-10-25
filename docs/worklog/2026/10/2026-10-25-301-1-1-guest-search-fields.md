# 301-1-1 게스트 검색 좌표·draft

**기준:** main `7b978b5d`  
**브랜치:** `cursor/301-1-1-guest-search-fields-20261025`  
**작업일:** 2026-10-25  
**검수 근거:** `_local/full-sweep-20261025/drafts/VERIFY-FS-T5-security-repeat.md` FS-T5-007  
**승인:** 이 세션은 자기 커밋을 승인하지 않는다.

## 지시서 원문

```
# 301-1-1 — FS-T5-007 비회원 검색 좌표·draft 노출 막기
> 오너 지시 t256u · 검수 VERIFY-FS-T5-security-repeat.md 근거 · **우선 착수**
> 브랜치 `cursor/301-1-1-guest-search-fields-20261025` · 기준 main tip과 현 tip diff 후 착수
> 원칙: 기존 코드 확인·수정 우선. 덧대기·새 인증/직렬화 스택 금지. 익스플로잇/PoC 금지.
> 커밋/푸시 OK, 병합·배포는 오너 「병합」 후에만.

## 목표
비로그인(게스트) 검색·공개 읽기 응답에서 **정밀 좌표(latitude/longitude)를 제거**하고, **비공개(draft 등) 카드가 게스트에게 나가지 않는지** 기존 쿼리 조건을 점검·수정한다.

## 배경(검수 확정)
- `public/api/search/search.php` 비로그인 분기는 지역만 좁히고 응답 필드는 로그인과 동일.
- 공부방 매핑에 `latitude`/`longitude` 포함 (`SearchService`, `StudyRoomPublicReadService`).
- 연락처·상세주소 필드는 없음.
- 라이브 게스트 `tab=room` 응답에 `profile_status:"draft"`, `published_at:null` 카드 관찰 — 시드 탓일 수 있으나 **공개 필터를 기존 WHERE에서 확인할 것**.

## 허용 경로
- `public/api/search/search.php`
- `src/` 하위 `SearchService` (및 공부방 검색 매핑이 있는 기존 파일)
- `src/StudyRoom/StudyRoomPublicReadService.php`
- 공개 상태 필터가 이미 있는 repository/query 파일(읽기 후 그자리 수정만)

## 작업
1. 게스트(`$authUser === null` 등 기존 분기)일 때 카드 JSON의 `latitude`/`longitude`를 넣지 않거나 null — 기존 `$includeStudentRequestText` 같은 플래그 패턴을 **같은 서비스 안에서** 재사용.
2. `StudyRoomPublicReadService`도 게스트/비로그인 경로면 동일.
3. `searchRooms`(또는 동일 역할 쿼리)의 공개 상태 조건을 추적. draft·unpublished가 게스트 결과에 섞이면 기존 필터를 고친다. 시드만의 문제면 보고에 근거를 남기고 제품 필터는 안전하게 유지.
4. 로그인 회원 응답의 좌표·본인 카드 동작은 깨지 말 것.

## 수용 기준
- 비로그인으로 `POST/GET` 검색(공부방 탭) 시 응답 item에 `latitude`/`longitude` 키 없음 또는 항상 null.
- 비로그인 결과에 `profile_status`가 draft/비공개인 카드 0건(또는 정본 정책상 허용이면 문서화).
- 로그인 검색·상세 회귀 없음(스모크).
- 검수 보고 경로·재현 한 줄 첨부.

## 범위 밖
- 결제 complete / PG 대조
- 관리자 requireAuth 보완(301-1-2)
- 프론트 지도 UI 전면 개편
```

원본 파일: `D:\work\study114\_local\directives\301-1-1-guest-search-fields.md`

## 기준 차이

`origin/main`은 `7b978b5d`. 직전 체크아웃 `cursor/300-2-detail-gaps-20261025`(`ea2cb27a`)와의 차이는 확대카드 프론트·e2e·워크로그만이다. 검색 PHP와는 겹치지 않는다. 이 작업은 `origin/main`에서 새 worktree `D:\work\study114\_local\wt-301-1-1`로 시작했다.

## 공개 필터 (기존 WHERE)

공부방 `SearchService::searchRooms`는 원래 다음만 본다.

- `profile_status <> 'hidden'`
- `deleted_at IS NULL`
- 탈퇴한 주인 제외
- 홍보지역 1(`slot = 1`, `region_id` 있음). `StudyRoomBasicExposure`가 published로 올리는 조건과 같은 식이다.

published 게이트는 없었다. 홍보지역 1이 있는데 상태 컬럼이 `draft`인 행은 게스트 결과에 들어간다. 검수가 본 `profile_status:"draft"`, `published_at:null`은 이 쿼리로 설명된다. 운영 DB를 이번 작업에서 조회하지 않았으므로 시드인지 동기화가 안 된 행인지는 여기서 나누지 않는다. 쿼리가 draft를 허용하는 것이 확인됐으므로 게스트에게는 `profile_status = 'published'`를 기존 조건 뒤에 더했다. `<> 'hidden'`과 홍보지역 1은 그대로다.

과외쌤 `searchTutors`도 같다. 기존은 `<> 'hidden'` + 과외지역 1 + 기본등록 필수 8개(`TutorBasicFields::completeSql`)이다. 게스트만 `published`를 더한다.

학생 `searchStudents`는 원래 `exposure_status = 'published'`이다. 좌표 필드도 없다.

로그인 검색과 찜 카드(`publicCardsByIds`)는 플래그를 넘기지 않아 기존 `<> 'hidden'` 목록을 유지한다. 회원이 보던 좌표와 본인 draft 카드는 이 경로에 남긴다.

공개 샵 `StudyRoomPublicReadService::getPublishedById`도 `<> 'hidden'`이라 draft를 연다. 동네인사 `basicCard` 주석이 그 동작을 쓴다. 게스트 `public.php`만 published를 요구하고 좌표를 null로 둔다. 로그인 `public.php`는 좌표와 기존 draft 읽기를 유지한다.

## 고친 방식

`search()`에 `$includeStudentRequestText` 뒤에 두 플래그를 더했다. 기본값은 좌표 포함, published 추가 없음이다.

- `search.php`: 세션 사용자가 없으면 좌표 플래그 false, published 플래그 true.
- `guestAxisCounts()`: 게스트 박스 숫자가 게스트 목록과 같게 같은 플래그를 쓴다. 숫자는 `region-stats.php`가 쓴다.
- `public.php`: `search.php`와 같은 세션 확인. 비로그인이면 `getPublishedById($id, false, true)`.

응답 키는 지우지 않고 값을 null로 둔다. 검색은 POST만 받는다. GET 검색 경로는 원래 없다.

## 재현

비로그인 `POST /api/search/search.php` `{"tab":"room","page":1,"limit":20}` → `items[]`의 `latitude`·`longitude`는 null, `profile_status`가 `draft`인 항목은 0.  
같은 요청을 로그인하면 좌표는 숫자 또는 원래 null이고, draft 행은 기존처럼 홍보지역 1이 있으면 남는다.  
비로그인 `GET /api/study-room/public.php?id={draft인 공부방}` → 404. 로그인이면 항목과 좌표가 나온다.

## 남는 것

`public/api/neighborhood-greeting-card.php`는 `NeighborhoodGreetingService::basicCard`가 `getPublishedById`를 기본 인자로 호출한다. 주석대로 draft·published를 열고, 좌표도 그대로다. 이번 허용 경로 밖이라 안 고쳤다.

게스트 홈·찾기 핀은 검색 응답의 좌표를 본다(`resolveStudyRoomPin`, `filterGuestDaechiMapItems`). 비로그인 응답의 좌표가 null이면 그 핀은 그려지지 않는다. 로그인 응답의 좌표는 그대로다. 지도 UI는 범위 밖이라 안 고쳤다.

## 확인

이 PC에는 `php`가 없다. `php -l`과 `scripts/verify-room-promo-region-match.php`는 실행하지 못했다. 라이브 게스트 검색도 호출하지 않았다.

기본 인자로 `search()`를 부르면 공부방·과외 SQL은 이전과 같다(`<> 'hidden'` + 기존 게이트). `profile_status = 'published'`와 좌표 null은 게스트 플래그가 켜진 호출에만 붙는다.
