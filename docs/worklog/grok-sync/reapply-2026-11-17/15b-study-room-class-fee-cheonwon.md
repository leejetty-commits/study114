# 15b. 공부방 수업 그룹별 월 수업료 — 숫자 입력 + 천원 (화면 천원, DB 원)

작성: 우동공과3(검수). 코드 변경 없음. 문서만. PR만 연다. 머지 금지.
11-18 종현 결정 4(수업 그룹 월 수업료를 숫자+천원으로. 정책 168).

**시작 조건: 15(`15-study-room-mypage-fixes.md`) PR이 머지되고, 운영에서 비밀번호·홍보 지우기·경력 확인이 끝난 뒤.** 그 전에는 시작하지 않는다.
기준: 15 머지 뒤의 `origin/main`(커밋을 0단계에서 적는다).

종현이 아래 「기존 값 확인 SQL」을 먼저 실행해 숫자만 있는 행(35가 35만원인지 35천원인지)을 본 뒤에 백필 SQL을 결정한다. 봇·Cursor는 운영 SQL을 실행하지 않는다.

## 왜 따로 하나

- 입력칸만이 아니라 `study_room_classes.monthly_fee` VARCHAR(100) 기존 서술 값, 공개 마이프로필·상세 표시, 저장 API가 같이 걸린다.
- 15와 `StudyRoomRegisterService.php`를 공유한다. 15가 안정된 뒤 이어서 고친다.
- 월 **평균** 수업료(`monthly_fee_manwon` / `price_amount`)는 이미 천원 입력이다. 이번은 **수업 그룹별** `monthly_fee`만.

## 0단계 (필수) — 먼저 진단하고 보고. 고치기 전에.

1. `git fetch origin && git switch -c work/study-room-class-fee-cheonwon origin/main`. `git log --oneline -5`에 15 PR의 merge 커밋이 있는지 본다. **없으면 멈추고 보고.**
2. 직접 열어 확인:
   - `preview/study-room-ui/src/screens/step-lesson.js` 168~176행: 수업 그룹 「월 수업료」는 `data-field="monthly_fee"` 텍스트, placeholder 「예: 350천원」. 바로 아래 「수업료 설명」(`fee_note`)은 그대로 둘 대상.
   - 같은 파일 241~246행: 월 **평균** 수업료는 이미 `.register-fee-manwon` + 단위 「천원」. 이번 그룹 칸도 이 모양을 따른다. 평균 칸은 고치지 않는다.
   - `preview/shared/fee-cheonwon.js` `cheonwonInputToWon` / `wonToCheonwonInput`(입력×1000=원). **이 파일은 가져다 쓰기만. 수정 금지.**
   - `src/StudyRoom/StudyRoomLessonDetailStore.php` `study_room_classes.monthly_fee VARCHAR(100)`, 저장·조회가 문자열.
   - `src/StudyRoom/StudyRoomRegisterService.php` 2272행 정규화가 문자열 trim, `parseFeeAmount`(2360~2377: `천`×1000, `만`×10000, 숫자만×1000). 지금 그룹 저장에는 안 쓰일 수 있으니 0단계에서 호출 여부를 확인한다.
   - `preview/home-ui/src/study-room-reg/shop-formatters.js` `formatClassFee`(92~100행): 공개 수업 카드 금액. `만`→천원 환산, `천원` 포함 문구, 숫자만이면 `월 N천원`.
   - `shop-view-model.js` 218·232행이 `formatClassFee`로 제목 줄에 금액을 넣음. `myshop-render.js` 116행이 그 제목 줄을 그림. `dt 수업료`는 `fee_note`(설명)다.
   - `StudyRoomPublicReadService.php` 410·428·453·469행이 `monthly_fee` 문자열을 공개 API로 넘김.
3. 찾기 카드·홈 목록·퀵매칭의 가격은 **월 평균**(`price_amount` / `monthly_fee_manwon`)이다. 그룹 `monthly_fee`를 안 쓰면 그 파일은 고치지 않는다. 0단계에서 한 번 더 확인하고, 쓰이는 곳이 더 있으면 멈추고 보고한다.
4. 고칠 줄 목록과, 종현이 돌린 읽기 SQL 결과(숫자만/천/만/기타 건수)가 있으면 그에 맞춰 백필 범위를 적는다. 결과가 없으면 백필 UPDATE는 지시서에 있는 「천원·만원 문구만」으로 한정하고, 숫자만 행은 자동 변환하지 않는다.
5. 문서와 다르거나, 애매하거나, **허용 파일 밖을 고쳐야 할 것 같으면 멈추고 보고한다. 고치지 않는다.**

