# 72. 과외 지역 단위 및 역할별 저장 정본 — 광역시·시·군 단위 체계와 데이터 이관

- 상태: 정본 (2026-10-08 20:10 사용자 확정)
- 이전 정책(구·시·군 통일)에서 **광역시 단독·도(시·군) 단위 체계**로 복귀·개정.

---

## 1. 정책 변경 배경 및 내력

### (1) 사용자 결정 원문 (2026-10-08 20:07~20:10)
- 「정책은 과외쌤을 시군구로 했는데, 사실 구로 나누는게 크게 의미가 없어. 왜냐하면 광역시는 교통이 너무 발달되어 있어서 충분히 과외활동에 지역이 커버가 가능해. 서울을 예로 들면, 서울 하나만 해도 전철로 다 과외하러 다닐수 있어...」
- 「광역을 하나로 봐도 돼. 학생이 과외쌤을 구에서 찾는게 아니라, 서울, 인천, 의정부 이렇게 찾을수 있으니...」
- 「과외쌤은 시군구가 아니라, 광역시,시,군 이렇게 되네. 도는 제외야」
- 「과외쌤은 어차피 프리미엄의 자리갯수가 제한되지 않아. 페이지넘버링이야」

### (2) 사용자 선택 3건
1. **광역시 관할 군 포함**: 광역시 안의 군(인천 강화·옹진, 부산 기장, 대구 달성·군위, 울산 울주)은 별도 분리하지 않고 해당 광역시에 포함한다.
2. **학생 과외 희망 지역 일치**: 학생의 「과외 희망 지역」(`students.preferred_tutor_region_id`)도 과외쌤 활동지역과 완전히 동일한 과외 단위를 사용한다.
3. **유료 노출 판매 단위 일치**: 과외쌤 유료 노출 Pick·Prime 판매 단위도 동일한 과외 단위 + 주력과목으로 운영하며, 매진 없이 페이지네이션으로 제공한다.

### (3) 정책 변천 내력 (커밋 기록)
- **2026-08-04 (`ca075c5`)**: 「과외지역은 광역시 단독·도→시 선택을 기본 단위로 한다」로 최초 정립.
- **2026-09-24 (`4660fd8`)**: 회원가입 개편 작업 중 「tutor sido→si/gun」으로 무심코 변경.
- **2026-10-01 (`67b9a63`)**: 공식 행정구역(072·073) 도입 시 「구(시·군) 단위 통일」로 고착.
- **원인 분석**: 과외 단위 정책이 독자적인 정본 검토 없이 다른 기능 개발(가입·DB시드 개편)에 끼워져 변경되었던 것이 근본 원인임. 이번 개정을 통해 2026-08-04 정책(광역시 단독, 도→시·군)으로 정식 복귀하고 정본으로 영구 고정한다.

### (4) 이전 사고 기록 (2026-10-08 18시 확인분 유지)
- 2026-08-04 도입 당시 `SidoRegionEnsure::ensure()`가 시마다 `dong_name='시 대표'` 가짜 동 행을 임시로 생성함.
- 2026-10-01 구(시·군) 통일(072·073)에서 공식 행 284개 추가 후 「정리는 다음 작업에서 한다」 주석만 남긴 채 이관 작업을 진행하지 않아 구 데이터와 신 데이터 간 불일치 발생.
- 운영 DB 영향: 과외쌤 3명 7건이 옛 행(대치동, 우동, 서울 시 대표, 의정부/남양주 시 대표)을 가리켜 홈 422 오류 유발.
- 교훈: 단위 변경 시 반드시 **정본 개정 → 코드 반영 → 전수 이관 SQL 실행**이 한 묶음으로 완료되어야 함.

---

## 2. 과외 단위 정의 (이하 「과외 단위」)

과외쌤의 이동 수업 특성상, 대중교통망이 촘촘한 특별시·광역시는 도시 전체를 1개 단위로 보고, 도 지역은 생활권이 분리된 시·군을 1개 단위로 본다.

