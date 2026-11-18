# 해시가 바뀔 때만 맨 위 + 767px 고객센터 메뉴 static

기준: `origin/main` `72f91e97` (PR #259).  
브랜치: `work/hash-scroll-nav-static`  
작업 트리: `D:\work\study114\.wt\work-hash-scroll-nav-static`

## 진단

`main.js` 633행 `hashchange`에는 `scrollTo`가 없었다. 637행은 `event.isTrusted && window.location.hash === paintedHash`이면 같은 주소 다시 그리기를 건너뛴다. `navigate()`와 공부방 탭은 `new Event('hashchange')`로 같은 주소를 다시 그린다. 이 이벤트에는 `oldURL`/`newURL`이 없다.

`home-support-guide.css` 48행 `.sup-nav`는 `position: sticky`다. 50행 `@media (max-width: 767px)` 안에서는 52행 `.sup-nav--policy`만 `position: static`이었다.

지시와 같아서 그 범위만 바꿨다.

## 고친 곳

- `hashchange`에서 `render()`가 끝난 뒤, 이벤트 주소가 실제로 바뀌고 새 해시가 `#/`로 시작할 때만 `window.scrollTo(0, 0)`. 같은 주소 다시 그리기와 `#/`가 아닌 페이지 안 앵커는 올리지 않는다. 그리는 동안 주소가 다시 바뀌면 올리지 않는다.
- 767px 이하 블록 맨 앞에 `.sup-nav { position: static; }` 한 줄. sticky 규칙과 `.sup-nav--policy` 줄은 그대로다.
