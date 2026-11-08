# 82c — Genspark 보안 점검 요약 (2026-11-08)

**원본:** `82c-genspark-audit-raw-2026-11-08.md`  
**지시문:** `82-external-ai-security-audit-prompt.md`  
**내부 잠금(참고):** `81-youtube-pre-security-lock.md`  
**상태:** Genspark 3/3 완료 · 최종 취합 → `82d-external-audit-consolidation-2026-11-08.md`

---

## 한 줄 결론

세 곳 중 **가장 실측에 가깝다.** Critical 0. **재현 High 1건: HTTP가 HTTPS로 안 넘어감(R-1).** 헤더 4종 부재(R-2)도 재현. 번들·소스맵·시크릿 노출은 **양호**. 관리 API·IDOR는 여전히 **후보(미검증)**.

---

## 재현됨 (Genspark)

| ID | 내용 | 심각도 | 내부 대조(2026-11-08) |
|----|------|--------|------------------------|
| R-1 | `http://study114.net/` → 200, HTTPS 리다이렉트 없음 | High | **확인됨** (curl HEAD) |
| R-2 | HSTS·CSP·X-Frame·X-Content-Type-Options 없음 | Medium | **확인됨** (https 응답에도 없음) |
| R-3 | www·dothome → apex 301 | 양호 | ChatGPT/Gemini와 일치 |
| R-6·R-7 | JS 시크릿·소스맵 없음, 공개 URL만 | 양호 | Genspark만 번들까지 봄 |

## 양호/추정 (부가)

| ID | 내용 |
|----|------|
| R-4 | `/.env` 등 200이지만 SPA 폴백 추정 → 실노출로 보지 않음 |
| R-5 | `/api/` 403 양호 · `/auth/` 소형 응답 추가 확인 권장 |

## 미재현 후보 (체크리스트)

C-1 관리 API 서버 인가 · C-2 innerHTML · C-3 쿠키 · C-4 OAuth · C-5 rate limit · C-6 IDOR · C-7 cron — 계정/코드 없이 끝 못 냄. C-4·C-5·C-7은 **81잠금과 겹침(이미 구현)**.

---

## Genspark 즉시 조치 3건

1. HTTP→HTTPS 301 (Cloudflare Always Use HTTPS 등)  
2. HSTS + X-Content-Type-Options + X-Frame-Options(또는 CSP)  
3. 관리자 PHP API 서버측 인가 확인  

→ 1·2는 **구성으로 바로 손댈 수 있는 재현 이슈**. 3은 내부 코드 확인.
