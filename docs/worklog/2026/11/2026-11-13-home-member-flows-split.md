# 회원 흐름 CSS 분할

## 지시

분할 계획 4번 `preview/home-ui/src/styles/home-member-flows.css`만 나눈다. 선택자·규칙 순서는 그대로 두고, 기존 파일 맨 위에서 앞부분을 `@import` 한다. home-ui·search-ui의 `main.js` 경로는 바꾸지 않는다. 이 PR은 머지하지 않는다.

## 나눈 파일

| 파일 | 역할 |
|------|------|
| `home-member-flows-account.css` | 상세 모달·계정·마이 홈 |
| `home-member-flows.css` | 등록·쪽지. 앞 파일을 `@import` |

이어 붙이면 원문과 같다. 원문을 읽던 검증 스크립트만 나눈 파일을 따라가게 고쳤다.
