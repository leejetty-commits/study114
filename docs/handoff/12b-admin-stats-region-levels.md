# 12b — 관리자 「통계」 지역표 3단계 (시·도 → 시·군·구 → 구) — Cursor 작업 지시서

- 작성: 2026-11-19 01:40 (KST) · 우동공과3
- 코드 기준: `origin/main` **bd8f9fc8** (PR #266 머지, 12 통계 최소판). 시작 전에 `git fetch`를 하고, main이 달라졌으면 0단계에서 보고한다.
- 종현 결정(2026-11-19 01:32 KST, 확정)
  1. **1단계 = 시·도 전부**를 같은 층에 둔다. 특별시, 광역시, 특별자치시, 도, 특별자치도가 모두 여기에 들어간다.
  2. **2단계 = 그 시·도 아래 시·군·구**. 구가 없는 시나 군은 한 줄로 끝난다.
  3. **구가 있는 시**(예: 수원시)는 2단계에 **한 줄(구 합계)**로 나오고, 누르면 **3단계 = 그 시의 구**(장안구, 권선구 …)가 펼쳐진다.
  4. 구가 있는 시를 1단계로 끌어올리지 **않는다**.
- 화면: `/admin/stats`의 「시·도」 표(섹션 C) **하나만** 바꾼다. 칸은 지금과 같다(공부방, 과외쌤, 학생, 프라임, 픽). 「미분류」와 「합계」 줄은 그대로 둔다.
- 성격: 읽기 전용 집계다. **스키마 변경, 새 표, 인덱스, 새 API 파일, CSS 파일 없음.** 다른 화면과 다른 API는 손대지 않는다.
- 같이 쓰는 확인용 SQL: `docs/handoff/12b-region-check.sql` (종현이 phpMyAdmin에서 읽기만 한다)

---

## 0단계 — 먼저 진단만 하고 보고한 뒤 작업

코드를 고치기 전에 아래를 확인하고 **한 번 보고**한다. 승인이 나기 전에는 고치지 않는다.

1. `git fetch` 후 `origin/main`이 bd8f9fc8인지 확인한다. 다르면 아래 「확인된 코드 사실」의 줄 번호를 다시 본다.
2. 아래 「허용 파일」 밖의 파일을 고쳐야 할 것 같으면 **즉시 멈추고 보고**한다. 고치지 않는다.
3. 아래 「확인된 코드 사실」을 코드에서 직접 보고 한 줄씩 「확인됨 / 다름(파일:줄)」으로 보고한다.
4. 아래 「분류 규칙」이 실제 코드·시드와 어긋나는 경우(예: 구 이름이 다른 칸에 저장되는 경로가 있음)가 있으면 보고한다.
5. 보고 형식: 「확인됨 / 다름(파일:줄) / 멈춤 사유」.

---

## 허용 파일 (이 3개만)

1. `src/Admin/AdminStatsRepository.php` (수정)
2. `preview/home-ui/src/admin/a28-stats.js` (수정)
3. `docs/worklog/2026/11/2026-11-19-admin-stats-region-levels.md` (새 작업 기록)

- `public/api/admin/stats.php`는 고치지 않는다. `summary()` 결과를 그대로 돌려주기 때문이다(`stats.php:30`).
- `src/Region/*`는 **읽기만** 한다. `TutorRegionUnit`의 상수를 `use`로 불러 쓰는 것은 괜찮지만, 그 파일은 고치지 않는다.
- CSS 파일은 새로 만들지도 고치지도 않는다. 들여쓰기는 글자(예: 「└ 」)와 기존 클래스로만 한다.

---

## 확인된 코드 사실 (origin/main bd8f9fc8)

### regions 표 구조
- `sql/schema/001_init.sql:25-41`: `regions`에는 `sido_code`, `sido_name`, `sigungu_code`, `sigungu_name`, `dong_code`, `dong_name` 칸이 있다. **시·군·구는 `sigungu_name` 한 칸이다.** 구 이름을 따로 담는 칸은 없다.
- `sql/schema/072_region_unit_level.sql:19,28,37`: 칸이 더 생겼다. `unit_level`(`sido`, `sigungu`, `dong`), `official_code`(법정동코드 10자리, 2026-07-01 기준), `is_selectable`이다.
- `sql/schema/073_region_official_seed.sql`: 공식 행 284개다(시도 16개, 시군구 268개).
  - 구가 있는 시의 구는 **`sigungu_name = '수원시 장안구'`처럼 시와 구를 공백 하나로 붙여 한 칸**에 저장한다. 예는 `:128-131`(수원시 4구), `:141-143`(부천시 3구), `:184-187`(청주시), `:243-247`(창원시)이다.
  - 그 상위 시는 별도 행이다. `sigungu_name = '수원시'`, `is_selectable = 0`이다(`:127`, `:140`, `:183`, `:199`, `:217`, `:242`, `:288`).
  - 073 기준으로 구가 있는 시는 **13개**다. 경기도의 수원·성남·안양·부천·안산·고양·용인·화성, 충청북도 청주, 충청남도 천안, 경상북도 포항, 경상남도 창원, 전북특별자치도 전주다. 일반구 행은 39개다.
  - 이 목록은 지시서에 박아 넣지 않는다. **데이터에서 뽑는다**(아래 규칙 R2).
  - 시·도 행은 `sigungu_name = ''`이다(`:20` 서울특별시 등). 예외는 세종이다. `:125`는 `sido_name = sigungu_name = '세종특별자치시'`이다.
  - 제주시와 서귀포시는 공백 없는 단일 시 행이다(`:266-267`).
  - 073의 시·도 이름에는 `전남광주통합특별시`(`:46`), `강원특별자치도`(`:268`), `전북특별자치도`(`:287`)가 있다. `광주광역시`와 `전라남도` 행은 없다.
- `sql/schema/078_tutor_unit_gwangju.sql`: 과외 단위용 `전남광주통합특별시` / `sigungu_code = '12200'` / `sigungu_name = '광주'` 행이 1개 있다(`official_code` NULL). 옛 광주 5개 구는 `sigungu_code` 12210·12240·12270·12300·12330이고, 이름은 `동구`, `서구`, `남구`, `북구`, `광산구`다(`TutorRegionUnit.php:31`, `:36`).
- `src/Region/RegionEnsure.php:24`, `:39`, `:65`: 공부방이 고른 동 행은 카카오 우편번호 결과로 런타임에 INSERT된다. `sigungu_name`에는 카카오 `sigungu` 값이 **그대로** 들어간다. 시·도 이름만 `RegionAlias::canonicalSido`로 정식명으로 바꾼다.
  - `RegionAlias.php:29`, `:51-52`: 카카오 동 행에는 `광주광역시`, `전라남도` 같은 옛 시·도 이름이 남아 있을 수 있다. 운영 DB 확인이 필요하며, 확인용 SQL (1)로 본다.

### 카드가 가리키는 지역 행 (역할별로 다르다)
- **공부방:** `study_room_regions.slot = 1` → **동 행**(카카오)이다(`AdminStatsRepository.php:152-158`). `sigungu_name`이 '수원시 장안구' 꼴이면 3단계까지 내려간다.
- **과외쌤:** `tutor_regions.priority_order = 0` → **과외 단위 행**이다(`AdminStatsRepository.php:160-166`, `TutorRegionUnit.php:13-18`).
  - 광역시와 세종은 **시·도 행 하나**다(`sigungu_name` = '' 또는 세종). 그래서 2단계로 나눌 수 없다.
  - 도의 시·군은 시·군 행이고, 구가 있는 시는 **상위 시 행**('수원시')이다. 그래서 3단계로 나눌 수 없다.
  - `TutorRegionUnit.php:66-67`: 이름에 공백이 있으면 일반구 행이고, 과외 단위가 아니다.
- **학생:** 과외 희망이면 과외 단위 행이고, 공부방 희망이면 공부방 쪽 행이다(`AdminStatsRepository.php:168-173`).
- **프라임·픽:** 공부방이나 과외쌤 카드의 대표 지역을 따른다(`AdminStatsRepository.php:340-369`). 카드 미지정(provider_id NULL)은 미분류다(`:370-381`).

### 지금 섹션 C를 만드는 곳
- `AdminStatsRepository.php:288-420` `regions()`
  - 역할별 쿼리 5개가 모두 `GROUP BY reg.sido_name`이다(`:316-321`, `:324-329`, `:332-337`, `:340-349`, `:357-362`).
  - `$add($sido, $field, $n)`가 시·도 한 단계 `$map`에 더한다(`:293-306`). 빈 시·도는 `$unclassified`로 간다.
  - 정렬은 `SELECT DISTINCT sido_name … ORDER BY sido_name`이다(`:383-403`). 합계는 `:405-413`이다.
  - 반환은 `{rows: [{sido, study_room, tutor, student, prime, pick}], unclassified, total}`이다(`:415-419`).
- `AdminStatsRepository.php:91`: `'regions' => $this->regions()`. 다른 곳에서는 regions 결과를 쓰지 않는다. rg 결과 소비처는 `a28-stats.js`뿐이다.
- `a28-stats.js:70-73` `regionCells(label, row)`, `:158-170` 「시·도」 표를 그린다(`rows`, 그다음 `미분류`, 그다음 `합계`).
- `a28-stats.js:268-301` `bindStats`: `box` 하나에 click 위임을 건다(`:296-299`, `[data-stats-days]`). 펼침 토글은 **같은 리스너 안에** 분기 하나를 더 넣는다.

---

## 분류 규칙 (서버 PHP에서 한다)

각 카드의 대표 지역 행 `(sido_name, sigungu_name, sigungu_code)`를 아래 순서대로 판정한다. 쿼리 5개의 `GROUP BY`를 `reg.sido_name, reg.sigungu_name, reg.sigungu_code`로 넓히고, SELECT에도 같은 칸을 넣는다. `COUNT`의 뜻은 그대로 둔다.

- **R0. 1단계(L1):** `sido_name`(trim)을 그대로 쓴다. 비거나 NULL이면 **미분류**다(지금과 같다).
- **R1. 이름 정리:** `$sg = trim(sigungu_name)`. 공백이 여러 칸이면 하나로 줄인다. `$sg === ''`이거나 `$sg === sido_name`(세종 시·도 행)이면 **2단계 = 「시·군·구 미지정」**이고 3단계는 없다.
- **R2. 구가 있는 시 목록(데이터에서 뽑는다):** 요청마다 한 번 아래 쿼리를 돌려 `[sido_name][시이름] = true` 집합을 만든다.
  `SELECT DISTINCT sido_name, TRIM(sigungu_name) AS sg FROM regions WHERE sigungu_name LIKE '% %'`
  각 `sg`가 `/^(\S+시) (\S+구)$/u`에 맞으면 앞 토큰이 「구가 있는 시」다.
- **R3. 일반구 행:** `$sg`가 `/^(\S+시) (\S+구)$/u`에 맞으면 **2단계 = 시(앞 토큰), 3단계 = 구(뒤 토큰)**다. 예: '수원시 장안구' → 수원시 › 장안구.
- **R4. 전남광주 광주:** `sido_name = '전남광주통합특별시'`인 행이 둘 중 하나에 해당하면 **2단계 = 「광주」**로 묶는다. 이것은 구가 있는 시와 같은 취급이다.
  - `sigungu_code`가 `TutorRegionUnit::GWANGJU_GU_CODES`에 있으면 3단계 = 그 구 이름이다.
  - `sigungu_code = TutorRegionUnit::GWANGJU_SIGUNGU_CODE`(12200)이면 3단계 = 「구 미지정」이다.
  - `sido_name = '광주광역시'`(카카오 옛 이름)는 R4가 아니라 **별도 1단계**로 남는다. 시·도 이름은 바꾸지 않는다.
- **R5. 구가 있는 시의 상위 행:** `$sg`가 R2 집합의 `[sido_name][$sg]`에 있으면(예: 과외쌤 '수원시' 행) **2단계 = 그 시, 3단계 = 「구 미지정」**이다.
- **R6. 나머지:** 2단계 = `$sg` 하나이고, 3단계는 없다. 구가 없는 시, 군, 광역시의 구·군이 여기에 들어간다.

**합계 규칙**
- 1단계 줄 = 그 아래 2단계 합이다.
- 3단계가 있는 2단계 줄 = 그 아래 3단계 합이다.
- 전체 「합계」 = 1단계 합 + 미분류다(지금과 같다).
- 이 등식이 깨지면 안 된다. 작업 기록에 검산 결과를 적는다.

**정렬**
- 1단계는 지금과 같다(DB의 `ORDER BY sido_name`).
- 2단계와 3단계는 이름 오름차순이고, 「시·군·구 미지정」과 「구 미지정」은 맨 끝에 둔다.

---

## 반환 모양 (`summary()['regions']`)

```json
{
  "rows": [
    { "sido": "경기도", "study_room": 3, "tutor": 2, "student": 1, "prime": 1, "pick": 0,
      "children": [
        { "name": "수원시", "study_room": 2, "tutor": 1, "student": 0, "prime": 1, "pick": 0,
          "children": [
            { "name": "장안구", "study_room": 2, "tutor": 0, "student": 0, "prime": 1, "pick": 0 },
            { "name": "구 미지정", "study_room": 0, "tutor": 1, "student": 0, "prime": 0, "pick": 0 }
          ] },
        { "name": "광주시", "study_room": 1, "tutor": 1, "student": 1, "prime": 0, "pick": 0, "children": [] }
      ] }
  ],
  "unclassified": { "...": "지금과 같음" },
  "total": { "...": "지금과 같음" }
}
```
- 기존 키(`sido`와 숫자 5개, `unclassified`, `total`)는 그대로 두고 `children`만 더한다.

---

## 화면 (`a28-stats.js`)

- 표 제목 「시·도」를 **「지역」**으로 바꾸고, 첫 칸 머리글도 「지역」으로 바꾼다. 다른 칸은 그대로 둔다.
- **1단계 줄:** 첫 칸에 `<button type="button" data-stats-region-toggle="r{i}" aria-expanded="false">▸ 경기도</button>`를 둔다(2단계가 있을 때만). 숫자는 소계다.
- **2단계 줄:** `<tr data-stats-region-parent="r{i}" hidden>`이고, 첫 칸은 「└ 수원시」다. 3단계가 있으면 같은 방식의 토글 버튼(`r{i}-{j}`)을 단다.
- **3단계 줄:** `<tr data-stats-region-parent="r{i}-{j}" hidden>`이고, 첫 칸은 「　　└ 장안구」다.
- 처음에는 **모두 접힌 상태**다(1단계 줄만 보인다).
- 토글은 `bindStats`의 기존 click 리스너(`:296-299`) 안에 `[data-stats-region-toggle]` 분기를 더한다.
  - 펼치면 바로 아래 자식만 보인다.
  - 접으면 그 아래 손자까지 모두 `hidden`으로 돌리고, 자식 버튼의 `aria-expanded`도 false로 되돌린다.
  - 버튼 글자 ▸와 ▾를 바꾼다.
- 「미분류」와 「합계」 줄은 지금처럼 맨 아래에 둔다(토글 없음).
- 이름은 지금처럼 `esc()`를 거친다. 새 CSS는 없다. 버튼은 기존 클래스(예: `btn btn--secondary btn--sm` 또는 링크형 기존 클래스)만 쓴다. 0단계에서 어떤 클래스를 쓸지 보고한다.
- 날짜 버튼(7/14/30)을 누르면 표가 다시 그려지므로 접힌 상태로 돌아간다. 그래도 된다.

---

## 하지 않는 것

- 시·도 이름을 합치거나 고치지 않는다(예: 광주광역시와 전남광주통합특별시를 합치지 않음). 이름은 DB 그대로 보여 준다.
- 다른 섹션(상단 카드, 가입, 결제, 후보 목록의 `regionText`)은 손대지 않는다.
- 공부방의 2~3번째 지역(slot 2, 3)과 과외쌤 2순위 이후 지역은 넣지 않는다. 지금처럼 대표 지역만 센다.
- 운영 DB에 쓰지 않는다. SQL 파일을 실행하지 않는다.

---

## 검사·완료 조건

1. `php -l src/Admin/AdminStatsRepository.php`를 돌린다. PHP가 없으면 「미실행(php 없음)」이라고 적는다.
2. 가능하면 sqlite나 임시 DB에 073과 078 시드를 넣고, 아래 가짜 카드로 `regions()` 결과를 확인한다(이름은 가짜). 불가하면 사유를 적는다.
   - 공부방: 동 행 sigungu '수원시 장안구' → 경기도 › 수원시 › 장안구
   - 과외쌤: '수원시' 단위 행 → 경기도 › 수원시 › 구 미지정
   - 과외쌤: 서울특별시 시·도 행 → 서울특별시 › 시·군·구 미지정
   - 세종 시·도 행 → 세종특별자치시 › 시·군·구 미지정
   - 전남광주 '광주'(12200) → 전남광주통합특별시 › 광주 › 구 미지정
   - 전남광주 광산구(12330) → 전남광주통합특별시 › 광주 › 광산구
   - 경기도 광주시 → 경기도 › 광주시. 3단계는 없고, 전남광주와 섞이지 않아야 한다.
   - 합계 등식이 맞아야 한다.
3. `npm run build:dothome`가 성공해야 한다. 바뀐 추적 산출물은 되돌리고, 산출물은 커밋하지 않는다.
4. Verify bundle의 기존 실패 4건(Hide inquiry, Tutor search fields, Tutor basic required, Student hope hidden required) 말고 **새 실패가 없어야** 한다.
5. PR, 머지, 배포를 한 뒤 **`git diff --name-only origin/main...HEAD`(머지 전) 결과가 허용 3개와 정확히 같은지** 보고한다. 다르면 머지하지 않고 멈춘다.
6. 작업 기록 `docs/worklog/2026/11/2026-11-19-admin-stats-region-levels.md`에는 아래를 적는다.
   - 이 지시서 경로와 커밋
   - 바꾼 파일
   - 규칙 R0~R6를 어디에 구현했는지(파일:줄)
   - 검사 결과 표
   - 「배포 뒤 종현 확인: 12b-region-check.sql (1)~(4) 결과와 화면 대조」

## 종현 확인 항목 (지시서 범위 밖, 정보용)
- 카카오 동 행의 시·도 이름에 `광주광역시`나 `전라남도`가 남아 있으면 그 이름이 **별도 1단계 줄**로 나온다. 합칠지는 오픈 뒤에 정한다.
- 과외쌤은 단위가 광역시 전체이거나 시 전체이므로, 광역시 아래에서는 「시·군·구 미지정」, 수원시 같은 시 아래에서는 「구 미지정」으로만 잡힌다. 이것은 정상이다(정본 72 과외 단위).
