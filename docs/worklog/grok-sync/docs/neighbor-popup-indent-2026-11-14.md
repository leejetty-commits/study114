# 동네 인사 팝업 인삿말 들여쓰기 (2026-11-14)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: 우동공과3
- 기준: origin/main `efc881f7`
- 화면: 홈 「우리 동네에 새로 왔어요」 팝업(`#ng-feed`)
- 브랜치: `work/neighbor-popup-indent-2026-11-14` (main 최신 pull 후 새로 만듦)
- **규칙: 새 브랜치에서 PR만 열고 보고. 머지·force push·운영 SQL 금지.**

## 1. 배경

홈 동네 인사 칸에서 「더보기」 또는 인사 줄을 누르면 팝업이 열린다. 제목은 「우리 동네에 새로 왔어요」이다.

각 항목은 위쪽에 배지(「새 이웃」 / 「과외쌤」 / 「공부방」)와 이름 링크가 한 줄이고, 그 아래에 인삿말 본문이 있다. 지금 본문은 항목의 **왼쪽 끝**, 즉 배지의 왼쪽과 같은 줄에서 시작한다.

종현님 요청: 인삿말은 **이름 첫 글자**(예: 「테스트 의정부과외」의 **『테』**)와 같은 세로선에서 시작하게 한다. 배지 너비가 「새 이웃」과 「과외쌤」처럼 달라도 맞게 맞춰야 한다. 본문이 두 줄 이상으로 줄바꿈되어도 둘째 줄부터 같은 세로선에 붙는다. 좁은 화면에서도 같다.

배지 너비를 px로 가정해 `padding-left`를 넣는 방식은 쓰지 말 것. 배지 칸과 내용 칸을 나눈 그리드(또는 플렉스 두 칸)로 푼다.

## 2. 정확한 위치 (origin/main `efc881f7`)

| 파일:줄 | 내용 |
|---|---|
| `preview/home-ui/src/neighborhood-greeting-ui.js:353-402` | `openGreetingFeed()` — 팝업을 만들고 `paint()`에서 목록 HTML을 그림 |
| `preview/home-ui/src/neighborhood-greeting-ui.js:375-382` | **항목 마크업(여기를 손봄).** 지금 구조는 아래와 같다 |
| `preview/home-ui/src/neighborhood-greeting-ui.js:211` | 배지 글자: 환영 인사이면 `COPY.welcomeBadge`(「새 이웃」), 과외쌤이면 「과외쌤」, 아니면 「공부방」 |
| `preview/home-ui/src/neighborhood-greeting-ui.js:409-430` | 팝업 클릭. 이름 버튼은 `[data-ng-feed-name]` + `data-ng-kind` + `data-ng-reg`로 카드를 연다. **이 속성·선택자를 유지해야 한다** |
| `preview/home-ui/src/home-news-copy.js:5,22` | 제목 「우리 동네에 새로 왔어요」, 배지 「새 이웃」 |
| `preview/home-ui/src/styles/neighborhood-greeting.css:111-182` | 팝업 CSS. `.ng-feed__who`(배지+이름 한 줄, `display:flex; gap:0.4rem`), `.ng-feed__kind`(배지), `.ng-feed__body`(본문, 왼쪽 여백 없음) |
| `preview/home-ui/src/styles/neighborhood-greeting.css:86-101` | `.ng-feed__name` — 밑줄 있는 이름 버튼 |
| `preview/home-ui/src/main.js:20` | `neighborhood-greeting.css` 연결 |

지금 항목 HTML (`neighborhood-greeting-ui.js` 376-382줄, 그대로):

```html
<li class="ng-feed__item">
  <p class="ng-feed__who">
    <span class="ng-feed__kind" data-kind="…">새 이웃</span>
    <button type="button" class="ng-feed__name" data-ng-feed-name data-ng-kind="…" data-ng-reg="…">테스트 의정부과외</button>
  </p>
  <p class="ng-feed__body">안녕하세요. 잘 부탁드려요.</p>
</li>
```

