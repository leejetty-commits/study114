# 실시간 퀵매칭 홍보 (2026-11-17)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 기준: 최신 `origin/main`. 워크트리는 `D:\work\study114\.wt\work-quickmatch-promo` 안에만 만든다. 로컬 더티 작업 트리는 건드리지 말 것.
- 시안 PNG(참고, 이 브랜치에는 없음): `catalog-1280.png`, `catalog-390.png`, `intro-1280.png`, `intro-390.png`, `mypage-entry-390.png`

## 종현 확정

- 홈 홍보배너 카탈로그의 **프라임 혜택 맨 위**에 퀵매칭을 가장 큰 칸으로 둔다. 대표 자리(노출)보다 먼저 보이게 한다.
- 카피 임팩트는 「새로운 방식의 서비스」에 둔다. 「최초」「유일」「1위」는 쓰지 않는다.
- 프라임 전용임은 자연스럽게 알린다. 가격(월 5만원 등)·종료일·학교명·S.K.Y.는 적지 않는다.
- 마이페이지에 퀵매칭 소개 페이지와 홍보 입구(NEW)를 만든다. 소개 페이지는 비로그인도 볼 수 있다.
- 실사·도형(3단계 아이콘·연결선·말풍선)·가벼운 CSS 애니를 쓴다.

## 카피 (그대로)

- 큰 제목: **새로운 방식의 매칭이 시작됩니다** — 「새로운 방식」만 기존 `pv2-hand` + `pv2-mark` 손글씨 강조
- 바로 아래 보조 제목: **이제, 공부방도 실시간으로 매칭됩니다**
- 본문: **조건이 맞는 학생이 나타나면 바로 쪽지가 연결됩니다**
- 그 바로 아래: 배지 **NEW**, 배지 **프라임 회원 전용 혜택**, 한 줄 **프라임에 함께 제공되는 서비스입니다**
- 3단계 (공부방을 먼저, 과외쌤은 함께):
  1. 학생이 원하는 조건 선택
  2. 조건 맞는 공부방·과외쌤에게 실시간 알림
  3. 쪽지로 바로 상담
- 소개 페이지 추가: 매칭 조건 예시(학교급·과목·수업료·원장/쌤 성별·희망 지역·수업 방식만. 학교명 없음), **프라임이면 추가 비용 없이**, CTA **프라임으로 시작하기** → `#/plans/positions`, 픽 회원 안내 **프라임에서 함께 제공되고 있는 서비스입니다**

## 구현

### (1) 카탈로그 — 프라임 혜택 맨 위 퀵매칭 칸

- 공부방 카탈로그 `#/promo/study-room`이 기준이다.
- 카피 SSOT: `preview/home-ui/src/promo/study-room-content.js` `v2.cardTypes` (39–68행). 새 퀵매칭 블록 카피를 이 객체 맨 위(카드 4장보다 앞)에 추가한다. 기존 베이직·마이샵·프라임·픽 카드 문구는 유지.
- 렌더: `preview/home-ui/src/promo/screens.js` `renderStudyRoomV2`의 카드 종류 섹션 (80–94행). **4장 카드 그리드 앞에** 큰 퀵매칭 블록을 넣는다. 제목·배지·실사·말풍선·3단계(아이콘+연결선) 순.
- 과외쌤 카탈로그 `#/promo/tutor`에도 같은 블록을 한 번 더 넣는다. 카피는 공부방 우선 문장을 유지하되 톤만 맞춘다. 위치: `preview/home-ui/src/promo/tutor-content.js` `cardTypes` (42–52행), 렌더 `screens.js` `renderTutorV2` 카드 종류 섹션 (192–206행). 학생 카탈로그는 이번 범위 밖.
- 새 스타일은 **새 CSS 파일**로 두고, `preview/home-ui/src/promo/index.js` 또는 소개 청크에서만 import 한다. `preview/home-ui/src/main.js` 38–39행의 `promo-catalog.css`·`promo-v2.css`는 홈 엔트리에 이미 들어가 있으므로 여기에 퀵매칭 규칙을 추가하지 말 것. 기존 `pv2-` 클래스·색·폰트(G마켓 산스, 나눔손글씨, 네이비 `#0E1B33`, 크림, 골드 `#F2B84B`)를 재사용하고 새 디자인을 만들지 말 것.

### (2) 소개 페이지 — 게스트도 열람, 지연 청크

- 주소는 **`#/promo/quick-match`**. `#/guide` 아래가 아니라 기존 홍보 랜딩 네임스페이스를 쓴다. 게스트 공개, 로그인 강요 없음.
- `preview/home-ui/src/promo/catalog.js` `PROMO_LANDINGS` (17–45행)에 `id: 'quick-match'`, `path: '/promo/quick-match'`, `status: 'live'`를 추가하면 `preview/home-ui/src/promo/router.js` 11–20행 `normalizePromoPath`가 그대로 받는다.
- 본문은 새 모듈(예: `preview/home-ui/src/promo/quick-match-content.js` + 렌더)로 두고, 기존 `loadPromoScreen` (`preview/home-ui/src/main.js` 112행, 약 421행) 지연 청크에 실어 홈 엔트리를 키우지 않는다. 패턴은 `#/about`의 `loadAboutScreen` (114행)과 같다.
- 화면 순서: 제목(위 카피) → 3단계 → 매칭 조건 예시 → 「프라임이면 추가 비용 없이」 → CTA 「프라임으로 시작하기」(`#/plans/positions`, 기존 유료상품 경로 `preview/home-ui/src/plans/hub-home.js` 29행 등과 동일) → 픽 안내 문장.
- 프라임 회원이 이 페이지를 열면 CTA를 「퀵매칭 설정하기」`#/mypage/quick-match`로 바꿔도 된다. 비로그인·픽·프라임 아님은 모두 「프라임으로 시작하기」.
- `/promo/quick-match` 경로 해시 복원(`preview/home-ui/src/state.js` `bootstrapPromoRoute` 552–576행, `isPromoRoute` 252–255행)은 랜딩을 추가하면 따라온다. 새 pathname 예외를 `main.js`에 따로 넣지 않아도 된다.

