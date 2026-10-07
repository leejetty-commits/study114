# C. 공부방 홍보2·3 논리 점검 (2026-10-05)

종현 t1357u: 우동공과2 자체 점검 + Cursor 교차점검(지시문). 읽기 전용. 수정·커밋·배포 금지.

## 2026-10-05 17:31 KST — 우동공과2 자체 점검 (HEAD efeb5fd, 읽기 전용)

### 현행
- 저장: 슬롯 번호 유지, slot1=is_primary 필수, 빈 2·3을 사업장으로 안 채움. 사업장은 study_rooms.region_id/complex_id 별도.
- 검색: 목록 게이트=slot1 필수. 지역 매칭=사업장 동 OR 홍보1·2·3 아무거나. 카드 위치 글자=홍보1. 핀=사업장 좌표.
- 통계(게스트 박스)=검색 total과 동일 → 2·3·사업장 동 포함.
- 공부방 로그인 홈 검색=홍보1만. 홍보2·3은 알약 표시만.
- Prime 구매: 지역별 3자리, 소유 확인은 홍보1·2·3 또는 사업장 동/단지. Pick은 지역 미저장.
- 노출(activePositionSku): study_room_id+sku+기간만, **지역 필터 없음**.

### 잠긴 정책 vs 코드
- 일치: 홍보1 필수·2·3 옵션, 카드 위치=홍보1, 핀=사업장, Prime 지역별 3자리(구매 쪽).
- **오류 A:** 프라임/픽 노출이 지역을 안 봄 → A동 Prime이 B동 검색·홈에도 Prime으로 보일 수 있고, B동 정상 결제분이 밀릴 수 있음(과외쌤도 유사 구조).
- **오류 B:** 사업장 동만으로도 Prime 구매 통과(대표 홍보1·2·3 중 하나라는 잠금과 어긋남). 거부 문구도 동작과 불일치.
- 미결: 검색에 사업장 동 포함(문서끼리 다름), Pick 지역 기준(문서 불일치), Prime 산 뒤 홍보칸 삭제 시 재고/노출, 홈 프라임이 최신 20개만.

### Cursor 교차확인 질문 5개 — 지시문(t1357)에 이미 전달한 A~E와 정합. 결과 대기.

## 2026-10-05 Cursor 교차점검 (t1358u) + 우동공과2 대조

잠긴 정책 위반(양쪽 합의·Cursor 보강):
1. activePositionSku 지역 미필터
2. PrimeRegionScope 사업장 폴백 구매 허용
3. SearchService 매칭에 study_rooms.region_id(사업장) 포함
4. StudyRoomHubRepository 마이페이지 카드 지역=사업장 우선
5. 공부방 Pick 구매에 홍보1·2·3 검사 없음

미결: 05장 대표변경 문장, region_label LIKE, 홈 현황=limit20 풀길이, slot1≠is_primary 옛행.
일치: 저장 슬롯·홍보1필수·공개카드 위치=홍보1·홈검색=홍보1.
다음: 종현이 수정 우선순위 지정 후 지시문.

## [2026-10-05] 사이트오류-26 지시문 (프라임/픽 목록 지역 필터)

## 2026-10-05 사이트오류-26 ACCEPT-with-notes (로컬 미배포)
- HEAD efeb5fd. SearchService room/tutor tier scope + home filters. verify-position-region-tier 19/0+5/0.
- notes: region_label·sigungu만 있는 검색은 티어 무필터(이전 유지). 홈 region_id 경로는 OK.

## [2026-10-05 17:54] 사이트오류-26 배포 지시 전달

## [2026-10-05] 오류2 프라임 사업장 폴백 — 자체점검 중 + Cursor 진단 지시 전달

## [2026-10-05 18:00] 사이트오류-26 배포 a832a01 · Deploy #382 success

## 2026-10-05 오류2 자체점검 (Paid, a832a01 기준 Paid 동일)
- assertOwnedByStudyRoom: 홍보 미매칭 시 study_rooms region/complex 폴백 통과 → 잠금(홍보1·2·3) 대비 **오류 확정**.
- create/complete/waitlist 동일. Pick은 미적용. 사업장-only 통과 검사 없음.
- Cursor 진단 대기.

## [2026-10-05] 오류2 Cursor 진단 대조 = 오류 확정. 27번 수정 「진행」 대기

## [2026-10-05] 사이트오류-27 지시문 발행 (프라임 구매 사업장 폴백 제거)
- 종현 t1366u 「ㅇㅋ 지시문」. 잠금: docs/internal/65 적용 대상=대표 홍보지역 1·2·3; 05§7·47 사업장≠홍보.
- 범위: PrimeRegionScope::assertOwnedByStudyRoom 사업장 폴백만. Pick·검색·Hub·지도는 다음.

