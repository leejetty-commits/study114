# 14d 홍보 채널 간격 + 공통 헤더 계정 링크 + 증빙 안내

기준: `origin/main` `f94483fd` (PR #256).  
브랜치: `work/14d-promo-channel-gap`  
작업 트리: `D:\work\study114\.wt\work-14d-promo-gap`

## 0단계

| 확인 | 결과 |
|---|---|
| 홍보 HTML | `promo-links.js` `renderPromoChannelFields`. 바깥은 `.register-promo-channels[data-promo-channels]`. 자식은 숨은 입력, 유튜브 `.form-group`, `> .register-plus-btn`, `> .register-hint`, `> .register-promo-blog`, 그 다음 인스타·틱톡·네이버 클립 `.form-group` 세 개. 이 파일은 수정하지 않음 |
| 감싸는 틀 | 과외쌤 상세등록·공부방 상세등록은 `register-card register-flow` 안의 `form[data-form]`. 과외쌤 마이페이지 상세정보2는 `mp-room-embed register-flow`. 공부방 마이페이지는 `renderRegisterCardInner`가 `register-flow`를 붙이고, `?edit=1`일 때 `form[data-form="facility"]` |
| CSS 적재 | `register-flow.css`는 home-ui·tutor-ui·study-room-ui `main.js`가 읽음. 맨 끝은 749행 `}` |
| `site-chrome.js` 72행 | span `class="home-util__account"` `title` 「로그인: ○○」. `homeHashUrl`는 이미 import |
| `step-contact.js` | 94행 `</label>`, 95행 `</div>`. 체크박스 `name="proof_document_available"` |

선택자는 그 HTML에 맞다. 768px 이상에서 `> .form-group:nth-last-child(-n+3)`는 인스타·틱톡·네이버 클립 세 칸이다. 버튼 색 규칙은 그대로 두고 간격만 더한다.

PR #257은 같은 72행을 `HOME_UI_BASE` + `/#/mypage/account`로 바꿔 두었고 아직 머지되지 않았다. 이 브랜치는 main의 span에서 `homeHashUrl('/mypage/account')`와 `data-util-href`로 바꾼다.

## 고친 곳

- `register-flow.css` 맨 끝에 14d 블록만 추가.
- `site-chrome.js` 72행만.
- `step-contact.js` 94행과 95행 사이에 안내 `form-hint` 한 줄.

## 검증

기준 실패는 그대로다. 새로 실패한 검사는 없다.

| 검사 | 결과 |
|---|---|
| `verify:tutor-lesson-optional-step` | 통과 |
| `verify:tutor-register-same-tab` | 통과 |
| `verify:tutor-detail-fields-ssot` | 통과 |
| `verify:tutor-registration-check-frame` | 통과 |
| `verify:tutor-basic-required` | FAILED (8). 기존. PHP `mb_strlen`, renderBasic 미렌더, 지역 2·3 「(선택)」, 사진 업로드, 학교급 미리 선택, 슬로건·주 회수·지역 1 PHP |
| `verify:tutor-search-fields` | 66 PASS / 2 FAIL. 기존. 확대카드 손님 문구, 베이직 가로카드 사진 경로 |
| `verify:student-hope-hidden-required` | 기존 중단. `import.meta.env`의 `VITE_AUTH_UI_BASE` |
| hide-inquiry | FAILED 1 (pass 29). 기존. `(m) 추가 CSS는 .admin-shell` |

## 빌드

`scripts/build-dothome.ps1 -SkipInstall`. 패키지 `npm install`은 하지 않았다.  
산출 CSS에 `promo-channels` 규칙이 들어 있다.

- home `public/assets/index-D-89lB6t.css`
- tutor `public/register/tutor/assets/index-B5LlX8dO.css`
- study-room `public/register/room/assets/index-C-P8KwgY.css`

## 화면

로그인 세션이 아니다. 실제 `renderContactFormHtml`·`renderFacilityFormHtml` 결과와 위 빌드 CSS를 로컬에서 열었다. 폭은 iframe 안쪽 너비다.

| 화면 | 1440 | 390 |
|---|---|---|
| 과외쌤 학력·연락 | 2열 `222.4px 222.4px` | 1열 `315.2px` |
| 과외쌤 마이페이지 상세정보2 | 2열 `312px 312px` | 1열 `390.4px` |
| 공부방 시설 | 2열 `247.2px 247.2px` | 1열 `348.8px` |
| 공부방 마이페이지 상세정보2 | 2열 `247.2px 247.2px` | 1열 `348.8px` |

1440에서는 인스타·틱톡이 한 줄이고 네이버 클립은 아래다. 블로그 칸은 회색 카드다. 390에서는 한 줄이다. 버튼 색은 과외쌤 파랑, 공부방 기존 살구색 그대로다. 증빙 안내는 과외쌤 학력·연락에만 있다. 실계정 클릭은 확인하지 않았다.
