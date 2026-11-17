# 15b. 공부방 수업 그룹별 월 수업료 — 숫자 입력 + 천원 (화면 천원, DB 원)

작성: 우동공과3(검수). 코드 변경 없음. 문서만. PR만 연다. 머지 금지.
11-18 종현 결정 4(수업 그룹 월 수업료를 숫자+천원으로. 정책 168).

**시작 조건: 15(`15-study-room-mypage-fixes.md`) PR이 머지되고, 운영에서 비밀번호·홍보 지우기·경력 확인이 끝난 뒤.** 그 전에는 시작하지 않는다.
기준: 15 머지 뒤의 `origin/main`(커밋을 0단계에서 적는다).

종현이 읽기 SQL을 실행했고, 값이 있는 3행의 환산을 확정했다. 백필은 정규식 자동 변환이 아니라 아래 id 지정 UPDATE만 쓴다. 봇·Cursor는 운영 SQL을 실행하지 않는다.

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
4. 기존 값 백필은 이 문서의 id 지정 UPDATE 3개만이다. 앱·스키마 작업에 정규식/패턴 자동 백필을 넣지 않는다. `parseFeeAmount`나 `formatClassFee`의 옛 문자열 환산을 새 저장·표시의 정본으로 쓰지 않는다.
5. 문서와 다르거나, 애매하거나, **허용 파일 밖을 고쳐야 할 것 같으면 멈추고 보고한다. 고치지 않는다.**

## 목적

- 수업 그룹별 월 수업료 입력은 과외쌤 월 과외비·공부방 월 평균 수업료와 같이 **숫자 + 단위 「천원」**. 화면은 천원, DB는 원(정책 168, SSOT 13장). 모든 금액 표시를 천원으로 통일한다.
- 기존 값은 종현이 확인한 3행만, 아래 확정 금액으로 옮긴다. 빈 6행은 `monthly_fee_amount` NULL.

## 마이그레이션 안 (새 숫자 컬럼 + 3행만 지정 백필)

`monthly_fee` VARCHAR를 숫자 타입으로 바꾸거나 삭제하지 않는다. 원 금액은 새 컬럼에 둔다.

추가할 컬럼:

```sql
monthly_fee_amount INT UNSIGNED NULL COMMENT '월 수업료(원)'
```

`study_room_classes.monthly_fee` 뒤에 둔다.

### 종현이 확인한 운영 값 (읽기 SQL, 이미 실행)

`study_room_classes`는 9행. `monthly_fee`가 비어 있는 행 6개, 값이 있는 행 3개. 화면은 천원, DB는 원으로 통일한다.

| id | study_room_id | 지금 `monthly_fee` | 화면 | `monthly_fee_amount`(원) | 저장할 `monthly_fee` |
|---|---|---|---|---|---|
| 26 | 14 | `300` | 300천원 | 300000 | `300천원` |
| 34 | 6 | `35만원` | 350천원 | 350000 | `350천원` |
| 39 | 22 | `170000` | 170천원 | 170000 | `170천원` |
| (나머지 6행) | | 빈 값 | 빈 칸 | NULL | 빈 값 유지 |

`170000`을 「숫자=천원」으로 읽으면 170000천원이 되므로, 정규식·패턴 자동 환산은 쓰지 않는다.

저장 규칙(코드, 이후 저장분):
- 숫자칸에 값이 있으면: `monthly_fee_amount` = 천원×1000(원), `monthly_fee`에는 「N천원」.
- 숫자칸이 비면: 금액은 NULL, `monthly_fee`도 빈 값.

PHP는 컬럼이 없을 때만 ADD할 수 있다(멱등). **기존 행 UPDATE는 앱이 자동으로 돌리지 않는다.** 종현이 아래 SQL을 phpMyAdmin에서 실행한다. 코드 배포 전에 실행하는 편이 안전하다(`170000` 문자열을 천원으로 오인하지 않게).

## 종현이 실행할 SQL

운영 쓰기는 종현만. Cursor·봇은 실행하지 않는다. phpMyAdmin에서 한 덩어리씩, 결과를 보고 다음으로. 정규식·패턴으로 여러 행을 한 번에 바꾸는 UPDATE는 쓰지 않는다.

### 1) 쓰기 — 백업 다음 컬럼 추가

