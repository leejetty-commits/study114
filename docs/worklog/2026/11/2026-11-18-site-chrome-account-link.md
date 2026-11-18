# 공통 헤더 로그인 표시를 계정설정 링크로

기준: `origin/main` `f94483fd` (PR #256).  
브랜치: `work/site-chrome-account-link`  
작업 트리: `D:\work\study114\.wt\work-site-chrome-account`

## 0단계

`preview/shared/site-chrome.js` 72행은 span `class="home-util__account"` `title` 「로그인: ○○」. `HOME_UI_BASE`는 이미 import. 같은 파일 100행 `supportHubUrl`이 `${String(HOME_UI_BASE).replace(/\/$/, '')}/#/support` 로 홈 해시를 만든다. `home-ui` `layout.js` 102행은 이미 `<a href="#/mypage/account">` 이다. 이 파일은 홈 밖 헤더라 앞에 `HOME_UI_BASE`를 붙인다.

## 고친 곳

72행만. span을 같은 class·title의 `<a>`로 바꿈. 주소는 `HOME_UI_BASE` 끝 슬래시를 뺀 뒤 `/#/mypage/account`. 글자는 「로그인: ○○」 그대로. 다른 줄은 그대로.

## 검증

- 네 tutor verify 통과.
- `verify-tutor-basic-required` 실패 8건. Tutor search fields 66 통과 2 실패. Student hope hidden required는 `import.meta.env` 없음. Hide inquiry bundle 29 통과 1 실패 (`(m) 추가 CSS는 .admin-shell`). 새 실패 없음.
- `npm run build:dothome` 종료 코드 0.
- 공부방·과외쌤·학생 일반·시크릿 실클릭은 미확인.
