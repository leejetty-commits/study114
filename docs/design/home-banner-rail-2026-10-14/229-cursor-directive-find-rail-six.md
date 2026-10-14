# 229 · Cursor 보완 지시 — 찾기 레일 저장 목록을 운영 DB 값(세 방 + 자료실 6개)에 맞춤 (종현 t1636)

- 작성: 우동공과2(개발팀장), 2026-10-15 · 기준 origin/main `a7cddb2`(+ 228 문서 커밋이 먼저 push 될 수 있음, 코드 변경 없음) · 대상 브랜치 `cursor/home-find-rail-three-20261015` @ `a061764321df752310d8eb188f59a295ff71e40d` (228 검수 PASS 상태)
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제). 227(개정 t1625)·228 위에 얹는 **작은 보완**입니다.
- 한 줄 요약: `search_right_rail` 목록을 **`["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]`(6개)** 로 화면 기본값·서버 seed 두 곳·081 에서 똑같이 맞춘다. 081 은 자료실만 있던 옛 값도 바꾸고, 운영(이미 6개)에서는 **0행**.

## 0. 배경과 확정 기록

| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-15 | 종현 t1610·t1611·t1625 | 찾기 레일 고민방: 공부방·과외쌤 세 방(자기 방 먼저), 학생 1칸, 비회원 세 방 제목만. DB·서버·화면 일치 |
| 2026-10-15 02:2x | 종현 운영 phpMyAdmin ① | 운영 `search_right_rail` = `['faq','library-template','safe-guide']`(2026-07-17 저장). 고민방이 **하나도 없음** → 227 의 081 은 0행이었을 것 |
| 2026-10-15 | 종현 t1636 | **자료실(`library-template`)은 남기고 세 방을 더한다.** |
| 2026-10-15 02:28 KST | 종현 운영 UPDATE | 운영 값이 `["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]` 로 바뀜(1행, WHERE 는 옛 값 정규화와 정확히 일치) |

### 코드 확인 결과: 사용자 레일에서 `library-template` 은 어떻게 보이나 (우동공과2, a061764 기준)
- `sourceBoardKeys` 는 사용자 레일에서 **고민방 층에만** 쓰입니다. `right-rail.js:231-242` `resolveConcernBoardKeysForSlot` 가 목록에서 `isConcernBoardKey`(`board-channel-store.js:340-344`, `concern-` 로 시작하거나 preset 이 concern) 인 것만 남깁니다. `faq`·`library-template`·`safe-guide` 는 **그리지 않습니다**.
- 고민방이 하나도 없으면(운영 옛 값) 고민방 층 전체(이달의 베스트·고민방 칸·오늘의 현장)가 없어집니다(229 측정 `libold` 로 확인: 칸 순서 `action|info|info|info`).
- 자료실 쪽은 목록과 **상관없이** 따로 나옵니다: `right-rail.js:653-661` `renderMediaTeaserSlot` → `library/info-rail.js:159` `renderInfoRailBanners` → `LIBRARY_BOARDS`(`library/library-copy.js:68` = `info-room` 「공부방 쏙쏙정보」, `info-tutor` 「과외쌤 따끈 팁가이드」, `info-student` 「학생 꿀팁 가이드」, 역할별 `canDiscoverBoard`). `library-template`(「양식·체크리스트」, `board-engine-copy.js:308`)은 이 배너에 없습니다.
- 그래서 6개 목록으로 바꿔도 **사용자 화면은 227/228 과 같습니다**. 이 보완은 운영 DB·서버 seed·화면 기본값을 같은 값으로 맞추는 일입니다(관리 화면 목록, seed 점검 결과 일치).
- 그 밖: DB 목록은 운영자 로그인 때만 읽음(`main.js:369-377`, `:466-473`, 227 §0). 운영은 02:28 부터 6개라 **지금 main 코드에서도 운영자 화면 찾기 레일은 세 방**, 일반 이용자는 이 브랜치 배포 전까지 main 화면 기본값(학생/학부모 방 1칸).
- seed 점검(`ContentAclSeedGuard::planRail`, :160-195)은 JSON 을 풀어 **정렬한 뒤** 비교(`normalizeField` :222-240)합니다. a061764 그대로 두면 운영 6개 값은 목표(5개)와 다르고 허용 목록에도 없어 `abort_unexpected` 가 됩니다 → 이 보완이 필요한 이유.

## 1. 손대기 전 다시 확인(필수, 다르면 짐작하지 말고 멈춘 뒤 보고)

`git fetch origin` 후.

