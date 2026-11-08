# 331 · 외부 AI 보안 **2차 재점검** 상세 기록 (2026-11-09)

**작성일:** 2026-11-09 (KST)  
**목적:** 1차(`329`·`82`~`82e`) 조치 이후 ChatGPT·Gemini·Genspark **재점검(82f~82j)** · PR 병합 · admin/지도 스모크까지 **공동폴더 정본**으로 자세히 남김  
**상태:** ✅ 취합·스모크·PR merge 완료 · **남은 것=후순위 3항**(아래 §9)  
**선행:** `329-external-ai-security-remediation-2026-11-08.md` · `328-youtube-pre-security-2026-11-08.md`  
**곁가지:** `330`(찾기 쪽지 정책 — 본 문서와 별개)

**승인자:** Study114 운영자  
**작업:** Cursor 메인 에이전트 (작업 브랜치 · `main` 직접 push 금지)

---

## 0. 한 줄 요약

조치 후 외부 3곳 재점검 → **Critical/High 재현 0**. 1차 High(HTTP→HTTPS 미강제) **해소**.  
내부로 `/#/admin` 게스트·홈 지도 스모크 **통과**.  
남음: CSP `'unsafe-inline'` 후순위 · 유튜브 **배너** 설치 후 CSP · **후속 B**(테스트 계정·IDOR).

---

## 1. 배경 · 왜 2차를 했는가

| 구분 | 내용 |
|------|------|
| 1차 | 2026-11-08 · 지시문 `82` · 결과 `82a`~`82d` · 대안 `82e` |
| 1차 핵심 | Critical 0 · High 재현 1(HTTPS 미강제) · 헤더 부재 등 |
| 이후 | FIX-1~6 완료(HTTPS·헤더·admin·81잠금·인가·IDOR·state·XSS·SPA 폴백·쪽지 MIME·CSP Enforce·git 조사·히스토리 유지·키 재발급) |
| 2차 목적 | 조치가 **실제로 보이는지** 외부에 다시 물어 「해소/잔존/미확인」 표로 받기 |
| 2차 아님 | 공격 자동화 · 실키 요구 · DoS · 제출함 거론 |

인수인계(당시): 「다음 채팅 = `82f` 재점검」.

---

## 2. 승인자 결정 로그

| 시각(대략) | 결정 |
|------------|------|
| 지시문 작성 | `82f`에 5·6 조치 요약·R20~R27·기간 2026-11-09~16 채움 |
| 계정 | **A = 테스트 계정 미제공** · 코드 미공유 |
| 후속 | **B = 유튜브 배너 건 뒤** 일회용 계정·IDOR 교차 |
| 플랫폼 | ChatGPT · Gemini · Genspark **각 1회** · 동일 `---` 이하 복붙 |
| 문서체계 | 1차와 동일: 지시문 → raw/summary ×3 → 취합 |
| PR | #133(문서) · #134(스모크 기록) merge |
| 브리핑「2」 | admin UI · 지도 브라우저 스모크 **즉시 수행** |

---

## 3. 문서 맵 (1차 ↔ 2차)

| 역할 | 1차 | 2차 |
|------|-----|-----|
| 지시문 | `docs/internal/82-…-prompt.md` | `82f-external-ai-retest-after-remediation-prompt.md` |
| ChatGPT | `82a` raw/summary | `82g` raw/summary |
| Gemini | `82b` raw/summary | `82h` raw/summary |
| Genspark | `82c` raw/summary | `82i` raw/summary |
| 취합 | `82d` | `82j` |
| 대안 브리핑 | `82e` (1~6순위) | 잔여·스모크는 `82j` §5~6 · 본 문서 §8~9 |
| 공동폴더 | `329` | **본 문서 `331`** (+ `329`에 링크) |
| worklog | `…-82-external-ai-security-audit.md` 등 | `…-82f-external-ai-security-retest.md` · `…-82f-…-prompt.md` · `…-82j-admin-map-browser-smoke.md` |
| 인수인계 | `docs/worklog/2026/11/2026-11-08-handoff.md` | 동일 파일 갱신 |

복붙 원문 위치: `82f` 파일의 **첫 `---` 이하**.

---

## 4. 지시문(`82f`)에 넣은 것

### 4-1. 운영자 조치 요약(외부 공개용 · 시크릿 값 금지)

