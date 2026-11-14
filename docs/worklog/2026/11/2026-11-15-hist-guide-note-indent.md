# 구매이력 버튼 안내 마지막 줄 들여쓰기

지시: `origin/main` 최신에서 마이페이지 구매이력 「버튼 안내」(`HISTORY_GUIDE_COPY`, `mypage-ops.css`)의 마지막 줄 「흐리게 보이는 버튼은…」이 위 내역·진행상황·종료·소멸의 설명 칸 시작과 같게 들여쓰기되도록 CSS만 고친다. 모바일 폭도 확인. PC·모바일 스크린샷. 새 브랜치로 PR만. 머지 금지.

## 수정

- `preview/home-ui/src/styles/mypage-ops.css`
- 마지막 줄(`plans-hist-guide__note`)의 `padding-left`를 라벨 칸 `4.5rem` + 칸 간격 `0.6rem`으로 둔다. 480px 이하에서는 설명 칸이 왼쪽으로 내려가므로 `padding-left: 0`.

## 확인

구매이력 경로는 로그인 게이트가 있어, 미리보기에서 `renderPlansHistory()`가 그리는 안내 블록을 실제 CSS로 재었다.

| 폭 | 설명 칸 글자 시작 | 마지막 줄 글자 시작 | 차이 |
|---|---:|---:|---:|
| 1280 | 375.6px | 375.6px | 0 |
| 390 | 34px | 34px | 0 |

- `docs/worklog/2026/11/shots-hist-guide-note/pc-1280.png`
- `docs/worklog/2026/11/shots-hist-guide-note/mobile-390.png`
