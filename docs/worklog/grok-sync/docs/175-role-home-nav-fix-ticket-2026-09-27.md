# 175 — 역할 홈 링크 통일 (이탈버그 최소 수정) · Cursor 잠금 티켓

일자: 2026-09-27  
근거: `174` 정책 · `174a` 게스트 · `174b` 공부방 · `174c` 과외쌤 · `174d` 학생  
코딩: **PC 켠 뒤 · 사용자 「붙여넣어」「코딩해」 등 명시 시에만**  
배포: **금지** (`build:dothome` / push / dothome 배포 금지)

---

## 0. 한줄 목표

「홈」「← 메인 홈으로」「검색 배너 홈으로」가 **지금 로그인한 역할의 홈**으로만 가게 한다.  
비회원이면 `#/guest`, 공부방이면 `#/study-room`, 과외쌤이면 `#/tutor`, 학생(학부모 UI)이면 `#/parent`.  
중간 경유(`#/parent`↔`#/guest` 깜빡임) 금지.

---

## 1. 증상 → 솔루션 (잠금)

### A. 검색 소개 배너 「홈으로」가 항상 `#/guest` (게스트·공부방·과외쌤 공통)

| | |
| :--- | :--- |
| **재현** | `/search/#/search/room` 또는 `tutor`에서 배너 「홈으로」 → 항상 `/#/guest`. 같은 화면 GNB 「홈」은 역할 홈으로 정상인 경우가 많음. |
| **원인(가설·검증 후 수정)** | `preview/home-ui/src/home-marketing-banner.js`의 `search_room` / `search_tutor` CTA가 `HOME_GUEST` 상수로 **하드코딩**. search-ui가 이 배너를 씀. |
| **솔루션(최소)** | 「홈으로」 href를 **고정 guest 금지**. 렌더 시점에 뷰어 역할(또는 로그인 세션)로 `roleHome`을 조립. 이미 있는 `roleHomeHashPath` / `homeHashUrl` / search state의 `role`과 **같은 규칙**을 재사용. 새 홈 체계·새 배너 카피·레이아웃 변경 금지. |
| **허용 파일** | `preview/home-ui/src/home-marketing-banner.js` (+ 역할 홈 URL을 만들기 위해 **이미 있는** shared 헬퍼만 import: 예 `preview/shared/site-nav-config.js`의 `roleHomeHashPath`/`homeHashUrl`, 또는 home-ui/search-ui에 이미 있는 동등 함수). 헬퍼가 없으면 **10줄 이내** 로컬 함수만 추가. |
| **검증** | 비로그인: 배너 「홈으로」=`#/guest`. 공부방 로그인: `#/study-room`. 과외쌤: `#/tutor`. 학생: `#/parent`. GNB 「홈」과 **동일 목적지**. |

### B. 이용안내·고객센터 「← 메인 홈으로」가 로그인인데 `#/guest` (공부방·과외쌤에서 확인)

| | |
| :--- | :--- |
| **재현** | 공부방/과외쌤 로그인 → `/#/support`, `/#/support/notice`, 일부 `/#/guide/...` → 「← 메인 홈으로」 → `/#/guest` (세션은 유지된 채 게스트 화면). |
| **원인(가설·검증 후 수정)** | `guide/shell.js`·`support/shell.js`가 `getNavRole()`로 홈을 만드는데, guide/support 구간은 `getGuideContextRole()` / `getSupportContextRole()`(sessionStorage)만 봄. 저장값이 `guest`이거나 미캡처면 로그인과 무관하게 guest 홈. |
| **솔루션(최소)** | 「메인 홈으로」·해당 셸 홈 링크에 쓰는 역할은 **실세션을 우선**. 권장 순서: (1) 로그인 사용자 `role_type` → 역할 홈, (2) 없으면 guide/support 컨텍스트, (3) 최후 guest. **또는** `captureGuideContextRole` / `captureSupportContextRole`이 로그인 중이면 항상 실역할로 덮어쓰게 수정(진입 경로와 무관). stale `guest`로 로그인 홈을 덮지 말 것. |
| **허용 파일** | `preview/home-ui/src/state.js` (getNavRole / getGuide* / getSupport* / capture* 중 **필요한 최소**), `preview/home-ui/src/guide/shell.js`, `preview/home-ui/src/support/shell.js`. 셸 마크업 대수술 금지 — href 역할 소스만 고침. |
| **검증** | 공부방·과외쌤·학생 각각: support / support/notice / guide 메인·하위 1곳에서 「메인 홈으로」→ **자기 역할 홈만**. URL에 `#/guest` 경유 없음. |

