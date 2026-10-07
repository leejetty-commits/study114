# 045 · 043 수락 — 가입 QA allowlist 닷홈 배포

- 작성일: 2026-09-24 (KST)
- 대상: [043](043-signup-qa-allowlist-deploy-ticket.md) · 판정 [042](042-deploy-judgment-signup-qa.md)
- 상태: **운영 수락** (Cursor 보고 대조)

---

## 0. 한 줄

`6bf408a` allowlist 7파일만 main 푸시 · Deploy to dothome **#325 success**. C군·mypage 0. 스모크 필수항 충족. **수락.**

---

## 1. 증거

| 항목 | 결과 |
|------|------|
| SHA | `6bf408a68b8a0e6678af2321e46cfb8b38b486ee` |
| 범위 | `20b7be8..6bf408a` → `origin/main` |
| Actions | Deploy to dothome **#325** success (verify:shop-page · tutor-inquiries-settings · board-acl · ftp-deploy) |
| 운영 auth | `https://study114.net/auth/assets/index-B_cF2Gf3.js` |
| 운영 room | `https://study114.net/register/room/assets/index-6cjrPGjG.js` |

### stage 7파일 (C군 0 · mypage 0)

- `preview/shared/korea-sidos.js`
- `preview/auth-ui/src/screens/signup-complete.js`
- `preview/study-room-ui/src/main.js`
- `preview/study-room-ui/src/screens/step-lesson.js`
- `preview/study-room-ui/src/screens/step-facility.js`
- `preview/shared/study-room-basic-form.js`
- `preview/auth-ui/src/screens/signup-basic.js` — **030 hunk만** (`regionIdFromActivityLabel` / `activityLabelFromRegionId`)

### 스모크

| 043 필수 | 보고 |
|----------|------|
| 과외 의정부=29 · alert 없음 | cities id=29 · 라벨↔id · validate ok · 운영 번들 포함 |
| 완료 디버그 칸 없음 · 같은 탭 | 디버그 칸 0 · `window.open` 0 · `location.assign` |
| 상세 카피 | 로컬·운영 room 번들 모두 「지금 다 안 채워도…」 |
| 개설→홍보1 | 운영에 `promo1-manual` + 안내 카피 · 040 스모크와 동일 |

### 안 올린 것 (의도 · 워킹트리 잔존)

학생 9필드 WIP · `layout.js` · auth `main.js` · `study-room-reg/screens.js` · `mvc.css` · BasicRegister PHP · `student-basic.css` · tmp/verify/teaser

---

## 2. 다음

- 운영 HEAD = `6bf408a` (가입 QA 반영)
- 전역 홈 버그 → [044](044-studyroom-home-promo1-memberbox-ticket.md) (로컬만 · 043과 커밋 분리)
- 038 서버 null · 학생 PHP/CSS WIP · 031 동강제 = 별도
