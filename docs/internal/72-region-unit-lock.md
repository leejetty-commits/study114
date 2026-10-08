# 72. 과외 지역 단위 및 역할별 저장 정본 — 광역시·시·군 단위 체계와 데이터 이관

- 상태: 정본 (2026-10-08 20:26 사용자 최종 확정 개정)
- 이전 정책(구·시·군 통일)에서 **광역시 단독·도(시·군) 단위 체계**로 복귀·개정.

---

## 1. 정책 변경 배경 및 내력

### (1) 사용자 결정 원문 (2026-10-08 20:07~20:26)
- **20:07~20:10 (단위 체계 전환 원문)**:
  - 「정책은 과외쌤을 시군구로 했는데, 사실 구로 나누는게 크게 의미가 없어. 왜냐하면 광역시는 교통이 너무 발달되어 있어서 충분히 과외활동에 지역이 커버가 가능해. 서울을 예로 들면, 서울 하나만 해도 전철로 다 과외하러 다닐수 있어...」
  - 「광역을 하나로 봐도 돼. 학생이 과외쌤을 구에서 찾는게 아니라, 서울, 인천, 의정부 이렇게 찾을수 있으니...」
  - 「과외쌤은 시군구가 아니라, 광역시,시,군 이렇게 되네. 도는 제외야」
  - 「과외쌤은 어차피 프리미엄의 자리갯수가 제한되지 않아. 페이지넘버링이야」
- **20:18~20:26 (추가 세부 결정 원문)**:
  - 전남광주통합특별시: 옛 광주 5개 구(12210~12330)는 「광주」 하나의 과외 단위, 나머지(시 5·군 17)는 도처럼 시·군 각각.
  - 표시 이름: 정식 이름. 「서울특별시」「인천광역시」「세종특별자치시」(한 번만, 중복 제거), 도는 「경기도 광주시」「강원특별자치도 고성군」. (사용자 원문: 「경기도 광주시 ... 이렇게 나타내야 다 알수가 있지?」)
  - 동네 인사·새 이웃 환영 줄: 「지역을 카드와 같은 방식으로」 → 과외쌤은 카드와 같은 이름·같은 범위(예: 「서울특별시에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!」). 보는 사람과 같은 과외 단위 번호(`region_id`)일 때 노출.
  - 용어 유지: 「우리동네 공부방 / 우리동네 과외쌤 / 우리동네 학생」 용어는 그대로 유지.
  - 이관 후 빈 칸: 비워 둠, 재촉 안내 없음 (사용자 원문: 「모두 테스트 아이디이니, 그 지역은 선택으로 넣을 수 있음. 자연스럽게 그 칸은 비게 된다.」).
  - 메인 추천값 채택: GPS·카카오 위치의 과외 단위 자동 올림(강남구→서울특별시, 영통구→수원시, 광산구→광주), 학생 지도 확대는 단위 크기에 맞춤, 손님 카드에서도 「서울특별시」 그대로 노출, 유료 구독이 합쳐질 때는 `MAX(end_exclusive_on)` 단일화 채택.

### (2) 사용자 선택 3건
1. **광역시 관할 군 포함**: 광역시 안의 군(인천 강화·옹진, 부산 기장, 대구 달성·군위, 울산 울주)은 별도 분리하지 않고 해당 광역시에 포함한다.
2. **학생 과외 희망 지역 일치**: 학생의 「과외 희망 지역」(`students.preferred_tutor_region_id`)도 과외쌤 활동지역과 완전히 동일한 과외 단위를 사용한다.
3. **유료 노출 판매 단위 일치**: 과외쌤 유료 노출 Pick·Prime 판매 단위도 동일한 과외 단위 + 주력과목으로 운영하며, 매진 없이 페이지네이션으로 제공한다.

### (3) 정책 변천 내력 (커밋 기록)
- **2026-08-04 (`ca075c5`)**: 「과외지역은 광역시 단독·도→시 선택을 기본 단위로 한다」로 최초 정립.
- **2026-09-24 (`4660fd8`)**: 회원가입 개편 작업 중 「tutor sido→si/gun」으로 무심코 변경.
- **2026-10-01 (`67b9a63`)**: 공식 행정구역(072·073) 도입 시 「구(시·군) 단위 통일」로 고착.
- **2026-10-08 (20:10~20:26)**: 2026-08-04 정책(광역시 단독, 도는 시·군)으로 정식 복귀 및 정본 개정.
- **원인 분석**: 과외 단위 정책이 독자적인 정본 검토 없이 다른 기능 개발(가입·DB시드 개편)에 끼워져 변경되었던 것이 근본 원인임. 이번 개정을 통해 광역시 단독, 도→시·군 정책으로 복귀하고 정본으로 영구 고정한다.

### (4) 이전 사고 기록 (2026-10-08 18시 확인분 유지)
- 2026-08-04 도입 당시 `SidoRegionEnsure::ensure()`가 시마다 `dong_name='시 대표'` 가짜 동 행을 임시로 생성함.
- 2026-10-01 구(시·군) 통일(072·073)에서 공식 행 284개 추가 후 「정리는 다음 작업에서 한다」 주석만 남긴 채 이관 작업을 진행하지 않아 구 데이터와 신 데이터 간 불일치 발생.
- 운영 DB 영향: 과외쌤 3명 7건이 옛 행(대치동, 우동, 서울 시 대표, 의정부/남양주 시 대표)을 가리켜 홈 422 오류 유발.
- 교훈: 단위 변경 시 반드시 **정본 개정 → 코드 반영 → 전수 이관 SQL 실행**이 한 묶음으로 완료되어야 함.

---

## 2. 과외 단위 정의 (총 161개 단위)

과외쌤의 이동 수업 특성상, 대중교통망이 촘촘한 특별시·광역시는 도시 전체를 1개 단위로 보고, 도 지역은 생활권이 분리된 시·군을 1개 단위로 본다.

### (1) 단위 구분 상세 (16개 시도 행 기반 전수 분석)
`sql/schema/073_region_official_seed.sql`에는 과거 17개 시도 체계 중 광주(29)와 전남(46)이 통합되어 `12 전남광주통합특별시`로 등록되어 있어, **시도 행은 총 16개**다.
이 16개 시도 체계 하에서 과외 단위는 다음과 같이 **정확히 161개 단위**로 정의된다.

1. **특별시·광역시 (시도 코드 11, 26, 27, 28, 30, 31 총 6개)**:
   - 시도 행 1개 (`unit_level = 'sido'`, `official_code = 'XX00000000'`).
   - 하위 자치구 및 광역시 관할 군(인천 강화·옹진, 부산 기장, 대구 달성·군위, 울산 울주) 전체가 해당 광역시 1개 단위로 묶인다.
   - 단위 수: **6개**.
2. **세종특별자치시 (시도 코드 36)**:
   - 시도 행 1개 (`official_code = '3600000000'`).
   - 단위 수: **1개**.
3. **전남광주통합특별시 (시도 코드 12)**:
   - **옛 광주 5개 구 통합 단위**: 동구(12210), 서구(12240), 남구(12270), 북구(12300), 광산구(12330) 등 5개 자치구는 **「전남광주통합특별시 광주」 1개 과외 단위**로 통합한다. (1개 단위)
   - **나머지 시·군**: 도 지역과 동일하게 시·군 각각을 독립 단위로 취급한다.
     * 시 (5개): 목포시(12110), 여수시(12130), 순천시(12150), 나주시(12170), 광양시(12190)
     * 군 (17개): 담양군(12710), 곡성군(12720), 구례군(12730), 고흥군(12740), 보성군(12750), 화순군(12760), 장흥군(12770), 강진군(12780), 해남군(12790), 영암군(12800), 무안군(12810), 함평군(12820), 영광군(12830), 장성군(12840), 완도군(12850), 진도군(12860), 신안군(12870)
   - 단위 수: 1 (광주) + 5 (시) + 17 (군) = **23개**.
4. **8개 도 지역 (시도 코드 41 경기, 43 충북, 44 충남, 47 경북, 48 경남, 50 제주, 51 강원, 52 전북)**:
   - **상위 시 행 (일반구가 있는 13개 시)**:
     수원시(41110), 성남시(41130), 안양시(41170), 부천시(41190), 안산시(41270), 고양시(41280), 용인시(41460), 화성시(41590), 청주시(43110), 천안시(44130), 포항시(47110), 창원시(48120), 전주시(52110) 등 13개 시는 하위 일반구(39개)를 쓰지 않고 **073에 이미 존재하는 상위 시 행 1개(`official_code = 'XXYY000000'`, `is_selectable = 0`)를 과외 단위**로 사용한다. (13개 단위)
   - **일반 시·군 행 (일반구가 없는 118개 시·군)**:
     경기 23개, 충북 10개, 충남 14개, 경북 21개, 경남 17개, 제주 2개(제주시, 서귀포시), 강원 18개, 전북 13개 등 일반 시·군은 **073에 등록된 시·군 행 자체**를 과외 단위로 사용한다. (118개 단위)
   - **도 전체는 과외 단위가 될 수 없다.** (예: 경기도 전체를 1칸으로 등록 불가)
   - 단위 수: 13 (상위 시) + 118 (일반 시·군) = **131개**.