| # | 위치 (a061764) | 있어야 할 내용 |
|---|---|---|
| L0 | `git rev-parse origin/cursor/home-find-rail-three-20261015` | `a061764321df752310d8eb188f59a295ff71e40d` |
| L1 | `git diff --stat origin/main...a061764` | 4파일: `right-rail-store.js`(2), `sql/schema/081_…`(13), `ContentAclSeedGuard.php`(3), `ContentSchemaMigrateService.php`(2) |
| L2 | `git diff a7cddb2 origin/main -- preview src sql` | 빈 출력(그 뒤 main 은 문서만) |
| L3 | `preview/home-ui/src/right-rail-store.js:71` | `    sourceBoardKeys: ['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide'],` |
| L4 | `src/Admin/ContentAclSeedGuard.php:70` | `                        'source_board_keys_json' => self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),` |
| L5 | `ContentAclSeedGuard.php:78-82` | `'source_board_keys_json' => [` / `self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),` / `self::json(['faq', 'concern-parent', 'safe-guide']),` / `self::json(['faq', 'concern-family', 'safe-guide']),` / `],` |
| L6 | `src/Admin/ContentSchemaMigrateService.php:785` | `['slot_key' => 'search_right_rail', … 'source_board_keys_json' => $keys(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']), …` |
| L7 | `sql/schema/081_search_rail_three_concern_boards.sql` | 13줄, 227 §2-2 「고친 뒤 파일 전체」와 같음 |
| L8 | `preview/home-ui/src/right-rail.js` | `git diff origin/main a061764 -- preview/home-ui/src/right-rail.js` 빈 출력 |

## 2. 바꿀 내용(정확히 이것만, 글자 하나까지 같게)

목록 6개 = `faq, concern-director, concern-tutor, concern-parent, library-template, safe-guide` (이 순서, 운영 DB 값과 같은 순서).

### 2-1. `preview/home-ui/src/right-rail-store.js:71`
```diff
-    sourceBoardKeys: ['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide'],
+    sourceBoardKeys: ['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'library-template', 'safe-guide'],
```

### 2-2. `src/Admin/ContentAclSeedGuard.php` (search_right_rail 항목만)
```diff
@@ fields
-                        'source_board_keys_json' => self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),
+                        'source_board_keys_json' => self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'library-template', 'safe-guide']),
@@ replaceable
                         'source_board_keys_json' => [
+                            self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'library-template', 'safe-guide']),
                             self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),
                             self::json(['faq', 'concern-parent', 'safe-guide']),
                             self::json(['faq', 'concern-family', 'safe-guide']),
+                            self::json(['faq', 'library-template', 'safe-guide']),
                         ],
```
(5개 목록은 이제 「옛 값」으로 남겨 둡니다 — 227 브랜치 seed 를 돌린 개발 DB 대비.)

### 2-3. `src/Admin/ContentSchemaMigrateService.php:785` (search 행의 목록만, 나머지 글자 그대로)
```diff
-… 'source_board_keys_json' => $keys(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']), …
+… 'source_board_keys_json' => $keys(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'library-template', 'safe-guide']), …
```

### 2-4. `sql/schema/081_search_rail_three_concern_boards.sql` — 파일 전체를 이것으로
```sql
-- 찾기 레일 목록 = 고민방 세 방(공부방·과외쌤·학생/학부모) + 자료실(library-template). 화면은 고민방만 레일 칸으로 그리고 역할별로 거른다: 학생 1칸, 비회원 3칸 제목만.
-- 종현 2026-10-15 t1610·t1611·t1625·t1636(DB·서버·화면 일치, 자료실 유지). 운영은 2026-10-15 02:28 KST 에 종현이 같은 값으로 바꿈 → 운영에서 이 파일은 0행.
-- 아래 옛 값일 때만 바꾼다. 공백·줄바꿈만 다른 값도 같은 값으로 본다(순서는 그대로 비교).
-- 운영자가 바꾼 다른 값은 건드리지 않는다. 다시 돌려도 바뀌는 행 0(새 값은 조건에 안 걸림).
-- MySQL 8(JSON 열)·MariaDB 10.x(JSON = LONGTEXT) 둘 다 되는 문자열 비교만 쓴다.
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]',
    '["faq","library-template","safe-guide"]',
    '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]'
  );
```
- 파일 이름은 그대로(`081_search_rail_three_concern_boards.sql`). 새 SQL 파일 금지.

### 2-5. 끝난 뒤 반드시 이렇게
- `git diff --stat origin/main...HEAD` = 같은 **4파일**(`right-rail-store.js | 2 +-`, `081 | 15 +`, `ContentAclSeedGuard.php | 5 ++++-`(+4/−1), `ContentSchemaMigrateService.php | 2 +-`).
- `git diff origin/main...HEAD -- preview/home-ui/src/right-rail.js` 빈 출력.
- `git grep -n "concern-parent', 'safe-guide'" HEAD -- preview/home-ui/src/right-rail-store.js src/Admin/ContentSchemaMigrateService.php` → 0건(search 행이 6개로 바뀜). `ContentAclSeedGuard.php` search_right_rail 항목은 2-2 diff 결과와 눈으로 대조(목표 6개 1줄, 허용 목록 5줄: 6개·5개·학생/학부모만·family·자료실만).

