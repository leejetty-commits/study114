# 82e — 외부 점검 후 대안책 브리핑 (시급·중요 순)

**작성:** 2026-11-08  
**근거:** `82d-external-audit-consolidation-2026-11-08.md` · ChatGPT/Gemini/Genspark `82a`~`82c` · 내부 잠금 `81`  
**전제:** 현재 git에 올릴 변경은 **문서**이다. 아래 1~2순위는 이후 **설정·헤더** 작업, 3~6은 스모크·코드·후순위.

---

## 진행 방침

- **순서대로 하나씩** 진행한다.
- **1~2순위:** 재현된 구성 이슈 → 홍보 전 우선.
- **3~4순위:** 사람 스모크 + 81잠금 유지 확인.
- **5~6순위:** 철저 모드. 테스트 계정·시간·(6의 일부는) 별도 승인 필요. **단계마다 승인자 확인 후** 진행.

「전체 6순위까지 하는가?」→ **철저를 택하면 예.** 다만 5~6을 한 번에 약속하지 말고, 1 완료 → 2 → … 순으로 게이트한다.

---

## 1순위 — 지금 당장 (재현됨 · 홍보 전 필수)

**문제:** `http://study114.net`이 HTTPS로 리다이렉트되지 않고 200으로 열림. (Genspark R-1 · 내부 curl 재확인)

| 대안 | 장점 | 단점 |
|------|------|------|
| **A. Cloudflare「Always Use HTTPS」** | 클릭 몇 번, 전체 도메인 즉시 | CF 대시보드 접근 필요 |
| B. 서버 `.htaccess`에서 HTTP→HTTPS 301 | 호스팅만으로도 가능 | 배포·placeholder 규칙 주의, CF 앞단이면 A가 더 단순 |
| C. A+B 둘 다 | 이중 안전 | 설정 중복 관리 |

**추천:** **A 먼저.**

**완료 판정:** `curl`/브라우저로 `http://study114.net/` → HTTPS로 301/302.

### ✅ 완료 (2026-11-08)

- Cloudflare **Always Use HTTPS = on** (존 `study114.net`)
- 검증: `http://` · `http://www.` → `301` → `https://study114.net/`
- 기록: `docs/worklog/2026/11/2026-11-08-82-fix1-https-force.md`
- 오리진 `.htaccess` HTTP 리다이렉트는 **넣지 않음** (CF 루프 주의)

---

## 2순위 — 바로 이어서 (재현됨 · 강력 권장)

**문제:** HSTS, X-Frame-Options, X-Content-Type-Options, CSP 없음. (Genspark R-2 · Gemini SEC-06 · 내부 재확인)

| 대안 | 내용 |
|------|------|
| **A. 최소 헤더 세트** | `Strict-Transport-Security` + `X-Content-Type-Options: nosniff` + `X-Frame-Options: SAMEORIGIN` — 깨질 위험 낮음 |
| B. CSP까지 풀세트 | XSS 방어에 좋음 | 네이버맵·소셜·PG·폰트 때문에 **깨지기 쉬움**, 따로 튜닝 |
| C. Cloudflare Transform Rules로 헤더 삽입 | 코드 배포 없이 가능 | CF 설정 의존 |

**추천:** **A(또는 C로 A와 동일 헤더).** CSP(B)는 6순위·후순위로 미룸.

**완료 판정:** `https://study114.net/` 응답에 최소 헤더 3종 존재. (HSTS는 HTTPS 강제 이후가 자연스러움)

### ✅ 완료 (2026-11-08)

- CF `security_header`: HSTS 6개월 + `includeSubDomains` + `nosniff` (preload 끔)
- CF Transform: `X-Frame-Options: SAMEORIGIN`
- 검증: `curl -sI https://study114.net/` 3종 확인
- 기록: `docs/worklog/2026/11/2026-11-08-82-fix2-security-headers.md`

---

## 3순위 — 사람 10분 스모크 (추정 High를 우리 눈으로 닫기)