### (2) 총 과외 단위 수 및 073 전수 검증 결과
- **총 과외 단위 수**: 6 (특·광역시) + 1 (세종) + 23 (전남광주) + 131 (8개 도) = **정확히 161개 단위**.
- **073 전체 268개 시군구 행 전수 매핑 검증**:
  - `sql/schema/073_region_official_seed.sql` 내 268개 시군구(`unit_level = 'sigungu'`) 전체에 올림 알고리즘을 적용한 결과, **예외 발생 건수는 0건 (100% 매핑 정합)**.
  - 특이 케이스 검증:
    * 충북 증평군(`4374500000`), 충남 태안군(`4482500000`): 끝자리가 5이나 일반구가 아니므로 자기 자신(`4374500000`, `4482500000`)으로 정확히 유지됨.
    * 일반구 39개: 앞 4자리 + `000000` 상위 시 행으로 100% 정상 매핑됨.
    * 전남광주 5개 구: 광주 통합 단위로 100% 정상 매핑됨.

### (3) 전남광주통합특별시 「광주」 표현 방법 비교 및 결정
073에는 「광주」 전체를 나타내는 공식 행이 존재하지 않는다. 표현 방식을 다음과 같이 비교 분석한다.

| 비교 항목 | (가) SQL로 단위 행 1개 INSERT (채택) | (나) 코드 기반 가상 키 (불가) | (다) 5개 구 중 1개 임의 차용 (불가) |
| :--- | :--- | :--- | :--- |
| **원리** | `regions`에 광주 단위 행(`sido_code='12', sigungu_code='12200', sigungu_name='광주', unit_level='sigungu', official_code=NULL, is_selectable=0`) 1개 추가 | 음수 ID 등 가상 키를 코드에서 생성하여 반환 | 동구(`12210`) 등 특정 구를 광주 전체 대표로 사용 |
| **FK 무결성** | **완벽 보장** (`tutor_regions`, `students` 정상 저장) | **FK 위반 에러 발생** (`regions.id` 외래키 참조 실패) | 외래키 통과하나 의미 왜곡 |
| **공부방 격리** | **완벽 격리** (`is_selectable=0`이므로 공부방 노출 안 됨) | 공부방 격리는 되나 저장이 실패 | 공부방 선택기에 노출되어 혼선 유발 |
| **공식 코드 충돌** | **없음** (`official_code = NULL`로 안전 처리) | 없음 | 동구 공식 코드가 광주 전체로 오인 |

- **FK 확인 사실**:
  - `sql/schema/008_tutors.sql:78`: `CONSTRAINT fk_tr_region FOREIGN KEY (region_id) REFERENCES regions (id)`
  - `sql/schema/004_member_ssot_align.sql:105`: `CONSTRAINT fk_students_tutor_region FOREIGN KEY (preferred_tutor_region_id) REFERENCES regions (id)`
  - 실제 외래키가 선언되어 있어 가상 키 사용 시 MySQL 1452 에러가 발생함.
- **결정**: **(가) SQL로 `regions`에 단위 행 1개를 INSERT하는 방식을 필수로 채택**한다.
- **비공식 내부 번호 명시**:
  - `sigungu_code` '12200'은 **비공식 내부 번호**이며 공식 행정표준코드가 아님.
  - **073에 12200이 없음을 확인한 근거**: `073_region_official_seed.sql`에서 전남광주(12) 산하 코드는 시도 `12000`, 시 `12110~12190`, 자치구 5개 `12210~12330`, 군 17개 `12710~12870`이며, `12200`은 정의되지 않은 빈 번호임.
- **INSERT 문 및 스키마 제약조건 통과 확인**:
  - `001_init.sql`의 원래 스키마: `dong_code`가 NOT NULL이었고 `uk_regions_dong_code` UNIQUE 제약이 있었음.
  - `072_region_unit_level.sql`의 변경 스키마:
    * `dong_code`: `ALTER TABLE regions MODIFY dong_code VARCHAR(10) NULL COMMENT '동 코드. 공식 시·구 행은 NULL'`로 수정되어 **NULL 허용**.
    * `official_code`: `official_code VARCHAR(10) NULL`, `UNIQUE KEY uk_regions_official_code (official_code)` 추가. MySQL UNIQUE 인덱스는 NULL 값의 복수 저장을 허용하므로 **`official_code = NULL`**로 안전함.
    * `unit_level`: `ENUM('sido','sigungu','dong') NOT NULL DEFAULT 'dong'`. 과외 단위 광주 행은 `'sigungu'`.
    * `is_selectable`: `TINYINT(1) NOT NULL DEFAULT 0`. 공부방에 영향 없도록 `0`.
  - **중복 실행에 안전한 멱등 INSERT 문**:
    ```sql
    INSERT INTO regions (
      sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name,
      unit_level, official_code, is_selectable, is_active
    )
    SELECT '12', '전남광주통합특별시', '12200', '광주', NULL, '',
           'sigungu', NULL, 0, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM regions WHERE sido_code = '12' AND sigungu_code = '12200'
    );
    ```
- **코드 단계 주의**:
  - 저장소 내에서 `RegionGuLink.php`(102행), `BasicCardRegisteredQuery.php`(259행) 등이 `LEFT(sigungu_code, 5) = LEFT(official_code, 5)` 패턴으로 구-동을 연결한다(공부방 전용).
  - 과외 단위 광주 행은 `official_code`가 `NULL`이므로, **코드에서 `official_code`를 기준으로 시도/시군구를 파싱하거나 자르면 안 되며, 반드시 `sido_code`('12') 및 `sigungu_code`('12200') 컬럼을 직접 읽어야 한다.**

### (4) 「한눈에 보는 규칙」 표 (실제 주소 → 과외 단위 → 정식 표시 이름)

| 순번 | 실제 주소 예시 | 073 원본 코드 및 행 | 과외 단위 (행 유형 / 코드) | 정식 표시 이름 | 비고 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | 서울특별시 강남구 역삼동 | 1168000000 강남구 | sido (1100000000) | **서울특별시** | 특별시 1개 단위 |
| 2 | 인천광역시 강화군 강화읍 | 2871000000 강화군 | sido (2800000000) | **인천광역시** | 광역시 관할 군 포함 |
| 3 | 부산광역시 기장군 기장읍 | 2671000000 기장군 | sido (2600000000) | **부산광역시** | 광역시 관할 군 포함 |
| 4 | 세종특별자치시 어진동 | 3600000000 세종특별자치시 | sido (3600000000) | **세종특별자치시** | 시도 행 1개 단위 |
| 5 | 경기도 수원시 장안구 정자동 | 4111100000 수원시 장안구 | sigungu (4111000000 수원시) | **경기도 수원시** | 일반구 → 상위 시 올림 |
| 6 | 경기도 의정부시 의정부동 | 4115000000 의정부시 | sigungu (4115000000 의정부시) | **경기도 의정부시** | 일반 시 자체 단위 |
| 7 | 경기도 광주시 경안동 | 4161000000 광주시 | sigungu (4161000000 광주시) | **경기도 광주시** | 전남광주와 동음이의 구분 |
| 8 | 전남광주 광산구 수완동 | 1233000000 광산구 | sigungu (12200 광주 신규 행) | **전남광주통합특별시 광주** | 옛 5개 구 통합 단위 |
| 9 | 전남광주 목포시 용당동 | 1211000000 목포시 | sigungu (1211000000 목포시) | **전남광주통합특별시 목포시** | 도처럼 시·군 독립 단위 |
| 10 | 강원특별자치도 고성군 간성읍 | 5182000000 고성군 | sigungu (5182000000 고성군) | **강원특별자치도 고성군** | 경남 고성과 동음이의 구분 |
| 11 | 경상남도 고성군 고성읍 | 4882000000 고성군 | sigungu (4882000000 고성군) | **경상남도 고성군** | 강원 고성과 동음이의 구분 |
| 12 | 제주특별자치도 서귀포시 서귀동 | 5013000000 서귀포시 | sigungu (5013000000 서귀포시) | **제주특별자치도 서귀포시** | 일반 시 자체 단위 |
| 13 | 충청북도 청주시 상당구 북문로 | 4311100000 청주시 상당구 | sigungu (4311000000 청주시) | **충청북도 청주시** | 일반구 → 상위 시 올림 |

---

## 3. 공부방과 분리 (핵심 레드라인)

### (1) `regions.is_selectable` 변경 절대 금지 (레드라인 1)
- `regions.is_selectable` 컬럼은 공부방 찾기의 구 전체 검색(`SearchService` `sigungu_region_id` -> `RegionGuLink::dongIdsUnderGu`를 통해 하위 동을 펼쳐 찾는 기능) 및 행정구역 필터링에서 광범위하게 사용되고 있다.
- 따라서 **`regions.is_selectable` 값을 과외 정책에 맞춰 변경하는 것을 엄격히 금지**한다.

