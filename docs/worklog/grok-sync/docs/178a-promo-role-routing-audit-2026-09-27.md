# 178a — Study114 홍보/소개 페이지 역할 라우팅 감사

- 감사일: 2026-09-27 20:22 KST
- 대상 커밋: `f154183b5dab4d7391f98180996d94d432468ca4` (`leejetty-commits/study114`, `main`)
- 범위: `preview/home-ui` SPA, `preview/shared`, 공부방/과외쌤 등록 SPA, `https://study114.net` 라이브
- 결론: **공부방 소개는 존재하지만, 과외쌤 소개는 “경로만 있고 본문이 없는 planned/fallback 상태”다. 따라서 tutor 이슈는 단순 오링크만이 아니라 페이지 본문 부재 + 공통 레일의 공부방 하드코딩이 함께 있다.**

## 1. 코드에 선언된 promo/intro 경로

### 프로모션 네임스페이스 (`#/promo/*`)

| 경로 | 카탈로그 제목 | 상태 | 실제 본문 |
|---|---|---|---|
| `/promo` | 기본 진입 | live 기본값으로 `/promo/study-room` 정규화 | 공부방 소개로 이동 |
| `/promo/study-room` | `공부방 홍보 랜딩` | `live` | **있음** — `STUDY_ROOM_PROMO` 전체 렌더 |
| `/promo/tutor` | `과외쌤 홍보 랜딩` | `planned` | **없음** — `준비 중인 홍보 페이지입니다` fallback |
| `/promo/parent` | `학부모 안내 랜딩` | `planned` | **없음** — 동일 fallback |

근거:
- `preview/home-ui/src/promo/catalog.js:17-45`: 위 3개 catalog entry와 `live/planned` 상태.
- `preview/home-ui/src/promo/router.js:7-19`: `/promo` 기본값은 `/promo/study-room`; planned 경로도 라우트로 normalize만 함.
- `preview/home-ui/src/promo/screens.js:169-177`: `study-room`만 실제 렌더하고 나머지는 공통 준비중 화면.
- `preview/home-ui/src/promo/study-room-content.js:6-123`: 유일한 실제 랜딩 카피/본문.

### 등록 안내 intro (promo 랜딩과 별도)

- `#/register-intro/room` → `공부방 상세정보` 로그인 유도/절차 안내
- `#/register-intro/tutor` → `과외쌤 상세등록` 로그인 유도/절차 안내

근거: `preview/home-ui/src/register-intro/index.js:29-52`, `preview/shared/guest-gate-ui.js:77-103`.
이 둘은 등록 게이트이지 역할별 서비스 소개/홍보 랜딩의 대체 페이지가 아니다. 별도 정적 promo HTML/PHP 페이지는 찾지 못했다. `preview/*/index.html`은 앱 셸일 뿐이다.

## 2. 라이브 확인

직접 경로 `/promo/study-room`, `/promo/tutor`는 모두 HTTP 200이지만, 서버가 동일 SPA 셸을 fallback으로 반환한다(HTML title은 `우동공과 — 메인 화면 프리뷰`). 실제 클라이언트 해시 렌더는 다음과 같았다.

- `https://study114.net/#/promo/study-room` → site-visible title **공부방 홍보 랜딩**, 히어로/비교/등록/대상/신뢰 섹션 등 본문 확인.
- `https://study114.net/#/promo/tutor` → site-visible shell title **과외쌤 홍보 랜딩**, 본문은 **준비 중인 홍보 페이지입니다 / 곧 연결됩니다. 지금은 공부방 소개를 먼저 확인해 주세요. / 공부방 소개 보기**.
- `https://study114.net/#/promo/parent` → `학부모 안내 랜딩` shell title이지만 같은 준비중 fallback.

즉 `/promo/tutor`는 HTTP 404로 “없는 경로”는 아니나, **실질적인 tutor 소개 페이지는 없다**.

## 3. 잘못된/역할 비구분 CTA call site

### 확정적으로 잘못된 tutor 라우팅

