# 067 · Cursor — 맵: 핀 0이어도 지역 center로 렌더 · 공부방 좌표 null 해제

- 작성일: 2026-09-24 (KST)
- 선행: [066](066-home-find-map-064-diagnosis-acceptance.md) · [064](064-home-find-map-render-ticket.md) · [062](062-home-memberbox-map-prime-pick-planning.md) §2
- 상태: **로컬 수락 → [068](068-home-find-map-067-acceptance.md)** (push/`build:dothome` 여전히 지시 전 금지)
- 제외: 063 샘플/멤버박스 · signup/auth dirty · 정방향 geocode 신규 API · 과외 탭(후순위)

---

## 0. 한 줄

핀이 0이어도 **현재 동네(홍보1/검색 지역) center로 네이버 지도를 그리고**, 공부방 역할이 lat/lng를 null로 비우던 분기를 고친다. 핀이 있으면 기존처럼 마커+fit.

---

## 1. 잠금 요구

### 1.1 `mountStudyRoomMap` (shared/naver-map.js)

- `pins.length === 0`이어도 **키가 있고** `resolveMapCenter`가 유효하면 **지도 생성**.
- 상태 문구 「표시할 위치 정보가 없습니다…」는 **지도를 포기하는 early-return에 쓰지 말 것**.
  - 허용: 맵 위 오버레이/배너 힌트(목록 0·핀 0)는 **맵 타일 유지** 전제.
  - 키 없음·SDK 실패 분기는 기존 유지.
- 핀 0: center만 표시(마커 없음). 핀 ≥1: 기존 마커·fit/포커스 유지.
- `resolveMapCenter` 우선순위 유지: explicit lat/lng → 핀 평균 → regionLabel 폴백 → 대치 기본.

### 1.2 공부방 홈·찾기 center (`search-find-surface.js` 등)

- `studyRoomPromoMap`(공부방 + room 탭)에서 **`lat: null` / `lng: null` 강제 제거**.
- 넘길 좌표 SSOT(우선순위 잠금):
  1. `state.canonicalLocation` lat/lng (검색·주소 확정 시)
  2. 없으면 홍보1/`activeRegionLabel`로 `matchRegionCenter` 또는 기존 parseRegionParts 좌표
  3. 그래도 없으면 대치 기본(기존 DEFAULT) — **null로 맵을 죽이지 말 것**
- `data-map-lat` / `data-map-lng`가 공부방 홈·찾기에 실제로 찍혀 bind로 전달되는지 스모크.

### 1.3 찾기 지역 갱신

- 지역 바꿔 검색(또는 홍보1 기본 진입) 후 **핀 0이어도** 맵 center가 **그 지역 라벨**로 이동.
- 목록 API 실패로 items=[]여도 **맵은 region center로 살아 있어야** 함(목록 에러 카피와 분리).

### 1.4 하지 말 것

- 정방향 geocode 신규 연동(후순위). 폴백 동 목록 대확장만으로 땜질하지 말 것 — **center 경로 복구가 본명**.
- 게스트 시드·demo_prime 경로 변경 금지.
- 063 vacantSamples / 멤버박스 CSS 손대지 말 것.
- push / `build:dothome` 금지.

---

## 2. Allowlist (예상)

```
preview/shared/naver-map.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/search-map.js   # 필요 시만
(+ 공부방 홈에서 맵 옵션 넘기는 최소 1파일)
```

auth · signup · exposure-render(063) · ProviderUsage 등 dirty **제외**.

---

## 3. 스모크

1. **공부방 로그인 홈**(API 기동): 가능동(또는 홍보1) · 목록 0이어도 **네이버 타일** · 문구만으로 맵 포기 금지
2. 목록에 lat/lng 있는 방 ≥1이면 핀 표시
3. **공부방찾기**: 신곡동 등 다른 동 검색 → 맵 center가 그쪽으로 이동(핀 0이어도)
4. **게스트 대치** 회귀: 기존처럼 타일+시드 핀
5. 키 없는 환경: 기존 설정 필요 문구만

보고: 파일·diff 요지 · early-return 제거 방식 · studyRoomPromoMap lat/lng · 제외 확인.

---

## 4. 붙여넣기

```
[티켓 067 · 맵 핀0 center 렌더 · 로컬만]

066 진단 수락 반영. push/build 금지. 063/auth 제외. 정방향 geocode 신규 금지.

원인: mountStudyRoomMap pins.length===0 early-return + 공부방 studyRoomPromoMap lat/lng null.

1) pins===0이어도 resolveMapCenter로 지도 생성(마커 없음). 그 문구로 맵 포기 금지.
2) 공부방 홈·찾기 lat/lng null 강제 제거. canonical → 지역폴백 → 대치기본.
3) 찾기 지역 변경 시 핀0이어도 center 갱신. API []여도 맵 생존.
4) 게스트 대치·키없음 분기 회귀.

스모크: 로그인홈 타일 · 찾기 이동 · 게스트 · 보고 파일/분기.
```
