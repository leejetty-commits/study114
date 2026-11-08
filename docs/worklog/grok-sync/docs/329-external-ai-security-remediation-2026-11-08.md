# 329 · 외부 AI 보안 점검 + 대안 조치 (2026-11-08)

**작성일:** 2026-11-08 (KST)  
**목적:** ChatGPT·Gemini·Genspark 점검 결과와 후속 조치(FIX-1~5)를 공동폴더 정본으로 남김  
**상태:** ✅ 1~6 조치 · ✅ `82f`~`82j` 2차 재점검 취합 완료(2026-11-09) · Critical/High 재현 0 · **다음=유튜브 직전 스모크·배너 후 B**  
**선행:** `328-youtube-pre-security-2026-11-08.md` (유튜브 전 보안 필수 1~5)  
**곁가지:** `330-search-memo-cross-region-nav-role-2026-11-08.md` (찾기 쪽지·지역 제한 없음 정책)

정본(내부): `docs/internal/82`~`82j` · `docs/internal/81-youtube-pre-security-lock.md`  
인수인계: `docs/worklog/2026/11/2026-11-08-handoff.md`  
작업기록: `docs/worklog/2026/11/2026-11-08-82-*.md` · `…-82f-external-ai-security-retest.md`

---

## 한 줄 요약

외부 AI 3곳 Critical 재현 0. 재현 High는 HTTP→HTTPS 미강제 → CF로 해소.  
헤더·admin·81잠금·5순위·**6-업로드(쪽지 MIME)**까지 **끝냄.**  
**2차 재점검 취합 완료** (`82j`). High 재현 0 · `'unsafe-inline'` Medium 후순위. 유튜브 직전 admin UI·지도 스모크 권장 · **후속 B**는 배너 후.

---

## 외부 점검 문서 인덱스

| 문서 | 내용 |
|------|------|
| `docs/internal/82` ~ `82e` | 1차 지시문·3사 raw/요약·취합·대안 1~6 |
| `82f` | 2차 재점검 지시문 |
| `82g` | ChatGPT 재점검 ✅ (재현0·전부 미확인) |
| `82h` | Gemini 재점검 ✅ (재현0·다수「해소」·과장 주의) |
| `82i` | Genspark 재점검 ✅ (재현0·실측 최심·`unsafe-inline` Medium) |
| `82j` | 2차 최종 취합 ✅ |
| `330` | 찾기 쪽지 정책·guest 버그 수정·실측 |

---

## 대안 조치 결과

### 1~4순위

| 순위 | 내용 | 결과 | 기록 |
|------|------|------|------|
| 1 | HTTP→HTTPS | ✅ CF Always Use HTTPS | `…-82-fix1-https-force.md` |
| 2 | 최소 보안 헤더 | ✅ HSTS·nosniff·X-Frame (CSP 제외) | `…-82-fix2-security-headers.md` |
| 3 | admin·쿠키·소셜 | ✅ | `…-82-fix3-smoke.md` |
| 4 | 81잠금 스모크 | ✅ cron·return_to·로그인 부분 | `…-82-fix4-smoke-81-locks.md` |

### 5순위 ✅ (2026-11-08 저녁)

| # | 내용 | 결과 | 기록 |
|---|------|------|------|
| 5-1 | 관리자 API 인가 | ✅ 비로그인 401 · 일반 「운영자 전용」 | `…-82-fix5-1-admin-api-auth.md` |
| 5-2 | IDOR | ✅ 설정 URL 교차 · 쪽지(홈·찾기). 찾기 guest 버그→**330**/PR #117 | `…-82-fix5-2-idor.md` |
| 5-3 | OAuth `state` | ✅ CSRF OK · 네이버 state 인자 전달·hash_equals · 네이버 실측 | `…-82-fix5-3-oauth-state.md` · PR #119 |
| 5-4 | DOM XSS 선별 | ✅ Critical 없음 · attr 이스케이프 보강 | `…-82-fix5-4-dom-xss.md` · PR #120 |
| 5-5 | `.env` 등 SPA 폴백 | ✅ 200=홈 HTML · 비밀 미노출 | `…-82-fix5-5-spa-fallback.md` |

