# 361 코드 무결성·보안 전수 점검 (보고만 · 수정 없음) (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · **최종검수: 우동공과3 직접** (이 지시서는 우동공과3가 결과를 직접 재현 검증함)
- 브랜치: `work/361-security-audit` (보고 문서만 커밋)
- 이전 기록(중복 점검 피하고 회귀만 확인): `docs/worklog/grok-sync/docs/328-youtube-pre-security-2026-11-08.md`, `329-external-ai-security-remediation-2026-11-08.md`, `331-82f-external-retest-full-record-2026-11-09.md`, 인수인계의 「후속 B 테스트 계정·IDOR」

## 대상
- `public/api/**` PHP 엔드포인트 전부(현재 90개, 그중 admin 19개). 특히 `public/api/auth/password/_mail-probe.php`(밑줄 시작 파일) 운영 노출 여부.
- `src/**` 권한 검사(세션·역할·소유자 확인), `src/Core`·`src/bootstrap.php`
- YouTube 임베드: `preview/home-ui/src/right-rail.js`(프로모 부분은 읽기만), 과외쌤 영상(337), `preview/home-ui/src/promo-video-config.js`(읽기만)
- CSP: **main 저장소에서 `Content-Security-Policy` 정의를 찾지 못함**(우동공과3 grep). 339 PR #164 브랜치, 배포 워크플로(`.github/workflows/`), 호스팅 설정 중 어디서 오는지 찾고 운영 응답 헤더 실측(`curl -sI https://study114.net/`).
- 업로드: `public/uploads`, 사진·첨부 업로드 엔드포인트(`study-room/promo-image.php`, `tutor/profile-image.php`, 쪽지 첨부)

## 범위
1. **엔드포인트 인증 표**: 90개 전부 | 경로 | 메서드 | 인증 필요? | 역할 제한 | 소유자 확인 | CSRF/Origin 검사 | 비로그인 curl 결과(HTTP) | 판정 |. 공개가 맞는 것(regions, public settings, 공개 목록)은 「공개 의도」 표시.
2. **관리자 엔드포인트**: 19개 각각 비로그인 → 401, 일반 회원 세션 → 403, 운영자/최고관리자 권한 차이 확인. 기대와 다르면 발견.
3. **IDOR (로컬 DB, 테스트 계정 공부방 A·B 2개 + 학생 1개)**:
   - 공부방 A 세션으로 B의 카드 수정·사진 업로드·삭제, B의 구매이력·환불 요청, B의 쪽지 읽기·삭제, B의 리뷰 답글 수정 시도 → 모두 403/404여야 함.
   - 학생 세션으로 공부방 A의 리뷰 관리, 다른 학생의 쪽지·찜·카드 접근 시도.
   - id를 하나씩 바꾸는 요청을 표로(요청 요지, 기대, 실제 HTTP, 응답 요지).
4. **YouTube·CSP**: 임베드가 `youtube-nocookie.com` 사용 여부, iframe `sandbox`/`allow`/`referrerpolicy`, 영상 ID 입력 검증(337 정규식), CSP `frame-src`·`script-src`·`'unsafe-inline'` 현황(후순위로 남긴 항목 확인).
5. **무결성**: `git ls-files`에 비밀값·키 파일 흔적(`.env`, `*.pem`, 토큰 문자열 패턴) — 값은 보고에 쓰지 말고 파일·줄·종류만. `public/` 아래 테스트·디버그 파일(`_*.php`, `phpinfo`, `.bak`) 목록. composer/npm 의존성 `npm audit --omit=dev` 요약.
6. **기타**: 로그인 레이트리밋(`LoginRateLimiter`), 비밀번호 재설정 토큰(350 확인 내용 회귀), 세션 쿠키 속성(Secure·HttpOnly·SameSite) 운영 헤더 실측, 파일 업로드 MIME·확장자 검사.

## 필수
- 발견 표: | ID | 분류 | 위치(파일:줄 또는 URL) | 재현 절차 | 기대 | 실제 | 심각도(치명/높음/중간/낮음/정보) | 권장 조치 |
- 운영(study114.net)은 **읽기 요청만**(GET/HEAD, 비로그인 또는 종현이 제공한 테스트 계정의 조회). 운영에서 쓰기·삭제·결제·쪽지 발송 시도 금지 — IDOR 쓰기 시도는 로컬 전용.

## 금지
- 이번 지시에서 코드 수정 금지(치명 발견 시에도 즉시 멈추고 보고만).
- 자동 스캐너로 운영에 대량 요청 금지(초당 2건 이하).
- 비밀값·세션·쿠키 원문 보고 금지.
- 개인정보 암호화 작업 금지(공통).
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
- 표의 모든 판정에 curl 원문(민감값 가림) 또는 파일:줄 근거.
- 치명·높음은 재현 절차를 우동공과3가 그대로 따라 할 수 있게 단계별로.

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 엔드포인트 90개 표 누락 0 | | find 개수 대조 |
| 2 | admin 19개 401/403 확인 | | curl |
| 3 | IDOR 시나리오(A·B·학생) 전부 | | curl 표 |
| 4 | YouTube·CSP 실측 | | curl -I |
| 5 | 비밀값 흔적 점검(값 미기재) | | |
| 6 | 디버그 파일 목록 | | |
| 7 | npm audit 요약 | | |
| 8 | 운영 쓰기 요청 0 | | |
| 9 | 코드 diff 0 | | |

## 보고
심각도별 건수, 치명·높음 목록과 재현 절차. 수정은 우동공과3가 우선순위를 정해 별도 지시.
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
