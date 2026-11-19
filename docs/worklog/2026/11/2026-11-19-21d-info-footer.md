# 21d /info/ 푸터를 메인 푸터와 같게

- 기준: `origin/main` `f07c5c3f` (PR #276)
- 2026-11-19. `/info/` 네 HTML의 푸터와 그 인라인 스타일만 메인 푸터 모양으로 바꿨다. 회사 정보 문구는 그대로 두고, 맨 위 링크 7개로 「이용약관·개인정보처리방침」 한 줄을 바꿨다.

메인 푸터 정본은 `preview/shared/site-footer.js`와 `preview/home-ui/src/styles/udx-std-apply.css`다. `src` 아래 `site-footer.js`는 없다.

## 확인

- 375·1440에서 `/info/` 푸터와 운영 홈 푸터를 나란히 찍었다. 배경 `#334155`, 링크 14px·굵기 500, 개인정보 처리방침 굵기 700, 푸터 높이 1440에서 267px·375에서 385px로 같다.
- 네 페이지 모두 375·1440 가로 넘침 0.
- 링크 7개: 이용약관 `/#/support/policies/terms`, 개인정보 처리방침 `/#/support/policies/privacy`, 플랫폼 고지 `/#/support/policies/platform`, 유료상품 `/#/plans/positions`, 환불정책 `/#/plans`, 서비스 소개 `/info/`, 고객센터 `/#/support`. 클릭 시 그 주소로 이동한다.

머지 커밋과 Deploy run 번호는 머지 뒤에 생긴다.