### (3) 마이페이지 입구 — NEW, 막지 않고 소개로

- 메뉴 정의: `preview/home-ui/src/mypage/router.js` 90–97행 (`/mypage/quick-match`, 역할 `study_room`·`tutor`). 라벨·Event 아이콘·순서는 유지.
- 렌더: `preview/home-ui/src/mypage/shell.js` 105–114행. 라벨 옆에 작은 **NEW** 배지를 단다. 황금색/회색 규칙은 유지한다.
  - 프라임: 기존 `is-qm is-prime` (`preview/home-ui/src/styles/mypage-quick-match.css` 1–2행, `#b8860b`)
  - 그 외: 기존 `is-qm is-muted` (4–5행, `#9a948a`)
- 클릭: 프라임이 아니면 `#/mypage/quick-match`로 보내지 말고 **`#/promo/quick-match` 소개 페이지**로 보낸다. 화면을 막아 두지 않는다. 판별은 지금처럼 `getProviderStatus()?.prime_active` (`preview/home-ui/src/provider-status.js` 147행, 65행).
- 프라임이면 지금처럼 `#/mypage/quick-match` 설정 화면. 이 화면은 **서버 재확인을 유지**한다 (`preview/home-ui/src/mypage/quick-match-screen.js` 54행 `GET /api/quick-match/settings.php`). API·저장·매칭 로직은 바꾸지 말 것.
- 직접 주소 `#/mypage/quick-match`로 온 비프라임은 서버가 `prime_active`가 아니라고 하면, 짧은 차단문만 두지 말고 소개 페이지로 보내거나 같은 카피와 「프라임으로 시작하기」를 보여 준다. 기존 문구 `프라임에서 함께 제공되고 있는 서비스입니다` (1–2행, 72–77행)는 유지해도 된다.

## 이미지 · 애니메이션 조건

- 실사는 **사이트에 이미 있는 WebP만** 쓴다. 신규 다운로드는 하지 말 것.
  - 카탈로그·소개 히어로: `/assets/promo/room-classroom.webp` (공부방 수업 장면, 시안에서 사용)
  - 필요하면 `/assets/promo/room-band-desk.webp`, `/assets/promo/student-homework.webp` 정도만 보조
- 새 사진을 꼭 넣어야 할 때만 Unsplash 등 상업 이용 가능한 무료 이미지만. 출처·라이선스를 작업 기록에 남기고 WebP로 변환한다. 저작권 불명확한 이미지는 금지.
- 용량·속도: `loading="lazy"` `decoding="async"`. 홈 첫 화면 CSS `background-image`에 새 사진을 넣지 말 것. 카탈로그·소개는 이미 지연 청크이므로, 가능하면 `<img>`로 넣고 홈 엔트리 번들에 포함되지 않게 한다.
- 애니는 **CSS only**. JS·외부 라이브러리(lottie, gsap 등) 금지.
  - 사진 위 알림 말풍선: 톡 하고 떠오르는 효과(scale 0→1, 짧은 overshoot)
  - 3단계 카드: 왼쪽부터 순차 등장(지연 .15s · .45s · .75s 정도)
- 기존 `promo-v2.css` 347–353행처럼 **`prefers-reduced-motion: reduce`를 반드시 존중**한다. 이 설정에서는 최종 상태를 바로 보여 준다.
- 시안 PNG의 「CSS 애니 · 알림 톡」「CSS 애니 · 단계 순차 등장」표시는 구현 화면에 넣지 말 것. 실제 동작만 남긴다.

## 오픈 후 (이번 PR에 넣지 말 것)

- 학생 등록 화면에 「조건을 고르면 맞는 쌤이 먼저 연락해요」한 줄
- 오픈 공지 배너·팝업(「1주일간 안 보기」포함)

## 금지

- 결제·가격·API·운영 SQL·매칭 로직 변경
- 「최초」「유일」「1위」, 월 5만원 등 가격, 종료일, 학교명, S.K.Y.
- 홈 엔트리를 의미 있게 키우기. 새 큰 의존성 추가
- force push, `reset --hard`, `stash drop`. 로컬 `D:\work\study114`와 다른 워크트리 금지
- 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음
- **PR만 올리고 머지·배포는 하지 말 것.** 머지는 우동공과3 최종검수 후 종현 승인으로

## 확인 (셀프검수)

- 홈 빌드가 통과하고, 홈 엔트리 JS 바이트가 의미 있게 늘지 않았는지 보고한다. 소개는 별도 청크(또는 기존 promo 청크)인지 확인.
- 캡처: 공부방 카탈로그 퀵매칭 블록(1280·390), 소개 페이지(1280·390, 비로그인), 마이페이지 메뉴 NEW(390). 가능하면 프라임(금색)·비프라임(회색) 둘 다. 테스트 계정만, 실명 금지.
- 확인: 카탈로그에서 퀵매칭 칸이 프라임·픽 카드보다 위에 있는지, CTA가 `#/plans/positions`로 가는지, 비프라임 메뉴 클릭이 소개 페이지로 가는지, 프라임 메뉴는 설정 화면·서버 재확인이 유지되는지, `prefers-reduced-motion`에서 애니가 꺼지는지, 금지 문구·가격이 없는지.
- 글자 수·유사도는 합격 기준으로 쓰지 말 것.

작업 기록은 `docs/worklog/2026/11/`에 남긴다.
