# 227 · Cursor 보완 지시 — 찾기 레일 고민방 3칸: DB·서버·화면 일치 (개정 t1625)

- 작성: 우동공과2(개발팀장), 2026-10-15 · 기준 origin/main `7563ffe` (그 앞 `73a8f4a`·`2beb93c`, 사이 커밋은 문서만) · 대상 브랜치 `cursor/home-find-rail-three-20261015` @ `91e03e3`
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제).
- **이 개정이 앞선 227(「081·PHP 빼기」, main 73a8f4a·7563ffe)을 대체합니다.** 앞선 지시대로 이미 작업했다면 그 커밋을 `git revert` 로 되돌린 뒤(새 커밋, force-push 금지) 이 지시를 하세요.
- 한 줄 요약: **081 SQL과 PHP 두 파일은 남기고(081은 튼튼하게 고침), `right-rail.js` 의 세 방 강제 끼워 넣기 10줄은 뺀다.** `right-rail-store.js` 기본값(세 방)은 남긴다.

## 0. 배경과 확정 기록

| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-14 | 종현 t1581 | 219 E3 「고민방 3칸이 홈 전용인지」 보류 |
| 2026-10-15 | 종현 t1610 | 찾기 레일: 공부방·과외쌤 = 홈과 같은 세 방(자기 방 먼저), 학생 = 학생/학부모 방 1칸 |
| 2026-10-15 | 종현 t1611 | 비회원도 세 방, 글은 **제목만**(작성자·본문 없음) |
| 2026-10-15 | 종현 t1625 | **DB·서버 기본값·화면 기본값을 모두 세 방으로 맞춘다.** 화면은 저장된 목록을 따르고(강제로 채우지 않음), 역할 거름(`canShowBoardInRail`)이 학생 1칸·비회원 제목만을 만든다 |

- 정본 9장 §14-b(main 42078e9)와 218·219 기록(우동공과2가 t1625까지 적음)은 **Cursor가 고치지 않습니다.**

### 꼭 알아 둘 것: 화면이 DB 목록을 읽는 경우 (우동공과2 코드 확인)
- 레일 칸 목록은 `right-rail-store.js` `listRightRailSlots()` = 화면 기본값 → (DB 목록) → (세션 저장값) 순서로 덮습니다.
- **DB 목록은 운영자(관리자) 로그인일 때만 불러옵니다**: `preview/home-ui/src/main.js:369-377`, `:466-473` 에서 `isAdminUser()` 일 때만 `activateContentConfigApi()`. 비회원·공부방·과외쌤·학생은 **화면 기본값**(`right-rail-store.js:71`)을 씁니다.
- 그래서 이 브랜치를 배포하면 **일반 이용자 찾기 레일은 081 적용과 상관없이 바로 세 방**(학생 1칸)이 됩니다. 081을 적용하기 전에는 **운영자 로그인 화면과 관리 화면만** 옛 목록(학생/학부모 방 1칸)을 따릅니다. 081은 DB를 화면 기본값과 맞추는 일입니다.
- 「운영자가 DB에서 방을 빼면 모든 이용자 화면에서 빠진다」는 지금 구조로는 **되지 않습니다**(기존 구조, 이번 범위 밖). 이번 변경으로 보장되는 것은 「화면이 받은 목록을 그대로 따른다(강제로 채우지 않는다)」입니다.

## 1. 손대기 전 다시 확인(필수, 다르면 짐작하지 말고 멈춘 뒤 보고)

`git fetch origin` 후.

