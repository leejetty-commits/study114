# 356 `has_live_later_extension` 버그 조사 (조사 먼저 · 보고 게이트) (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/356-refund-later-extension`
- 환불은 돈과 잠금 문서(`docs/ssot/18d-position-refund-lock.md`, 2026-10-28 종현 잠금)에 걸린 일 → **1단계 조사·보고 후 멈춤. 2단계 수정은 종현 승인 후.**

## 우동공과3가 코드에서 확인한 증상(추정)
- `src/Paid/PositionRefundCalculator.php:30` docblock에 입력 `has_live_later_extension?: bool`가 선언돼 있으나 **`calculate()` 어디에서도 읽지 않음**.
- `src/Paid/RefundService.php:563~589` `buildPositionCalcInput()`도 이 키를 **넣지 않음**. 저장소 전체에서 이 이름은 그 한 줄뿐.
- 즉 「같은 노출 자리에 뒤이어 붙은 연장(extend) 주문이 살아 있을 때」를 판단하는 장치가 선언만 있고 동작하지 않음.
- 가능한 결과: 앞 주문(new 또는 앞 extend)을 일할 환불하면 그 구간이 일찍 끝나는데, 뒤 extend 주문의 `seg_start`(= 앞 주문의 원래 종료일)는 그대로라 **빈 구간·이중 권리·잘못된 환불액**이 생길 수 있음. 18d 문서는 extend의 경우 「이전 구간은 대상 아님」만 정하고, 「뒤에 연장이 있는 앞 주문 환불」 규칙은 없음.

## 대상
- `src/Paid/PositionRefundCalculator.php` (전체), `src/Paid/RefundService.php` 340~430줄(eligibility·apply·addon 계산), 563~620줄(calc 입력·`reconstructExtendSegStart`)
- `src/Paid/ProviderCheckoutService.php` (extend 주문 생성 시 snapshot 기록)
- 검증: `scripts/verify-position-refund.php`, `scripts/verify-refund-apply.mjs`
- 문서: `docs/ssot/18d-position-refund-lock.md` 48~56줄, `docs/worklog/grok-sync/327-position-refund-notes.md`, `git log -S has_live_later_extension` 로 도입 커밋·의도 추적

## 범위 — 1단계(이번 지시)
1. 도입 커밋과 당시 문서에서 이 키의 의도 확인 (`git log -S`, 327 worklog).
2. 로컬 DB에서 재현 시나리오 실행: 프라임 신규 30일 결제 → 종료 전 연장 30일 결제 → (a) 신규 구간 중 신규 주문 환불 요청 (b) 연장 주문 환불 요청 (c) 둘 다. 각각 eligibility 응답·환불액·환불 후 노출 기간(`end_exclusive_on`)·뒤 주문 상태를 표로.
3. 현재 동작이 18d 문서·Notion 34·34-1(문서에 인용된 범위)과 어긋나는 점 정리.
4. 수정안 2~3개 제시 (예: A 뒤에 살아 있는 연장이 있으면 앞 주문 환불 차단하고 「연장 주문부터 환불」 안내 / B 앞·뒤를 묶어 함께 환불 / C 앞 환불 시 뒤 구간을 당겨 재계산). 각 안의 사용자 문구·영향 파일·위험.
5. 운영 데이터에 해당 사례가 있을 수 있는지 확인용 **SELECT 쿼리 초안만** 작성 (실행 금지, 종현 승인 후 실행).

## 범위 — 2단계(승인 후 별도 명령)
- 종현이 고른 안을 구현, `verify-position-refund.php`에 케이스 추가, 18d 문서 갱신(종현 승인 문구 포함).

## 필수
- 1단계는 코드 수정·커밋 금지 (조사 메모는 `docs/worklog/2026/11/2026-11-11-356-refund-later-extension.md`에만, 커밋은 문서 1개만 허용).
- 재현은 로컬 DB·샌드박스만.

## 금지
- 실제 환불·PG 취소 호출 금지 (샌드박스 포함, 계산·eligibility 조회까지만).
- 18d 잠금 문서 수정 금지(1단계).
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
- 시나리오별 API 응답(curl, HTTP 상태와 JSON 요지) 첨부, `php scripts/verify-position-refund.php` 현재 PASS 수.

### 셀프검수 체크리스트
| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 키 도입 의도 확인(커밋·문서) | | |
| 2 | 시나리오 a·b·c 결과 표 | | curl |
| 3 | 18d와 불일치 목록 | | |
| 4 | 수정안 2~3개, 영향 파일 | | |
| 5 | 운영 확인용 SELECT 초안(미실행) | | |
| 6 | 코드 diff 0, PG 호출 0 | | |

## 보고
증상 확정 여부 한 줄, 시나리오 표, 수정안 표. ⚠ 종현 결정: 수정안 선택, 운영 SELECT 실행 승인.
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