### (1) 단위 구분 상세
1. **특별시·광역시 (시도 코드 11, 26, 27, 28, 29, 30, 31)**:
   - 시도 행 1개 (`unit_level = 'sido'`, `official_code = 'XX00000000'`).
   - 하위 자치구 및 광역시 관할 군(강화·옹진·기장·달성·군위·울주) 전체가 해당 광역시 1개 단위로 묶인다.
2. **세종특별자치시 (시도 코드 36)**:
   - 시도 행 1개 (`official_code = '3600000000'`).
3. **도 지역 (시도 코드 41 경기, 43 충북, 44 충남, 46 전남, 47 경북, 48 경남, 50 제주, 51 강원, 52 전북 등)**:
   - **시·군 행** 1개.
   - **일반구가 있는 시는 상위 시 행**으로 단일화: 수원시(41110), 성남시(41130), 안양시(41170), 부천시(41190), 안산시(41270), 고양시(41280), 용인시(41460), 화성시(41590), 청주시(43110), 천안시(44130), 포항시(47110), 창원시(48120), 전주시(52110) 등 총 13개 시는 하위 일반구(39개)를 쓰지 않고 상위 시 행 1개를 과외 단위로 사용한다.
   - 일반구가 없는 시와 군은 해당 시·군 행 자체를 사용한다.
   - **도 전체는 과외 단위가 될 수 없다.** (예: 경기도 전체를 1칸으로 등록 불가)
   - *참고 (073 시드 구조)*: 073 파일에는 광주(29)와 전남(46)이 `12 전남광주통합특별시`로 등록되어 있으며, 표준 17개 광역단체 체계와 1:1 대응된다.

### (2) 주소 → 과외 단위 올림 규칙 (`official_code` 기준)
임의의 주소 또는 법정동/행정구역 행이 주어졌을 때 과외 단위로 올리는 결정론적 알고리즘:

1. **특별시·광역시·세종** (`sido_code` IN `'11', '26', '27', '28', '29', '30', '31', '36'`):
   - 공식 코드 앞 2자리 + `'00000000'` (시도 행).
2. **도 지역** (`sido_code` IN `'41', '43', '44', '46', '47', '48', '50', '51', '52'` 등):
   - 5자리 시군구 코드 앞 4자리 + `'000000'`에 해당하는 상위 시 행(13개 상위 시)이 073에 존재하면 -> **상위 시 코드**로 올림.
   - 상위 시가 존재하지 않으면 -> **해당 시·군 코드 자체** 유지.

### (3) 073 전체 268개 시군구 행 전수 계산 검증 결과
- **검증 대상**: `sql/schema/073_region_official_seed.sql`에 등록된 268개 시군구 전수.
- **예외 발생 수**: **0건** (100% 매핑 성공).
- **특이 군 검증 결과**:
  - `4374500000` (충청북도 증평군): 끝자리가 5이나 일반구가 아니므로 자기 자신(`4374500000`)으로 정확히 유지됨.
  - `4482500000` (충청남도 태안군): 끝자리가 5이나 일반구가 아니므로 자기 자신(`4482500000`)으로 정확히 유지됨.
- **총 과외 단위 수**: **161개** (표준 17개 시도 기준: 광역·세종 8개 + 도 단위 시·군 153개).
  - *073 원본 기준*: 광역 6개(서울, 부산, 대구, 인천, 대전, 울산) + 도 시군 158개(12 소속 시군 포함) = 164개.

---

## 3. 공부방과 분리 (핵심 레드라인)

### (1) `regions.is_selectable` 변경 절대 금지
- `regions.is_selectable` 컬럼은 공부방 찾기의 구 전체 검색(`SearchService` `sigungu_region_id` -> `RegionGuLink::dongIdsUnderGu`를 통해 하위 동을 펼쳐 찾는 기능) 및 행정구역 필터링에서 광범위하게 사용되고 있다.
- 따라서 **`regions.is_selectable` 값을 과외 정책에 맞춰 변경하는 것을 엄격히 금지**한다.

### (2) 과외 단위 판정 분리 및 판정 방식 비교
과외 단위 여부는 `regions.is_selectable` 대신 별도 로직으로 판정해야 한다.

