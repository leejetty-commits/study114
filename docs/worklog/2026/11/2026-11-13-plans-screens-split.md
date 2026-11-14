# 상품센터 화면 파일 분할

## 지시

`docs/worklog/grok-sync/docs/file-split-plan-2026-11-13.md`의 2번 `preview/home-ui/src/plans/screens.js`만 나눈다. 화면 동작·함수 이름은 바꾸지 않고, 기존 파일에서 공개 이름을 다시 내보낸다. 이 PR은 머지하지 않는다. 실시간 매칭은 하지 않는다.

## 나눈 파일

| 파일 | 역할 |
|------|------|
| `preview/home-ui/src/plans/screens-status.js` | 티어·자격·상태 |
| `preview/home-ui/src/plans/screens-orders.js` | 견적·결제내역·체크아웃·결과 |
| `preview/home-ui/src/plans/screens.js` | 상품 카드·라우트·이벤트. 공개 이름 20개를 다시 내보냄 |

상태 파일과 주문 파일은 `screens.js`를 가져오지 않는다. 바깥 호출 경로는 `plans/screens.js` 그대로다.

## 확인

- Vite로 공개 함수 20개가 `function`인지 확인했다.
- 구매이력 검증 스크립트는 세 파일을 이어 읽게만 고쳤다.