| # | 위치 | 있어야 할 내용 |
|---|---|---|
| L0 | `git rev-parse origin/cursor/home-find-rail-three-20261015` | `91e03e3260ff94b9ba0dcb6132c50c53f13e549e` (앞선 227로 커밋을 쌓았으면 그 해시와 내용을 보고하고, 그 커밋을 revert 한 뒤 진행) |
| L1 | `git diff --stat origin/main...91e03e3` | 5파일: `right-rail-store.js`(2), `right-rail.js`(10), `sql/schema/081_…`(12), `ContentAclSeedGuard.php`(3), `ContentSchemaMigrateService.php`(2) |
| L2 | `git diff 91e03e3 origin/main -- src sql preview` 에서 `src/Admin`·`sql/schema/081`·`right-rail*.js` 말고 다른 코드 파일 | 없음(origin/main 의 91e03e3 뒤 커밋은 문서만: `git diff --stat c1984175 origin/main -- src sql preview` 빈 출력) |
| L3 | `preview/home-ui/src/right-rail.js:237` ~ `:246` (91e03e3) | `  if (slotKey === 'search_right_rail') {` … `    unique.splice(0, unique.length, ...head, ...concern, ...tail);` / `  }` — **이 10줄을 뺌** |
| L4 | `right-rail.js:236` / `:247` | `  const unique = [...new Set(configured.map(normalizeBoardKey).filter(Boolean))];` / `  const guestFilter = ctx.guestFilter \|\| slot?.guestFilter \|\| 'allow';` |
| L5 | `preview/home-ui/src/right-rail-store.js:71` | `    sourceBoardKeys: ['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide'],` — 그대로 |
| L6 | `sql/schema/081_search_rail_three_concern_boards.sql` | 12줄, 7행 `  AND source_board_keys_json IN (` — 아래 2절로 바꿈 |
| L7 | `src/Admin/ContentAclSeedGuard.php:70`, `:79` | 세 방 목록(`self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide'])`) — 그대로. 이 파일은 `json_decode` 로 값을 풀어 비교함(:222-235) → 공백 차이 문제 없음 |
| L8 | `src/Admin/ContentSchemaMigrateService.php:785` | search 행 `$keys(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide'])` — 그대로 |
| L9 | `sql/schema/035_content_config_definitions.sql:43` | `  source_board_keys_json  JSON NULL,` (열 형식 JSON. MariaDB면 LONGTEXT 별칭 → 081은 둘 다 되는 문자열 비교) |
| L10 | `preview/home-ui/src/main.js:374`, `:470` | `await activateContentConfigApi()` 가 `isAdminUser()` 조건 안에만 있음 |

## 2. 바꿀 내용(검증한 diff 그대로, 글자 하나까지 같게)

### 2-1. right-rail.js — 강제 끼워 넣기 10줄 빼기 (결과: origin/main 의 이 파일과 똑같음)

```diff
diff --git a/preview/home-ui/src/right-rail.js b/preview/home-ui/src/right-rail.js
index 744ec031..e3ab6c82 100644
--- a/preview/home-ui/src/right-rail.js
+++ b/preview/home-ui/src/right-rail.js
@@ -234,16 +234,6 @@ function resolveConcernBoardKeysForSlot(slotKey, ctx) {
   if (slot?.sourceBoardKey) configured.push(slot.sourceBoardKey);
   if (Array.isArray(slot?.sourceBoardKeys)) configured.push(...slot.sourceBoardKeys);
   const unique = [...new Set(configured.map(normalizeBoardKey).filter(Boolean))];
-  if (slotKey === 'search_right_rail') {
-    const concern = ['concern-director', 'concern-tutor', 'concern-parent'];
-    const head = [];
-    for (const key of unique) {
-      if (concern.includes(key)) break;
-      head.push(key);
-    }
-    const tail = unique.filter((key) => !concern.includes(key) && !head.includes(key));
-    unique.splice(0, unique.length, ...head, ...concern, ...tail);
-  }
   const guestFilter = ctx.guestFilter || slot?.guestFilter || 'allow';
   const visible = unique.filter(
     (key) => isConcernBoardKey(key) && canShowBoardInRail(key, ctx.navRole, { guestFilter }),
```

### 2-2. 081 SQL — 공백·줄바꿈이 달라도 옛 값을 알아보게

```diff
--- a/sql/schema/081_search_rail_three_concern_boards.sql
+++ b/sql/schema/081_search_rail_three_concern_boards.sql
@@ -1,12 +1,13 @@
--- 찾기 레일 고민방 3칸. 공부방·과외쌤은 홈과 같이 세 방, 학생은 화면에서 학생/학부모 방만.
--- 종현 2026-10-15. 기존 값(학생/학부모 방만, 또는 family 별칭)일 때만 바꾼다.
+-- 찾기 레일 고민방 3칸(공부방·과외쌤·학생/학부모). 화면이 역할별로 거른다: 학생 1칸, 비회원 3칸 제목만.
+-- 종현 2026-10-15 t1610·t1611·t1625(DB·서버·화면 일치).
+-- 옛 기본값(학생/학부모 방만, 또는 family 별칭)일 때만 바꾼다. 공백·줄바꿈만 다른 값도 같은 값으로 본다.
+-- 운영자가 바꾼 다른 값은 건드리지 않는다. 다시 돌려도 바뀌는 행 0(새 값은 조건에 안 걸림).
+-- MySQL 8(JSON 열)·MariaDB(JSON = LONGTEXT) 둘 다 되는 문자열 비교만 쓴다.
 UPDATE right_rail_slot_definitions
 SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
     updated_at = NOW()
 WHERE slot_key = 'search_right_rail'
-  AND source_board_keys_json IN (
+  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
     '["faq","concern-parent","safe-guide"]',
-    '["faq", "concern-parent", "safe-guide"]',
-    '["faq","concern-family","safe-guide"]',
-    '["faq", "concern-family", "safe-guide"]'
+    '["faq","concern-family","safe-guide"]'
   );
```

