# 82d — 외부 AI 보안 점검 최종 취합 (2026-11-08)

**대상:** Study114 (`study114.net`)  
**입력:** ChatGPT `82a` · Gemini `82b` · Genspark `82c` · 지시문 `82` · 내부 잠금 `81`  
**방법:** 저강도·1회성·테스트 계정/코드 미제공 · 내부에서 HTTP/HTTPS 헤더 **재확인 1회**

---

## 0. 쉬운 말 결론 (브리핑용)

1. **지금 “해킹 당했다”고 확정된 Critical는 없다.**  
2. **확실히 손볼 것 1순위:** 주소창에 `http://`(자물쇠 없는 쪽)로 들어가도 HTTPS로 안 넘겨 줌. → Cloudflare 등에서 **Always Use HTTPS** 켜기.  
3. **같이 넣으면 좋은 것:** HSTS, X-Frame-Options, X-Content-Type-Options 같은 **보안 헤더**(유튜브 직전 “필수”까지는 의견이 갈리지만, Genspark·Gemini는 권고).  
4. **이미 우리가 막아 둔 것(81):** cron 키, 첨부 서명, OAuth `return_to`, 로그인 rate limit, OAuth 시크릿 재발급. 외부 AI들은 코드가 없어 **“확인하라”고만** 반복함 → **신규 구멍으로 읽지 말 것.**  
5. **아직 밖에서 못 본 것:** 로그인 후 IDOR·관리자 API·쿠키 플래그. 계정 2개 주거나 우리가 직접 보면 됨.  
6. **좋은 소식(Genspark):** 공개 JS에 **시크릿·소스맵 없음**, `.env`/`.git`은 SPA 껍데기(폴백)로 보임, `/api/` 디렉터리는 403.  
7. **홍보 전 추천 순서:** (필수) HTTP→HTTPS 강제 → (권장) 보안 헤더 → (스모크) `/admin` 비로그인 차단·로그인 rate limit 한 번 · return_to는 81 유지.

---

## 1. 세 곳 한눈에

| 구분 | ChatGPT | Gemini | Genspark |
|------|---------|--------|----------|
| Critical 재현 | 0 | 0 | 0 |
| High **재현** | 0 | 0 | **1 (HTTPS 미강제)** |
| High **추정/후보** | state·IDOR·관리·cron 등 다수 | `/admin` 1건 | 관리 API·IDOR |
| 실측 깊이 | 리다이렉트 방향만 | 구조 추정 위주 | 헤더·번들·well-known까지 |
| “안전/위험” 확정 | 근거 부족 명시 | “전반 양호” 문구(과장 주의) | 구성 이슈 중심, 시크릿 노출 없음 |

**취합 원칙:** 「재현됨」만 결함으로 센다. 「추정」「미검증」「체크리스트」는 **할 일 목록**이지 침해 증거가 아니다.

---

## 2. 재현된 이슈 (우선 조치)

| ID | 내용 | 출처 | 내부 재확인 | 권고 | 홍보 전 |
|----|------|------|-------------|------|---------|
| FIX-1 | `http://study114.net/` → **200**, HTTPS 리다이렉트 없음 | Genspark R-1 | **2026-11-08 curl 확인 → CF Always Use HTTPS on 후 301 재확인** | Cloudflare「Always Use HTTPS」✅ 적용 | **필수 → 완료** |
| FIX-2 | HSTS / CSP / X-Frame-Options / X-Content-Type-Options 부재 | Genspark R-2 · Gemini SEC-06 | **https 응답에도 없음 확인** | 최소: HSTS + X-Content-Type-Options + X-Frame-Options(또는 CSP frame-ancestors). CSP 전체는 후순위 가능 | **권장** (Genspark는 즉시 조치에 포함) |

### 양호로 확정에 가까운 관찰