## 2026-10-05 사이트오류-27 ACCEPT (로컬, 미커밋·미배포)
- HEAD a832a01. 변경: PrimeRegionScope.php + verify-prime-region-ownership.php(신규).
- assertOwnedByStudyRoom에 study_rooms SELECT 0. ownership 18/0, paid-renewal 38/0.
- create/complete/waitlist 동일. Pick·검색·Hub·지도·TicketService 재고 폴백 미변경.
- 배포는 종현 「배포」 대기.

## [2026-10-05 18:24] 사이트오류-27 배포 지시 전달

## [2026-10-05] 사이트오류-27 교차검수 notes (이미 ACCEPT 후)
- ProviderTicketService 재고 목록은 홍보 0건 시 사업장 한 줄 유지 → 화면 후보와 구매 거절이 어긋날 수 있음(다음 정리 후보).
- study_room_regions 비고 사업장만 쓰던 방은 구매·완료·대기 전부 거절 — 정책 일치, 운영 DB 점검은 종현 몫.

## 2026-10-05 사이트오류-27 배포 완료
- 커밋 `68cce94e833cf00a321d01e7a65b2c2393d0601b` (a832a01..68cce94), origin/main 반영.
- Deploy to dothome success. 라이브 확인은 종현.

## 2026-10-05 오류3 자체점검 (검색 사업장 region_id, HEAD 68cce94)
- searchRooms: region_id·region_label·sigungu 모두 `(sr.region_id … OR study_room_regions …)`.
- 게이트=홍보1 필수. 카드 위치 글자=홍보1. guestAxisCounts=같은 search.
- docs/ssot/13 잠금: 공부방 지역 검색 DB = study_room_regions (study_rooms.region_id 없음) → **오류 확정**.
- 05§7·47은 사업장/홍보 분리·카드/핀만. 검색 매칭 문장은 13이 정본.
- 수정 영향: 찾기·홈 목록·게스트 박스 카운트(사업장만 맞는 방 제외). Pick·Hub·지도 별도.

## [2026-10-05] 오류3 PC교차 = 자체점검과 동일(오류 확정). region-stats/04 사업장 서술=문서 잔재. 「진행」→28

## [2026-10-05] 사이트오류-28 지시문 발행 (검색 사업장 region_id 제거)


## 2026-10-05 사이트오류-28 ACCEPT (로컬, 미커밋·미배포)
- HEAD 68cce94. 변경: SearchService.php, region-stats.php(주석), search-schema.js(db표기), verify-room-promo-region-match.php(신규), verify-student-location-flow.mjs.
- region_id·region_label·sigungu 사업장 OR 제거, study_room_regions만. 홍보1 게이트·카드위치·핀 조인 유지.
- 검사 36/19/72/24/189 PASS. 배포는 종현 「배포」 대기.


## [2026-10-05 22:00] 사이트오류-28 배포 지시 전달
- 종현 t1373u 「배포」. allowlist 5파일, 기준 HEAD 68cce94, build:dothome 금지.


## 2026-10-05 사이트오류-28 배포 완료
- 커밋 `b7cf0bbdbf67316fcd3b9c0e8b64feed0b1b7151` (68cce94..b7cf0bb), origin/main 반영.
- Deploy to dothome #37313780515 success. 라이브 확인은 종현.


## [2026-10-05 22:08] 오류4·5 교차점검 시작
- 종현 t1376u: 우동공과2 PC 코드점검 + Cursor 읽기전용 점검지시문.
- 4=Hub 카드 지역 사업장 우선 / 5=Pick 구매 홍보 검사 없음.


## 2026-10-05 오류4·5 자체점검 (HEAD b7cf0bb)
- **4 ERROR:** StudyRoomHubRepository::regionLabel = 사업장 우선, 홍보1 폴백. 계정카드(FE studyRoomPromo1Label)는 OK. 허브 region_label 소비 UI 영향.
- **5 ERROR:** ProviderCheckoutService pick create/fulfill에 assertOwnedByStudyRoom 없음; region 스코프 미기록. 프라임만 검사.
- TicketService 재고 사업장 폴백 = 메모(구매와 별개).
- Cursor 점검 대기.


## [2026-10-05] 오류4·5 Cursor 교차 = 자체점검과 동일(오류 확정)
- 4: StudyRoomHubRepository::regionLabel 사업장→홍보1. 계정카드 OK. has_regions도 사업장 OR.
- 5: Pick create/fulfill assert 없음·region 미기록. waitlist는 Pick 거부.
- 「진행」→29(허브) 대기.


