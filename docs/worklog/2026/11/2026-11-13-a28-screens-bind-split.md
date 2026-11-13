# 관리자 바인드 파일 분할

## 지시

origin 브랜치 `docs/file-split-plan-2026-11-13`의 `docs/worklog/grok-sync/docs/file-split-plan-2026-11-13.md`를 읽고, 1번 파일 `preview/home-ui/src/admin/a28-screens-bind.js`만 지침대로 나눈다. 화면 동작·함수 이름·출력은 바꾸지 않고, 기존 파일은 같은 이름으로 다시 내보낸다. PR까지 만들고 머지 전 보고. 다른 파일 분할·실시간 매칭 구현은 하지 않는다.

## 나눈 파일

| 파일 | 역할 |
|------|------|
| `preview/home-ui/src/admin/a28-screens-bind-members.js` | 회원 모달·로드 상태, 커머스, 제출 서류, 회원·신고·티켓·노출·팝업 bind |
| `preview/home-ui/src/admin/a28-screens-bind-content.js` | 공지·게시판, 설정, 알림·SMS bind |
| `preview/home-ui/src/admin/a28-screens-bind.js` | 화면 분기, 오늘 칸 이동, 기존 7개 이름 다시 내보내기 |

바깥은 계속 `a28-screens-bind.js`만 부른다. 새 파일은 `a28-screens-bind.js`를 가져오지 않는다.

## 확인

- 공개 이름 7개(`bindTodaySlotNav`, `bindA28ScreenEvents`, `bindMembersScreen`, `bindReportsScreen`, `bindTicketsScreen`, `bindExposureScreen`, `bindHomePopupForm`)를 Vite로 불러 `function`인지 확인했다.
- 옮긴 함수 본문은 원문과 같다. 검증 스크립트 두 개는 세 파일을 이어 읽게만 고쳤다.