`.ng-feed__body`는 `.ng-feed__who`의 아래 형제로, 둘 다 항목의 왼쪽 끝에 붙는다. 그래서 본문이 배지 왼쪽과 맞춰진다. `.ng-feed__item`에는 지금 전용 CSS가 없다.

참고(범위 밖): 홈 칸 레일(`greetingCellBody`, 277-284줄, `.ng-rail__line`)은 배지·이름·요약이 **한 줄**이다. 이번 요청은 팝업 본문 들여쓰기만이다. 레일 HTML/CSS는 건드리지 말 것.

## 3. 바꿀 것

### 3-1. 마크업 — 배지 칸 / 내용 칸

팝업 항목만, 배지와 (이름+본문)을 두 칸으로 나눈다. 예시:

```html
<li class="ng-feed__item">
  <span class="ng-feed__kind" data-kind="…">새 이웃</span>
  <div class="ng-feed__content">
    <button type="button" class="ng-feed__name" data-ng-feed-name data-ng-kind="…" data-ng-reg="…">테스트 의정부과외</button>
    <p class="ng-feed__body">안녕하세요. 잘 부탁드려요.</p>
  </div>
</li>
```

- `data-kind`, `data-ng-feed-name`, `data-ng-kind`, `data-ng-reg`, 배지·이름·본문 텍스트는 그대로.
- 클릭 핸들러(409-430줄)는 `[data-ng-feed-name]`을 찾으므로, 이름 버튼에서 이 속성을 빼면 안 된다.
- `.ng-feed__who`를 유지해도 된다. 그때는 `.ng-feed__item`을 그리드로 만들고, 배지를 첫 칸, `.ng-feed__who`(이름만)와 `.ng-feed__body`를 둘째 칸에 놓이게 한다. 결과는 같아야 한다: 본문 왼쪽 = 이름 첫 글자.

### 3-2. CSS

`preview/home-ui/src/styles/neighborhood-greeting.css`에만 추가·수정한다.

권장:

```css
.ng-feed__item {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.4rem; /* 지금 .ng-feed__who의 gap과 같게 */
  align-items: start;
}
.ng-feed__kind { /* 첫 칸. 너비는 글자 길이만큼(auto) */ }
.ng-feed__content { min-width: 0; } /* 둘째 칸. 긴 본문이 칸을 밀지 않게 */
.ng-feed__body { margin: 0.2rem 0 0; } /* 지금 who-본문 간격(0.2rem)에 가깝게 */
```

핵심:

- 배지 칸 너비는 **그 줄의 배지 실제 너비**를 따른다. 「새 이웃」이 「과외쌤」보다 넓으면, 그 항목의 본문만 그만큼 더 들어가고, 옆 항목은 자기 배지에 맞춘다. 모든 항목에 같은 `padding-left`를 넣지 말 것.
- 본문이 줄바꿈되면(`white-space: pre-wrap`은 유지) 모든 줄이 이름 첫 글자와 같은 세로선에 붙는다.
- 배지 색·글자 크기·모서리는 지금 `.ng-feed__kind` 값을 유지한다(`9.6px`, 패딩 `1.6px 6.4px`, tutor/study_room 색). 환영 인사(「새 이웃」)도 지금은 `data-kind`에 `providerType`을 넣는다. 이 색 규칙을 이번 PR에서 바꾸지 말 것.
- 이름 버튼의 밑줄·굵기·버튼 리셋 CSS는 유지.
- 팝업 카드 너비, 제목 띠, 페이지 버튼, 닫기 버튼은 그대로.
- 480px 이하·모바일에서도 같은 그리드. 본문을 배지 아래로 다시 내려 보내지 말 것(그러면 『테』 정렬이 깨진다).

### 3-3. 시안

바꾸기 전:

```
[새 이웃] 테스트 의정부과외
안녕하세요. 잘 부탁드려요.
^^^^^^^^^^ 본문이 배지 왼쪽과 같음
```

