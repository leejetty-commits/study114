# 118 · 홈 팝업 Phase 2 — 표시 엔진(고르기) Cursor 티켓

- 기준: 로컬 `05f8df7` (1b 수락 117). 브랜치 `feat/student-mypage-a-g`.
- 정책 원본: 111 §1·§2, 053 Phase 2.
- 상태: **잠금**. push·build:dothome 금지. 새 커밋 1개(allowlist만).

## 0. 한 줄 목표
「어떤 팝업을 누구에게 띄울지」 고르는 규칙을 코드로 만든다. **다만 이번 커밋에서는 공개된 팝업이 0건**이라, 손님·회원 화면은 지금과 똑같이 아무것도 안 뜬다. 관리자 미리보기(`?popupDemo` · `?popupFamily`)는 그대로.

## 1. 데이터 (더미 · API 없음)
`content.js`에 `HOME_POPUPS` 배열(더미 3건 이상) 추가. 필드:

| 필드 | 값 |
|---|---|
| `id` | 문자열, 고유 (예: `demo-notice-1`) |
| `type` | `notice` / `event` / `ad` |
| `family` | `a` / `b` |
| `audience` | 배열. `all` / `guest` / `studyRoom` / `tutor` / `student` |
| `startAt` / `endAt` | `YYYY-MM-DD` 또는 `null`(제한 없음). 서울 날짜 기준, 양끝 포함 |
| `published` | 공개 표시 on/off. **커밋 시 전부 `false`** |
| `sortOrder` | 숫자, 작을수록 먼저 |
| `updatedAt` | ISO 문자열 |

카피는 지금처럼 `SET_A[type]` 재사용(내용 편집은 Phase 4).

## 2. 고르기 규칙 — 새 파일 `home-popup/engine.js` (순수 함수, DOM·저장소 접근 금지)
`pickHomePopup(list, { surface, today, isHidden })` → 팝업 1건 또는 `null`.

1. `published === true`만.
2. 기간: `startAt <= today <= endAt` (null 쪽은 통과).
3. 대상: `audience`가 비었으면 **탈락**. `all` 포함이면 통과. 아니면 현재 홈의 대상 코드가 포함돼야 통과.
   - 홈 화면 → 대상 코드: `guest`→`guest`, `studyRoom`→`studyRoom`, `tutor`→`tutor`, `parent`→`student`.
   - 여러 역할인 사람도 **지금 보고 있는 홈** 기준(111 §2-2-5).
4. `isHidden(id)`가 true면 탈락(오늘 하루 보지 않기).
5. 남은 것 중 **공지 > 이벤트 > 광고**, 같은 유형이면 `sortOrder` 오름차순, 그다음 `updatedAt` 최신. **1건만** 반환.

`seoulToday()` 도우미: `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` 로 `YYYY-MM-DD`.

## 3. 「오늘 하루 보지 않기」 저장 (공개 모드에서만)
- 키: `udg.homePopup.hide.<id>` = 서울 날짜 `YYYY-MM-DD` (localStorage). **팝업 id만**, 역할 조합 넣지 않음.
- 값이 오늘(서울)과 같으면 숨김, 다르면 표시(자정 서울 만료).
- 체크 후 닫기 → 저장. 체크 없이 닫기/X/ESC/배경 → 이번 화면에서만 닫힘(지금 `closedView` 방식).
- localStorage 사용 불가(예외) 시 조용히 무시하고 이번 화면만 닫기.
- **관리자 미리보기에서는 계속 저장하지 않음**(1a 규칙 유지).

## 4. 화면 흐름 (`gate.js` · `mount.js`)
- 홈 4화면(guest/parent/studyRoom/tutor)에서만. 찾기·마이페이지·가입 등 금지(지금과 동일).
- **관리자 + `?popupDemo` 쿼리 있음** → 지금 미리보기 그대로(엔진 무시, 대상·기간·공개 무시).
- 그 외(관리자이지만 쿼리 없음 포함) → `pickHomePopup` 결과가 있으면 그 `type`·`family`로 그린다. 없으면 아무것도 안 그림.
  - ※ 관리자가 쿼리 없이 홈을 볼 때 지금은 공지 시안이 기본으로 뜨는데, 이번부터는 **쿼리 없으면 안 뜸**이 맞다. 미리보기는 `?popupDemo=` 로 연다.
- 공개 팝업이 떠 있을 때는 기존 납작 팝업 억제: `shouldSuppressOpsPopup()`가 **미리보기 표시 또는 엔진 선택 표시**일 때 true. (`site-ops-chrome.js` 자체는 수정 금지 · gate 함수만 바뀜)
- 공개 모드 카드에는 set-a/set-b·유형 스위치 **숨김**(스위치는 미리보기 전용).

## 5. Allowlist / 금지
- 허용: `preview/home-ui/src/home-popup/gate.js`, `content.js`, `mount.js`, **신규** `engine.js`.
- 금지: `main.js`, `site-ops-chrome.js`, 기존 site-settings 팝업 저장소(`listActivePopupsForSurface` 등), `#/admin/settings/popups`, API/DB, CSS 디자인 변경(필요 시 중단 보고), 1a·1b amend, **`published: true`로 커밋**.

## 6. 스모크 (보고 필수)
1. **엔진 단독**: `node`로 `pickHomePopup` 케이스 출력 붙여넣기
   - 공지+광고 둘 다 조건 맞음 → 공지
   - 공지는 기간 끝남, 광고 맞음 → 광고
   - 대상 `[]` → null / `['all']` → 모든 홈 / `['studyRoom','tutor']` → parent·guest에서 null
   - `published:false` → null / isHidden(id) true → 다음 후보
   - `seoulToday()` 가 서울 날짜로 나오는지
2. **로컬 임시 공개 확인(커밋 전 원복)**: 더미 1건을 잠깐 `published:true`, audience `['guest']`로 바꿔 손님 홈에 뜨는지 → 오늘 하루 체크 닫기 → 새로고침해도 안 뜸 → localStorage 키 삭제 시 다시 뜸. 확인 후 **false로 원복**하고 원복했다고 보고.
3. **미리보기 회귀**: 관리자 `?popupDemo=notice|event|ad` × `?popupFamily=a|b` 6조합 그대로, 하루 안 보기 저장 안 됨.
4. 커밋본 기준 손님 홈·쿼리 없는 관리자 홈에 팝업 없음. 납작 팝업 동작 변화 없음.
5. 보고: 파일 목록, 커밋 SHA, 스모크 결과, `published` 전부 false 확인.