| 비교 항목 | (가) 코드 기반 계산 헬퍼 (강력 추천) | (나) DB 컬럼 추가 (`tutor_unit TINYINT`) |
|---|---|---|
| **구현 방식** | PHP 클래스(`TutorRegionUnit`) + JS 모듈(`tutor-region-unit.js`) | `ALTER TABLE regions ADD COLUMN tutor_unit` DDL 배포 |
| **운영 리스크** | **0 (무중단, 배포 실패 없음)** | 높음 (phpMyAdmin 수동 DDL 누락 시 500 에러) |
| **규칙 변경 유연성** | 코드 배포만으로 즉시 적용 | 매번 UPDATE DDL 작성 및 운영 적용 필요 |
| **성능** | 10자리 코드 기반 O(1) 해시/Set 연산으로 극히 빠름 | DB 컬럼 인덱스 I/O 발생 |
| **추천 근거** | 행안부 10자리 코드가 이미 결정론적이고 예외가 없으므로 스키마 변경 없는 **(가) 방식이 가장 안전하고 우수함** | 메인은 (가) 방식을 채택 |

---

## 4. 역할별 저장 단위 및 적용 범위

### (1) 역할별 저장 단위 비교표

| 저장 위치 | 의미 | 단위 | 만드는 방법 | 저장 전 검사 |
|---|---|---|---|---|
| `tutor_regions.region_id` | 과외쌤 과외지역 (대표=priority 0, 최대 3) | **과외 단위** (광역시 1개 / 도는 시·군) | 2단계 선택기에서 선택 | `TutorRegionUnit::assertTutorUnit()` |
| `students.preferred_tutor_region_id` | 학생 과외 희망 지역 | **과외 단위** (위와 동일) | 2단계 선택기에서 선택 | `TutorRegionUnit::assertTutorUnit()` |
| `provider_position_subscriptions.city_id` | 과외쌤 유료 노출(Prime·Pick) 축 지역 | **과외 단위** (위와 동일) | 등록 지역 중 1개 선택 | `TutorPositionAxis::requireForTutor()` |
| `study_room_regions.region_id` (+`complex_id`) | 공부방 홍보지역 (1번=대표) | **동** (필수) + 아파트 단지 (선택) | 카카오 주소 -> `RegionEnsure::fromKakao()` | 동 행 생성·조회 |
| `students.preferred_studyroom_region_id` | 학생 공부방 희망 지역 | **동** + 단지 | 카카오 주소 -> 서버 단지 등록 | 동 행 생성·조회 |

### (2) 과외 단위 적용 범위 전체
1. `tutor_regions.region_id` (과외쌤 활동지역 3칸).
2. `students.preferred_tutor_region_id` (학생 과외 희망 지역).
3. `provider_position_subscriptions`의 과외 `city_id` (유료 노출 지역축).
4. 검색 `tutor` 탭: `tutor_region_id` 필터.
5. 과외쌤의 학생 찾기: `preferred_region_id` 필터.
6. 학생 위치 -> 과외 단위 올림: `search-find-surface.js`의 `studentFeedFilters` 등에서 학생의 위치(동/구)를 과외 단위로 올려 과외 피드 매칭.
7. 손님(Guest) 화면 과외쌤 수 집계: 기존 서울 강남구(11680) 기준 -> 서울특별시(11000) 기준으로 광역 단위 집계.
8. 과외쌤 홈 화면: 「과외지역 분포」 막대 차트 및 「우리동네 학생」 수요 매칭.
9. 회원가입/기본등록/마이페이지 지역 선택기: 2단계 캐스케이드 UI.

---

## 5. 유료 노출 정책 (과외쌤 Prime · Pick)

### (1) 판매 및 점유 단위
- **축 키 (SSOT)**: 과외 단위(`city_id`) + 주력과목(`primary_subject_id`).
- **재고 무제한 원칙**: 공부방 Prime은 동네당 3석 매진 정책이나, 과외쌤 Prime·Pick은 광역/시 전체를 커버하므로 **자리 수 제한이 없으며 페이지네이션(Page Numbering)으로 제공**한다.
- **정렬 순서 (현행 유지)**:
  - 동일 티어(Prime 내, Pick 내) 안에서는 기존 정렬 규칙(`latestKeyExpr DESC, id DESC`, 정렬 필터 매칭)을 현행 그대로 유지한다.

