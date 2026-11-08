# 2026-11-08 — 82 FIX 5-3 OAuth `state` 화이트박스

**상태:** ✅ 점검 완료 · CSRF 양호 · 네이버 state 인자 전달·`hash_equals` 보강 **적용**  
**방식:** 코드만 (계정 불필요) · 브랜치 `fix/oauth-naver-state-pass`

## 흐름 (쉬운 말)

1. **만들기** `start.php` — `random_bytes(16)` → hex 32자  
2. **기억** 세션 `$_SESSION['oauth']`에 state · provider · return_to · redirect_uri  
3. **보내기** 네이버·카카오·구글 인가 URL에 state 포함  
4. **검사** `callback.php` — 세션 state·provider와 GET 값 일치할 때만 진행  
5. **한 번만** 검사 직후 `unset($_SESSION['oauth'])` → 재사용 차단

## 판정

| 항목 | 결과 |
|------|------|
| 난수 state | ✅ |
| 세션 저장·프로바이더 묶기 | ✅ |
| 콜백 일치 검사 | ✅ |
| 사용 후 폐기 | ✅ (CSRF 목적) |
| 타이밍 안전 비교(`hash_equals`) | ℹ️ 선택 보강 (현재 `!==`) |
| 네이버 토큰 교환 시 state | ✅ 수정 — 콜백이 검증한 `$sessionState`를 `authenticate(..., $oauthState)`로 전달. 세션 unset 후에도 빈 값 아님 |
| `hash_equals` | ✅ 콜백 state 비교에 적용 |

## 수정 파일

- `public/api/auth/oauth/callback.php`
- `src/Auth/OAuthService.php`

## 다음

배포 후 네이버 로그인 1회 스모크(승인자) → **5-4 DOM XSS**
