# 2026-10-08 배포 열 — 검수 통과 5과제를 `main`에 차례로 올리는 순서

- 브랜치: `cursor/deploy-train-20261008`
- 작성: Cursor 메인 에이전트 (각 과제 작업 세션과 분리)
- 승인 근거: 사용자 04:17 "배포까지 승인하겠다. 무결성은 제외." — 단, `main` push는 Auto-review가 사용자 승인 카드를 요구하므로 기상 후 카드로 진행.

## 왜 열을 만들었나

찾기 주소 통일(hold)과 159c는 한 줄로 이어져 있고, 레일·동네 인사·시·도 세 과제는 옛 `main`(`b249ccc`) 위에 있었다. 하나씩 배포하려면 앞 과제 위로 옮겨 붙여야 해서, 159c 끝(`a1129f8`) 위에 세 과제를 순서대로 cherry-pick했다. 충돌 0.

## 배포 순서 (각 단계: `main` fast-forward push → Actions 확인 → 사이트 확인 → 다음)

| 순서 | 과제 | `main`에 올릴 커밋 | 원래 브랜치 끝 |
|---|---|---|---|
| 1 | 찾기 주소 통일 배포 전 수정 | `7d4de59` | `cursor/hold-find-address-merge-verify-20261008` |
| 2 | 159c 관리자 등록 목록 | `a1129f8` | `cursor/admin-159c-on-hold-20261008` |
| 3 | 레일 띠 그룹 색 | `f25de2a` | `cursor/rail-band-group-colors-20261008` (`a251c56`) |
| 4 | 동네 인사 최근 3개 | `214e609` | `cursor/neighborhood-greeting-history-20261008` (`2ffda6c`) |
| 5 | 시·도 정식명 | 이 기록 커밋 (`87b858d` 다음) | `cursor/region-sido-canonical-20261008` (`2af14f7`) |

- 5번 배포 **뒤에** 사용자가 운영 DB에 시·도 정식명 SQL을 돌린다(순서 반대 금지).

## 재검수 (옮겨 붙인 새 커밋 기준)

- 내용 대조: 3·4·5 과제가 바꾼 파일을 원래 브랜치와 비교 → 모두 바이트 동일.
- hold·159c 파일은 3~5단계에서 건드리지 않음(`git diff a1129f8 87b858d` 14파일, 전부 세 과제 파일).
- 지역 코드 상호작용: hold의 `RegionGuLink`는 "서울특별시/서울시/서울"을 모두 받고, `SidoRegionEnsure`의 시·도 단위 행은 원래 정식 이름 → 시·도 정식명 과제와 충돌 없음.

맨 끝 `87b858d`에서 실행:

| 검사 | 결과 |
|---|---|
| `verify-hold-find-address.mjs` | 통과 |
| `verify-admin-registration-list.mjs` (vite-node) | 45 통과 / 1 실패 — `diff-allowed`(옛 기준 커밋 대비 파일 목록 검사, 159c 검수 때와 같은 오탐) |
| `verify-neighborhood-greeting-history.mjs` (vite-node) | 54 통과 / 0 실패 |
| `verify-region-sido-canonical.mjs` | 통과 |
| `verify-admin-preview-labels.mjs` (vite-node) | 206 / 0 |
| `verify-admin-today-hub.mjs` (vite-node) | 61 / 0 |
| `verify:shop-page` | 통과 |
| `npm run build:dothome` | 성공. CSS 문법 경고 2건(`font-size: var(--text-xs)`)은 `a1129f8`에서도 같은 2건 → 기존 경고 |
| PHP 실행 검사 | 미실행(이 PC에 php 없음) |

- `vite-node`가 필요한 검사: 화면 모듈이 Vite 경로 별칭(`@search-ui/...`)이나 `import.meta.env`를 써서 그냥 `node`로는 안 돎. `preview/home-ui`에서 `npx vite-node ../../scripts/<검사>`로 실행.

## 검수·승인

| 구분 | 담당 | 결과 |
|---|---|---|
| 재검수 | Cursor 메인 에이전트 | **통과** |
| 배포 승인 | 사용자(종현) | 04:17 위임. `main` push마다 승인 카드 |
