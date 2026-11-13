# 355 결제 페이지가 좁게 보이는 레이아웃 수정 (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/355-checkout-width`
- 선행: 없음. 339(PR #164, 포트원 샌드박스)와 파일이 겹칠 수 있음 → 시작 전에 #164 변경 파일과 겹치는지 보고.
- 이 지시서는 **결제(체크아웃) 화면이 대상**이므로 그 화면에 한해 데스크톱 변경 허용. 다른 화면은 0px.

## 대상 (home-ui, 로컬 5174 `#/plans/checkout`)
- 라우트: `preview/home-ui/src/plans/router.js:22` (`'/plans/checkout': 'P18-06'`)
- 껍데기: `preview/home-ui/src/plans/shell.js` 44~61줄 — `.plans-hub-shell` / `.plans-hub-page` / `.plans-sf-page__main` / 좌우 거터·레일 그리드, 허브가 아니면 `data-plans-shell-fit`
- 체크아웃 본문: `preview/home-ui/src/plans/screens.js` (checkout quote 167~210줄 주변) · `order-blocks.js` · `checkout-session.js`
- 스타일: `preview/home-ui/src/styles/plans-theme.css` 535~536줄(`--plans-sf-page-pad-*`), 671~676줄(`.plans-sf-page`), 1085줄(미디어쿼리), 1370~1381줄·1897줄(`.home-app--plans-hub .plans-hub-page.plans-sf-page`), 1775줄(모바일 그리드) · `plans-store.css`

## 범위
1. **원인 먼저 실측(보고 게이트 없음, 보고서에 포함)**: 1920·1440·1280·390 폭에서 체크아웃 본문 컨테이너 실제 폭(px), 각 조상 요소의 width/max-width/grid-template-columns/padding을 DevTools로 기록해 어느 규칙이 폭을 줄이는지 특정. 상품 목록(`#/plans/positions`) 화면과 비교.
2. 원인 규칙만 최소 수정해 체크아웃 본문이 같은 셸의 다른 상품 화면(positions/access)과 같은 본문 폭을 쓰게 한다. 선택자는 체크아웃 화면에 한정(예: 체크아웃 전용 클래스 추가).
3. 결제 버튼·금액 요약·약관 동의 영역이 390에서 가로 스크롤 없이 한 화면 폭에 맞는지.

## 필수
- 수정 전/후 실측 표(폭별 컨테이너 px).
- `npm run verify:shop-page`, `verify:paid-pr-a`, `verify:paid-pr-b` 등 결제 관련 verify 전부 PASS.

## 금지
- 금액 계산·결제 요청 로직·포트원 연동 코드 변경 금지.
- 다른 plans 화면(허브·positions·access·my·history)의 폭 변화 금지 → 전/후 스크린샷으로 증명.
- 우측 레일의 프로모 부분 변경 금지.
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
- 체크아웃 화면 1920·1280·390 전/후 스크린샷, 다른 plans 화면 1920·390 후 스크린샷(변화 없음).
- 가로 스크롤 여부: `document.documentElement.scrollWidth <= innerWidth` 콘솔 결과.

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 원인 규칙 특정(파일:줄) | | 실측 표 |
| 2 | 체크아웃 본문 폭 = positions 본문 폭 | | 실측 |
| 3 | 390 가로 스크롤 없음 | | 콘솔 |
| 4 | 다른 plans 화면 변화 0 | | 스크린샷 |
| 5 | 결제 로직 diff 0 | | git diff |
| 6 | 결제 verify 전부 PASS | | 출력 |
| 7 | #164와 겹침 여부 보고 | | |
| 8 | 공통 금지 위반 없음 | | |

## 보고
원인 한 줄, 실측 전/후 표, 스크린샷 경로, 체크리스트.
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