### (2) 과외 단위 판정 분리 및 판정 방식 비교
과외 단위 여부는 `regions.is_selectable` 대신 별도 로직으로 판정해야 한다.

| 비교 항목 | (가) 코드 기반 규칙 계산 (`TutorRegionUnit`) (강력 추천) | (나) DB 컬럼 추가 (`regions.tutor_unit` TINYINT) |
| :--- | :--- | :--- |
| **원리** | PHP `TutorRegionUnit` 클래스 및 JS `tutor-region-unit.js`에서 행의 `sido_code`, `sigungu_code`, `unit_level`, `official_code`를 기반으로 과외 단위 여부 계산 | `regions` 테이블에 `ALTER TABLE`로 컬럼을 추가하고, 161개 단위 행에 `1`, 나머지 행에 `0`을 UPDATE |
| **운영 DDL** | **없음 (무중단 배포 가능, 배포 전 사용자 DB 작업 불필요)** | **필수 (`ALTER TABLE`, 배포 전 사용자 수동 작업 요구)** |
| **공부방 격리** | `is_selectable`과 코드 수준에서 물리적/개념적으로 완벽 분리 | DB 한 테이블에 두 개의 selectable 플래그가 공존하여 쿼리 혼선 유발 |
| **유지보수성** | 규칙 변경 시 코드 SSOT 모듈 1곳만 수정하면 즉시 전역 반영 | 행정구역 시드 재배포 시마다 UPDATE 쿼리 동반 필요 |

- **추천 및 근거**: **(가) 코드 기반 규칙 계산 방식을 강력 추천한다.**
  운영 DB에 불필요한 DDL 추가 없이 안전하게 배포할 수 있으며, `regions.is_selectable`은 공부방 전용으로 영구 동결하고 과외 단위는 `TutorRegionUnit` 클래스 1곳에 SSOT로 캡슐화하여 사이드이펙트를 원천 차단한다. (단, 전남광주 광주 통합 단위는 FK 무결성을 위해 `regions`에 1개 행 INSERT를 수반함)

---

## 4. 적용 범위 (전체 시스템)

과외 단위(161개)는 다음의 모든 과외/학생 관련 기능에 일관되게 적용된다.

1. **과외쌤 활동지역 3칸 (`tutor_regions.region_id`)**:
   - 1번(대표) 및 2, 3번 슬롯 모두 161개 과외 단위 행의 id만 저장 가능.
2. **학생 과외 희망지역 (`students.preferred_tutor_region_id`)**:
   - 학생의 과외 희망지역 1칸도 동일한 161개 과외 단위 행의 id만 저장 가능.
3. **과외쌤 유료 노출 판매 축 (`provider_position_subscriptions.city_id`)**:
   - `TutorPositionAxis`의 `city_id`는 161개 과외 단위의 `regions.id`와 1:1 일치.
4. **검색 및 피드**:
   - `SearchService`: tutor 검색의 `tutor_region_id` 및 student 검색의 `preferred_region_id` 조건이 과외 단위를 기준으로 필터링.
   - 손님 기준 축: 공부방 축은 기존 서울 강남구 대치동을 유지하고, 과외쌤/학생 축은 **`1100000000` 서울특별시**로 일원화. 손님 카드에서도 「서울특별시」가 정상 노출되어 「—」 결손 해소.
   - GPS/카카오 주소 자동 올림: 게스트나 회원이 주소를 선택했을 때 과외 탭에서는 과외 단위(강남구→서울특별시, 영통구→수원시, 광산구→광주)로 자동 올림 매핑.
   - 학생 지도 확대: 과외 탭 지도 줌 레벨을 과외 단위 면적(광역/시·군)에 맞추어 적절하게 조정.
5. **과외쌤 홈 화면**:
   - 「과외지역 분포」 차트: 과외 단위별 분포 집계.
   - 「우리동네 학생」 탭: 대표 슬롯의 과외 단위에 속한 학생 수요를 정상 로드 (422 오류 제거).
6. **회원가입 및 마이페이지 지역 선택기**:
   - 특별시·광역시·세종은 1단계(시도) 선택 즉시 선택 완료.
   - 도 지역(경기, 충북 등) 및 전남광주통합특별시만 2단계(시·군) 드롭다운을 제공.

---

## 5. 과외 유료 노출 정책

### (1) 노출 축 정의 (SSOT)
- `TutorPositionAxis` 키 = **과외 단위 (`city_id`) + 주력과목 (`primary_subject_id`)**.
- `provider_position_subscriptions` 테이블의 `city_id` 컬럼에 과외 단위 `regions.id`를 저장한다.

### (2) 재고 및 매진 정책
- 과외쌤 Pick·Prime 상품은 **재고 제한이 없으며, 매진 상태가 발생하지 않는다.**
- 신청자가 많을 경우 화면에서 페이지네이션(Page Numbering)으로 넘겨가며 전원 노출한다.

### (3) 동일 등급 내 정렬 원칙
- 동일 등급(Prime 내부, Pick 내부) 내의 정렬 순서는 **현재 코드의 실제 정렬(`t.created_at DESC` 등 등록 최신순 / 정렬 탭 선택 기준)을 그대로 유지**한다.

### (4) 단위 통합 시 기존 다중 구 유료 구독 처리 원칙
- **원칙**: 동일 튜터가 동일 주력과목으로 같은 광역시 내 여러 구에 구독을 보유하고 있던 경우, 단위가 통합될 때 **`MAX(end_exclusive_on)`(가장 늦은 만료일) 단일화**를 적용한다.
- **스키마 분석**: `provider_position_subscriptions` 테이블의 인덱스는 비고유 인덱스(`KEY idx_position_tutor_axis`)로 정의되어 있어 UNIQUE 충돌이 발생하지 않는다. 따라서 **`승격 UPDATE → 중복 단일화(MAX 연장 및 비활성화)`** 순서로 안전하게 실행된다.
- **이력 보존 정책**: 유료 결제/티켓 이력 보존을 위해 `DELETE` 대신 활성 만료일 당일 처리(`end_exclusive_on = CURDATE(), ends_at = NOW()`)로 비활성화한다. 대표 레코드 1건(가장 작은 id)에 `MAX(end_exclusive_on)` 및 `MAX(ends_at)`을 부여하여 기간을 합산/연장하고, 나머지 중복 레코드는 당일 만료로 비활성화하여 결제 이력을 안전하게 유지한다 (제9장 3-1, 3-2 참조).

---

## 6. 공부방 불변 (레드라인 2)

- 공부방의 모든 정책과 기능은 일체 변경하지 않는다.
  1. 공부방 지역 단위: 법정동(`regions.dong_name`) 및 아파트 단지(`RegionEnsure::fromKakao`).
  2. 공부방 유료 노출: Prime 정원 3석 고정 및 매진 정책 유지 (`PrimeRegionScope`).
  3. 공부방 상세 페이지: `ShopPage` 게이트 및 4대 레드라인 엄격 유지 (`docs/internal/54-shop-page-lock.md`).
  4. 지도 마커 및 게스트 기준: 공부방은 서울 강남구 대치동 기준 유지.

---

## 7. 동네 인사 및 새 이웃 환영 줄 연동

### (1) 환영 줄 문구 및 노출 범위 일원화
- 과외쌤 환영 줄은 **과외 카드와 동일한 이름과 동일한 범위**를 갖는다.
  - 환영 문구 형식: **`「{정식지역명}에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!」`**
  - 예시: `「서울특별시에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!」`, `「경기도 수원시에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!」`
- 특별시·광역시 과외쌤은 시도 행 저장 시 `r.sigungu_name`이 비어 있으므로, `NeighborhoodGreetingService` 쿼리에서 `r.sigungu_name <> ''` 조건을 제거하고 시도/시군구를 포괄하는 `region_label` 표현식을 사용한다.

### (2) 노출 비교 방식 (정본 71과의 정합성)
- 기존의 단순 텍스트 부분 포함(`sameNeighborhood`의 `includes`) 방식을 폐지하고, **과외 단위 번호(`region_id`) 완전 일치 비교**로 전환한다.
- **정본 71과의 관계**: 정본 71(`docs/internal/71-neighborhood-welcome-lock.md`)의 기본 노출 정책(최대 3건, 최신 등록 우선, 만료 7일 등)은 그대로 유지하되, 과외쌤의 동네 일치 판정 조건이 "동/읍/면 또는 sigungu_name 텍스트 부분 일치"에서 **"과외 단위 ID 일치"**로 명확화/정교화된다. 공부방 인사는 기존의 동(dong) 기준을 그대로 유지한다.

---

## 8. 화면 문구 정책 및 이관 후 데이터 처리

### (1) 2단계 선택기 UI 가이드
- **1단계 (시·도)**: 특별시·광역시·세종을 선택하면 즉시 1단계로 선택이 완료됨.
- **2단계 (시·군)**: 도 지역(경기, 충북 등) 또는 전남광주통합특별시를 선택한 경우에만 2단계 시·군 선택 드롭다운이 노출됨.

