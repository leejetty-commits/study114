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
- **20:18~20:26 (추가 결정 원문)**:
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

- **FK 확인 사실**: `sql/schema/008_tutors.sql:78`(`CONSTRAINT fk_tr_region FOREIGN KEY (region_id) REFERENCES regions (id)`) 및 `sql/schema/004_member_ssot_align.sql:105`(`CONSTRAINT fk_students_tutor_region FOREIGN KEY (preferred_tutor_region_id) REFERENCES regions (id)`)에 명시적으로 `FOREIGN KEY`가 선언되어 있다.
- **결정**: 따라서 가상 키(나)를 사용할 경우 DB 저장 시 MySQL 1452 에러가 발생하여 서비스가 즉시 중단되므로, **(가) SQL로 `regions`에 단위 행 1개를 INSERT하는 방식을 필수로 채택**한다.
- **표시 이름**: **「전남광주통합특별시 광주」** (정식 명칭 체계에 부합).

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
- (현재 운영 데이터는 모두 테스트 계정이므로 충돌 위험이 없으나, 데이터 정합성을 위해 쿼리에서 `MAX(end_exclusive_on)`으로 단일 레코드를 유지함)

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

-- 2-5. 학생 희망지역(students.preferred_tutor_region_id) 동일 승격 적용
UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET s.preferred_tutor_region_id = target.id
WHERE curr.sido_code IN ('11','26','27','28','30','31') AND curr.unit_level <> 'sido';

UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = '12' AND target.sigungu_code = '12200'
SET s.preferred_tutor_region_id = target.id
WHERE curr.sido_code = '12' AND curr.sigungu_code IN ('12210','12240','12270','12300','12330');

UPDATE students s
JOIN regions curr ON curr.id = s.preferred_tutor_region_id
JOIN regions target ON target.official_code = CONCAT(SUBSTRING(curr.official_code, 1, 4), '000000')
                    AND target.unit_level = 'sigungu'
SET s.preferred_tutor_region_id = target.id
WHERE curr.sido_code IN ('41','43','44','47','48','52') AND curr.sigungu_name LIKE '% %';

-- 2-6. 유료 노출 축(provider_position_subscriptions.city_id) 동일 승격 적용
UPDATE provider_position_subscriptions pps
JOIN regions curr ON curr.id = pps.city_id
JOIN regions target ON target.sido_code = curr.sido_code AND target.unit_level = 'sido'
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND curr.sido_code IN ('11','26','27','28','30','31') AND curr.unit_level <> 'sido';

-- -----------------------------------------------------------------------------
-- [3단계: 슬롯 중복 제거 및 순서 재부여 (MySQL 8 CTE/윈도우 함수)]
-- -----------------------------------------------------------------------------

-- 3-1. 중복 슬롯 삭제 (같은 tutor_id 내 같은 region_id가 중복되면 is_primary 우선, priority_order 가장 작은 것 1개만 보존)
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

