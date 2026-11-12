# 359 환불 규정 문구 통일 — 1단계 (2026-11-13 실행 정본)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/359-refund-copy-unify`
- 워크트리: `D:\work\study114\.wt\work-359-refund-copy-unify` 만 (최신 main에서 분기)
- 이 파일이 실행 정본이다. 이전 지시서 `docs/worklog/grok-sync/docs/359-refund-copy-unify-2026-11-11.md`는 참고만 한다.

## 배경

356 안 A는 2026-11-13 종현이 확정했고, [PR #190](https://github.com/leejetty-commits/study114/pull/190)으로 운영에 반영되어 있다. 금액·조건 규칙은 이미 잠겨 있다. 이번 작업은 고객에게 보이는 안내 문장이 그 규칙과 같은지를 전수하고, 통일안 초안을 만든 뒤 멈추는 것이다.

## 이번 명령 — 1단계만

**제품 코드(화면·서버 문구 교체)는 수정하지 않는다.** 전수 조사, 불일치 표, 통일안 초안, 보고만 한다. 우동공과3 검수와 종현 확정 뒤에 2단계 명령을 따로 준다.

보고 문서: `docs/worklog/2026/11/2026-11-13-359-refund-copy-audit.md` (캡처는 같은 날짜 폴더)

## 정본 (읽기만, 수정 금지)

- 쪽지권 금액·조건: `docs/ssot/18c-memo-ticket-refund-lock.md`
- 노출상품(프라임·픽) 금액·조건: `docs/ssot/18d-position-refund-lock.md` (2026-11-13 안 A 포함)

이미 종현이 확정한 고객 안내(초안에 **그대로** 넣고, 고쳐 제안하지 말 것):

> 뒤에 이어진 연장 결제가 있어 이 건은 환불할 수 없습니다. 연장 건을 먼저 환불해 주세요.

- reason_code: `has_live_later_extension`
- 적용: 환불 자격 확인과 신청 모두
- 연장 주문 자체: 뒤에 또 다른 살아 있는 연장이 없으면 기존 규칙대로 환불 가능(연장부터 환불)

권장안(1단계에서 표로만 제안, 결정은 종현): 금액 규칙은 18c·18d, 고객 문구는 이번에 초안 내는 단일 모듈 파일. 1단계에서는 그 파일을 만들지 않는다.

## 전수 대상 (grep으로 다시 확인)

- 약관·정책: `preview/home-ui/src/policy-copy.js` (+ `policy-screens.js`)
- 결제·상품: `preview/home-ui/src/plans/screens.js`, `plans/order-blocks.js`, `plans/hub-home.js`, `plans/history-mock.js`
- 마이페이지 구매이력: `preview/home-ui/src/mypage/mypage-copy.js`, `mypage/screens.js`
- 안내·FAQ·고객센터: `preview/home-ui/src/guide/copy.js`, `guide/screens.js`, `support/support-copy.js`
- 우측 레일: `preview/home-ui/src/right-rail.js` — 프로모 부분이면 손대지 않고 표에만 기록
- 서버 문구: `src/Paid/RefundService.php`(`denyMessage` 등), `src/Paid/ProviderCheckoutService.php`, `public/api/paid/refund.php`
- 메일: `src/Mail/MemberLifecycleMailTemplate.php`, `src/Mail/MemberMailTemplate.php` (구매 감사·마감 안내에 환불 언급 여부)
- 관리자 화면 문구(`src/Admin/AdminCommerceService.php`)는 표에만 넣고, 이번 통일 대상이 아님(고객 노출 아님)

## 1단계에서 할 일

1. `grep -rn "환불\|취소\|청약철회\|일할" preview/home-ui/src preview/shared src public/api` 전수 후, 고객에게 보이는 문구만 추린다.
2. 불일치 표: | 위치(파일:줄) | 화면 | 현재 문구 원문 | 정본 규칙(18c/18d 조항) | 일치/불일치/정본에 없음 | 위험도 |
3. 통일안 초안: 쪽지권·노출상품 각각 「짧은 안내 1줄」+「자세한 규정 문단」 두 벌. 정중한 존댓말. 숫자·조건은 18c·18d 그대로. 356 확정 문구는 노출 쪽에 그대로 넣는다.
4. 정본 우선순위 표(권안 포함).
5. **여기서 멈추고 보고한다.**

## 2단계 (이번 명령에서 하지 말 것)

승인 후 별도 명령으로, 단일 문구 모듈(예: `preview/home-ui/src/refund-policy-copy.js`) 한 곳에서 import하고 서버 문구를 같은 문장으로 맞춘다. 문구 외 로직 변경은 그때도 금지.

## 필수

- 1단계는 제품 코드 diff 0. 커밋은 보고 문서·캡처·필요한 검증/캡처 스크립트만.
- 글자 수·유사도 같은 기계 지표를 합격 기준으로 쓰지 말 것.

## 금지

- 환불 계산·정책(금액 규칙) 변경 금지. 잠금 문서 18c·18d 수정 금지.
- 프로모 잠금 영역 문구 변경 금지.
- 로컬 `D:\work\study114` 와 `D:\work\study114\.wt\work-368-photo-autofit` 은 더티이니 건드리지 말 것. 작업은 `D:\work\study114\.wt\` 아래 새 워크트리에서만.

## 공통 금지 (모든 지시서 공통 · 생략 불가)

- force push, `reset --hard`, `stash drop` 금지.
- 운영 `.env`·운영 DB 쓰기는 종현 승인 없이 금지 (SELECT 조회도 운영은 승인 후).
- 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음 (테스트 계정 비밀번호 포함).
- 데스크톱 레이아웃은 1px도 바뀌면 안 됨 (데스크톱이 대상인 지시서만 예외, 그때도 대상 화면 외 0px).
- 기본 카드는 가로형 유지.
- 프로모 잠금 손대지 않음: 배너 로고, 팝업 헤더 로고, `preview/home-ui/src/promo-video-config.js`, `preview/home-ui/src/right-rail.js`·`preview/home-ui/src/styles/home-right-rail.css`의 프로모 부분.
- 개인정보 암호화 작업 금지.
- 커밋·push·PR까지. 머지는 우동공과3 최종검수 후 종현 승인으로.
- 브랜치는 `D:\work\study114\.wt\` 안에서 `work/359-refund-copy-unify`로 생성 (main 최신 pull 후).
- 범위 밖에서 발견한 버그는 고치지 말고 보고서 「발견 목록」에만 적음.

## 확인 (셀프검수)

- 표의 각 행을 실제 화면에서 확인한 스크린샷(390·1280, 주요 5곳 이상: 약관, 체크아웃, 구매이력 환불 패널, FAQ, 고객센터).
- 테스트 계정만 쓰고 실제 이름을 넣지 말 것. 금액이 보이면 사이트에 적힌 실제 카탈로그 가격을 쓴다.
- grep 명령과 건수 원문을 보고에 첨부(누락 방지).

### 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | grep 전수(명령·건수) | | |
| 2 | 고객 노출 문구 표 완성 | | |
| 3 | 정본 후보 우선순위 표 | | |
| 4 | 통일안 2벌(쪽지권·노출), 356 확정 문구 그대로 | | |
| 5 | 프로모 영역 별도 표기 | | |
| 6 | 1단계 제품 코드 diff 0 | | |
| 7 | 스크린샷 5곳 이상(테스트 계정·실명 없음) | | |

## 보고

불일치 n건 요약, 표 문서 경로. ⚠ 종현 결정: 정본 우선순위, 통일 문구 확정.

## 최종검수 패키지 (우동공과3에게 넘길 것)

보고 맨 끝에 아래 형식 그대로 붙인다.

```
[최종검수 패키지 — 359]
브랜치 / 커밋: work/359-refund-copy-unify / <hash>
PR: (있으면 URL, 머지 안 함)
변경 파일: (경로 목록, 파일별 +/- 줄 수: git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄, 무엇을 왜)
테스트: (명령 → PASS n / FAIL n, 기존 회귀 포함. 글자 수·유사도는 쓰지 말 것)
스크린샷: (경로 목록, 폭 표기 1280·390 등)
셀프검수 체크리스트: (아래 표 채운 것)
미해결·종현 결정 필요: (정본 우선순위·통일 문구 초안)
```