### (2) 지역 단위 통합에 따른 기존 구독 합침 원칙
- **현황**: 현재 운영 DB의 모든 과외쌤 계정은 테스트 계정임.
- **통합 원칙**:
  - 만약 동일 과외쌤이 동일 과목으로 여러 구(예: 강남구, 서초구)에 대해 각각 구독을 보유하고 있다가 '서울특별시' 1개 단위로 합쳐질 경우:
  - 기간 겹침을 방지하기 위해 **가장 늦은 만료일(`MAX(end_exclusive_on)`)로 단일화**하거나, 잔여 기간을 단순 합산하여 연장 처리한다.
  - 테스트 계정 환경에서는 `MAX(end_exclusive_on)`으로 묶고 중복 레코드를 정리한다.

---

## 6. 공부방 영역 불변 (변경 없음 명시)

- 공부방 홍보지역은 학생이 걸어서 통학하는 생활권 기준이므로 **동·단지 체계를 100% 그대로 유지**한다.
- 카카오 도로명/지번 주소 검색 기반 `RegionEnsure::fromKakao()` 동 행 생성·연동 불변.
- 공부방 Prime/Pick의 동 단위 점유 및 Prime 최대 3석 매진 정책 불변.
- 공부방과 과외의 단위가 완전히 분리되어 상호 간섭이 발생하지 않는다.

---

## 7. 갱신된 레드라인

1. **정본 선행 원칙**: 과외 단위를 변경하려면 반드시 이 정본 문서(`72-region-unit-lock.md`)를 먼저 개정하고 사용자 승인을 받는다. 다른 기능 개발이나 가입 폼 수정에 끼워 단위를 변경하는 것을 엄격히 금지한다.
2. **서버 저장 전 과외 단위 검증**: 과외 지역(`tutor_regions`, `students.preferred_tutor_region_id`, `provider_position_subscriptions.city_id`)을 저장하는 모든 경로는 서버에서 `TutorRegionUnit::assertTutorUnit()` 검사를 필수로 거친다.
3. **이관 SQL 동반 원칙**: 단위 정책이 변경되면 코드 변경과 함께 기존 DB 데이터를 안전하게 이전하는 **점검·이관·중복제거 SQL**을 반드시 함께 배포한다.
4. **부드러운 오류 처리 (안내 + 링크)**: 화면은 옛 단위를 마주쳤을 때 422 충돌이나 빈칸(「—」)을 내지 않고, 「과외지역을 다시 선택해 주세요 (광역시 또는 시·군)」 안내와 수정 링크를 노출한다.
5. **`is_selectable` 격리**: `regions.is_selectable`은 공부방 전용이므로 과외 단위 판정 조건으로 직접 사용하지 않는다.

---

## 8. 화면 UI 및 문구 정책

### (1) 2단계 선택기 인터랙션
- **1단계 (시·도 선택)**:
  - 특별시·광역시·세종(서울, 부산, 인천, 대구, 대전, 울산, 광주, 세종)을 선택하면 -> **선택 즉시 완료** (2단계 드롭다운 비활성화 또는 숨김).
  - 도(경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)를 선택하면 -> 2단계(시·군 드롭다운)가 열림.
- **2단계 (시·군 선택)**:
  - 도 산하 시·군 목록 노출 (수원시, 성남시 등 상위 시 13개 노출, 일반구 노출 없음). 선택 시 완료.

### (2) 안내 문구
- **옛 값 안내 표준 문구**: `「과외지역을 다시 선택해 주세요 (광역시 또는 시·군)」`
- **수정 링크**: `과외지역 수정` 버튼 (`#/mypage/registrations/tutors/{id}/basic`).

