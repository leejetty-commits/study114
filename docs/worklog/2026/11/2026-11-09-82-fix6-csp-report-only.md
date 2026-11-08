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

## 스모크 (승인자 · 2026-11-09 새벽)

| 항목 | 결과 |
|------|------|
| 전체 페이지 표시 | ✅ 잘 보임 |
| 홈 지도 · 소셜 · 주소검색 | 페이지/기능 깨짐 없음 (진행) |
| 유튜브 | **보류** — 우측 레일 유튜브 배너 미설치. **오늘 저녁** 재개 |
| F12 · 필터 `csp` | 주황색 CSP 경고 **안 보임** |
| Issues 패널 | 페이지마다 이슈 **개수가 다르게** 표시됨 (CSP 주황과 별개 · 참고만) |

## 다음

1. **오늘 저녁** 유튜브 배너 후 유튜브 스모크  
2. OK면 **Enforce** 전환 · Report-Only 제거  
3. git secret blob은 별도  
