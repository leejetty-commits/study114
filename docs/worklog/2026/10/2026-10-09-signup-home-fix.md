# 2026-10-09 동네인사 팝업·기본정보 미완료 차단·과외쌤 홈 우리동네 과외쌤 (signup-home-fix)

- 브랜치: `cursor/signup-home-fix-20261009` (기준 `origin/main` `97bdd9bd`)
- worktree: `D:\work\study114\.wt\signup-home-fix`
- 작업: 메인 에이전트 직접 (하위 에이전트 없음)
- 위험도: **중간** — 기본정보 미완료 회원 차단이 모든 화면(홈·찾기·공부방·과외쌤 상세등록)의 세션 확인에 들어감. 서버·DB 변경 없음.

## 1. 지시 원문

> 내가 지금 과외쌤으로 이렇게 가입을 했는데, 베이직카드가 생성이 되지 않아. 왜 그렇지? … 코드수정하지 말고 점검만 하도록 하라.

> 여전히 지금 홈화면에 과외쌤 베이직카드가 안나와... 내가 등록한 지역이고 내가 그걸로 로그인했는데 왜 안보여???

> 왜 이래? 난 이 논리가 이해가 안된다. 내가 만든 알고리즘은 모든 유저들은 등록하면 베이직카드가 만들어지고 이건 자신의 홈화면에서는 지역이 같으면 다 노출되어야 하는데, 내 말에 논리가 이상하니???

> 내가 만든 알고리즘인데 왜 그런 결과가 안나오느냐고...

> 샘플카드 나오는것도 안하기로 정책을 수정했고 모두 기록하라고 했어. 왜 자꾸 이전 정책들을 들먹여???

> 기본정보를 등록하다가 부득이 빠져 나간 회원은 계정은 있어도 정상 등록이 된 회원이 아니야. 그러므로 사이트를 구경할수가 없어. 기본정보를 모두 채워야 베이직카드등록이 되고 비로서, 사이트내의 모든 것을 누릴 수 있어.
>
> 그리고 지금 내가 공부방 과외샘 모두 가입해 봣는데, 기본등록 마지막 단계에서 동네인사를 해. 그게 인사올리기를 하고 나면 그 다음화면으로 넘어가야 하는데 안돼. 즉 공부방의 경우엔 기본등록이 끝나면 상세정보등록으로 이어지기 단계가 나와야 되는데 이 팝업이 막고 있어. 그래서 건너뛰기를 하면 다음 단계가 무시되어지고 홈으로 가고 있다.
> 과외샘은 지금 가입프로세스가 엉망이라서 내가 상세히 정리를 해서 넘긴다. 에이전트가 개판으로 해놨다. 믿을수 없다. 앞으로 에이전트 사용하지 않는다.

> ㅇㅋ (2026-10-09 17:20, 아래 복명복창 1~3번 진행 승인)

## 2. 복명복창 (사용자 확인: 위 17:20 답)

1. **동네인사 팝업** — 「인사 올리기」 성공·「건너뛰기」 모두 팝업만 닫는다. 가입 완료 화면의 「상세등록 이어하기 / 나중에」는 그대로 남는다. 공부방·과외쌤 같은 화면.
2. **기본정보 미완료 회원은 사이트 이용 불가 (모든 역할)** — 학생·과외쌤·공부방 원장 모두, 기본정보를 다 채우기 전에는 어느 화면에 들어와도 기본정보 화면으로 보낸다.
3. **과외쌤 홈 「우리동네 과외쌤」 탭** — 대표 과외지역에 노출된 베이직카드를 내 카드 포함 전부. 「본인만」 걸러내기 삭제. 0장이면 샘플 없이 기존 빈 카드 칸만(샘플 폐지 `2026-10-09-remove-samples.md`).
4. 과외쌤 가입 과정은 사용자 정리본을 받은 뒤 별도 과제. 이번 작업에 넣지 않음.

## 3. 원인

- **팝업**: `preview/auth-ui/src/screens/signup-complete.js` — 올리기 성공 시 「저장되었습니다」만 띄우고 팝업을 닫지 않았다. 건너뛰기는 `goRoleHome`이 바로 홈으로 이동시켜 완료 화면의 상세등록 단계를 건너뛰었다.
- **차단**: 서버(`me.php` → `BasicRegisterService::needsBasicRegister`)는 세 역할 모두 `needs_basic_register`를 내려 주는데, 화면은 홈(`preview/home-ui/src/auth-session.js`)에서 학생만 기본정보 화면으로 보냈다. 공부방·과외쌤 상세등록 화면(`preview/shared/chrome-session.js`)은 확인하지 않았다.
- **과외쌤 홈**: 홈의 「우리동네 과외쌤」 탭이 `search-provider-self.js`의 「본인만」 보기로 내 카드 하나만 남기고 있었다(10-09 샘플 폐지 때 가짜 내 카드를 지운 뒤로는 내 카드 조회도 없어서 빈 화면).

## 4. 변경

