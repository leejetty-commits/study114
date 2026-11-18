# 768px 맨 아래로·문의 FAB 자리 규칙 삭제

기준: `origin/main` `cd334c0f` (PR #262).  
브랜치: `work/remove-768-bottom-fab`  
작업 트리: `D:\work\study114\.wt\work-remove-768-bottom-fab`

## 진단

`design-system.css`에서 확인한 내용은 아래와 같았다.

- 483행 `@media (max-width: 768px)` 안 `.back-to-bottom { display: inline-flex; }`
- 514행 `@media (max-width: 768px)` 안 `.inquiry-fab { bottom: calc(1.25rem + 2 * (2.75rem + 8px)); }`
- 478행 `.back-to-bottom` 기본값은 `display: none`
- 495행 `.inquiry-fab` 기본 `bottom`은 `var(--inquiry-fab-stack)`

지시와 같아서 그 두 미디어쿼리만 지웠다. `back-to-top.js`와 데스크톱 규칙은 그대로다.

지운 문의 FAB 블록 바로 위에 있던 주석 `모바일: 맨 아래로 자리 위`는 다음 규칙에 붙어서, 그 한 줄도 뺐다. `.back-to-bottom` 위 주석은 그대로다.

## 고친 곳

768px 이하에서도 `.back-to-bottom`은 `display: none`이고, `.inquiry-fab`의 `bottom`은 `var(--inquiry-fab-stack)`이다.
