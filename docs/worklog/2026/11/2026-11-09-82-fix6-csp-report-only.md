# 2026-11-09 — 6순위 CSP Report-Only (1단계)

## 지시

보안 6순위 CSP. **강제(Enforce) 전에 Report-Only**로 먼저 건다 (지도·소셜·유튜브 깨짐 방지).

## 조치

| 항목 | 값 |
|------|-----|
| 수단 | Cloudflare Response Header Transform · ruleset `132970d7…` |
| 규칙 ref | `study114_csp_report_only` · id `857266f3…` |
| 헤더 | `Content-Security-Policy-Report-Only` (**막지 않음**) |
| 존 | `study114.net` |
| 닷홈 | CF 미경유 · 현재 정본으로 301 → **이번 단계 대상 아님** |

### 허용 요약 (현재 연동분)

- script: `'self'` · `'unsafe-inline'` · 네이버맵 · pstatic · 다음/카카오 우편번호 CDN  
- connect/frame: 맵·다음·유튜브  
- img: `'self'` data blob **https:** (타일·썸네일)  
- style: `'self'` `'unsafe-inline'`  
- object: none · frame-ancestors self · form-action self  

문자인증·결제 업체는 **아직 미포함** → 붙일 때 목록에 추가.

## 검증

```
curl -sI https://study114.net/
→ Content-Security-Policy-Report-Only: default-src 'self'; …
→ (기존) HSTS · nosniff · X-Frame-Options
```

사이트는 그대로 동작해야 함. 콘솔에 CSP 위반 **경고만** 있을 수 있음(차단 아님).

## 다음

1. 승인자 스모크: 홈 지도 · 소셜 로그인 · 주소검색 · 유튜브 미리보기  
2. 콘솔 위반 많으면 허용 목록 보강  
3. 안정되면 **Enforce**(`Content-Security-Policy`)로 전환 · Report-Only 제거  
4. git secret blob은 별도  
