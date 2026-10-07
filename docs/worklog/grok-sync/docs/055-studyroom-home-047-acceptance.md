# 055 · 047 수락 — 공부방 홈 프라임/베이직 점유

- 작성일: 2026-09-24 (KST)
- 대상: Cursor 047 로컬 보고
- 판정: **수락**
- 티켓: [047](047-studyroom-home-prime-basic-occupancy-ticket.md)
- 상태: 로컬만 · push/`build:dothome` **금지**
- 스모크 계정: 티켓0040공부방(id 4) · 홍보1=`서울 강남구 논현1동` · **활성 구독 없음**. (가능동 DB 부재 — 동일 경로 인정)

## 통과

| 요구 (047 §6) | 결과 |
|---------------|------|
| 무과금 → 프라임에 자기 방 0 · EMPTY | 프라임 카드 0 · EMPTY 홍보 3칸(「이 자리에 공부방을 홍보하세요」) |
| 자기 방 = 베이직만 | 베이직에 티켓0040공부방 |
| 픽 | 유료 pick 없음 → 후보 없음. 자기 방 베이직만 |
| 맵 N = 베이직 total (046) | 베이직 total 1 → 맵 「공부방 1」. 046 카피·상세검색 hide 유지 |
| 유료 점유 분리 스모크 | 방 id 1(대치 Prime 수학) 구독 ~2026-09-30. API `position_sku=prime` · `exposure_tier=prime`. 논현 홈 목록에는 없음(지역 분리·정상) |
| 게스트 데모 | 대치동. 프라임 데모 1 + EMPTY 2 · 픽 시드 유지 |
| 044·046 제외 | 멤버박스·search-map/provider-home 미변경 |
| commit/push/build | 없음 |

## sku 판정 (잠금 기록)

`provider_position_subscriptions`에서

1. `provider_type` + `provider_id` 일치
2. `sku_code` ∈ {`prime`,`pick`}
3. `CURDATE() < end_exclusive_on`
4. `started_on` 없거나 오늘 이전
5. **prime > pick**
6. 행 없음 → `basic`, `position_sku=null`

상세완료·목록 인덱스 **미사용**.

## PHP

`SearchService::resolveExposureTier`의 `index + expanded_complete → prime` / `8번째 미만 → pick` **삭제**.  
공부방·과외쌤 검색 모두 위 구독 조회로만 `exposure_tier`·`position_sku` 부여.

## 파일

| 파일 | 요지 |
|------|------|
| `src/Search/SearchService.php` | 구독 기반 티어 |
| `preview/home-ui/src/exposure-rules.js` | `_realDb` 목록은 `demo_prime_filled`로 프라임·픽 채우지 않음. 설정값 1은 게스트 시드용 유지 |
| `preview/home-ui/src/study-room-home-seed.js` | 홈 카드 티어 = `position_sku`만 |
| `preview/search-ui/src/search-exposure-mapper.js` | sku 없으면 basic |
| `preview/search-ui/src/search-provider-self.js` | 공부방 self: 시드 id=1·프라임 강제 없음 |

## 기록 (결함 아님 · 후속)

- **과외쌤 self**의 id=1 프라임 하드코드는 본 티켓 제외로 **잔존**. 공부방 047 수락과 별개. 과외 홈 동일 증상 나면 별 티켓.
- 046에서 보이던 「맵 N=0 + 목록 1」함정은 본 047로 해소(베이직 total=1).

## 다음

1. **050** (+050-add) — 홈 우리동네 학생 ≠ 학생찾기 · 기본 홍보1
2. 배포 배치 A 후보: 044+048+046+051+047 (로컬 수락분) — 사용자 「배포해」 전 · signup dirty 제외 · allowlist 커밋
