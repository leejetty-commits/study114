# 15b 공부방 수업 그룹 월 수업료 — 화면 천원, DB 원

지시: `origin/docs/reapply-2026-11-17` 의 `docs/worklog/grok-sync/reapply-2026-11-17/15b-study-room-class-fee-cheonwon.md`  
기준: `origin/main` `defd0016` (PR #253). 15 머지 `4b2137b4` (PR #252)가 그 앞에 있다.  
브랜치: `work/study-room-class-fee-cheonwon`  
작업 트리: `D:\work\study114\.wt\work-15b-class-fee`

운영 SQL은 실행하지 않았다. 종현이 백업·컬럼·id 26·34·39 UPDATE를 이미 실행했다고 이 작업 지시에서 확인했다. 확인 SELECT 결과 숫자는 이 세션에서 다시 읽지 않았다.

## 0단계

| 확인 | 결과 |
|---|---|
| 15 merge | `git log`에 `4b2137b4` 있음 |
| 그룹 월 수업료 | `step-lesson.js` 텍스트 칸, placeholder 「예: 350천원」. 수업료 설명은 그 아래 |
| 월 평균 수업료 | 이미 `.register-fee-manwon` + 「천원」. 이 칸은 수정하지 않음 |
| `fee-cheonwon.js` | `cheonwonInputToWon` / `wonToCheonwonInput` 있음. import만 |
| `parseFeeAmount` | PHP·JS 모두 정의만 있고 그룹 저장에서 호출되지 않음. 새 저장의 정본으로 쓰지 않음 |
| `formatClassFee` | 예전에는 `만`/`천`/숫자 문자열을 환산. 이제 원 금액만 `월 N천원` |
| `myshop-render.js` | 제목 줄이 `toplineParts`를 그림. `dt 수업료`는 `fee_note`. 마크업은 안 바꿈 |
| 찾기·홈·퀵매칭 | 가격은 `price_amount` / `monthly_fee_manwon`. 그룹 `monthly_fee`를 쓰지 않음 |

## 고친 것

- 수업 그룹 월 수업료 칸은 숫자 + 「천원」. 값은 `monthly_fee_amount`(원)를 천원으로 나눈 숫자. 금액이 없으면 빈 칸. 옛 문자열은 칸에 넣지 않음.
- 저장: 천원×1000을 `monthly_fee_amount`에, 「N천원」을 `monthly_fee`에. 빈 칸은 둘 다 비움. 1 미만은 거절.
- 공개 수업 줄은 원 금액이 있을 때만 「월 N천원」. `myshop-render.js`는 그대로.
- 컬럼은 `sql/schema/093_study_room_class_monthly_fee_amount.sql`과 PHP 멱등 ADD. 기존 행 UPDATE는 앱에 없음.

## 검증

- 렌더: 금액 350000은 칸에 350. 금액이 없는 옛 문자열 `170000`은 빈 칸. 월 평균 수업료 40과 수업료 설명은 그대로. `formatClassFee(350000)`은 「월 350천원」, `formatClassFee('35만원')`은 빈 문자열.
- `verify-shop-page` 71 통과, 0 실패.
- `npm run build:dothome` 종료 코드 0.
- 공부방·과외쌤·학생 일반·시크릿 메뉴 실클릭은 미확인. 로컬 로그인 검증이 되지 않아 비밀번호는 바꾸지 않았다.