고친 뒤 파일 전체:

```sql
-- 찾기 레일 고민방 3칸(공부방·과외쌤·학생/학부모). 화면이 역할별로 거른다: 학생 1칸, 비회원 3칸 제목만.
-- 종현 2026-10-15 t1610·t1611·t1625(DB·서버·화면 일치).
-- 옛 기본값(학생/학부모 방만, 또는 family 별칭)일 때만 바꾼다. 공백·줄바꿈만 다른 값도 같은 값으로 본다.
-- 운영자가 바꾼 다른 값은 건드리지 않는다. 다시 돌려도 바뀌는 행 0(새 값은 조건에 안 걸림).
-- MySQL 8(JSON 열)·MariaDB(JSON = LONGTEXT) 둘 다 되는 문자열 비교만 쓴다.
UPDATE right_rail_slot_definitions
SET source_board_keys_json = '["faq","concern-director","concern-tutor","concern-parent","safe-guide"]',
    updated_at = NOW()
WHERE slot_key = 'search_right_rail'
  AND REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') IN (
    '["faq","concern-parent","safe-guide"]',
    '["faq","concern-family","safe-guide"]'
  );
```

- 멱등: 새 값은 조건에 안 걸려 다시 돌려도 0행. 운영자가 바꾼 값(옛 기본값 두 가지가 아닌 것)은 0행.
- `CHAR(10)` 등을 쓴 이유: `NO_BACKSLASH_ESCAPES` 모드에서도 같게 동작.
- 실제 DB(MySQL/MariaDB)로는 우동공과2가 돌려 보지 못했습니다(상자에 DB 없음). Cursor는 가능하면 `docker/docker-compose.dev.yml`(mysql:8.4)로 ① 옛 값 공백 없음 ② `JSON` 열에 넣은 옛 값(MySQL은 `["faq", "concern-parent", "safe-guide"]` 로 보여 줌) ③ 운영자 값 ④ 두 번 실행 — 네 경우 영향 행 수(1·1·0·0)를 보고서에 적으세요. 못 하면 「못 함」으로 적기.

### 2-3. 그 밖
- `right-rail-store.js`, `ContentAclSeedGuard.php`, `ContentSchemaMigrateService.php` 는 91e03e3 그대로.
- 끝난 뒤 `git diff --stat origin/main...HEAD` = **정확히 4파일**: `right-rail-store.js | 2 +-`, `sql/schema/081_… | 13 +` , `ContentAclSeedGuard.php | 3 ++-`, `ContentSchemaMigrateService.php | 2 +-`. `git diff origin/main...HEAD -- preview/home-ui/src/right-rail.js` 빈 출력.

### 2-4. 커밋·main 반영
```
git switch cursor/home-find-rail-three-20261015   # 없으면 origin 에서 따라 만들기
# 2-1, 2-2 적용
git add preview/home-ui/src/right-rail.js sql/schema/081_search_rail_three_concern_boards.sql
git commit -m "fix(rail): 찾기 레일은 저장 목록을 따름(강제 세 방 제거), 081 공백 무관 비교 (종현 t1625 2026-10-15)"
git merge --no-edit origin/main      # 충돌·어려움 → git switch -c cursor/home-find-rail-three-20261015-v2 origin/main && git cherry-pick 91e03e3 <위 커밋>
git push origin <브랜치>            # 일반 push 만
```

