# 모바일 햄버거 메뉴 — 반폭·오른쪽 정렬·플로팅 숨김·문의하기 (2026-11-14)

- 기준: `origin/main` `ead5ec91`
- 지시: 최신 main에서 브랜치를 만들고, `origin/docs/mobile-hamburger-half-2026-11-14`의 `docs/worklog/grok-sync/docs/mobile-hamburger-half-2026-11-14.md`만 따라 모바일 햄버거를 수정. 커밋·PR까지. 머지 금지. force push 금지. 실시간 매칭 파일 금지.
- 워크트리: `D:\work\study114\.wt\work-mobile-hamburger-half` (`work/mobile-hamburger-half`)
- 실행·1차 셀프검수: Cursor. 최종검수·머지 승인 전.

## 한 일

- 모바일(`max-width: 899px`) 드로어 너비를 `50vw`, 최소 `12.5rem`.
- 같은 구간에서 메뉴 항목을 오른쪽 정렬. 헤더의 「메뉴」와 닫기는 그대로.
- `body.is-drawer-open`으로 맨 위·맨 아래·문의하기 플로팅을 숨김. 열 때 플로팅 문의 패널을 닫음.
- 드로어 맨 아래에 「문의하기」. 문구·순서·링크는 기존 플로팅과 같음.
- home-ui `renderHeader`와 공통 `renderSiteHeader` 둘 다.

## 셀프검수

로컬 프리뷰. 홈 `http://127.0.0.1:5174`, 로그인 `http://127.0.0.1:5173`. 비로그인. 로컬 API `127.0.0.1:8080`은 연결되지 않아 로그인 세션 화면은 열지 못했다. 로그인 분기는 `renderDrawerInquiryMarkup(true/false)` 결과로 확인했다.

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 390·360 메뉴 닫힘, 플로팅 보임 | 통과 | 390 닫힘에서 문의하기·맨 위(스크롤 후)·맨 아래 opacity 1. 360 닫힘 스냅샷에 세 버튼. `home-390-closed.png` |
| 2 | 390·360 메뉴 열림, 너비 약 1/2(360은 최소 200px), 오른쪽 정렬, 글자 안 잘림 | 통과 | 390 패널 200px(50vw 195px보다 최소 너비). 360 패널 200px(절반 180px). `text-align: right`, 소개영상 `scrollWidth` 넘침 없음. `home-390-open-inquiry.png`, `home-360-open.png` |
| 3 | 메뉴 맨 아래 문의하기. 로그인/비로그인 항목이 기존과 같음 | 부분 | 비로그인 홈·로그인 화면: 자주 묻는 질문, 카카오톡 문의. 운영문의 없음. 로그인 HTML은 함수가 자주 묻는 질문 → 운영문의 → 카카오톡 문의 순. 로그인 세션 캡처는 없음 |
| 4 | 열림 중 플로팅 숨김. 미리 연 문의 패널도 닫힘 | 통과 | 홈에서 플로팅 문의를 연 뒤 메뉴를 열자 `aria-expanded=false`, `is-open` 없음. 세 플로팅 `visibility: hidden`, `opacity: 0`, `pointer-events: none`. 로그인 화면 390도 동일 |
| 5 | 닫은 뒤 플로팅 복귀, 위치 유지 | 통과 | 홈 390 배경 클릭으로 닫힘. 맨 위·맨 아래·문의하기가 다시 접근성 트리에 있고 문의하기는 접힘 |
| 6 | 1280 회귀 없음 | 통과 | 새로 연 1280: 햄버거 `display: none`, GNB `flex`, 드로어 `hidden`, 맨 아래 `display: none`, 문의하기 opacity 1, body 클래스 없음. 패널 규칙 너비는 기존 `288px`(18rem). `home-1280-closed.png` |
| 7 | CSS 파일별 괄호 깊이 0 | 통과 | `home.css` 깊이 0. `design-system.css`는 수정하지 않음 |
| 8 | FAQ·운영문의·카카오 URL 기존과 동일 | 통과 | FAQ `#/support/faq`. 카카오 `https://pf.kakao.com/_xkeMNX/chat` + `target="_blank"` `rel="noopener noreferrer"`. 운영문의는 `inquiryContactUrl()` |
| 9 | 공통 금지·퀵매칭 파일 위반 없음 | 통과 | 변경은 헤더 드로어·플로팅 문의·`home.css`만 |
| 10 | home-ui와 공통 헤더 앱 모두 동일 동작 | 통과 | 홈과 로그인 화면. `auth-390-open-inquiry.png` |

## 360폭 최소 너비

`12.5rem` 적용. 360에서 패널 200px, 소개영상 잘림 없음(한 줄, 높이 45px). 너비를 더 키우지 않음.

## 발견 목록 (이번 범위 밖, 수정하지 않음)

- 로컬 API가 없어 홈 목록·공지 일부가 불러오기 실패 문구를 보임.
- 메뉴를 연 채로 1280으로 늘리면 드로어 DOM이 열린 채로 남음. 햄버거는 숨고, 플로팅 숨김 규칙은 899px 이하에만 두어 데스크톱 플로팅 스타일은 그대로다.

## 승인

- 이 세션은 자기 작업을 승인하지 않음.
- 머지는 최종검수 후 종현 승인.
