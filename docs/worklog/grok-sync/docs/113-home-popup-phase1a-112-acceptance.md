# 113 · 112 Phase 1a 로컬 수락(조건부) — 홈 팝업 set-a 셸

- 작성일: 2026-09-25 (KST)
- 대상: [112](112-home-popup-phase1a-set-a-shell-ticket.md)
- 판정: **조건부 로컬 수락** (allowlist·게이트·골격 OK · 시안 맞춤 2건은 [114](114-home-popup-phase1a-112-fixup-ticket.md))
- 커밋: `f63924a5e608cb4eedb22c2beb2d180676555656`
- 브랜치: `feat/student-mypage-a-g` (origin/main `5c12a5d` 대비 ahead 1)
- push / `build:dothome`: **안 함** (보고와 일치 · 배포 금지 유지)
- 확인: Cursor 보고 + 로컬 커밋 파일·코드 대조 (관리자 실로그인 브라우저 스모크는 로컬 API 꺼짐으로 미실시)

---

## 1. 파일 (= allowlist)

| 경로 | 판정 |
|------|------|
| `preview/home-ui/src/home-popup/gate.js` | OK |
| `preview/home-ui/src/home-popup/content.js` | OK |
| `preview/home-ui/src/home-popup/mount.js` | OK |
| `preview/home-ui/src/styles/home-popup.css` | OK(보완 114) |
| `preview/home-ui/src/main.js` | OK(마운트 호출) |
| `preview/home-ui/src/site-ops-chrome.js` | OK(납작 팝업 억제) |
| `public/assets/brand/logo-lockup-pencil-wordmark.png` | OK(임시 합본) |
| `preview/home-ui/public/assets/brand/logo-lockup-pencil-wordmark.png` | OK(임시 합본) |

금지축 미수정: `site-settings-store` · a28 폼 · API/DB · set-b. 무관 dirty `docs/046`·`047`·`README` 미추적만 남음 → **이번 커밋과 섞지 말 것.**

---

## 2. 정책 대조

| # | 잠금 | 판정 | 근거 |
|---|------|------|------|
| 1 | set-a 공지·이벤트·광고만 | **PASS** | mount 3종 · set-b 없음 |
| 2 | `isAdminUser()`만 | **PASS(코드)** | `shouldShowHomePopup` · 손님 홈 스냅샷에 다이얼로그 없음(보고). 관리자 실로그인 스모크는 API 후 |
| 3 | 최대 1개 · 납작과 동시 금지 | **PASS** | `shouldSuppressOpsPopup` → listActivePopups 비움 · 배너 유지 |
| 4 | 하루 안 보기 UI · 미리보기 무시 | **PASS** | 체크 UI 있음 · 저장 없음 · 경로 재진입 시 다시 표시 |
| 5 | 흰 X · ESC | **PASS** | 다크 X 없음 |
| 6 | 합본 lockup · logo-full 금지 | **PASS(임시)** | 합본 PNG 경로만. 시안 h40/h64/h80 원본 대신 핀+워드마크 합성 → 시각 교체는 후속 가능 |
| 7 | 제목 아래 들여쓰기 14px | **PASS** | `.home-popup__indent { margin-left: 14px }` |
| 8 | 블루 `#266BC4` fill 금지 | **PASS** | 앰버/코랄/틸만 |
| 9 | 크기 420×480 · 400×560 · 560×360 | **PASS** | CSS 고정 |
| 9b | 광고 ≤**768** 세로 스택 | **FAIL→114** | 구현 `max-width: 640px` |
| 10 | 유형 스위치/쿼리 · 비관리자 비노출 | **PASS** | 카드 위 스위치 + `?popupDemo=notice|event|ad`(페이지 쿼리). 해시 쿼리 회피 합리적 |
| 11 | 관리자 폼 안 건드림 | **PASS** | |
| 시안 | 이벤트 lockup+Autumn Offer **왼쪽** | **FAIL→114** | 히어로 `align-items: center`(시안·112는 flex-start/왼쪽) |

---

## 3. Cursor 「다음 단계」교정

보고의 번호는 **053과 다름**. 잠금 순서:

1. **지금(114)** — 1a 시안 맞춤(768 · 이벤트 왼쪽)
2. **1b** — set-b 3종 + 패밀리 선택 (**비관리자 공개가 아님**)
3. **Phase 2** — 대상·우선순위·하루 안 보기 저장 엔진
4. **Phase 3–4** — API/DB · 관리자 내용 폼

비관리자 노출·기간·하루 안 보기 저장은 1b가 아니라 **Phase 2(+공개 토글)** 쪽.

---

## 4. 잔여 스모크 (API·Docker 올라온 뒤)

1. `jetty@naver.com` 관리자 → 손님 홈·공부방·과외쌤·학생 홈에서 모달
2. 로그아웃·일반 회원 → 모달·스위치 없음
3. ESC / X / 닫기 · 유형 전환 · 좁은 폭 광고 스택(768 기준 114 후)

---

## 5. 결론

Phase 1a **뼈대·게이트·allowlist·배포금지**는 맞다. 시안 잠금 중 **광고 768 스택**과 **이벤트 히어로 왼쪽 정렬**만 114로 고친 뒤 1a를 닫는다. 배포는 「배포」 말하기 전 금지.

---

**후속:** [114](114-home-popup-phase1a-112-fixup-ticket.md) 반영 → [115](115-home-popup-phase1a-114-acceptance.md)에서 Phase 1a 닫음.
