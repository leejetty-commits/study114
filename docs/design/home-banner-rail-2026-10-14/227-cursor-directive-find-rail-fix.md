# 227 · Cursor 보완 지시 — 찾기 레일 고민방 3칸 브랜치에서 서버·SQL 변경 빼기

- 작성: 우동공과2(개발팀장), 2026-10-15 · 기준 origin/main `aa0c74d` · 대상 브랜치 `cursor/home-find-rail-three-20261015` @ `91e03e3`
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제).
- 한 줄 요약: **화면 코드 두 파일은 그대로 둡니다.** 지시 범위 밖이었던 `sql/schema/081…` 삭제, PHP 두 파일은 origin/main 으로 되돌림. 새 커밋을 위에 쌓고 force-push 는 금지.

## 0. 배경과 확정 기록

| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-14 | 종현 t1581 | 219 E3 「고민방 3칸이 홈 전용인지」 **보류** |
| 2026-10-15 | 종현 t1610 | 찾기 화면 레일: 공부방·과외쌤 모드는 홈과 같은 세 고민방(자기 방 먼저), 학생 모드는 학생/학부모 고민방 1칸(지금 그대로) |
| 2026-10-15 | 종현 t1611 | 비회원도 찾기 레일 세 고민방(Cursor가 만든 동작 유지). 글은 **제목만** — 작성자·본문 없음(레일·팝업 모두) |

- 219 E3 보류는 위 결정으로 **닫혔습니다**. 우동공과2가 218 확정 기록 표와 219(상단 갱신 줄, E3 행)에 이미 적었습니다. Cursor는 218·219 를 고치지 마세요.
- 정본 9장 §14-b(main `42078e9`)의 비회원 줄(「제목만」, 「찾기 레일 고민방 3칸…비회원은 제목만」)은 t1611과 맞으므로 **고치지 마세요**.
- 지시 범위 밖이었던 것: 운영 DB를 바꾸는 `081` SQL과 서버 기본값(PHP 두 파일). 화면 코드가 저장값과 상관없이 세 방을 채우므로 화면 동작에는 필요 없습니다. 운영 설정을 바꾸는 일은 종현 승인 없이 하지 않습니다.

### 우동공과2 사전 측정(91e03e3, 로컬 vite + playwright, 서버 흉내)
- 찾기 화면(search-ui): 비회원 = 학생/학부모·공부방·과외쌤 3칸, 공부방 = 공부방 먼저 3칸, 과외쌤 = 과외쌤 먼저 3칸, 학생 = 1칸. 3폭(1280/1023/390) 모두 같음.
- 비회원: 서버 흉내 응답에 작성자·본문 미끼를 일부러 넣어도(access=titles) 레일·팝업에 나오지 않음. 팝업은 제목·날짜·반응 수·댓글 수 + 「로그인하면 전체 내용을 볼 수 있어요」.
- 홈 레일: 4모드×3폭 모두 main 과 같음.
- 판정 `227-judge-find-rail.py`: **91e03e3 vs aa0c74d = 24/24 PASS**. 반대로 main 을 main 과 비교하면 15/24(찾기 9칸이 1칸이라 실패) → 측정이 차이를 잡는 것 확인.
- 그림: `png/227-find-guest-1280.png`, `png/227-find-studyroom-1280.png`.
- 그래서 이번 보완 뒤에도 화면 측정 결과는 **똑같이 24/24** 여야 합니다(서버 파일만 빠짐).

## 1. 손대기 전 다시 확인(필수, 다르면 짐작하지 말고 멈춘 뒤 보고)

`git fetch origin` 후 확인.

