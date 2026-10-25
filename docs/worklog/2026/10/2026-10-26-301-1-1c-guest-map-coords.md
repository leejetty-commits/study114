# 301-1-1c 비로그인 홈·찾기 지도 핀: 검색 응답에 좌표 다시 실어 주기

- **과제:** 301-1-1c
- **브랜치:** cursor/301-1-1c-guest-map-coords-20261026
- **base:** d330fb71 (origin/main)

## 지시 요약

301-1-1에서 게스트 검색 응답의 좌표를 null로 만든 것을 되돌려,
비로그인 홈·찾기 지도 핀이 다시 찍히게 한다. 게스트 `published`만 필터는 유지.

## 게스트 좌표를 다시 켠 위치

| 파일 | 위치 | 변경 |
|---|---|---|
| `public/api/search/search.php` | 93행 `$includePreciseCoordinates` 인자 | `$authUser !== null` → `true` |
| `src/Search/SearchService.php` | 107행 `guestAxisCounts` room | `false` → `true` |
| `src/Search/SearchService.php` | 119행 `guestAxisCounts` tutor | `false` → `true` |

## published 게스트 필터 유지 근거

`$guestPublishedOnly` 인자(`$authUser === null` / `true`)는 3곳 모두 **변경 없음**.
`searchRooms`에서 `AND sr.profile_status = 'published'`, `searchTutors`에서 `AND t.profile_status = 'published'` 필터가 그대로 적용된다.

## AC 표

| AC 항목 | 결과 | 근거 |
|---|---|---|
| 비로그인 검색 room → lat/lng 숫자 | ✅ | `$includePreciseCoordinates = true` → `searchRooms` 896·897행에서 DB 값 그대로 |
| 비로그인 검색 room → draft 0건 | ✅ | `$guestPublishedOnly = true` 유지 → `profile_status = 'published'` 필터 |
| 비로그인 검색 tutor → 좌표 | ✅ | 과외쌤은 원래 lat/lng 필드 없음(location_label 사용). 변경 없음 |
| 로그인 검색 회귀 없음 | ✅ | `$includePreciseCoordinates`가 `true`→`true`(변경 없음). `$guestPublishedOnly`가 `false`→`false`(변경 없음) |
| 동네인사 카드 게스트 좌표 null 유지 | ✅ | `neighborhood-greeting-card.php` 변경 없음 (301-1-1b 유지) |
| 공개샵 게스트 좌표 null 유지 | ✅ | `study-room/public.php` 변경 없음 |
| 허용 파일 밖 변경 0 | ✅ | `git diff --stat` 2파일만 |
| `php -l` | **실행 못함** — 이 PC에 php 없음 |

## 가설과 달랐던 점

없음. 검색 응답의 `$includePreciseCoordinates` 플래그 하나로 게스트 좌표가 제어됨. 
프론트(`resolveStudyRoomPin` 등)는 검색 응답의 `latitude`/`longitude`를 읽으므로, 검색만 풀면 핀이 살아남.

## 남은 것

- 공개샵 게스트 좌표 null → 범위 밖 (오너 미결정)
- 동네인사 카드 게스트 핀 → 범위 밖 (301-1-1b에서 좌표 null 유지)
- 카드 블라인드 UI → 범위 밖 (프론트 기존 정책 유지)

## 위험도

- **낮음** — 읽기 전용 플래그 1개 변경. 로그인 경로 무변경. DB·비밀값 무관.
