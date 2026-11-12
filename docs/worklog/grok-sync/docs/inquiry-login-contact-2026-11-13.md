# 문의하기 — 로그인이면 운영문의 (2026-11-13)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: 최신 main에서 `work/inquiry-login-contact` 워크트리. `D:\work\study114\.wt\` 안에만 만든다.
- 관련: 카카오톡 문의 PR #196 (이미 머지·배포됨). FAQ·카카오톡 문의 항목은 유지.

## 종현 확정 (2026-11-13)

- 로그인: 사이트 「문의하기」패널의 둘째 항목은 **고객센터 운영문의**로 간다. 라벨은 「운영문의」.
- 비로그인: 지금처럼 외부 메일 앱. 라벨은 「이메일 문의」. 받는 사람은 `help@study114.net`.
- 「자주 묻는 질문」「카카오톡 문의」는 바꾸지 말 것.
- 카카오 JS SDK·외부 위젯·푸터는 손대지 말 것.

## 구현

1. 상수·URL은 `preview/shared/inquiry-contact.js`에 모은다. 운영문의는 `supportUiUrl('/support/contact')`를 쓴다(`preview/shared/preview-links.js`). home-ui 밖(등록·검색·로그인 화면)에서도 고객센터로 가야 한다. 해시만 쓰면 다른 패키지에서 깨질 수 있다.
2. 패널 항목은 `preview/shared/back-to-top.js`에서 로그인 여부에 따라 라벨·href를 바꾼다.
   - 로그인 판별은 `preview/shared/guest-gate-ui.js`의 `isViewerLoggedIn`과 **같은 방식**을 쓴다: `isChromeLoggedIn() || authRoleType() !== ''`.
   - `preview/home-ui/src/auth-session.js`를 shared에 직접 import하지 말 것(auth-ui 번들에 home-ui가 딸려 들어간다).
   - 패널을 한 번만 그려 두고 로그인 뒤에도 옛 링크가 남지 않게, 열 때 또는 `auth:login` / `auth:logout` / `auth:session-hydrated`에 항목을 다시 맞춘다.
3. 비로그인 `mailto:help@study114.net`은 유지한다. 메일 앱의 **받는 사람**에 이 주소가 들어가 있어야 한다. 주소를 패널에 따로 적거나 복사 버튼을 넣지 말 것. 메일 앱이 없는 기기에서 반응이 없는 것은 이번 범위에서 고치지 않는다.
4. SQL 없음. 서버·메일 템플릿 변경 없음.

## 금지 (공통)

- force push, `reset --hard`, `stash drop` 금지.
- 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음.
- 프로모 잠금 손대지 않음.
- 로컬 `D:\work\study114`, `D:\work\study114\.wt\work-368-photo-autofit`, `D:\work\study114\.wt\work-kakao-inquiry`, `D:\work\study114\.wt\work-359-refund-copy-unify` 는 건드리지 말 것. 더티 워크트리에서 rebase 하지 말 것.
- 커밋·push·PR까지. 머지는 우동공과3 최종검수 후 종현 승인으로.
- 범위 밖에서 발견한 버그는 고치지 말고 보고서 「발견 목록」에만 적음.

## 확인 (셀프검수)

- 캡처: 문의하기 패널을 연 상태. 비로그인(이메일 문의) · 로그인(운영문의). 가능하면 1280·390. 테스트 계정만, 실명 금지.
- 확인: 로그인 후 「운영문의」가 고객센터 운영문의 화면으로 가는지, 비로그인 「이메일 문의」클릭 시 메일 작성 창의 받는 사람이 `help@study114.net`인지, FAQ·카카오톡 문의가 그대로인지.
- 글자 수·유사도는 합격 기준으로 쓰지 말 것.

작업 기록은 `docs/worklog/2026/11/`에 남긴다.
