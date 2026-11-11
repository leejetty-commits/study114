# 358 Gmail 별칭(+태그·점) 가입 차단 + 테스트 계정 env 예외 (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/358-gmail-alias-block`
- 선행: 357과 같은 env `STUDY114_TEST_ACCOUNT_EMAILS`·같은 읽기 함수 사용(먼저 하는 쪽이 만들고 다른 쪽이 재사용).

## 대상
- `src/Auth/EmailNormalizer.php` (현재 `strtolower(trim())`만)
- 중복 검사: `src/Auth/SignupService.php` 31줄(정규화)·133~146줄 `ensureEmailAvailable()`
- OAuth 후 이메일 입력: `src/Auth/AccountContactService.php` 63줄 이후, `src/Auth/OAuthService.php` 408줄 근처 `SELECT id, status FROM users WHERE email = ?`
- 관리자 로그: `src/Admin/AdminOperationLogRepository.php`, 조회 `public/api/admin/operation-logs.php`
- config: `config/auth.php`

## 범위
1. `EmailNormalizer::canonical(string $email): string` 추가 (기존 `normalize()`는 그대로 — 저장값은 사용자가 입력한 그대로 소문자).
   - 도메인 `gmail.com`·`googlemail.com`: 로컬부에서 `+` 뒤 제거, `.` 전부 제거, 도메인은 `gmail.com`으로 통일.
   - 그 외 도메인: 소문자·trim만 (네이버·다음 등 + 별칭 처리 여부는 ⚠ 종현 확인 필요, 권장: 이번엔 Gmail만).
2. 일반 가입·OAuth 이메일 입력에서 canonical 기준 중복 검사:
   - 운영 DB 스키마 변경 없이(권장) SQL로 비교: Gmail 계열만 `SUBSTRING_INDEX(email,'@',-1) IN ('gmail.com','googlemail.com') AND REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(email,'@',1),'+',1),'.','') = ?` + `status <> 'withdrawn'`. MySQL/MariaDB 운영 버전에서 동작 확인.
   - 컬럼(`users.email_canonical`)+인덱스 방식은 `sql/schema/085_*.sql` 초안만, 적용 금지. ⚠ 종현 확인 필요(권장: 지금은 SQL 비교, 회원 수만 명대에서 재검토).
   - 거절 문구: 「이미 가입된 이메일과 같은 Gmail 주소예요. Gmail은 점(.)이나 +뒤 글자가 달라도 같은 메일함으로 들어가서 하나의 계정만 만들 수 있어요. 기존 계정으로 로그인해 주세요.」
3. 테스트 계정 예외: 입력 이메일(소문자 정확 일치)이 env `STUDY114_TEST_ACCOUNT_EMAILS` 목록에 있으면 canonical 중복 검사를 건너뛴다(정확 일치 중복 검사는 그대로).
   - 예외로 가입되면 `AdminOperationLogRepository`에 1줄 기록: 동작 `signup_alias_allowlisted`, 대상 user id, 마스킹 이메일(`EmailMasker`). 이메일 원문·비밀번호 기록 금지.
4. 로그인·비밀번호 재설정은 이번 범위 밖(현행 정확 일치 유지).

## 필수
- `scripts/verify-gmail-alias-block.php`: a.b@gmail.com 있음 → ab@gmail.com·a.b+x@gmail.com·AB@googlemail.com 거절 / 다른 도메인 a.b@naver.com ↔ ab@naver.com 허용 / 탈퇴 계정 canonical 같으면 허용(기존 탈퇴 재가입 흐름 `releaseLoginIdentifiers` 유지) / env 허용목록 정확 일치 → 허용+로그 1줄 / env 빔 → 예외 없음.
- 기존 가입·OAuth verify 전부 PASS.

## 금지
- 허용목록 이메일 하드코딩 금지 (코드·테스트·문서는 `test1@example.com` 류만).
- 기존 회원 데이터 일괄 변경·병합 금지. 이미 존재하는 별칭 중복 계정은 **조회 SQL 초안만** 보고(실행 금지).
- 운영 env 값 직접 입력 금지.
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
- 로컬 curl `POST /api/auth/signup.php`로 위 케이스 실행, HTTP 상태·`code`·문구 기록(비밀번호 `***`).
- 가입 화면 390·1920에서 거절 문구 스크린샷.
- `operation-logs.php`로 예외 로그 1줄 확인(관리자 세션, 세션값 비공개).

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | canonical 규칙 Gmail만 | | 테스트 출력 |
| 2 | 가입·OAuth 두 경로 모두 적용 | | 파일:줄 |
| 3 | 거절 문구 원문 일치 | | curl·스크린샷 |
| 4 | 허용목록 정확 일치 예외 + 로그 | | |
| 5 | 하드코딩 0 | | grep |
| 6 | 스키마 변경 0 (085는 초안만) | | |
| 7 | 기존 verify 전부 PASS | | |
| 8 | 레이아웃 변화 0 | | |

## 보고
변경 파일, 운영 적용 env(`STUDY114_TEST_ACCOUNT_EMAILS`), 기존 별칭 중복 조회 SQL 초안. ⚠ 종현 결정: 다른 도메인 + 처리, SQL 비교 vs 컬럼 방식, 허용목록에 넣을 실제 이메일.
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
