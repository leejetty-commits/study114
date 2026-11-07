# sec-login-rate-limit-v1 — 로그인·소셜 시작 시도 제한 (2026-11-08)

**브랜치:** `cursor/sec-login-rate-limit-v1-20261108`  
**상태:** ✅ 머지·배포 (`af986354`, PR #113) · 정본 잠금 `81` · SSOT C-6b · grok-sync 328  
**범위:** 유튜브 홍보 전 보안 필수 4번

## 승인된 숫자

| 대상 | 기준 | 한도 | 잠금/대기 |
|------|------|------|-----------|
| 비밀번호 로그인 | 이메일 실패 | 15분에 **5회** | **15분** |
| 비밀번호 로그인 | IP 실패 | 15분에 **15회** | **15분** |
| 소셜 시작 | IP | 2분에 **10회** | 창이 빌 때까지 |

## 안내 문구

- 비밀번호: `로그인 실패가 잦아 보안상 잠시 막았습니다. 약 N분 후에 다시 시도해 주세요.`
- 소셜: `요청이 잦아 보안상 잠시 막았습니다. 약 N분 후에 다시 시도해 주세요.`
- 해제: 시간 지나면 자동 (+ 로그인 성공 시 해당 이메일 카운트 삭제)
- 관리자 수동 해제·캡차: 범위 밖

## 변경 파일

| 파일 | 내용 |
|------|------|
| `src/Auth/LoginRateLimiter.php` | 파일 버킷 |
| `src/Auth/LoginRateLimitException.php` | 메시지·retry_after |
| `src/bootstrap.php` | `study114_client_ip()` |
| `public/api/auth/login.php` | 검사·실패 기록·성공 시 이메일 클리어 |
| `public/api/auth/oauth/start.php` | IP 시작 제한 |
| `preview/shared/auth-welcome-copy.js` | rate limit 메시지 통과 |
| `scripts/check-login-rate-limit.php` | CLI 스모크 |

## 배포 전 사용자 할 일

없음. (`storage/` 는 `.gitignore` · 서버에서 자동 mkdir)

## 검수

- [ ] Actions Deploy 성공 (auth-ui 빌드 포함)
- [ ] 비밀번호 5회 실패 → 안내 + 약 15분
- [ ] 소셜 시작 과다 → 로그인 화면 oauth_error 안내
