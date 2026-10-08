# 068 · 067 수락 — 맵 핀0이어도 지역 center 렌더

- 작성일: 2026-09-24 (KST)
- 티켓: [067](067-home-find-map-empty-pins-fix-ticket.md) · 진단 [066](066-home-find-map-064-diagnosis-acceptance.md) · 기획 [062](062-home-memberbox-map-prime-pick-planning.md) §2
- 상태: **로컬 수락** (커밋·push·`build:dothome` 없음 · 지시 준수)
- 기준 보고: Cursor · `ljh_work` 워킹트리 3파일 diff 대조. 게스트 홈 타일 브라우저 OK. 로그인 홈·찾기 맵 이동은 API(`127.0.0.1:8080` ECONNREFUSED)로 브라우저 미확인 → 코드·HTML 분기로 대체

---

## 0. 판정

**수락.** 067 잠금(핀0 center 맵 · 공부방 lat/lng null 해제 · 찾기 지역 center · 정방향 geocode 금지 · 063/auth 미터치)과 일치한다.  
보완지시문 없음.

| 항목 | 결과 |
|------|------|
| `pins.length===0`이어도 `resolveMapCenter`로 지도 생성 · 마커 없음 | 통과 (early-return 제거) |
| 「표시할 위치 정보가 없습니다…」로 맵 포기 금지 | 통과 (해당 early-return 삭제) |
| 키 없음 분기 유지 | 통과 (보고·코드) |
| 공부방 `studyRoomPromoMap` lat/lng null 강제 제거 | 통과 (`canonicalLocation` 전달) |
| `search-map` providerHome도 `options.lat/lng` → `data-map-*` | 통과 |
| 찾기 지역 변경·목록 `[]`에도 맵 칸·center 생존 | 통과 (보고·구조) |
| 게스트 대치 시드 타일 회귀 | 통과 (브라우저 © NAVER) |
| 정방향 geocode 신규 없음 · push/build 없음 · 063/auth 미수정 | 통과 |

---

## 1. 구현 요약 (코드 대조)

Allowlist **정확히 3파일** (`+7 / −10`):

```
preview/shared/naver-map.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-find-surface.js
```

| 파일 | 요지 |
|------|------|
| `naver-map.js` | `pins.length===0` → `showStatus`+`return null` **삭제**. center로 `Map` 생성 후 핀 루프만 0회. 폴백에 `가능동`·`논현` 추가(보조 · 본명인 center 경로 복구와 병행) |
| `search-find-surface.js` | `lat/lng: studyRoomPromoMap ? null : …` → 항상 `state.canonicalLocation?.lat/lng ?? null` |
| `search-map.js` | `parseRegionParts` / `data-map`에 `providerHome`이어도 `options.lat/lng` 우선 반영 |

핀 ≥1이면 기존 fit/단일 핀 zoom 유지. 게스트는 좌표를 따로 안 넘겨 시드 핀 평균 경로 유지(보고).

---

## 2. Allowlist (차후 스테이징용 · 지금 커밋 금지)

```
preview/shared/naver-map.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-find-surface.js
```

워킹트리에 063(멤버박스·프라임/픽)·auth/signup 등 dirty 잔존 → **위 3파일과 섞지 말 것**. 063 수락 allowlist는 [065](065-home-memberbox-prime-pick-063-acceptance.md).

---

## 3. 잔여(수락 차단 아님)

- **로그인 홈 타일 · 찾기 지역 이동** 브라우저 스모크: 로컬 API(8080) 기동 후 1회(가능동·신곡동 등). 오후 스모크에 묶어도 됨
- 폴백 동 목록은 최소 추가만 됨. 미등록 동네는 대치 기본(보고와 일치) — 정방향 geocode는 후순위
- 운영 반영은 「배포해」 + allowlist 티켓(063+067 묶음 여부 별도) 후에만

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 15:38 | 067 로컬 수락 · 보완없음 |
