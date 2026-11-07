# hide-submission-board-v1 — 제출함 숨김 (2026-11-07)

**브랜치:** `cursor/hide-submission-board-v1-20261107`  
**지시:** 제출함은 사이트에 없다 · 숨김 먼저 · 2번 STORAGE_SECRET은 롤백하지 않음

## 401 vs 404

| 코드 | 의미 |
|------|------|
| **401** | 로그인 안 됨 (기능이 없어서가 아님) |
| **404** | 제출함 기능 없음(숨김) — 이번에 API에 사용 |

## 변경

- 마이페이지: 과외쌤 「제출자료/제출함」 메뉴 제거 · 옛 URL은 안내 문구만
- API: `submission-attachments` · attachments token/download · posts list/save/delete(`submission`) → 404
- 정본 49: 구버전·미사용으로 교체
- `STUDY114_STORAGE_SECRET`(보안 2번): **유지** (남은 코드 경로 잠금 · 사진 업로드와 무관)

## 안 한 것

- `submission-board/` 폴더·관리자 제출 큐·DB 테이블 완전 삭제 (다음 과제)
- ssot 15·21 등 전수 문장 정리 (49에 무효 표시 · 후속)