1. `preview/home-ui/src/right-rail.js:18-25`
   ```js
   const RAIL_MEDIA_TEASER = {
     ...
     landingPath: '/promo/study-room',
     landingLabel: '소개 페이지에서 보기',
   };
   ```
   `renderMediaTeaserSlot()` (`:366-393`)가 역할을 받지 않고 이 경로를 모든 full/entry 레일에 넣는다. 따라서 tutor 홈/검색·상세·등록·상품 등에서 “소개 페이지에서 보기”가 공부방 소개로 간다.

2. `preview/home-ui/src/layout.js:55`
   ```js
   data-nav="/promo/study-room">홍보</button>
   ```
   상단 홍보 바로가기가 현재 역할과 무관하게 공부방 소개로 고정되어 있다. tutor 역할에서도 tutor 소개가 되어야 한다는 잠금 정책과 불일치한다.

3. `preview/home-ui/src/promo/screens.js:172-176`
   ```html
   <p>곧 연결됩니다. 지금은 공부방 소개를 먼저 확인해 주세요.</p>
   <a ... href="#/promo/study-room" ...>공부방 소개 보기</a>
   ```
   `/promo/tutor` 자체가 tutor용 본문 없이 공부방 소개로 되돌리는 fallback이다. 이는 **tutor 페이지 부재**와 **잘못된 fallback 링크**가 동시에 드러나는 지점이다.

4. 등록 레일 연결: `preview/tutor-ui/src/layout.js:106`은 `renderRegisterRightRail(...)`을 실제 tutor 역할로 호출하지만, 공통 renderer의 위 `RAIL_MEDIA_TEASER`가 여전히 `/promo/study-room`이다. 공부방 등록 `preview/study-room-ui/src/layout.js:177`은 공부방으로 맞지만, 공유 renderer를 역할별로 분기해야 tutor도 맞는다.

### plans 레일의 별도 역할 손실 (이전 RR1과 동일)

5. `preview/home-ui/src/plans/shell.js:46-49`
   ```js
   ${renderPromoWithRightRail('plans_right_rail')}
   ```
   `navRole`을 전달하지 않는다. `preview/home-ui/src/state.js:129-134`는 plans route에서 `getNavRole()`을 무조건 `guest`로 반환하므로, 공부방/과외쌤의 plans 레일도 게스트 CTA 세트를 사용한다. 이 레일의 media CTA 역시 `right-rail.js:23` 때문에 `/promo/study-room`이다. `plans/shell.js`에서 역할 매핑을 넘기는 수정은 177 범위다.

### 학생/게스트 경로 판단

6. `preview/home-ui/src/right-rail.js:313-317`의 guest/parent `home_right_rail`은 `STUDY_ROOM_PROMO.railCard.path`(`/promo/study-room`)를 사용한다.

현재 코드에는 학생/게스트용 별도 서비스 공통 intro 본문이 없고, `/promo/parent`도 planned뿐이다. 따라서 사용자 잠금안의 허용 선택지(학생/게스트 → 서비스 공통 **또는** 공부방 소개) 안에서는 **공부방 소개로 연결하는 현재 선택은 허용 가능**하다. 다만 향후 공통 소개를 만들면 이 call site를 별도 공통 경로로 바꿔야 한다.

## 4. 최종 판정

- **공부방→공부방소개:** 페이지 존재. 현재 live 본문도 정상.
- **과외쌤→과외쌤소개:** 페이지 **미완성/실질적 부재**. `/promo/tutor` route/catalog은 있지만 `planned` + generic fallback뿐이다. 동시에 공통 media rail, toolbar, planned fallback이 `/promo/study-room`으로 잘못 라우팅한다.
- **학생/게스트→서비스 공통 또는 공부방소개:** 서비스 공통 페이지는 없음. 공부방 소개는 존재하므로 현재 `/promo/study-room` 선택은 잠금안상 허용 가능(역할 전용 페이지 의무는 tutor/study_room에 우선 적용).
- **plans/register:** register는 tutor 역할을 renderer까지 전달하지만 shared media CTA가 틀렸고, plans는 `navRole` 자체가 빠져 게스트 CTA가 되는 별도 버그가 있다.
- 배포/푸시: 하지 않음.