### 2-6. 커밋·main 반영
```
git switch cursor/home-find-rail-three-20261015
git add preview/home-ui/src/right-rail-store.js src/Admin/ContentAclSeedGuard.php src/Admin/ContentSchemaMigrateService.php sql/schema/081_search_rail_three_concern_boards.sql
git commit -m "fix(rail): 찾기 레일 목록 = 세 방 + 자료실 6개(운영 DB와 같음), 081 자료실 옛 값 포함 (종현 t1636 2026-10-15)"
git merge --no-edit origin/main      # 어려우면 -v2 브랜치 + cherry-pick (rebase·force-push 금지)
git push origin cursor/home-find-rail-three-20261015
```

## 3. 허용 파일
1. `preview/home-ui/src/right-rail-store.js` — 71행 한 줄
2. `src/Admin/ContentAclSeedGuard.php` — search_right_rail 의 fields 한 줄, replaceable 두 줄 추가
3. `src/Admin/ContentSchemaMigrateService.php` — 785행 목록만
4. `sql/schema/081_search_rail_three_concern_boards.sql` — 2-4 그대로
5. (main 에 문서만) `docs/worklog/2026/10/2026-10-15-find-rail-six-report.md`, `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄, `docs/worklog/2026/10/img/2026-10-15-find-rail-six-*.png`

## 4. 금지
- `right-rail.js` 수정 금지(origin/main 과 같아야 함). 다른 슬롯(home·detail·register 등) 목록 변경 금지.
- 자료실을 레일에 그리게 하는 화면 변경 금지(범위 밖. 지금 자료실은 정보 게시판 배너로 따로 나옴).
- 운영 DB 에 SQL 실행 금지(운영은 이미 6개). 새 SQL 파일 금지.
- 작업 C(224)·B2(225) 범위, `concern/copy.js`·`concern/rail-concern-popup.js`·`home-right-rail.css` 금지. 정본 9장·218·219·224~229 문서 수정 금지.
- 하위 에이전트 빠른(fast) 모델 금지. `git add -A`/`git add .` 금지. force-push·rebase 후 push 금지. 비밀값 커밋 금지. main 에 코드 merge 금지(검수 뒤 종현 승인).

## 5. merge 순서
- B2(a49f256) → 이 브랜치 → C(224). `right-rail.js` 를 안 건드리므로 C·B2 줄 번호 변화 없음.

## 6. 081 확인(로컬 mysql:8.4, 가능하면 MariaDB 10.x 컨테이너도)

| 경우 | 넣기 전 값 | 기대 영향 행 |
|---|---|---|
| ① 학생/학부모 방만(공백 없음, LONGTEXT) | `["faq","concern-parent","safe-guide"]` | 1 |
| ② JSON 열에 넣은 같은 값 | `["faq", "concern-parent", "safe-guide"]` | 1 |
| ③ 운영 옛 값(자료실만) | `["faq", "library-template", "safe-guide"]` | 1 |
| ④ 227 의 5개 값 | `["faq","concern-director","concern-tutor","concern-parent","safe-guide"]` | 1 |
| ⑤ 운영 현재 값(6개) | `["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]` | **0** |
| ⑥ 운영자 값(예: 과외쌤 방 뺀 목록) | `["faq","concern-director","concern-parent","safe-guide"]` | 0 |
| ⑦ ①~④ 뒤 한 번 더 | 6개 | 0 |

MariaDB 컨테이너(`mariadb:10.11` 등)를 못 띄우면 「못 함」으로 적기. 운영 확인용(종현 선택): `227-081-check.sql` ① SELECT → `normalized` 가 6개 값이면 081 은 0행.

## 7. 합격 기준

화면: 찾기(search-ui) 4모드 × 1280/1023/390 + 홈 레일 12칸 = 24칸. 아래 **다섯 경우 모두 `24/24 PASS []`**. (D=공부방 고민방, T=과외쌤 고민방, P=학생/학부모 고민방. 베스트도 같은 순서.)

| 경우 | 저장 목록 | 공부방 / 과외쌤 / 학생 / 비회원 |
|---|---|---|
| default | 없음(화면 기본값 = 6개 = 운영 DB) | D,T,P / T,D,P / P / P,D,T |
| six | 6개를 저장값으로 | D,T,P / T,D,P / P / P,D,T |
| old | `['faq','concern-parent','safe-guide']` | P / P / P / P |
| removed | `['faq','concern-director','concern-parent','safe-guide']` | D,P / D,P / P / P,D |
| libold | `['faq','library-template','safe-guide']`(운영 옛 값) | 고민방 0칸, 베스트·현장 층도 없음, 남은 칸 순서 = main 에서 베스트·현장을 뺀 것 |

공통: 비회원 레일·팝업 작성자·본문 미끼 0건, 고민방 말고 다른 칸 순서가 main 과 같음, 홈 레일 4모드 main 과 글자까지 같음, 화면 글자에 `undefined`·`null`·`NaN`·`search_right_rail`·`intro_only`·`board_key`·`sourceBoardKeys` 0건.
코드: 2-5 조건. DB: 6절 영향 행 1·1·1·1·0·0·0.

우동공과2 사전 측정(a061764 그대로, main a7cddb2 기준): default·old·removed·libold·six **모두 24/24 PASS** — 화면은 이미 6개 목록과 같은 결과(자료실 키는 레일에 안 그려짐). 따라서 이번 보완 뒤에도 같은 결과여야 하고, 6개 기본값 반영은 2-5 코드 조건으로 확인.

## 8. 측정 스크립트 (`229-measure-find-rail.py` + `229-judge-find-rail.py`, 이 폴더)
227 스크립트에 `libold`·`six` 경우만 더한 것. 포트·준비는 227 §8 과 같음.
```
for s in default six old removed libold; do python3 229-measure-find-rail.py 5191 5193 $s; done
python3 229-measure-find-rail.py 5192 5194 default
for s in default six old removed libold; do python3 229-judge-find-rail.py /tmp/fr-5191-$s.json /tmp/fr-5192-default.json $s; done   # 기대: 다섯 줄 모두 24/24 PASS []
```
`npm i` 로 바뀐 `package-lock.json` 은 커밋하지 말 것.

## 9. 진행 순서
1. `git fetch origin` → 1절 L0~L8(다르면 멈추고 보고).
2. 2절 → 커밋 → merge(또는 v2) → 2-5 확인.
3. 6절 DB 확인(가능한 만큼).
4. 8절 측정 다섯 경우 → 모두 `24/24 PASS []`. 그림: 찾기 1280 공부방(default), 공부방(libold).
5. `git push origin <브랜치>` (일반 push).
6. **작업 기록은 main 에 바로 커밋**(문서만, 파일 이름으로 add):
   - `docs/worklog/2026/10/2026-10-15-find-rail-six-report.md` — 브랜치·커밋 해시, `git diff --stat origin/main...HEAD`, 1절 결과, 다섯 경우 판정 출력, 6절 영향 행 표(MySQL/MariaDB 버전), 그림 경로, 지시와 다른 점, 확인 못 한 것.
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄: `- 2026-10-15 찾기 레일 6개 목록(229, 종현 t1636) 브랜치 cursor/home-find-rail-three-20261015 <해시> push, 검수 대기 (운영 DB 는 02:28 종현 반영 완료)`
7. 답장: 보고서 경로, 브랜치 커밋 해시, main 기록 커밋 해시.

## 10. 범위 축소 (2026-10-15 03:25, 종현 지적) — 이 절이 6~9절보다 우선

- **하지 않음:** 8절 화면 측정, 6절 DB 확인(MySQL·MariaDB·Docker 모두). 화면 확인은 우동공과2가 검수 때 직접 함.
- **할 일:** 2절의 4곳만 바꿈(2-1 `right-rail-store.js:71`, 2-2 `ContentAclSeedGuard.php`, 2-3 `ContentSchemaMigrateService.php:785`, 2-4 `081` SQL) → 커밋 → `git merge --no-edit origin/main`(rebase·force-push 금지) → `git push origin cursor/home-find-rail-three-20261015`.
- **합격 기준(이 두 개만):**
  1. `git diff --stat origin/main...HEAD` = 정확히 4파일: `preview/home-ui/src/right-rail-store.js`, `sql/schema/081_search_rail_three_concern_boards.sql`, `src/Admin/ContentAclSeedGuard.php`, `src/Admin/ContentSchemaMigrateService.php`
  2. `git grep -n "concern-parent', 'safe-guide'" HEAD -- preview/home-ui/src/right-rail-store.js src/Admin/ContentSchemaMigrateService.php` → **0건**
- **보고:** 보고서 파일·그림·work-queue 줄 없이, 답장에 **브랜치 커밋 해시 + 위 두 명령의 출력**만.
- 3절 허용 파일 중 5번(main 문서)은 이번에 쓰지 않음. 4절 금지는 그대로.