### (3) 현재 브랜치의 「구(시·군)까지」 문구 변경 대상 목록
다음 파일들의 문구를 새 표준 문구로 교체해야 한다:
1. `preview/home-ui/src/tutor-activity-chart.js` (144행): `활동지역을 구(시·군)까지 다시 선택해 주세요` -> `활동지역을 다시 선택해 주세요 (광역시 또는 시·군)`
2. `preview/search-ui/src/search-find-surface.js` (2533행): `TUTOR_HOME_STUDENT_COPY.reselect` 노출부
3. `preview/home-ui/src/student-reg/student-reg-copy.js`: `reselect` 문구 정의
4. `preview/home-ui/src/tutor-home-seed.js`: catch 메시지 및 주석 내 `구(시·군)` 표현

---

## 9. 사용자 이관 SQL (배포 전후 phpMyAdmin 실행 가이드)

운영 DB 접속 권한이 없으므로, 사용자가 phpMyAdmin에서 다음 4단계를 순서대로 실행한다.

### 1단계: 사전 점검 SELECT (현재 비과외 단위 참조 현황 확인)
```sql
-- 1-A. 과외쌤 등록지역 중 과외 단위가 아닌 것 (구 단위, 옛 동, 시 대표 등)
SELECT tr.id, tr.tutor_id, tr.priority_order, tr.is_primary, tr.region_id,
       r.sido_name, r.sigungu_name, r.dong_name, r.unit_level, r.official_code
FROM tutor_regions tr
JOIN regions r ON r.id = tr.region_id
WHERE NOT (
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','29','30','31','36'))
  OR (r.unit_level = 'sigungu' AND (r.sigungu_name NOT LIKE '% %구'))
)
ORDER BY tr.tutor_id, tr.priority_order;

-- 1-B. 학생 과외 희망지역 중 과외 단위가 아닌 것
SELECT s.id, s.public_display_name, s.preferred_tutor_region_id,
       r.sido_name, r.sigungu_name, r.dong_name, r.unit_level
FROM students s
JOIN regions r ON r.id = s.preferred_tutor_region_id
WHERE NOT (
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','29','30','31','36'))
  OR (r.unit_level = 'sigungu' AND (r.sigungu_name NOT LIKE '% %구'))
);

-- 1-C. 과외 유료 구독 중 과외 단위가 아닌 것
SELECT pps.id, pps.provider_id, pps.city_id, r.sido_name, r.sigungu_name
FROM provider_position_subscriptions pps
JOIN regions r ON r.id = pps.city_id
WHERE pps.provider_type = 'tutor'
  AND NOT (
    (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','29','30','31','36'))
    OR (r.unit_level = 'sigungu' AND (r.sigungu_name NOT LIKE '% %구'))
  );
```

### 2단계: 과외 단위로 매핑 UPDATE