바꾼 뒤:

```
[새 이웃] 테스트 의정부과외
          안녕하세요. 잘 부탁드려요.
          ^^^^^^^^^^ 『테』와 같은 세로선
```

배지 너비가 달라도:

```
[새 이웃] 테스트 의정부과외
          안녕하세요. 잘 부탁드려요.

[과외쌤]  다른이름
          인사 본문도 이 이름 첫 글자에 맞춤
```

긴 본문:

```
[새 이웃] 테스트 의정부과외
          안녕하세요. 의정부에서 과외를 시작하게
          되었습니다. 잘 부탁드려요.
```

## 4. 바꾸지 말 것

- 홈 칸 레일(`.ng-rail__*`, `greetingCellBody`, `renderNeighborhoodGreetingRail`)의 HTML·CSS
- 인사 불러오기 API(`GET /api/neighborhood-greetings.php`), 필터·정렬·페이지(5개), 환영/일반 배지 글자를 고르는 로직
- 이름 클릭으로 카드 열기, 로그인 게이트, 페이지 이전·다음, ESC·닫기, 드래그 핸들
- 배지·이름·본문 문구, `data-ng-*` 속성명, `data-kind` 값
- 배지 색·크기, 팝업 제목 「우리 동네에 새로 왔어요」, 제목 띠 배경
- 인사 작성 화면(`.ng-editor`) CSS
- 다른 홈 팝업·레이아웃

## 5. 수락 기준

1. 팝업에서 각 항목의 인삿말 왼쪽이, 그 항목 이름 첫 글자의 왼쪽과 같다. 첫 줄뿐 아니라 줄바꿈된 다음 줄도 같다.
2. 「새 이웃」(더 넓은 배지)과 「과외쌤」·「공부방」이 한 팝업에 같이 있어도, 각 항목이 **자기 배지 너비**만큼만 들여 쓴다. 모든 줄에 같은 고정 여백을 쓰지 않았다.
3. 이름 링크를 누르면 이전과 같이 해당 카드가 열린다. 이전·다음·닫기·ESC가 동작한다.
4. 480px 너비(또는 모바일 폭)에서도 1~2가 성립한다. 본문이 배지 아래로 내려가 다시 왼쪽 끝에 붙지 않는다.
5. 홈 칸 레일 한 줄 배치는 바뀌지 않는다.
6. 스크린샷(PR 또는 보고에 첨부):
   - 바꾸기 전: 본문이 배지 왼쪽과 같은 팝업(종현님 캡처를 써도 됨).
   - 바꾼 뒤: 넓은 폭에서 「새 이웃」 항목(『테』 정렬이 보이게), 같은 팝업에 배지 너비가 다른 항목이 함께 있는 모습, 긴 인삿말이 두 줄 이상인 모습, 480px(또는 모바일) 폭 1장.
7. diff는 `neighborhood-greeting-ui.js`의 팝업 항목 마크업, `neighborhood-greeting.css`, 작업 기록 정도만. 보고에 확인 방법(홈 → 동네 인사 「더보기」)을 적는다.

측정: 개발자 도구로 이름 버튼의 `getBoundingClientRect().left`와 본문(첫 줄)의 `left`가 같거나 1px 이내인지 확인하고, 보고에 두 항목(「새 이웃」, 「과외쌤」) 값을 적는다.

## 6. 열린 질문

- 없음.

## 공통 금지

- 새 브랜치에서 PR만 열고 보고. **머지·force push·운영 SQL 금지.** `reset --hard`, `stash drop` 금지.
- 키·비밀번호·세션값을 문서·커밋·보고에 쓰지 않음. 테스트 계정 비밀번호 포함.
- 범위 밖 버그는 고치지 말고 「발견 목록」에만.
- 데스크톱에서 이 팝업이 아닌 레이아웃을 1px도 변경하지 말 것.
