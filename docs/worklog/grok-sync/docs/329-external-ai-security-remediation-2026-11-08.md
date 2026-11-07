# 329 · 외부 AI 보안 점검 + 대안 1~4순위 완료 (2026-11-08)

**작성일:** 2026-11-08 (KST)  
**목적:** ChatGPT·Gemini·Genspark 점검 결과와 후속 조치(FIX-1~4)를 공동폴더 정본으로 남김  
**상태:** ✅ 1~4순위 완료 · ⏸ 5~6순위는 **새 채팅**에서 진행  
**선행:** `328-youtube-pre-security-2026-11-08.md` (유튜브 전 보안 필수 1~5)

정본(내부): `docs/internal/82`~`82e` · `docs/internal/81-youtube-pre-security-lock.md`  
인수인계: `docs/worklog/2026/11/2026-11-08-handoff.md`  
작업기록: `docs/worklog/2026/11/2026-11-08-82-*.md`

---

## 한 줄 요약

외부 AI 3곳이 점검했고, **재현된 High는 HTTP→HTTPS 미강제뿐**이었다.  
Cloudflare에서 HTTPS 강제·최소 보안 헤더를 켰고, admin/쿠키/소셜/ cron·return_to 스모크까지 **1~4순위 끝냈다.**  
**5·6순위(철저·CSP·IDOR 등)는 새 채팅.**

---

## 외부 점검 문서 인덱스

| 문서 | 내용 |
|------|------|
| `docs/internal/82-external-ai-security-audit-prompt.md` | 외부 AI 지시문 |
| `82a` ChatGPT raw/summary | 재현 취약 0 · 체크리스트 다수 |
| `82b` Gemini raw/summary | High 추정 `/admin` · 헤더 Low 재현 |
| `82c` Genspark raw/summary | **HTTPS 미강제 High 재현** · 번들 시크릿 없음 |
| `82d` consolidation | 3곳 취합 |
| `82e` remediation briefing | 대안 1~6순위 |

---

## 대안 조치 결과 (1~4)

| 순위 | 내용 | 결과 | 기록 |
|------|------|------|------|
| 1 | HTTP→HTTPS | ✅ CF **Always Use HTTPS = on** · curl 301 확인 | `2026-11-08-82-fix1-https-force.md` |
| 2 | 최소 보안 헤더 | ✅ HSTS 6개월+includeSubDomains · nosniff · X-Frame-Options SAMEORIGIN (CSP 제외) | `2026-11-08-82-fix2-security-headers.md` |
| 3 | 스모크 admin·쿠키·소셜 | ✅ `/#/admin` 운영자 전용 · admin API 401 · Secure/HttpOnly/SameSite=Lax · **네이버·구글·카카오** 시크릿 OK | `2026-11-08-82-fix3-smoke.md` |
| 4 | 81잠금 스모크 | ✅ cron 무키/틀린키 403 · 악성 return_to→카카오만 · 로그인 실패 2회 거부(한도 미채움) · 첨부 404/닫힘 | `2026-11-08-82-fix4-smoke-81-locks.md` |

### Cloudflare (코드 배포 아님 · 엣지 설정)

- Zone: `study114.net`
- Always Use HTTPS: **on**
- `security_header` HSTS: enabled, max_age=15552000, include_subdomains, nosniff, **preload off**
- Response Header Transform ruleset: `X-Frame-Options: SAMEORIGIN`
- **주의:** 오리진 `.htaccess`에 HTTP→HTTPS를 또 넣지 말 것 (루프). CSP는 6순위로 미룸.

### Git

- 브랜치: `docs/82-external-ai-security-audit-prompt`
- tip (문서 커밋): `7a2dcdce` (FIX-4) · 그전 FIX-1~3·82 시리즈 포함
- **main 미병합이면** 새 채팅에서 PR 생성·병합 필요 (엣지 설정은 이미 운영 반영)

---

## 새 채팅이 할 일 (5·6)

### 5순위 — 철저 (계정·코드 · 단계 승인)

- 관리자 API 서버 인가 (일반 계정으로 `/api/admin/*` → 403인지)
- IDOR (테스트 계정 **2개** 필요할 수 있음)
- OAuth `state` 화이트박스 (생성·세션·콜백)
- DOM XSS / innerHTML 후보 (선별)
- `/.env` 등 200 = SPA 폴백 본문 대조

### 6순위 — 더 철저 (일부 별도 승인)

- CSP 본격 (네이버맵·소셜·PG 깨짐 주의)
- 업로드 MIME/경로
- git 히스토리 secret blob (**force-push · 별도 승인 없이 금지**)
- 제출함 완전 삭제 등 기존 후순위

**금지:** 시크릿 값 출력·키 브루트·rate limit 한도 채우기·main 직접 push.

---

## 새 채팅 첫 메시지 권장

```
docs/worklog/2026/11/2026-11-08-handoff.md
이어서 보안 대안 5순위부터. 329·82e 읽고 복명복창 후 진행.
```