### (2) 표준 안내 문구
- 유효한 과외 단위가 아닌 옛 데이터가 남아있는 슬롯에 표시하는 표준 안내 문구:
  **`「과외지역을 다시 선택해 주세요 (광역시 또는 시·군)」`**

### (3) 이관 후 빈 칸 처리 정책
- 사용자 지시 확정: 기존 비단위 슬롯이 정리된 후 남는 빈 칸은 **비워 두며, 작성을 재촉하는 별도 경고 안내는 표시하지 않는다.** (사용자 원문: "모두 테스트 아이디이니, 그 지역은 선택으로 넣을 수 있음. 자연스럽게 그 칸은 비게 된다.")

### (4) 현재 브랜치의 「구(시·군)까지」 문구 변경 대상 목록
1. `src/Region/SidoRegionEnsure.php:61`: `'과외지역은 목록에서 구(시·군)까지 선택해 주세요.'` → `'과외지역은 목록에서 광역시 또는 시·군을 선택해 주세요.'`
2. `src/Search/SearchService.php:71`: `SELECTABLE_REGION_MESSAGE = '지역은 구(시·군)까지 선택해 주세요.';` → `'지역은 광역시 또는 시·군을 선택해 주세요.';`
3. `preview/home-ui/src/tutor-activity-chart.js:144`: `'활동지역을 구(시·군)까지 다시 선택해 주세요'` → `'과외지역을 다시 선택해 주세요 (광역시 또는 시·군)'`
4. `preview/home-ui/src/student-reg/student-reg-copy.js:72`: `reselect: '활동지역을 구(시·군)까지 다시 선택해 주세요'` → `'과외지역을 다시 선택해 주세요 (광역시 또는 시·군)'`
5. `preview/auth-ui/src/screens/signup-basic.js:188, 303`: `'구(시·군)'` 선택 안내 문구 정정.
6. `preview/home-ui/src/tutor-reg/screens.js:369, 388`: 문구 정정.
7. `preview/shared/tutor-region-slots.js:35`: 문구 정정.
8. `preview/search-ui/src/search-find-surface.js:541 GU_PICK_HINT`: 과외 탭 분기 정정 (공부방 탭은 유지).
9. `scripts/verify-room-promo-region-match.php:476`, `scripts/verify-hold-find-address.mjs:540`: 오류 메시지 검증 정정.

---

## 9. 사용자 이관 SQL (MySQL 8 — 운영 phpMyAdmin 실행용)

ID 하드코딩을 배제하고, `sido_code`, `sigungu_code`, `official_code`를 기준으로 동적 매핑하는 안전한 4단계 이관 쿼리다.

