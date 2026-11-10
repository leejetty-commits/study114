# 345 — 회원가입 주소검색(카카오 우편번호) CSP 차단 긴급 수정

**브랜치:** `work/345-csp-kakao-postcode`  
**기준:** `origin/main` (`73ecc06f`)  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-345-csp-kakao-postcode`

## 지시 요점

- 운영 가입 주소검색 시 「postcode.map.kakao.com이 차단되었습니다」로 진행 불가.
- CSP 헤더만 수정. 앱 코드·unsafe-inline/eval·Report-Only 되돌리기 금지.
- 실제 위반에 나온 도메인만 해당 지시어에 추가.

---

## 1. 원인 확정 (운영 재현)

**재현:** `https://study114.net/auth/#/signup/form` → 주소 검색 / iframe probe

**CSP 위반 원문 (수정 전, DevTools `securitypolicyviolation`):**

```
effectiveDirective: frame-src
violatedDirective: frame-src
blockedURI: https://postcode.map.kakao.com
disposition: enforce
```

추가 probe (fetch):

```
effectiveDirective: connect-src
blockedURI: https://postcode.map.kakao.com/
disposition: enforce
```

**원인:** Enforce CSP에 `postcode.map.daum.net`·`t1.daumcdn.net`만 허용.  
카카오 우편번호 위젯 실제 iframe은 **`https://postcode.map.kakao.com/search?...`** 로 로드됨 (daum → kakao 호스트 전환).

**CSP 정의 위치:** Cloudflare Response Header Transform  
- zone `study114.net`  
- ruleset `132970d7c91c492d848cef06caa75d26` (`http_response_headers_transform`)  
- rule `857266f312294446b4c30520efd0ef68` (ref `study114_csp_report_only`)  
- `public/.htaccess`에는 CSP 없음 (이번 범위에서 앱/닷홈 파일 수정 없음).

---

## 2. 조치 (CF CSP만)

| 지시어 | 추가 |
|--------|------|
| `frame-src` | `https://postcode.map.kakao.com` |
| `connect-src` | `https://postcode.map.kakao.com` |

- 기존 `postcode.map.daum.net` · `t1.daumcdn.net` 유지  
- `*` / `https:` 전체 허용 없음  
- `unsafe-inline`·`unsafe-eval` 추가 없음 · Report-Only 되돌리기 없음  
- 다른 지시어·도메인 변경 없음  

**규칙 description:** `CSP Enforce + kakao postcode.map.kakao.com (345)`

### diff (CSP 값, 변경분만)

```diff
- connect-src ... https://postcode.map.daum.net;
- frame-src ... https://postcode.map.daum.net https://t1.daumcdn.net;
+ connect-src ... https://postcode.map.daum.net https://postcode.map.kakao.com;
+ frame-src ... https://postcode.map.daum.net https://postcode.map.kakao.com https://t1.daumcdn.net;
```

---

## 3. 주소검색 사용 화면 (코드 확인)

| 화면 | 경로/모듈 |
|------|-----------|
| 가입 공통 주소 | `preview/auth-ui/src/screens/signup-form.js` (`/auth/#/signup/form`) |
| 공부방 기본·사업장·홍보지역 | `preview/shared/study-room-basic-form.js` |
| 찾기(위치) | `preview/search-ui/src/search-find-surface.js` |
| 공용 | `preview/shared/kakao-postcode.js` → `t1.daumcdn.net` 스크립트 |
| PHP 폴백 | `src/Views/auth/signup-form.php`, `basic-study-room.php` |

가입(공부방·과외쌤·학생) 공통 주소는 `signup-form` 1곳. 역할별 기본정보는 study-room 폼·희망지역 등에서 동일 위젯 사용 → **CSP 1회 수정으로 전 화면 공통 해소**.

---

## 4. 운영 확인 (배포=CF 즉시 반영 후)

| 항목 | 결과 |
|------|------|
| `curl -sI` CSP에 `postcode.map.kakao.com` (frame+connect) | ✅ |
| 데스크톱 1280: embed → nested iframe `postcode.map.kakao.com` · CSP hits 0 | ✅ |
| 390px: 동일 · CSP hits 0 · 「차단되었습니다」 문구 없음 | ✅ |
| 카카오 우편번호 UI (tip · Powered by kakao) 표시 | ✅ |
| 입력칸 채움 (우편번호·도로명·상세) | ✅ (폼 필드 적용 확인) |
| 1st-party CSP 위반 0 (CF nel/insights 제외) | ✅ |

---

## 5. Git / PR / 머지

| 항목 | 값 |
|------|-----|
| 저장소 변경 | worklog만 (CSP는 CF, 앱 코드 0) |
| 커밋 | _(작성 후 기입)_ |
| PR | _(작성 후 기입)_ |
| 머지 커밋 | _(작성 후 기입)_ |
| 배포 | CF Transform 규칙 PATCH 즉시 반영 (닷홈 FTP/Actions 불필요) |

---

## 금지 준수

- 앱 코드(`preview/`·`public/`) 미수정  
- `unsafe-inline`/`unsafe-eval` 추가 없음 · Report-Only 되돌리기 없음  
- force push / `reset --hard` / `stash drop` 없음  