```sql
-- 2-A. 특별시·광역시·세종 내 구/군/동/시대표 -> 해당 시도 행(official_code='XX00000000')으로 이관
UPDATE tutor_regions tr
JOIN regions r ON r.id = tr.region_id
JOIN regions target ON target.sido_code = r.sido_code
                   AND target.unit_level = 'sido'
                   AND target.official_code = CONCAT(r.sido_code, '00000000')
SET tr.region_id = target.id
WHERE r.sido_code IN ('11','26','27','28','29','30','31','36')
  AND r.unit_level != 'sido';

UPDATE students s
JOIN regions r ON r.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = r.sido_code
                   AND target.unit_level = 'sido'
                   AND target.official_code = CONCAT(r.sido_code, '00000000')
SET s.preferred_tutor_region_id = target.id
WHERE r.sido_code IN ('11','26','27','28','29','30','31','36')
  AND r.unit_level != 'sido';

UPDATE provider_position_subscriptions pps
JOIN regions r ON r.id = pps.city_id
JOIN regions target ON target.sido_code = r.sido_code
                   AND target.unit_level = 'sido'
                   AND target.official_code = CONCAT(r.sido_code, '00000000')
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND r.sido_code IN ('11','26','27','28','29','30','31','36')
  AND r.unit_level != 'sido';

-- 2-B. 도 지역 내 일반구(수원시 영통구 등) -> 상위 시(수원시 등) 행으로 이관
UPDATE tutor_regions tr
JOIN regions r ON r.id = tr.region_id
JOIN regions target ON target.sido_code = r.sido_code
                   AND target.unit_level = 'sigungu'
                   AND target.official_code = CONCAT(SUBSTRING(r.sigungu_code, 1, 4), '000000')
SET tr.region_id = target.id
WHERE r.sido_code NOT IN ('11','26','27','28','29','30','31','36')
  AND r.unit_level = 'sigungu'
  AND r.sigungu_name LIKE '% %구';

UPDATE students s
JOIN regions r ON r.id = s.preferred_tutor_region_id
JOIN regions target ON target.sido_code = r.sido_code
                   AND target.unit_level = 'sigungu'
                   AND target.official_code = CONCAT(SUBSTRING(r.sigungu_code, 1, 4), '000000')
SET s.preferred_tutor_region_id = target.id
WHERE r.sido_code NOT IN ('11','26','27','28','29','30','31','36')
  AND r.unit_level = 'sigungu'
  AND r.sigungu_name LIKE '% %구';

UPDATE provider_position_subscriptions pps
JOIN regions r ON r.id = pps.city_id
JOIN regions target ON target.sido_code = r.sido_code
                   AND target.unit_level = 'sigungu'
                   AND target.official_code = CONCAT(SUBSTRING(r.sigungu_code, 1, 4), '000000')
SET pps.city_id = target.id
WHERE pps.provider_type = 'tutor'
  AND r.sido_code NOT IN ('11','26','27','28','29','30','31','36')
  AND r.unit_level = 'sigungu'
  AND r.sigungu_name LIKE '% %구';
```

### 3단계: 슬롯 중복 제거 및 `is_primary` 보존 / `priority_order` 재정렬
단위가 합쳐지면서 동일 과외쌤에게 동일 단위가 중복 등록된 경우를 정리한다:
```sql
-- 3-A. 중복 슬롯 중 is_primary=1이 하나라도 있으면 최소 priority_order 행에 is_primary=1 부여
UPDATE tutor_regions tr
JOIN (
  SELECT tutor_id, region_id, MIN(priority_order) AS min_order
  FROM tutor_regions
  GROUP BY tutor_id, region_id
  HAVING COUNT(*) > 1
) dup ON dup.tutor_id = tr.tutor_id AND dup.region_id = tr.region_id
JOIN (
  SELECT tutor_id, region_id, MAX(is_primary) AS has_primary
  FROM tutor_regions
  GROUP BY tutor_id, region_id
  HAVING COUNT(*) > 1
) prim ON prim.tutor_id = tr.tutor_id AND prim.region_id = tr.region_id
SET tr.is_primary = prim.has_primary
WHERE tr.priority_order = dup.min_order;

-- 3-B. 최소 priority_order 행을 제외한 나머지 중복 행 삭제
DELETE tr FROM tutor_regions tr
JOIN (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY tutor_id, region_id ORDER BY priority_order ASC, id ASC) AS rn
  FROM tutor_regions
) ranked ON ranked.id = tr.id
WHERE ranked.rn > 1;

-- 3-C. 남은 슬롯의 priority_order를 0, 1, 2로 재정렬 (MySQL 8 윈도우 함수)
UPDATE tutor_regions tr
JOIN (
  SELECT id, (ROW_NUMBER() OVER(PARTITION BY tutor_id ORDER BY priority_order ASC, id ASC) - 1) AS new_order
  FROM tutor_regions
) renum ON renum.id = tr.id
SET tr.priority_order = renum.new_order;
```

### 4단계: 사후 점검 SELECT (모두 0건이어야 정상 완료)
```sql
-- 4-A. 비과외단위 참조 확인 (0건이어야 함)
SELECT COUNT(*) AS invalid_tutor_regions
FROM tutor_regions tr
JOIN regions r ON r.id = tr.region_id
WHERE NOT (
  (r.unit_level = 'sido' AND r.sido_code IN ('11','26','27','28','29','30','31','36'))
  OR (r.unit_level = 'sigungu' AND (r.sigungu_name NOT LIKE '% %구'))
);

-- 4-B. 과외쌤당 동일 지역 중복 확인 (0건이어야 함)
SELECT tutor_id, region_id, COUNT(*) AS cnt
FROM tutor_regions
GROUP BY tutor_id, region_id
HAVING cnt > 1;

-- 4-C. 과외쌤당 priority_order 중복 확인 (0건이어야 함)
SELECT tutor_id, priority_order, COUNT(*) AS cnt
FROM tutor_regions
GROUP BY tutor_id, priority_order
HAVING cnt > 1;
```