```sql
-- =============================================================================
-- 과외 단위 광역시·시·군 전환 이관 SQL (MySQL 8)
-- SSOT: docs/internal/72-region-unit-lock.md
-- =============================================================================

USE study114;

-- -----------------------------------------------------------------------------
-- [0단계: 전남광주통합특별시 광주 통합 단위 행 INSERT]
-- -----------------------------------------------------------------------------
INSERT INTO regions (
  sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name,
  unit_level, official_code, is_selectable, is_active
)
SELECT '12', '전남광주통합특별시', '12200', '광주', NULL, '',
       'sigungu', NULL, 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM regions WHERE sido_code = '12' AND sigungu_code = '12200'
);

-- -----------------------------------------------------------------------------
-- [1단계: 사전 점검 SELECT]
-- -----------------------------------------------------------------------------
-- (A) tutor_regions 중 과외 단위가 아닌 행 점검
SELECT tr.id, tr.tutor_id, tr.priority_order, tr.is_primary, r.id AS current_region_id,
       r.sido_name, r.sigungu_name, r.dong_name, r.unit_level, r.official_code
FROM tutor_regions tr
JOIN regions r ON r.id = tr.region_id
WHERE NOT (
  -- 특·광역시·세종 시도 행
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','30','31','36'))
  -- 전남광주 광주 통합 행
  OR (r.sido_code = '12' AND r.sigungu_code = '12200')
  -- 전남광주 시·군 행
  OR (r.sido_code = '12' AND r.unit_level = 'sigungu' AND r.sigungu_code NOT IN ('12200','12210','12240','12270','12300','12330'))
  -- 도 상위 시 행 (073에 unit_level='sigungu', is_selectable=0으로 정의된 13개 시)
  OR (r.unit_level = 'sigungu' AND r.official_code IN (
      '4111000000','4113000000','4117000000','4119000000','4127000000',
      '4128000000','4146000000','4159000000','4311000000','4413000000',
      '4711000000','4812000000','5211000000'
  ))
  -- 도 일반 시·군 행 (일반구가 없는 시·군)
  OR (r.unit_level = 'sigungu' AND r.sido_code IN ('41','43','44','47','48','50','51','52')
      AND r.is_selectable = 1 AND r.sigungu_name NOT LIKE '% %')
);

-- (B) students 중 preferred_tutor_region_id가 과외 단위가 아닌 행 점검
SELECT s.id, s.user_id, s.preferred_tutor_region_id,
       r.sido_name, r.sigungu_name, r.dong_name, r.unit_level, r.official_code
FROM students s
JOIN regions r ON r.id = s.preferred_tutor_region_id
WHERE NOT (
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','30','31','36'))
  OR (r.sido_code = '12' AND r.sigungu_code = '12200')
  OR (r.sido_code = '12' AND r.unit_level = 'sigungu' AND r.sigungu_code NOT IN ('12200','12210','12240','12270','12300','12330'))
  OR (r.unit_level = 'sigungu' AND r.official_code IN (
      '4111000000','4113000000','4117000000','4119000000','4127000000',
      '4128000000','4146000000','4159000000','4311000000','4413000000',
      '4711000000','4812000000','5211000000'
  ))
  OR (r.unit_level = 'sigungu' AND r.sido_code IN ('41','43','44','47','48','50','51','52')
      AND r.is_selectable = 1 AND r.sigungu_name NOT LIKE '% %')
);

-- (C) provider_position_subscriptions 중 city_id가 과외 단위가 아닌 행 점검
SELECT pps.id, pps.provider_id, pps.sku_code, pps.city_id, pps.end_exclusive_on,
       r.sido_name, r.sigungu_name, r.dong_name, r.unit_level, r.official_code
FROM provider_position_subscriptions pps
JOIN regions r ON r.id = pps.city_id
WHERE pps.provider_type = 'tutor'
  AND NOT (
    (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','30','31','36'))
    OR (r.sido_code = '12' AND r.sigungu_code = '12200')
    OR (r.sido_code = '12' AND r.unit_level = 'sigungu' AND r.sigungu_code NOT IN ('12200','12210','12240','12270','12300','12330'))
    OR (r.unit_level = 'sigungu' AND r.official_code IN (
        '4111000000','4113000000','4117000000','4119000000','4127000000',
        '4128000000','4146000000','4159000000','4311000000','4413000000',
        '4711000000','4812000000','5211000000'
    ))
    OR (r.unit_level = 'sigungu' AND r.sido_code IN ('41','43','44','47','48','50','51','52')
        AND r.is_selectable = 1 AND r.sigungu_name NOT LIKE '% %')
  );

-- (D) 유료 구독 중복 발생 후보 점검 (같은 튜터, 같은 SKU, 같은 주력과목, 승격 후 같은 과외 단위가 될 활성 구독)
SELECT pps.provider_id, pps.sku_code, pps.primary_subject_id, COUNT(*) AS dup_cnt,
       MIN(pps.end_exclusive_on) AS min_end_date, MAX(pps.end_exclusive_on) AS max_end_date
FROM provider_position_subscriptions pps
JOIN regions r ON r.id = pps.city_id
WHERE pps.provider_type = 'tutor'
  AND pps.end_exclusive_on > CURDATE()
GROUP BY pps.provider_id, pps.sku_code, pps.primary_subject_id,
         CASE
           WHEN r.sido_code IN ('11','26','27','28','30','31') THEN r.sido_code
           WHEN r.sido_code = '12' AND r.sigungu_code IN ('12200','12210','12240','12270','12300','12330') THEN '12_gwangju'
           WHEN r.sido_code IN ('41','43','44','47','48','52') AND r.sigungu_name LIKE '% %' THEN CONCAT(SUBSTRING(r.official_code, 1, 4), '000000')
           ELSE r.official_code
         END
HAVING COUNT(*) > 1;

-- -----------------------------------------------------------------------------
-- [2단계: 이관 UPDATE (동적 매핑)]
-- -----------------------------------------------------------------------------

-- 2-1. 특·광역시 산하 구/군 및 옛 시대표 행 → 특·광역시 시도 행으로 승격
UPDATE tutor_regions tr
JOIN regions curr ON curr.id = tr.region_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET tr.region_id = target.id
WHERE curr.sido_code IN ('11','26','27','28','30','31')
  AND curr.unit_level <> 'sido';

-- 2-2. 전남광주 옛 5개 구(12210~12330) → 광주 통합 단위 행(12200)으로 승격
UPDATE tutor_regions tr
JOIN regions curr ON curr.id = tr.region_id
JOIN regions target ON target.sido_code = '12' AND target.sigungu_code = '12200'
SET tr.region_id = target.id
WHERE curr.sido_code = '12' AND curr.sigungu_code IN ('12210','12240','12270','12300','12330');

-- 2-3. 도 일반구(39개) → 도 상위 시 행으로 승격
UPDATE tutor_regions tr
JOIN regions curr ON curr.id = tr.region_id
JOIN regions target ON target.official_code = CONCAT(SUBSTRING(curr.official_code, 1, 4), '000000')
                    AND target.unit_level = 'sigungu'
SET tr.region_id = target.id
WHERE curr.sido_code IN ('41','43','44','47','48','52')
  AND curr.sigungu_name LIKE '% %';

-- 2-4. 과거 dev 시드 행(id 1 대치동, id 2 우동) 및 기타 레거시 동 행 매핑
UPDATE tutor_regions tr
JOIN regions curr ON curr.id = tr.region_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET tr.region_id = target.id
WHERE curr.dong_name IN ('대치동', '우동', '시 대표')
  AND curr.sido_code IN ('11','26');

-- 2-5a. 학생 희망지역(students.preferred_tutor_region_id) 특·광역시 승격
UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET s.preferred_tutor_region_id = target.id
WHERE curr.sido_code IN ('11','26','27','28','30','31') AND curr.unit_level <> 'sido';

-- 2-5b. 학생 희망지역(students.preferred_tutor_region_id) 전남광주 광주 승격
UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = '12' AND target.sigungu_code = '12200'
SET s.preferred_tutor_region_id = target.id
WHERE curr.sido_code = '12' AND curr.sigungu_code IN ('12210','12240','12270','12300','12330');

-- 2-5c. 학생 희망지역(students.preferred_tutor_region_id) 도 일반구 승격
UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.official_code = CONCAT(SUBSTRING(curr.official_code, 1, 4), '000000')
                    AND target.unit_level = 'sigungu'
SET s.preferred_tutor_region_id = target.id
WHERE curr.sido_code IN ('41','43','44','47','48','52') AND curr.sigungu_name LIKE '% %';

-- 2-5d. 학생 희망지역 과거 dev 시드 행 매핑
UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET s.preferred_tutor_region_id = target.id
WHERE curr.dong_name IN ('대치동', '우동', '시 대표') AND curr.sido_code IN ('11','26');

-- 2-6a. 유료 노출 축(provider_position_subscriptions.city_id) 특·광역시 승격
UPDATE provider_position_subscriptions pps
JOIN regions curr ON curr.id = pps.city_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND curr.sido_code IN ('11','26','27','28','30','31') AND curr.unit_level <> 'sido';

-- 2-6b. 유료 노출 축(provider_position_subscriptions.city_id) 전남광주 광주 승격
UPDATE provider_position_subscriptions pps
JOIN regions curr ON curr.id = pps.city_id
JOIN regions target ON target.sido_code = '12' AND target.sigungu_code = '12200'
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND curr.sido_code = '12' AND curr.sigungu_code IN ('12210','12240','12270','12300','12330');

-- 2-6c. 유료 노출 축(provider_position_subscriptions.city_id) 도 일반구 승격
UPDATE provider_position_subscriptions pps
JOIN regions curr ON curr.id = pps.city_id
JOIN regions target ON target.official_code = CONCAT(SUBSTRING(curr.official_code, 1, 4), '000000')
                    AND target.unit_level = 'sigungu'
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND curr.sido_code IN ('41','43','44','47','48','52') AND curr.sigungu_name LIKE '% %';

-- 2-6d. 유료 노출 축 과거 dev 시드 행 매핑
UPDATE provider_position_subscriptions pps
JOIN regions curr ON curr.id = pps.city_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND curr.dong_name IN ('대치동', '우동', '시 대표') AND curr.sido_code IN ('11','26');

-- -----------------------------------------------------------------------------
-- [3단계: 중복 정리 및 순서 재부여 (MySQL 8 윈도우 함수/CTE)]
-- -----------------------------------------------------------------------------

-- 3-1. 유료 구독 중복 단일화: 대표 레코드(최초 id)의 만료일을 그룹 내 MAX(end_exclusive_on)으로 연장
UPDATE provider_position_subscriptions pps
JOIN (
  SELECT id,
         MAX(end_exclusive_on) OVER (
           PARTITION BY provider_id, sku_code, city_id, primary_subject_id
         ) AS max_end_date,
         MAX(ends_at) OVER (
           PARTITION BY provider_id, sku_code, city_id, primary_subject_id
         ) AS max_ends_at,
         ROW_NUMBER() OVER (
           PARTITION BY provider_id, sku_code, city_id, primary_subject_id
           ORDER BY id ASC
         ) AS rn,
         COUNT(*) OVER (
           PARTITION BY provider_id, sku_code, city_id, primary_subject_id
         ) AS group_cnt
  FROM provider_position_subscriptions
  WHERE provider_type = 'tutor'
    AND end_exclusive_on > CURDATE()
) agg ON agg.id = pps.id
SET pps.end_exclusive_on = agg.max_end_date,
    pps.ends_at = agg.max_ends_at
WHERE agg.rn = 1 AND agg.group_cnt > 1;

-- 3-2. 유료 구독 중복 비활성화: 대표 레코드를 제외한 나머지 중복 건 즉시 비활성화 (결제 이력 보존)
UPDATE provider_position_subscriptions pps
JOIN (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY provider_id, sku_code, city_id, primary_subject_id
           ORDER BY id ASC
         ) AS rn
  FROM provider_position_subscriptions
  WHERE provider_type = 'tutor'
    AND end_exclusive_on > CURDATE()
) dup ON dup.id = pps.id
SET pps.end_exclusive_on = CURDATE(),
    pps.ends_at = NOW()
WHERE dup.rn > 1;

-- 3-3. 과외 슬롯 중복 삭제: 같은 tutor_id 내 같은 region_id 중복 시 is_primary 우선, priority_order 작은 1개 보존
DELETE tr FROM tutor_regions tr
JOIN (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY tutor_id, region_id
           ORDER BY is_primary DESC, priority_order ASC, id ASC
         ) AS rn
  FROM tutor_regions
) dup ON dup.id = tr.id
WHERE dup.rn > 1;

-- 3-4. 남은 과외 슬롯의 priority_order를 0, 1, 2로 순차 재정렬
UPDATE tutor_regions tr
JOIN (
  SELECT id,
         (ROW_NUMBER() OVER (
           PARTITION BY tutor_id
           ORDER BY priority_order ASC, id ASC
         ) - 1) AS new_order
  FROM tutor_regions
) reorder ON reorder.id = tr.id
SET tr.priority_order = reorder.new_order;

-- -----------------------------------------------------------------------------
-- [4단계: 사후 점검 SELECT]
-- -----------------------------------------------------------------------------
-- 4-1. tutor_regions 중 비단위 행 잔여 검증 (0건이어야 함)
SELECT COUNT(*) AS invalid_slot_count
FROM tutor_regions tr
JOIN regions r ON r.id = tr.region_id
WHERE NOT (
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','30','31','36'))
  OR (r.sido_code = '12' AND r.sigungu_code = '12200')
  OR (r.sido_code = '12' AND r.unit_level = 'sigungu' AND r.sigungu_code NOT IN ('12200','12210','12240','12270','12300','12330'))
  OR (r.unit_level = 'sigungu' AND r.official_code IN (
      '4111000000','4113000000','4117000000','4119000000','4127000000',
      '4128000000','4146000000','4159000000','4311000000','4413000000',
      '4711000000','4812000000','5211000000'
  ))
  OR (r.unit_level = 'sigungu' AND r.sido_code IN ('41','43','44','47','48','50','51','52')
      AND r.is_selectable = 1 AND r.sigungu_name NOT LIKE '% %')
);

-- 4-2. students 중 비단위 희망지역 잔여 검증 (0건이어야 함)
SELECT COUNT(*) AS invalid_student_region_count
FROM students s
JOIN regions r ON r.id = s.preferred_tutor_region_id
WHERE NOT (
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','30','31','36'))
  OR (r.sido_code = '12' AND r.sigungu_code = '12200')
  OR (r.sido_code = '12' AND r.unit_level = 'sigungu' AND r.sigungu_code NOT IN ('12200','12210','12240','12270','12300','12330'))
  OR (r.unit_level = 'sigungu' AND r.official_code IN (
      '4111000000','4113000000','4117000000','4119000000','4127000000',
      '4128000000','4146000000','4159000000','4311000000','4413000000',
      '4711000000','4812000000','5211000000'
  ))
  OR (r.unit_level = 'sigungu' AND r.sido_code IN ('41','43','44','47','48','50','51','52')
      AND r.is_selectable = 1 AND r.sigungu_name NOT LIKE '% %')
);

-- 4-3. provider_position_subscriptions 중 비단위 city_id 잔여 검증 (0건이어야 함)
SELECT COUNT(*) AS invalid_paid_axis_count
FROM provider_position_subscriptions pps
JOIN regions r ON r.id = pps.city_id
WHERE pps.provider_type = 'tutor'
  AND NOT (
    (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','30','31','36'))
    OR (r.sido_code = '12' AND r.sigungu_code = '12200')
    OR (r.sido_code = '12' AND r.unit_level = 'sigungu' AND r.sigungu_code NOT IN ('12200','12210','12240','12270','12300','12330'))
    OR (r.unit_level = 'sigungu' AND r.official_code IN (
        '4111000000','4113000000','4117000000','4119000000','4127000000',
        '4128000000','4146000000','4159000000','4311000000','4413000000',
        '4711000000','4812000000','5211000000'
    ))
    OR (r.unit_level = 'sigungu' AND r.sido_code IN ('41','43','44','47','48','50','51','52')
        AND r.is_selectable = 1 AND r.sigungu_name NOT LIKE '% %')
  );

-- 4-4. tutor_regions 중 동일 튜터 동일 단위 중복 슬롯 검증 (0건이어야 함)
SELECT COUNT(*) AS duplicate_slot_count
FROM (
  SELECT tutor_id, region_id, COUNT(*) AS cnt
  FROM tutor_regions
  GROUP BY tutor_id, region_id
  HAVING COUNT(*) > 1
) d;

-- 4-5. provider_position_subscriptions 중 동일 축 활성 중복 구독 검증 (0건이어야 함)
SELECT COUNT(*) AS duplicate_active_subscription_count
FROM (
  SELECT provider_id, sku_code, city_id, primary_subject_id, COUNT(*) AS cnt
  FROM provider_position_subscriptions
  WHERE provider_type = 'tutor'
    AND end_exclusive_on > CURDATE()
  GROUP BY provider_id, sku_code, city_id, primary_subject_id
  HAVING COUNT(*) > 1
) d;
```

