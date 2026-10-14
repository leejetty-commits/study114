# 2026-10-14 Actions 시간 줄이기 — 검사·배포가 도는 조건 좁히기

- 브랜치: `cursor/actions-trim-20261014` (base `origin/main` `83e7b387`)
- 정본: `docs/internal/54-shop-page-lock.md` (CI 줄 · 파일 표) · `.cursor/rules/study114-workflow.mdc` 4절 · 9절
- 바꾼 workflow: `board-acl-gate.yml` · `shop-page-gate.yml` · `deploy.yml` · `verify-bundle.yml`
- 검사 내용(스크립트)은 그대로. 언제 도는지만 바꿨다. SQL·Secrets·`.htaccess`·환경변수 변경 없음.

## 1. 지시 (원문)

> 지금 회원이 들어오지 않는 개발상태에서도 저렇게 시간을 잡아 먹으면 나중엔 감당을 할 수 없지...

복명복창(메인 → 사용자):

1. Board ACL gate: 「main에 push할 때는 돌지 않게 합니다. 작업 브랜치에서도 문서(`docs/**`, `*.md`)만 바뀌면 돌지 않습니다」
2. ShopPage gate: 「main에 push할 때는 돌지 않게 합니다」
3. 배포: 「문서만 바뀐 main push(오늘 같은 기록 병합)에는 배포하지 않습니다」
4. Verify bundle: 「문서만 바뀐 push에는 돌지 않습니다」
5. 「정본과 규칙도 같은 커밋에서 고칩니다: `docs/internal/54-shop-page-lock.md`: 「CI: PR + main push」를 「PR + 배포(deploy.yml) 안에서」로 바꿉니다. `.cursor/rules/study114-workflow.mdc` §9의 같은 내용도 고칩니다.」

> 진행

## 2. 근거 — 최근 30일 사용량

API가 돌려준 1,000건 기준 어림(실제 과금은 작업마다 1분 올림이라 더 클 수 있음). 전체 약 1,179분 / 무료 2,000분.

| workflow | 건수 | 분 |
|---|---:|---:|
| Board ACL gate | 383 | 397 |
| Deploy to dothome (작업 4개) | 150 | 310 |
| ShopPage gate | 151 | 152 |
| Verify bundle | 145 | 147 |
| 나머지 검사 7종 | 169 | 173 |
| member-mail-cron | 3 | 3 |

- main push 한 번에 Board ACL gate·ShopPage gate·Verify bundle·Deploy가 함께 돌았다. Deploy 안에 이미 Board ACL 검사(`board-acl-verify.yml`)·ShopPage 검사(`verify-shop-page`)·비밀값 검사가 있어 **main push마다 같은 검사가 두 번** 돌았다.
- 기록(작업 기록·정본 문서)만 병합해도 검사 3종 + 배포(빌드·FTP)가 모두 돌았다. 사이트에 바뀌는 것은 없다.

## 3. 바꾼 것

| workflow | 전 | 후 |
|---|---|---|
| `board-acl-gate.yml` | 모든 push·PR | PR·작업 브랜치 push만. main push 제외(deploy가 같은 검사). 문서만 바뀌면 안 돎 |
| `shop-page-gate.yml` | PR + main push | PR만. main은 deploy의 `verify-shop-page`가 배포 전에 검사 |
| `deploy.yml` | main push 전부 | 문서만 바뀐 main push 제외. `public/` 아래 파일은 `.md`라도 배포(FTP 대상이라 다시 포함). 수동 실행(`workflow_dispatch`) 추가 |
| `verify-bundle.yml` | main·`cursor/**` push, PR | 같은 대상, 문서만 바뀌면 안 돎. 단 `docs/internal/cur-006-email-verify-open-apis.md`가 바뀌면 돎 |

- 「문서」 = `docs/**` 와 모든 `*.md`. 문서와 코드가 함께 바뀐 push는 전처럼 다 돈다(GitHub 경로 필터는 바뀐 파일 중 하나라도 걸리면 실행).
- deploy의 `ftp-deploy`는 `if: github.ref == 'refs/heads/main'` 그대로라, 수동 실행도 main에서만 FTP 업로드된다.

## 4. 확인한 것 (작업 중 찾은 빈틈)

- `verify:cur-006-email-verify-inventory`(Verify bundle 안)는 `docs/internal/cur-006-email-verify-open-apis.md` 내용을 확인한다. 그래서 Verify bundle은 `paths-ignore` 대신 `paths`(제외 뒤 그 문서만 다시 포함)로 썼다. 다른 CI 검사 스크립트(Board ACL·ShopPage·Verify bundle 묶음)는 `docs/`·`.md`를 읽지 않음을 `scripts/`에서 찾아 확인.
- 남는 빈틈(그대로 둠, 보고): `scripts/check-no-committed-secrets.sh`의 Google client_secret 패턴 검사는 추적 파일 전체(문서 포함)를 본다. 문서만 바뀐 push에서는 이 검사가 돌지 않으므로, 문서에 비밀값을 적은 경우 **다음 코드 push(Verify bundle) 또는 배포 때** 잡힌다. 문서는 FTP 대상이 아니라 운영에 올라가지는 않는다. CI는 원래도 커밋 자체를 막지 못한다(커밋 뒤 알림).
- main 보호에 `ShopPage gate / verify:shop-page`를 required check로 두는 권장(정본 54)은 PR 기준이라 영향 없다.

## 5. 검증 (로컬)

- 네 workflow를 `yaml` 패키지로 해석 — 오류 0. `on:` 결과
  - board-acl-gate: `pull_request.paths-ignore` · `push.branches-ignore [main]` + `paths-ignore`
  - deploy: `push.branches [main]` + `paths ["**","!docs/**","!**/*.md","public/**"]` · `workflow_dispatch`
  - shop-page-gate: `pull_request`
  - verify-bundle: `pull_request.paths` · `push.branches [main, cursor/**]` + `paths` (open-apis 문서 다시 포함)
- deploy.yml을 읽는 검사: `node scripts/verify-cur-006-resend.mjs` OK · `php scripts/verify-cur-006-resend.php` passed=89 failed=0 · `node scripts/verify-tutor-inquiries-settings.mjs` OK
- `npm run verify:shop-page` pass 54 / fail 0 (worktree `preview/home-ui/node_modules`는 루트 것을 junction으로 연결, git 미추적)

## 6. 배포 전 사용자 할 일

- 없음(SQL·Secrets·`.htaccess`·환경변수 변경 없음).
- 문서만 병합한 뒤 사이트를 다시 올려야 할 일이 생기면: GitHub → Actions → 「Deploy to dothome」 → Run workflow(main).