## 목적

- 수업 그룹별 월 수업료 입력은 과외쌤 월 과외비·공부방 월 평균 수업료와 같이 **숫자 + 단위 「천원」**. 화면은 천원, DB는 원(정책 168, SSOT 13장).
- 기존 VARCHAR 서술 값은 함부로 지우거나 추측 변환하지 않는다. 읽히는 값만 원 컬럼에 옮기고, 안 읽히는 값은 원래 글을 남긴다.

## 마이그레이션 안 (권고: 새 숫자 컬럼, VARCHAR 유지)

`monthly_fee` VARCHAR를 숫자로 바꾸거나, 그 칸에 원 숫자만 넣는 방식은 쓰지 않는다.

이유:
- 「협의」「문의」「30~40만」처럼 숫자로 못 바꾸는 행이 있을 수 있다.
- 숫자만 있는 값(예: `35`)은 옛 만원 입력인지 천원인지 코드만으로 단정할 수 없다.
- 공개 API·`formatClassFee`가 아직 문자열을 읽는다. 한동안 같이 두는 편이 안전하다.

추가할 컬럼:

```sql
monthly_fee_amount INT UNSIGNED NULL COMMENT '월 수업료(원)'
```

`study_room_classes.monthly_fee` 뒤에 둔다. 이 작업에서 컬럼을 지우거나 이름 바꾸지 않는다.

### 기존 값이 화면에 나오는 방식

| 기존 `monthly_fee` | 금액 컬럼 | 입력칸 | 공개 화면 |
|---|---|---|---|
| 빈 값 | NULL | 빈 칸 | 금액 숨김 |
| `350천원`, `월 350천원` | 350000 | 350 | `월 350천원` |
| `35만원` | 350000 | 350 | `월 350천원` (`만`×10→천원, 지금 `formatClassFee`·`parseFeeAmount`와 같음) |
| 숫자만 `350` 또는 `35` | **자동 백필하지 않음**(종현이 목록을 본 뒤 SQL로 결정) | 숫자로 읽히면 천원으로 보여 주되, 저장 전까지 원 컬럼을 추측으로 채우지 않음 | 지금은 `formatClassFee`가 숫자만이면 `월 N천원`으로 보여 줌. 이 표시는 유지하되, `35`가 35만원이었으면 금액이 잘못 보일 수 있음 → SQL 목록으로 종현 확인 |
| `협의` 등 비숫자 | NULL | 빈 칸 + 원래 글을 힌트로만 | 금액을 숨김. `fee_note`(수업료 설명)는 그대로. 원래 글을 공개 금액으로 추측해 보여 주지 않음 |

저장 규칙:
- 숫자칸에 값이 있으면: `monthly_fee_amount` = 천원×1000(원), `monthly_fee`에는 정규 문구 「N천원」을 같이 넣는다(옛 읽기 경로 호환).
- 숫자칸이 비고, 원래 서술 글이 아직 있고 원 컬럼이 없으면: **원래 `monthly_fee` 글을 지우지 않는다.** 빈 입력 때문에 기존 서술이 사라지면 안 된다.
- 사용자가 숫자칸을 비우고, 서술을 더 이상 안 쓰는 것이 분명할 때만 금액을 null로 둔다. 0단계 구현에서 이 분기가 애매하면 멈추고 보고한다.

PHP는 다른 공부방 컬럼처럼 **컬럼이 없을 때만 ADD**할 수 있다(멱등). **기존 행 백필 UPDATE는 앱이 자동으로 돌리지 않는다.** 종현이 아래 SQL을 phpMyAdmin에서 실행한다.

## 종현이 실행할 SQL

운영 쓰기는 종현만. Cursor·봇은 실행하지 않는다. phpMyAdmin에서 한 덩어리씩, 결과를 보고 다음으로.

### 1) 읽기만 — 값 분류 (먼저)

