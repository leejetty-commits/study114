# 2026-11-08 — 82 FIX-1 HTTP→HTTPS 강제 완료

## 지시

외부 점검 대안 **1순위**: `http://study114.net` → HTTPS 리다이렉트.

## 조치

| 항목 | 내용 |
|------|------|
| 수단 | Cloudflare zone setting **Always Use HTTPS** = `on` |
| 존 | `study114.net` (`68d1fd843f2702f77eea723ae822dbe8`) |
| 사전 SSL 모드 | `full` (Off 아님 → Always Use HTTPS 적용 가능) |
| 시각(UTC) | 2026-11-07T17:00:23Z (API `modified_on`) |
| 오리진 `.htaccess` | **미변경** — CF 문서상 엣지 강제와 오리진 동시 리다이렉트는 루프 위험 |

## 검증

```
curl -sI http://study114.net/
→ HTTP/1.1 301 Moved Permanently
→ Location: https://study114.net/

curl -sI http://www.study114.net/
→ HTTP/1.1 301 Moved Permanently
→ Location: https://study114.net/
```

## 다음

**2순위:** 최소 보안 헤더 (HSTS · X-Content-Type-Options · X-Frame-Options). CF Transform Rules 또는 `.htaccess` Header — 승인자 확인 후.
