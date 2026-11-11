# 357 테스트 카드 숨김 (일반 회원·비회원 목록·검색에서 서버 한 곳에서 거름) (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/357-test-card-hide`
- 선행: **358과 같은 테스트 계정 허용목록 env를 공유** → 358보다 먼저 하든 나중에 하든 env 이름·읽는 함수는 하나로.

## 대상
- 기존 공개 노출 조건 헬퍼: `src/Visibility/WithdrawnOwnerSql.php` (탈퇴 주인 카드 제외 — 같은 방식으로 확장)
- 그 헬퍼를 쓰는 공개 목록·검색: `src/Search/SearchService.php`, `src/StudyRoom/StudyRoomPublicReadService.php`, `src/Promo/PromoChannelPublicRead.php`, `src/Neighborhood/NeighborhoodGreetingService.php`, `src/Board/BoardPostRepository.php`(게시글은 대상인지 판단해 보고)
- 공개 API: `public/api/search/search.php`, `public/api/search/region-stats.php`, `public/api/study-room/public.php`, 홈 목록(`preview/home-ui/src/home-basic-live.js`가 부르는 API — 찾아서 경로 보고)
- 관리자 쪽 `src/Admin/AdminExposureRepository.php`, `TutorDetailRecomputeService.php`는 **건드리지 않음**(관리자는 다 보여야 함).

## 범위
0. **먼저 확인**: 지금 「테스트」 카드가 어떻게 표시되는지(카드 이름에 「테스트」 문자열? 별도 컬럼? 관리자 표시?) 코드·로컬 DB로 확인해 보고서 첫 줄에 적는다. 저장소 main에는 `is_test` 같은 컬럼이 없음(우동공과3 grep).
1. 판정 기준 (권장): **카드 주인 계정이 테스트 계정 허용목록에 있으면 테스트 카드**. 허용목록은 운영 env `STUDY114_TEST_ACCOUNT_EMAILS`(쉼표 구분 정확한 이메일, 소문자 비교). 읽기는 `config/auth.php`(또는 기존 config 파일)에 키 1개 + `src/Auth/TestAccountAllowlist.php` 같은 함수 1곳. 이름 문자열 「테스트」 매칭은 쓰지 않음(일반 회원 이름 오탐 위험).
   - 판정 기준을 이름 기반으로 할지, DB 컬럼(예: `users.is_test`, `sql/schema/085_*.sql`)으로 할지는 ⚠ 종현 확인 필요. 권장: env 허용목록(운영 DB 변경 없음).
2. 서버 한 곳: `src/Visibility/TestOwnerSql.php`(또는 `WithdrawnOwnerSql`과 나란히 `PublicOwnerVisibility`) — 「보는 사람이 테스트 계정이 아니면 테스트 주인 카드 제외」 SQL 조각을 만들고, 위 공개 목록·검색 쿼리에서 `WithdrawnOwnerSql` 바로 옆에 붙인다. 이메일→user id 해석은 요청당 1회.
3. 보는 사람이 테스트 계정으로 로그인했으면 거르지 않음(전부 보임).
4. **그대로 둘 것**: 카운터(지역 통계 숫자 포함 여부는 아래), 쪽지 송수신, 추천·매칭 계산, 관리자 화면, 카드 상세 직접 URL 접근 정책(현행 유지, 보고만).
   - `region-stats.php` 숫자에서 테스트 카드를 뺄지 ⚠ 종현 확인 필요 — 지시는 「카운터 그대로」이므로 **기본은 빼지 않음**.

## 필수
- 검증 스크립트 `scripts/verify-test-card-hide.php`: 비회원·일반 회원 → 목록·검색에 테스트 카드 없음 / 테스트 계정 로그인 → 보임 / 관리자 목록 → 보임 / env 비어 있으면 아무것도 안 거름.
- 기존 검색·목록 verify 전부 PASS.

## 금지
- 프론트에서 거르기 금지(서버 한 곳만).
- 테스트 계정 이메일을 코드·문서·커밋에 하드코딩 금지 (예시는 `test1@example.com` 형식만).
- 운영 `.htaccess`/env에 실제 값 넣기 금지 → 보고에 「종현이 넣을 env」로만.
- 카운터·쪽지·추천 계산 로직 변경 금지.
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
- 로컬에서 테스트 계정 1개를 env에 넣고: curl로 비회원 `GET /api/search/search.php?...` 결과에 그 카드 id 없음, 테스트 계정 세션 쿠키로 같은 요청 → 있음 (HTTP 200, 개수 비교). 세션값은 보고에 쓰지 않음.
- 홈·찾기 화면 390·1920 비회원/테스트 계정 스크린샷.

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 현재 테스트 표시 방식 확인 | | |
| 2 | 판정 함수·SQL 조각 각 1곳 | | 파일:줄 |
| 3 | 적용한 공개 쿼리 목록 | | |
| 4 | 비회원·일반 회원 숨김 | | curl |
| 5 | 테스트 계정 보임 | | curl |
| 6 | 관리자 보임, 카운터·쪽지·추천 diff 0 | | |
| 7 | env 비면 무동작 | | |
| 8 | 하드코딩 이메일 0 | | grep |
| 9 | 레이아웃 변화 0 (1920·390) | | 스크린샷 |

## 보고
변경 파일, 적용 쿼리 목록, 운영 적용 시 env(`STUDY114_TEST_ACCOUNT_EMAILS`, 값은 종현이 입력). ⚠ 종현 결정: 판정 기준, 지역 통계 포함 여부.
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
