# 119 · 홈 팝업 Phase 2 (표시 엔진) 수락

- 대상 티켓: 118
- 커밋: `997ae27027cbc421f61f56029efe0b3415135541` (로컬, base `05f8df7`, push 안 함, 1a·1b amend 없음)
- 판정: **수락** (로컬). 배포는 「배포」 전까지 보류.

## 대조 (실제 diff)
- 파일 4개 = allowlist: `home-popup/engine.js`(신규)·`content.js`·`gate.js`·`mount.js`. main.js·site-ops-chrome.js·site-settings 저장소·admin·API·CSS 무변경.
- `HOME_POPUPS` 3건 전부 `published: false` 확인.
- `engine.js` 순수 함수: 공개→기간(양끝 포함, null 통과)→대상(빈 배열 탈락·all 통과·parent=student)→오늘 숨김→공지>이벤트>광고·sortOrder·updatedAt 최신 1건. `seoulToday()` Intl Asia/Seoul.
- 미리보기 = 관리자 + 페이지 쿼리 `popupDemo` 있을 때만. 쿼리 없는 관리자도 엔진 → 기본 공지 자동 표시 제거(티켓 의도대로).
- 하루 안 보기: 공개 모드 + 체크 + id 있을 때만 `udg.homePopup.hide.<id>` = 서울 날짜 저장. 체크 상태면 닫기·X·ESC·배경 어느 쪽으로 닫아도 저장(티켓 해석 범위 내, 수용). 미리보기 저장 없음. localStorage 예외 무시.
- 배경 클릭 닫기 추가, 스위치는 미리보기 전용. `shouldSuppressOpsPopup()` = 표시될 팝업이 있을 때만 true.

## 메모
- 워킹트리에 `study-room-reg/screens.js` 끝 빈 줄 1개 변경이 새로 보임(커밋 안 됨). 이전 분류대로 **버려도 되는 로컬 잔여** — 커밋·배포 대상 아님.
- 관리자 실로그인 6조합 스모크는 로컬 API(:8080) 꺼져 미확인 → API 켤 때 1b와 함께 확인.

## 다음
- Phase 3(저장 API/DB, 대상 배열 필드) → Phase 4(관리자 내용·대상·기간·공개·유형·패밀리 폼). Phase 5 공지 연동은 미정(후순위).