| 내용 | 출처 |
|------|------|
| www·dothome → apex 301 | 3곳 · Genspark R-3 |
| 공개 JS에 시크릿·소스맵 없음 | Genspark R-6·R-7 |
| `/api/` GET 403 | Genspark R-5 |
| `/.env` 등 200 = SPA 폴백 추정 | Genspark R-4 (본문 1회 더 대조하면 확정) |

---

## 3. 추정·체크리스트 vs 우리 81잠금

| 테마 | 외부 AI | 우리 상태 (81 등) | 취합 판정 |
|------|---------|-------------------|-----------|
| OAuth `return_to` | 3곳 모두 “확인하라” | **구현·배포됨** | 이미 있음 · 스모크만 |
| 로그인 rate limit | ChatGPT·Genspark | **구현·배포됨** | 이미 있음 · 한도 직전 스모크만 |
| Cron / 스토리지 시크릿 | 3곳 | **시크릿 필수화됨** | 이미 있음 · 키 없이 호출 거부 스모크 |
| OAuth Client Secret | (지시 배경) | **재발급·Secrets·로그인 OK** | 이미 있음 |
| OAuth `state` | ChatGPT High 추정 | 외부 미실측 | **코드 화이트박스 1회** 권장 |
| `/admin` UI·라우트 | Gemini High 추정 · Genspark 번들 노출 | SPA 라우트 노출은 흔함 | **비로그인 접속 + API 서버 인가** 확인 |
| IDOR·권한 상승 | 3곳 High 후보 | 미검증 | 테스트 계정 2개 있을 때 |
| 쿠키 Secure/HttpOnly/SameSite | 3곳 미확인 | 로그인 후 개발자도구 | 운영자 1분 확인 |
| DOM XSS / innerHTML | ChatGPT·Genspark | 미정밀 | 후순위 |
| 업로드 | ChatGPT | 미검증 | 후순위 |

---

## 4. 홍보 전 / 후순위

### 홍보 전 (추천)

1. **HTTP→HTTPS 강제** (FIX-1) — 유일하게 “재현 High”  
2. **기본 보안 헤더** (FIX-2) — 재현 Medium·Low  
3. **스모크(사람 5~10분):**  
   - `/admin` 비로그인 → 로그인/차단  
   - 소셜 로그인 정상 1회  
   - (선택) rate limit·return_to는 81 유지 전제

### 후순위

- CSP 고도화 · innerHTML 정밀 · IDOR(계정 2개) · 쿠키 실측 문서화 · `.env` 폴백 본문 대조 · `/auth/` 소형 응답 확인 · OAuth state 코드 리뷰

### 하지 말 것

- 외부 AI 표의 High **추정**을 “뚫림”으로 홍보·공개  
- 시크릿·실계정·대량 스캔으로 재점검

---

## 5. 산출물 인덱스

| 문서 | 내용 |
|------|------|
| `82-external-ai-security-audit-prompt.md` | 외부 AI 지시문 |
| `82a-chatgpt-audit-raw` / `-summary` | ChatGPT |
| `82b-gemini-audit-raw` / `-summary` | Gemini |
| `82c-genspark-audit-raw` / `-summary` | Genspark |
| **본 문서 `82d`** | 최종 취합 |
| `82e-remediation-priority-briefing-2026-11-08.md` | 대안책 1~6순위 브리핑·진행 방침 |
| `docs/worklog/2026/11/2026-11-08-82-external-ai-security-audit.md` | 작업기록 |

---

## 6. 배포 전 사용자 할 일 (이 취합 기준)

| 할 일 | 비고 |
|--------|------|
| Cloudflare(또는 닷홈) **Always Use HTTPS** / HTTP→HTTPS 301 | FIX-1 |
| 응답 헤더에 HSTS 등 추가 | FIX-2 · CF Transform Rules 또는 `.htaccess` — **커밋 전 Secrets/placeholder 규칙 준수** |
| (선택) `/admin` 비로그인·쿠키 플래그 스크린샷 보관 | 작업기록용 |

SQL·OAuth 시크릿 재작업은 이번 FIX에 **필수 아님**(81 완료 전제).
