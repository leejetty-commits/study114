# 301-2 추천(👍) 버튼 바인딩

**기준:** origin/main `4dc82319` (301-1-2 병합 후)  
**브랜치:** `cursor/301-2-recommend-binding-20261025`  
**작업일:** 2026-10-25  
**승인:** 이 세션은 자기 커밋을 승인하지 않는다.

## 문제

회원 홈·검색 카드의 👍 버튼은 `data-action="recommend-toggle"` 속성으로 렌더되지만, `bindUserActionEvents()`에 해당 핸들러가 없어 클릭이 무시됐다. 게스트 홈(`guest-sections.js`)과 확대카드(`detail-shell.js`)에만 바인딩이 있었다.

첫 렌더에서 서버 응답의 `recommended` 상태가 버튼에 반영되지 않아, 이전에 추천한 카드도 비활성으로 보였다.

## 고친 방식

### user-actions-ui.js

- `toggleRecommendation`을 `search-api.js`에서 import.
- `bindUserActionEvents()` 안에 `recommend-toggle` 핸들러를 추가. 기존 `guest-sections.js`·`detail-shell.js`와 같은 패턴:
  - 클릭 → `toggleRecommendation(kind, id)` POST → 응답의 `recommend_count`·`recommended`로 숫자·`is-active` 갱신.
- sessionStorage(`study114-recommend-active`) 기반 추천 상태 추적:
  - 토글 응답의 `recommended`로 세트를 갱신 → 리렌더·새로고침 후 `is-active` 유지.
  - 바인딩 시점에 `isRecommendedLocal(kind, id)`로 기존 활성 상태 복원.
  - 최대 200개, 탭 닫으면 초기화(sessionStorage).
- `isRecommendedLocal`을 export해 렌더 시점에도 사용.

### exposure-render.js

- `isRecommendedLocal`을 import.
- `renderItemActions()`에서 로그인 사용자의 추천 버튼에 `is-active` 클래스를 첫 렌더부터 적용.

### guest-sections.js

변경 없음. 게스트 카드는 원래 `login-gate`로 렌더되어 `recommend-toggle` 버튼이 나오지 않음.

## 범위 밖

- `detail-shell.js`의 기존 recommend-toggle 바인딩은 이미 동작함 — 건드리지 않음
- 추천 수 변조·hideWhenZero 금지. 서버가 0이면 0.

---

## 보완 (FS-T3-004): 목록 `recommended` → 첫 렌더 is-active

**기준 tip:** `5035e485` (같은 브랜치 이어 작업)  
**작업일:** 2026-10-25

### 문제

sessionStorage만으로 「첫 활성」을 흉내 내서 부족했다. 목록 API에 개인 `recommended`가 없어 예전에 추천한 카드도 비활성. 그 상태 첫 클릭 = 서버 토글 **해제** 위험.

### 고친 방식

#### RecommendService.php — 배치 조회 헬퍼

- `recommendedSet(int $userId, string $targetType, array $ids): array<int, true>` 추가.
- `WHERE user_id = ? AND target_type = ? AND target_id IN (…)` 한 번 조회. N+1 금지.
- DB 미적용(`user_recommendations` 없으면) 빈 배열 반환 — 기존 `assertReady()` 대신 `tableExists` 체크만.

#### SearchService.php — search() 에 authUserId 파라미터

- 시그니처에 `?int $authUserId = null` 추가 (기존 파라미터 뒤, 하위호환).
- room/tutor 탭에서 페이지 items id를 모아 `RecommendService::recommendedSet()` 1회 호출.
- 각 item에 `'recommended' => bool` 키 추가. student 탭·게스트(null)는 추가하지 않음.
- 예외 시 `$recSet = []` → 전부 false (기능 미적용 환경 대응).

#### search.php — user_id 전달

- `$authUser !== null ? (int) $authUser['user_id'] : null` 을 `search()` 10번째 인수로.

#### exposure-render.js — 서버 값 우선

- `renderItemActions()` 의 `recommendActive`: `item?.recommended === true || isRecommendedLocal(kind, itemId)`.

#### user-actions-ui.js — seedRecommendedFromItems

- `setRecommendedLocal` 을 export.
- `seedRecommendedFromItems(kind, items)` 함수 추가: 목록 items의 `recommended` 값으로 sessionStorage 세트를 동기화.
  - `recommended === true` → 세트 추가, `recommended === false` → 세트 제거.

#### home-basic-live.js — 홈 시드

- `seedRecommendedFromItems` import, `hydrateHomeBasicFromSearch` · `refetchHomeBasicKind` 에서 room/tutor 맵핑 직후 호출.
- mapRoom / mapTutor에 `recommended: item.recommended === true` 필드 추가.

#### search-find-surface.js — 검색 시드

- `seedRecommendedFromItems` import, 검색 결과 수신 시 room/tutor이면 호출.
- 매퍼가 `...apiItem` 스프레드하므로 `recommended` 자동 전파.

### 수용 기준 확인

| 기준 | 결과 |
|---|---|
| 로그인 검색/홈 카드 JSON에 `recommended` 키가 있고, DB에 추천 행이 있으면 true | ✅ `SearchService::search()` 에서 배치 조회 후 `$item['recommended'] = isset($recSet[(int) $item['id']])` |
| 이미 추천한 카드: 새로고침·새 탭 첫 렌더부터 `is-active`. 첫 클릭은 해제 | ✅ 서버 `recommended: true` → `renderItemActions` is-active, 클릭 → POST toggle → 서버 delete → `recommended: false` 반환 |
| 미추천 카드: 비활성 → 첫 클릭 추가 | ✅ `recommended: false` → is-active 없음, 클릭 → POST toggle → insert → `recommended: true` |
| 게스트: 여전히 login-gate | ✅ `$authUserId === null` → 배치 조회 안 함. 프론트 `guest=true` → `login-gate` 렌더 |
| 허용 경로 밖 변경 없음 | ✅ 7개 파일 모두 허용 경로 내 |

### 「이미 추천한 카드 첫 클릭=해제」 정적 근거

서버: `SearchService::search()` 에서 `RecommendService::recommendedSet()` 이 `user_recommendations` 에서 user_id+target_type+target_id 행을 조회해 `recommended: true`를 items에 붙인다. 프론트: `renderItemActions` 에서 `item.recommended === true` 이면 `is-active` 클래스를 렌더하고, `seedRecommendedFromItems` 가 sessionStorage도 동기화한다. 사용자가 첫 클릭하면 `toggleRecommendation` POST가 `RecommendService::toggle()` 을 호출하고, 이미 행이 있으므로 `$exists = true` → DELETE → `recommend_count - 1` → `recommended: false` 반환. 프론트는 `classList.toggle('is-active', false)` + `setRecommendedLocal(kind, id, false)` 실행. 따라서 첫 렌더 활성 → 첫 클릭 = 해제가 보장된다.
