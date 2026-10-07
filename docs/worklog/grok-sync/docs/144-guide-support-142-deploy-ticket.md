# 144 · 배포 — 이용안내·고객센터 「공개」→「노출」(142 · 143 수락)

- 작성: 2026-09-25 12:46 KST
- 사용자 허가: 「써줘」(배포 지시문 · 2026-09-25) → **커밋 · push · Actions Deploy to dothome 허가**
- 로컬 수락: [143](143-guide-support-142-acceptance.md) · 티켓 [142](142-guide-support-public-to-exposure-ticket.md) · 백로그 [130](130-copy-public-hidden-to-exposure-backlog.md)
- 현재: `origin/main` = `f42d89e` · 로컬 HEAD = `f42d89e` · 브랜치 `feat/student-mypage-a-g` · **워킹트리에 142 카피 미커밋**
- DB 마이그레이션 **없음** · ENUM 변경 **없음**
- Actions가 `preview/home-ui` 소스 빌드 → **dist 수동 커밋 불필요** · 로컬 `build:dothome` **실행 안 함**
- 배포 결과: **수락** → [145](145-guide-support-144-deploy-acceptance.md) · `f154183` · #339

---

## 0. 한 줄

allowlist **4파일만** 새 커밋 → `origin/main` fast-forward push → Deploy to dothome.  
dirty 잔여(`study-room-reg/screens.js`, repo `docs/046`·`047`·`README`)는 **절대 stage·커밋하지 말 것**.

올릴 화면(사이트 이름):
- 이용안내 `#/guide` · `#/guide/register` 등 — 좌메뉴 **등록·노출** · 기본 노출 문장
- 고객센터 `#/support` · 정책 `#/support/policies/*` — 노출 상태 · 등록 정보와 노출

---

## 1. 게이트 (반드시 · 순서)

작업 디렉터리: `D:\work\study114` · `git -c safe.directory=D:/work/study114`

1. `git fetch origin`
2. `origin/main` == **`f42d89e8a15dc55c852c973e0783e6b4a5dfd160`** 아니면 **중단·보고**
3. `git rev-parse HEAD` == 같은 `f42d89e…` 아니면 중단 (커밋 전)
4. `git status`에서 142 대상 4파일이 modified인지 확인. `study-room-reg/screens.js`·`docs/046*`·`docs/047*`·`docs/README.md`는 **그대로 dirty/untracked**
5. **아래 4경로만** stage (경로 정확히):

```
preview/home-ui/src/guide/copy.js
preview/home-ui/src/guide/screens.js
preview/home-ui/src/support/support-copy.js
preview/home-ui/src/policy-copy.js
```

6. `git diff --cached --name-only` = **위 4줄만**. 하나라도 더 있으면 `git restore --staged`로 빼고 중단·보고
7. 커밋 메시지(이 문구 그대로 권장):

```
copy(guide,support): 등록·공개→등록·노출, drop review/detail gates
```

8. 커밋 후:
   - `git diff --name-only origin/main..HEAD` = **위 4파일만**
   - `git log --oneline origin/main..HEAD` = **정확히 1줄** (새 SHA)
9. `git push origin HEAD:main` (**fast-forward만**. `--force` / `--force-with-lease` **금지**)
10. Actions **Deploy to dothome** 완료 대기. 로컬 `npm run build:dothome` **실행하지 않음**

---

## 2. Forbidden

```
study-room-reg/screens.js · docs/046-* · docs/047-* · docs/README.md stage/커밋
amend · rebase · force push · 다른 파일 동봉
로컬 build:dothome
내 등록·관리자·SearchService·커뮤니티·팝업·127 잔재 청소
Notion 쓰기
라우트 해시 rename · 추가 카피 수정
```

---

## 3. 운영 스모크 (배포 후 · 하드 새로고침)

| # | 확인 |
|---|---|
| 1 | `#/guide` 좌메뉴 **등록·노출** (「등록·공개」 없음) |
| 2 | `#/guide/register` — 기본 노출·상세=보완·심사 없음. 「공개하기」「공개 전 필수」 없음 |
| 3 | `#/guide/start` · `#/guide/compare` · `#/guide/safe` — 「등록·공개」 회귀 없음 |
| 4 | `#/support` · FAQ — 「노출 상태」 · 쪽지 받음/안받음 유지 |
| 5 | `#/support/policies/terms` — 제목 **등록 정보와 노출** |
| 6 | 연락처·학생 「공개 범위/공개하지 않음」·「게시물 숨김」 유지 |
| 7 | `#/community` · `#/guest` — 깨짐 없음 · 이번 카피 외 의도 변경 없음 |

---

## 4. 보고

- 새 커밋 SHA · 메시지 · 파일 4개 목록
- push 전후 `origin/main` SHA
- Actions Deploy to dothome 번호 · 성공/실패
- 스모크 1~7
- dirty 잔여 **미커밋** 확인

---

## 5. Cursor 붙여넣기 (전문)

```text
[티켓 144 · 배포 · 142 이용안내·CS 공개→노출 · commit+push+dothome]

기준: D:\work\study114 · git -c safe.directory=D:/work/study114
사용자 허가: 커밋 · push · Deploy to dothome. 로컬 build:dothome 금지. force 금지.

사전
- fetch
- origin/main == f42d89e8a15dc55c852c973e0783e6b4a5dfd160 아니면 중단
- HEAD == 동일 f42d89e (커밋 전) 아니면 중단

stage ONLY (4)
preview/home-ui/src/guide/copy.js
preview/home-ui/src/guide/screens.js
preview/home-ui/src/support/support-copy.js
preview/home-ui/src/policy-copy.js

cached name-only가 위 4개만인지 확인. 아니면 중단.
금지 stage: study-room-reg/screens.js, docs/046*, docs/047*, docs/README.md

commit message:
copy(guide,support): 등록·공개→등록·노출, drop review/detail gates

커밋 후 origin/main..HEAD name-only = 위 4만 · log 1줄.
git push origin HEAD:main (FF only)

Actions Deploy to dothome 대기. 로컬 build:dothome 하지 말 것.
DB/마이그/ENUM 없음.

운영 스모크(하드새로고침)
#/guide 좌메뉴 등록·노출
#/guide/register 기본노출·보완·무심사 · 공개하기/공개전필수 없음
#/guide/start|compare|safe 등록·공개 회귀 없음
#/support·FAQ 노출 상태 · 쪽지 받음/안받음
#/support/policies/terms 등록 정보와 노출
연락처·학생 공개 범위·게시물 숨김 유지
#/community · #/guest 깨짐 없음

보고: 새 SHA · 파일4 · Actions# · 스모크 · dirty 미커밋
정본: study114-ds/docs/144
```
