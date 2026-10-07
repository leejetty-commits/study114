# 174a — 비회원(게스트) 클릭 이탈 매트릭스 (실사이트 + 코드 대조)

일자: 2026-09-27  
대상: https://study114.net 비로그인  
정책 본체: `174-in-page-nav-stay-policy-2026-09-27.md`  
코딩 티켓 번호 후보: **175** (PC 켤 때 · 배포 지시 전까지 문서만)

> 실클릭 보고에서 Vue 경로(`StudyRoomPromo.vue` 등)가 나왔으나 **저장소는 preview JS**다. 아래는 GitHub `leejetty-commits/study114` 기준 정본.

---

## 1. 종합 (이탈·불일치 4건)

| 순위 | 판정 | 한줄 |
| :--- | :--- | :--- |
| P1 | **이탈버그** | 홍보·커뮤니티 「← 메인 홈으로」/breadcrumb이 세션에 `parent` 등이 남아 있으면 `#/parent`로 갔다가 게스트로 튕김(깜빡임) |
| P2 | **이탈버그** | 검색 화면 배너 「홈으로」는 `#/guest`, GNB 「홈」은 `#/parent`로 서로 다름 (`?role=parent`일 때) |
| P3 | **컨텍스트 유실** | 홍보·커뮤니티 GNB에서 찾기로 갈 때 `role=parent`가 붙어 비회원 맥락이 학부모로 바뀜 |
| P4 | **개선권장** | 이용안내의 「찜 목록 보기」「쪽지함 보기」는 인페이지 모달 대신 마이페이지 전체 화면으로 이동 |

정상으로 본 것(요약): 홈 카드 상세·지도 핀은 인페이지 잔류; 고객센터 공지 아코디언 잔류; 이용안내·고객센터·커뮤니티 본문 이동은 대체로 자연스러움.

---

## 2. 코드 원인 (정본 파일)

### P1 — 홈 링크가 `#/parent`로 잡히는 이유

- `preview/home-ui/src/promo/shell.js` · `preview/home-ui/src/concern/shell.js`  
  - `const role = getNavRole();` 후 `href="#/${role 홈}"` 형태로 「← 메인 홈으로」 조립.
- `preview/home-ui/src/state.js` → `getNavRole()`  
  - 커뮤니티·홍보·자료실·마이샵에서는 **화면 역할이 아니라** `sessionStorage`의 활성 역할(`ACTIVE_ROLE`)만 본다.  
  - `parent` / `study_room` / `tutor`가 남아 있으면 그 값을 그대로 돌려 **비로그인이어도 `#/parent` 링크**가 생김.  
  - 라우터가 비회원 `#/parent`를 거부하고 `#/guest`로 보내 **왕복 깜빡임**.

**이상 동선(잠금 방향):**  
비로그인(또는 실제 세션이 게스트)이면 홍보·커뮤니티의 「홈」「메인 홈으로」는 **항상 `#/guest`**. 로그인만 역할 홈. stale `ACTIVE_ROLE`로 게스트 GNB/홈을 덮지 말 것. (plans 라우트는 이미 같은 이유로 guest 강제 — 주석에도 있음.)

### P2 — 검색 GNB 홈 vs 배너 홈

- 배너 「홈으로」: 게스트일 때 `#/guest`로 정상.
- GNB 「홈」: `preview/shared/site-nav-config.js`의 `roleHomeHashPath` / 검색 쪽 역할이 URL `?role=parent`이면 **부모 홈**으로 조립되는 패턴.
- 동일 화면에서 「홈」 두 곳이 다른 목적지를 가리키면 **이탈버그**.

**이상 동선:** 비로그인·게스트 검색이면 GNB·배너 모두 `#/guest`(또는 동일 `homeHashUrl`). `role` 쿼리만으로 회원 홈을 만들지 말 것.

### P3 — `role=parent` 주입

- 게스트 홈 GNB 찾기는 `?role=guest`인데, 홍보·커뮤니티 GNB는 `?role=parent`로 나가는 사례가 실클릭에서 확인됨.
- 검색 앱은 `role`을 뷰어 맥락으로 씀 → 비회원이 학부모 UI·홈 링크로 끌려감.

**이상 동선:** 비로그인이면 찾기 URL은 `role=guest`(또는 역할 파라미터 생략 + 서버/클라이언트가 guest 판정). 로그인 역할만 `parent`/`study_room`/`tutor`.

