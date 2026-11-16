# 비로그인 유료상품 가격 공개

- 날짜: 2026-11-16
- 브랜치: `work/public-plans-2026-11-16`
- 기준: `origin/main` `309d69ca`
- 지시: `origin/docs/home-speed-split-2026-11-16` 의 `docs/worklog/grok-sync/docs/public-plans-2026-11-16.md`
- 선행: 홈 속도 분할 PR #224는 이미 main에 있다.
- 상태: PR만 연다. 머지하지 않음. 이 세션은 자기 작업을 승인하지 않는다.

## 한 일

1. 비로그인 `#/plans/positions`, `#/plans/access`는 로그인 안내 대신 상품 이름·기간·가격·설명을 그린다. 가격·기간은 `GET /api/paid/catalog.php` 카탈로그만 쓴다. 설명 문장은 로그인 구매 화면과 같은 카피이다.
2. 구매 버튼은 「로그인하고 구매하기」이다. 누르면 `study114:pending-route`에 같은 상품 경로를 넣고, 로그인 주소의 `return_to`도 그 경로로 둔다. 로그인 뒤 역할 홈으로만 떨어져도 pending이 상품 화면으로 되돌린다.
3. 노출상품은 「프라임·픽은 공부방·과외쌤 전용입니다.」, 쪽지권은 「쪽지권은 공부방·과외쌤 전용입니다.」를 한 줄로 둔다. 학생 로그인은 기존처럼 학생 홈으로 보낸다.
4. 상품 목록 아래 `#/support/faq/plans`(결제·상품) 환불 규정 링크를 붙였다.
5. 카탈로그 GET은 원래 `requireProvider()`를 호출하지 않는다. 새 쓰기 경로는 없다. 결제 API는 로그인 필수 그대로다.

## 수락 기준

| 항목 | 결과 |
|---|---|
| 비로그인 `#/plans/positions`, `#/plans/access` 이름·가격·설명 (PC·390) | 로컬 `http://127.0.0.1:5174`에서 확인. 390 폭에서 공부방 Prime 2주 30,000원·1개월 50,000원·2개월 90,000원, 쪽지권 500원·2,250원·4,000원이 보였다. 접근성 트리에 공부방·과외쌤 프라임·픽 가격과 역할 안내·환불 링크가 있었다. |
| 비로그인 구매 버튼 → 로그인 → 같은 상품 화면 | 버튼이 `pending=/plans/access`를 넣고 `http://127.0.0.1:5173/#/login?from=plans&action=buy&return_to=%2Fplans%2Faccess`로 갔다. 로그인 폼이 열렸다. 계정 로그인 뒤 복귀는 이 세션에서 하지 못했다. |
| 공부방·과외쌤·학생 로그인 회귀 | 로그인 계정이 없어 화면을 다시 찍지 못했다. 로그인 사용자는 기존 `renderPlansScreen`을 그대로 쓴다. `#/plans` 상품홈은 비로그인 로그인 안내가 그대로다. |
| 공개 API에 회원·결제 정보 없음 | 아래 예시. 로컬 `GET /api/paid/catalog.php`는 200. `GET /api/paid/checkout.php`는 401 `unauthorized`. |
| 작업 기록 | 이 파일. |

## 공개 카탈로그 응답 예시

`GET /api/paid/catalog.php` (쿠키 없음). 회원 키 `user_id` `email` `order_ref` `payment_id` `password` `access_token` 없음.

```json
{
  "ok": true,
  "catalog_version": "2026-10-27.1",
  "periods": ["2주", "1개월", "2개월", "3개월", "6개월"],
  "products": [
    {
      "product_code": "prime",
      "family": "position",
      "provider_type": "study_room",
      "name": "Prime 노출",
      "options": [
        {
          "option_id": "prime_14",
          "period": "2주",
          "duration_type": "day",
          "duration_value": 14,
          "sale_price_krw": 30000,
          "label": "2주"
        }
      ]
    }
  ]
}
```

쪽지권 `memo_ticket` 판매가는 1회 즉시권 500원, 5회권 2,250원(120일), 10회권 4,000원(120일). 설명 문장은 API에 없고, 로그인 화면과 같은 프론트 카피를 쓴다. 할인율·쪽지 포함 개수 같은 기존 카탈로그 필드는 로그인 구매 화면이 그대로 읽으므로 응답에서 빼지 않았다.

## 바꾼 파일

- `preview/home-ui/src/plans/public-catalog.js` — 비로그인 가격표
- `preview/home-ui/src/plans/index.js` — 비로그인 상품 화면 분기, 구매 버튼의 pending·로그인 이동
- `preview/home-ui/src/main.js` — 로그인 뒤 `/plans/positions`·`/plans/access` pending 복귀
- `preview/shared/route-access.js` — 그 두 경로만 게스트 공개
- `preview/home-ui/src/styles/plans-store.css` — 가격표 줄바꿈
- `public/api/paid/catalog.php` — 공개 읽기 주석. 응답 형식·인증 호출은 그대로
- `scripts/verify-paid-catalog.php` — 수출 JSON에 회원·결제 키가 없는지 검사

## 하지 않은 것

- 결제·환불·쿠폰·프라임 판정·가격 변경 없음. 운영 SQL 없음. 머지 없음.