## [2026-10-05] 사이트오류-29 지시문 발행 (허브 region_label=홍보1)
- 종현 t1378u 「진행」. 범위: StudyRoomHubRepository regionLabel·has_regions. 계정카드·Pick·Ticket 제외.


## 2026-10-05 사이트오류-29 ACCEPT (로컬, 미커밋·미배포)
- HEAD b7cf0bb. StudyRoomHubRepository + verify-region-save-rules.mjs.
- regionLabel=홍보1만, has_regions=study_room_regions만. 검사 PASS.
- 배포는 종현 「배포」 대기. 다음=오류5 Pick.


## [2026-10-05 23:37] 사이트오류-29 배포 지시 전달
- 종현 t1380u 「배포」. allowlist 2파일, 기준 HEAD b7cf0bb.


## [2026-10-05 23:38] 오류5 교차검증 준비만 (시행 안 함)
- 종현 t1382u: 자체점검 계획 + Cursor 읽기전용 지시문 초안. 실행·수정 금지.


## 2026-10-05 사이트오류-29 배포 완료
- 커밋 `3271439f16a49284ce84384e7c31ff6dacede9aa` (b7cf0bb..3271439), origin/main.
- Deploy to dothome #37326417775 success. 라이브 확인은 종현.


## [2026-10-05 23:42] 오류5 교차검증 시행
- 종현 t1384u 「시행」. 우동공과2 PC + Cursor 읽기전용. HEAD 기대 3271439.


## 2026-10-05 오류5 자체점검 (HEAD 3271439)
- **ERROR 확정:** Pick create/fulfill assert 없음·region 미기록. waitlist Pick 거부. FE는 브라우저만.
- Cursor 점검 대기.


## [2026-10-05] 오류5 Cursor 교차 = 자체점검과 동일(오류 확정)
- Pick create/fulfill assert 없음·region 미기록. FE 픽 지역 필수 약함. 「진행」→30 대기.


## [2026-10-05] 사이트오류-30 지시문 발행 (Pick 홍보 소유 검사)
- 종현 t1386u 「진행」. Checkout create/fulfill + writeRegion + FE 지역 필수. 재고폴백·waitlist Pick 제외.


## 2026-10-05 사이트오류-30 ACCEPT (로컬, 미커밋·미배포)
- HEAD 3271439. Checkout+TicketRepo writeRegion+screens.js+verify-pick.
- 검사 25/18/38 PASS. 배포 「배포」 대기. 오류1~5 큐 완료.


## [2026-10-06 00:03] 사이트오류-30 배포 지시 전달
- 종현 t1388u 「배포」. allowlist 5파일, 기준 HEAD 3271439.


## 2026-10-06 사이트오류-30 배포 완료
- 커밋 `5e4b3f0047cfade77d93cff141b415e22d452fa0` (3271439..5e4b3f0), Deploy #37329846682 success.
- 홍보2·3 오류1~5 수정·배포 완료. 다음 후보: 재고 목록 사업장 한 줄(프라임 전용).


## [2026-10-06] 종현 확정(t1393u): 구매장소=홍보1·2·3
- 홍보2·3에도 광고 가능해야 함. 사업장≠구매후보. 재고 사업장 한 줄=오류.


## 2026-10-06 재고 사업장 한 줄 자체점검 (HEAD 5e4b3f0)
- ERROR: primeInventoriesForStudyRoom 홍보0→study_rooms 스코프. FE 칩은 saved_regions만. Cursor 대기.


## [2026-10-06] 재고 사업장 한 줄 Cursor 교차 = 오류 확정
- prime_scopes만 폴백. FE칩·구매는 OK. 「진행」→31 대기.


## [2026-10-06] 사이트오류-31 지시문 발행 (prime_scopes 사업장 폴백 제거)


## 2026-10-06 사이트오류-31 ACCEPT (로컬, 미커밋·미배포)


## [2026-10-06] 사이트오류-31 배포 완료
- 커밋 `45a14e1c8622c8000ed526c9f6e3bf2dfd321fb5` (5e4b3f0..45a14e1), Deploy to dothome #387 success.
- 홍보2·3 오류1~5 + 재고 사업장 폴백 수정·배포 완료.
- 보류: 26번 잔여(region_label/구 티어), 현재위치·지도·주소필터(종현 전반점검).
- 다음 후보(새치기 금지·종현 선택): 178-1 찾기·등록 인페이지 레일. 사이트오류-5 무기한 보류.
