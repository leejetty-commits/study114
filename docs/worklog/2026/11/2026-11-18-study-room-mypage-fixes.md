# 15 공부방 마이페이지 — 비밀번호 실패 안내, 홍보지역 2·3 지우기, 경력 최소 1, 계정 이름 문구

지시: `origin/docs/reapply-2026-11-17` 의 `docs/worklog/grok-sync/reapply-2026-11-17/15-study-room-mypage-fixes.md`  
기준: 최신 `origin/main` `5a87ab72` (PR #251 머지 뒤). 지시서 기준 `410588ab` 와 함수 의미는 같았고 줄만 달랐다.  
브랜치: `work/study-room-mypage-fixes`  
작업 트리: `D:\work\study114\.wt\work-15-study-room-mypage`  
더러운 체크아웃 `D:\work\study114` 는 건드리지 않았다.

종현 확인(2026-11-18)으로 홍보 2·3 차단만 지시서와 다르게 적용했다.

1. 서버 `syncSavedRegions`가 DB의 프라임·픽 유효 구독과 대기(`registered`·`notified`)를 보고 거절하는 것이 최종이다.
2. 화면은 `fetchPaidStatus`의 `exposure.positions`(`region_id`·`complex_id`)로 프라임·픽만 미리 막는다. 대기는 화면에서 미리 보지 않는다.
3. 저장 때 서버가 거절하면 그 한글을 기본정보 폼 안에 보여 준다.

`paid-api.js`와 대기 PHP는 수정하지 않았다. `main.js`, tutor 파일, `mypage-ops-register.css`, 지시서 14 파일, Auth·비밀번호 규칙, `profile.php`, 교습비(15b)도 수정하지 않았다.

## 0단계

`git rev-parse --short HEAD` = `5a87ab72`.

| 확인 | 고치기 전 |
|---|---|
| `screens.js` 비밀번호 | `validatePassword`는 이메일·이름·전화를 빈 값으로 넘긴다. 실패 폴백은 `변경 실패 (HTTP ${res.status})` |
| `study-room-basic-form.js` `renderPromoSlot` | 툴바는 제목과 대표 표시만. 지우기 없음 |
| `StudyRoomRegisterService.php` `syncSavedRegions` | DELETE 뒤 빈 칸은 행을 만들지 않음. 홍보1 없으면 거절 |
| `saveCareer` / `optionalInt` | 경력은 `optionalInt`만. 하한 없음. `optionalInt`는 그대로 둠 |
| `step-facility.js` | 교습경력·학원경력은 `type="number"`만 |
| 계정 문구 | 「사이트 표시명」「표시명 수정」「표시명 저장」. `name`·`id`·`data-*`·세션 키는 유지 |

`fetchPaidStatus` 응답은 `exposure.positions`에 `sku`, `provider_type`, `provider_id`, `region_id`, `complex_id`가 있다. 대기 공개 JSON에는 `region_id`·`complex_id`·`payment_status`가 없어서 화면 대기 확인은 하지 않는다.

## 고친 것

- 비밀번호 실패 폴백: 「비밀번호를 변경하지 못했습니다. 규칙을 확인해 주세요.」 `data.message`가 있으면 그대로.
- 홍보 2·3에 값이 있을 때만 「지우기」. 홍보1과 희망지역에는 없다.
- 지우기: 이 공부방의 프라임·픽 위치가 그 칸이면 비우지 않고 슬롯 아래 빨간 글. 조회 실패도 비우지 않는다. 없으면 그 칸만 비우고 기준은 행정동.
- 저장 거절: `basic`·`basic_all`·`location` 응답의 `message`를 기본정보 폼 `[data-basic-save-error]`에 넣는다. 기존 확인 창(`save-flow.js` `withSaving`)은 허용 파일 밖이라 그대로다.
- 서버: DELETE 전에 홍보 2·3이 이번 요청에 없으면 구독을 먼저 보고, 없으면 대기를 본다. 구독이 있으면 구독 문구, 대기만 있으면 대기 문구. `saveStep` 트랜잭션이 롤백한다.
- 경력: 칸에 `min="1"` `step="1"`. 값이 1 미만이면 서버가 거절. 빈 값은 null. `optionalInt`는 안 바꿈.
- 계정 화면 글자만 「내 계정 이름」으로. 힌트 한 줄을 추가. 키는 그대로.

## 검증

- `npm run build:dothome` 종료 코드 0.
- `verify-input-fill-rule.mjs --only=H5` 17 통과, 0 실패. `#mypage-display-name`, `[data-form="change-display-name"]` 유지.
- 브라우저(Vite + 가짜 로그인, 학생 역할): 계정/설정에 「계정 이름·집주소…」「내 계정 이름」「이름 수정」「이름 저장」과 추가 힌트. 「사이트 표시명」「표시명 수정」은 이 화면에 없음. 눈썹 「사이트에 보이는 이름」, 카드 「표시 정보」는 그대로. `name="display_name"` 유지.
- 같은 브라우저에서 기본정보 폼: 지우기는 홍보 2·3만. 프라임 위치가 있으면 칸이 남고 빨간 구독 문구. 위치가 없으면 그 칸만 비워지고 행정동으로 돌아감. 조회 실패는 「지금 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.」 저장 거절 한글은 폼 안에 빨간 글.
- 상세정보2 마크업: 교습경력·학원경력 `min="1"` `step="1"`, `required` 없음, 빈 값.
- 공부방·과외쌤·학생 실제 계정으로 일반·시크릿 메뉴를 누르는 수락은 미확인. 로컬 로그인 검증이 과제 13·14와 같이 되지 않아 비밀번호는 바꾸지 않았다.
- 프라임·픽·예약대기가 있는 운영 계정은 이 세션에서 쓰지 않았다. 해당 계정 없음. 서버 분기는 `syncSavedRegions` 코드와 위 폼 문구로 확인했다.

캡처 파일은 남기지 않았다. 위 브라우저 확인은 임시 페이지에서 했고, 커밋 전에 그 파일을 지웠다.
