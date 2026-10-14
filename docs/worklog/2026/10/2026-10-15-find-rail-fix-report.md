# 2026-10-15 찾기 레일 보완 보고 — 227 개정 (종현 t1625)

- 지시서: `docs/design/home-banner-rail-2026-10-14/227-cursor-directive-find-rail-fix.md` (개정 t1625. 앞선 227 「081·PHP 빼기」는 무효)
- 브랜치: `cursor/home-find-rail-three-20261015` (v2 아님)
- 팁: `a061764321df752310d8eb188f59a295ff71e40d` (`a0617643`)
- 수정 커밋: `ab791345` — `fix(rail): 찾기 레일은 저장 목록을 따름(강제 세 방 제거), 081 공백 무관 비교 (종현 t1625 2026-10-15)`
- 기준: 작업 시작 때 origin/main `1071fbb1`. push 직전 `9f5656ba`(문서만, 078 호스팅)가 생겨 보통 merge. 충돌 없음.
- 코드는 브랜치만 push. main 병합·배포 없음. 081은 운영 DB에 넣지 않음.

## 1절 확인

L0–L10은 지시서와 같았음. 원격 브랜치는 `91e03e3260ff94b9ba0dcb6132c50c53f13e549e`. 앞선 227대로 쌓인 커밋은 없어 `git revert` 하지 않음.

## 바뀐 범위

`git diff --stat origin/main...HEAD` (팁 `a0617643`):

```
 preview/home-ui/src/right-rail-store.js             |  2 +-
 sql/schema/081_search_rail_three_concern_boards.sql | 13 +++++++++++++
 src/Admin/ContentAclSeedGuard.php                   |  3 ++-
 src/Admin/ContentSchemaMigrateService.php           |  2 +-
 4 files changed, 17 insertions(+), 3 deletions(-)
```

`git diff origin/main...HEAD -- preview/home-ui/src/right-rail.js` 는 빈 출력. 강제 세 방 10줄은 빠졌고, 이 파일은 origin/main 과 같다. `right-rail-store.js`와 PHP 두 파일은 `91e03e3` 그대로.

## 24칸 판정

판정 조건은 `227-judge-find-rail.py`와 같다. 이 PC에 python3가 없어 Node Playwright(설치 Chrome)로 같은 절차를 돌렸다. 브랜치 home 5191 · search 5193, main home 5192 · search 5194. 비교 기준은 main default JSON.

```
default  24/24 PASS []
old      24/24 PASS []
removed  24/24 PASS []
```

| 경우 | 찾기 레일 고민방 (공부방 / 과외쌤 / 학생 / 비회원) |
|---|---|
| default | D,T,P / T,D,P / P / P,D,T |
| old | P / P / P / P |
| removed | D,P / D,P / P / P,D |

홈 레일 12칸은 세 경우 모두 main 과 같다.

## 081 (로컬 MySQL 8.4.10)

운영 DB는 건드리지 않음. 버린 컨테이너 `mysql:8.4` (8.4.10, 호스트 3308). 영향 행: 1 · 1 · 0 · 0.

| 경우 | 열 | 넣기 전 | 영향 |
|---|---|---|---|
| ① 옛 값 공백 없음 | LONGTEXT | `["faq","concern-parent","safe-guide"]` | 1 |
| ② JSON 열에 넣은 옛 값 | JSON | `["faq", "concern-parent", "safe-guide"]` (MySQL이 쉼표 뒤 공백을 붙임) | 1 |
| ③ 운영자 값 | JSON | `["faq", "concern-director", "concern-parent", "safe-guide"]` | 0 (값 유지) |
| ④ 새 값으로 한 번 더 | JSON | 세 방 목록 | 0 |

①은 JSON 열이 공백 없는 문자열을 그대로 두지 않아 LONGTEXT로 확인했다.

## 그림

- `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-guest-1280.png`
- `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-studyroom-1280.png`
- `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-tutor-1280.png`
- `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-student-1280.png`
- `docs/worklog/2026/10/img/2026-10-15-find-rail-fix-studyroom-old-1280.png`

## 지시와 다른 점

- 측정만 Node + Chrome. 포트는 지시서와 같다(5191·5193 / 5192·5194).
- push 직전에 origin/main 이 `9f5656ba`로 이동해 한 번 더 보통 merge. v2·cherry-pick 없음.

## 확인 못 한 것

- 운영 study114.net. 브랜치만 push했고 main에 코드를 넣지 않았다.
- 운영 DB. 081 적용은 배포 때 종현이 phpMyAdmin으로 한다(지시서 6절).
- 실계정 로그인. 네 모드는 `/api/auth/me.php`를 흉내 냈다.

## 배포 전 사용자 할 일

- 검수 PASS 뒤 배포 전이나 같이, 지시서 6절 ①→②→③. SQL 파일은 브랜치 `sql/schema/081_search_rail_three_concern_boards.sql`. main에 들어가기 전에는 루트 `d:\work\study114\sql\schema`에 복사하지 않음.