| # | 위치 | 있어야 할 내용 |
|---|---|---|
| L0 | `git rev-parse origin/cursor/home-find-rail-three-20261015` | `91e03e3260ff94b9ba0dcb6132c50c53f13e549e` (다르면 멈춤) |
| L1 | `git diff --stat origin/main...91e03e3` | 정확히 5파일: `preview/home-ui/src/right-rail-store.js`(2), `preview/home-ui/src/right-rail.js`(10), `sql/schema/081_search_rail_three_concern_boards.sql`(12), `src/Admin/ContentAclSeedGuard.php`(3), `src/Admin/ContentSchemaMigrateService.php`(2) |
| L2 | `sql/schema/081_search_rail_three_concern_boards.sql:1` (91e03e3) | `-- 찾기 레일 고민방 3칸. 공부방·과외쌤은 홈과 같이 세 방, 학생은 화면에서 학생/학부모 방만.` (12줄, `UPDATE right_rail_slot_definitions` 3행) |
| L3 | `src/Admin/ContentAclSeedGuard.php:70` | `'source_board_keys_json' => self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),` |
| L4 | `ContentAclSeedGuard.php:79` | `self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),` (replaceable 목록 첫 줄) |
| L5 | `src/Admin/ContentSchemaMigrateService.php:785` | `['slot_key' => 'search_right_rail', … 'source_board_keys_json' => $keys(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']), …` |
| L6 | `preview/home-ui/src/right-rail.js:237` / `:246` | `  if (slotKey === 'search_right_rail') {` / `  }` (사이 8줄 = 고민방 세 개 끼워 넣기) — **그대로 둠** |
| L7 | `preview/home-ui/src/right-rail-store.js:71` | `    sourceBoardKeys: ['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide'],` — **그대로 둠** |
| L8 | `git diff c1984175 origin/main -- src sql preview` | 빈 출력(브랜치 기준 뒤 main 커밋은 문서만). 비어 있지 않으면 그 파일 목록을 보고하고 멈춤 |

## 2. 바꿀 내용(정확히 이것만)

```
git switch cursor/home-find-rail-three-20261015      # 없으면: git switch -c cursor/home-find-rail-three-20261015 origin/cursor/home-find-rail-three-20261015
git rm sql/schema/081_search_rail_three_concern_boards.sql
git checkout origin/main -- src/Admin/ContentAclSeedGuard.php src/Admin/ContentSchemaMigrateService.php
git status --short        # 정확히 D sql/... , M src/Admin/ContentAclSeedGuard.php , M src/Admin/ContentSchemaMigrateService.php
git commit -m "revert(rail): 찾기 레일 081 SQL·서버 기본값 변경 빼기 — 화면 코드만 유지 (종현 t1610·t1611 2026-10-15)"
```

결과 diff(91e03e3 → 새 커밋) 는 아래와 **같아야** 합니다.

```diff
--- a/sql/schema/081_search_rail_three_concern_boards.sql
+++ /dev/null
@@ -1,12 +0,0 @@ (파일 전체 삭제)
--- a/src/Admin/ContentAclSeedGuard.php
+++ b/src/Admin/ContentAclSeedGuard.php
@@ -67,7 +67,7 @@ final class ContentAclSeedGuard
-                        'source_board_keys_json' => self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),
+                        'source_board_keys_json' => self::json(['faq', 'concern-parent', 'safe-guide']),
@@ -76,7 +76,6 @@ final class ContentAclSeedGuard
                         'source_board_keys_json' => [
-                            self::json(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']),
                             self::json(['faq', 'concern-parent', 'safe-guide']),
--- a/src/Admin/ContentSchemaMigrateService.php
+++ b/src/Admin/ContentSchemaMigrateService.php
@@ -782,7 +782,7 @@ final class ContentSchemaMigrateService
-            ['slot_key' => 'search_right_rail', … $keys(['faq', 'concern-director', 'concern-tutor', 'concern-parent', 'safe-guide']), …],
+            ['slot_key' => 'search_right_rail', … $keys(['faq', 'concern-parent', 'safe-guide']), …],
```

### 최신 main 반영(보통 방법만)
- `git merge --no-edit origin/main` (merge commit). 우동공과2 확인: `git merge-tree` 로 91e03e3 + aa0c74d 충돌 없음.
- 충돌이 나거나 merge 가 어려우면 rebase·force-push 하지 말고: `git switch -c cursor/home-find-rail-three-20261015-v2 origin/main` → `git cherry-pick 91e03e3 <위 revert 커밋>` → v2 브랜치를 push 하고 보고서에 v2라고 적기.
- `git push origin cursor/home-find-rail-three-20261015` (일반 push. `--force`/`--force-with-lease` 금지).

