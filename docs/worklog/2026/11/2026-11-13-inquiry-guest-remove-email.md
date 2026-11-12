# 문의하기 — 게스트 「이메일 문의」제거

**브랜치:** `work/inquiry-guest-remove-email`  
**워크트리:** `.wt/work-inquiry-guest-remove-email`  
**base:** `origin/main` (`7753284d`, #197)  
**지시서:** `docs/worklog/grok-sync/docs/inquiry-guest-remove-email-2026-11-13.md` (`d55cebfc`)

## 지시 원문 요지

- PR #198 머지·이어수정 금지 · 최신 main에서 신규
- 비로그인: 「이메일 문의」제거 → FAQ·카카오만
- 로그인: FAQ·운영문의·카카오 유지 (mailto/주소줄 없음)
- 푸터 이메일 유지 · 커밋·push·PR · 머지 금지

## 구현

| 파일 | 내용 |
|------|------|
| `preview/shared/back-to-top.js` | 게스트 contact 항목 제거 · 로그인 시 운영문의 삽입 |
| `preview/shared/inquiry-contact.js` | 패널용 `INQUIRY_MAILTO` 제거 |

## 셀프검수

| 항목 | 결과 | 근거 |
|------|------|------|
| 게스트 FAQ·카카오만 · 이메일 없음 | PASS | Playwright |
| 로그인 운영문의 3항 | PASS | Playwright |
| logout 후 이메일 재출현 없음 | PASS | Playwright |
| 캡처 1280·390 | PASS | `shots-inquiry-guest-remove-email/` |

## 캡처

- `guest-no-email-1280.png` · `guest-no-email-390.png`
- `login-contact-1280.png` · `login-contact-390.png`

## 발견 목록

없음

## 커밋·PR

- (커밋 후 갱신)
