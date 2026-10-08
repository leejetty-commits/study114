# 2026-10-08 지역 단위 정본 · 과외 지역 옛 값 안내 · 자동 검사

- 브랜치: `cursor/region-unit-lock-20261008` (기준 `691e3e6`)
- 정본: `docs/internal/72-region-unit-lock.md`
- 위험도: 중 (과외쌤 홈 표시, 배포 게이트 추가)
- 발견 경위: 과외쌤 무결성 검사(C1) — 홈 `POST /api/search/search.php` 422 6회

## 사용자 지시 원문

- 18:23 「과외쌤은 시,군,구 단위로 검색이 되는게 맞다.」
- 18:24 「서울시는 광역이기 때문에 하위 구까지 나와야 한다. 구까지 나와야 검색이 된다.」
- 18:28 「저 동이나 아파트단지가 나오는 것은 등록시 자신의 주소를 불러온게 아닌가 싶어... 왜 이런 오류가 났지? 점검이 필요해... 정본도 살펴봐.」
- 18:28 「둘다 테스트계정이야. 여긴 전부 테스트계정만 있어.」
- 18:32 「진행해. 근데, 이 작업을 한 10번은 하는거 같아.」

## 운영 DB 점검 결과 (사용자 실행)

- 정본 4장 A: 7줄 — 3(1→224), 5(1→224, 2→264, 2→264 중복), 9(19→없음, 39→337, 29→317)
- 정본 4장 B: 0줄

## 배포 전후 사용자 할 일

- 과외쌤 쓰기·반응 검사(C4) 종료 뒤 phpMyAdmin:
  ```sql
  DELETE FROM tutor_regions WHERE tutor_id = 5 AND priority_order = 2 AND region_id = 2;
  UPDATE tutor_regions SET region_id = 224 WHERE region_id = 1  AND tutor_id IN (3, 5);
  UPDATE tutor_regions SET region_id = 264 WHERE region_id = 2  AND tutor_id = 5;
  UPDATE tutor_regions SET region_id = 337 WHERE region_id = 39 AND tutor_id = 9;
  UPDATE tutor_regions SET region_id = 317 WHERE region_id = 29 AND tutor_id = 9;
  ```
- 과외쌤 9 대표지역(19 서울특별시)은 마이페이지에서 서울 구를 다시 선택.
- 실행 뒤 정본 4장 A·B·C 재확인.

## 작업 지시서

(하위 에이전트 지시 원문은 아래에 추가)

## 검수 기록

(메인 검수 후 추가)
