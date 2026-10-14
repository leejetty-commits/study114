# 작업 A 리포트 — 홍보 화면 3칸 유지 + 홈 상단 여백 8px (218-1·2·3)

작성: Cursor 메인 에이전트, 2026-10-14. 지시서 `docs/design/home-banner-rail-2026-10-14/220-cursor-directive-A.md`. 기준 main `b67f4ba9` (지시서 기준 `00ae04e`의 뒤).

## 브랜치

- 브랜치: `cursor/home-a-banner-gap-20261014`
- 커밋: `a7ce638749e331659c719099fbf3043332e03348` (`a7ce6387`)
- main 병합: 하지 않음. 검수·승인 전.

## 2절 행 번호

고치기 전 `origin/main`에서 2절 표와 같았음. 멈추지 않고 진행.

| 파일 | 행 | 확인 |
|---|---|---|
| `preview/home-ui/src/promo/shell.js` | 8 | `import { STUDY_ROOM_PROMO } from './study-room-content.js';` |
| 같은 파일 | 11 | `const role = getNavRole();` |
| 같은 파일 | 16-17 | `const mainHtml = \`` 다음 줄 `<div class="promo-layout">` |
| `preview/home-ui/src/styles/home-marketing-banner.css` | 117-122 | `.home-promo-trio` margin은 121행 `var(--space-5, 1.25rem)` |
| 같은 파일 | 202-207 | `.home-news-row` margin은 206행. 이번 커밋에서 그대로 |
| 같은 파일 | 337-340 | `.home-mkt-wrap` margin-bottom은 339행 |
| 같은 파일 | 342-344 | `.home-mkt-wrap .home-promo-trio` margin-bottom 0은 343행 |

## 바꾼 파일과 행

허용 파일 2개만. 브랜치 커밋에 다른 파일 없음.

1. `preview/home-ui/src/promo/shell.js`
   - 9행: `renderHomeMarketingBanner` import
   - 18행: 홍보 본문 앞에 `${renderHomeMarketingBanner(role)}`
2. `preview/home-ui/src/styles/home-marketing-banner.css`
   - 121행: `.home-promo-trio` margin `space-5` → `space-2` (8px)
   - 339행: `.home-mkt-wrap` margin-bottom `space-5` → `space-2`
   - 342-344행: `.home-news-row:has(+ .provider-home-tabs)` margin-bottom `space-2` 추가
   - 347행: `.home-mkt-wrap .home-promo-trio` margin-bottom `0` → `space-2`
   - 206행 `.home-news-row` 기본 margin은 그대로 `space-5`

## 직접 잰 값 (전 → 후)

로컬 `http://127.0.0.1:5179`. 역할은 `/api/auth/me.php` 응답을 흉내 냄. gap1 = 3칸 아래 → 공지 위. gap2 = 공지 아래 → 탭 위. 단위 px.

| 모드 | 폭 | gap1 전 → 후 | gap2 전 → 후 | 홍보 화면 ×3 |
|---|---|---|---|---|
| 공부방 | 1280 | 0 → **8** | 20 → **8** | 3칸 1줄, 카드 3 |
| 공부방 | 1023 | 0 → **8** | 20 → **8** | 같음 |
| 공부방 | 390 | 0 → **8** | 20 → **8** | 같음 (1열) |
| 과외쌤 | 1280 | 20 → **8** | 20 → **8** | 같음 |
| 과외쌤 | 1023 | 20 → **8** | 20 → **8** | 같음 |
| 과외쌤 | 390 | 20 → **8** | 20 → **8** | 같음 |
| 학생 | 1280 | 20 → **8** | 20 → **8** | 같음 |
| 학생 | 1023 | 20 → **8** | 20 → **8** | 같음 |
| 학생 | 390 | 20 → **8** | 20 → **8** | 같음 |
| 비회원 | 1280 / 1023 / 390 | 20 → **8** | 탭 없음 | 같음 |

공통:

- 모든 화면 `trioCount` = 1, `cards` = 3. 순서는 공부방 카탈로그 → 과외쌤 카탈로그 → 우리동네 학생.
- 카드 사이 가로 간격: 1280·1023은 12px. 390은 1열.
- 비회원 공지 아래(다음 칸까지)는 20px 그대로. 계산된 margin-bottom도 `20px`.
- 홈 4모드에서 3칸·공지·탭 높이 불변. 1280·1023: 3칸 108, 공지 79, 탭 53. 390: 3칸 348, 공지 169, 탭 53. 비회원은 탭 없음.
- 홍보 화면에서 과외쌤 카드를 누르면 `#/promo/tutor`로 이동하고 3칸이 그대로 있음 (공부방 로그인, 1280).
- 우측 레일 class 문자열: 비교한 48화면 모두 변경 전과 같음.
- 콘솔에 새로 생긴 오류 종류 없음.

## 스크린샷

`docs/worklog/2026/10/img/2026-10-14-home-a/`

- 홈 1280·390: `guest-home-*`, `study-room-home-*`, `tutor-home-*`, `parent-home-*`
- 홍보 3화면 1280 (공부방 로그인): `study-room-promo-study-room-1280.png`, `study-room-promo-tutor-1280.png`, `study-room-promo-parent-1280.png`

## 지시와 다르게 한 점

- 이 PC에 Python이 없어, 지시서의 Python 스크립트와 같은 페이지·폭·선택자·로그인 흉내를 Node Playwright + 설치된 Chrome으로 재었다.
- 요소가 그려질 때까지 기다린 뒤 400ms를 더 뒀다. 고정 1500ms만 쓰지 않았다.
- 스크린샷은 브랜치 커밋에 넣지 않고 이 리포트와 함께 main 기록에 넣었다. 브랜치 커밋은 허용 파일 2개만 있게 하려고.

## 확인하지 못한 항목

- 운영 사이트. 이 브랜치는 main에 합치지 않았고 배포하지 않았다.
- 로컬 PHP(8080)가 꺼져 있어 공지·레일 글은 「글을 불러오는 중」이다. 칸 위치와 레일 class는 재었다. 지도 키 문구도 원래 로컬에 있는 것이다.
- 홍보 카드 클릭은 공부방 로그인·1280·과외쌤 카드 1번만 눌렀다. 나머지 홍보 화면은 열어 3칸이 있는지만 확인했다.
