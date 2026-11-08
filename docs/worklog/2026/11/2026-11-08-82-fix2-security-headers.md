# 2026-11-08 — 82 FIX-2 최소 보안 헤더 완료

## 지시

외부 점검 대안 **2순위**: HSTS · `X-Content-Type-Options` · `X-Frame-Options` (CSP는 후순위).

## 조치

| 헤더 | 수단 | 값 |
|------|------|-----|
| `Strict-Transport-Security` | CF zone `security_header` | `max-age=15552000; includeSubDomains` (6개월, **preload 없음**) |
| `X-Content-Type-Options` | 동상 `nosniff: true` | `nosniff` |
| `X-Frame-Options` | CF Response Header Transform ruleset `132970d7…` | `SAMEORIGIN` |

- 존: `study114.net`
- 오리진 `.htaccess` **미변경** (엣지에서 처리)
- CSP **미적용** (6순위·깨짐 위험)

## 검증

```
curl -sI https://study114.net/
→ Strict-Transport-Security: max-age=15552000; includeSubDomains
→ X-Content-Type-Options: nosniff
→ X-Frame-Options: SAMEORIGIN
```

## 주의

- HSTS는 HTTPS가 깨지면 브라우저가 한동안 HTTP를 거부한다. 끄려면 max-age를 0으로 내린 뒤 **max-age 기간만큼** 기다려야 한다.
- preload 목록 제출은 하지 않음.

## 다음

**3순위:** `/admin` 비로그인 · 소셜 로그인 1회 · 세션 쿠키 플래그 스모크.
