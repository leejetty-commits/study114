# 189-rework · Cursor — 「대학/대학원」 라벨 전역 통일

- 작성: 2026-09-29 · 우동공과2
- 사유: 189 1차 REJECT — 피커는 OK, 등록확인·프로필·요약·스키마·검증에 「출신대학」「학교명」 잔존
- 선행 유지: 2단 SSOT · 188 재선택 · 기타/서술형
- push · build:dothome · Notion · commit **금지**

## Must
사용자에게 보이는 「출신대학」「학교명」을 **전부** 「대학/대학원」으로 통일.
최소 확인 파일:
- `preview/tutor-ui` / `preview/study-room-ui` 쪽 `registration-check-model.js`, `registration-check-copy.js`
- `profile-read.js`, `summary.js`
- `format.js`, `search-schema.js`
- `form-collect.js`, `inline-save.js` (검증·에러 문구)
피커·검색 필드 라벨도 「대학/대학원」만.

## Forbid
korean-universities 목록 구조 재작성 · 동네인사 · 공개블록 · commit/push/build:dothome

## 스모크
등록확인·프로필·검색 필터·저장 실패 메시지에 「출신대학」「학교명」 0건.
