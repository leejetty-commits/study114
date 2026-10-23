# AGENTS.md — study114

이 저장소에서 일하는 모든 에이전트(그록봇, Cursor 클라우드·로컬 에이전트, 기타)는 아래를 먼저 읽는다.

1. **작업 절차 정본:** [`docs/internal/70-work-routine-review-approval.md`](docs/internal/70-work-routine-review-approval.md)
   - 작업 브랜치에서만 작업, `main` 직접 push 금지
   - 과제마다 `docs/worklog/`에 작업기록, 코드와 함께 커밋·push
   - 사용자가 커밋 hash 단위로 승인한 것만 `main` 병합·배포
2. **Git·빌드·배포 원칙:** [`.cursor/rules/study114-workflow.mdc`](.cursor/rules/study114-workflow.mdc)
3. **문서 지도:** [`docs/internal/README.md`](docs/internal/README.md), 기능 정본은 `docs/ssot/`