```sql
CREATE TABLE study_room_classes_bak_20261118 LIKE study_room_classes;
INSERT INTO study_room_classes_bak_20261118 SELECT * FROM study_room_classes;

ALTER TABLE study_room_classes
  ADD COLUMN monthly_fee_amount INT UNSIGNED NULL
    COMMENT '월 수업료(원)' AFTER monthly_fee;
```

컬럼이 이미 있으면 ALTER는 건너뛴다. 백업 행 수가 원본과 같은지 먼저 확인한다.

```sql
SELECT
  (SELECT COUNT(*) FROM study_room_classes) AS origin_cnt,
  (SELECT COUNT(*) FROM study_room_classes_bak_20261118) AS bak_cnt;
```

`origin_cnt`와 `bak_cnt`가 둘 다 9여야 한다.

### 2) 쓰기 — 값이 있는 3행만 (종현이 실행)

```sql
UPDATE study_room_classes
SET monthly_fee_amount = 300000,
    monthly_fee = '300천원'
WHERE id = 26 AND study_room_id = 14;

UPDATE study_room_classes
SET monthly_fee_amount = 350000,
    monthly_fee = '350천원'
WHERE id = 34 AND study_room_id = 6;

UPDATE study_room_classes
SET monthly_fee_amount = 170000,
    monthly_fee = '170천원'
WHERE id = 39 AND study_room_id = 22;
```

각 문은 영향 행 1건이어야 한다. 빈 6행은 실행하지 않는다(`monthly_fee_amount`는 NULL 유지).

### 3) 확인 (읽기만)

```sql
SELECT id, study_room_id, monthly_fee, monthly_fee_amount
FROM study_room_classes
ORDER BY id;

SELECT
  COUNT(*) AS total_rows,
  SUM(monthly_fee_amount IS NOT NULL) AS amount_filled_cnt,
  SUM(monthly_fee_amount IS NULL) AS amount_null_cnt
FROM study_room_classes;
```

기대 결과:
- id 26, study_room_id 14, `monthly_fee`=`300천원`, `monthly_fee_amount`=300000
- id 34, study_room_id 6, `monthly_fee`=`350천원`, `monthly_fee_amount`=350000
- id 39, study_room_id 22, `monthly_fee`=`170천원`, `monthly_fee_amount`=170000
- 나머지 6행: `monthly_fee_amount`는 NULL, `monthly_fee`는 빈 값
- `total_rows`=9, `amount_filled_cnt`=3, `amount_null_cnt`=6

되돌리기(백업에서, 필요할 때만):

```sql
UPDATE study_room_classes c
JOIN study_room_classes_bak_20261118 b ON b.id = c.id
SET c.monthly_fee = b.monthly_fee,
    c.monthly_fee_amount = NULL
WHERE c.id IN (26, 34, 39);
```

## 바꿀 것

### A. 입력칸 (`step-lesson.js`)

수업 그룹 「월 수업료」를 월 평균 수업료와 같은 모양으로 바꾼다. `.register-fee-manwon` + `<span class="register-fee-manwon__unit">천원</span>`. `inputmode="decimal"`, `min`은 1(값이 있을 때). placeholder는 「숫자」. **`fee_note`(수업료 설명)와 평균 수업료 칸은 그대로.**

마이페이지 상세정보1과 공부방상세등록이 이 HTML을 같이 쓴다. 둘 다 바뀌는 것이 맞다.

값은 `monthly_fee_amount`(원)를 천원으로 나눠 칸에 넣는다. 금액이 없으면 빈 칸. 옛 문자열을 정규식으로 해석해 칸을 채우지 않는다.

### B. 수집·저장

- `preview/study-room-ui/src/form-collect.js`: 화면 값은 천원, 저장 payload에는 원(`cheonwonInputToWon`)과 정규 문구를 함께 보낸다. `fee-cheonwon.js`를 import 해도 되고, 그 파일은 수정하지 않는다.
- `StudyRoomRegisterService.php` 수업 그룹 정규화·`StudyRoomLessonDetailStore.php` INSERT/SELECT에 `monthly_fee_amount`를 추가한다. 컬럼 없으면 멱등 ADD.
- 값이 있으면 1 천원 이상. 빈 칸은 허용(평균 수업료 필수와 별개).

### C. 다시 열기·공개 표시

