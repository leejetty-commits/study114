# 223 · 작업 B(218-4·218-7) 검수 기록: PASS, 배포 전 (2026-10-14)

- 검수: 우동공과2, 2026-10-14 23:3x KST. 코드는 바꾸지 않았고 push도 하지 않았다.
- 지시서: `docs/design/home-banner-rail-2026-10-14/222-cursor-directive-B.md`
- 받아 온 곳(따로따로 fetch함): `refs/remotes/origin/main` = `c112dc88`, `refs/remotes/origin/home-b` = `ed4d6a1f990f52f4a0e5ba8b52503321d33ba386`

## 1. 커밋

| 항목 | 값 |
|---|---|
| 브랜치 끝 | `ed4d6a1f`. 보고서에 적힌 해시와 같음 |
| merge-base | `ddcee2d2` (222 지시서 커밋) |
| 그 사이 커밋 | `ed4d6a1` 1개뿐: fix(rail): 이달의 베스트 빨강 띠·팝업 + 0건 빈 팝업 |
| merge-base 이후 main | `c112dc8` 1개: 작업 B 리포트, 문서와 그림만 |

## 2. diff

- 바뀐 파일은 허용한 2개뿐이다. `right-rail.js` 는 15줄 바뀌었고 모두 `renderBestSection` 안이다. `home-right-rail.css` 는 36줄 바뀌었다.
- 222 diff와 더하고 빼는 줄을 하나씩 비교했다. **모두 같다**(차이 0줄).
- main을 되돌리는 것이 없다. merge-base 이후 main은 `preview/` 를 건드리지 않았다. 그래서 origin/main과 브랜치 사이의 `preview/` 차이는 이 두 파일의 변경뿐이다.

## 3. main 기록 커밋 `c112dc8`

- 바뀐 것은 `docs/worklog/` 아래 7개뿐이다: 리포트, 작업 대기열 한 줄, 그림 5장. 앱 코드는 없다.
- 비밀값(키, 토큰, 비밀번호, 개인키) 검사에서 걸린 것이 없다.
- 리포트에 적힌 값(24칸 수치, 대비 6.29:1, 초점 링 `solid 2px rgb(28,25,23)`)이 아래 재측정과 일치한다.
- 리포트가 스스로 밝힌 차이: Python 대신 Node Playwright로 쟀고, 기다리는 시간이 다르고, 그림을 main 기록에 넣었다. 셋 다 결과에 영향이 없어 받아들임.

## 4. 재측정 (222-measure-B.py, 브랜치는 5183, main은 5184)

- **24/24 통과**: 4모드 × 1280/1023/390 × 0건/글 있음. 칸마다 확인한 것:
  - 베스트 띠 `rgb(190,18,60)`, 흰 글자
  - 베스트가 레일 첫 칸
  - 띠 위치·크기와 레일 순서가 main과 같음
  - 고민방 칸 `rgb(109,40,217)`, main과 같음
  - 팝업이 `concern-best` 이고 머리띠가 빨강, 역할에 맞는 방 제목
- 0건일 때: 띠와 빈 문구가 버튼이다. 빈 문구가 보이고, Enter와 Space로 열리며, Esc 뒤 초점이 띠로 돌아온다.
  - 여는 방: 공부방 → 공부방 고민방, 과외쌤 → 과외쌤 고민방, 학생·비회원 → 학생/학부모 고민방
- 글 있음일 때: 띠는 그대로 div이고, 줄을 누르면 팝업이 열린다.
- 키보드: Tab으로 오면 띠 버튼에 `:focus-visible` 이 켜지고, 초점 링은 `solid 2px rgb(28,25,23)` 이다.

## 5. merge

- fast-forward는 안 된다(main에 `c112dc8` 문서 커밋이 있음). merge commit이 필요하다.
- `git merge-tree --write-tree` 결과 **충돌 없음**.

## 판정: **PASS**

확인 못 한 것:
- 운영 사이트(아직 배포 전)
- 실제 로그인 계정과 실제 비회원 팝업 내용
- 받는 중·실패 화면은 따로 흉내 내지 않았다(코드상 0건이고 받기가 끝났을 때만 버튼이 됨)
- Chromium에서만 확인

## 배포 지시 (Cursor용)

```
작업 B(218-4·218-7) 배포. 검수 PASS: docs/worklog/2026/10/2026-10-14-home-b-review.md

1. git fetch origin. origin/cursor/home-b-best-red-20261014 끝이 ed4d6a1f 인지 확인한다. 다르면 멈추고 보고한다.
2. git switch main && git pull --ff-only origin main
3. git merge --no-ff origin/cursor/home-b-best-red-20261014 -m "merge: 작업 B 이달의 베스트 빨강·0건 빈 팝업 (218-4·218-7, 종현 승인 2026-10-14)"
   - 충돌이 나면 멈추고 보고한다(검수 때는 충돌이 없었다).
   - merge 뒤 git diff HEAD^1 HEAD --stat 에 아래 2개만 나와야 한다:
     preview/home-ui/src/right-rail.js, preview/home-ui/src/styles/home-right-rail.css
4. git push origin main
   - force-push 금지. 거절되면 다시 fetch하고 merge한 뒤 push한다. rebase나 reset 금지.
5. GitHub Actions에서 이 merge 커밋으로 돈 「Deploy to dothome」(deploy.yml)이 success 인지 확인한다.
   - 같은 커밋으로 돈 Verify bundle 등 다른 검사도 함께 확인한다.
   - 실패하면 다시 돌리지 말고 로그 요점과 run URL을 보고한다.
6. 배포 후 운영 사이트 확인 (https://study114.net, 강력 새로고침. 최소한 로그아웃 상태로, 가능하면 공부방·과외쌤·학생 계정으로도), 폭 1280과 390:
   a. 오른쪽 레일 맨 위 「이달의 베스트」 띠 배경이 계산값 rgb(190, 18, 60), 제목이 흰색인지
   b. 고민방 칸 띠는 보라 rgb(109, 40, 217) 그대로이고, 레일 순서도 배포 전과 같은지
   c. 글이 있으면: 줄을 누르면 베스트 팝업이 열리고 머리띠가 빨강인지
   d. 0건이면: 띠와 빈 문구를 누르면 빈 팝업이 열리는지(머리띠 빨강, 「이달의 베스트, 아직 글이 미도착중...」).
      비회원은 「학생/학부모 고민방 · 이달의 베스트」. Enter와 Space로도 열리는지, 초점 링이 보이는지
   e. 비회원 팝업이 보여 주는 범위(제목만 / 로그인 안내)가 배포 전 팝업과 같은지(바뀌면 불합격)
   f. 배포된 CSS에 .live-rail-slot--best{--rail-tone:var(--rail-tone-hot)} 와 .live-rail-best__open 이 들어 있는지
   g. 콘솔에 새 오류가 없는지
7. 기록은 main에 바로 커밋한다(문서만, 파일 이름으로 add):
   - docs/worklog/2026/10/2026-10-14-home-b-deploy.md: merge 해시, Actions run URL과 결과, 6번 항목별 결과, 그림 경로
   - docs/worklog/2026/10/2026-10-10-work-queue.md 에 한 줄 추가: "- 2026-10-14 작업 B 배포 <merge 해시> · 운영 확인 PASS/FAIL"
8. 답장: merge 해시, Actions 결과, 기록 경로
금지: force-push, git add -A, 다른 티켓(218-6·218-8) 변경, 비밀값 커밋, 빠른(fast) 모델 하위 에이전트
```
