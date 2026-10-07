# 036 · 가입 티켓 3(035) 수락 — 같은 탭 · 게스트 플래시

- 작성일: 2026-09-24 (KST)
- 대상: [035](035-signup-detail-same-tab-ticket.md)
- 상태: **로컬 수락** (push / 빌드 / 커밋 없음)

---

## 0. 한 줄

새 창이 세션 전에 해시를 바꿔 게스트 상세를 그리던 원인이 맞다. 이어하기를 `location.assign`으로 맞추고, 세션 확정 전 `render` 가드로 플래시를 막았다. **수락.**

---

## 1. 대조

| 035 | 결과 |
|-----|------|
| 공부방 이어하기 `_blank` 제거 | `window.location.assign(STUDY_ROOM_UI_BASE)` |
| 과외쌤과 정렬 | tutor도 assign · 홈/학생 이어하기도 assign |
| 게스트 플래시 | `study-room-ui/src/main.js` — `chromeReady` 전 `render()` return |
| 약관 새 창 | `signup-terms.js` `_blank` **유지** (올바름) |
| 범위 | 두 파일만 (+033 디버그 제거가 complete에 누적) |
| push | 안 함 |

---

## 사용자 스모크

1. 공부방 완료 → 「상세등록 이어하기」 → **같은 탭** · 게스트 「공부방 상세정보」 깜빡임 없음  
2. 약관/정책 링크는 새 창 유지

---

## 다음

티켓 4 — 상세 빈 저장 · 카피 통일 → [037](037-signup-detail-optional-save-copy-ticket.md)
