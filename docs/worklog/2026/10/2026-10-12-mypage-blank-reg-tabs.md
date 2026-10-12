# 2026-10-12 · 등록이 없어도 내 등록 탭

- 브랜치: `cursor/mypage-blank-reg-tabs-20261012` (기준 `origin/main` `e1b9953b`)
- 작성: Cursor 메인 에이전트
- 상태: 작업 브랜치에만 둠. 본편 병합은 커밋 번호 승인 후.
- 종현 지시: 등록이 없어도 탭은 나와야 한다. 탭 안 페이지도 내용이 비어 있어도 그 페이지의 칸 배치가 있어야 한다. 저장으로 새 등록을 만들지는 않는다.

## 1. 한 일

공부방·과외쌤 내 등록에서 등록이 0건이어도 상단 탭을 보여 준다.

- 공부방: 마이샵, 기본정보, 상세정보1, 상세정보2, 쪽지설정, 등록점검
- 과외쌤: 마이프로필, 기본정보, 상세정보, 쪽지설정, 등록점검

각 탭을 열면 등록이 있을 때와 같은 구역·입력 칸이 있고, 값은 비어 있다. 저장 버튼은 보이되, 등록 번호가 없으면 눌러도 저장하지 않는다.

등록이 이미 있으면 지금처럼 그 등록 화면으로 간다.

과외쌤 탭의 글자 크기와 선택 색은 그대로 두었다.

## 2. 고친 파일

| 파일 | 내용 |
|---|---|
| `preview/home-ui/src/study-room-reg/router.js` | 번호 없는 탭 주소 |
| `preview/home-ui/src/study-room-reg/screens.js` | 빈 등록 화면 |
| `preview/home-ui/src/study-room-reg/embedded-panels.js` | 빈 등록에서 수정 저장 안 함 |
| `preview/home-ui/src/study-room-reg/registration-check-model.js` | 빈 등록 점검 링크 |
| `preview/home-ui/src/study-room-reg/registration-check-edit.js` | 빈 등록에서 저장 창 안 염 |
| `preview/home-ui/src/tutor-reg/router.js` | 번호 없는 탭 주소 |
| `preview/home-ui/src/tutor-reg/screens.js` | 빈 등록 화면 |
| `preview/home-ui/src/tutor-reg/profile-read.js` | 빈 프로필의 수정 링크 |
| `preview/home-ui/src/tutor-reg/registration-check-model.js` | 빈 등록 점검 링크 |
| `preview/home-ui/src/tutor-reg/inquiries-edit.js` | 빈 등록에서 쪽지설정 저장 안 함 |
| `preview/home-ui/src/neighborhood-greeting-ui.js` | 등록 번호가 없으면 인사 저장 안 함 |

## 3. 확인

화면을 그려 탭 개수와 칸 이름을 확인했다. 운영 계정은 쓰지 않았다. 등록이 있는 계정으로 브라우저에서 눌러 보지는 못했다.

## 4. 배포 전

본편에 넣기 전 종현 승인. 데이터베이스 작업은 없다.
