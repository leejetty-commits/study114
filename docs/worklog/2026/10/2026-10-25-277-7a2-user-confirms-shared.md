# 277-7a2 — 사용자 확인창 나머지 7곳 → 공용 창

**기준:** main `794b43fd`  
**브랜치:** `cursor/277-7a2-user-confirms-20261025`  
**작업일:** 2026-10-25

## 바꾼 곳

| # | 파일 | 줄 | 전 | 후 | async 변경 |
|---|---|---|---|---|---|
| 1 | `auth-ui/src/screens/signup-basic.js` | 1038 | `confirm(…)` | `await s114Confirm(…)` | 이미 async |
| 2 | `auth-ui/src/screens/signup-complete.js` | 296 | `window.confirm(…)` | `await s114Confirm(…)` | `() =>` → `async () =>` |
| 3 | `home-ui/src/neighborhood-greeting-ui.js` | 732 | `window.confirm(…)` | `await s114Confirm(…, {danger:true})` | 이미 async |
| 4 | `home-ui/src/student-reg/screens.js` | 566 | `window.confirm(…)` | `await s114Confirm(…)` | `() =>` → `async () =>` |
| 5 | `study-room-ui/src/layout.js` | 241 | `window.confirm(…)` | `await s114Confirm(…)` | `function` → `async function` |
| 6 | `study-room-ui/src/layout.js` | 351 | `window.confirm(…)` | `await s114Confirm(…)` | `function` → `async function` |
| 7 | `tutor-ui/src/layout.js` | 208 | `window.confirm(…)` | `await s114Confirm(…)` | `function` → `async function` |

## 반환값 안전성

- `skipDetailRegistration` (5·7): click 핸들러에서만 호출, 반환값 미사용
- `offerGoToMessageInquiry` (6): 호출부 `setTimeout(() => …)` — 반환값 미사용, `Promise<boolean>` OK
- `select 'change'` (4): 취소 시 `select.value = shownHope` 복원 유지, await 중 값 변경 문제 없음 (단일 사용자 동작)

## 남은 곳

- **7b (관리자):** a28-screens-bind.js(29), a28-member-mail.js(1), support/admin-screens.js(2) — 32곳
- **alert:** (가)안 — 그대로
