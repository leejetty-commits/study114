# study114 모바일 점검 (2026-11-18, 운영 study114.net, main 140bc16e)

- 방법: 박스 headless Playwright(Chromium), iPhone UA·터치·DPR 3. **390×844 전부, 360×740은 1순위 화면만.** 읽기 전용(저장·제출·결제·쪽지·삭제 없음, SQL 없음).
- 측정: 상단 고정영역 아래로 가려진 글자, 가로 넘침(scrollWidth), 세로 잘림(overflow hidden), 고정 버튼(FAB)이 누를 것을 덮는지(elementFromPoint, 맨위·중간·맨아래 3지점), 버튼 높이, 입력칸 글자 16px 미만, 팝업 크기, 2열 이상 그리드, 개발자 문구.
- 결과 원본: `results.jsonl`(81개 주소, 96회 측정), 스샷 `shots/`.

## 범위 — 들어간 것 / 빠진 것
| 역할 | 결과 |
|---|---|
| 비로그인 | **완료.** 홈·유료상품(상품홈·노출상품·이용권)·공부방/과외쌤/학생찾기·로그인·회원가입 약관·아이디/비번 찾기·상세등록 안내(공부방/과외쌤)·커뮤니티 5·고객센터(FAQ 6, 공지, 문의, 약관·정책 9)·이용안내 12·자료실 6·홍보 3·서비스소개·햄버거 메뉴·로그인 유도 팝업. 390 73쪽 + 360 10쪽. |
| 공부방 | **못 함.** 박스 secrets.env 비밀번호로 운영 로그인이 거절됨(s1 1회, s2 1회, `이메일 또는 비밀번호를 확인해 주세요`). 잠김 방지로 더 시도하지 않음. |
| 과외쌤·학생 | **못 함.** 비밀번호가 Vault에만 있고, Vault는 에이전트에게 비밀번호 값을 주지 않아 headless 로그인에 쓸 수 없음. |

→ 마이페이지(내 등록·상세정보1·2·쪽지·계정설정), 상세등록 단계 화면, 역할별 홈은 **미점검**. 새 비밀번호를 secrets.env에 넣어 주시거나, 박스 브라우저에서 직접 로그인해 두시면 같은 스크립트(`crawl.mjs <role> 390 844`)로 이어서 돌립니다.

## 요약
- 오픈 전 필수 **3건**, 오픈 전 권장 **4건**, 오픈 뒤 **4건**.
- 가로 넘침: 측정한 81개 주소 모두 **0건**. 입력칸 16px 미만(아이폰 확대): **0건**. 개발자 문구·테스트 데이터: **0건**.

## 오픈 전 필수

### A1. 유료상품 첫 화면 위아래가 잘림 (제보 건 확인)
- 비로그인 / `https://study114.net/#/plans` / 390·360
- 무엇: 맨 위 큰 그림 상자에서 「유료상품」 작은 제목과 「무료로 시작하고,」 첫 줄 윗부분이 잘리고, 아래 두 번째 버튼(「쪽지권 보기」)도 반쯤 잘림. 헤더 밑으로 들어간 게 아니라 **상자 자체가 높이 208px로 고정**되어 글이 넘치는 것.
- 측정: 상자 `.plans-hub-cinema` 높이 208px·overflow hidden, 안쪽 글 244px(36px 넘침, 가운데 정렬이라 위로 18px·아래로 18px 잘림). h1 top 88px < 상자 top 95px.
- 스샷: `shots/guest-plans-390.png`, `shots/guest-plans-360.png`, `shots/full-guest-plans-390-p0.png`
- 원인: `preview/home-ui/src/styles/screen/plans-theme.css:1778-1785` (`@media (max-width:719px)`의 `height/min-height/max-height: 208px`). 720~1023px 구간도 `:1755-1760` 240px 고정이라 같은 위험.
- 고칠 것(최소): 719px 이하 블록에서 `height:auto; max-height:none; min-height:208px;` 로 바꾼다. 다른 화면 영향 없음(`.home-app--plans-hub` 범위).

