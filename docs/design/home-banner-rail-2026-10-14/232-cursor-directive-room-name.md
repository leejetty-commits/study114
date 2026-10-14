# 232 · Cursor 작업지시 — 방 이름 「학생·학부모 고민방」 가운뎃점 통일 (218-10, 종현 t1651)

- 작성: 우동공과2(개발팀장), 2026-10-15 05:2x KST. 이 문서만 보고 작업할 수 있게 씀.
- 기준: origin/main `e50ab987`(코드는 `58036395` 와 같음).
- **순서: 231(작업 C) 먼저 merge → 그다음 이 232** (종현 지시 2026-10-15). 겹치는 줄은 없음.
- **확인 (종현 t1657)**: 이용약관·개인정보처리방침(`policy-copy.js`) 표기 변경은 **별도 공지 없이** 진행.
- **개정 1 (종현 t1652)**: 문장 속 「학생/학부모」 6줄도 가운뎃점으로 → 11줄·7파일.
- 한 줄 요약: 화면에 나오는 방 이름 「학생/학부모 고민방」(빗금)을 「학생·학부모 고민방」(가운뎃점)으로. **방 이름 5줄 + 문장 6줄 = 11줄, 파일 7개**. C(231)와 파일이 대부분 달라 따로 뗌.

## 0. 확정 기록
| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-15 | 종현 t1651 | **218-10** 방 이름은 「학생·학부모 고민방」(가운뎃점)으로 적는다. 지금 화면은 「학생/학부모 고민방」(빗금) |
| 2026-10-15 | 종현 t1657 | 약관·개인정보처리방침 「학생/학부모」→「학생·학부모」 별도 공지 없음 |
| 2026-10-15 | 종현 t1652 | 문장 속 「학생/학부모」 6줄도 「학생·학부모」로 |
| 2026-10-15 | 종현 t1651 | 비회원 찾기 레일 순서는 그대로(학생·학부모 먼저). 변경 없음 |

## 1. 화면에 나오는 「학생/학부모 고민방」 전부 (origin/main `58036395`, 우동공과2 `git grep` 확인)
| # | 파일:줄 | 지금 | 화면 어디 |
|---|---|---|---|
| N1 | `preview/home-ui/src/concern/copy.js:45` | `label: '학생/학부모 고민방',` | 커뮤니티 입구·레일 배너·읽기 팝업 제목 |
| N2 | `preview/home-ui/src/board-engine-copy.js:436` | `label: '학생/학부모 고민방',` | 게시판 화면 이름 |
| N3 | `preview/home-ui/src/board-engine-copy.js:440` | `userFacingMenu: '학생/학부모 고민방',` | 메뉴 이름 |
| N4 | `preview/home-ui/src/board-channel-acl.js:140` | `title: '학생/학부모 고민방',` | 권한 안내(입장 전 소개) 제목 |
| N5 | `src/Board/BoardChannelAcl.php:417` | `'title' => '학생/학부모 고민방',` | 서버가 주는 같은 소개 제목 |

문장 속 「학생/학부모」 6줄(t1652로 **바꿈**):
| # | 파일:줄 | 화면 어디 |
|---|---|---|
| S1 | `preview/home-ui/src/concern/copy.js:14` | 커뮤니티 소개 「공부방·과외쌤·학생/학부모가 …」 |
| S2 | `preview/home-ui/src/policy-copy.js:22` | 이용약관 「…과외쌤, 학생/학부모가 정보를…」 |
| S3 | `preview/home-ui/src/policy-copy.js:104` | 개인정보처리방침 「학생/학부모 관련 정보: …」 |
| S4 | `preview/home-ui/src/policy-copy.js:144` | 약관 요약 「우동공과가 제공하는 것」 |
| S5 | `preview/home-ui/src/admin-red-line-copy.js:15` | 관리자 화면 「공부방·과외쌤·학생/학부모 정보 등록·공개 지원」 |
| S6 | `preview/home-ui/src/promo/study-room-content.js:72` | 「공부방 카탈로그」 화면 `role: '학생/학부모'` |

그대로 두는 것: 주석 2줄(`board-channel-acl.js:622`, `src/Board/BoardPostService.php:166`), 내부 문서(`DOC-CHECKLIST.md`, `SSOT-ALIGNMENT.md`), 검증 스크립트·SQL 주석.

