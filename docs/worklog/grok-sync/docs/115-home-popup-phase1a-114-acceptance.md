# 115 · 114 로컬 수락 — Phase 1a 시안 맞춤 완료

- 작성일: 2026-09-25 (KST)
- 대상: [114](114-home-popup-phase1a-112-fixup-ticket.md) · 선행 [112](112-home-popup-phase1a-set-a-shell-ticket.md) · [113](113-home-popup-phase1a-112-acceptance.md)
- 판정: **로컬 수락** → Phase 1a(셸+set-a·관리자만) **닫음**
- 기준: `f63924a` + 워킹트리 `preview/home-ui/src/styles/home-popup.css` (보고 시점 **미커밋** · push 안 함)
- push / `build:dothome`: **안 함**

---

## 1. 대조

| # | 잠금 | 판정 | 근거 |
|---|------|------|------|
| 1 | 광고 스택 ≤768 | **PASS** | `@media (max-width: 768px)` · 폭 700 스모크 세로 스택 |
| 2 | 이벤트 lockup·Autumn Offer 왼쪽 동일 | **PASS** | `align-items: flex-start` · padding 24px · 실측 왼쪽 166px 동일 |
| 3 | lockup 높이 | **PASS** | 78→56px (시안 48–64 권장 구간) |
| 4 | allowlist만 | **PASS** | `home-popup.css`만 · mount.js 미수정 |
| 5 | push/빌드 없음 | **PASS** | |

---

## 2. 커밋 안내

CSS는 **`345590b`로 커밋됨**(파일 1개). **push·배포 금지** 유지.

무관 dirty(`docs/046`·`047`·`README`)는 스테이징하지 말 것.

---

## 3. Phase 1a 잔여

- 관리자 실로그인 홈 스모크: 로컬 API 올라온 뒤 (`jetty@naver.com`)
- lockup PNG 시안 원본 교체: 선택·후속
- 다음 기능: **1b set-b** (별도 티켓) · Phase 2 대상 엔진 · **배포는 「배포」 후**

---

## 4. 결론

114 시안 두 곳 충족. **Phase 1a 로컬 수락 완료.**