### A2. 메뉴로 다른 화면에 가면 스크롤 위치가 그대로 → 새 화면 위쪽이 안 보임
- 비로그인 / 모든 홈 앱 화면(`#/…`) / 390·360
- 무엇: 홈에서 아래로 내린 뒤 햄버거 메뉴 → 「유료상품」을 누르면 유료상품 화면의 **중간~아래에서 시작**. 사용자는 위쪽(제목·탭)이 없어진 것처럼 보임. 「유료상품 상단이 헤더 밑으로 들어가 짤린다」 제보의 실제 원인일 가능성이 큼(A1과 겹쳐 보임).
- 측정: 홈 scrollY 1500 → 메뉴 「유료상품」 → 도착 scrollY **1034**(390)/**1162**(360), h1 top −946. 같은 현상: 메뉴 「커뮤니티」·「고객센터」 도착 scrollY 1500, 유료상품→노출상품 이동 scrollY 600 유지.
- 스샷: `shots/guest-plans-via-gnb-390.png`, `shots/guest-plans-via-gnb-360.png`
- 원인: `preview/home-ui/src/main.js:633-640` hashchange에서 `render()`만 하고 스크롤을 맨 위로 돌리지 않음(home-ui 전체에 route 변경 시 `scrollTo` 없음). 메뉴 클릭은 `preview/home-ui/src/layout.js:499-503`(서랍)에서 닫기만 함.
- 고칠 것(최소): `main.js` hashchange 핸들러에서 **경로(해시의 첫 두 단계)가 바뀐 경우에만** `render()` 뒤 `window.scrollTo(0, 0)`. 같은 화면 안 탭·필터(쿼리만 바뀜)는 그대로. 뒤로가기 위치 복원은 이번엔 하지 않음. 대안(더 좁게): `layout.js:499-503` 서랍과 `.home-gnb` 링크 클릭 때만 `scrollTo(0,0)`.

### A3. 자료실 모바일에서 위 메뉴 버튼들이 글 목록 위에 겹쳐 떠다님
- 비로그인 / `#/library`, `#/library/templates`, `#/library/guides`, `#/library/room-info`, `#/library/tutor-tips`, `#/library/student-tips` / 390
- 무엇: 스크롤하면 「자료실 입구·공부방 쏙쏙정보·과외쌤 따끈 팁가이드·학생 꿀팁 가이드·←고객센터」 버튼 묶음이 배경 없이 화면 위쪽(88~225px)에 붙어 따라오며 목록 제목을 가림.
- 측정: `nav.sup-nav` position sticky, top 88px, 높이 137px, 배경 투명. scrollY 500에서 목록 글과 겹침.
- 스샷: `shots/guest-library-scroll500-390.png`, `shots/guest-library_room_info-390.png`
- 원인: `preview/home-ui/src/styles/home-support-guide.css:48` `.sup-nav { position: sticky … }`. 767px 이하에서 `:52`는 `.sup-nav--policy`만 static으로 풀어 줌. (고객센터 쪽 `.support-app .sup-nav`는 `info-pages.css:183`에서 899px 이하 static이라 문제없음.)
- 고칠 것(최소): `home-support-guide.css` 767px 이하 블록(:50~)에 `.sup-nav { position: static; }` 한 줄 추가(또는 :52 선택자를 `.sup-nav`로 넓힘).

## 오픈 전 권장

### B1. 오른쪽 아래 고정 버튼 3개(문의하기·맨아래·맨위)가 버튼과 글을 가림
- 비로그인 / 거의 전 화면 / 390·360. 360에서 더 심함.
- 무엇: 세로 약 150px 버튼 기둥이 오른쪽 아래를 덮음. 확인된 예: 학생찾기·과외쌤찾기 「검색」 버튼과 「정렬」 선택칸(360), 회원가입 약관 「다음」 오른쪽 끝·「보기」(390/360), 로그인 「카카오로 시작하기」, 유료상품 「노출상품/쪽지권」 카드, 자료실 목록 제목, 커뮤니티·이용안내 「빠른 도움말」, 공부방찾기 지도 확대/축소 바, 모든 화면 맨 아래 푸터 링크.
- 측정: 39개 측정에서 겹침(푸터 링크 제외). 예) `search/student` 360: 「검색」 중앙점 → `.inquiry-fab`.
- 스샷: `shots/guest-search-student-360.png`, `shots/guest-login-360.png`, `shots/guest-auth_signup_terms-390.png`, `shots/guest-search-room-360.png`
- 원인: `preview/home-ui/src/styles/design-system.css:478-488`(맨아래 버튼 모바일 표시), `:490-517`(문의하기를 그 위 2칸 위에 쌓음).
- 고칠 것(최소): 768px 이하에서 ① 「맨아래」 숨김(`.back-to-bottom{display:none}`) ② 문의하기·맨위를 글자 없는 40px 원형으로 ③ 푸터 `padding-bottom`에 버튼 높이만큼 여백. (이전 점검 「맨위 FAB가 카드 ✉ 가림」 → **아직 있음, 버튼이 늘어 더 커짐**.)

### B2. 홈 빈 홍보칸이 너무 길다 (이전 지적 그대로)
- 비로그인 / `#/guest` / 390
- 무엇: 빈 「이 자리에 공부방/과외쌤을 홍보하세요」 카드가 프라임 공부방 3개·프라임 과외쌤 3개 세로로 쌓이고(각 약 280px), 픽은 1칸만 반쪽 폭. 홈 전체 높이 6,765px.
- 스샷: `shots/full-guest-home-390-p0.png` ~ `-p4.png`
- 원인: `preview/home-ui/src/exposure-render.js:697-715`(빈 카드, 그 줄이 다 비면 사진 자리까지 넣음), 스타일 `preview/home-ui/src/styles/udx-std-apply.css:279-300`.
- 고칠 것(최소): 768px 이하에서 `.expo-card--empty` 두 번째부터 숨기기(`.expo-grid > .expo-card--empty ~ .expo-card--empty{display:none}`) 또는 빈 카드 사진 자리 숨김. 픽 1칸은 모바일에서 `grid-column:1/-1`.

### B3. 홈 빈 칸 「유료상품 보기」를 누르면 유료상품이 아니라 「로그인하고 자세히 보기(후기·위치·비교)」 팝업
- 비로그인 / `#/guest` / 390·360 (모바일 전용 문제는 아님)
- 무엇: 유료상품은 로그인 없이 볼 수 있는데, 빈 홍보칸의 「유료상품 보기」가 상세보기용 로그인 팝업으로 막힘. 문구도 안 맞음.
- 스샷: `shots/guest-deep-gate-modal-390.png`, `shots/guest-deep-gate-modal-360.png` (팝업 자체는 화면 안에 들어오고 버튼 보임 — 크기 문제 없음)
- 원인: `preview/shared/guest-gate-ui.js:283-301` 빈 카드 전체 클릭을 가로채 `openDeepAccessLoginGate`. 예외(:295)에 카드 안 `#/plans` 링크가 없음.
- 고칠 것(최소): :295 예외에 `a[data-nav^="/plans"]` 추가.

### B4. 홍보 카탈로그 첫 그림 아래쪽 약간 잘림
- 비로그인 / `#/promo/study-room` / 390
- 측정: `section.pv2-hero` 높이 560, 안쪽 577(17px 넘침).
- 스샷: `shots/guest-promo_study_room-390.png`
- 고칠 것: pv2-hero 모바일 높이를 고정 대신 `min-height`로(파일: `preview/home-ui/src/promo/` 스타일, 정확한 줄은 미확인).

## 오픈 뒤
- C1. 보이는 버튼 높이 30px(작은 버튼 26px) — `tokens.css:186-187 --btn-tone-h`. 단 모바일에서 `udx-std-apply.css:961` `.btn::after`로 누르는 영역 44px 확보돼 있어 실사용 문제는 적음(디자인 결정 확인용).
- C2. 진짜 작은 누름칸: 홈 프로모 점 6px(`home-promo-trio__dot`), 「더보기」 17px, 공지줄 22px, 로그인 「보이기」 24px, 약관 「보기」 26px, 이용안내 역할 탭 23px.
- C3. 상단 고정영역(헤더 45 + 인사 배너 38 = 83px) — 이전 3단 156px에서 줄어 개선됨. 배너를 스크롤 시 숨기면 더 넓어짐.
- C4. 2열 그리드: 이용안내 단계(`li.step-item` 아이콘 32px + 글)만 2열, 문제없음. 카드 3열 화면 없음.

## 이전 모바일 지적과 비교 (10-30, 줌 근사)
| 이전 | 지금 |
|---|---|
| 헤더 3단(~156px)·GNB 가로스크롤·「고객센터」 잘림 | **고침** — 햄버거 서랍(항목 40px), 상단 83px |
| 필터/상세검색 패널 과대(~960px) | **고침** — 「상세 필터」 접힘 |
| 맨위 FAB가 카드·버튼 가림 | **아직 있음 + 커짐**(B1) |
| 홈 빈 홍보칸·픽 반쪽 | **아직 있음**(B2) |
| 과외쌤찾기→학생찾기 스크롤 유지 | 찾기는 별도 페이지라 해당 없음. 대신 **홈 앱 전체 메뉴 이동에서 스크롤 유지**(A2) |
| 모달 「닫기」 FAB에 가림 | 로그인 유도 팝업: FAB가 어두운 배경 아래로 가 **가리지 않음**. 다른 모달(비교·상세)은 로그인 필요라 미확인 |
| 우측 레일 본문 아래로 밀림 | 「오늘의 안내」 접힘 상자로 바뀌어 **개선** |
| 공지 파란 배지 깨짐, 마이메뉴 줄바꿈, 비교바·비교모달 | 로그인 필요 화면이라 **미확인** |

## Cursor에 넘길 때 묶음(제안)
1) A1+A3(CSS 2파일 각 1블록) 2) A2(main.js 1곳) 3) B1+B2(CSS) 4) B3(JS 1줄). 각 PR 뒤 390·360 스샷 확인.
