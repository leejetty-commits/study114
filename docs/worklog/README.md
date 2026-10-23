# 작업기록 (docs/worklog)

절차 정본: [`docs/internal/70-work-routine-review-approval.md`](../internal/70-work-routine-review-approval.md)

## 파일 위치·이름

```
docs/worklog/YYYY/MM/YYYY-MM-DD-<과제ID>-<짧은이름>.md
```

예: `docs/worklog/2026/10/2026-10-07-관리자-162-ops-report.md`

- 과제 하나 = 파일 하나. 재작업 회차도 같은 파일에 이어 쓴다.
- 새 과제는 `_TEMPLATE.md`를 복사해서 시작한다.
- 과제 ID는 기존 관례(`사이트오류-34`, `관리자-163` 등)를 쓴다. 커밋 메시지에도 같은 ID를 넣는다.

## 원칙

- 작업 브랜치에 코드와 함께 커밋·push한다. push되지 않은 기록은 기록이 아니다.
- 기존 내용은 지우지 않고 아래에 이어 쓴다. 잘못 적은 것은 취소선과 정정 줄로 남긴다.
- 비밀값(키·비밀번호·토큰)은 적지 않는다.
- 공용 목록 파일은 만들지 않는다. 찾기: `git log --all --grep "<과제ID>"`, 파일명 검색.