---

## 10. 확정 배포 순서 및 중간 상태 대응

### (1) 배포 4단계 순서
1. **1단계 (사용자): 광주 행 INSERT 실행**:
   - `0단계 SQL` 실행하여 `regions`에 `12200 광주` 행 추가.
   - `is_selectable = 0`이므로 기존 공부방·과외 화면에 아무런 영향을 주지 않음.
2. **2단계 (개발/CI): 코드 배포**:
   - GitHub Actions를 통해 신규 코드(판정, 캐스케이드, 검색) 배포.
   - 신규 코드는 옛 비단위 데이터를 만나도 500 에러를 내지 않고 안내 문구(다시 선택)로 안전하게 격리 처리함.
3. **3단계 (사용자): 직후 이관 SQL 실행**:
   - 운영 DB(phpMyAdmin)에서 `2단계(이관 UPDATE)` 및 `3단계(중복 제거)` 실행.
4. **4단계 (사용자/공통): 사후 점검 및 화면 확인**:
   - `4단계 SQL` 실행하여 `invalid_slot_count = 0` 확인.
   - 실제 운영 사이트에서 과외쌤 마이페이지, 과외 홈, 검색 탭 정상 노출 확인.

### (2) 각 단계 사이 중간 상태 화면 동작표

| 단계 사이 | 상태 요약 | 과외쌤 마이페이지 (지역 수정) | 과외쌤 홈 (우리동네 학생) | 과외 검색 탭 | 게스트 화면 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **(1) 직후<br>(INSERT 완료, 코드 배포 전)** | DB에 `12200 광주` 행만 추가됨.<br>기존 코드 계속 동작 중. | 기존과 100% 동일하게 동작. | 기존 422 오류(옛 데이터인 경우) 또는 기존 상태 유지. | 기존과 100% 동일하게 동작. | 기존과 동일 (서울 강남구 기준). |
| **(2) 직후<br>(코드 배포 완료, 이관 SQL 전)** | 신규 코드가 배포되었으나<br>DB에는 아직 옛 데이터(구/동) 잔존. | 옛 슬롯에 **`「과외지역을 다시 선택해 주세요 (광역시 또는 시·군)」`** 안내 표시 (500 오류 없음). | 옛 데이터 슬롯은 searchApi 호출 스킵(422 발생 방지), 안내 문구 및 마이페이지 링크 표시. | 과외 탭은 과외 단위 기준으로 필터링, 게스트 기준은 서울특별시로 전환. 미이관 튜터는 일시 미노출. | 과외/학생 축 게스트 카드에 '서울특별시' 정상 표시, '—' 결손 해소. |
| **(3) 직후<br>(이관 SQL 완료, 점검 전)** | DB 데이터가 모두 공식 161개 과외 단위로 승격 및 중복 제거 완료됨. | 모든 슬롯이 정식 과외 단위(예: '서울특별시', '경기도 수원시')로 정상 표시, 경고 배지 자동 해제. | 대표 슬롯이 정상 과외 단위이므로 학생 수요 목록이 422 없이 즉시 정상 로드. | 이관된 튜터/학생이 통합된 광역 단위 검색에서 전원 정상 노출. | 전원 정상 노출. |
| **(4) 직후<br>(사후 점검 SELECT 완료)** | 점검 쿼리 `COUNT=0` 확인. | 정상. | 정상. | 정상. | 정상. |

---

## 11. 자동 검사 갱신 계획 (`scripts/verify-region-unit-lock.mjs`)

다음 코드 단계에서 검사 스크립트를 다음과 같이 전면 개편한다.

1. **과외 단위 판정 검사**:
   - 특·광역시 시도 행(11, 26, 27, 28, 30, 31) -> 통과.
   - 세종 시도 행(36) -> 통과.
   - 전남광주 광주 행(12200) 및 산하 22개 시·군 행 -> 통과.
   - 도 상위 시 행(수원, 성남 등 13개 시) -> 통과.
   - 도 일반 시·군 행(의정부, 증평, 태안 등 118개) -> 통과.
   - 자치구(강남구 등) 및 일반구(영통구 등), 도 전체 행 -> 거부 (FAIL).
2. **161개 과외 단위 전수 정합성 검사**:
   - 073의 268개 시군구 행이 올림 규칙에 의해 161개 단위로 100% 매핑되는지 검사.
3. **금지 문구 및 전역 규칙 회귀 검사**:
   - 전역 `.mypage-badge` 회귀 방지 검사 유지.
   - 오래된 `'구(시·군)'` 문구가 UI 및 API 에러에 잔존하지 않는지 검사.
4. **동네 인사 환영 줄 정합성 검사**:
   - 광역 과외쌤(시도 행) 환영 줄이 제외되지 않고 정상 생성되는지 검사.
   - 과외 단위 ID 일치 기반 노출 필터링 검사.

---

## [부록] 영향 파일 전체 목록 및 분류

기준:
- **반드시 같이 바꿀 것**: 저장·조회 조건·선택지 목록·단위 변환 로직
- **표시만 손볼 것**: 문구·라벨 모양만 다루는 로직
- **영향 없음**: 독립 운영 체계 (공부방 전용 등)

위치 표기: **「파일 + 함수/상수 이름」**을 주로 적고, 줄 번호는 `rg -n` 실행 결과에서 확인된 줄만 괄호로 병기함.

---

### 1. 반드시 같이 바꿀 것 (총 43개)

