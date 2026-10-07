# 066 · 064 진단 수락 — 맵 미표시 원인

- 작성일: 2026-09-24 (KST)
- 티켓: [064](064-home-find-map-render-ticket.md) · 기획 [062](062-home-memberbox-map-prime-pick-planning.md) §2
- 상태: **진단 수락** → 수정 지시 [067](067-home-find-map-empty-pins-fix-ticket.md)
- 기준: Cursor 진단(코드 수정 없음). 로그인 홈은 API(127.0.0.1:8080 ECONNREFUSED)로 브라우저 재현 불가 · 게스트 홈 맵 타일 OK

---

## 0. 판정

진단 보고는 064 §2 항목을 충족한다. **키/SDK 문제가 아니라 핀 0 early-return + 공부방 역할 center 좌표 null**이 주원인으로 잠긴다.  
이번 Vite 프록시 거부는 로컬 API 미기동으로 **별트랙**(단정 금지로 유지).

---

## 1. 확정 원인 (코드)

| # | 사실 |
|---|------|
| A | `mountStudyRoomMap`: `pins.length === 0`이면 center 계산 여부와 무관하게 「표시할 위치 정보가 없습니다…」후 **지도 생성 안 함** (`naver-map.js` ~196) |
| B | `resolveMapCenter`는 data-map-lat/lng · 핀 평균 · 지역 라벨 폴백 · 대치 기본까지 있으나, A 때문에 **핀 0이면 쓰이지 않음** |
| C | 공부방 홈·찾기(`studyRoomPromoMap`): `search-find-surface.js`가 **lat/lng를 고의 null** → `data-map-lat/lng` 비움 |
| D | 핀 = 항목 lat/lng(우선) · 없으면 `location_label`이 제한 동 폴백에 걸릴 때만 · id 없거나 published 아니면 제외. **정방향 geocode 없음** |
| E | 게스트는 시드 좌표로 핀≥1 → SDK·타일 OK. 홈/찾기 키·스크립트 URL 동일(앱별 env 주입) |
| F | 찾기에서 지역만 바뀌고 핀 0이면 맵이 새 지역으로 안 움직임(A+C) |

---

## 2. 증상 매핑

| 사용자 증상 | 대응 |
|-------------|------|
| 로그인 홈 파란 빈 판 + 그 문구 | A (+ 목록 좌표 없음/API 실패로 핀 0, C로 center도 없음) |
| 찾기 지역 검색해도 맵 안 바뀜 | A + C (핀 0이면 center만으로도 미생성) |
| 게스트 대치 맵 OK | E |

---

## 3. 수정은 067

로컬만 · push/build 금지 · 063/auth dirty 혼합 금지.

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 | 064 진단 수락 · 067로 수정 이관 |