## 3. 허용 파일
1. `preview/home-ui/src/right-rail.js` — 2-1 의 10줄 삭제만
2. `sql/schema/081_search_rail_three_concern_boards.sql` — 2-2 그대로
3. (main 에 문서만) `docs/worklog/2026/10/2026-10-15-find-rail-fix-report.md`, `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄, `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-*.png`

이 밖은 한 줄이라도 바꾸면 불합격.

## 4. 금지
- `right-rail-store.js`·PHP 두 파일 수정 금지. 다른 SQL 파일 추가 금지. 운영 DB에 직접 SQL 실행 금지(081 적용은 종현이 phpMyAdmin으로).
- 「DB 목록을 일반 이용자에게도 읽히게」 같은 구조 변경 금지(범위 밖, 따로 결정).
- 작업 C(224) 범위 금지: `railLeaveMode`(117-121), `concernInPageControl`(124-149), `railSlotAnchor`(152-160), `communityHubForRole`(245), `renderLivePostCard`(415), CTA(535), `renderActionItem`(637-649), `concern/copy.js` 전체, `concern/rail-concern-popup.js`. 「원장」 문구 어떤 것도 바꾸지 말 것.
- 작업 B2(225, `cursor/home-b2-best-fix-20261015` a49f256) 범위 금지: `renderBestSection` 0건 버튼 두 줄(494·497), `home-right-rail.css`.
- 정본 9장, 218, 219, 224, 225, 227 문서 수정 금지.
- 하위 에이전트에 빠른(fast) 모델 금지. `git add -A`/`git add .` 금지. force-push·rebase 후 push·push 된 커밋 지우기 금지. 비밀값 커밋 금지. main 에 코드 merge 금지(검수 뒤 종현 승인).

## 5. merge 순서·줄 번호
- 순서: **B2(a49f256) → 이 브랜치 → C(224)**. 겹치는 줄 없음(우동공과2 `git merge-tree`: 91e03e3+a49f256, 91e03e3+origin/main 충돌 없음).
- 2-1 뒤 `right-rail.js` 는 origin/main 과 같아지므로 **C·B2 의 §1 줄 번호는 바뀌지 않습니다**(앞선 227의 「+10 밀림」 안내는 없어짐).

## 6. 배포 순서 (종현)

1. 이 브랜치 검수 PASS 뒤, 배포 **전이나 같이** phpMyAdmin 에서 아래 ①→②→③.
2. 081 적용 전: 일반 이용자 화면은 배포만으로 세 방(학생 1칸). **운영자 로그인 화면·관리 화면만** 찾기 레일 고민방 1칸(옛 DB 값).
3. 081 적용 후: DB·서버 기본값·화면 기본값이 모두 세 방.

```sql
-- ① 적용 전 확인 (phpMyAdmin SQL 탭)
SELECT VERSION() AS db_version;
SELECT DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'right_rail_slot_definitions' AND COLUMN_NAME = 'source_board_keys_json';
SELECT slot_key, source_board_keys_json,
       REPLACE(REPLACE(REPLACE(REPLACE(CAST(source_board_keys_json AS CHAR), ' ', ''), CHAR(10), ''), CHAR(13), ''), CHAR(9), '') AS normalized,
       updated_at
  FROM right_rail_slot_definitions WHERE slot_key = 'search_right_rail';
-- 기대: 1행. normalized 가 '["faq","concern-parent","safe-guide"]' 또는 '["faq","concern-family","safe-guide"]' 이면 081이 바꾼다.
--       다른 값이면 운영자가 바꾼 값 → 081은 0행(그대로). 이 경우 종현이 그대로 둘지 정한다.

-- ② 081 실행 (sql/schema/081_search_rail_three_concern_boards.sql 전체 붙여 넣기) → 「1행 영향」(옛 값일 때) 또는 「0행」(이미 새 값/운영자 값)

