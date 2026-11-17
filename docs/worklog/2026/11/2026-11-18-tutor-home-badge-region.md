# 13 과외쌤 홈 과외지역 배지

지시: `origin/docs/reapply-2026-11-17` 의 `docs/worklog/grok-sync/reapply-2026-11-17/13-tutor-home-badge-region-sync.md`  
기준: `origin/main` `3046a9b3` (PR #249)  
브랜치: `work/tutor-home-badge`  
작업 트리: `D:\work\study114\.wt\work-13-tutor-home-badge`  
더러운 체크아웃 `D:\work\study114` 는 건드리지 않았다.

`main.js` 전부와 `search-ui`의 다른 파일(`search-page.js`, `search-find-region.js`, `search-find-place.js`, `search-region-feed.js`, `state.js`)은 바꾸지 않았다.

## 0단계

`git rev-parse --short HEAD` = `3046a9b3`. 지시서 표와 같은 줄을 열었다. 허용 8개 파일 밖을 고칠 필요가 없어서 그 파일만 고쳤다.

| 확인 | 고치기 전 |
|---|---|
| `tutor-home-seed.js` `bootTutorHomeTutors` | 인자 없이 `tutorHomePrimaryIndex()`만 사용 |
| `tutor-home-seed.js` `ensureHomeRegions` · `tutorHomePrimaryIndex` | 그대로 |
| `screens/tutor.js` `renderTutorRegionPills()` | 인자 없음, `<span>` |
| `screens/tutor.js` `bindTutorEvents` | 배지 click 없음. 학생 탭 줄은 `bootTutorStudentDemand(resolveTutorStudentRegionIndex(previewState.tutorFind), rerender)` |
| `screens/tutor.js` `renderTutorActivityBars({ interactive: false })` | 그대로 둠 |
| `tutor-activity-chart.js` `renderTutorActivityBars` | `void opts;` |
| `search-tier-render.js` | `tutorHomePrimaryLabel`만 import, `tutorPrimaryRegionLabel()`이 그 함수만 반환 |
| `search-find-surface.js` | tutor-home-seed import, `[data-tutor-region]` 학생 탭 분기에 세션 저장 없음. `tutorStudentSnap`은 홈 학생 탭에서만 참 |
| `search-page.js` 250~251행 | `bootTutorHomeTutors(rerender)` 인자 없음. 이 파일은 수정하지 않음 |
| `chrome-session.js` `CLIENT_RESIDUE_KEYS` | 공부방 키만 있음 |
| `udx-std-apply.css` | 과외쌤 `.is-primary`와 `.is-active`가 같은 규칙 |

## 고친 것

- 세션 키 `study114.tutorHomePromoIndex`. 홈에서만 `slotIndex`를 넘긴다. 인자 없이 부르면 대표 지역.
- 라벨 있는 배지만 버튼. 빈 칸은 span. 고른 칸 `is-active`, 대표는 `is-primary`.
- 분포 막대는 고른 줄에 `is-active`와 `aria-current`.
- 티어 제목은 고른 라벨, 없으면 대표. 홈에서만 이 함수가 불린다.
- 홈 학생 탭에서 지역을 누르면 같은 키를 저장한다. `tutorStudentSnap`이 참일 때만.
- 로그아웃 때 그 키를 지운다.

## 검증 스크립트

`preview/home-ui`에서 `npx vite-node ../../scripts/verify-tutor-home-student-tab.mjs`  
60 passed, 3 failed. 실패한 3개는 `origin/main` 파일에 같은 정규식이 없어서 이번 수정 전과 같다.

- `(a) getRegionFeed: liveStudentItems 배열이면 … pending`
- `(b) search-find-surface 안에 과외쌤 학생 탭 문구 하드코딩 없음`
- `(d) 공부방 홈 학생 탭 로딩 문구 그대로`

`npx vite-node scripts/verify-tutor-box-real-values.mjs`  
49 passed, 0 failed.

`npm run build:dothome` 종료 코드 0.

Verify bundle의 기존 4건(Hide inquiry bundle, Tutor search fields, Tutor basic required, Student hope hidden required)은 이 브랜치에서 다시 돌리지 않았다. 고친 파일이 그 4건의 대상이 아니다.

## 수락 1~12

로컬 Docker `study114_dev`의 시험 계정(공부방·과외쌤·학생)으로 `http://127.0.0.1:5188/`에 로그인했다. API는 `이메일 또는 비밀번호를 확인해 주세요.` (`validation`)를 돌려줬다. 저장소에 있는 비밀번호 파일과 DB 해시가 다르다. 비밀번호는 바꾸지 않았고 적지 않는다. 운영 세션도 없다.

로컬 과외쌤(user 79, tutor 28)의 `tutor_regions`는 1행(region 5)뿐이다. 지역 표도 시·도 1개, 시·군·구 1개라 3칸 계정을 만들 수 없다.

그래서 수락 1~11의 로그인 클릭은 미확인이다. 배포 뒤 종현 확인.

| 항목 | 결과 |
|---|---|
| 1 세 역할 메뉴, 일반·시크릿, render 5초 | 미확인 |
| 2 배지 2 → 목록·제목·막대 | 미확인 (3칸 계정 없음) |
| 3 배지 3, 대표 | 미확인 |
| 4 내 카드 세 배지 | 미확인 |
| 5 배지 2 → 학생 탭 지역 2 | 미확인 |
| 6 학생 탭 3 → 배지 3 | 미확인 |
| 7 F5 유지, 로그아웃 후 대표 | 미확인 |
| 8 찾기 화면은 대표, 뒤로 가면 배지 2 | 미확인 |
| 9 1칸 계정 빈 칸은 버튼 아님 | 미확인 (로그인 실패) |
| 10 공부방 홈 회귀 | 미확인 |
| 11 배지 클릭 search.php 1번 | 미확인 |
| 12 빌드 | 통과 (exit 0). 위 스크립트 결과는 전과 같음 |

캡처 경로 없음.