### C. 비회원인데 홍보·커뮤니티 「메인 홈으로」가 `#/parent`경유 후 `#/guest` (게스트 174a P1)

| | |
| :--- | :--- |
| **재현** | 비로그인 → promo/community → 「← 메인 홈으로」/breadcrumb 홈 → 잠깐 `#/parent` 또는 강제 후 `#/guest`. |
| **원인(가설)** | `getNavRole()`의 community/promo 분기가 **비로그인인데도** `ACTIVE_ROLE` sessionStorage(`parent` 등)를 신뢰. |
| **솔루션(최소)** | community / promo / library / myshop 분기: **비로그인(세션 없음)이면 무조건 `guest`**. `ACTIVE_ROLE`은 **로그인 세션이 있을 때만**. plans 라우트 주석과 같은 취지. |
| **허용 파일** | `preview/home-ui/src/state.js` (`getNavRole` 해당 분기만), 필요 시 `preview/home-ui/src/promo/shell.js` · `preview/home-ui/src/concern/shell.js`는 **역할 소스만** (이미 getNavRole 쓰면 state만으로 충분). |
| **검증** | 시크릿/스토리지 비운 비회원: promo·community 「메인 홈으로」 클릭 시 주소창이 `#/parent`를 **거치지 않고** `#/guest`. |

### D. (같은 티켓에 넣을 때만) 비회원 GNB/찾기에서 `role=parent`로 바뀜 (174a P3)

| | |
| :--- | :--- |
| **재현** | 게스트로 promo/community GNB → 찾기 URL에 `?role=parent`. |
| **솔루션(최소)** | 비로그인일 때 찾기 링크의 role 쿼리는 `guest`(또는 생략 후 guest 판정). parent 강제 금지. |
| **허용** | GNB/찾기 URL 조립하는 **기존** nav 설정·헤더 파일만. 검색 스키마·필터 UI 리라이트 금지. |
| **범위 메모** | A·B·C가 핵심. D는 **같은 PR에 넣되 파일 3개 이상 추가 확산되면 이 티켓에서 빼고 176으로 분리**하라고 Cursor에 명시. |

---

## 2. 이 티켓에서 **하지 말 것** (오버스코프 방지)

- 배포, push, `build:dothome`, dothome 업로드
- 마이페이지 breadcrumb 「마이페이지」 제자리 (174b R3 / 174c T3) → **별 티켓**
- 과외쌤인데 promo CTA가 study-room인 문제 (174c T4) → **별 티켓**
- 이용안내 「찜 목록/쪽지함」 인페이지 게이트 (174a P4) → **별 티켓**
- 배너 카피·이미지·레이아웃·디자인 토큰 변경
- 전역 라우터 재설계, SPA 통합, Vue 도입, 파일 대량 이동
- 관리자·결제·등록 폼·지도·카드 노출 로직 변경
- 「역할」 이름을 코드/화면에서 새로 만들기; 사이트 표기는 기존 유지 (등록, 베이직카드)
- 테스트 계정·시드 데이터 변경
- 「顺便」리팩터, 포맷터 전체 적용, 무관 lint 대청소

---

## 3. 파일 허용 목록 (Allowlist) — 이 밖은 금지

**필수 후보 (건드릴 가능성 높은 것만):**

1. `preview/home-ui/src/home-marketing-banner.js` — A  
2. `preview/home-ui/src/state.js` — B·C  
3. `preview/home-ui/src/guide/shell.js` — B (역할 소스만; 불필요하면 수정 0)  
4. `preview/home-ui/src/support/shell.js` — B (동일)  
5. `preview/home-ui/src/promo/shell.js` — C (state만으로 되면 0)  
6. `preview/home-ui/src/concern/shell.js` — C (동일)  
7. `preview/shared/site-nav-config.js` — A/D에서 기존 헬퍼 재사용·최소 보완 시만  

**조건부 (D를 같은 PR에 넣을 때만, 찾기 URL 조립이 여기 있을 때):**

