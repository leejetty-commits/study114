# 354 CI 「PHP 8.2 Resend gate」 오탐 재확인 + 가입·기본정보 지역 선택 점검 (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/354-resend-gate-region-check` (수정이 필요할 때만 커밋)

## 사전 사실 (우동공과3 확인)
- 오탐 수정은 **344에서 이미 완료·머지**됨: PR #156, 머지 `1e1e9958`, 기록 `docs/worklog/2026/11/2026-11-10-344-ci-resend-gate.md`.
- 현재 `scripts/verify-tutor-signup-seed.mjs` 24~34줄이 `preview/auth-ui/src/auth-api.js`와 `preview/shared/regions-catalog.js` 둘 다 검사.
- 워크플로: `.github/workflows/cur-006-resend.yml` job `php82-mail-gate` → 단계 「Tutor signup seed regions」 = `npm run verify:tutor-signup-seed`.
- #165 CI에서도 「PHP 8.2 Resend gate」 pass.
→ 따라서 이번 지시는 **재확인 + 남은 오탐 지점 탐색 + 지역 선택 동작 점검**이다. 수정은 실제로 실패가 재현될 때만.

## 대상
- `.github/workflows/cur-006-resend.yml`, `scripts/verify-tutor-signup-seed.mjs`
- 같은 gate가 실행하는 다른 스크립트 중 343 이전 경로(`auth-api.js`의 `fetchRegions`)를 문자열로 찾는 곳: `grep -rn "auth-api.js\|tutorUnits\|fetchRegions" scripts .github`
- 지역 선택 UI: `preview/shared/regions-catalog.js`, `preview/auth-ui/src/auth-api.js`, 가입 화면 `preview/auth-ui/src/` 지역 선택 컴포넌트, 기본정보(마이페이지 계정) 화면의 지역 선택 (`preview/home-ui/src/mypage/` 내 해당 파일 — 찾아서 경로 보고)
- API: `public/api/auth/regions.php`

## 범위
1. main 최신에서 `npm run verify:tutor-signup-seed` 실행, 결과 기록.
2. 위 grep으로 `regions-catalog.js` 이동 후에도 옛 경로만 보는 검사가 남아 있는지 전수 확인. 남아 있으면 344와 같은 방식(구·신 형태 모두 인정, 검사 약화 금지)으로 그 스크립트만 수정.
3. 지역 선택 동작 점검 (로컬 5174 + 로컬 API, 테스트 계정):
   - 가입: 공부방·과외쌤·학생 각각 시/도 → 시/군/구 → (과외쌤) 수업 단위 선택, 저장 후 값 유지.
   - 기본정보: 지역 변경 → 저장 → 새로고침 후 유지.
   - `GET /api/auth/regions.php` HTTP 200, 캐시 헤더(343 성공 GET만 Cache-Control) 확인.
   - 네트워크 실패(오프라인 토글) 시 빈 목록 대신 오류 안내가 나오는지.

## 필수
- 실패 재현 시: 수정 전 실패 출력 → 수정 후 PASS 출력 → 매핑 일부러 지워 FAIL 확인 후 원복(344 방식).

## 금지
- CI 검사 삭제·skip·`continue-on-error` 금지.
- 앱 코드(`preview/`·`public/`) 수정 금지 — 지역 선택 버그는 발견 목록에만.
## 공통 금지 (모든 지시서 공통 · 생략 불가)
- force push, `reset --hard`, `stash drop` 금지.
- 운영 `.env`·운영 DB 쓰기는 종현 승인 없이 금지 (SELECT 조회도 운영은 승인 후).
- 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음 (테스트 계정 비밀번호 포함).
- 데스크톱 레이아웃은 1px도 바뀌면 안 됨 (데스크톱이 대상인 지시서만 예외, 그때도 대상 화면 외 0px).
- 기본 카드는 가로형 유지.
- 프로모 잠금 손대지 않음: 배너 로고, 팝업 헤더 로고, `preview/home-ui/src/promo-video-config.js`, `preview/home-ui/src/right-rail.js`·`preview/home-ui/src/styles/home-right-rail.css`의 프로모 부분.
- 개인정보 암호화 작업 금지.
- 커밋까지만. push·PR·머지는 우동공과3 최종검수 후 종현 승인으로.
- 브랜치는 `D:\work\study114` 안에서 `work/<번호>-<slug>`로 생성 (main 최신 pull 후).
- 범위 밖에서 발견한 버그는 고치지 말고 보고서 「발견 목록」에만 적음.

## 확인 (셀프검수 방법)
- 가입 3모드·기본정보 화면 390·1920 스크린샷 (선택 전/후), curl `-I` 결과.

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | verify:tutor-signup-seed PASS | | 출력 |
| 2 | 옛 경로만 보는 검사 잔존 여부(grep) | | |
| 3 | (수정 시) 실패→PASS→FAIL재현→원복 | | |
| 4 | 가입 3모드 지역 선택·유지 | | 스크린샷 |
| 5 | 기본정보 지역 변경·유지 | | |
| 6 | regions.php 200·캐시 헤더 | | curl |
| 7 | 네트워크 실패 안내 | | |
| 8 | 앱 코드 변경 0 | | git diff --stat |

## 보고
게이트 상태 한 줄, 지역 선택 점검표, 발견 버그 목록.
## 최종검수 패키지 (우동공과3에게 넘길 것)
보고 맨 끝에 아래 형식 그대로 붙인다.
```
[최종검수 패키지 — <번호>]
브랜치 / 커밋: work/<번호>-<slug> / <hash>
변경 파일: (경로 목록, 파일별 +/- 줄 수: git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄, 무엇을 왜)
테스트: (명령 → PASS n / FAIL n, 기존 회귀 포함)
스크린샷: (경로 목록, 폭 표기 1920·390 등)
API 확인: (curl 요청 → HTTP 상태, 응답 요지)
셀프검수 체크리스트: (아래 표 채운 것)
미해결·종현 결정 필요: (없으면 「없음」)
```
