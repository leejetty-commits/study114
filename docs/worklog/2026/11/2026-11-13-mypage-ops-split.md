# 마이페이지 운영 CSS 분할

## 지시

분할 계획 3번 `preview/home-ui/src/styles/mypage-ops.css`만 나눈다. 선택자·규칙 순서는 그대로 두고, 기존 파일 맨 위에서 나눈 파일을 순서대로 `@import` 한다. `main.js` 경로는 바꾸지 않는다. 이 PR은 머지하지 않는다.

## 나눈 파일

| 파일 | 역할 |
|------|------|
| `mypage-ops-shell.css` | 레이아웃·사이드바·마이 홈 |
| `mypage-ops-register.css` | 문의·내 등록 |
| `mypage-ops.css` | 공지·구매이력·쪽지·계정. 위 둘을 `@import` |

이어 붙이면 원문과 같다. 원문을 읽던 검증 스크립트만 나눈 파일을 따라가게 고쳤다.
