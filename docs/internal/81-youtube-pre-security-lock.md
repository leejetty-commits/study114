# 81 — 유튜브 홍보 전 보안 잠금 (2026-11-08)

**상태:** ✅ 잠금 · 필수 1~5 완료  
**동기화:** grok-sync `328-youtube-pre-security-2026-11-08.md`  
**관련:** `31-oauth-secret-incident.md` · cron/storage Secrets · `LoginRateLimiter`

---

## 0. 목적

유튜브 유입 전, 자동 스캔·credential stuffing·유출 시크릿·오픈 리다이렉트에 바로 걸리는 구멍을 막는다.

---

## 1. 필수 완료 목록

| # | 잠금 | 구현 요지 |
|---|------|-----------|
| 1 | cron | `STUDY114_CRON_KEY` · 헤더만 · 약함/`dev-cron-key` 거부 |
| 2 | 첨부 토큰 | `STUDY114_STORAGE_SECRET` 필수 · 소유자 재확인 · 롤백 금지 |
| 3 | OAuth return_to | `study114_sanitize_oauth_return_to()` · 허용/로컬 origin·상대경로만 |
| 4 | 로그인 시도 | 아래 §2 숫자 · 파일 버킷 `storage/rate-limits/` |
| 5 | OAuth 시크릿 | 네이버·카카오·구글 Client Secret 재발급 · Secrets · 배포 · 로그인 확인 (2026-11-08) |

제출함은 **숨김**까지. 완전 삭제는 후순위.

---

## 2. 로그인 rate limit (잠금 숫자)

| 대상 | 기준 | 한도 | 잠금/대기 |
|------|------|------|-----------|
| 비밀번호 | 이메일 실패 | 15분 / 5회 | 15분 |
| 비밀번호 | IP 실패 | 15분 / 15회 | 15분 |
| 소셜 시작 | IP | 2분 / 10회 | 슬라이딩 창 |

- 실패만 가산 · 성공 시 해당 이메일 버킷 삭제  
- 안내: 보안상 잠시 막음 + **약 N분 후** 재시도  
- 관리자 수동 해제·캡차: 잠금 범위 밖  
- IP: `study114_client_ip()` (CF-Connecting-IP 또는 REMOTE_ADDR)

---

## 3. OAuth 시크릿 운영

- `.htaccess`는 `__OAUTH_*__` placeholder만 커밋  
- 실값 = GitHub Actions Secrets → Deploy 주입  
- 유출 의심 시: 콘솔 재발급 → Secrets Update → **Deploy 수동/자동** → 3사 로그인  
- 카카오: **카카오 로그인** Client Secret만 (비즈니스 인증 시크릿 ✕)  
- 구글: Add secret → 배포·확인 후 옛 secret 삭제  

상세 사고·구조: **31장**.

---

## 4. 배포 전 사용자 할 일 (이 잠금 기준)

| Secret | 비고 |
|--------|------|
| `STUDY114_CRON_KEY` | 32자+ · `dev-cron-key` 금지 |
| `STUDY114_STORAGE_SECRET` | 첨부 HMAC |
| OAuth 6종 | 재발급 후 값 유지·주기 로그인 검증 |

SQL 없음 (rate limit은 파일).

---

## 5. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-11-07~08 | 필수 1~4 코드 배포 · 제출함 숨김 |
| 2026-11-08 | 필수 5 · 3사 시크릿 재발급·로그인 OK · 본 잠금·grok-sync 328 |
