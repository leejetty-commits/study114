# 로그인 환영 줄 위치와 사라짐

기준: `origin/main` `97bfd295` (PR #260).  
브랜치: `work/login-welcome-toast`  
작업 트리: `D:\work\study114\.wt\work-login-welcome-toast`

## 진단

`login-welcome.js` 96행은 `setTimeout(() => el.remove(), 4200)` 뿐이었다. `welcome=1`을 한 번 읽고 `sessionStorage` 키 `study114.login-welcome-shown`이 `1`이면 다시 띄우지 않는다.

`udx-std-apply.css` 837행 `.login-welcome`은 `top: 1rem`, `z-index: 80`, `transform: translateX(-50%)`였다.

`home.css` 104–113행 `.home-header`는 105행 `position: fixed`, 109행 `z-index: 1000`이다. `--site-header-h` 정의는 `tokens.css` 153행 `4.75rem`이다. `home.css` 122행 fallback은 `5.5rem`이다.

지시와 같아서 환영 줄만 바꿨다. 헤더와 토큰은 그대로다.

## 고친 곳

- `.login-welcome`의 `top`만 헤더 아래로 내렸다. 0.4초 나타나고, 약 3.2초 머물고, 0.6초 사라진다. 합계 4.2초. 투명도와 아래로 0.375rem만 움직이고 가로 가운데는 유지한다. `prefers-reduced-motion`이면 애니메이션 없이 보인다.
- 제거는 `animationend`에 맞추고, 이벤트가 없어도 4.2초 `setTimeout`이 지운다. 보여 주는 조건은 그대로다.
