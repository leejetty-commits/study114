# 21g 공부방 쏙쏙정보 안내 탭

- 기준: `origin/main` `04ec41cb` (PR #280)
- 2026-11-20. 공부방 쏙쏙정보 목록에 안내 탭 2개를 붙인다. 본문은 `/info/` 정적 페이지가 정본이다.

## 0단계 진단

`info-board-screens.js`는 홈 엔트리가 아니라 지연 청크 `info-board-screens-U0KIY0O4.js`에 있다. 수정 전 홈 엔트리 `index-CzAfxUih.js`는 667919바이트이고, 그 파일에는 청크 파일명만 있다. `renderInfoBoardScreen`과 `data-info-cat`은 없다.

안내 탭은 서버 분류가 아니다. `data-info-cat`을 쓰면 `list_has_all_plus_four_category_tabs`가 깨지므로 `data-info-embed`를 쓴다. 글쓰기 선택 목록은 `board.categories` 그대로다. 공통 CSS·`library-copy.js`·`/info/` HTML은 고치지 않는다. 허용 파일 3개로 된다.

## 수정 후 엔트리

홈 엔트리 `index-9kxf5ETd.js`도 667919바이트다. 파일명 해시는 달라졌다. 엔트리의 의존 목록이 지연 청크 파일명(`info-board-screens-2tNyO4Zt.js`)을 적기 때문이다. 해시 길이가 같아 바이트 수는 같다.

엔트리에 `새 창에서 보기`, `data-info-embed`, `불러오지 못했어요. 다시 시도`는 없다. 그 문자열은 지연 청크 `info-board-screens-2tNyO4Zt.js`에만 있다.

## 확인

- 공부방 목록 탭 7개. 과외쌤·학생 탭은 기존과 같다.
- 안내 탭은 이동하지 않고 `main.page`를 그린다. 접기 16개, 하나를 열면 본문이 보인다.
- 분류 탭으로 돌아오면 목록 영역이 돌아온다.
- 홈을 열 때 `/info/edu-office/`, `/info/franchise/` 요청은 0건. 탭을 누를 때 1건, 같은 탭을 다시 누르면 0건.
- 375·1440에서 문서와 탭 넘침 0. 탭 글자 넘침 0. 접기 머리 높이 52px, 안쪽 여백 14px 16px, 굵기 700, 모서리 12px.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