### 끝난 뒤 반드시 이렇게 나와야 함
- `git diff --stat origin/main...HEAD` = **정확히 2파일**: `preview/home-ui/src/right-rail-store.js | 2 +-`, `preview/home-ui/src/right-rail.js | 10 ++++++++++` (내용은 91e03e3 과 글자 하나까지 같음: `git diff 91e03e3 HEAD -- preview/` 빈 출력)
- `git diff origin/main...HEAD -- src sql` 빈 출력. `ls sql/schema/081*` 없음.

## 3. 허용 파일

1. `sql/schema/081_search_rail_three_concern_boards.sql` — 삭제만
2. `src/Admin/ContentAclSeedGuard.php` — origin/main 과 똑같이 되돌림만
3. `src/Admin/ContentSchemaMigrateService.php` — origin/main 과 똑같이 되돌림만
4. (main 에 문서만) `docs/worklog/2026/10/2026-10-15-find-rail-fix-report.md`, `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄, 그림 `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-*.png`

이 밖은 한 줄이라도 바꾸면 불합격.

## 4. 금지

- `right-rail.js`·`right-rail-store.js` 수정 금지(화면 동작은 t1611로 확정, 지금 코드 유지). 비회원을 빼는 조건 같은 것 넣지 말 것.
- 작업 C(지시서 224) 범위 금지: `right-rail.js` 의 `railLeaveMode`(117-121), `concernInPageControl`(124-149), `railSlotAnchor`(152-160), `communityHubForRole`(245, 이 브랜치에서는 255), `renderLivePostCard`(415→425), CTA(535→545), `renderActionItem`(637-649→647-659), `concern/copy.js` 전체, `concern/rail-concern-popup.js`. 「원장」 문구 어떤 것도 바꾸지 말 것.
- 작업 B2(지시서 225, 브랜치 `cursor/home-b2-best-fix-20261015` a49f256) 범위 금지: `renderBestSection` 0건 버튼 두 줄(main 494·497, 이 브랜치 504·507), `home-right-rail.css`.
- 운영 DB 변경·SQL 실행·SQL 파일 추가 금지. 정본 9장, 218, 219, 224, 225 문서 수정 금지.
- 하위 에이전트에 빠른(fast) 모델 금지. `git add -A`/`git add .` 금지(파일 이름으로만). force-push·rebase 후 push·`reset --hard` 로 push 된 커밋 지우기 금지. 비밀값(.env, 토큰, 비밀번호) 커밋 금지. main 에 코드 merge 금지(검수 뒤 종현 승인).

## 5. merge 순서와 다른 작업과의 관계

- 순서: **B2(a49f256) → 이 브랜치 → C(224)** 권장. 세 브랜치 겹치는 줄 없음(우동공과2 `git merge-tree` : 91e03e3+a49f256 충돌 없음, 91e03e3+origin/main 충돌 없음).
- 이 브랜치는 `right-rail.js:237` 에 10줄을 넣습니다. 그래서 이 브랜치가 C보다 먼저 merge 되면 **C의 §1 확인 줄 번호가 236행 뒤로 +10** 밀립니다: R5 245→255, R6 415→425, R7 535→545, R8 637-649→647-659. R1-R4(117-160)·R9(copy.js:64)·R10(팝업)·R11(CSS)은 그대로. C 작업자는 새 줄 번호로 확인하고 내용이 같으면 진행(224 표는 우동공과2가 그때 고침).
- B2 는 줄을 더하지 않아서(두 줄 수정) B2 먼저여도 이 브랜치 줄 번호는 안 변합니다. 이 브랜치가 먼저면 B2 R1·R2 는 504·507.

## 6. 합격 기준 (찾기 화면 4모드 × 1280/1023/390 = 12칸 + 홈 레일 12칸 = 24칸)

| 경우 | 항목 | 기준 |
|---|---|---|
| 찾기·공부방 | 고민방 칸 | 정확히 3칸, 순서 `concern-director, concern-tutor, concern-parent` (이달의 베스트 3개도 같은 순서) |
| 찾기·과외쌤 | 고민방 칸 | 정확히 3칸, `concern-tutor, concern-director, concern-parent` |
| 찾기·학생 | 고민방 칸 | 정확히 1칸, `concern-parent` (main 과 같음) |
| 찾기·비회원 | 고민방 칸 | 정확히 3칸, `concern-parent, concern-director, concern-tutor` |
| 찾기·비회원 | 제목만 | 레일·베스트 팝업 글에 작성자 미끼 「미끼작성자」·본문 미끼 「미끼본문내용」 **0건**, 팝업 `.rail-popup__body` 없음 |
| 찾기 공통 | 다른 칸 | 고민방 칸을 뺀 칸 순서(베스트→현장→추천 행동→정보 3칸)가 main 과 같음, 베스트 글 누르면 팝업 열림 |
| 홈 4모드 | 변경 없음 | 고민방·베스트 순서, 칸 순서, 레일 글자 전체가 main 과 **똑같음** |
| 공통 | 개발 용어 | 레일·팝업 글자에 `concern-`, `undefined`, `null`, `NaN`, `search_right_rail`, `intro_only`, `board_key`, `sourceBoardKeys` 0건 |
| 코드 | 파일 | §2 끝 「반드시 이렇게」 3줄 모두 맞음 |

판정 출력은 정확히 **`24/24 PASS []`**.

## 7. 측정 스크립트 (`227-measure-find-rail.py` + `227-judge-find-rail.py`, 이 폴더)

- 찾기 화면은 **search-ui** 앱(`#/search/room` 등), 홈은 home-ui 앱. home-ui 의 `#/search/...` 는 홈 레일이라 측정이 안 됨(우동공과2 확인).
- 서버는 흉내: `/api/auth/me.php`(역할), `/api/board/concern-hot.php`·`/api/board/posts.php`(세 방 글, 비회원은 `access=titles` + 미끼).

