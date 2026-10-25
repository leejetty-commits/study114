# 302 학생 화면에서 공급자 정보 게시판 요청 안 하기

- **과제:** 302-student-info-board-skip
- **브랜치:** cursor/302-student-info-board-skip-20261026
- **base:** 5f045d04 (origin/main)

## 403이 나가던 호출 경로 (고치기 전)

1. 학생 로그인 → 홈/찾기/홍보/자료실 로드
2. `right-rail.js` `resolveNavRole` → 세션 확인 전 `getNavRole()` = 'guest' (plans/community/promo/library 첫 방문 등)
3. `info-rail.js` `renderInfoRailBanners` → `railViewer('guest')` → `getAuthUser()` null → boardRole = 'guest'
4. `board-channel-acl.js` `INFO_DISCOVER`에 `guest` 포함 → `canDiscoverBoard('info-room','guest')` = true → 배너 DOM 생성
5. `info-board-store.js` `loadInfoRailList` → `infoAccessFor` = 'titles'(blocked 아님) → `request(url)` + `credentials:'include'`
6. PHP `posts.php` → 세션 쿠키로 학생 판정 → info-room 권한 없음 → **403**

**구멍**: 클라이언트는 게스트로 판단했으나 `credentials:'include'`로 세션 쿠키가 함께 전송 → 서버는 학생으로 판정.

## 막은 위치

`info-board-store.js` — `guestSafeOpts(viewer)` 헬퍼 추가:
- 게스트 뷰어일 때 `credentials:'omit'`으로 세션 쿠키 생략
- 5개 읽기 함수(loadInfoList, loadMoreInfoList, loadInfoPost, loadInfoRailList, loadInfoPage)에 적용
- 쓰기(saveInfoPost, deleteInfoPost, toggleInfoCheer)는 로그인 전용이므로 기존 `credentials:'include'` 유지

**원리**: 게스트 뷰어 = 세션 불필요. 쿠키를 생략하면 서버도 게스트로 판정 → 제목 반환(403 없음).
인증 완료 후: boardRole = 'demand' → `infoAccessFor` = 'blocked' → 요청 안 나감.
공급자: boardRole ≠ 'guest' → `credentials:'include'` → 정상.

## 수정 파일

| 파일 | 변경 |
|---|---|
| `preview/home-ui/src/library/info-board-store.js` | `guestSafeOpts` 헬퍼 + 5개 읽기 함수에 적용 |

## info-room/info-tutor → posts.php 호출 경로 목록 (전수)

| 경로 | 파일 | 함수 | 게스트 가드 |
|---|---|---|---|
| 레일 배너 | info-rail.js → info-board-store.js | `loadInfoRailList` | `infoAccessFor`='blocked'(demand) + `guestSafeOpts`(guest) |
| 자료실 화면 목록 | info-board-screens.js → info-board-store.js | `loadInfoList` | `infoAccessFor`='blocked'(demand) + `guestSafeOpts`(guest) |
| 자료실 화면 상세 | info-board-screens.js → info-board-store.js | `loadInfoPost` | `infoAccessFor`='blocked'(demand) + `guestSafeOpts`(guest) |
| 레일 팝업 목록 | info-rail.js → info-board-store.js | `loadInfoPage` | `infoAccessFor`='blocked'(demand) + `guestSafeOpts`(guest) |
| 레일 팝업 상세 | info-rail.js → info-board-store.js | `loadInfoPost` | (위와 같음) |

## AC 표

| AC 항목 | 결과 | 근거 |
|---|---|---|
| 학생 세션 → info-room/info-tutor 요청 0건 | ✅ | 인증 완료: demand → blocked → 요청 안 나감. 레이스: guest → credentials:omit → 서버가 게스트로 판정(403 아님) |
| 같은 세션 info-student 정상 | ✅ | info-student는 ALL_ROLES discover + STUDENT_TIPS_READERS list. guestSafeOpts는 guest 뷰어에만 적용(titles 정상) |
| 공부방/과외쌤 로그인 회귀 없음 | ✅ | boardRole = supply-room/supply-tutor → guestSafeOpts 미적용 → credentials:include → full 접근 |
| 게스트 제목만 정책 유지 | ✅ | guest → guestSafeOpts → credentials:omit → 서버 게스트 판정 → titles 반환 |
| 허용 밖 변경 0 | ✅ | git diff 1파일만 |

## 가설과 달랐던 점

기존 ACL(`demand`→`blocked`, `canDiscoverBoard` 필터)은 정상 동작. 구멍은 **세션 확인 전 레이스**: getAuthUser()=null일 때 navRole이 'guest'로 풀리는 여러 라우트(plans, community, promo, library 첫 방문)에서 info-room/info-tutor 배너가 생성되고, `credentials:'include'`로 세션 쿠키가 함께 전송되어 서버가 학생으로 판정.

## 위험도

- **낮음** — 읽기 전용 fetch 옵션 변경. 게스트 뷰어의 결과물은 동일(서버가 게스트로 판정). 로그인 뷰어 경로 무변경.
