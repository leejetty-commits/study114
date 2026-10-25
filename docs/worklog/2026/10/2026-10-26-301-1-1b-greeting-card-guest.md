# 301-1-1b 동네인사 카드 API: 비로그인에게 초안·정밀 좌표 안 주기

- **과제:** 301-1-1b
- **브랜치:** cursor/301-1-1b-greeting-card-guest-20261026
- **base:** 638ebced (origin/main)

## 지시 요약

비로그인(게스트)이 `neighborhood-greeting-card.php` API를 부르면:
- 초안(draft) → 404 `unavailable`
- 발행된 공부방 → 200, `latitude`/`longitude` = null (키 유지)
- 발행된 과외쌤 → 200, 전과 같음 (좌표 필드 없음)
- 로그인 → 변경 없음

## 게스트 판별 방법

`public/api/study-room/public.php`의 세션 확인 패턴 그대로:
```
session_name() 쿠키 존재 → AuthSession::user() → user_id > 0 이면 로그인
```

## 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `public/api/neighborhood-greeting-card.php` | `AuthSession` import, 세션 확인 → `$isGuest`, `basicCard($providerType, $registrationId, $isGuest)` |
| `src/Neighborhood/NeighborhoodGreetingService.php` | `basicCard`에 `$isGuest = false` 인자 추가. 게스트 공부방 → `getPublishedById($id, false, true)`. `tutorBasicCard`에 게스트일 때 `profile_status = 'published'` 조건 추가 |

## basicCard 호출처

| 파일 | 줄 | 인자 | 영향 |
|---|---|---|---|
| `public/api/neighborhood-greeting-card.php` | 47 | `($providerType, $registrationId, $isGuest)` | **이번 변경** |
| `scripts/verify-neighborhood-welcome.php` | 468 | `($pType, $rId)` — 2인자 | $isGuest 기본값 `false` → 기존 동작 유지 ✅ |

## AC 표

| 항목 | 결과 | 근거 |
|---|---|---|
| 비로그인 + 초안 공부방 → 404 | ✅ | `getPublishedById($id, false, true)`: `guestPublishedOnly=true` → `profile_status='published'` 필터 → draft 미조회 → null → 404 |
| 비로그인 + 발행 공부방 → 200, lat/lng=null | ✅ | `getPublishedById($id, false, true)`: `includePreciseCoordinates=false` → 좌표 null, 키 유지 |
| 비로그인 + 초안 과외쌤 → 404 | ✅ | `tutorBasicCard`에서 `AND t.profile_status = 'published'` → draft 미조회 → null → 404 |
| 비로그인 + 발행 과외쌤 → 200 | ✅ | `profile_status = 'published'` 통과 → 전과 같은 응답 |
| 로그인 → 전과 같음 | ✅ | `$isGuest=false` → `basicCard` 기본 경로 (좌표 포함, draft 허용) |
| 동네인사 화면 문구 무변경 | ✅ | 프론트 파일 변경 없음 |
| 허용 파일 밖 변경 0 | ✅ | `git diff --stat` 2파일 + 워크로그만 |
| `php -l` | **실행 못함** — 이 PC에 php 없음 |

## 가설과 달랐던 점

없음. 지시의 가설이 코드와 정확히 일치:
- `getPublishedById`의 기존 인자 2·3번째가 「좌표 숨김 + 발행만」을 이미 지원
- `tutorCardCondition`은 `profile_status <> 'hidden'`만 보므로 draft 통과 — `tutorBasicCard` 안에서 게스트 조건 추가

## 남은 것

- 게스트 지도 핀(대략 좌표 주기 등) → 범위 밖
- `php -l` 검증 → 이 PC에 php 없으므로 CI 또는 수동 확인 필요

## 위험도

- **낮음** — 읽기 전용 API 필터 추가. 로그인 경로 무변경. DB·비밀값 무관.
