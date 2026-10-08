# 72. 지역 단위 정본 — 역할별 저장 단위 · 옛 데이터 점검

- 상태: 정본 (2026-10-08 사용자 확정)
- 사용자 지시 원문:
  - 18:23 「과외쌤은 시,군,구 단위로 검색이 되는게 맞다.」
  - 18:24 「서울시는 광역이기 때문에 하위 구까지 나와야 한다. 구까지 나와야 검색이 된다.」
  - 18:28 「저 동이나 아파트단지가 나오는 것은 등록시 자신의 주소를 불러온게 아닌가 싶어... 왜 이런 오류가 났지? 점검이 필요해... 정본도 살펴봐.」
  - 18:32 「진행해. 근데, 이 작업을 한 10번은 하는거 같아.」
- 배경: `main`에 지역 관련 커밋 59개(2026-10-08 기준). 단위 규칙이 SQL 주석·커밋 메시지에만 있고 정본·자동 검사·옛 데이터 점검 절차가 없어 같은 종류의 오류가 반복됨.

## 1. 역할·항목별 저장 단위 (이 표가 기준)

| 저장 위치 | 의미 | 단위 | 만드는 방법 | 저장 전 검사 |
|---|---|---|---|---|
| `tutor_regions.region_id` | 과외쌤 과외지역(대표=priority 0, 최대 3) | **선택 단위**: 특별시·광역시는 구, 도는 시·군(구 없는 시·군), 광역시 군, 세종 | 지역 목록에서 선택 | `SidoRegionEnsure::assertSelectable()` |
| `students.preferred_tutor_region_id` | 학생 과외 희망 지역 | 선택 단위(위와 같음) | 지역 목록에서 선택 | `SidoRegionEnsure::assertSelectable()` |
| `study_room_regions.region_id` (+`complex_id`) | 공부방 홍보지역(1번=대표) | 동(필수) + 아파트 단지(선택) | 카카오 주소 → `RegionEnsure::fromKakao()` | 동 행 생성·조회 |
| `students.preferred_studyroom_region_id` (+`complex_id`, `_basis`) | 학생 공부방 희망 지역 | 동 + 단지 | 카카오 주소 → 서버 단지 등록 | 동 행 생성·조회 |

- **선택 단위 = `regions.is_selectable = 1 AND is_active = 1`** (073 공식 행정구역 256행). 시·도(`unit_level='sido'`)와 동(`unit_level='dong'`)은 과외 지역이 될 수 없다.
- 공부방이 동·단지인 것은 정상이다(주소 기반 영업장·홍보 동네). 과외는 이동 수업이라 구(시·군) 단위.
- 검색: 과외쌤 찾기 `tutor_region_id`, 학생 찾기(과외) `preferred_region_id`는 **선택 단위 id만 받는다**(`SearchService::selectableRegionId()`, 아니면 422 「지역은 구(시·군)까지 선택해 주세요.」). 저장된 값과 정확히 같은 id로 찾는다(`tr.region_id = :tutor_region_id`).

## 2. 레드라인

1. 과외 지역(`tutor_regions`, `students.preferred_tutor_region_id`)에 쓰는 **모든 경로**는 저장 전 `assertSelectable()`을 거친다. 새 저장 경로를 만들면 같은 검사를 붙인다.
2. 지역 구조(regions 행·단위·선택 여부)를 바꾸는 SQL·코드는 **같은 작업 안에서 옛 데이터 점검(4장)과 이관 SQL**을 함께 낸다. 「정리는 다음 작업에서」 금지.
3. 화면은 선택 단위가 아닌 옛 값을 만나면 오류·빈 값(「—」) 대신 「활동지역을 구(시·군)까지 다시 선택해 주세요」 안내와 수정 화면 링크를 보인다.
4. 공부방 지역에 선택 단위 규칙을, 과외 지역에 동·단지를 섞지 않는다.

## 3. 이번 사고 기록 (2026-10-08 확인)

