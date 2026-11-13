# 359 환불 규정 문구 통일 (1단계 불일치 표 → 보고 게이트 → 2단계 통일) (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/359-refund-copy-unify`
- 선행: 356(뒤 연장 환불 규칙)이 결정되면 그 문구도 반영해야 하므로 2단계는 356 결정 뒤 권장.

## 대상 — 정본 후보 (우동공과3 확인)
- `docs/ssot/18c-memo-ticket-refund-lock.md` (쪽지권 환불, 잠금)
- `docs/ssot/18d-position-refund-lock.md` (프라임·픽 노출 환불, 잠금 2026-10-28)
- `docs/ssot/18-paid-services-rough.md`, `docs/worklog/grok-sync/docs/325-refund-foundation-2026-10-28.md`, `324-cursor-directive-memo-ticket-refund-calc.md`
→ 정본이 여럿이면 **우선순위 표를 만들어 종현 결정 받기** (권장: 금액 규칙은 18c·18d, 고객 문구는 이번에 새로 만드는 단일 문구 파일).

## 대상 — 환불 문구가 보이는 곳 (grep으로 찾은 후보, 전수 재확인)
- 약관·정책: `preview/home-ui/src/policy-copy.js` (+ `policy-screens.js`)
- 결제·상품: `preview/home-ui/src/plans/screens.js`(환불 패널 1789~1856줄 등), `plans/order-blocks.js`, `plans/hub-home.js`, `plans/history-mock.js`
- 마이페이지 구매이력: `preview/home-ui/src/mypage/mypage-copy.js`, `mypage/screens.js`
- 안내·FAQ·고객센터: `preview/home-ui/src/guide/copy.js`, `guide/screens.js`, `support/support-copy.js`
- 우측 레일: `preview/home-ui/src/right-rail.js` — **프로모 부분이면 손대지 않고 표에만 기록**
- 서버 문구: `src/Paid/RefundService.php`(`denyMessage` 등), `src/Paid/ProviderCheckoutService.php`, `public/api/paid/refund.php`
- 메일: `src/Mail/MemberLifecycleMailTemplate.php`, `src/Mail/MemberMailTemplate.php` (구매 감사·마감 안내에 환불 언급 여부)
- 관리자 화면 문구(`src/Admin/AdminCommerceService.php`)는 표에만, 고객 노출 아님.

## 범위 — 1단계(이번 명령)
1. `grep -rn "환불\|취소\|청약철회\|일할" preview/home-ui/src preview/shared src public/api` 전수 → 고객에게 보이는 문구만 추림.
2. 불일치 표: | 위치(파일:줄) | 화면 | 현재 문구 원문 | 정본 규칙(18c/18d 조항) | 일치/불일치/정본에 없음 | 위험도 |
3. 통일안 초안: 쪽지권·노출상품 각각 「짧은 안내 1줄」+「자세한 규정 문단」 두 벌. 정중한 존댓말. 숫자·조건은 18c·18d 그대로.
4. **여기서 멈추고 보고.** 우동공과3 검수·종현 결정 후 2단계 명령을 따로 줌.

## 범위 — 2단계(승인 후)
- 단일 문구 모듈(예: `preview/home-ui/src/refund-policy-copy.js`) 한 곳에서 import하도록 교체, 서버 문구는 같은 문장으로 맞춤. 문구 외 로직 변경 금지.

## 필수
- 1단계는 코드 수정 없음(보고 문서 `docs/worklog/2026/11/2026-11-11-359-refund-copy-audit.md` 1개만 커밋).

## 금지
- 환불 계산·정책(금액 규칙) 변경 금지. 잠금 문서 18c·18d 수정 금지.
- 프로모 잠금 영역 문구 변경 금지.
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
- 표의 각 행을 실제 화면에서 확인한 스크린샷(390·1920, 주요 5곳 이상: 약관, 체크아웃, 구매이력 환불 패널, FAQ, 고객센터).
- grep 명령·건수 원문 첨부(누락 방지).

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | grep 전수(명령·건수) | | |
| 2 | 고객 노출 문구 표 완성 | | |
| 3 | 정본 후보 우선순위 표 | | |
| 4 | 통일안 2벌(쪽지권·노출) | | |
| 5 | 프로모 영역 별도 표기 | | |
| 6 | 1단계 코드 diff 0 | | |
| 7 | 스크린샷 5곳 이상 | | |

## 보고
불일치 n건 요약, 표 문서 경로. ⚠ 종현 결정: 정본 우선순위, 통일 문구 확정.
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
