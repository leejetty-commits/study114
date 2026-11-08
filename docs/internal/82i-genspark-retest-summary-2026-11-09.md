# 82i — Genspark 보안 **재점검** 요약 (2026-11-09)

**원본:** `82i-genspark-retest-raw-2026-11-09.md`  
**지시문:** `82f-external-ai-retest-after-remediation-prompt.md`  
**1차 대비:** `82c-genspark-audit-summary-2026-11-08.md`  
**최종 취합:** `82j-external-retest-consolidation-2026-11-09.md`  
**상태:** ✅ 원본 보관·요약 완료 · 3곳 모음 → `82j` 취합

---

## 한 줄 결론

**Critical/High 재현 0.** 1차와 같이 **실측이 가장 깊음**(GET/HEAD ~14건). HTTPS·헤더·CSP Enforce·admin API 403·번들·`.env` 폴백을 **해소/양호로 재현**. **신규 Medium:** CSP `script-src 'unsafe-inline'` 잔존(R5-b). OAuth·cron·IDOR·MIME·지도 UI는 **미확인**(원칙상 미수행).

---

## 실제로 본 것 (신뢰도 높음)

| 관찰 | 판정 |
|------|------|
| `http://` → 301 HTTPS | 해소 (1차 High 해소) |
| HSTS max-age=15552000 · includeSubDomains | 해소 |
| nosniff · X-Frame SAMEORIGIN · frame-ancestors 'self' | 해소 |
| CSP Enforce 존재 | 재현(적용됨) |
| CSP `'unsafe-inline'` | **잔존 Medium** |
| www·dothome → apex 301 | 양호 |
| `/api/admin/` 403 · members 404 · JSON 미노출 | 해소 |
| 번들 시크릿·소스맵 0 · `/.env` 등 홈 폴백 | 양호/해소 |
| `/admin` SPA index만 (UI 게이트 미브라우저) | 부분 확인 |

---

## 미확인 (원칙·한계)

R9 return_to · R10 cron · R21 IDOR · R22 state · R25 MIME · R26 지도 UI  

→ 내부 이미 스모크했거나 **후속 B**/브라우저 1회와 맞춤.

---

## Critical/High/Medium

- Critical 재현: **0**
- High 재현: **0**
- Medium 재현(신규): **1** — `'unsafe-inline'` (후순위 가능이라고 본인도 명시)

---

## 1차(`82c`)·타사 대비

| 구분 | 1차 Genspark | 2차 Genspark | Gemini | ChatGPT |
|------|--------------|--------------|--------|---------|
| 실측 | 가장 깊음 | 동일하게 깊음 | 해소 다수·과장 | 전부 미확인 |
| High | HTTPS 미강제 1 | **0**(해소) | 0 | 0 |
| 신규 | — | unsafe-inline Medium | 표에 없음 | 표에 없음 |

---

## 취합(`82j`)에 넣을 때

- 헤더·HTTPS·admin API·폴백: Genspark를 **1차 증거**로  
- Gemini「전부 해소」중 OAuth/IDOR는 Genspark「미확인」과 맞춤 → **미확인/내부완료**  
- R5-b unsafe-inline → 후순위 할 일  
- `/admin` UI · 지도 → 유튜브 직전 브라우저 스모크 권장