-- ③ 적용 후 확인
SELECT slot_key, source_board_keys_json, updated_at FROM right_rail_slot_definitions WHERE slot_key = 'search_right_rail';
-- 기대: source_board_keys_json 이 ["faq","concern-director","concern-tutor","concern-parent","safe-guide"] (MySQL 은 쉼표 뒤 공백을 붙여 보여 줄 수 있음)
```

배포 Actions 는 SQL을 실행하지 않습니다.

## 7. 합격 기준

화면: 찾기(search-ui) 4모드 × 1280/1023/390 = 12칸 + 홈 레일 12칸 = 24칸, **세 경우 모두 `24/24 PASS []`**.

| 경우 | 저장 목록 | 찾기 레일 고민방 (공부방 / 과외쌤 / 학생 / 비회원) |
|---|---|---|
| default | 없음(화면 기본값 = 081 뒤 DB 값) | D,T,P / T,D,P / P / P,D,T |
| old | 옛 값 `['faq','concern-parent','safe-guide']` | P / P / P / P (설정을 따름 — 강제 채우기 없음 증명) |
| removed | 운영자가 과외쌤 방을 뺌 `['faq','concern-director','concern-parent','safe-guide']` | D,P / D,P / P / P,D |

(D=공부방 고민방, T=과외쌤 고민방, P=학생/학부모 고민방. 베스트 3개도 같은 순서.)

모든 경우 공통: 비회원 레일·팝업에 작성자·본문 미끼 0건(`.rail-popup__body` 없음), 고민방 칸 말고 다른 칸 순서가 main 과 같음, 베스트 팝업 열림, 홈 레일 4모드가 main 과 글자까지 같음, 화면 글자에 `concern-`·`undefined`·`null`·`NaN`·`search_right_rail`·`intro_only`·`board_key`·`sourceBoardKeys` 0건.
코드: 2-3 끝의 diff 조건.

우동공과2 측정(91e03e3 + 2-1 임시 적용, main 7563ffe 기준): **default 24/24, old 24/24, removed 24/24 PASS**. 같은 판정으로 main 은 default 15/24(찾기 9칸이 1칸) → 측정이 차이를 잡음. 그림 `png/227-find-guest-1280.png`, `png/227-find-studyroom-1280.png`, `png/227-find-studyroom-oldlist-1280.png`.

## 8. 측정 스크립트 (`227-measure-find-rail.py` + `227-judge-find-rail.py`)

- 찾기 화면은 **search-ui** 앱(`#/search/...`). home-ui 의 `#/search/...` 는 홈 레일이라 측정 안 됨.
- 서버 흉내: `/api/auth/me.php`(역할), `/api/board/concern-hot.php`·`/api/board/posts.php`(세 방 글, 비회원 `access=titles` + 작성자·본문 미끼).
- 저장 목록(old·removed)은 관리 화면 저장값과 같은 길(sessionStorage `study114-right-rail-slot-definitions-v1`)로 넣음. `listRightRailSlots()` 에서 DB 목록 다음에 덮는 같은 병합 경로.

```
# 브랜치 worktree
(cd preview/home-ui && npm i && npx vite --port 5191 --host 127.0.0.1) & (cd preview/search-ui && npm i && npx vite --port 5193 --strictPort) &
# origin/main worktree
(cd preview/home-ui && npm i && npx vite --port 5192 --host 127.0.0.1) & (cd preview/search-ui && npm i && npx vite --port 5194 --strictPort) &
python3 -m playwright install chromium-headless-shell   # 처음 한 번
for s in default old removed; do python3 227-measure-find-rail.py 5191 5193 $s; done
python3 227-measure-find-rail.py 5192 5194 default
for s in default old removed; do python3 227-judge-find-rail.py /tmp/fr-5191-$s.json /tmp/fr-5192-default.json $s; done   # 기대: 셋 다 24/24 PASS []
```
한 경우에 약 2~3분. `npm i` 가 `preview/search-ui/package-lock.json` 을 바꾸면 커밋하지 말 것.

## 9. 진행 순서
1. `git fetch origin` → 1절 L0~L10(다르면 멈추고 보고).
2. 2절 → 커밋 → merge(또는 v2) → 2-3 diff 조건 확인.
3. (가능하면) 2-2 의 mysql:8.4 네 경우 확인.
4. 8절 측정 세 경우 → 셋 다 `24/24 PASS []`. 그림: 찾기 1280 비회원·공부방·과외쌤·학생(default), 공부방(old).
5. `git push origin <브랜치>` (일반 push).
6. **작업 기록은 main 에 바로 커밋**(문서만, 파일 이름으로 add):
   - `docs/worklog/2026/10/2026-10-15-find-rail-fix-report.md` — 브랜치(v2 여부), 커밋 해시, `git diff --stat origin/main...HEAD`, 1절 확인 결과, 세 경우 판정 출력, 081 DB 확인 결과(또는 못 함), 그림 경로, 지시와 다른 점, 확인 못 한 것.
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄: `- 2026-10-15 찾기 레일 보완(227 개정 t1625) 강제 세 방 제거·081 공백 무관, 브랜치 cursor/home-find-rail-three-20261015 <해시> push, 검수 대기 (배포 때 종현 081 적용)`
7. 답장: 보고서 경로, 브랜치 커밋 해시, main 기록 커밋 해시.