1. CF Always Use HTTPS  
2. HSTS(~6개월·includeSubDomains·preload 없음) · nosniff · X-Frame SAMEORIGIN  
3. `/#/admin` 게스트 게이트 · `/api/admin/*` 미인증 401/403  
4. 세션 쿠키 Secure·HttpOnly·SameSite=Lax(관찰 가능 시)  
5. return_to·rate limit·cron 키·스토리지 서명(81잠금 유지)  
6. **추가:** 관리 API 인가 · IDOR 선별 · OAuth state · DOM XSS 이스케이프 · SPA 폴백 · 쪽지 MIME(finfo) · CSP Enforce(+`maps.apigw.ntruss.com`) · git blob **조사만**·히스토리 purge 안 함·키 재발급  

### 4-2. 재검증 ID

- R1~R12: 1차 대응 재검증  
- R20~R27: 5·6 추가(인가·IDOR·state·XSS·폴백·MIME·CSP+지도·시크릿 정책)  
- Genspark가 추가 관찰: **R5-b** (`'unsafe-inline'`)

### 4-3. 금지(외부)

DoS · 자동 침투 도구 · 시크릿 출력 · 악성 업로드 · git 옛 키 채굴 · rate limit 한도 채우기 · 한 플랫폼 1회.

---

## 5. 3사 결과 상세

### 5-1. ChatGPT (`82g`)

| 항목 | 내용 |
|------|------|
| Critical/High 재현 | **0** |
| 검증 완료 | **0** |
| 특징 | 브라우징 `DisabledError` → 사이트 HTTP **자체를 못 읽음**(서버 거부가 아님) |
| R1~R27 | **전부 미확인** |
| 의미 | 「안전/완료」인증에 **쓰지 말 것**. 도구 한계 보고서 |
| 제안(참고) | 운영자 `curl -sSI`로 헤더 확보 → 이후 내부·Genspark로 충족 |

### 5-2. Gemini (`82h`)

| 항목 | 내용 |
|------|------|
| Critical/High 재현 | **0** |
| 표기 | R1~R5·R7·R8/R20·R9/R22·R11/R27·R21 등 **다수「해소」** |
| 주의 | 「완벽·철저」톤 · OAuth/IDOR까지 해소로 쓴 부분은 **과장 가능** |
| 미기재 ID | R6·R10·R12·R23~R26 등 → 취합 시 **미확인**으로 둠 |
| 읽는 법 | 보조 증거. Genspark·내부와 충돌하면 Genspark/내부 우선 |

### 5-3. Genspark (`82i`) — **주증거**

| 항목 | 내용 |
|------|------|
| 방법 | GET/HEAD ~14건 · 요청 간격 ~8초 · POST/로그인/업로드 없음 |
| Critical/High 재현 | **0** |
| 해소·양호(실측) | R1 301 HTTPS · R2 HSTS(max-age=15552000+sub) · R3 nosniff · R4 X-Frame+frame-ancestors · R5 CSP Enforce · R6 www/dothome→apex · R8/R20 `/api/admin/` **403**·JSON 미노출 · R11/R27 번들 키·소스맵 0 · R24 `/.env` 등 홈 폴백 |
| 신규 Medium | **R5-b** CSP `script-src 'unsafe-inline'` 잔존 → XSS 완화 효과 약화 · **후순위 가능**이라고 본인도 명시 |
| 부분 | R7 `/admin`은 SPA index만 봄 → **UI 게이트는 브라우저 필요** |
| 미확인(원칙) | R9 return_to · R10 cron · R21 IDOR · R22 state · R25 MIME · R26 지도 UI |

---

## 6. 취합(`82j`) 판정 요지

**원칙:** 「재현됨」만 결함. ChatGPT 미확인 ≠ 잔존. Gemini 해소 ≠ 무조건 확정.

| 취합 | 판정 |
|------|------|
| 1차 High(HTTPS) | **해소** |
| 최소 보안 헤더 | **해소** |
| admin API | **해소** |
| CSP Enforce | **적용됨** |
| `'unsafe-inline'` | **잔존 Medium · 후순위** |
| 번들·SPA 폴백 | **양호/해소** |
| OAuth/cron/IDOR/MIME(외부) | **미확인** (내부 FIX 있음 · IDOR 교차는 후속 B) |
| 홍보 전 High 필수 | **없음** |

쉬운 말 브리핑 원문: `docs/internal/82j-external-retest-consolidation-2026-11-09.md` §0.

---

## 7. Git / PR