---

## 10. 자동 검사 갱신 계획

차기 코드 구현 단계에서 다음 검사 스크립트들이 과외 단위 기준으로 갱신된다:

1. **`scripts/verify-region-unit-lock.mjs`**:
   - `assertSelectable` 호출 검사를 `TutorRegionUnit::assertTutorUnit` 검사로 전환.
   - `regions.is_selectable` 의존 제거 및 과외 단위 판정(광역 시도 행, 도 시·군 행) 검사로 변경.
   - 2단계 캐스케이드 UI 인터랙션 및 문구 검증 추가.
2. **`scripts/verify-region-unit-selectable-payload.php`**:
   - 서버 슬롯 페이로드 검사를 과외 단위 기준 true/false 신호로 갱신.
3. **`scripts/verify-tutor-home-student-tab.mjs`**:
   - 노원구(118) 등 특정 구 단위 호출 테스트를 서울특별시(11) 등 광역 단위 호출로 갱신.
4. **`scripts/verify-tutor-box-real-values.mjs` 및 `verify-mypage-account-region.mjs`**:
   - 구 라벨 대신 광역/상위 시 라벨 검증으로 정렬.

---

## [부록] 영향 파일 전체 목록 (코드 분석 전수 조사)

| 파일:줄 | 현재 하는 일 | 바꿀 내용 | 깨질 수 있는 검사 |
|---|---|---|---|
| `src/Region/SidoRegionEnsure.php:33` | `is_selectable = 1` 구 단위 도시 목록 반환 (`ensureAndListCities`) | 과외 단위 목록(광역 8 + 도 시군 153 = 161개) 반환으로 교체 | `verify-region-unit-lock.mjs` |
| `src/Region/SidoRegionEnsure.php:52` | `assertSelectable()`: `is_selectable = 1` 여부로 422 검사 | `assertTutorUnit()`: 과외 단위 여부(광역 시도 / 도 시군) 검사로 변경 | `verify-region-unit-lock.mjs` |
| `src/Search/SearchService.php:745` | `tutor_region_id`를 `selectableRegionId`(구 단위)로 검증 | 과외 단위 ID 검증(`tutorUnitRegionId`)으로 변경 | `verify-position-region-tier.php` |
| `src/Search/SearchService.php:956` | 학생 찾기 `preferred_region_id`를 `selectableRegionId`로 검증 | 과외 단위 ID 검증으로 변경 | `verify-tutor-home-student-tab.mjs` |
| `src/Search/SearchService.php:1220` | 손님 홈 강남구(11680) 기준 과외쌤 수 집계 (`guestAxisCounts`) | 서울특별시(11000) 기준 집계로 변경 | 손님 홈 피드 검사 |
| `src/Search/SearchService.php:1456` | `tutorTierScope()`: 구 단위 `city_id`로 티어 매칭 | 과외 단위 `city_id`로 티어 매칭 | `verify-position-region-tier.php` |
| `src/Paid/TutorPositionAxis.php:55` | `city_id`를 구 단위로 검증 및 라벨 생성 | 과외 단위 검증 및 광역/상위시 라벨 생성으로 변경 | `verify-position-region-tier.php` |
| `src/Registration/TutorHubRepository.php:165` | `is_selectable = 1`로 `region_selectable` 플래그 계산 | 과외 단위 판정 로직으로 `region_selectable` 계산 | `verify-region-unit-selectable-payload.php` |
| `src/Tutor/TutorRegisterService.php:360` | `is_selectable = 1`로 `region_selectable` 플래그 계산 | 과외 단위 판정 로직으로 `region_selectable` 계산 | `verify-region-unit-selectable-payload.php` |
| `src/Auth/BasicRegisterService.php:269,889` | 회원가입 시 과외지역을 `assertSelectable`로 검증 | `assertTutorUnit`으로 검증 | `verify-tutor-signup-seed.mjs` |
| `src/Registration/StudentHubRepository.php:430` | 학생 희망지역 저장 시 `assertSelectable` 검증 | `assertTutorUnit`으로 검증 | `verify-student-mypage-hope-region.mjs` |
| `src/Registration/StudentBasicCompleteness.php:53` | 학생 희망지역 존재 여부 확인 | 과외 단위 적격성 포함 검사로 보강 | 학생 가입 completeness 검사 |
| `src/Paid/ProviderCheckoutService.php:116` | 과외 결제 시 `city_id`를 구 단위로 축 연결 | 과외 단위 축 연결로 변경 | 결제 검증 스크립트 |
| `src/Paid/ProviderTicketRepository.php:657` | 과외 티켓 발급 시 `city_id` 저장 | 과외 단위 `city_id` 저장 | 결제 티켓 검증 |
| `preview/shared/korea-sidos.js:15` | 광역/도 정적 정의 및 시·군 정적 옵션 배제 | 광역 1단계 확정 지원 및 과외 단위 옵션 빌더 제공 | `verify-tutor-region-label.mjs` |
| `preview/shared/region-cascade.js:70` | 3단계(시도-시군-일반구) 캐스케이드 UI 드롭다운 | 2단계(광역은 1단계 완료, 도는 시군 완료) 캐스케이드로 단순화 | `verify-mypage-account-region.mjs` |
| `preview/shared/tutor-region-slots.js:28` | 슬롯 검증 시 구 단위 목록 기반 `needsReselect` 계산 | 과외 단위 목록 기반 `needsReselect` 계산 | `verify-region-unit-lock.mjs` |
| `preview/home-ui/src/tutor-reg/city-units.js:9` | 클라이언트 도시 단위 캐시 (구 단위 포함) | 과외 단위 캐시(광역 시도 + 도 시군)로 정비 | `verify-tutor-box-real-values.mjs` |
| `preview/home-ui/src/tutor-home-seed.js:171` | `region_selectable` 및 422 기반 학생 수요 로드 | 과외 단위 기반 로드 및 `구(시·군)` 주석 정정 | `verify-tutor-home-student-tab.mjs` |
| `preview/home-ui/src/tutor-activity-chart.js:144` | 차트 내 `활동지역을 구(시·군)까지 다시 선택해 주세요` 안내 | `활동지역을 다시 선택해 주세요 (광역시 또는 시·군)` 문구로 교체 | `verify-region-unit-lock.mjs` |
| `preview/search-ui/src/search-find-surface.js:2533` | 학생 탭 안내 문구 및 과외지역 수정 링크 렌더링 | 새 표준 안내 문구 반영 | `verify-tutor-home-student-tab.mjs` |
| `preview/search-ui/src/search-api.js:168` | 422 오류에 `status`/`error` 주입 | 현행 유지 (과외 단위 422 방어에 활용) | — |
| `preview/auth-ui/src/screens/signup-basic.js:655` | 가입 시 과외지역 3단계 캐스케이드 수집 | 2단계 캐스케이드 수집으로 변경 | `verify-tutor-signup-seed.mjs` |
| `src/Views/auth/partials/basic-tutor.php:32` | SSR 가입 폼 과외지역 셀렉트 박스 | 2단계 선택 또는 과외 단위 셀렉트로 변경 | — |
| `src/Views/auth/partials/basic-student.php:55` | SSR 가입 폼 학생 희망지역 | 학생 과외 희망지역 과외 단위 연동 | — |
| `preview/home-ui/src/student-reg/screens.js:290` | 학생 마이페이지 희망지역 렌더링 | 과외 단위 2단계 선택기로 변경 | `verify-student-mypage-hope-region.mjs` |
| `.github/workflows/deploy.yml:50` | 배포 전 게이트 스크립트 실행 | 갱신된 `verify-region-unit-lock.mjs` 검사 유지 | CI 워크플로 전체 |