- 2026-08-04 「시 단위 과외지역」 도입 시 `SidoRegionEnsure::ensure()`가 시마다 `dong_name='시 대표'` 가짜 동 행을 만들었다. 특별시·광역시는 구 없이 「서울특별시」 한 덩어리.
- 2026-10-01 `67b9a63` 구(시·군) 통일(072·073)에서 공식 행 284개 추가·저장/검색 검사 추가. 072 주석 「시 대표 행은 그 기본값 그대로 두고, 정리는 다음 작업에서 한다」 — **그 다음 작업이 없었다.** 기존 `tutor_regions`가 옛 행을 계속 가리킴.
- 운영 DB 결과: 과외쌤 3명 7건(모두 테스트 계정). 1·2번 = 개발 시드 동(대치동·우동), 19번 = 「서울특별시 시 대표」, 29·39번 = 의정부시·남양주시 「시 대표」. 학생 과외 희망 지역은 0건.
- 영향: 해당 과외쌤이 지역 검색에서 빠짐, 과외쌤 홈 「과외지역 분포」 「우리동네 학생」 422.
- 주소 불러오기(카카오)는 공부방·학생 공부방 희망에만 쓰이며 이번 원인이 아님.

## 4. 옛 데이터 점검 (지역 구조 변경 뒤 · 배포 전후 필수, 읽기 전용)

```sql
-- A. 과외쌤 과외지역 중 선택 단위가 아닌 것 (0줄이어야 정상)
SELECT tr.tutor_id, tr.priority_order, tr.is_primary, tr.region_id AS old_id,
       r.sido_name, r.sigungu_name, r.dong_name, r.unit_level,
       p.id AS new_id, p.sigungu_name AS new_name
FROM tutor_regions tr
JOIN regions r ON r.id = tr.region_id
LEFT JOIN regions p
  ON p.sido_name = r.sido_name AND p.sigungu_name = r.sigungu_name
 AND p.is_selectable = 1 AND p.is_active = 1
WHERE r.is_selectable = 0
ORDER BY tr.tutor_id, tr.priority_order;

-- B. 학생 과외 희망 지역 중 선택 단위가 아닌 것 (0줄이어야 정상)
SELECT s.id AS student_id, s.preferred_tutor_region_id AS region_id,
       r.sido_name, r.sigungu_name, r.dong_name
FROM students s
JOIN regions r ON r.id = s.preferred_tutor_region_id
WHERE r.is_selectable = 0;

-- C. 같은 과외쌤에 같은 지역이 두 번 (0줄이어야 정상)
SELECT tutor_id, region_id, COUNT(*) AS n
FROM tutor_regions GROUP BY tutor_id, region_id HAVING n > 1;
```

### 이관 절차 (A·C가 0줄이 아닐 때)

1. C의 중복 줄을 먼저 지운다(낮은 `priority_order` 하나만 남김).
2. A에서 `new_id`가 있는 줄은 `new_id`로 바꾼다. 바꾼 결과가 같은 과외쌤 안에서 중복되면 1번처럼 정리.
3. `new_id`가 비는 줄(예: 「서울특별시 시 대표」)은 SQL로 추측하지 않는다. 본인이 마이페이지에서 구(시·군)를 다시 고른다. 화면은 레드라인 3의 안내를 보인다.
4. 이관 SQL은 사용자가 phpMyAdmin에서 실행한다(Actions는 SQL을 실행하지 않음). 실행 뒤 A·B·C 재확인.

## 5. 자동 검사

- `scripts/verify-region-unit-lock.mjs` (배포 전 게이트): 과외 지역 저장 경로의 `assertSelectable()` 호출, 검색 `selectableRegionId()` 사용, 과외쌤 홈의 옛 값 안내 처리 존재를 소스에서 확인.

## 6. 관련 코드

- 저장: `src/Tutor/TutorRegisterService.php`, `src/Auth/BasicRegisterService.php`, `src/Registration/StudentHubRepository.php`, `src/Region/SidoRegionEnsure.php`, `src/Region/RegionEnsure.php`, `src/StudyRoom/StudyRoomRegisterService.php`
- 검색: `src/Search/SearchService.php` (`selectableRegionId`)
- 과외쌤 홈: `preview/home-ui/src/tutor-activity-chart.js`, `preview/home-ui/src/tutor-home-seed.js`
- SQL: `sql/schema/072_region_unit_level.sql`, `sql/schema/073_region_official_seed.sql`
