# 232 · Cursor 작업지시 — 방 이름 「학생·학부모 고민방」 가운뎃점 통일 (218-10, 종현 t1651)

- 작성: 우동공과2(개발팀장), 2026-10-15 05:2x KST. 이 문서만 보고 작업할 수 있게 씀.
- 기준: origin/main `58036395`(B2 merge 포함, 사용자 안내의 `40264c14` 보다 1 merge 앞섬. 아래 줄은 두 커밋에서 같음).
- 한 줄 요약: 화면에 나오는 방 이름 「학생/학부모 고민방」(빗금)을 「학생·학부모 고민방」(가운뎃점)으로. **방 이름 글자 5줄, 파일 4개**. C(231)와 파일이 대부분 달라 따로 뗌.

## 0. 확정 기록
| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-15 | 종현 t1651 | **218-10** 방 이름은 「학생·학부모 고민방」(가운뎃점)으로 적는다. 지금 화면은 「학생/학부모 고민방」(빗금) |
| 2026-10-15 | 종현 t1651 | 비회원 찾기 레일 순서는 그대로(학생·학부모 먼저). 변경 없음 |

## 1. 화면에 나오는 「학생/학부모 고민방」 전부 (origin/main `58036395`, 우동공과2 `git grep` 확인)
| # | 파일:줄 | 지금 | 화면 어디 |
|---|---|---|---|
| N1 | `preview/home-ui/src/concern/copy.js:45` | `label: '학생/학부모 고민방',` | 커뮤니티 입구·레일 배너·읽기 팝업 제목 |
| N2 | `preview/home-ui/src/board-engine-copy.js:436` | `label: '학생/학부모 고민방',` | 게시판 화면 이름 |
| N3 | `preview/home-ui/src/board-engine-copy.js:440` | `userFacingMenu: '학생/학부모 고민방',` | 메뉴 이름 |
| N4 | `preview/home-ui/src/board-channel-acl.js:140` | `title: '학생/학부모 고민방',` | 권한 안내(입장 전 소개) 제목 |
| N5 | `src/Board/BoardChannelAcl.php:417` | `'title' => '학생/학부모 고민방',` | 서버가 주는 같은 소개 제목 |

방 이름이 **아닌** 「학생/학부모」(사람 묶음 문장)는 이번에 **바꾸지 않음**(열린 질문 Q1): `concern/copy.js:14`, `policy-copy.js:22`·`:104`·`:144`, `admin-red-line-copy.js:15`(관리자 화면), `promo/study-room-content.js:72`. 주석·검증 스크립트·SQL 주석(`board-channel-acl.js:622`, `scripts/verify-*`, `sql/schema/001`·`081`)도 그대로.

## 2. 바꿀 내용 — 이 폴더 `232-room-name.diff` 그대로
```diff
diff --git a/preview/home-ui/src/board-channel-acl.js b/preview/home-ui/src/board-channel-acl.js
index d3be0945..44ff0a3b 100644
--- a/preview/home-ui/src/board-channel-acl.js
+++ b/preview/home-ui/src/board-channel-acl.js
@@ -137,7 +137,7 @@ const DOWNLOAD_ROLES = {
 
 const CHANNEL_INTRO = {
   'concern-parent': {
-    title: '학생/학부모 고민방',
+    title: '학생·학부모 고민방',
     body: '공부방·과외 선택, 학습 루틴, 안전에 대한 고민을 나누는 공간입니다.',
     allowedRolesLabel: '학생·학부모',
   },
diff --git a/preview/home-ui/src/board-engine-copy.js b/preview/home-ui/src/board-engine-copy.js
index 15bea6a4..ce3f0b38 100644
--- a/preview/home-ui/src/board-engine-copy.js
+++ b/preview/home-ui/src/board-engine-copy.js
@@ -433,11 +433,11 @@ export const BOARD_REGISTRY = [
   },
   {
     boardKey: 'concern-parent',
-    label: '학생/학부모 고민방',
+    label: '학생·학부모 고민방',
     boardType: 'upload',
     presetId: 'concern',
     sectionOwner: 'community',
-    userFacingMenu: '학생/학부모 고민방',
+    userFacingMenu: '학생·학부모 고민방',
     /** 문서 concern-family ≡ concern-parent */
     visibility: 'public',
     readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
diff --git a/preview/home-ui/src/concern/copy.js b/preview/home-ui/src/concern/copy.js
index 53b4c897..80bc2fac 100644
--- a/preview/home-ui/src/concern/copy.js
+++ b/preview/home-ui/src/concern/copy.js
@@ -42,7 +42,7 @@ export const COMMUNITY_BOARD_DEFS = [
     id: 'parent',
     boardKey: 'concern-parent',
     slug: 'parent',
-    label: '학생/학부모 고민방',
+    label: '학생·학부모 고민방',
     roleHint: '공부방·과외 선택·루틴·안전',
     path: '/community/parent',
   },
diff --git a/src/Board/BoardChannelAcl.php b/src/Board/BoardChannelAcl.php
index f3defffc..a154e54b 100644
--- a/src/Board/BoardChannelAcl.php
+++ b/src/Board/BoardChannelAcl.php
@@ -414,7 +414,7 @@ final class BoardChannelAcl
         $key = self::normalizeBoardKey($boardKey);
         $map = [
             'concern-parent' => [
-                'title' => '학생/학부모 고민방',
+                'title' => '학생·학부모 고민방',
                 'body' => '공부방·과외 선택, 학습 루틴, 안전에 대한 고민을 나누는 공간입니다.',
                 'allowedRolesLabel' => '학생·학부모',
             ],
```

