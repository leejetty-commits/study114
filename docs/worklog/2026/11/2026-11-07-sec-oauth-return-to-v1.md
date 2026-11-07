# sec-oauth-return-to-v1 — OAuth return_to 개방 리다이렉트 잠금 (2026-11-07)

**브랜치:** `cursor/sec-oauth-return-to-v1-20261107`  
**상태:** 코드 준비 · Secret/SQL 없음  
**범위:** 유튜브 홍보 전 보안 필수 3번

## 지시 요지

소셜 로그인 후 `return_to`가 `str_starts_with($homeUi)` 접두 비교만 해서
`https://study114.net.evil.com/...` 같은 외부로 302 될 수 있던 구멍 잠금.

## 변경 파일

| 파일 | 내용 |
|------|------|
| `src/bootstrap.php` | `study114_sanitize_oauth_return_to()` — 상대경로/`/` + 허용·로컬 origin만 |
| `public/api/auth/oauth/start.php` | 세션 저장 전 살균 |
| `public/api/auth/oauth/callback.php` | 세션 읽은 뒤 살균 · 접두 `str_starts_with` 제거 |
| `scripts/check-oauth-return-to.php` | CLI 스모크 (허용/거절 케이스) |

## 배포 전 사용자 할 일

없음 (Secret·SQL·`.htaccess` 실값 변경 없음).

## 배포 후 확인

```text
php scripts/check-oauth-return-to.php
# → ok cases=...

# 정상: 로그인 후 원래 페이지 복귀 (상대·정본 absolute)
# 악성: return_to=https://study114.net.evil.com/ → 역할 홈으로 폴백 (외부 302 없음)
```

## 검수

- [ ] `php scripts/check-oauth-return-to.php` 통과
- [ ] Actions Deploy 성공
- [ ] 정상 소셜 로그인 복귀
- [ ] 접두 우회 URL이 외부로 안 나감
