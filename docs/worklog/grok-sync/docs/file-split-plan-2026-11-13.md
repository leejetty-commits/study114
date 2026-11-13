# 대형 파일 분할 계획 (2026-11-13)

기준 커밋: `origin/main` `4d40771` (PR #200 머지 후). 줄 수는 이 시점 기준이다.

선례: PR #200 (`search-find-surface.js`). 바깥은 기존 파일 이름만 부르고, 함수 이름·출력은 그대로 둔다. 원문 문자열을 검사하는 검증 스크립트만 옮긴 함수를 따라가게 고친다(예: `scripts/verify-guest-baseline-map-cards.mjs`처럼 세 파일을 이어 읽음).

공통 규칙

- 1파일 1PR. 머지하고 운영에서 확인한 뒤에 다음 파일로 간다. 다섯 파일을 한 PR에 넣지 말 것.
- 파일당 최대 3개(원래 파일 포함). 더 작게 남을 수 있으면 2개로 둔다.
- 화면 동작·함수 이름·CSS 선택자·규칙 순서는 바꾸지 않는다. 순환 import 금지.
- 실시간 매칭 구현은 이 분할이 모두 끝난 뒤에 시작한다. 겹칠 수 있는 파일은 아래에 표시한다.
- force push, `reset --hard`, 시크릿 기록 금지.

## 추천 순서

위험 낮고, 호출부가 단순한 것부터. CSS는 캐스케이드가 조용히 깨질 수 있어 JS 다음이다.

1. `a28-screens-bind.js` — 관리자만, 다시 내보내기 소비자가 거의 하나, 매칭과 무관.
2. `plans/screens.js` — 상품센터 JS. 마이페이지·등록 화면이 일부를 가져가므로 2번.
3. `mypage-ops.css` — home-ui만 불러 진입점이 하나. 매칭과 겹칠 수 있음.
4. `home-member-flows.css` — home-ui·search-ui 둘 다, `mypage-ops`와 선택자가 겹침. 매칭과 겹칠 수 있음.
5. `home-listings.css` — 두 앱의 로드 순서가 이미 다르고, 홈·찾기 제목/카드라 화면 비교가 가장 중요. 마지막.

## CSS 공통 지침

로드 방식(코드로 확인함)

- CSS는 HTML `@import`가 아니라 JS 엔트리에서 불러 Vite가 번들한다.
  - home-ui: `preview/home-ui/src/main.js`. 주석대로 `home-member-flows.css`는 앞쪽, `home-listings.css`는 `design-system.css` 뒤(섹션 제목·툴바 정본), `mypage-ops.css`는 `plans-theme.css`·`plans-store.css` 뒤.
  - search-ui: `preview/search-ui/src/main.js`. `home-listings.css` → `home-member-flows.css` 순이고, 둘 다 `design-system.css`보다 앞이다. `mypage-ops.css`는 쓰지 않는다.
- 이 상대 위치는 그대로 둔다. 두 앱의 순서가 다른 것도 맞추지 말 것.
- home-ui Vite는 `cssCodeSplit: false`(주석: CSS는 엔트리 하나로 유지). search-ui는 이 옵션이 없다.

나누는 방법

- `main.js` import 경로는 바꾸지 않는다. 원래 파일을 진입점으로 남기고, 맨 위에 상대 경로 `@import './…-part.css';`를 **원래 규칙 순서대로** 적는다. `@import` 앞에 규칙을 두지 말 것. Vite가 상대 `@import`를 인라인하므로, 운영 번들에 CSS 파일이 늘어나면 안 된다.
- 선택자·규칙 순서는 원문과 같아야 한다.

확인

- 원문 비교: 나눈 파일을 순서대로 이어 붙인 뒤(`@import`·파일 머리 주석만 제외) 원래 파일과 diff. 규칙이 같아야 한다.
- 빌드 비교: 분할 전후 `preview/home-ui`(해당하면 `search-ui`)에서 `npm run build`. `dist/assets/*.css` 개수가 늘지 않아야 한다. 파일명 해시·소스맵 주석만 정규화한 뒤 CSS 내용이 같거나, 내용 차이가 `@import` 인라인 흔적뿐인지 확인.
- 운영: 배포 후 홈·찾기 HTML의 `rel="stylesheet"` 개수와 네트워크 CSS 요청 수가 이전과 같은지 본다. 나눈 CSS를 HTML에 따로 넣거나, Vite가 인라인하지 않는 원격 `@import`를 쓰지 말 것.
- 화면: 해당 파일 범위의 홈·마이페이지·등록·찾기·관리자를 테스트 계정으로 이전과 비교한다. CSS는 모양이 조용히 달라질 수 있다.

---

## 1. `preview/home-ui/src/admin/a28-screens-bind.js` (2,518줄)

실시간 매칭: 겹치지 않음(관리자).

현재 구성

- 1–207: import. `a28-screens.js`를 이미 가져오므로, 새 파일이 `a28-screens-bind.js`를 다시 가져오면 순환이 된다. 금지.
- 208–550: 회원 삭제 모달, 해시·노출 로드 상태(`lastExposureLoad` 등), `bindTodaySlotNav`.
- 551–1892: `bindA28ScreenEvents` 분기. 권한 591–675, 회원 676–678, 등록 679, 커머스 681–746, 공지·게시판 747–1291, 신고·티켓·제출·노출 1292–1338, 설정·팝업 1339–1456, 알림·SMS 1457–1889, 오늘 허브 1890.
- 1893–2518: `bindMembersScreen`, `bindReportsScreen`, `bindTicketsScreen`, `bindExposureScreen`, `bindHomePopupForm`.

나눌 파일 (3개)

| 파일 | 담을 내용 | 예상 줄 |
|------|-----------|--------:|
| `a28-screens-bind-members.js` | 회원 모달·로드 상태, 커머스, 회원·신고·티켓·노출·팝업 bind | ~1,030 |
| `a28-screens-bind-content.js` | 공지·게시판, 설정, 알림·SMS 본문 bind | ~1,100 |
| `a28-screens-bind.js` | `bindA28ScreenEvents` 분기, `bindTodaySlotNav`, 기존 7개 이름 다시 내보내기 | ~500 |

바깥은 계속 `a28-screens-bind.js`만 부른다. 공개 이름: `bindTodaySlotNav`, `bindA28ScreenEvents`, `bindMembersScreen`, `bindReportsScreen`, `bindTicketsScreen`, `bindExposureScreen`, `bindHomePopupForm`.

위험

- 다시 내보내기 소비자: `a28-screens.js`(1983행 `export { bindA28ScreenEvents } from './a28-screens-bind.js'`), `admin/index.js`. 나머지 bind는 파일 안에서만 쓰이지만 이름은 그대로 내보내야 한다.
- `a28-screens.js` ↔ `a28-screens-bind.js` 순환이 이미 있다. 새 파일은 `a28-screens.js`·스토어만 가져오고, `a28-screens-bind.js`를 import하지 말 것. 공유 상태(노출·회원 로드 캐시)는 쓰는 함수와 같은 파일에 두거나 접근 함수로만 연다.

확인

- 공개 함수 7개 이름·`typeof === 'function'`을 Vite로 불러 확인.
- 검증 스크립트가 이 파일을 원문으로 읽으면 선례처럼 세 파일을 이어 읽게 수정. 현재 `scripts/`에는 경로 참조가 없다. 나누기 전에 다시 검색할 것.
- 관리자: 오늘 허브, 회원(삭제·일괄), 공지, 설정·팝업, 알림·SMS, 노출, 정산.

---

## 2. `preview/home-ui/src/plans/screens.js` (2,792줄)

실시간 매칭: 겹칠 수 있음(쪽지권·노출·프라임 대기·구매이력. 매칭 알림·프라임 광고 지역과 인접).

현재 구성

- 1–173, 248–741: 상태 hydrate, 티어 캐시, 자격(`getEligibility`), 배너 헬퍼.
- 174–247: 체크아웃 견적 상태(위 구간 사이에 끼어 있음. 옮길 때 주문 쪽으로).
- 742–1569: 상품 카드, `renderPlansHome`·`Positions`·`Access`·`My`.
- 1570–2139: 결제내역(329/330), 체크아웃, 결과.
- 2141–2792: `renderPlansScreen`, `bindPlansScreenEvents`.

공개 이름 20개. 바깥 호출부(이 경로만 유지):

- `plans/index.js`: `renderPlansScreen`, `bindPlansScreenEvents`
- `mypage/index.js`: `bindPlansScreenEvents`
- `mypage/screens.js`: `renderPlansHistory`, `schedulePlansStatusHydrate`, `resetPlansStatusSync`, `plansStatusFlags`
- `tutor-reg/screens.js`, `study-room-reg/screens.js`: `readTierCheck`, `scheduleTierCheckHydrate`
- `plans/order-blocks.js`: `tierPurchaseGate`

나눌 파일 (3개)

| 파일 | 담을 내용 | 예상 줄 |
|------|-----------|--------:|
| `screens-status.js` | 1–173·248–741. 티어·자격·상태 hydrate | ~760 |
| `screens-orders.js` | 174–247 + 1570–2139. 이력·체크아웃·결과 | ~720 |
| `screens.js` | 상품 카드·홈/노출/쪽지권/이용현황, 라우트·이벤트, 20개 이름 다시 내보내기 | ~1,500 |

`screens-status.js`·`screens-orders.js`는 `screens.js`를 import하지 말 것. 주문 쪽이 티어·자격을 쓰면 `screens-status.js`에서 가져온다. 모듈 상태(`historyCache`, 티어 캐시, 견적 키)는 한곳에만 둔다. `bindPlansScreenEvents` 이름은 그대로 `screens.js`에 두고, 필요하면 내부 헬퍼만 주문 파일로 뺀다.

확인

- Vite로 20개 공개 함수가 그대로인지 확인.
- 검증 스크립트 경로 검색 후, 있으면 선례대로 이어 읽게 수정. 현재 `scripts/` 참조 없음.
- 상품홈·노출·쪽지권·이용현황·결제내역(탭·환불 칸)·체크아웃·결과. 공부방/과외 등록의 픽·프라임 게이트, 마이페이지 구매이력이 깨지지 않는지.

---

## 3. `preview/home-ui/src/styles/mypage-ops.css` (2,551줄)

실시간 매칭: 겹칠 수 있음(마이페이지 셸·내 등록·쪽지함. 「실시간 매칭서비스」 메뉴가 여기 스타일을 탈 수 있음).

현재 구성

- 1–718: 레이아웃·사이드바·본문 헤드·패널, 마이 홈, 반응형.
- 719–930: 내 문의(P17-07).
- 931–1873: 과외 내 등록(`.p21`), 공부방 운영(`.mp-room`), 픽·프라임 임베드.
- 1874–2551: 내 공지, 공통 섹션카드, 구매이력 행, 쪽지·후기함, 계정설정.

나눌 파일 (3개)

| 파일 | 담을 내용 | 예상 줄 |
|------|-----------|--------:|
| `mypage-ops-shell.css` | 1–718 레이아웃·사이드바·마이 홈 | ~720 |
| `mypage-ops-register.css` | 719–1873 문의·과외/공부방 내 등록 | ~1,160 |
| `mypage-ops.css` | 1874–2551 + 위 둘을 순서대로 `@import` | ~680 + import 2줄 |

위험

- 진입점은 `preview/home-ui/src/main.js` 한 곳. 이 한 줄의 위치는 그대로.
- `home-member-flows.css`와 선택자가 약 108개 겹친다(`.mypage-home`, `.account-card`, `.mypage-nav`, `.msg-row` 등). flows가 먼저, ops가 나중이다. 순서를 바꾸면 마이페이지 모양이 달라진다.
- 더 뒤의 `udx-std-apply.css`, `student-mypage-stage5b.css`와도 겹칠 수 있다. 이 파일들 위치는 건드리지 말 것.

확인: CSS 공통 + 마이페이지(학생·공부방·과외) 홈·사이드바·내 등록 탭·구매이력·쪽지함·계정설정. 모바일 메뉴 줄바꿈(C-11).

---

## 4. `preview/home-ui/src/styles/home-member-flows.css` (2,522줄)

실시간 매칭: 겹칠 수 있음(학생 기본등록 P19, 공부방 P20·과외쌤 P21 등록/쪽지설정, 쪽지 말풍선).

현재 구성

- 1–225: 상세 모달(P24), 찜·비교 바.
- 226–1376: 계정설정, 마이 홈·빈 상태, P15-10.
- 1377–2217: 공부방 P20 쪽지·문의, 과외 P21 허브, 학생 P19 등록.
- 2218–2522: 상품 카탈로그 조각, 쪽지(`.msg-*`), 과외 쪽지설정 P21-05.

나눌 파일 (2개면 충분)

| 파일 | 담을 내용 | 예상 줄 |
|------|-----------|--------:|
| `home-member-flows-account.css` | 1–1376 모달·계정·마이 홈 | ~1,380 |
| `home-member-flows.css` | 1377–2522 등록·쪽지 + 앞 파일을 `@import` | ~1,150 + import 1줄 |

3개로 더 쪼갤 필요는 없다. 2개로도 1,700줄 이하다.

위험

- 진입점 2곳: `home-ui/src/main.js`(앞쪽), `search-ui/src/main.js`(`home-listings.css` 다음, `design-system.css` 앞). 둘 다 경로를 바꾸지 말 것.
- `mypage-ops.css`와 선택자 겹침은 3번과 같다. 이 파일이 먼저 로드되어야 한다.
- `home-listings.css`와도 `.p24-modal` 등이 조금 겹친다. listings의 앱별 위치는 그대로.

확인: CSS 공통 + 상세 모달, 계정설정, 마이 홈, 학생/공부방/과외 등록, 쪽지 화면. search-ui에서도 상세·비교가 그대로인지.

---

## 5. `preview/home-ui/src/styles/home-listings.css` (2,593줄)

실시간 매칭: 거의 없음(카드에는 매칭 조건을 넣지 않기로 함). 홈·찾기 카드·제목바만 해당.

현재 구성

- 1–433: 섹션 제목·툴바, 프라임/픽/베이직 간격.
- 434–935: 학생 티저, 우측 레일.
- 936–2018: 노출 그리드·카드(`.expo-*`), 목록 행, 카드 시각층·베이직 배지.
- 2019–2593: 비교 모달, 학생 공개 미리보기, 상세 조각, 마이박스, 활동 막대.

나눌 파일 (3개)

| 파일 | 담을 내용 | 예상 줄 |
|------|-----------|--------:|
| `home-listings-headings.css` | 1–935 제목·간격·티저·우측 레일 | ~940 |
| `home-listings-cards.css` | 936–2018 카드·목록 | ~1,090 |
| `home-listings.css` | 2019–2593 + 위 둘을 순서대로 `@import` | ~580 + import 2줄 |

2개로 나누면 뒷파일이 약 1,660줄이라 3개가 낫다.

위험

- 진입점 2곳이고 순서가 다르다. home-ui는 `design-system.css` 뒤, search-ui는 `design-system.css`보다 앞. 건드리지 말 것.
- 제목바·카드 간격은 주석대로 이 파일이 정본이다. 규칙 순서가 바뀌면 홈·찾기 여백만 달라질 수 있다.

확인: CSS 공통 + 게스트/학생/공부방/과외 홈과 찾기(프라임·픽·베이직 제목, 카드, 비교, 우측 레일). 두 앱 모두.

---

## Cursor 명령 (1번 파일만)

```
origin 브랜치 docs/file-split-plan-2026-11-13 의
docs/worklog/grok-sync/docs/file-split-plan-2026-11-13.md 를 읽고,
1번 파일(preview/home-ui/src/admin/a28-screens-bind.js)만 지침대로 나누세요.
화면 동작·함수 이름·출력은 바꾸지 말고, 기존 파일은 같은 이름으로 다시 내보내세요.
PR까지 만들고 머지 전 보고해 주세요. 다른 파일 분할·실시간 매칭 구현은 하지 마세요.
```
