# 18c 이니시스 V2 결제창 구매자 이메일

- 기준: `origin/main` `bbe1ee4a` (PR #285)
- 2026-11-20. 이니시스 V2 일반결제는 결제창 호출 때 구매자 이메일이 필요하다.

## 지시

`PortOne.requestPayment`에 로그인 회원 `customer.email`만 전달한다. 이메일이 없으면 「계정설정에서 이메일을 확인해 주세요」를 보여주고 결제를 시작하지 않는다. 다른 결제 필드와 홈 로딩은 바꾸지 않는다.

허용 파일: `preview/home-ui/src/plans/portone-checkout.js`, `preview/home-ui/src/plans/screens.js`, 이 worklog.

## 수정

- `portone-checkout.js`: `requestPayment`에 `customer: { email }`만 추가한다. 이메일은 인자로 받아 그대로 넣는다.
- `screens.js`: `getAuthUser().email`을 넘긴다. 비어 있으면 주문 생성 전에 위 안내를 보여주고 결제 버튼을 멈춘다.

운영 결제창 확인은 배포 뒤에 한다. 결제는 완료하지 않는다.
