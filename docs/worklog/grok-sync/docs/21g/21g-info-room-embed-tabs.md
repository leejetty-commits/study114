# 21g — 공부방 쏙쏙정보 상단 탭 2개: 안내 페이지 본문을 게시판 안에 통째로 보여 주기

## 목표
공부방 쏙쏙정보(info-room) 목록 상단 탭 줄(전체 · 운영 노하우 · 학생 모집·홍보 · 시설·행정·세무 · 입시·교육 소식) 끝에 탭 2개를 추가한다.
- 「신고·설립 안내」: 본문 정본 `/info/edu-office/`
- 「프랜차이즈 안내」: 본문 정본 `/info/franchise/`

탭을 누르면 페이지를 옮기지 않고, 게시판 목록 자리(탭 줄 아래 본문 영역)에 해당 /info/ 페이지의 `<main class="page">` 내용을 통째로 보여 준다. 접고 펼치기(`<details>`)와 카드 디자인도 그대로 보이게 한다. 이 두 탭에서는 글쓰기 버튼과 게시글 목록·더보기는 숨긴다. 다른 분류 탭을 누르면 원래 게시판 목록으로 돌아간다.

본문을 복사해 넣지 않는다. 정본은 /info/ 페이지 하나로 유지하고, 탭을 누를 때 `fetch('/info/edu-office/')` 등으로 가져와 `DOMParser`로 `main.page`만 꺼내 넣는다. 가져온 HTML에서 `<script>`, `on*` 속성은 제거한다(같은 출처라도 방어). 외부 링크의 `target="_blank" rel="noopener noreferrer"`는 유지한다. 한 번 가져온 내용은 메모리에 캐시한다. 실패하면 「불러오지 못했어요. 다시 시도」 상태 카드와 `/info/...` 바로가기 링크를 보여 준다.

## 홈 속도 규칙 (필수)
- 이 기능 코드는 자료실 지연 로딩 청크(`library/index.js`로 import 되는 쪽)에만 있어야 한다. 홈 첫 로딩 엔트리 청크에 들어가면 안 된다.
- /info/ 본문 fetch는 탭을 눌렀을 때만 한다. 미리 가져오기(prefetch) 금지.
- 디자인 CSS는 새 모듈 안에 문자열로 두고, 탭이 처음 열릴 때 `<style data-info-embed>`를 한 번만 넣는다. 선택자는 모두 `.info-embed` 아래로 한정해 사이트 다른 화면에 새지 않게 한다. 공통 CSS 파일은 수정하지 않는다.

## 0단계: 먼저 진단만 하고 보고
1. `preview/home-ui/src/library/info-board-screens.js`의 `renderTabs()`, `renderList()`, 분류 탭 클릭 처리(`data-info-cat`, `bindInfoBoardEvents`), `board.categories`가 쓰이는 곳(글쓰기 분류 select 포함)을 확인한다.
2. `info-board-screens.js`와 새 모듈이 홈 엔트리 청크가 아니라 지연 청크에만 들어가는지 빌드 결과로 확인해 보고한다. 엔트리 청크에 들어가면 멈추고 보고한다.
3. `/info/edu-office/`, `/info/franchise/`의 `main.page`와 인라인 `<style>`의 관련 규칙(.section, .panel, .fold, details/summary, .fold__body, 면책 박스 등)을 확인한다.
4. 아래 허용 파일 밖을 건드려야 하면 고치지 말고 멈추고 보고한다.

## 허용 파일
- `preview/home-ui/src/library/info-board-screens.js` (탭 추가, 탭 상태 분기)
- `preview/home-ui/src/library/info-embed.js` (신규: fetch·정리·캐시·스타일 주입·렌더)
- `docs/worklog/2026/11/2026-11-20-21g-info-room-embed-tabs.md` (신규)

`board.categories`, `library-copy.js`, 서버(`InfoBoardService` 분류 목록), 글쓰기 분류 select, 라우터, `/info/` HTML 파일은 바꾸지 않는다. 과외쌤 따끈 팁가이드와 학생 꿀팁 가이드에는 이 탭이 나오지 않아야 한다.

## 탭 모양
- 추가 탭 2개는 기존 탭과 같은 `sup-subtab info-board__tab` 모양이다. 선택되면 `is-active`.
- 분류 필터가 아니므로 서버 요청에 category로 보내지 않는다(로컬 상태 `embed: 'edu-office' | 'franchise' | null`).

## 디자인 (`.info-embed` 안)
- /info/ 페이지의 카드, 접기 디자인을 옮긴다: summary는 흰 카드, 모서리 12px, 테두리 #e5e7eb, 패딩 14px 16px, 굵게, 오른쪽 ▾/▴, 높이 48px 이상. 카드 사이 8px. 섹션 소제목은 기존 게시판 소제목 색·크기에 맞춘다.
- 본문 최대 폭은 게시판 영역 폭을 따른다. 375에서 가로 넘침 0.
- 맨 아래에 「새 창에서 보기」 링크(`/info/...`, 같은 창 이동도 무방).

## 수락 기준 (Cursor 셀프검수)
1. `git diff --name-only origin/main`이 허용 파일 3개와 같다.
2. 공부방 쏙쏙정보 탭은 7개(전체, 분류 4, 안내 2)다. 안내 탭을 누르면 본문이 게시판 안에 보이고, 펼침이 동작한다. 분류 탭을 누르면 목록으로 돌아간다.
3. 과외쌤·학생 게시판의 탭은 변화가 없다.
4. 홈 엔트리 청크 파일명(해시)과 크기가 이 PR 전후로 같다. 다르면 이유를 보고한다.
5. 홈을 열었을 때 `/info/edu-office/`, `/info/franchise/` 요청이 0건이다(네트워크 기록).
6. 375·1440 스크린샷: 탭 줄, 안내 탭 접힘, 하나 펼침.
7. PR, 머지, 배포, 운영 확인 후 보고한다(PR 번호, 머지 커밋, 배포 run, 바뀐 파일, 4·5번 결과).
