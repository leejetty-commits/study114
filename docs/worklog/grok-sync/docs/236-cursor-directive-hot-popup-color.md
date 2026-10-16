# 236 「지금 고민 HOT」 팝업 제목 바탕색 맞추기 — Cursor 지시서 (2026-10-16)

## 문제
오른쪽 레일 「지금 고민 HOT」 배너 제목 바탕은 빨강(#be123c)인데, 그 배너로 여는 HOT 팝업의 머리 바탕은 파랑(#266bc4)입니다.
- 배너: `preview/home-ui/src/styles/home-right-rail.css` 41-43행 `.live-rail-slot--field { --rail-tone: var(--rail-tone-hot); }` (9행 `--rail-tone-hot: #be123c`)
- 팝업 머리: 같은 파일 674-681행 `.rail-popup__head`는 `--rail-tone`을 씁니다. 그런데 637-647행에는 `concern-room`·`concern-best`·`info-board`만 있고 `concern-hot`이 없습니다(팝업 종류 이름은 `home-ui/src/concern/rail-concern-popup.js:233`). 그래서 기본 파랑이 나옵니다.

## 할 일 (이것만)
`preview/home-ui/src/styles/home-right-rail.css`의 637-647행 부근(`concern-best` 규칙 바로 아래)에 아래 한 줄을 추가합니다.
```css
.rail-popup[data-rail-popup-kind='concern-hot'] { --rail-tone: var(--rail-tone-hot); }
```

## 작업 범위 (꼭 지킬 것)
- 손대도 되는 파일은 **`preview/home-ui/src/styles/home-right-rail.css` 하나**뿐입니다.
- 다른 팝업 색, 배너 색, 색 값(`--rail-tone-*`)은 건드리지 않습니다.
- 범위 밖을 고쳐야 할 것 같으면 **멈추고 보고**합니다.

## 순서
1. origin/main에서 새 브랜치 `cursor/236-hot-popup-color-20261016`을 만듭니다.
2. 위 한 줄을 추가합니다.
3. 이 파일만 지정해서 add합니다(`git add -A` 금지). 커밋 메시지는 `236 fix(rail): HOT 팝업 머리 색을 HOT 배너 빨강과 맞춤`으로 합니다.
4. 브랜치를 push하고 **멈춥니다**. main에 합치지 않습니다. force push는 하지 않습니다.

## 확인 방법
- `git diff origin/main --stat` 결과가 1파일, +1줄인지 봅니다.
- 홈·찾기·카탈로그(공부방/과외쌤/학생) 화면에서 「지금 고민 HOT」 팝업을 열고, 제목 바탕이 빨강 #be123c인지 봅니다.
- 고민방 팝업(보라), 이달의 베스트 팝업(빨강), 정보 게시판 팝업(회색)의 색이 그대로인지 봅니다.

## 보고
브랜치 이름, 커밋 번호, diff 줄 수, 화면을 확인한 결과를 보고합니다.
