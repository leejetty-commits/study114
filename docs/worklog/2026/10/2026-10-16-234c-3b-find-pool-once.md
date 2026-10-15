# 2026-10-16 234c-3b 공부방찾기 노출 풀 search.php 3건

기준: `main` `8d4d4414` (`68fa1c36` 병합 뒤). 브랜치 `cursor/find-pool-once-20261016`. `main`에는 넣지 않는다.

## 지시 요지

로그인한 공부방 회원이 공부방찾기를 처음 열 때 동시에 나가는 노출 풀 `search.php` 3건을 줄인다. 카드 id·순서·개수·등급은 그대로. 코드 전에 출처를 적고, (가) 또는 (나) 중 하나를 고른다. (나)가 서버 수정이면 범위를 적고 멈춘다.

## 3건의 출처 (코드 수정 전)

호출은 수정 전 `auth-session.js` 243행 `hydrateExposureBridge()` → `exposure-bridge.js` 96–99행 `Promise.all`. 본문은 `search-api.js` `searchPreviewTab` (`POST /api/search/search.php`).

| 순서 | 수정 전 행 | tab | 등급 | 지역 | 개수 | page | sort |
|---|---|---|---|---|---|---|---|
| 1 | `exposure-bridge.js` 97행 | `room` | 요청에 없음. 응답 `exposure_tier` | 필터 `{}`. 로그인은 대치동으로 덮지 않음 | limit 3 | 1 | latest |
| 2 | `exposure-bridge.js` 98행 | `tutor` | 없음 | `{}` | limit 2 | 1 | latest |
| 3 | `exposure-bridge.js` 99행 | `student` | 없음 | `{}` | limit 2 | 1 | latest |

세 요청은 탭이 달라 같은 목록을 겹쳐 받지 않는다. 한 요청으로 합치려면 `search.php`가 탭 하나를 받는 계약을 바꿔야 한다. (나)는 하지 않는다.

공부방찾기 첫 화면 카드는 이 풀이 아니다. `study-room-home-seed.js` `bootStudyRoomHome`의 `search.php` 1건(저장 지역, limit 20)이다. 대표지역 1 없는 카드 제외, 게스트 대치동, 샘플 1장은 그 목록·화면 규칙이라 그대로 둔다.

방법 (가). 공부방찾기(`/search/room`) 첫 진입만, 확인이 끝난 뒤 목록 요청을 먼저 보내고 풀 3건은 그 뒤에 한 탭씩 보낸다. 과외쌤찾기·학생찾기·홈은 예전처럼 3건을 동시에 보낸다. 비회원·확인 실패는 풀을 부르지 않는다(확인 실패는 `hydrate`까지 가지 않는다).

## 요청 수

| 경우 | 바꾸기 전 | 바꾼 뒤 |
|---|---|---|
| 로그인 공부방, 첫 진입 동시 | 3 | 0. 이어서 한 건씩 3번(겹침 최대 1) |
| 비회원 | 0 | 0 |
| 확인 실패 | 0 | 0 |

카드 id는 풀을 99·98·97로 채워도 `11,12,13` / `basic,pick,prime` 그대로. 검사 `scripts/verify-find-pool-once.mjs` OK 14.

## 검수

이 세션은 자기 작업을 승인하지 않는다.