- search-ui / home-ui 헤더·GNB에서 `role=` 쿼리 넣는 **기존 1~2파일** (Cursor가 경로 확정 후 보고서에 명시). 새 파일 생성 금지.

**허용 밖 파일에 손대면 = 오버스코프. 멈추고 보고.**

---

## 4. 수락 기준 (End checks)

시크릿(또는 storage 클리어) + 각 역할 로그인으로:

| # | 조건 | 기대 |
| :--- | :--- | :--- |
| 1 | 비회원 · promo·community 「메인 홈으로」 | `#/guest`만. `#/parent` 경유 없음 |
| 2 | 공부방 · support / notice 「메인 홈으로」 | `#/study-room` |
| 3 | 과외쌤 · support / notice 「메인 홈으로」 | `#/tutor` |
| 4 | 학생 · support 「메인 홈으로」 | `#/parent` |
| 5 | 각 역할 · 검색 배너 「홈으로」 | GNB 「홈」과 **동일** 역할 홈 |
| 6 | 비회원 · 검색 배너 「홈으로」 | `#/guest` |
| 7 | diff | allowlist 밖 파일 **0** (D 조건부 파일은 보고서에 이름 명시) |

보고: 변경 파일 목록 · 재현 URL · 스크린 또는 한줄 로그. PR만 (배포 없음).

---

## 5. Cursor에게 주는 작업 문장 (복붙용)

```
[티켓 175] 역할 홈 링크 통일 — 최소 수정만. 배포·push·build:dothome 금지.

목표: 「홈」「← 메인 홈으로」「검색 배너 홈으로」가 로그인 역할 홈(또는 비회원 #/guest)으로만 가게. 경유 깜빡임 금지.

고칠 것(잠금):
A) preview/home-ui/src/home-marketing-banner.js — search_room/search_tutor CTA「홈으로」의 HOME_GUEST 하드코딩 제거. 렌더 시 역할 홈 URL(기존 roleHomeHashPath/homeHashUrl 등 재사용).
B) guide/support「메인 홈으로」— getNavRole/getGuideContextRole/getSupportContextRole가 stale guest로 로그인 홈을 덮지 않게. 실세션 role 우선. state.js + 필요 시 guide/shell.js·support/shell.js만.
C) 비로그인인데 community/promo가 ACTIVE_ROLE(parent 등)을 쓰는 getNavRole 분기 — 비로그인은 무조건 guest.
D) 비로그인 찾기 링크 role=parent 강제는 같은 PR에 넣되, 파일이 3개 이상 더 필요하면 이 PR에서 빼고 보고만.

금지: 마이페이지 breadcrumb, promo CTA study-room 오링크, 찜/쪽지 인페이지화, 배너 카피/디자인, 라우터 재설계, allowlist 밖 파일, 리팩터·포맷 전체.

Allowlist: home-marketing-banner.js, state.js, guide/shell.js, support/shell.js, promo/shell.js, concern/shell.js, site-nav-config.js, (D 시) role= 조립 기존 1~2파일만.

수락: 위 End checks 1–7. 결과: 변경 파일·재현·PR 링크. 배포 없음.
```

---

## 6. 후속(이 티켓 밖)

| 후보 | 내용 |
| :--- | :--- |
| 176 | 마이페이지 breadcrumb 「마이페이지」 제자리 |
| 177 | 역할별 promo CTA (과외쌤→promo/tutor) |
| 178 | 이용안내 찜·쪽지 인페이지 게이트 |
| 고친 뒤 | 사용자 요청: P1류 재스모크 (시크릿 · promo/community 홈 · 검색 GNB vs 배너) |



## 7. 학생(174d) 보강 (2026-09-27)

- S1·S3 = 공부방/과외쌤과 동일 → A·B로 해결.
- **S2**: 학생인데 guide 「메인 홈으로」가 `/#/tutor` — GUIDE_CTX/ACTIVE_ROLE **stale 타역할**. B·C에서 「실세션만 신뢰」하면 같이 막힘. 수락 시 학생→guide 「메인 홈으로」=`#/parent` 확인 필수.
- **S4** 학생 배너 유료상품·고아 plans, **S5·S6** breadcrumb/promo CTA → **175 금지·후속**.