```sql
SHOW COLUMNS FROM study_room_classes LIKE 'monthly_fee%';

SELECT
  COUNT(*) AS total_rows,
  SUM(TRIM(IFNULL(monthly_fee, '')) = '') AS empty_cnt,
  SUM(TRIM(monthly_fee) REGEXP '^[0-9]+(\\.[0-9]+)?$') AS numeric_only_cnt,
  SUM(monthly_fee LIKE '%천%') AS has_cheon_cnt,
  SUM(monthly_fee LIKE '%만%') AS has_man_cnt,
  SUM(
    TRIM(IFNULL(monthly_fee, '')) <> ''
    AND TRIM(monthly_fee) NOT REGEXP '^[0-9]+(\\.[0-9]+)?$'
    AND monthly_fee NOT LIKE '%천%'
    AND monthly_fee NOT LIKE '%만%'
  ) AS other_text_cnt
FROM study_room_classes;

SELECT id, study_room_id, class_name, monthly_fee
FROM study_room_classes
WHERE TRIM(monthly_fee) REGEXP '^[0-9]+(\\.[0-9]+)?$'
ORDER BY id
LIMIT 200;

SELECT id, study_room_id, class_name, monthly_fee
FROM study_room_classes
WHERE monthly_fee LIKE '%천%' OR monthly_fee LIKE '%만%'
ORDER BY id
LIMIT 200;

SELECT id, study_room_id, class_name, monthly_fee
FROM study_room_classes
WHERE TRIM(IFNULL(monthly_fee, '')) <> ''
  AND TRIM(monthly_fee) NOT REGEXP '^[0-9]+(\\.[0-9]+)?$'
  AND monthly_fee NOT LIKE '%천%'
  AND monthly_fee NOT LIKE '%만%'
ORDER BY id
LIMIT 200;
```

### 2) 쓰기 — 백업 다음 컬럼 추가 (종현이 실행)

```sql
CREATE TABLE study_room_classes_bak_20261118 LIKE study_room_classes;
INSERT INTO study_room_classes_bak_20261118 SELECT * FROM study_room_classes;

ALTER TABLE study_room_classes
  ADD COLUMN monthly_fee_amount INT UNSIGNED NULL
    COMMENT '월 수업료(원)' AFTER monthly_fee;
```

컬럼이 이미 있으면 ALTER는 건너뛴다. 백업 테이블 행 수가 원본과 같은지 먼저 확인한다.

```sql
SELECT
  (SELECT COUNT(*) FROM study_room_classes) AS origin_cnt,
  (SELECT COUNT(*) FROM study_room_classes_bak_20261118) AS bak_cnt;
```

### 3) 쓰기 — 읽히는 문구만 백필 (종현이 실행)

「천원」이 들어간 행(만원 문구는 제외):

```sql
UPDATE study_room_classes
SET monthly_fee_amount = CAST(
      REPLACE(REPLACE(REPLACE(TRIM(monthly_fee), '월', ''), ' ', ''), '천원', '')
    AS UNSIGNED) * 1000
WHERE monthly_fee_amount IS NULL
  AND monthly_fee LIKE '%천원%'
  AND monthly_fee NOT LIKE '%만%'
  AND REPLACE(REPLACE(REPLACE(TRIM(monthly_fee), '월', ''), ' ', ''), '천원', '')
      REGEXP '^[0-9]+$';
```

「만원」이 들어간 행:

```sql
UPDATE study_room_classes
SET monthly_fee_amount = CAST(
      REPLACE(REPLACE(REPLACE(TRIM(monthly_fee), '월', ''), ' ', ''), '만원', '')
    AS UNSIGNED) * 10000
WHERE monthly_fee_amount IS NULL
  AND monthly_fee LIKE '%만원%'
  AND REPLACE(REPLACE(REPLACE(TRIM(monthly_fee), '월', ''), ' ', ''), '만원', '')
      REGEXP '^[0-9]+$';
```

**숫자만 있는 행은 여기에 넣지 않았다.** 1번 목록을 본 뒤, 천원으로 봐도 되면 아래만 따로 실행한다. 맞지 않으면 실행하지 말고 알려 달라.

