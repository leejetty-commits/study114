# 054 · 051 수락 — 공부방찾기 기본=홍보1 · 맵박스 046동형

- 작성일: 2026-09-24 (KST)
- 대상: Cursor 051 로컬 보고
- 판정: **수락**
- 티켓: [051](051-studyroom-find-promo1-mapbox-ticket.md)
- 상태: 로컬만 · push/`build:dothome` **금지**
- 스모크 계정: 공부방 id 4 · 홍보1=`서울 강남구 논현1동` (`primary.promo_label`). 개설 삼성1동 미사용. (DB에 가능동 방 없어 논현1동 경로 — 046/052와 동일 인정)

## 통과

| 요구 (051 §5) | 결과 |
|---------------|------|
| 찾기 현재위치·맵 동·상세검색 지역·베이직 헤더 = 홍보1 · 대치 0 | 논현1동. 대치 0 |
| 헤더 지역 = 카드 지역 | 티켓0040공부방 / 강남구 논현1동. 일치 |
| 맵 046 규칙 | `논현1동 공부방 현황입니다` · N=베이직 total 0 · 상태 dl 없음 · 3.5 안내 동일 |
| 상세검색 | 찾기 폼 유지. 홈 폼 0(046 hide 회귀 없음) |
| 검색 → 필터 | 논현1동 1건 · 같은 카드 |
| 초기화 → 홍보1 | searched 제거 후 논현1동 + 같은 카드 |
| 게스트 | 첫 화면 대치동(현재위치·맵·카드) 유지 |
| 홈 회귀 | 멤버박스 수업지역 논현1동 · 맵 046 · 상세검색 없음 |
| 047 미포함 | `demo_prime_filled`·프라임 점유 **미수정** (의도) |
| commit/push/build | 없음 |

## 원인·수정 (보고 인정)

| 이슈 | 조치 |
|------|------|
| 대치 UI + 홍보 카드 | 찾기에서도 `isProviderSelfPreviewMode`로 헤더 목업 대치 + 자기 방만 삽입. **공부방+room은 홈·찾기 모두 자기 방 강제 삽입 OFF** → 홍보1 라이브 목록만 |
| 검색 후 0건(500) | `applyRegionLabelMatch`가 없는 `regions.label` 조회. **dong_name / sigungu_name / sido_name만** 유지 → 같은 라벨 1건 복구 |

## 시드·공유 (잠금 유지)

- 시드: `peekStudyRoomPromo1().primary.promo_label` only
- 진입: `hydrateFindStateFromHash` — URL·주소 고정이 아니면 세션/GPS 대치 무시 → 홍보1
- 라벨: `seedStudyRoomPromoLabel` → `resolveActiveRegionLabel`
- 목록: `bootStudyRoomHome` 라이브(`region_id`)
- 초기화: `seedStudyRoomPromoLabel`로 홍보1 복귀
- 게스트 저장소: `source === 'saved'`일 때 홍보1 canonical 기록 생략
- 046 공유: 같은 `renderSearchMapBlock` + `providerHome`(공부방 room 탭 홈·찾기). 상세검색 hide는 홈만

## 기록 (결함 아님)

- 맵 N=0 vs 플랫 목록 카드 1장: 그 1곳이 `demo_prime_filled` 프라임 점유 → 베이직 total 0. **047**에서 처리.
- allowlist 보고 파일: `search-role-access.js`, `search-provider-self.js`, `search-find-surface.js`, `search-region-feed.js`, `search-map.js`, `screens/search-page.js`, `SearchService.php`

## 다음

1. **047** — 무과금 프라임 오점유 (`demo_prime_filled` · self tier · PHP resolveExposureTier)
2. **050** (+050-add) — 홈 우리동네 학생 ≠ 학생찾기 · 기본 홍보1
3. 배포: 사용자 「배포해」 전 · A배치(044/048/046/051 + 047 수락 후) 권장 · 본 051만 단독 커밋도 가능하되 signup dirty 제외