| 항목 | 값 |
|------|-----|
| 브랜치(문서) | `docs/82f-external-retest-2026-11-09` |
| 커밋 | `3df66fd6` — 82f~82j · 329 · handoff · worklog |
| PR | [#133](https://github.com/leejetty-commits/study114/pull/133) → merge `69bc579e` |
| 브랜치(스모크) | `docs/82j-admin-map-smoke-2026-11-09` |
| 커밋 | `325bc7fb` — 스모크 기록 · 82j/329/handoff 갱신 |
| PR | [#134](https://github.com/leejetty-commits/study114/pull/134) → merge `e869212e` |
| 범위 | **문서만** · 앱 배포 불필요(docs push) |

---

## 8. 내부 브라우저 스모크 (브리핑「2」·완료)

**일시:** 2026-11-09 · 정본 `https://study114.net`  
**기록:** `docs/worklog/2026/11/2026-11-09-82j-admin-map-browser-smoke.md`

| 항목 | 결과 | 관찰 |
|------|------|------|
| `/#/admin` 게스트 | ✅ | 「운영자 전용 / 운영자 권한이 필요합니다」·관리 본문 없음 |
| `/api/admin/` | ✅ | HTTP **403** |
| 홈 지도 | ✅ | `naver.maps` true · mount ~394×254 · 타일 로드 · 「설정 필요」없음 · 대치동 |
| 헤더(참고 curl) | ✅ | HTTP→HTTPS 301 · HSTS · nosniff · X-Frame · CSP Enforce |

※ 이것은 **일반 홈 지도** 스모크다. 유튜브 **배너**가 달린 뒤의 CSP 스모크와는 **별개**(§9-2).

---

## 9. 남은 三项 — 쉬운 말 정의 (승인자 확인용)

### 9-1. CSP `'unsafe-inline'` · **후순위**

- CSP는 “이 페이지만 이런 스크립트 허용” 규칙.  
- Enforce는 켜져 있으나 `script-src`에 **인라인 스크립트 허용**이 남아 CSP의 XSS 차단이 약함.  
- Genspark Medium · **유튜브 전 High 필수 아님**.  
- 나중 과제: nonce 등으로 인라인 제거(CSP 고도화).

### 9-2. 유튜브 **배너** 후 CSP

- 지금 통과한 것은 배너 **없는** 홈 지도.  
- 우측 레일 등에 YouTube를 넣으면 CSP `frame-src`/`script-src`가 영상을 허용하는지 **그 화면에서 다시** 본다.  
- 배너 미설치 → **지금은 불가** · 설치 후 1회.

### 9-3. 후속 **B** (테스트 계정)

- 이번은 **A**: 외부에 계정 안 줌 → 로그인 후 IDOR 교차는 외부 미확인.  
- 내부 FIX5-2는 이미 있음.  
- **B**: 배너 올린 **뒤** 일회용 계정 2개(예: 공급자×2 또는 학생+공급자)로 교차 재점검.  
- **admin 계정·실유저 계정은 외부에 금지.**

---

## 10. 제출함 · 금지 재확인

- **제출함(submission):** 숨김·제품 미사용. 보안 목록·업로드 보강 대상 **아님**. 거론 금지.  
- **금지:** 시크릿 출력 · 키 브루트 · rate limit 한도 채우기 · `main` 직접 push · git history force-push purge(정책상 안 함·키 재발급으로 처리).

---

## 11. 다음 채팅 안내

```
docs/worklog/grok-sync/docs/331-82f-external-retest-full-record-2026-11-09.md
다음=배너 후 CSP 또는 후속 B 또는 unsafe-inline. 331·329 읽고 복명복창.
```

또는 인수인계: `docs/worklog/2026/11/2026-11-08-handoff.md`

---

## 12. 관련 경로 인덱스 (풀경로)

| 구분 | 경로 |
|------|------|
| 본 문서 | `docs/worklog/grok-sync/docs/331-82f-external-retest-full-record-2026-11-09.md` |
| 1차 공동 | `docs/worklog/grok-sync/docs/329-external-ai-security-remediation-2026-11-08.md` |
| 지시문 | `docs/internal/82f-external-ai-retest-after-remediation-prompt.md` |
| ChatGPT | `docs/internal/82g-chatgpt-retest-raw-2026-11-09.md` · `…-summary-…` |
| Gemini | `docs/internal/82h-gemini-retest-raw-2026-11-09.md` · `…-summary-…` |
| Genspark | `docs/internal/82i-genspark-retest-raw-2026-11-09.md` · `…-summary-…` |
| 취합 | `docs/internal/82j-external-retest-consolidation-2026-11-09.md` |
| worklog | `docs/worklog/2026/11/2026-11-09-82f-external-ai-security-retest.md` |
| 스모크 | `docs/worklog/2026/11/2026-11-09-82j-admin-map-browser-smoke.md` |
| 인수인계 | `docs/worklog/2026/11/2026-11-08-handoff.md` |

절대경로 예: `D:\work\study114\docs\worklog\grok-sync\docs\331-82f-external-retest-full-record-2026-11-09.md`