```sql
-- 종현 확인 후에만. 숫자만 = 천원(×1000)으로 본다.
UPDATE study_room_classes
SET monthly_fee_amount = CAST(TRIM(monthly_fee) AS UNSIGNED) * 1000
WHERE monthly_fee_amount IS NULL
  AND TRIM(monthly_fee) REGEXP '^[0-9]+(\\.[0-9]+)?$';
```

되돌리기(백업에서):

```sql
-- 필요한 행만. 전체를 덮기 전에 건수를 확인한다.
-- UPDATE study_room_classes c
-- JOIN study_room_classes_bak_20261118 b ON b.id = c.id
-- SET c.monthly_fee = b.monthly_fee, c.monthly_fee_amount = NULL;
```

## 바꿀 것

### A. 입력칸 (`step-lesson.js`)

수업 그룹 「월 수업료」를 월 평균 수업료와 같은 모양으로 바꾼다. `.register-fee-manwon` + `<span class="register-fee-manwon__unit">천원</span>`. `inputmode="decimal"`, `min`은 1(값이 있을 때). placeholder는 「숫자」. **`fee_note`(수업료 설명)와 평균 수업료 칸은 그대로.**

마이페이지 상세정보1과 공부방상세등록이 이 HTML을 같이 쓴다. 둘 다 바뀌는 것이 맞다.

기존 서술이 있고 숫자로 못 바꾸면, 숫자칸은 비우고 그 아래에 원래 글을 힌트로만 보여 준다.

### B. 수집·저장

- `preview/study-room-ui/src/form-collect.js`: 화면 값은 천원, 저장 payload에는 원(`cheonwonInputToWon`)과 정규 문구를 함께 보낸다. `fee-cheonwon.js`를 import 해도 되고, 그 파일은 수정하지 않는다.
- `StudyRoomRegisterService.php` 수업 그룹 정규화·`StudyRoomLessonDetailStore.php` INSERT/SELECT에 `monthly_fee_amount`를 추가한다. 컬럼 없으면 멱등 ADD.
- 값이 있으면 1 천원 이상. 빈 칸은 허용(평균 수업료 필수와 별개).

### C. 다시 열기·공개 표시

- 로드: `monthly_fee_amount`가 있으면 `wonToCheonwonInput`으로 칸을 채운다.
- `formatClassFee`: 원 금액이 있으면 `월 N천원`만 쓴다. 없으면 지금 문자열 규칙을 폴백으로 둔다. 비숫자 서술은 금액으로 보여 주지 않는다.
- `shop-view-model.js`는 원 금액을 `formatClassFee`에 같이 넘긴다. 제목 줄 금액이 천원으로 나온다. `myshop-render.js` 마크업을 바꿀 필요가 없으면 고치지 않는다.
- `StudyRoomPublicReadService.php`는 `monthly_fee_amount`를 함께 내려 주고, `monthly_fee` 문자열도 유지한다(정규 문구 또는 아직 못 바꾼 서술).
- `summary.js` 등록 요약의 수업료도 천원으로 보이게 한다.

찾기 카드·홈 목록 가격대는 평균 수업료라서 이번 허용 파일에 넣지 않는다.

## 허용 파일 (이것만)

1. `preview/study-room-ui/src/screens/step-lesson.js` — 수업 그룹 월 수업료 입력 모양만. 평균 수업료 칸·다른 필드는 금지
2. `preview/study-room-ui/src/form-collect.js` — 그룹 수업료 수집·저장 값만
3. `preview/study-room-ui/src/summary.js` — 그룹 수업료 표시만
4. `preview/home-ui/src/study-room-reg/shop-formatters.js` — `formatClassFee`만
5. `preview/home-ui/src/study-room-reg/shop-view-model.js` — 그룹 금액을 `formatClassFee`에 넘기는 줄만
6. `src/StudyRoom/StudyRoomRegisterService.php` — 수업 그룹 정규화·금액 환산만. 홍보지역·경력 메서드(15에서 고친 곳)는 금지
7. `src/StudyRoom/StudyRoomLessonDetailStore.php` — `monthly_fee_amount` 컬럼 보장·저장·조회만
8. `src/StudyRoom/StudyRoomPublicReadService.php` — 공개 수업 행에 금액 필드만
9. 스키마 기록 1개: `sql/schema/` 아래 새 파일(컬럼 추가. 기존 스키마 파일 수정 금지)
10. 기록 1개: `docs/worklog/2026/11/2026-11-18-study-room-class-fee-cheonwon.md`

