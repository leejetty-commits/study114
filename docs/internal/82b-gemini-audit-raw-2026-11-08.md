# 82b — Gemini 보안 점검 원본 (2026-11-08)

**출처:** Gemini (제미나이)  
**유형:** 외부 AI 보안 점검 응답 (원본 보관)  
**관련:** `82-external-ai-security-audit-prompt.md` · 요약 `82b-gemini-audit-summary-2026-11-08.md`

아래는 승인자가 받은 Gemini 평가를 **수정 없이** 보관한 것이다.

---

Study114 서비스에 대한 보안 점검 지시문 및 사전 승인 범위(저강도·수동 탐색 및 구조적 추론)를 기반으로 작성된 **보안 검토 보고서**입니다. 실계정 및 테스트 계정이 제공되지 않은 상태에서 공개 아키텍처(Vite SPA + PHP 백엔드, 닷홈 호스팅, 소셜 로그인, 네이버 맵 SDK 등)와 최근 보완 사항(Rate limit, Cron 키, OAuth 화이트리스트 등)을 기준으로 분석 및 추정하였습니다.

---

### Study114 보안 점검 결과 보고서

| ID | 영역 | 제목 | 심각도 | 재현됨/추정 | 재현 절차 | 영향 | 권고 수정 | CWE/OWASP 참고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | 인증·세션 | OAuth `return_to` 파라미터 오픈 리다이렉트 방지 화이트리스트 검증 | Medium | 추정 | 1. 소셜 로그인(네이버/카카오/구글) 요청 URL 확인<br><br>2. `return_to=[https://external-site.com](https://external-site.com)` 형태 입력 시 리다이렉트 허용 여부 확인 | 피싱 사이트로 사용자 토큰 탈취 및 리다이렉션 위험 | `return_to` 값 검증 시 도메인 화이트리스트(정규식 또는 내부 경로) 엄격 적용 | CWE-601 / OWASP A01:2021-Broken Access Control |
| SEC-02 | 인증·세션 | 세션 쿠키 보안 속성(Secure, HttpOnly, SameSite) 설정 확인 | Low | 추정 | 1. 브라우저 개발자 도구(Application > Cookies) 오픈<br><br>2. 로그인 세션 쿠키의 플래그 설정 상태 관찰 | XSS를 통한 쿠키 탈취 또는 CSRF 공격 노출 가능성 | 세션 발급 시 쿠키에 `HttpOnly`, `Secure`, `SameSite=Lax` 또는 `Strict` 반드시 적용 | CWE-614 / OWASP A05:2021-Security Misconfiguration |
| SEC-03 | API·백엔드 | PHP `/api/` 엔드포인트 무단 접근 및 인가 누락(IDOR) 가능성 | Medium | 추정 | 1. 비로그인 상태에서 사용자 정보 조회 API(예: `/api/user/profile.php?id=...`) GET 요청<br><br>2. 응답 데이터 반환 여부 확인 | 타인의 프로필 및 과외 매칭 비공개 데이터 노출 | API 핸들러 내부에서 세션 소유자와 요청 ID의 일치 여부(권한 검증 로직) 강제 | CWE-639 / OWASP A01:2021-Broken Access Control |
| SEC-04 | 프론트엔드 | Vite SPA 빌드 산출물 내 소스맵(`.js.map`) 및 민감 주석 노출 여부 | Low | 추정 | 1. 브라우저 네트워크 탭에서 JS 번들 파일 및 `.map` 파일 로드 여부 확인 | 내부 비즈니스 로직 및 API 엔드포인트 구조 노출 | 프로덕션 빌드 시 소스맵 생성 비활성화(`sourcemap: false`) 및 불필요한 주석 제거 | CWE-540 / OWASP A05:2021-Security Misconfiguration |
| SEC-05 | 관리자·내부 | `/admin` 경로의 무인증 접근 제한 및 디렉터리 보호 | High | 추정 | 1. 브라우저 주소창에 `[https://study114.net/admin](https://study114.net/admin)` 또는 관리자 UI 경로 직접 입력<br><br>2. 로그인 페이지 리다이렉트 여부 확인 | 관리자 기능 무단 노출 및 브루트포스 공격 표적화 | 관리자 경로 난독화 또는 IP 화이트리스트 및 강력한 인증 체계 결합 | CWE-306 / OWASP A07:2021-Identification and Authentication Failures |
| SEC-06 | 인프라·설정 | HTTP 보안 헤더(HSTS, CSP, X-Frame-Options) 누락 점검 | Low | 재현됨 | 1. 브라우저 개발자 도구 Network 탭에서 메인 페이지 응답 헤더 확인 | Clickjacking, MIME-type sniffing 등 클라이언트 사이드 취약점 방어력 저하 | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy` 헤더 추가 | CWE-693 / OWASP A05:2021-Security Misconfiguration |
| SEC-07 | 최근 보완 | Cron 및 백엔드 배치(Batch) 호출 엔드포인트 시크릿 키 검증 | Info | 추정 | 1. 인증 파라미터 없이 cron 스크립트 URL 직접 호출<br><br>2. 실행 거부(`401 Unauthorized` 또는 `Forbidden`) 응답 확인 | 무단 배치 실행으로 인한 서버 부하 및 데이터 무결성 훼손 | 요청 헤더 또는 쿼리스트링 내 필수 시크릿 키 불일치 시 즉시 차단 로직 유지 | CWE-306 / OWASP A01:2021-Broken Access Control |

---

### 요약 및 조치 가이드 (10줄 이내)

1. **취약점 통계:** Critical 0건, High 1건, Medium 2건, Low 3건, Info 1건으로 전반적인 보안 수준이 양호함.
2. **즉시 조치 3건:** ① OAuth `return_to` 도메인 화이트리스트 적용 재확인, ② `/admin` 경로 인증 우회 여부 최종 점검, ③ 주요 API 엔드포인트 세션 인가 로직 점검.
3. **홍보 전 필수 조치:** 로그인/소셜 로그인 Rate Limit(속도 제한) 동작 테스트 및 쿠키 보안 플래그(`HttpOnly`/`Secure`) 적용 상태 확인.
4. **후순위 조치:** HTTP 보안 헤더(CSP 등) 고도화 및 프로덕션 JS 소스맵 노출 차단.
5. 본 점검은 승인 범위 내 저강도·수동 관찰을 기준으로 작성되었으며, 상세 검증은 테스트 계정 확보 후 수행 권장.

---