### Cloudflare (코드 배포 아님)

- Always Use HTTPS · HSTS(includeSubDomains·preload off) · nosniff · X-Frame SAMEORIGIN  
- 오리진 `.htaccess`에 HTTP→HTTPS **중복 금지**

---

## 6순위

### 업로드(쪽지) ✅ (2026-11-09 새벽)

| 항목 | 내용 |
|------|------|
| PR | #123 (`fix/message-attachment-mime-harden`) · merge `f842ef49` |
| Deploy | Actions [42494247444](https://github.com/leejetty-commits/study114/actions/runs/42494247444) success · `public/`+`src/` FTP |
| 코드 | `MessageAttachmentService` — 서버 MIME(finfo) · 저장 확장자=MIME · PDF `%PDF-` · 이미지 getimagesize+GD 재인코딩 · **다운로드 제안명 확장자도 서버 MIME** |
| 범위 | **쪽지 첨부만.** 제출함 제외. 홍보/프로필은 285 보강 유지 |
| 문서정리 | 제출함 = 숨김 → 보안 목록 거론 금지 (`49`·handoff·본 문서). #122는 #123에 흡수 후 닫음 |
| 실측 | 승인자 PNG 첨부·다운로드 → **그대로 PNG**(정상: 포맷 유지·재인코딩). 위장 확장자 거절은 서버 MIME 기준 |
| worklog | `docs/worklog/2026/11/2026-11-08-fix-message-attachment-mime-harden.md` · `…-docs-retire-submission-from-security-lists.md` |

### CSP ✅ (2026-11-09)

| 단계 | 내용 |
|------|------|
| Report-Only | CF 적용 → 전 페이지 OK · F12 csp 주황 없음 · `…-fix6-csp-report-only.md` |
| **Enforce** | `Content-Security-Policy` 전환 · Report-Only 제거 · `…-fix6b-csp-enforce.md` |
| 핫픽스 | 로그인 지도 notFound → `maps.apigw.ntruss.com` 누락 → 허용 추가 → **승인자 지도 OK** |
| 수단 | CF Transform `132970d7…` · rule `857266f3…` |
| 유튜브 | 허용 목록에 포함 · **배너 실측은 보류** |
| 문자·결제 | 연동 시 허용 목록 **추가** |

### git blob 조사 ✅ (2026-11-09 · force-push 없음)

| 항목 | 결과 |
|------|------|
| HEAD | OAuth·관련 키 **placeholder** · 시크릿 재발급 완료 |
| 히스토리 | `a990122`/`fce2c28`/`1d56525` 등 `.htaccess`에 **옛 실값 blob 잔존** |
| 조치 | **조사만** · 기록 `…-git-secret-blob-investigate-only.md` · 정본 `31` |
| force-push | **안 함·그대로 둠** (승인자 2026-11-09 · 키 전부 재발급) |

### 남음

- ✅ **`82f`~`82j` 2차 재점검** (A=계정 없음 · 취합 완료)  
- 유튜브 직전 권장: `/#/admin` 게스트 UI · 지도 브라우저 스모크  
- CSP `'unsafe-inline'` 제거 — **후순위**  
- **후속 B:** 유튜브 배너 후 → 테스트 계정 → IDOR 교차  
- (선택) 유튜브 배너 후 CSP 스모크

**제출함(submission):** 2026-11-07 **숨김·제품 미사용** 확정(`49` · `hide-submission-board-v1` · `328`).  
사이트 메뉴·API 404. **보안 6순위·업로드 보강 대상이 아니다.** 거론·재오픈 금지.  
코드 잔재 **완전 삭제**는 별도 청소 과제(승인자 지시 시에만) — 보안 체크리스트에 넣지 말 것.

**금지:** 시크릿 출력·키 브루트·rate limit 한도 채우기·main 직접 push.

---

## 5·6 완료 후 — 외부 재점검

1. ✅ `82f` 지시문 채움  
2. ✅ ChatGPT·Gemini·Genspark (`82g`~`82i`)  
3. ✅ 취합 `82j` · worklog `…-82f-external-ai-security-retest.md`