```
# 브랜치 worktree
cd preview/home-ui && npm i && npx vite --port 5191 --host 127.0.0.1
cd preview/search-ui && npm i && npx vite --port 5193 --strictPort
# origin/main worktree
cd preview/home-ui && npx vite --port 5192 --host 127.0.0.1
cd preview/search-ui && npx vite --port 5194 --strictPort
python3 -m playwright install chromium-headless-shell   # 처음 한 번
python3 227-measure-find-rail.py 5191 5193 && python3 227-measure-find-rail.py 5192 5194
python3 227-judge-find-rail.py /tmp/fr-5191.json /tmp/fr-5192.json   # 기대: 24/24 PASS []
```

참고: 한 번 도는 데 약 2~3분. 찾기 1280 화면 그림이 `/tmp/fr-5191-<모드>.png` 로 남음.

## 8. 진행 순서

1. `git fetch origin` → 1절 L0~L8 확인(다르면 멈추고 보고).
2. 2절 명령 → revert 커밋 → `git merge --no-edit origin/main`(또는 v2 방법) → 2절 끝 3줄 확인.
3. 7절 측정(브랜치 vs main) → `24/24 PASS []`. 그림 4장(찾기 1280 비회원·공부방·과외쌤·학생).
4. `git push origin <브랜치>` (일반 push).
5. **작업 기록은 main 에 바로 커밋**(문서만, 파일 이름으로 add):
   - `docs/worklog/2026/10/2026-10-15-find-rail-fix-report.md` — 브랜치(v2 여부), 커밋 해시 (revert 커밋·merge 커밋), `git diff --stat origin/main...HEAD` 출력, 1절 확인 결과, 24칸 판정 출력, 그림 경로(`docs/worklog/2026/10/img/2026-10-15-find-rail-fix-*.png`), 지시와 다른 점, 확인 못 한 것.
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄: `- 2026-10-15 찾기 레일 보완(227) 081 SQL·PHP 2개 되돌림, 브랜치 cursor/home-find-rail-three-20261015 <해시> push, 검수 대기`
6. 답장: 보고서 경로, 브랜치 커밋 해시, main 기록 커밋 해시.
