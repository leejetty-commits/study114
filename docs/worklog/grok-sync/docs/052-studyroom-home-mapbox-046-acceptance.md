# 052 · 046 수락 — 홈 맵박스·상세검색 제거

- 작성일: 2026-09-24 (KST)
- 대상: Cursor 046 로컬 보고
- 판정: **수락** (047 전 count 함정·워킹트리 분리는 기록만)
- 티켓: [046](046-studyroom-home-mapbox-detailsearch-ticket.md)
- 상태: 로컬만 · push/`build:dothome` **금지**

## 통과

| 요구 | 결과 |
|------|------|
| 3.1 동=홍보1 | 논현1동 (`peekStudyRoomPromo1` / promo_label). 개설 삼성·대치 미사용 |
| 3.2 카피 | `논현1동 공부방 현황입니다` |
| 3.3 N=베이직 total | `getBasicPool`·`renderBasicListBlock` pagination total과 동일. `items.length` 미사용. 스모크 N=0=베이직 행 0 |
| 3.4 상태 dl 제거 | 없음 |
| 3.5 힌트 | `우리동네의 공부방은 하단의 '우동공과 베이직공부방' 목록입니다` |
| 4 홈 상세검색 제거 | 공부방 homeSelf `hideSearchForm`. 찾기 `#/search/room` 상세검색 유지. 과외 홈 hide 유지 |
| 게스트 대치 | 유지 |
| 044 멤버박스 | 미변경 |
| 047 미포함 | `demo_prime_filled`·티어 미수정 (의도) |
| commit/push/build | 없음 |

가능동 문구는 DB에 가능동 방 없어 논현1동으로 동일 경로 스모크 — 인정.

## 기록 (결함 아님)

- **047 전**: `demo_prime_filled=1`이면 지역 1곳이 프라임으로 빠져 맵 N(베이직 total)=0 가능. 046은 베이직 total을 맞게 표시한 것. 프라임 오점유는 **047**.
- **워킹트리**: signup/PHP 등 unrelated dirty 혼재. 046 커밋 시 파일만: `search-map.js`, `search-find-surface.js`, `provider-home.js`, `search-ui/vite.config.js`(+044 의존분).

## 다음

- **047** 프라임/베이직 점유
- **051** 공부방찾기 대치→홍보1 (046 맵 공유)
- **050** 홈학생·학생찾기
