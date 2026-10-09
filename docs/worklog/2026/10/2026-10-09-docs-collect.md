# 2026-10-09 브랜치에만 있던 문서 main 모으기

- 브랜치: `cursor/docs-collect-20261009` (기준 `origin/main` `606a65e`)
- worktree: `d:\work\study114\.wt\docs-collect`

## 지시 원문 (사용자, 08:22)

「정본 72가 뭔지 ===> 이건 작업이 끝난걸로 알아. 문서는 메인에 병합하고... 브랜치에 있는 문서들 전부 메인에 병합해. 왜 아직도 따로 있지? 그러니 작업이 어떻게 진행되는지 모르지.」

## 방법

- main에 병합되지 않은 원격·로컬 브랜치 전부에서 `docs/` 아래 파일 중 main과 다른 것을 뽑았다.
- 문서만 가져왔다. 코드는 가져오지 않았다.
- main에 없는 문서는 그대로 넣었다.
- main에도 있는 문서는 갈라진 뒤 어느 쪽이 고쳤는지 보고 정했다. main 쪽이 더 최신이면 main을 유지했다.

## 넣은 문서

새로 넣음:

| 문서 | 출처 브랜치 |
|---|---|
| `docs/internal/72-region-unit-lock.md` (과외 지역 단위 정본) | `cursor/region-unit-lock-20261008` |
| `docs/worklog/2026/10/2026-10-08-region-unit-lock.md` | `cursor/region-unit-lock-20261008` |
| `docs/internal/69-provider-phone-identity-prep.md` | `cur-007-phone-identity` |
| `docs/worklog/2026/10/2026-10-08-integrity-studyroom-mode.md` + 사진 8장 | `cursor/integrity-studyroom-20261008` |
| `docs/worklog/2026/10/2026-10-08-integrity-tutor-mode.md` + 사진 3장 | `cursor/integrity-tutor-20261008` |
| `docs/worklog/2026/10/2026-10-08-growth-plan-welcome-shorts-mail.md` (메일·환영판·쇼츠 기획) | `cursor/plan-growth-20261008` |
| `docs/worklog/2026/10/2026-10-08-handoff-cursor-orchestration.md` | `docs/work-routine` |
| `docs/worklog/2026/10/2026-10-09-auth-mail-warm.md` (가입 확인 메일 A단계 기록) | `cursor/auth-mail-warm-20261009` |

브랜치 쪽만 고친 문서라 브랜치 내용으로 바꿈:

| 문서 | 출처 브랜치 |
|---|---|
| `docs/internal/71-neighborhood-welcome-lock.md` (9절 정본 72 연동 메모 추가) | `cursor/region-unit-lock-20261008` |
| `docs/worklog/2026/10/2026-10-08-admin-report-print-menu.md` | `cursor/admin-report-print-menu-20261008` |
| `docs/worklog/2026/10/2026-10-08-board-student-displayname-fallback.md` | `cursor/board-student-displayname-fallback-20261008` |
| `docs/worklog/2026/10/2026-10-08-student-mypage-design-1.md` | `cursor/student-mypage-design-20261008` |
| `docs/worklog/2026/10/2026-10-08-tutor-basic-card.md` (21:21 사용자 잠금 절 추가. main 내용에 덧붙이는 것뿐) | `cursor/tutor-basic-card-20261008` |

직접 손본 것:

- `docs/internal/README.md`: 정본 72 줄을 추가했다. 브랜치에 있던 줄은 옛 설명(「과외=구(시·군)」)이고 정본 73 줄을 지워 버려서 쓰지 않았다. 72 본문 기준(광역시 통째·도는 시·군)으로 새로 적었다.
- `docs/internal/71-neighborhood-welcome-lock.md` 9절: 「프론트 `sameNeighborhood`가 `region_id` 비교로 바뀌었다」는 줄은 main 코드와 다르다. `preview/shared/neighborhood-greeting.js` 54행은 아직 문자열 비교다. 그래서 「코드 미반영」 한 줄을 붙였다.

## 넣지 않은 문서와 이유

| 문서 | 이유 |
|---|---|
| `docs/internal/73-tutor-basic-card-lock.md` (`cursor/tutor-basic-card-20261008` 판) | main 판이 더 최신(10-09 04:44, 공개 단계 삭제 반영). 브랜치 판은 10-08 21:13 |
| `docs/worklog/2026/10/2026-10-08-deploy-train.md` (`cursor/deploy-train-20261008` 판) | main 판이 더 최신(13:11, 2단계 실패 기록 포함) |
| `docs/internal/cur-006-authmailer-callers.md` (`cursor/auth-mail-warm-20261009` 판) | 아직 main에 없는 메일 코드를 설명하는 문서. 메일 코드와 같이 들어가야 맞다(메일 작업 브랜치에 포함) |
| `docs/internal/69-publish-inquiry-region-address-fix.md`, `docs/ssot/20-study-room-registration-management.md` (`fix/cur-006-authenticated-smtp`, 로컬만 있음, 09-19) | main 판이 더 최신. 넣으면 옛 내용으로 되돌아감 |
| 같은 내용이 이미 main에 있는 문서 6개(동네 인사 기록·레일 색·시도 정식명 등) | 이미 같음 |

미커밋 상태라 건드리지 않은 것: `D:\work\study114-routine` 폴더의 작업 루틴 정본 70 초안(`docs/internal/70-work-routine-review-approval.md`), `AGENTS.md`, `docs/worklog/README.md`, `_TEMPLATE.md`. 커밋된 적이 없어 어느 브랜치에도 없다.

## 검수

- 넣은 파일마다 main 쪽 고침 여부를 비교했다(갈라진 지점 대비).
- 정본 73이 가리키던 정본 72(124·501·525행)가 이제 main에 있다.

## 승인

- 사용자 지시 08:22 「전부 메인에 병합해」. main 병합은 승인 창을 거친다.
