# 178-12 지역 「구 2단계」 영향 점검 결과 (Cursor, 2026-10-01, 읽기 전용·로컬 DB SELECT만)
요약본. 원문은 사용자 채팅(t893u). 구 목록은 코드·로컬 DB에 있는 이름만 근거.

## 1. regions 구조
- 한 테이블. 구 전용 컬럼 없음. sigungu_name 한 칸에 시·군 또는 구. dong_code UNIQUE.
- 과외 「시」 단위 = 가짜 행: dong_name='시 대표' (SidoRegionEnsure::ensure). 광역은 sido=sigungu=서울특별시, 도는 sido=경기도/sigungu=수원시.
- 공부방 동 = RegionEnsure::fromKakao 또는 시드. dong_name이 동.
- 로컬 168행: 시 대표 161, 동 7 (대치동 id1, 역삼1동 90, 논현1동 91, 삼성1동 92, 우동, 센텀동, 주안동). 영통 포함 행 0.
- 수원·성남 시 대표는 로컬 DB에만 있고 시드에 없음. 영통구 등 일반구 행은 시드·DB 모두 없음.

## 2. 구 목록
- korea-sidos.js·SidoRegionEnsure::PROVINCE_CITIES에 구 목록 없음(시·군만). 일반구 문자열은 저장 마스터에 없음.
- 동 행 sigungu_name으로만 구가 보임(강남구·해운대구·미추홀구). hope-region-masters.js FALLBACK에 서초·송파·연수·분당구가 문자열로만 있고 DB id와 불일치.

## 3. 입력 단계
- 과외쌤 가입(signup-basic.js+tutor-region-slots.js): 1차 광역8/도9, 광역은 2차 숨김, 도만 시·군. scope_type 'city' 고정. BasicRegisterService→tutor_regions.
- 학생 가입 과외 분기: 같은 1차, 도만 시·군. activity_city 문자열→regionIdFromActivityLabel→students.preferred_tutor_region_id.
- 학생 가입 공부방 분기: 주소 검색→동/단지, region_id/complex_id, region_basis → preferred_studyroom_region_id.
- 과외 마이페이지 tutor-reg: 같은 슬롯, 숫자 region_id만. TutorRegisterService가 DELETE 후 INSERT, scope_type 기본 city.
- 학생 마이페이지 student-reg: 시·구 2단계 아님, 한 개 select, hope-region-masters.js listCityOptions(첫 토큰+첫 region id; API 비면 서울특별시 id '1' = 대치동 행).

## 4. scope_type
- ENUM city|district|metro 기본 city. 로컬 tutor_regions 4행 전부 city. district/metro 대입 코드 없음. 읽는 분기 없음(TutorHubRepository가 그대로 반환).

## 5. 집계
- SearchService::guestAxisCounts / region-stats.php: 문자열 대치동/서울시/서울시, regionLabelToken 후 sido·sigungu·dong LIKE.
- tutor-activity-chart.js: 저장 라벨, 검색 API tutor_region_label/preferred_region_label.
- AdminExposureRepository: 대표 tutor_regions.region_id, 라벨은 dong_name → 시 대표 행이면 「시 대표」로 나옴.
- AdminMemberRepository: 지역 키 없음.
- 유료: provider_position_subscriptions.city_id = regions.id, TutorPositionAxis::cityLabel은 sido_name 우선(수원 id13 → 경기도 표시). 로컬 구독 city_id 값 미확인.
- 동네인사: primary_region_label 문자열(집계 아님).
- region-stats 실제 숫자 미확인.

## 6. 검색·필터
- tutor_region_id: tutor_regions.region_id 일치 / tutor_region_label: 토큰 LIKE(동 있으면 동, 없으면 첫 …시, 아니면 마지막 토큰)
- 학생 preferred_region 숫자: studyroom/tutor region id 일치, 라벨은 이름 세 컬럼 LIKE.
- 공부방 라벨: 본인 region + study_room_regions LIKE.
- 프론트 filterTutorsByRegion: location_label 문자열, 서울이면 SEOUL_METRO_HINTS.
- 「서울시」 토큰은 서울시. 「서울특별시」「강남구」엔 그 글자 없음. 「서울 강남구」 토큰=강남구 → 동 행 sigungu와는 맞고 시 대표 행(sigungu 서울특별시)과는 안 맞음.