## 2. 바꿀 내용 — 이 폴더 `232-room-name.diff` 그대로
```diff
diff --git a/preview/home-ui/src/admin-red-line-copy.js b/preview/home-ui/src/admin-red-line-copy.js
index b9990b03..c1c52a7a 100644
--- a/preview/home-ui/src/admin-red-line-copy.js
+++ b/preview/home-ui/src/admin-red-line-copy.js
@@ -12,7 +12,7 @@ export const PLATFORM_ROLE_SUMMARY =
 
 /** §0-2 플랫폼이 하는 것 */
 export const PLATFORM_DOES = [
-  '공부방·과외쌤·학생/학부모 정보 등록·공개 지원',
+  '공부방·과외쌤·학생·학부모 정보 등록·공개 지원',
   '신뢰 판단에 도움이 되는 제출자료 항목·공개 메커니즘',
   '신고·안전·허위/도용 의심 시 최소 운영 조치',
 ];
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
index 53b4c897..89b0e5f7 100644
--- a/preview/home-ui/src/concern/copy.js
+++ b/preview/home-ui/src/concern/copy.js
@@ -11,7 +11,7 @@ import { listBoardChannels } from '../board-channel-store.js';
 
 export const COMMUNITY_HUB_TITLE = '커뮤니티';
 export const COMMUNITY_HUB_LEAD =
-  '공부방·과외쌤·학생/학부모가 현장 고민을 나누는 공간입니다. 역할에 맞는 게시판에서 질문하고, 답변을 주고받으며, 해결된 이야기는 후기로 남깁니다.';
+  '공부방·과외쌤·학생·학부모가 현장 고민을 나누는 공간입니다. 역할에 맞는 게시판에서 질문하고, 답변을 주고받으며, 해결된 이야기는 후기로 남깁니다.';
 
 /** @deprecated alias */
 export const CONCERN_HUB_TITLE = COMMUNITY_HUB_TITLE;
@@ -42,7 +42,7 @@ export const COMMUNITY_BOARD_DEFS = [
     id: 'parent',
     boardKey: 'concern-parent',
     slug: 'parent',
-    label: '학생/학부모 고민방',
+    label: '학생·학부모 고민방',
     roleHint: '공부방·과외 선택·루틴·안전',
     path: '/community/parent',
   },
diff --git a/preview/home-ui/src/policy-copy.js b/preview/home-ui/src/policy-copy.js
index c4f1debd..5ed2d6b8 100644
--- a/preview/home-ui/src/policy-copy.js
+++ b/preview/home-ui/src/policy-copy.js
@@ -19,7 +19,7 @@ export const POLICY_PAGES = [
       {
         title: '서비스의 내용',
         bullets: [
-          '우동공과는 공부방, 과외쌤, 학생/학부모가 정보를 등록하고 탐색할 수 있는 플랫폼을 제공합니다.',
+          '우동공과는 공부방, 과외쌤, 학생·학부모가 정보를 등록하고 탐색할 수 있는 플랫폼을 제공합니다.',
           '회원은 프로필, 소개, 수업 정보, 요청 정보, 제출자료, 노출 범위를 직접 설정할 수 있습니다.',
           '회원은 플랫폼 안에서 비교, 찜, 상세 확인, 쪽지 등의 기능을 이용할 수 있습니다.',
         ],
@@ -101,7 +101,7 @@ export const POLICY_PAGES = [
         bullets: [
           '회원가입 및 로그인 정보: 이름, 이메일(로그인 ID·비밀번호 찾기 기준), 휴대전화번호(계정 복구 보조·운영 안내 기준), 비밀번호 또는 외부 로그인 연동 정보',
           '프로필 및 서비스 이용 정보: 역할 정보, 지역, 과목, 수업 방식, 소개글, 경력 정보, 제출자료, 노출 설정 정보',
-          '학생/학부모 관련 정보: 학생 학년, 희망 과목, 희망 지역, 요청 내용, 상담 가능 범위',
+          '학생·학부모 관련 정보: 학생 학년, 희망 과목, 희망 지역, 요청 내용, 상담 가능 범위',
           '서비스 이용 과정에서 생성되는 정보: 접속 로그, 기기 정보, 이용 기록, 쪽지 이용 기록, 신고 및 문의 기록',
         ],
       },
@@ -141,7 +141,7 @@ export const POLICY_PAGES = [
     title: '플랫폼 역할 고지',
     summary: '우동공과는 중개·보증·대금 보관·안전결제가 아님',
     sections: [
-      { title: '우동공과가 제공하는 것', body: ['우동공과는 공부방, 과외쌤, 학생/학부모가 지역·과목·조건에 맞는 정보를 탐색하고 비교하며, 필요한 경우 플랫폼 안에서 접촉을 시작할 수 있도록 돕는 서비스입니다.'] },
+      { title: '우동공과가 제공하는 것', body: ['우동공과는 공부방, 과외쌤, 학생·학부모가 지역·과목·조건에 맞는 정보를 탐색하고 비교하며, 필요한 경우 플랫폼 안에서 접촉을 시작할 수 있도록 돕는 서비스입니다.'] },
       {
         title: '우동공과가 직접 하지 않는 것',
         bullets: [
diff --git a/preview/home-ui/src/promo/study-room-content.js b/preview/home-ui/src/promo/study-room-content.js
index bda5df5d..aa6a3ee1 100644
--- a/preview/home-ui/src/promo/study-room-content.js
+++ b/preview/home-ui/src/promo/study-room-content.js
@@ -69,7 +69,7 @@ export const STUDY_ROOM_PROMO = {
     title: '이런 분께 특히 잘 맞습니다',
     cards: [
       {
-        role: '학생/학부모',
+        role: '학생·학부모',
         title: '동네 안에서 더 빨리 찾아보세요',
         body: '가까운 공부방과 과외 정보를 먼저 보고, 필요한 정보부터 비교하며 우리 아이에게 맞는 곳을 고릅니다.',
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
위 7파일, 1절 N1~N5·S1~S6 열한 줄만.

## 4. 금지
- 1절 「바꾸지 않음」 줄, 레일 순서·슬롯·DB·seed 금지. 새 문구·디자인 금지. C(231) 범위(`right-rail.js`, `rail-concern-popup.js`, `copy.js:64`) 금지.
- fast 모델 금지. `git add -A`/`git add .` 금지. force-push 금지. 비밀값 금지. main merge 금지(검수 뒤 종현 승인).

## 5. C(231)와의 관계
`concern/copy.js` 만 같이 만지고 줄이 다름(45 vs 64). C 적용 뒤에도 `git apply --check` 통과(우동공과2 확인). 순서 무관.

## 6. 합격 기준 (가볍게 — 229 §10 방식)
1. `git diff --stat origin/main...HEAD` = 정확히 7파일, +11/−11
2. (Git Bash) `git diff origin/main...HEAD | grep -v '^index ' | diff - <(grep -v '^index ' docs/design/home-banner-rail-2026-10-14/232-room-name.diff)` → 빈 출력
3. `git grep -n "학생/학부모" HEAD -- 'preview/*.js' 'src/*.php'` → 2줄만(주석 `board-channel-acl.js:622`, `BoardPostService.php:166`)
4. `git grep -n "학생·학부모 고민방" HEAD -- preview src` → 5줄

화면 측정·Docker·스크린숏 하지 않음.

## 7. 진행 순서
0. 231(작업 C)이 main 에 들어간 뒤 시작.
1. `git fetch origin` → 1절 N1~N5 확인(다르면 멈추고 보고).
2. `git switch -c cursor/room-name-dot-20261015 origin/main`
3. `git apply docs/design/home-banner-rail-2026-10-14/232-room-name.diff`
4. `git add preview/home-ui/src/concern/copy.js preview/home-ui/src/board-engine-copy.js preview/home-ui/src/board-channel-acl.js src/Board/BoardChannelAcl.php preview/home-ui/src/policy-copy.js preview/home-ui/src/admin-red-line-copy.js preview/home-ui/src/promo/study-room-content.js`
5. 커밋: `fix(copy): 방 이름 「학생·학부모 고민방」 가운뎃점 통일 (218-10, 종현 t1651·t1652)`
6. 6절 네 명령 → `git push origin cursor/room-name-dot-20261015`(브랜치만).
7. 답장: 커밋 해시 + 6절 출력만.

## 8. 질문 상태
- ~~Q1 문장 속 6줄~~ → **답함** (t1652): 바꿈.
- ~~P1 약관 공지~~ → **답함** (t1657): 별도 공지 없음, 진행.
- **P2 (대기)**: 운영 DB 에 따로 저장된 게시판 이름이 있으면(저장소 SQL 에는 없음) 확인 못 함.