`myshop-render.js`는 제목 줄이 이미 `formatClassFee` 결과를 쓰므로, 마크업을 안 바꿔도 되면 허용 목록에 넣지 않는다. 꼭 바꿔야 하면 멈추고 보고한다.

## 금지

- **모든 `main.js`.**
- `preview/tutor-ui/**`, `preview/home-ui/src/tutor-reg/**`, `mypage-ops-register.css`, 지시서 14·14b·15의 다른 허용 파일을 15 범위를 넘어 다시 고치기.
- `preview/shared/fee-cheonwon.js`(import만), `preview/shared/*.css`, 찾기·홈 카드·퀵매칭(평균 가격) 파일.
- 운영 DB에 Cursor가 UPDATE/ALTER 실행. 백필은 종현 SQL만.
- `monthly_fee` VARCHAR 삭제, 비밀번호·홍보지역·경력 재수정.

## 위험

| 위험 | 막는 법 |
|---|---|
| `35`를 35천원으로 잘못 환산 | 숫자만 행은 자동 백필하지 않음. 종현이 목록 확인. |
| 저장 시 기존 서술 「협의」가 사라짐 | 숫자칸이 비고 원 컬럼이 없으면 원래 글을 유지. |
| 월 평균 수업료 칸이 같이 바뀜 | `monthly_fee_manwon` 줄 수정 금지. |
| 과외쌤 과외비가 바뀜 | tutor 파일 금지. |
| 15와 같은 PHP 파일이 충돌 | 15 머지 뒤에만 시작. 홍보·경력 함수는 손대지 않음. |
| 찾기 카드 가격이 바뀜 | 0단계에서 평균 가격만 쓰는지 확인. 쓰면 멈추고 보고. |

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 공부방·과외쌤·학생, **일반 창과 시크릿 창.**
2. 마이페이지 상세정보1과 공부방상세등록: 수업 그룹 월 수업료가 숫자+「천원」이다. 350을 넣고 저장한 뒤 다시 열면 350. 수업료 설명·월 평균 수업료는 전과 같다.
3. 공개 마이프로필·상세의 해당 수업 줄에 「월 350천원」처럼 천원만 보인다. 「만원」 단위가 새로 생기지 않는다.
4. 기존 서술(「협의」 등)이 있는 수업: 숫자칸이 비어 있고 원래 글이 힌트로 남으며, 손대지 않고 저장해도 원래 글이 사라지지 않는다.
5. 빈 칸 저장이 되고, 0·음수는 거절된다.
6. 찾기·홈 목록의 가격대(월 평균)가 작업 전과 같다.
7. 빌드 `npm run build:dothome`. Verify bundle은 지금 실패 중인 4건 말고 새 실패가 없어야 한다. `verify-shop-page`가 그룹 수업료 글자를 보면, 실패할 때만 멈추고 보고한다(허용 파일에 없는 verify를 고치지 말고 보고).
8. **마지막 확인:** `git diff --stat origin/main...HEAD`에 위 허용 파일만. 다른 파일이 보이면 PR을 열지 말고 보고.
9. PR 본문에 0단계 보고, 종현 SQL 적용 여부(컬럼 추가·백필 건수), 계정별 표. 비밀번호는 적지 않는다.

## Cursor 한 줄 명령

`15가 머지된 최신 origin/main에서 docs/worklog/grok-sync/reapply-2026-11-17/15b-study-room-class-fee-cheonwon.md 그대로 실행. 먼저 0단계 진단을 보고하고, 15 merge가 없거나 애매하거나 허용 파일 밖을 고쳐야 하면 멈추고 보고해. 운영 SQL은 실행하지 마. 모든 main.js, tutor 파일, mypage-ops-register.css, fee-cheonwon.js 수정, 월 평균 수업료 칸 수정 금지. 수락을 공부방·과외쌤·학생 계정으로 일반·시크릿 창에서 확인하고, git diff --stat에 허용 파일만 있는지 확인한 뒤 PR만 올려줘. 머지는 하지 마.`

## 되돌리기

코드: `git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
컬럼: 종현이 백업 테이블을 확인한 뒤 필요할 때만 되돌린다. 앱만 되돌려도 컬럼이 남아 있어도 된다(NULL 허용).
