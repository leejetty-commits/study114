# 문의하기 — 로그인이면 운영문의

**브랜치:** `work/inquiry-login-contact`  
**워크트리:** `.wt/work-inquiry-login-contact`  
**base:** `origin/main` (`5c40c6bb`)  
**지시서:** `docs/worklog/grok-sync/docs/inquiry-login-contact-2026-11-13.md`

## 지시 원문 요지

- 로그인: 둘째 항목 「운영문의」→ `supportUiUrl('/support/contact')`
- 비로그인: 「이메일 문의」→ `mailto:help@study114.net`
- FAQ·카카오톡 문의 유지 · auth-session 직접 import 금지
- 패널 열 때 / `auth:login`·`auth:logout`·`auth:session-hydrated` 에 항목 재동기화
- 커밋·push·PR · 머지 금지

## 승인

복명복창 확인 후 실행

## 구현

| 파일 | 내용 |
|------|------|
| `preview/shared/inquiry-contact.js` | `inquiryContactUrl()` = `supportUiUrl('/support/contact')` |
| `preview/shared/back-to-top.js` | 로그인 판별 `isChromeLoggedIn \|\| authRoleType` · contact 항목 갱신 |

## 셀프검수

| 항목 | 결과 | 근거 |
|------|------|------|
| 비로그인 「이메일 문의」mailto | PASS | Playwright |
| 로그인 「운영문의」/support/contact | PASS | authRoleType 시뮬레이션 + session-hydrated |
| logout 후 mailto 복귀 | PASS | auth:logout |
| FAQ·카카오 불변 | PASS | DOM |
| 캡처 1280·390 | PASS | `shots-inquiry-login-contact/` |

## 캡처

- `guest-email-1280.png` · `guest-email-390.png`
- `login-contact-1280.png` · `login-contact-390.png`

## 발견 목록

없음

## 커밋·PR

- tip `b472aadb` · push·PR (머지 안 함)