## 7. 저장값
- tutor1 대표 region 1(서울특별시/강남구/대치동), 추가 2,4(우동·주안동), tutor2 대표 2, student1 preferred_tutor_region_id 2. 전부 동 행을 city로 가리킴(시드).
- 가입에서 광역 고르면 저장 id는 시 대표 행(서울 id5). 구 행 추가해도 기존 region_id·city_id는 그대로 → id 일치 검색·유료 축은 옛 행만 봄.

## 8. 손님 「서울시」 위치
search-schema.js 94–104(GUEST_DEFAULT_REGIONS, MOCK_TUTOR_REGIONS), data.js 31–43(GUEST_DEMO_REGIONS_BY_AXIS), search-page.js 79, search-find-surface.js 223·898·1370, location-display.js 42·474, tutor-home-seed.js 58, provider-home.js 185, search-tier-render.js 26, SearchService.php 80–90.
- regionIdFromActivityLabel('서울 강남구')는 정적·수원만 목록 모두 "" (현재 형식은 「서울특별시」「경기도 수원시」).

## 10. 도 하위 시·군 (코드=DB 시 대표 행 동일, 누락 없음)
경기 28시3군=31 / 강원 7시11군=18 / 충북 3·8=11 / 충남 8·7=15 / 전북 6·8=14 / 전남 5·17=22 / 경북 10·12=22 / 경남 8·10=18 / 제주 2·0=2.
- 공식: 강원도청 시7·군11 일치. 전국 합계(2025-12-31, e-나라지표) 시75·군82·구69. 나머지 도 공식 개수 미확인.
- → 「군이 빠졌다」 는 목록 문제가 아님. 원인 후보: (a) cities API가 일부만 주면 목록엔 있고 id가 빔(13번), (b) 광역 안 군(아래 11).

## 11. 광역 안 군·구
- 광역 시 대표는 시도당 1행(id 5–12). 강화군·옹진군·기장군·달성군·군위군·울주군은 목록·행 모두 없음. metro:이면 시·군 select를 숨기고 광역 id만 넣음(tutor-region-slots.js 53·77–90).

## 12. 가짜·목업
SidoRegionEnsure.php 129·144(시 대표, 순번 sigungu_code) / korea-sidos.js 227–250(metro-11, city-41-0 정적 161옵션, 저장 거절) / search-schema.js 94–116(서울시·부산시·인천시, MOCK_REGIONS), 118~(MOCK_RESULT_ROWS) / data.js 31–43, exposure-data.js / hope-region-masters.js 6–23(대치·서초·정자동 등) / tutor-reg/store.js 119·185(primary_region_label '서울특별시') / location-display.js 474, tutor-home-seed.js 58(빈 값→서울시) / 012_search_dev_seed.sql 104–106.

## 13. region_id가 빔
- metro:11, prov:41+수원시/가평군(정적)은 "". API에 수원 id13만 있으면 수원은 "13", 가평군은 "".
- renderProvinceCityOptions는 id 없어도 시·군 이름 전부 그림 → 화면엔 있고 hidden region_id는 빔. 가입 저장은 숫자 id 없으면 오류 문구로 막음.
- 로컬 DB엔 코드 목록의 시·군 행이 모두 있으므로 cities API가 전부 돌려주면 공백 없음.

## 열린 항목(결정·확인)
1. regions에 구를 넣을 칸 없음(구 행 추가 방식 결정 필요)
2. 과외 저장 id(시 대표) vs 시드 4건(동 행 city) 불일치
3. 손님 「서울시」/가입 「서울특별시」/강남구(동 행 sigungu) 서로 LIKE 불일치
4. district ENUM 미사용
5. 유료 city_id 실제 값 미확인
6. 광역 안 군(강화·옹진·기장·달성·군위·울주) 목록·행 없음
7. 공식 구·군 목록 출처 필요(행정표준코드) — 기억으로 채우지 않음
8. 학생 마이페이지 희망지역 select 재설계 필요
9. region-stats 실제 숫자 미확인