코드 변경 없이 가능.

1. 로그아웃 상태로 `/admin` → 로그인/차단만 나오는지  
2. 소셜 로그인(카카오·네이버·구글 중) 1회 정상  
3. 개발자도구에서 세션 쿠키 `Secure` / `HttpOnly` / `SameSite` 확인  

안 되면 그때 서버 인가·쿠키 플래그 코드 보강으로 내려감.

**완료 판정:** 체크 3항 결과 작업기록에 한 줄씩 남김.

### ✅ 에이전트 확인 완료 (2026-11-08) · 승인자 소셜 1회만 남음

- `/#/admin` 비로그인 → 「운영자 전용」게이트  
- `/api/admin/*` → 401  
- 로그인 페이지·소셜 버튼 노출 OK  
- `PHPSESSID` … `secure; HttpOnly; SameSite=Lax` 실측  
- 기록: `docs/worklog/2026/11/2026-11-08-82-fix3-smoke.md`  
- **승인자 확인:** 시크릿에서 네이버·구글 소셜 로그인 OK (2026-11-08) → FIX-3 **완료**

---

## 4순위 — 이미 81로 막아 둔 것 (신규 공사 아님 · 유지·스모크)

외부 AI가 “확인하라”고만 한 항목:

- OAuth `return_to` 화이트리스트  
- 로그인 rate limit  
- cron / 스토리지 시크릿  
- OAuth Client Secret 재발급  

**대안:** 새 기능보다 **키 없이 cron 호출 거부 · 이상한 return_to 차단** 정도만 스모크. 뚫렸다는 증거가 아님.

**완료 판정:** 스모크 결과 + `81` 잠금 상태 유지.

### ✅ 완료 (2026-11-08)

- cron 무키/틀린키 403 · GET 405  
- 악성 `return_to` → 카카오 인가로만 302 (피싱 URL 아님)  
- 로그인 실패 2회 정상 거부 (한도 미채움)  
- 첨부 API 404/닫힘 + storage secret 코드 잠금  
- 기록: `docs/worklog/2026/11/2026-11-08-82-fix4-smoke-81-locks.md`

---

## 5순위 — 계정·코드가 있어야 끝나는 것 (철저 모드)

| 항목 | 대안 |
|------|------|
| 관리자 API 인가 | 일반 계정으로 `/admin/*` API 호출 → 403인지. 안 되면 서버 전역 가드 보강 |
| IDOR | 테스트 계정 2개로 서로 ID 조회/수정 |
| OAuth `state` | 코드 화이트박스 1회 (생성·세션·콜백 검증) |
| DOM XSS / innerHTML | URL→HTML 경로만 골라 검토 |
| `.env` 등 200 폴백 | 본문이 `index.html`과 동일한지 1회 대조 |

**전제:** 테스트 계정 제공 여부·범위는 **승인자 확인 후**.

---

## 6순위 — 더 철저하게 (시간 날 때 · 일부 별도 승인)

- CSP 본격 도입  
- ~~업로드 MIME/경로(쪽지)~~ → ✅ PR #123 · `f842ef49` · Deploy OK · PNG 실측 OK. **제출함 제외.** 상세 `329`  
- git 히스토리 secret blob (**별도 승인·force-push** — 지시 없이 하지 않음)  
- ~~제출함 완전 삭제~~ → **하지 말 것(보안 목록에서 제외).** 제출함은 2026-11-07 **숨김·미사용**(`49`). 코드 잔재 삭제는 별도 청소·승인자 지시 시에만.  
- **남음:** CSP 본격  

---

## 커밋·push 범위 (이 단계)

문서만:

- `82` 지시문  
- `82a`~`82c` 원본·요약  
- `82d` 최종 취합  
- `82e` 본 브리핑  
- 작업기록 `docs/worklog/2026/11/2026-11-08-82-external-ai-security-audit.md`

코드·`.htaccess`·Secrets·배포 산출물 **포함하지 않음.** 1순위 설정은 이후 과제.
