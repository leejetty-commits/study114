# 홈·찾기 카드 CSS 분할

## 지시

분할 계획 5번 `preview/home-ui/src/styles/home-listings.css`만 나눈다. 선택자·규칙 순서는 그대로 두고, 기존 파일 맨 위에서 나눈 파일을 순서대로 `@import` 한다. home-ui·search-ui의 `main.js` 경로는 바꾸지 않는다. 이 PR은 머지하지 않는다.

## 나눈 파일

| 파일 | 역할 |
|------|------|
| `home-listings-headings.css` | 제목·간격·티저·우측 레일 |
| `home-listings-cards.css` | 카드·목록 |
| `home-listings.css` | 비교·상세·마이박스. 위 둘을 `@import` |

이어 붙이면 원문과 같다. 원문을 읽던 검증 스크립트만 나눈 파일을 따라가게 고쳤다.
