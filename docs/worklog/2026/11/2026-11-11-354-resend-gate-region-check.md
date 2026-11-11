# 354 — CI Resend gate 오탐 재확인 + 가입·기본정보 지역 선택 점검

- 작성·실행·1차 셀프검수: Cursor
- 최종검수: 우동공과3
- 지시서: `docs/worklog/grok-sync/docs/354-resend-gate-region-check-2026-11-11.md`
- 브랜치: `work/354-resend-gate-region-check`
- 기준: `origin/main` `e573b4ef` (#160 merge)
- 작업 폴더: `D:\work\study114\.wt\work-354-resend-gate-region`
- 앱 코드(`preview/`·`public/`) 변경: **0**

---

## 선행 (#160 Deploy)

| 항목 | 결과 |
|------|------|
| PR #160 | MERGED · merge `e573b4ef` · 2026-11-11 11:29 UTC |
| Deploy to dothome | **success** · run [43012340138](https://github.com/leejetty-commits/study114/actions/runs/43012340138) · `ftp-deploy` 포함 전 job success |

---

## 게이트 상태 (한 줄)

**PHP 8.2 Resend gate의 tutor-signup-seed는 344 수정 이후 main에서 PASS. 옛 경로만 보는 잔존 검사 없음 → 추가 스크립트 수정 불필요.**

---

## 1. `npm run verify:tutor-signup-seed`

```text
PASS: fetchRegions returns tutor units (auth-api.js or regions-catalog.js)
… (전체 PASS)
tutor signup seed gate OK
```

워크플로: `.github/workflows/cur-006-resend.yml` → job `php82-mail-gate` → `npm run verify:tutor-signup-seed`

---

## 2. grep 전수 (옛 경로만 보는 검사)

명령: `rg -n "auth-api\.js|tutorUnits|fetchRegions" scripts .github`

| 파일 | 판정 |
|------|------|
| `scripts/verify-tutor-signup-seed.mjs` | 구·신 매핑 + `auth-api`/`regions-catalog` **둘 다** 인정 (344) |
| `scripts/verify-study-room-basic-register-api.mjs` | `auth-api`에 `basicRegisterApi` 존재·호출만 검사. tutorUnits 문자열 오탐 아님 |
| 기타 verify-*.mjs | mock 응답의 `tutor_units` 필드만. 소스 경로 문자열 고정 검사 아님 |

**잔존 오탐 검사: 없음 → 스크립트 수정 0 · 항목 3 N/A**

---

## 3. 지역 선택 점검표

로컬 PHP `:8080` / `php` CLI **없음**. UI는 Vite(5173/5174) + Playwright API 목.  
`regions.php` 헤더·본문은 **운영** `https://study114.net` curl.

| 점검 | 결과 | 근거 |
|------|------|------|
| 가입 과외쌤 시·도→시·군 선택 (값 region_id=41) | PASS | `shots-354/354-tutor-before/after-1920·390.png` |
| 가입 학생·공부방 기본등록 화면 지역/주소 UI 노출 | PASS | `354-student-basic-*` · `354-study_room-basic-*` |
| 네트워크 실패 시 오류 안내 (빈 목록 대신) | PASS | 문구「과외지역 목록을 불러오지 못했습니다…」· `354-tutor-offline-*` |
| `GET regions.php?action=list` | PASS | HTTP **200** · `Cache-Control: public, max-age=86400` · ok:true · regions 18 / complexes 10 / tutor_units 161 |
| `GET regions.php?action=tutor_units` | PASS | HTTP **200** · 동일 Cache-Control |
| 계정설정 대표지역 표시·저장 후 유지 | **제한** | 로컬 API·완전 세션 없이 `#/mypage/account`가 이메일확인/기본등록 게이트로 이탈. 코드 경로: `preview/home-ui/src/mypage/account-region-label.js` (표시 전용, 가입·기본등록에서 선택한 지역을 읽음). **앱 수정 안 함** |

### curl 발췌

```text
$ curl -sD - -o NUL "https://study114.net/api/auth/regions.php?action=list"
HTTP/1.1 200 OK
Cache-Control: public, max-age=86400
Content-Type: application/json; charset=utf-8
```

---

## 발견 목록 (수정 안 함)

1. 로컬 `php` / `:8080` 미설치 → 지시서의 「로컬 API + 테스트 계정」전체 저장·새로고침 유지는 목·운영 curl로 대체.
2. `preview/auth-ui/src/main.js` `fetchRegions().catch(() => {})` 는 오류를 삼킴. 과외쌤 폼은 units 빈 배열일 때 `TUTOR_UNIT_LIST_ERROR`로 안내(확인됨). 학생/공부방 희망·홍보 지역 쪽 동일 패턴인지는 별도 티켓 후보.
3. 계정설정 대표지역은 등록 캐시 hydrate 의존 — 로컬 풀스택 없이 E2E 제한.

---

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | verify:tutor-signup-seed PASS | PASS | 콘솔 전체 PASS |
| 2 | 옛 경로만 보는 검사 잔존 여부 | PASS (없음) | grep 전수 |
| 3 | (수정 시) 실패→PASS→FAIL재현→원복 | N/A | 수정 없음 |
| 4 | 가입 3모드 지역 선택·유지 | PASS* | 과외쌤 선택 PASS · 학생/공부방 화면 노출 PASS · *실DB 저장 유지는 로컬 API 부재 |
| 5 | 기본정보 지역 변경·유지 | PASS* | 가입 basic=기본정보 경로에서 과외지역 선택 확인. 계정 카드 E2E는 세션 게이트로 제한 |
| 6 | regions.php 200·캐시 헤더 | PASS | 운영 curl |
| 7 | 네트워크 실패 안내 | PASS | offline 샷 |
| 8 | 앱 코드 변경 0 | PASS | `git diff --stat` 앱 경로 없음 |

---

```
[최종검수 패키지 — 354]
브랜치 / 커밋: work/354-resend-gate-region-check / 267a76de
변경 파일: docs/worklog/2026/11/2026-11-11-354-resend-gate-region-check.md
  docs/worklog/2026/11/shots-354/*
diff 요약: Resend gate 재확인·지역 UI/API 점검 보고·스크린샷만. 앱/스크립트 코드 변경 없음.
테스트: npm run verify:tutor-signup-seed → PASS
  grep 옛경로 오탐 → 없음
  Playwright 지역 UI 390·1920 → PASS(제한 항목 문서화)
스크린샷: docs/worklog/2026/11/shots-354/ (1920·390)
API 확인: GET https://study114.net/api/auth/regions.php?action=list → 200, Cache-Control: public, max-age=86400, ok:true
셀프검수 체크리스트: 위 표 (1–2,4–8 PASS · 3 N/A)
미해결·종현 결정 필요: 로컬 PHP API 환경 없으면 계정설정 지역 E2E·실저장 유지는 후속 수동 확인 권장. 그 외 코드 수정 없음.
```