## 3. 허용 파일
위 4파일, 1절 N1~N5 다섯 줄만.

## 4. 금지
- 1절 「바꾸지 않음」 줄, 레일 순서·슬롯·DB·seed 금지. 새 문구·디자인 금지. C(231) 범위(`right-rail.js`, `rail-concern-popup.js`, `copy.js:64`) 금지.
- fast 모델 금지. `git add -A`/`git add .` 금지. force-push 금지. 비밀값 금지. main merge 금지(검수 뒤 종현 승인).

## 5. C(231)와의 관계
`concern/copy.js` 만 같이 만지고 줄이 다름(45 vs 64). C 적용 뒤에도 `git apply --check` 통과(우동공과2 확인). 순서 무관.

## 6. 합격 기준 (가볍게 — 229 §10 방식)
1. `git diff --stat origin/main...HEAD` = 정확히 4파일, 5줄 +/5줄 −
2. (Git Bash) `git diff origin/main...HEAD | grep -v '^index ' | diff - <(grep -v '^index ' docs/design/home-banner-rail-2026-10-14/232-room-name.diff)` → 빈 출력
3. `git grep -n "학생/학부모 고민방" HEAD -- preview src` → 1줄만(`board-channel-acl.js:622` 주석)
4. `git grep -n "학생·학부모 고민방" HEAD -- preview src` → 5줄

화면 측정·Docker·스크린숏 하지 않음.

## 7. 진행 순서
1. `git fetch origin` → 1절 N1~N5 확인(다르면 멈추고 보고).
2. `git switch -c cursor/room-name-dot-20261015 origin/main`
3. `git apply docs/design/home-banner-rail-2026-10-14/232-room-name.diff`
4. `git add preview/home-ui/src/concern/copy.js preview/home-ui/src/board-engine-copy.js preview/home-ui/src/board-channel-acl.js src/Board/BoardChannelAcl.php`
5. 커밋: `fix(copy): 방 이름 「학생·학부모 고민방」 가운뎃점 통일 (218-10, 종현 t1651)`
6. 6절 네 명령 → `git push origin cursor/room-name-dot-20261015`(브랜치만).
7. 답장: 커밋 해시 + 6절 출력만.

## 8. 열린 질문
- Q1. 방 이름이 아닌 문장 속 「공부방·과외쌤·학생/학부모」(커뮤니티 소개 `copy.js:14`, 약관·개인정보 `policy-copy.js` 3곳, 관리자 `admin-red-line-copy.js:15`, 홍보 `study-room-content.js:72`)도 가운뎃점으로 바꿀지? 바꾸면 「공부방·과외쌤·학생·학부모」처럼 점이 이어짐. 이번에는 방 이름 5줄만.
- Q2. DB에 저장된 게시판 이름이 따로 있으면(운영 DB, 이 저장소 SQL 에는 「학생/학부모 고민방」 없음) 그쪽은 확인 못 함.