| 순번 | 파일 경로 | 주요 위치 (함수/상수명) | 분류 근거 | 바꿀 내용 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `src/Region/SidoRegionEnsure.php` | `assertSelectable` (L52), `present` (L78) | 과외 단위 판정 및 예외 처리 코어 | 과외 단위 판정 분리, 광역시 또는 시·군 예외 문구, 정식 라벨 |
| 2 | `src/Region/TutorRegionUnit.php` (신규) | `isTutorUnit`, `canonicalTutorUnit` | 161개 과외 단위 판정 SSOT | 신규 작성 |
| 3 | `src/Search/SearchService.php` | `SELECTABLE_REGION_MESSAGE` (L71), `guestAxisCounts` (L87), `guestScopedFilters` (L134), `guestAxisLabels` (L216), `searchTutors` (L734), `tutorSlot1Sql` (L740), `activePositionSku` (L1583) | 검색 조회 조건 및 게스트 축 구성 | 게스트 과외/학생 축을 서울특별시로 변경, 과외 단위 필터링 |
| 4 | `src/Region/RegionGuLink.php` | `GUEST_BASE_GU_OFFICIAL_CODE` (L28), `guIdByOfficialCode` (L66), `dongIdsUnderGu` (L90) | 공부방 축 유지 및 과외/학생 축 분리 | 공부방 구 연결 유지, 과외/학생 축 분리 인터페이스 제공 |
| 5 | `src/Registration/OfficialRegionLabel.php` | `resolve` (L25), `sigunguLabel` (L66), `selectableSigunguForDong` (L107) | 과외 단위 라벨 풀이 로직 | 과외 단위 행에 대해 정식 명칭 라벨 정상 반환 |
| 6 | `src/Tutor/TutorRegisterService.php` | `assertRegionSelectable` (L526, L530) | 과외쌤 활동지역 저장 검증 | `TutorRegionUnit::assertTutorUnit` 호출로 교체 |
| 7 | `src/Auth/BasicRegisterService.php` | `registerTutorBasic` (L268), `assertStudentPreferredRegionValid` (L876) | 가입 시 과외지역/희망지역 저장 검증 | 과외 단위 검증으로 교체 |
| 8 | `src/Registration/TutorHubRepository.php` | `savedRegions` (L161), `primaryRegionLabel` (L188), `slot1RegionId` (L199) | 과외 슬롯 조회 및 대표지역 라벨 제공 | 과외 단위 라벨 및 `region_selectable` 플래그 제공 |
| 9 | `src/Registration/StudentHubRepository.php` | `studentBasic` (L87), `updatePreferredTutorRegionId` (L430) | 학생 희망지역 저장 및 조회 | 과외 단위 검증 및 정식 라벨 제공 |
| 10 | `src/Registration/StudentBasicCompleteness.php` | `isComplete` (L30), `preferredTutorRegionId` (L48) | 학생 기본정보 완성도 판정 조건 | 과외 단위 유효성 기반 완성도 판정 |
| 11 | `src/Paid/TutorPositionAxis.php` | `columnsReady` (L26), `requireForTutor` (L49) | 과외 유료 노출 축 검증 및 저장 | 과외 단위 `city_id` 검증 및 정식 라벨 제공 |
| 12 | `src/Paid/ProviderCheckoutService.php` | `validatePositionScope` | 유료 결제 시 노출 축 검증 | 과외 단위 기반 검증 |
| 13 | `src/Paid/ProviderTicketRepository.php` | `createPositionSubscription` | 티켓 발급 시 노출 축 할당 | 과외 단위 기반 할당 |
| 14 | `src/Paid/ProviderWaitlistService.php` | `joinPositionWaitlist` | 과외 대기열 검증 | 과외는 매진 없음 원칙 반영 (대기열 미발생) |
| 15 | `src/Neighborhood/NeighborhoodGreetingService.php` | `tutorBasicCard` (L423), `welcomeInfoForMine` (L696), `lookupPrimaryDongName` (L786), `listWelcomeItems` (L829) | 환영 줄 쿼리 조건 및 단위 ID 비교 | 시도 행 포괄 쿼리, 정식 라벨 기반 환영 문구, 단위 ID 일치 비교 |
| 16 | `preview/shared/korea-sidos.js` | `KOREA_METROS` (L17), `KOREA_PROVINCES` (L29), `KOREA_SIDOS` (L42) | 정적 시도 목록 선택지 | `12 전남광주통합특별시` 정식 반영 |
| 17 | `preview/shared/region-cascade.js` | `activityLabelForUnit` (L91), `resolveCascade` (L104), `regionIdFromSelection` (L180) | 캐스케이드 2단계 선택지 및 단위 변환 | 정식 명칭 표기, 특·광역·세종 1단계 완료, 도 지역 2단계 시·군 노출 |
| 18 | `preview/shared/tutor-region-slots.js` | `renderTutorRegionSlot` (L30), `validateTutorActivityRegions` (L70) | 슬롯 렌더링 및 유효성 검증 | 과외 단위 슬롯 렌더링 및 검증 |
| 19 | `preview/shared/location-display.js` | `GUEST_BASE_TUTOR_LABEL` (L618), `guestTutorLabel` (L630), `loadGuestBaseline` (L688) | 게스트 기준 축 정의 및 조회 파라미터 | 게스트 과외/학생 축을 `서울특별시`로 변경 |
| 20 | `preview/shared/neighborhood-greeting.js` | `sameNeighborhood` (L54) | 동네 일치 판정 조건 | 과외쌤은 과외 단위 ID(`region_id`) 일치 비교로 교체 |
| 21 | `preview/home-ui/src/neighborhood-greeting-ui.js` | `viewerAreas` (L58, L110, L195) | 동네 인사 뷰어 영역 조회 조건 | 과외 단위 번호 기준 필터링 |
| 22 | `preview/home-ui/src/tutor-home-seed.js` | `loadTutorStudentDemand` (L160), 422 catch (L199), `readTutorHomeRegions` (L272) | 과외 홈 학생 수요 조회 조건 | 과외 단위 기반 로드 및 정정된 안내 대응 |
| 23 | `preview/home-ui/src/tutor-activity-chart.js` | `renderTutorActivityBars` (L110), 144행 안내 문구 | 활동지역 분포 차트 조회 및 슬롯별 재선택 | `과외지역을 다시 선택해 주세요 (광역시 또는 시·군)` 문구 교체 |
| 24 | `scripts/verify-region-unit-lock.mjs` | 전체 | 과외 단위 검증 게이트 스크립트 | 161개 과외 단위 전수 정합성 및 신규 정책 검증으로 전면 갱신 |
| 25 | `preview/auth-ui/src/screens/signup-basic.js` | `regionIdForSido` (L98), `data.saved_regions` (L730), `data.region_id` (L736) | 가입 화면 과외지역 3칸 및 학생 희망지역 선택·검증·제출 | 과외 단위 기반 수집 및 검증으로 교체 |
| 26 | `src/Views/auth/partials/basic-tutor.php` | `$cities` (L7-18), `<select name="region_id">` (L32-39) | 서버 렌더 과외 가입 폼의 시도 선택지 목록 생성 및 저장 | 과외 단위 선택지 생성 및 제출 바인딩 |
| 27 | `src/Views/auth/partials/basic-student.php` | `$cities` (L93-102), `<select name="region_id">` (L91-108) | 서버 렌더 학생 가입 폼의 과외 희망지역 선택지 목록 생성 및 저장 | 과외 단위 선택지 생성 및 제출 바인딩 |
| 28 | `preview/tutor-ui/src/screens/step-basic.js` | `collectTutorRegionSlots` (L125), `validateTutorActivityRegions` (L126), `registerState.saved_regions` (L47-52) | 과외 등록 step-basic 슬롯 수집·검증 및 저장 상태 갱신 | 과외 단위 슬롯 검증 및 저장 상태 반영 |
| 29 | `preview/tutor-ui/src/form-collect.js` | `state.saved_regions` (L16-32, L182, L185) | 과외 등록 폼 제출 페이로드 구성 | 과외 단위 슬롯 페이로드 수집 |
| 30 | `preview/tutor-ui/src/state.js` | `saved_regions` (L151-154), `hasSavedRegions` (L136-137) | 과외 등록 상태 관리 | 과외 단위 상태 보존 및 유효성 판정 |
| 31 | `preview/home-ui/src/tutor-reg/screens.js` | `tutor.saved_regions` (L252), `saveTutorBasicInline` 호출 (L310-315) | 마이페이지 기본정보 과외지역 슬롯 렌더링 및 저장 수집 | 과외 단위 선택기 렌더링 및 저장 연동 |
| 32 | `preview/home-ui/src/tutor-reg/inline-save.js` | `saveTutorBasicInline` (L34), `saved_regions` 필터 및 패치 전송 (L38-60) | 마이페이지 인라인 기본 정보 저장 시 지역 슬롯 검증 | 과외 단위 검증 및 지역 미변경 시 재검증 스킵 |
| 33 | `preview/home-ui/src/tutor-reg/store.js` | `saved_regions` (L26) | 튜터 등록 정보 스토어 및 상태 보존 | 과외 단위 데이터 저장 |
| 34 | `preview/home-ui/src/tutor-reg/city-units.js` | 과외 단위 목록 로더 및 스토어 | 과외 단위 선택지 목록 제공 | 161개 과외 단위 스토어 지원 |
| 35 | `preview/shared/student-hope-regions.js` | `normalizeHopeSlots` (L21), `preferred_tutor_regions` (L55, L73-81) | 학생 희망지역 슬롯 데이터 정규화 및 바인딩 | 과외 단위 슬롯 정규화 및 검증 |
| 36 | `preview/home-ui/src/student-reg/screens.js` | `hopeRegionValues` (L250), `preferred_tutor_region_id` 바인딩 (L277, L544, L696) | 학생 마이페이지 과외 희망지역 선택·저장 수집 | 과외 단위 선택기 렌더링 및 패치 연동 |
| 37 | `preview/home-ui/src/student-reg/store.js` | `preferred_tutor_region_id` (L38), `preferred_tutor_regions` (L36, L96, L131) | 학생 등록 상태 및 희망지역 스토어 | 과외 단위 희망지역 저장 |
| 38 | `preview/search-ui/src/search-find-surface.js` | `STALE_GUEST_LABELS` (L90), `resolveCanonicalGuRegionId` (L361), `studentFeedFilters` (L409), `isTutorMockCityLabel` (L1203) | 검색/피드의 구 올림, 조회 조건, 모의 시 라벨, 피드 필터 | 과외 단위 자동 올림, 손님 서울특별시 라벨 수용 |
| 39 | `preview/search-ui/src/student-saved-region.js` | `preferred_tutor_region_id` (L60), `target.scope === 'sigungu'` 조건 (L110, L116) | 과외 탭 검색 시 학생 희망지역 scope 검사 및 조회 파라미터 조립 | 과외 단위 scope 지원 및 조회 파라미터 구성 |
| 40 | `preview/home-ui/src/student-blind-teaser.js` | `coarseRegionForGuest` (L56) | 게스트 블라인드 티저 지역 단위 변환 | '서울특별시' 입력 시 '—'로 깨지는 단위 변환 결손 해소 |
| 41 | `preview/home-ui/src/plans/order-blocks.js` | `listTutorApplyCities` (L125), `city_id` 추출 및 유료 구매 후보 구성 (L131, L186, L276-292) | 과외 유료 노출 판매 축 후보 목록 필터링 | 과외 단위 적용 지역 후보 필터링 및 바인딩 |
| 42 | `preview/search-ui/src/search-map.js` | `renderSearchMapBlock` (L174), 줌 분기 `ctx.regionLevel === 'district' ? 13 : 15` (L142) | 지도 줌 레벨 결정 규칙 | 과외 단위(광역시 등) 선택 시 줌 레벨 분기 조건 및 줌 레벨 결정 규칙 변경 |
| 43 | `src/Tutor/TutorDetailCompletionEvaluator.php` | `hasPrimaryRegion` (L218) | 과외쌤 완성도 판정 조건 | 슬롯 0의 지역이 유효한 과외 단위인지 검증하지 않고 판정하는 결손 해소 (`TutorRegionUnit::isValidTutorUnit` 검증 추가) |