| 파일 | 내용 |
|---|---|
| `preview/auth-ui/src/screens/signup-complete.js` | `goRoleHome`·`roleHomeUrl`·`showStatus` 삭제, `closePrompt`(팝업만 닫기)로 교체. 올리기 성공·건너뛰기 모두 `closePrompt` |
| `preview/home-ui/src/auth-session.js` | `needs_basic_register`면 역할과 관계없이 기본정보 화면으로 (안내 `/guide`는 예외 유지). 홈·찾기 화면이 이 파일을 씀 |
| `preview/shared/chrome-session.js` | `initChromeSession({ basicGate = true })` — `needs_basic_register`면 기본정보 화면으로. 공부방·과외쌤 상세등록 화면이 씀 |
| `preview/auth-ui/src/main.js` | 기본정보 화면이 있는 auth-ui만 `basicGate: false` |
| `preview/search-ui/src/search-provider-self.js` | **삭제** (「본인만」 걸러내기) |
| `preview/search-ui/src/search-role-access.js`, `state.js` | `isProviderSelfPreviewMode` 삭제 |
| `preview/search-ui/src/search-find-surface.js` | 「본인만」 안내·걸러내기 삭제. 과외쌤 홈 과외쌤 탭은 조회 중 / 조회 실패 / 조회 끝(0장이면 빈 칸) 표시 |
| `preview/search-ui/src/search-region-feed.js` | 과외쌤 홈: 대표 과외지역 조회 결과를 걸러내지 않고 전부 |
| `preview/search-ui/src/search-tier-render.js` | 과외쌤 홈 0장 = 기존 빈 카드 칸(`data-tutor-home-vacant`) |
| `preview/home-ui/src/tutor-home-seed.js` | `bootTutorHomeTutors` — 대표 과외지역 id로 과외쌤 검색(`searchApi('tutor', { tutor_region_id })`, 최신순 20장) |
| `preview/home-ui/src/screens/tutor.js`, `provider-home.js` | 과외쌤 탭 진입 시 조회 시작, `hideSelfNote` 삭제 |
| `preview/search-ui/DOC-CHECKLIST.md` | 「자기 노출」 절 → 「공급자 홈 목록 (2026-10-09 — 「본인만」 보기 폐지)」 |
| `scripts/verify-signup-home-fix-20261009.mjs` | 새 검사 (아래) |

## 5. 검수 (이 PC)

- 새 검사 `cd preview/home-ui && npx vite-node ../../scripts/verify-signup-home-fix-20261009.mjs`: **45 passed, 0 failed**
  - 팝업 닫기(올리기·건너뛰기), 홈 이동 코드 없음
  - 기본정보 미완료: 학생→학생 기본정보, 과외쌤→과외쌤 기본정보, 원장→공부방 기본정보 (홈 세션·상세등록 세션 둘 다). 완료 회원 통과, `/guide` 예외, auth-ui 자기 화면 유지
  - 과외쌤 홈: 같은 지역 내 카드 + 다른 쌤 카드 둘 다 보임, 0장이면 빈 칸(「샘플」 없음), 서버 실패 시 오류 안내
  - 같은 검사를 수정 전 `origin/main`에서 돌리면 22건 실패 후 중단 → 이번 문제를 잡는 검사임을 확인
- 기존 검사 — 수정 전 `origin/main`과 결과 비교, 모두 같거나 통과:
  - 통과: card-visual-penetration 37/0, mypage-account-region 41/0, mypage-notice-top 49/0, student-branch-two-tabs 162/0, student-location-flow 189/0, study-room-box-shape 45/0, tutor-box-real-values 49/0, tutor-home-student-tab 63/0, wishlist-card-zoom-screen 26/0, admin-today-hub 61/0, admin-162-settlement 57/0, role-home-guard 56/0, guest-baseline-map-cards 78/0, student-home-tutor-tier 24/0, tutor-region-label 115/0, home-news-row, info-boards-client, rail-info-banners, student-count-halt-and-gate, student-mypage-metrics, student-tips-board, support-home-library, hold-find-address, cur-006-post-verify-role, cur-006-email-verify-gate, location-ssot, tutor-register-same-tab, study-room-basic-register-api, integrity-fix-20261009
  - `main`에서도 같은 실패(이번 작업과 무관): verify-admin-registration-list 3건, verify-input-fill-rule 8건
- 배포 전 검사: `verify:shop-page`, `verify:tutor-inquiries-settings`, `verify:study-room-inquiries-samples`, `verify:board-acl:js`, `verify-no-sample-data`, `check-no-committed-secrets.sh` 모두 성공
- `npm run build:dothome`: 성공 (산출물은 커밋하지 않음)
- 독립 리뷰: 사용자 지시 없어 하지 않음.

## 6. 미확인

- 운영 사이트에서 실제 가입으로 팝업 → 완료 화면 흐름 눈확인은 하지 않음.
- 운영 계정으로 과외쌤 홈 「우리동네 과외쌤」 실제 카드 노출 눈확인은 하지 않음.

## 7. 배포 전 사용자 할 일

- 없음 (SQL·환경변수·Secrets·`.htaccess` 변경 없음).

## 8. 승인·main 반영

- 작업 전 승인: 사용자 2026-10-09 17:20 「ㅇㅋ」 (1~3번 진행).
- 작업 커밋 `0c05a9b2`. 브랜치 CI: Verify bundle·Board ACL gate 성공.
- main 병합 승인: 사용자 2026-10-09 「승인 — main 병합·배포 후 운영 사이트 확인까지」 (커밋 `0c05a9b2`).
- main 병합: 분리 worktree `.wt/merge-shf`에서 `--no-ff`, 병합 커밋 `3763a8c8` (`97bdd9bd` → `3763a8c8`), main push는 승인 창으로 사용자 확인.
- main Actions(`3763a8c8`): ShopPage gate·Tutor register same-tab·Verify bundle·Board ACL gate·Deploy to dothome 모두 성공.
- 운영 번들 확인: 홈 `https://study114.net/` `index-DV2L7RFM.js`에 과외쌤 홈 빈 칸·조회 상태 표시(`data-tutor-home-vacant`·`data-tutor-home-feed`)와 대표 과외지역 검색(`tutor_region_id`) 있음. 가입 `https://study114.net/auth/` `index-FGRQWFnQ.js`에 `basicGate` 있음, 팝업의 옛 「저장되었습니다」 없음. 실제 가입·로그인 화면 눈확인은 하지 않음.