### P4 — 이용안내 → 마이페이지 바로가기

- 카드 상세 등은 「로그인하고 자세히 보기」 인페이지 모달(잔류 OK).
- 가이드의 「찜 목록 보기」「쪽지함 보기」는 `/#/mypage/...` 전체 이동 후 비회원 안내.

**이상 동선(권장):** 가능하면 같은 인페이지 게이트/팝업. 전체 이동이 꼭 필요하면 174 정책상 「자연스러운 이탈」로 문서화하고 카피만 통일.

---

## 3. 클릭 매트릭스 (게스트 실클릭 요약)

| 화면 | 클릭 | 출발 | 도착/결과 | 판정 |
| :--- | :--- | :--- | :--- | :--- |
| 메인홈 | 이용안내 | `/#/guest` | `/#/guide` | 이동OK |
| 메인홈 | 카드 상세 | `/#/guest` | 인페이지 로그인 모달 | 팝업OK |
| 메인홈 | 지도 핀 | `/#/guest` | 잔류 | 잔류OK |
| 메인홈 | 유료상품 보기 | `/#/guest` | `/#/plans/positions` | 이동OK |
| 메인홈 | 서비스 소개 | `/#/guest` | `/#/promo/study-room` | 이동OK |
| 홍보 | breadcrumb 홈 · ← 메인 홈으로 | promo | `#/parent` → `#/guest` | **이탈버그 P1** |
| 홍보 | GNB 공부방찾기 | promo | search `?role=parent` | **P3** (이동은 되나 맥락 오류) |
| 검색 | 배너 홈으로 | search | `/#/guest` | 이동OK |
| 검색 | GNB 홈 | search | `#/parent` → guest | **이탈버그 P2** |
| 검색 | 리스트 상세 | search | 인페이지 게이트 | 팝업OK |
| 가이드 | 찜·쪽지 액션 | guide 하위 | mypage 라우트 | 이동OK·**P4 개선** |
| 고객센터 | 공지 아코디언 | support | 잔류 | 잔류OK |
| 고객센터 | 문의하기 | support | contact | 이동OK |
| 커뮤니티 | 게시판·글쓰기 | community | 하위 라우트 | 이동OK |
| 커뮤니티 | ← 메인 홈으로 | board new | `#/parent` → guest | **이탈버그 P1** |

---

## 4. 스크린샷 (봇 컴퓨터)

1. 커뮤니티 「← 메인 홈으로」 (`#/parent` 노출)  
   - `.../assets/e9e9d60f1db1db0be174b089a8ecf1841c55d0063bc5b161c20296670ea95bf0.png`  
   - 줌: `.../assets/ccbad387e2c9f016af6acc483fd71e93fdae064b70851e769fbfb1be4ef1e45d.png`
2. 검색 GNB 홈 vs 배너 홈으로  
   - `.../assets/378115d8a3d72a0caa1a0837f441248804eac253865f7251e4bc39b26788111c.png`

---

## 5. Cursor 175 초안 범위 (코딩은 PC·지시 후)

허용 방향만 (파일은 위 정본):

1. `getNavRole()` 커뮤니티·홍보 분기: **비로그인 → 항상 guest** (stale ACTIVE_ROLE 무시). 로그인은 기존 활성 역할.
2. 검색 GNB 「홈」 = 배너 「홈으로」와 동일 규칙 (`homeHashUrl` / 실세션).
3. 비로그인 GNB·찾기 링크에서 `role=parent` 강제 제거 → `guest`.
4. (선택) 가이드 찜·쪽지 → 인페이지 게이트 정렬.

금지: 배포·`build:dothome`·광범위 리라이트·관리자·결제.

검증: 시크릿(또는 스토리지 비운) 게스트로 promo/community → 「메인 홈으로」 클릭 시 **주소창이 `#/parent`를 거치지 않고** `#/guest`만. 검색에서 GNB·배너 홈 동일. 찾기 URL에 guest 유지.

---

## 6. 다음

- 공부방 / 과외쌤 / 학생 **로그인 모드** 같은 점검 → 로그인 필요(폼 또는 사용자 데스크톱).
- 사용자 OK 후 175 잠금 티켓 붙여넣기문 작성.