- 로드: `monthly_fee_amount`가 있으면 `wonToCheonwonInput`으로 칸을 채운다. 없으면 빈 칸.
- `formatClassFee`: **원 금액이 있을 때만** `월 N천원`. 금액이 없으면 숨긴다. `만`/`천`/숫자만 문자열을 정규식으로 환산하는 폴백은 넣지 않는다(`170000`을 170000천원으로 오인하지 않게).
- `shop-view-model.js`는 원 금액을 `formatClassFee`에 넘긴다. 제목 줄은 천원만. `myshop-render.js` 마크업을 바꿀 필요가 없으면 고치지 않는다.
- `StudyRoomPublicReadService.php`는 `monthly_fee_amount`를 내려 주고, `monthly_fee`는 「N천원」 정규 문구(또는 빈 값)를 유지한다.
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
| `170000`을 천원 숫자로 오인 | 정규식 자동 백필·문자열 환산 폴백 금지. id 지정 UPDATE와 원 컬럼만 사용. 종현 SQL을 배포 전에 실행. |
| 빈 6행에 금액이 채워짐 | UPDATE는 id 26·34·39만. 빈 행은 NULL 유지. |
| 월 평균 수업료 칸이 같이 바뀜 | `monthly_fee_manwon` 줄 수정 금지. |
| 과외쌤 과외비가 바뀜 | tutor 파일 금지. |
| 15와 같은 PHP 파일이 충돌 | 15 머지 뒤에만 시작. 홍보·경력 함수는 손대지 않음. |
| 찾기 카드 가격이 바뀜 | 0단계에서 평균 가격만 쓰는지 확인. 쓰면 멈추고 보고. |

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 공부방·과외쌤·학생, **일반 창과 시크릿 창.**
2. 마이페이지 상세정보1과 공부방상세등록: 수업 그룹 월 수업료가 숫자+「천원」이다. 350을 넣고 저장한 뒤 다시 열면 350. 수업료 설명·월 평균 수업료는 전과 같다.
3. 공개 마이프로필·상세의 해당 수업 줄에 「월 350천원」처럼 천원만 보인다. 「만원」 단위가 새로 생기지 않는다.
4. 종현 SQL 적용 뒤: 해당 수업이 열리면 id 26은 300, id 34는 350, id 39는 170(천원 칸). 공개 화면은 「월 300천원」「월 350천원」「월 170천원」. 「35만원」「170000」은 보이지 않는다. 값이 없던 수업은 빈 칸·금액 숨김이다.
5. 빈 칸 저장이 되고, 0·음수는 거절된다.
6. 찾기·홈 목록의 가격대(월 평균)가 작업 전과 같다.
7. 빌드 `npm run build:dothome`. Verify bundle은 지금 실패 중인 4건 말고 새 실패가 없어야 한다. `verify-shop-page`가 그룹 수업료 글자를 보면, 실패할 때만 멈추고 보고한다(허용 파일에 없는 verify를 고치지 말고 보고).
8. **마지막 확인:** `git diff --stat origin/main...HEAD`에 위 허용 파일만. 다른 파일이 보이면 PR을 열지 말고 보고.
9. PR 본문에 0단계 보고, 종현 SQL 적용 여부(백업·컬럼·3행 UPDATE·확인 SELECT 결과), 계정별 표. 비밀번호는 적지 않는다.

## Cursor 한 줄 명령

`15가 머지된 최신 origin/main에서 docs/worklog/grok-sync/reapply-2026-11-17/15b-study-room-class-fee-cheonwon.md 그대로 실행. 먼저 0단계 진단을 보고하고, 15 merge가 없거나 애매하거나 허용 파일 밖을 고쳐야 하면 멈추고 보고해. 운영 SQL은 실행하지 마. 모든 main.js, tutor 파일, mypage-ops-register.css, fee-cheonwon.js 수정, 월 평균 수업료 칸 수정 금지. 수락을 공부방·과외쌤·학생 계정으로 일반·시크릿 창에서 확인하고, git diff --stat에 허용 파일만 있는지 확인한 뒤 PR만 올려줘. 머지는 하지 마.`

## 되돌리기

코드: `git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
컬럼: 종현이 백업 테이블을 확인한 뒤 필요할 때만 되돌린다. 앱만 되돌려도 컬럼이 남아 있어도 된다(NULL 허용).
