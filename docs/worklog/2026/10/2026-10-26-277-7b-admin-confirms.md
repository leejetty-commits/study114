# 277-7b 관리자 확인창·입력창 32곳 → 공용 창

- **과제:** 277-7b
- **브랜치:** cursor/277-7b-admin-confirms-20261026
- **base:** 95f1d04 (origin/main)

## 지시 요약

관리자 화면의 `window.confirm()` 23곳 + `window.prompt()` 6곳 + 고객센터 2곳 + 메일설정 1곳 = **총 32곳**을
공용 `s114Confirm` / `s114Prompt`로 교체.

## 수정 파일

| 파일 | confirm | prompt | 합계 |
|---|---|---|---|
| `preview/home-ui/src/admin/a28-screens-bind.js` | 23 | 6 | 29 |
| `preview/home-ui/src/support/admin-screens.js` | 2 | 0 | 2 |
| `preview/home-ui/src/admin/a28-member-mail.js` | 1 | 0 | 1 |
| **합계** | **26** | **6** | **32** |

## 변경 내용

1. 3파일에 `import { s114Confirm, s114Prompt } from '…/shared/confirm-dialog.js';` 추가
2. 모든 `window.confirm(msg)` → `await s114Confirm(msg, opts)` 교체
3. 모든 `window.prompt(msg, default)` → `await s114Prompt(msg, default)` 교체
4. danger 분류:
   - 고정 danger:true — 17곳 (삭제·초기화·보관·숨김·비활성)
   - 조건부 danger — 5곳 (status/action 값에 따라)
   - options 없음 — 4곳 (권한변경, 보정, 상태변경)
   - prompt (options 없음) — 6곳 (복사·키입력·비밀번호)
5. 9개 이벤트 핸들러 `() =>` → `async () =>` 변환
   - `[data-channel-archive]`, `[data-section-remove]`, `[data-channel-reset-seed]`,
     `[data-rail-reset-seed]`, `[data-tpl-grp-del]`, `[data-tpl-delete]`,
     `[data-ph-grp-del]`, `[data-ph-del]`, `[data-sms-reset]`
   - 993·1065의 버튼은 `type="button"` 확인 → form submit 위험 없음

## 검증

- `rg "window\.confirm|window\.prompt"` → 3파일 모두 0건 ✅
- `window.alert` 변경 없음 ✅
- `confirm-dialog.js` 변경 없음 ✅
- `a28-member-mail.js` import + line 191 교체만 (잠금 준수) ✅

## 위험도

- **낮음** — UI 동작만 변경 (네이티브→커스텀 다이얼로그), 서버·DB·비밀값 무관
- 승인 후 main 병합 → Actions 배포로 반영