-- 3-2. 남은 슬롯의 priority_order를 0, 1, 2로 순차 재정렬
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
-- 미변환된 비단위 행이 남아있는지 최종 확인 (결과가 0행이어야 함)
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
```

---

## 10. 코드 단계 작업 순서안 및 배포 순서

### (1) 코드 작업 5단계 분할안 (작은 단위로 단계별 검수)
- **1단계: 판정 코어 모듈 구축**:
  - PHP: `src/Region/TutorRegionUnit.php` 신규 작성 (`isTutorUnit($regionId)`, `canonicalTutorUnit($regionRow)`).
  - JS: `preview/shared/tutor-region-unit.js` 신규 작성.
- **2단계: 저장/조회 서버 서비스 반영**:
  - `src/Region/SidoRegionEnsure.php`: `assertTutorUnit()` 분리 및 예외 문구 교체.
  - `src/Registration/OfficialRegionLabel.php`: 과외 단위(시도 행 및 상위 시 행)의 라벨을 정식 명칭으로 정상 변환.
  - `src/Tutor/TutorRegisterService.php`, `src/Auth/BasicRegisterService.php`: 과외 단위 검증 적용.
  - `src/Registration/TutorHubRepository.php`, `src/Registration/StudentHubRepository.php`: 슬롯/희망지역 반환 및 정식 라벨 제공.
- **3단계: 검색·피드 및 게스트 축 개편**:
  - `src/Search/SearchService.php`: 게스트 축을 강남구에서 `1100000000` 서울특별시로 변경, 과외 탭 과외 단위 필터링 연동.
  - `preview/search-ui/src/search-find-surface.js` 및 `preview/shared/location-display.js`: 게스트 베이스라인 및 주소 올림 로직 개편.
- **4단계: 프론트 UI 및 동네 인사 연동**:
  - `preview/shared/region-cascade.js`: 2단계 캐스케이드(특·광역·세종 1단계 완료, 도 지역 2단계 시·군 노출) 개편 및 중복 라벨 해소.
  - `preview/shared/korea-sidos.js`: `12 전남광주통합특별시` 반영.
  - `preview/auth-ui/src/screens/signup-basic.js`, `preview/home-ui/src/tutor-reg/screens.js`, `preview/home-ui/src/student-reg/screens.js`: UI 선택기 연동.
  - `src/Neighborhood/NeighborhoodGreetingService.php` 및 `preview/shared/neighborhood-greeting.js`: 환영 줄 시도 포괄 및 단위 ID 기반 일치 비교 연동.
- **5단계: 자동 검사 갱신 및 CI 검증**:
  - `scripts/verify-region-unit-lock.mjs` 전면 갱신 및 전체 통합 테스트 통과.

### (2) 배포 순서 (무장애 보장)
1. **사전 준비**: 운영 DB(phpMyAdmin)에서 `0단계(전남광주 광주 단위 행 INSERT)` 실행.
2. **코드 배포**: GitHub Actions를 통해 변경된 코드 배포 (Vite 빌드 포함).
   - 신규 코드는 비단위 데이터를 만나도 500 오류 없이 안내 문구로 우아하게 대응하도록 설계되므로 배포 즉시 장애 없음.
3. **데이터 이관**: 운영 DB에서 `2단계(이관 UPDATE)` 및 `3단계(중복 제거)` 실행.
4. **사후 확인**: `4단계(사후 점검 SELECT)` 실행하여 유효하지 않은 슬롯이 0건임을 확인.

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

### 1. 반드시 같이 바꿀 것 (코어 판정·저장·검색·캐스케이드·등록 슬롯 등 총 24개)

| 파일 경로 | 주요 위치 | 현재 하는 일 | 바꿀 내용 |
| :--- | :--- | :--- | :--- |
| `src/Region/SidoRegionEnsure.php` | 61, 78-122행 | `is_selectable=1` 검증 및 '구(시·군)' 예외 문구, 시도 중복 라벨 | 과외 단위 판정 분리, 광역시 또는 시·군 예외 문구, 정식 라벨 |
| `src/Region/TutorRegionUnit.php` (신규) | 전체 | (없음) | 161개 과외 단위 판정 및 올림 SSOT 클래스 |
| `src/Search/SearchService.php` | 71, 86-123, 133-164, 215-225, 486~, 745~행 | 게스트 축 강남구, `is_selectable` 의존 검색, '구(시·군)' 문구 | 게스트 과외/학생 축을 서울특별시로 변경, 과외 단위 필터링, 공부방은 강남구 유지 |
| `src/Region/RegionGuLink.php` | 40-75행 | `is_selectable=1` 기반 구 ID 조회 | 공부방 축 유지, 과외/학생 축 분리 인터페이스 제공 |
| `src/Registration/OfficialRegionLabel.php` | 31-40행 | `is_selectable=1`일 때만 sigungu_label 반환하여 시도/상위시 null | 과외 단위 행에 대해 정식 명칭 라벨 정상 반환 |
| `src/Tutor/TutorRegisterService.php` | 45-65행 | `SidoRegionEnsure::assertSelectable` 호출 | `TutorRegionUnit::assertTutorUnit` 호출로 교체 |
| `src/Auth/BasicRegisterService.php` | 110-135행 | 가입 시 과외지역/희망지역 검증 | 과외 단위 검증으로 교체 |
| `src/Registration/TutorHubRepository.php` | 159-182, 188-197행 | 과외 슬롯 조회 및 `primaryRegionLabel` 조회 | 과외 단위 라벨 및 `region_selectable` 플래그 정확한 제공 |
| `src/Registration/StudentHubRepository.php` | 95-120행 | 학생 희망지역 조회 및 라벨 제공 | 과외 단위 라벨 및 유효성 플래그 제공 |
| `src/Registration/StudentBasicCompleteness.php` | 42-60행 | 학생 기본정보 완성도 판정 시 희망지역 검사 | 과외 단위 유효성 기반 판정 |
| `src/Paid/TutorPositionAxis.php` | 50-85행 | 과외 유료 노출 축 검증 | 과외 단위 `city_id` 검증 및 정식 라벨 제공 |
| `src/Paid/ProviderCheckoutService.php` | 110-135행 | 유료 결제 시 노출 축 검증 | 과외 단위 기반 검증 |
| `src/Paid/ProviderTicketRepository.php` | 210-245행 | 티켓 발급 시 노출 축 할당 | 과외 단위 기반 할당 |
| `src/Paid/ProviderWaitlistService.php` | 70-95행 | 과외 대기열 검증 | 과외는 매진 없음 원칙 반영 (대기열 미발생) |
| `src/Neighborhood/NeighborhoodGreetingService.php` | 423-466, 696-784, 786-811, 829-967행 | `sigungu_name <> ''` 필터로 광역 과외쌤 누락, 환영 문구 sigungu_name 의존 | 시도 행 포괄 쿼리, 정식 라벨 기반 환영 문구, 단위 ID 일치 비교 |
| `preview/shared/korea-sidos.js` | 15-39행 | 정적 광역/도 목록 (29 광주, 46 전남 유지, 12 누락) | `12 전남광주통합특별시` 정식 반영 |
| `preview/shared/region-cascade.js` | 91-98, 104~, 180~행 | `activityLabelForUnit` 중복 라벨, 광역 2단계 강제 | 정식 명칭 표기, 특·광역·세종 1단계 완료, 도 지역만 2단계 처리 |
| `preview/shared/tutor-region-slots.js` | 35행 부근 | 슬롯 렌더링 및 '구(시·군)' 문구 | 과외 단위 안내 문구 교체 |
| `preview/shared/location-display.js` | 576, 618, 688-721행 | `GUEST_BASE_TUTOR_LABEL = '서울시 강남구'` | 게스트 과외/학생 축을 `서울특별시`로 변경 |
| `preview/shared/neighborhood-greeting.js` | 54-66행 | `sameNeighborhood` 문자열 포함(`includes`) 비교 | 과외쌤은 과외 단위 ID(`region_id`) 일치 비교로 교체 |
| `preview/home-ui/src/neighborhood-greeting-ui.js` | 58-76, 110-119, 195-224행 | 동네 인사 뷰어 영역 판정 | 과외 단위 번호 기준 필터링 |
| `preview/home-ui/src/tutor-home-seed.js` | 199, 272행 | 422 '구(시·군)' 문자열 비교 및 학생 수요 로드 | 과외 단위 기반 로드 및 정정된 안내 문구 대응 |
| `preview/home-ui/src/tutor-activity-chart.js` | 144행 | 차트 내 `활동지역을 구(시·군)까지 다시 선택해 주세요` 안내 | `과외지역을 다시 선택해 주세요 (광역시 또는 시·군)` 문구 교체 |
| `scripts/verify-region-unit-lock.mjs` | 전체 | 구 단위 검증 및 '구(시·군)' 문자열 검사 | 161개 과외 단위 전수 정합성 및 신규 정책 검증으로 전면 갱신 |

---

### 2. 표시만 손볼 것 (문구·라벨·뷰·필터·맵 줌 등 총 28개)

| 파일 경로 | 주요 위치 | 현재 하는 일 | 바꿀 내용 |
| :--- | :--- | :--- | :--- |
| `preview/auth-ui/src/screens/signup-basic.js` | 188, 303행 | 가입 화면 지역 힌트 문구 | '광역시 또는 시·군' 2단계 힌트 문구로 수정 |
| `preview/auth-ui/src/screens/signup-complete.js` | 45-60행 | 가입 완료 시 지역 표시 | 정식 명칭 표시 |
| `src/Views/auth/partials/basic-tutor.php` | 25-45행 | SSR 과외 기본가입 폼 지역 힌트 | 2단계 선택 안내 문구 수정 |
| `src/Views/auth/partials/basic-student.php` | 20-40행 | SSR 학생 기본가입 폼 희망지역 힌트 | 광역시 또는 시·군 안내 문구 수정 |
| `preview/tutor-ui/src/screens/step-basic.js` | 60-85행 | 과외 기본정보 지역 선택기 연동 | 2단계 캐스케이드 바인딩 |
| `preview/tutor-ui/src/form-collect.js` | 40-55행 | 과외 지역 데이터 수집 | 과외 단위 id 수집 |
| `preview/tutor-ui/src/state.js` | 30-45행 | 과외 등록 상태 관리 | 과외 단위 상태 보존 |
| `preview/home-ui/src/tutor-reg/screens.js` | 219-224, 369, 388행 | 마이페이지 기본정보 수정 지역 폼 및 문구 | 과외 단위 선택기 및 힌트 문구 교체 |
| `preview/home-ui/src/tutor-reg/inline-save.js` | 34-60행 | 인라인 기본 저장 시 지역 검증 | 지역 미변경 시 불필요한 재검증 스킵 처리 |
| `preview/home-ui/src/tutor-reg/store.js` | 80-110행 | 튜터 등록 스토어 | 과외 단위 데이터 저장 |
| `preview/home-ui/src/tutor-reg/city-units.js` | 15-40행 | 과외 단위 목록 스토어 | 161개 과외 단위 스토어 지원 |
| `preview/home-ui/src/tutor-reg/registration-check-model.js` | 79, 221-224행 | 등록 점검 모델 내 지역 완성도 검사 | 과외 단위 유효성 검사 |
| `preview/home-ui/src/student-reg/student-reg-copy.js` | 72행 | `reselect` 문구 정의 | `과외지역을 다시 선택해 주세요 (광역시 또는 시·군)` 등록 |
| `preview/home-ui/src/student-reg/screens.js` | 50-75행 | 학생 희망지역 선택 화면 | 2단계 캐스케이드 연동 |
| `preview/home-ui/src/student-reg/store.js` | 40-65행 | 학생 등록 스토어 | 과외 단위 희망지역 저장 |
| `preview/home-ui/src/student-reg/format.js` | 138-153행 | 학생 지역 포맷팅 | 정식 명칭 포맷팅 |
| `preview/home-ui/src/mypage/account-region-label.js` | 30-55행 | 마이페이지 계정 지역 라벨 | 시도 단독 행 정식 라벨 표시 |
| `preview/shared/student-hope-regions.js` | 25-50행 | 학생 희망지역 슬롯 유틸 | 과외 단위 슬롯 연동 |
| `preview/shared/student-auth-bridge.js` | 35-60행 | 가입-로그인 브릿지 지역 데이터 전달 | 과외 단위 전달 |
| `preview/search-ui/src/student-saved-region.js` | 20-45행 | 학생 저장 지역 로드 | 과외 단위 로드 |
| `preview/search-ui/src/search-schema.js` | 40-65행 | 검색 스키마 정의 | 과외 단위 필드 지원 |
| `preview/search-ui/src/search-find-surface.js` | 90, 273-298, 360-401, 541, 1203-1206, 1831행 | STALE 라벨, 구 올림, 모의 시 라벨, 피드 필터 | 과외 단위 자동 올림, 손님 서울특별시 라벨 수용 |
| `preview/search-ui/src/search-exposure-mapper.js` | 31-42행 | 검색 결과 노출 매핑 | 정식 지역 라벨 매핑 |
| `preview/search-ui/src/search-tier-render.js` | 45-70행 | '{place} 과외쌤' 렌더링 | '서울특별시 과외쌤' 등 정식 명칭 출력 |
| `preview/search-ui/src/search-map.js` | 101-108, 141-142행 | 지도 줌 레벨 (13 고정) | 과외 단위(광역시 등) 선택 시 적정 줌 레벨 조정 |
| `preview/home-ui/src/detail-decision/student-request-card.js` | 79행 부근 | 학생 요청 카드 지역 표시 | 정식 과외 단위 명칭 표시 |
| `preview/home-ui/src/exposure-render.js` | 376-455, 768, 845, 945행 | 카드 티저 및 지역 라벨 포맷 | 시도 행 단독 정식 라벨 처리 |
| `preview/home-ui/src/student-blind-teaser.js` | 56-73행 | 블라인드 티저 coarseRegion | 서울시만 남을 때 '—' 결손 방지 |

---

### 3. 영향 없음 (독립 운영 체계 총 8개)

| 항목 / 파일 경로 | 이유 |
| :--- | :--- |
| `preview/home-ui/src/myshop/ShopPage.js` 등 ShopPage 관련 전체 | 공부방 전용 페이지 (`docs/internal/54-shop-page-lock.md`). 과외쌤은 상세 팝업/페이지를 별도 사용 |
| 공부방 지도 마커 핀 (`search-map.js` 중 room 핀) | 공부방은 고유 동/좌표 핀을 사용하며 과외 단위에 영향받지 않음 |
| 쪽지·문의·리뷰 (`src/Messages/*`, `src/Reviews/*`) | provider_id 및 user_id 기준 구동, 지역 단위 로직 없음 |
| 회원 메일 발송 (`src/Mail/*`) | 지역 단위 로직 없음 |
| 쪽지 수신 설정 (`src/Tutor/TutorInquiryStatus.php`) | `inquiry_status` 컬럼 독립 운영 |
| SEO 메타태그 생성기 | 정적 라우트 기반, 과외 단위 종속성 없음 |
| `src/Paid/TutorPositionAxis.php` 내 `cityLabel` 인터페이스 | 호출 시그니처 유지 (내부 매핑만 정본 72 정식 명칭 적용) |
| `AdminRegistrationListRepository.php` | **미확인 (파일 없음)** — `src/Admin` 내에 해당 파일이 실존하지 않음 |

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
