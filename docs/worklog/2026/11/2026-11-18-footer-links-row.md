# 639px 푸터 링크를 가로로

기준: `origin/main` `fbb0788a` (PR #261).  
브랜치: `work/footer-links-row-639`  
작업 트리: `D:\work\study114\.wt\work-footer-links-row-639`

## 진단

`udx-std-apply.css` 790행 `@media (max-width: 639px)` 안은 아래와 같았다.

- 795행 `.site-footer__links, .home-footer__links`: `flex-direction: column`, `width: 100%`
- 801행 `.site-footer__links a, .home-footer__links a`: `width: 100%`, `min-height: var(--btn-h)`
- 791행 `.site-footer__sep { display: none }`

지시와 같아서 링크 묶음과 링크 두 규칙만 바꿨다. 구분선 숨김, 640px 이상, 회사정보·안내문은 그대로다.

## 고친 곳

639px 이하에서 링크 묶음은 가운데로 감싸는 가로 줄이다. 칸 간격 4px, 줄 간격 0. 링크 너비는 글자 너비이고 높이는 40px이다.
