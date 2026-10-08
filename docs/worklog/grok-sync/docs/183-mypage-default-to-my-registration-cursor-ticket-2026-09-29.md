# 183 · Cursor — 마이페이지 첫 진입 = 내 등록 (로컬)

- 작성: 2026-09-29 · 우동공과2
- 잠금: 178-3 「마이페이지」→ **내 등록** · 별도 마이페이지 홈 없음
- push · build:dothome · Notion **금지**
- 이번 티켓은 **잠금 3만**. 게스트 찾기(잠금 8)는 **184**로 미룸.

## Must

1. 「마이페이지」 **첫 진입**(유틸·툴바·`#/mypage`·breadcrumb 「마이페이지」 클릭)은 `getDefaultMypagePath`(또는 동일 결과의 단일 helper)로 **내 등록** 표면으로 보낸다.
   - study_room / tutor: 기존 entry hub (`getStudyRoomEntryPath` / `getTutorEntryPath`)
   - parent(학생): 기존 default (`getParentStudentProfilePath()` 또는 `/mypage/registrations/students`)
2. 별도 **마이페이지 홈** (`#/mypage/home`, P15-01 `renderHome`)로 랜딩·CTA·empty link를 두지 않는다. 잔여 `/mypage/home`은 위 default로 **redirect**.
3. Breadcrumb 첫 칸 「마이페이지」 path를 `getDefaultMypagePath`와 **동일**하게 맞춘다 (`shell.js` hardcoded `homePath` 정리).
4. 사이드바 「내 등록」과 첫 진입 목적지가 **어긋나지 않게** 유지.
5. 변경은 allowlist만. 로컬 확인만 (push / commit / `build:dothome` 금지 — 커밋은 사용자가 수락 후 지시할 때).

## Allowlist

- `preview/home-ui/src/mypage/router.js`
- `preview/home-ui/src/mypage/shell.js`
- `preview/home-ui/src/mypage/screens.js`
- `preview/home-ui/src/mypage/index.js`
- `preview/home-ui/src/layout.js` (parity 필요할 때만)
- `preview/home-ui/src/state.js` (bootstrap / entry redirect)

링크 깨짐 시에만 같은 티켓: `preview/home-ui/src/mypage/preview-data.js`, `preview/home-ui/src/mypage/screens/tutor.js`  
밖 = 오버스코프 → 보고.

## Forbid

- 잠금 8(게스트 찾기 게이트) · `search-ui/**` · `resolveGnbLink` find_* · `/search` guest 공개 · `?role=guest` 정책
- GNB 찾기 라벨/가시성, 등록 intro, promo CTA, 쪽지·찜·계정·유료 메뉴 구조 변경
- 새 마이페이지 홈·대시보드 화면 추가
- allowlist 밖 리팩터 · SSOT 15 전면 재작성
- commit / push / `build:dothome` / Notion

## 스모크

1. 학생·공부방·과외쌤 각각: 유틸 「마이페이지」 클릭 → **내 등록**(역할별 entry) · `#/mypage/home`에 안 머묾
2. `#/mypage` · `#/mypage/home` 직접 입력 → 같은 default로 redirect
3. Breadcrumb 「마이페이지」 클릭 → 같은 default
4. Empty/CTA에 「마이페이지 홈」·`#/mypage/home` 링크 없음

## 커밋 예 (수락·지시 후)

`fix(mypage): default entry to my registration; redirect leftover home`
로컬만.
