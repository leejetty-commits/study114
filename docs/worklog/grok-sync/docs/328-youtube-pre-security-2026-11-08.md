# 328 · 유튜브 홍보 전 보안 필수 1~5 완료 (2026-11-08)

**작성일:** 2026-11-08 (KST)  
**목적:** 유튜브 홍보 직전 보안 점검·조치 결과를 공동폴더(grok-sync) 정본으로 남김  
**상태:** ✅ 완료 (코드 배포 + OAuth 3사 시크릿 재발급·로그인 확인)

정본(내부): `docs/internal/81-youtube-pre-security-lock.md` · `docs/internal/31-oauth-secret-incident.md`  
작업기록: `docs/worklog/2026/11/2026-11-07-sec-*.md` · `2026-11-08-sec-login-rate-limit-v1.md` · `2026-11-08-handoff.md`

---

## 한 줄 요약

유튜브 홍보 전 보안 필수 **1~5를 끝냈다.**  
cron 뒷문·첨부 토큰·OAuth 복귀 URL·로그인 시도 제한·네이버/카카오/구글 시크릿 재발급·배포·로그인 확인까지 완료.

---

## 필수 5항 결과

| # | 항목 | 결과 | 대표 커밋 / 비고 |
|---|------|------|------------------|
| 1 | paid-reminders cron 키 잠금 | ✅ | `c5894f36` PR #109 · Secret `STUDY114_CRON_KEY` |
| 2 | 첨부 토큰 `STUDY114_STORAGE_SECRET` + 소유자 재확인 | ✅ 유지(롤백 없음) | `e03a7345` PR #110 |
| 3 | OAuth `return_to` 개방 리다이렉트 잠금 | ✅ | `b6818271` PR #112 |
| 4 | 로그인·소셜 시작 rate limit | ✅ | `af986354` PR #113 |
| 5 | OAuth 3사 시크릿 재발급·Secrets·배포·로그인 | ✅ 사람 작업 | 2026-11-08 새벽 확인 |

### 부가(같은 기간)

- 제출함(submission board) UI/API **숨김**(완전 삭제는 후순위) · `2742b104` PR #111  
- 쪽지 ON 때 SMS·학생 ON 정책 메모: `docs/worklog/2026/11/2026-11-07-message-on-sms-student-policy.md`

---

## 4번 잠금 숫자 (승인됨)

| 대상 | 기준 | 한도 | 대기 |
|------|------|------|------|
| 비밀번호 로그인 | 이메일 실패 | 15분에 5회 | 15분 |
| 비밀번호 로그인 | IP 실패 | 15분에 15회 | 15분 |
| 소셜 시작 | IP | 2분에 10회 | 창이 빌 때까지 |

안내: 「…보안상 잠시 막았습니다. 약 N분 후에 다시 시도해 주세요.」  
저장: `storage/rate-limits/` (서버 자동 생성 · git 무시)

---

## 5번 OAuth 재발급 (사람)

- 네이버: Client ID 유지 · Client Secret 재발급 → Secrets → Deploy → 로그인 OK  
- 카카오: REST 키 유지 · **카카오 로그인** Client Secret 재발급(비즈니스 인증 시크릿 ✕) → Deploy → 로그인 OK  
- 구글: Add secret → Secrets → Deploy → 로그인 OK → **옛 secret 삭제 완료**

실값은 문서·채팅·저장소에 **적지 않음**.

---

## 후순위 (이번 범위 밖)

- 쪽지 ON 시 SMS·학생 쪽 ON  
- 제출함 코드 **완전 삭제**  
- git 히스토리 secret blob force-push 정리 (별도 승인)  
- 로그인 rate limit 관리자 수동 해제·캡차

---

## 배포·확인

- 코드: main Deploy to dothome 성공 (PR #109~#113 등)  
- 시크릿만 바꾼 날: Actions **Deploy to dothome** 수동 Run (`main`) 후 소셜 로그인 확인
