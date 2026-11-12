# 문의하기 — 게스트 이메일 주소 표시·복사

**브랜치:** `work/inquiry-guest-email-copy`  
**워크트리:** `.wt/work-inquiry-guest-email-copy`  
**base:** `origin/main` (`7753284d`)  
**지시서:** `docs/worklog/grok-sync/docs/inquiry-guest-email-copy-2026-11-13.md` (`19069033`)

## 지시 원문 요지

- 비로그인: 「이메일 문의」아래 `help@study114.net` 표시 · 클릭 시 복사 + 「메일 주소를 복사했어요」 + mailto
- 로그인 운영문의·FAQ·카카오·푸터 불변
- 주소 상수 한곳 · shared 짧은 토스트 · s114Alert / showP24Toast 금지
- 커밋·push·PR · 머지 금지

## 구현

| 파일 | 내용 |
|------|------|
| `preview/shared/inquiry-contact.js` | `INQUIRY_EMAIL` → mailto 파생 |
| `preview/shared/brief-status-toast.js` | `role=status` 짧은 안내 |
| `preview/shared/back-to-top.js` | 게스트 두 줄·복사·mailto / 로그인 운영문의 |
| `preview/home-ui/src/styles/design-system.css` | 주소 줄·토스트 스타일 |

## 셀프검수

| 항목 | 결과 | 근거 |
|------|------|------|
| 게스트 주소 표시 | PASS | Playwright DOM |
| 복사 + 토스트 문구 | PASS | clipboard + `#study114-brief-status-toast` |
| 로그인 운영문의·주소 줄 없음 | PASS | DOM |
| FAQ·카카오 유지 | PASS | DOM |
| 캡처 1280·390 | PASS | `shots-inquiry-guest-email-copy/` |

## 캡처

- `guest-email-1280.png` · `guest-email-390.png`
- `login-contact-1280.png` · `login-contact-390.png`

## 발견 목록

없음

## 커밋·PR

- tip `343d0f07` · push·PR (머지 안 함)