---

### 2. 표시만 손볼 것 (문구·라벨 모양만 다루는 로직 총 23개)

| 순번 | 파일 경로 | 주요 위치 (함수/상수명) | 분류 근거 | 바꿀 내용 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `preview/auth-ui/src/screens/signup-complete.js` | `signupComplete` (L45-60) | 가입 완료 화면 텍스트 표시 | 정식 명칭 라벨 표시 |
| 2 | `preview/home-ui/src/student-reg/student-reg-copy.js` | `TUTOR_HOME_STUDENT_COPY.reselect` (L72) | 안내 문구 사전 정의 | `'과외지역을 다시 선택해 주세요 (광역시 또는 시·군)'` 등록 |
| 3 | `preview/home-ui/src/student-reg/format.js` | `formatRegion` (L138-153) | 학생 지역 문자열 포맷팅 | 정식 명칭 포맷팅 |
| 4 | `preview/home-ui/src/mypage/account-region-label.js` | `accountRegionLabel` (L30-55) | 마이페이지 계정 지역 텍스트 표시 | 시도 단독 행 정식 라벨 표시 |
| 5 | `preview/shared/student-auth-bridge.js` | `syncStudentAuthBridge` (L35-60) | 가입 브릿지 지역 라벨 문자열 전달 | 정식 라벨 전달 |
| 6 | `preview/search-ui/src/search-schema.js` | `searchSchema` (L40-65) | 검색 디스플레이 라벨 정의 | 정식 명칭 라벨 지원 |
| 7 | `preview/search-ui/src/search-exposure-mapper.js` | `mapExposure` (L31-42) | 검색 결과 노출 텍스트 매핑 | 정식 지역 라벨 매핑 |
| 8 | `preview/search-ui/src/search-tier-render.js` | `renderTierBadge` (L45-70) | '{place} 과외쌤' 텍스트 렌더링 | '서울특별시 과외쌤' 등 정식 명칭 출력 |
| 9 | `preview/home-ui/src/detail-decision/student-request-card.js` | `renderStudentRequestCard` (L79) | 학생 요청 카드 텍스트 표시 | 정식 과외 단위 명칭 표시 |
| 10 | `preview/home-ui/src/detail-decision/tutor-detail.js` | `renderTutorDetail` (L21-31) | 과외쌤 상세 팝업 지역 텍스트 포맷 | 정식 명칭 라벨 포맷 |
| 11 | `preview/home-ui/src/user-actions-ui.js` | `renderUserActions` (L219-220) | 사용자 액션 UI 텍스트 | 지역 정식 명칭 표시 |
| 12 | `preview/home-ui/src/student-review-ui.js` | `renderStudentReview` (L124) | 학생 리뷰 UI 텍스트 | 지역 정식 명칭 표시 |
| 13 | `preview/home-ui/src/home-card-samples/presets.js` | `cardPresets` (L16) | 카드 샘플 프리셋 텍스트 | 정식 명칭 예시 반영 |
| 14 | `preview/home-ui/src/guest-sections.js` | `renderGuestSections` (L70-96) | 게스트 섹션 텍스트 표시 | 정식 명칭 라벨 표시 |
| 15 | `preview/home-ui/src/section-headings.js` | `renderSectionHeadings` (L65-73) | 섹션 헤딩 텍스트 | 정식 명칭 라벨 표시 |
| 16 | `preview/home-ui/src/provider-home.js` | `renderProviderHome` (L223-243) | 공급자 홈 텍스트 표시 | 정식 명칭 라벨 표시 |
| 17 | `preview/home-ui/src/screens/tutor.js` | `renderTutorScreen` (L46-61) | 튜터 스크린 텍스트 표시 | 정식 명칭 라벨 표시 |
| 18 | `src/Admin/AdminExposureRepository.php` | `regionDisplayExpr` (L20) | 관리자 화면 지역 라벨 표현식 | 정식 명칭 표현식 연동 |
| 19 | `src/Admin/AdminRegistrationListRepository.php` | `page` (L53-108, 특히 L71 `$region`, L83-86 `labels->resolve`) | 관리자 등록 목록 라벨 표시 및 지역 필터 | `OfficialRegionLabel` 정식 라벨 표시 연동 |
| 20 | `preview/home-ui/src/tutor-reg/registration-check-model.js` | `checkTutorRegistration` (L79, L221-224) | 등록 점검 모델 내 지역 완성도 라벨 표시 | 과외 단위 라벨 표시 |
| 21 | `preview/home-ui/src/detail-decision/detail-utils.js` | `coarseRegionForGuest` (L13, L62, L69) | 게스트 상세 카드 지역 라벨 포맷팅 | 정식 명칭 표기 연동 |
| 22 | `preview/home-ui/src/exposure-render.js` | `coarseRegionForGuest` (L45, L769, L846, L946) | 게스트 노출 카드 지역 라벨 포맷팅 | 정식 명칭 표기 연동 |
| 23 | `public/api/search/region-stats.php` | 레거시 주석 (L13-14) | 과외 통계 집계 주석 | 1168000000 강남구 기준 옛 주석을 과외 축 기준으로 갱신 |

---

### 3. 영향 없음 (독립 운영 체계 총 7개)

| 순번 | 항목 / 파일 경로 | 이유 |
| :---: | :--- | :--- |
| 1 | `preview/home-ui/src/myshop/ShopPage.js` 등 ShopPage 관련 전체 | 공부방 전용 페이지 (`docs/internal/54-shop-page-lock.md`). 과외쌤은 상세 팝업/페이지를 별도 사용 |
| 2 | 공부방 지도 마커 핀 (`search-map.js` 중 room 핀) | 공부방은 고유 동/단지 좌표 핀을 사용하며 과외 단위에 영향받지 않음 |
| 3 | 쪽지·문의·리뷰 (`src/Messages/*`, `src/Reviews/*`) | `provider_id` 및 `user_id` 기준 구동, 지역 단위 로직 없음 |
| 4 | 회원 메일 발송 (`src/Mail/*`) | 지역 단위 로직 없음 |
| 5 | 쪽지 수신 설정 (`src/Tutor/TutorInquiryStatus.php`) | `inquiry_status` 컬럼 독립 운영 |
| 6 | SEO 메타태그 생성기 | 정적 라우트 기반, 과외 단위 종속성 없음 |
| 7 | `src/Paid/TutorPositionAxis.php` 내 `cityLabel` 인터페이스 | 호출 시그니처 유지 (내부 매핑만 정본 72 정식 명칭 적용) |

---

### 4. 회귀 주의 검사 스크립트 목록 (총 8개)

다음 검사 스크립트들은 기존에 구(시·군) 단위를 가정하거나 특정 텍스트를 검사하므로, 코드 단계에서 함께 점검 및 갱신해야 한다.

1. `scripts/verify-region-unit-lock.mjs`: 구 단위 검증을 과외 단위 검증으로 전면 갱신.
2. `scripts/verify-tutor-region-label.mjs`: 073 284행, 강남/영통구 가정을 서울특별시/수원시 단위로 갱신.
3. `scripts/verify-mypage-account-region.mjs`: '서울특별시 강남구' 가정을 '서울특별시'로 갱신.
4. `scripts/verify-neighborhood-welcome.php`: 과외쌤 환영 줄 쿼리 및 라벨 검증 갱신.
5. `scripts/verify-location-ssot.mjs`: 과외 단위 사례 및 정본 72 참조 추가.
6. `scripts/verify-tutor-home-student-tab.mjs`: 대표 지역 과외 단위 기준 학생 로드 검증으로 갱신.
7. `scripts/verify-student-mypage-hope-region.mjs`: 학생 희망지역 과외 단위 정식 라벨 검증으로 갱신.
8. `scripts/verify-position-region-tier.mjs` / `.php`: 과외 유료 노출 축 과외 단위 정합성 검증.
