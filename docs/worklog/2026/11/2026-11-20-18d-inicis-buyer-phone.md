# 18d 이니시스 V2 결제창 구매자 휴대폰·이름

- 기준: `origin/main` `68e49894` (PR #286)
- 2026-11-20. 이니시스 V2 일반결제는 결제창 호출 때 구매자 휴대폰과 이름이 필요하다.

## 지시

`requestPayment`의 `customer`에 `phoneNumber`(숫자만)와 `fullName`을 넣는다. 비어 있으면 「계정설정에서 휴대폰·이름을 확인해 주세요」를 보여주고 결제창을 열지 않는다. 이름은 세션 `getAuthUser().name`이다. 휴대폰은 `user_profiles.phone`만 결제 응답에 싣고, 다른 개인정보와 로그에는 남기지 않는다.

허용 파일: `ProviderCheckoutService.php`, `portone-checkout.js`, `screens.js`, `screens-orders.js`, 이 worklog.

## 수정

- `ProviderCheckoutService::createOrder` 응답에 `buyer_phone`(숫자만)을 추가한다.
- `screens-orders.js`는 노출상품 draft에 그 번호만 저장한다.
- `screens.js`는 이름과 번호를 넘긴다. 하나라도 비어 있으면 결제창을 열지 않는다.
- `portone-checkout.js`는 `customer`에 `phoneNumber`, `fullName`만 추가한다.

운영 결제창 확인은 배포 뒤에 한다. 결제는 완료하지 않는다.
