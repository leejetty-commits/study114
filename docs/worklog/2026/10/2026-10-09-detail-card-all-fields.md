# 2026-10-09 확대카드 = 베이직·픽·프라임 미니카드 항목 합집합

- 브랜치: `cursor/detail-card-all-fields-20261009` (기준 `origin/main` 90cc0f0)
- worktree: `d:\work\study114\.wt\detail-card-all-fields`
- 작업자: Cursor 하위 에이전트 (작업한 세션은 자기 작업을 검수·승인하지 않는다)
- 검수: **대기**
- 승인: **대기** (사용자, 커밋 hash 단위)

## 1. 지시서 원문

사용자, 2026-10-09 02:49~02:50 (UTC+9)

````text
「확대카드에 들어갈 항목이 없으면 그대로 비워둬도 된다. 강제 입력 항목이 아니다.」
(메인 보고: 확대카드에서 사진·성별·원생수·슬로건이 빠지는 것은 의도된 설계가 아닐 수 있음)
→ 「좋은 지적이야. 확대카드는 베이직, 픽, 프라임에는 모든 항목이 기본으로 다 들어가야 한다.」
````

메인 에이전트 해석(작업 범위):

- 확대카드(`detail-decision/` `openDetailModal` → `renderTutorDetailBody` / `renderStudyRoomDetailBody`)는 등급과 무관하게 하나. 베이직·픽·프라임 미니카드 어느 하나에라도 나오는 모든 항목(합집합)을 기본으로 넣는다. 과외쌤·공부방 둘 다. 학생 요청 카드는 범위 밖.
- 값이 없으면 빈 채로(기존 「—」 표시). 견본 값 금지. 입력 폼·필수 규칙·서버·미니카드는 바꾸지 않는다.
- 손님 처리(지역 넓게, 「로그인 후 확인」)·실명·연락처 비노출 유지. item 에 이미 있는 필드만 쓴다. 서버에 없는 필드는 고치지 말고 보고.
- 사진은 기존 `renderMedia` / `listingImage` 재사용. 기존 `p24-section` · `p24-dl` 안에. `detail-shell.js` 는 꼭 필요할 때만.

## 2. 항목 표

출처: `exposure-render.js` — 베이직 `renderBasicTutorRow` / `renderBasicStudyRoomRow` (hcard + `layout === 'table'`), 픽·프라임 `tutorTableRows` / `studyRoomTableRows` (+ `renderTutorMediaOverlay` · `renderTutorOverlayBottomGrid`, `renderStudyRoomMediaOverlay` · `renderPickStudyRoomMedia`), 배지 `card-visual.js`.
「상단」 = 확대카드 기존 공통 영역(제목 · `buildTrustStrip` 배지 · `renderItemActions` 레일). 「본문」 = 핵심 조건 `p24-dl`.

### 과외쌤

| 항목 | 기본 | 픽 | 프라임 | 확대카드 전 | 확대카드 후 |
|---|---|---|---|---|---|
| 이름 | O | O | O | 상단 제목 | 상단 제목 (그대로) |
| 배지(New·유료 / 졸업·경력·증빙) | O | O | O | 상단 배지 | 그대로 |
| 추천·후기·찜·비교·쪽지 | O | O | O | 상단 레일 | 그대로 |
| 사진 | O | O(오버레이) | O(오버레이) | 없음 | **본문 「사진」** |
| 성별 | O | O | O | 없음 | **본문 「성별」** |
| 지역 | O | O(오버레이) | O(오버레이) | 과외지역 | 그대로 |
| 수업료 | O | O(오버레이) | O(오버레이) | 수업료 | 그대로 |
| 대상(grade_band) | O(사진 위 배지·표) | O | O | 없음 (「대상」 칸에 학생구성 값이 들어가 있었음) | **본문 「대상」 = grade_band** |
| 과목 | O | O | O | 과목 | 그대로 |
| 원생수(학생 성별·인원) | O | O | O | 「대상」 이름으로 표시 | **본문 「원생수」** |
| 수업장소 | O | O | O | 수업장소 | 그대로 |
| 일정(주N회·N분) | O | O(오버레이) | O(오버레이) | 일정 | 그대로 |
| 특징 1~3 | O(3, 표는 1) | O(1) | O(3) | 특징(3) | 그대로 |
| 슬로건 | O | O | O | 없음 | **본문 「슬로건」** |
| 제출자료 | — | O | O | 없음 | **본문 「제출자료」 (N개 공개)** |
| 주교재 | — | O | O | 없음 | **본문 「주교재」** |
| 강의스타일 | — | O | O | 강의스타일 | 그대로 |
| 학적상태 | — | O(오버레이) | O(오버레이) | 「학력」에 합쳐 표시 | **본문 「학적상태」** |
| 학교·학과 | — | O(오버레이) | O(오버레이) | 「학력」에 합쳐 표시 | **본문 「학교·학과」** |
| 경력 | — | O(오버레이) | O(오버레이) | 경력 | 그대로 |
| 소개 | — | — | O | 없음 | **본문 「소개」** |

### 공부방

| 항목 | 기본 | 픽 | 프라임 | 확대카드 전 | 확대카드 후 |
|---|---|---|---|---|---|
| 공부방명 | O | O | O | 상단 제목 | 그대로 |
| 배지(New·유료 / 교육청·사업자·경력·증빙) | O | O | O | 상단 배지 | 그대로 |
| 추천·후기·찜·비교·쪽지 | O | O | O | 상단 레일 | 그대로 |
| 사진 | O | O | O | 없음 | **본문 「사진」** (`listingImage(item,'pick')`, 없으면 기존 기본 이미지) |
| 위치 | O | O(오버레이) | O(오버레이) | 위치 | 그대로 |
| 월 수강료 | O | O | O | 월 수강료 | 그대로 |
| 교습형태 | O | O | O | 교습형태 | 그대로 |
| 대상 | O | O | O | 「주대상」 | **「대상」** (미니카드 이름으로) |
| 과목 | O | O | O | 과목 | 그대로 |
| 원생수 | O | O | O | 「정원」 | **「원생수」** (미니카드 이름으로) |
| 수업운영방식 / 수업형태 | O(수업운영방식) | O(수업형태) | O(수업형태) | 수업형태 | 그대로 |
| 슬로건 | O | O | O | 없음 | **본문 「슬로건」** |
| 특징 1~3 | — | O(1) | O(3) | 특징(3) | 그대로 |
| 소개 | — | — | O | 없음 | **본문 「소개」** |
| 쪽지 문의 | — | — | — | 쪽지 문의 | 그대로 (확대카드 전용) |

## 3. 수정 내용

- `preview/home-ui/src/detail-decision/tutor-detail.js`: 칸 추가(사진·성별·원생수·슬로건·제출자료·주교재·학적상태·학교·학과·소개), 「대상」 값을 grade_band 로, 「학력」을 「학적상태」·「학교·학과」로 나눔(미니카드 오버레이 칸과 같음, 손님 「로그인 후 확인」 유지). 순서 = 기본카드 항목 → 픽 추가 → 프라임 추가.
- `preview/home-ui/src/detail-decision/studyroom-detail.js`: 칸 추가(사진·슬로건·소개), 「주대상」→「대상」, 「정원」→「원생수」.
- `preview/home-ui/src/exposure-render.js`: `renderMedia` · `listingImage` 에 `export` 만 붙임(미니카드 출력 변화 없음).
- `detail-shell.js` 수정 없음. 새 CSS 없음(사진은 기존 `expo-media--pick` 크기).
- 검사: `scripts/verify-detail-card-all-fields.mjs`, `package.json` `verify:detail-card-all-fields`.

## 4. 검증

| 검사 | 결과 |
|---|---|
| `verify:detail-card-all-fields` (작업 트리) | **142 passed, 0 failed** |
| `verify:detail-card-all-fields -- --ref 90cc0f0` (수정 전) | **90 passed, 32 failed** (빠진 칸·「대상」 값 불일치·손님 학적상태/학교 칸 없음) |
| `verify:no-sample-data` | OK |
| `verify:shop-page` | 통과 (exit 0) |
| `verify:card-visual` | 34 PASS / 0 FAIL |
| `verify:card-visual:penetration` | 37 PASS / 0 FAIL / 1 INFO |
| `smoke:paid-badges-proof` | 통과 |
| `verify-map-center-by-role` | 42 passed, 0 failed |
| `verify-parent-review-positive` | 11 PASS / 0 FAIL |
| `verify-message-permissions-admin` | 134 PASS / 0 FAIL |
| `verify:tutor-region-unit` | 127 passed, 7 failed — **수정 전(90cc0f0)에도 같은 127/7**. origin/main 의 `coarseRegionForGuest` 시그니처가 바뀌어 스크립트의 「origin/main 읽기」가 실패하는 것(origin/main 253116a 에서 스크립트 수정됨). 이번 변경과 무관. 확대카드 손님 과외지역 검사는 통과. |
| `npm run build:dothome` | 성공 (산출물 커밋 안 함) |

검사 내용: 미니카드 4종(베이직 목록·베이직 표·픽·프라임) × 과외쌤·공부방을 실제 렌더해 항목을 모으고, 각 항목이 확대카드 칸에 있는지·값이 같은 필드인지·배지가 상단에 있는지 확인. 베이직/픽/프라임 item 확대카드 칸 목록 동일. 빈 item 은 깨지지 않고 칸 값이 「—」/「로그인 후 확인」뿐, 사진은 미니카드와 같은 기본 표시, 견본 문구 없음. 손님 지역 넓게·로그인 후 확인 유지, 6개 viewer 에서 실명·연락처 비노출.

## 5. 서버 필드 부족 (고치지 않음)

과외쌤 검색 응답(`SearchService::searchTutors`)과 프런트 매핑(`search-exposure-mapper.js`, `home-basic-live.js` `mapTutor`, `exposure-bridge.js`)에 아래 필드가 없다. 확대카드 칸은 생겼지만 실데이터에서는 「—」(사진은 이니셜 기본 표시)로 나온다. 미니카드도 같은 이유로 비어 있다.

- 사진 `image_path`, 성별 `gender`, 대상 `grade_band`, 원생수 `student_gender_group`·`student_count_group`, 수업장소 `lesson_places`, 특징 `feature_1~3`, 슬로건 `slogan`, 주교재 `main_material_note`, 강의스타일 `teaching_style_badges`, 제출자료 수 `verification_doc_count`(`proof_document_available` 만 있어 최대 「1개 공개」), 소개 `intro_short`.
- 홈 베이직 매핑 `home-basic-live.js` `mapTutor` 는 서버가 주는 일정 `lessons_per_week`·`minutes_per_lesson` 도 넘기지 않는다(찾기 화면 매퍼는 넘김).
- 과외쌤 소개: 서버에 `intro_short` 가 없어 매퍼가 `summary` 둘째 줄을 쓰는데, 그 줄은 「경력 y4_6」 같은 경력 코드다. 확대카드 「소개」와 프라임 미니카드 「소개」에 그 문자열이 보일 수 있다(기존 매핑 문제, 이번에 안 고침).

공부방 검색 응답은 표의 필드를 모두 준다.

## 6. 애매했던 점

- 과외쌤 기존 「대상」 칸은 학생구성(성별·인원) 값을 보여 주고 있었다. 미니카드는 그 값을 「원생수」, grade_band 를 「대상」이라 부르므로 미니카드 이름에 맞췄다.
- 공부방 「주대상」·「정원」을 미니카드 이름 「대상」·「원생수」로 바꿨다. 「수업운영방식」(베이직)/「수업형태」(픽·프라임)는 같은 필드라 기존 확대카드 이름 「수업형태」 한 칸으로 뒀다.
- 슬로건은 미니카드가 특징과 같은 문구면 숨기지만(`distinctSlogan`), 확대카드는 원문 그대로 보인다(값이 있는데 「—」로 보이지 않게).
- 제출자료는 미니카드의 로그인 게이트 버튼 대신 「N개 공개」 글자만 보인다(로그인 회원을 게이트로 보내지 않도록).
- 미니카드 배지의 옛 `item.badges` 대체 경로는 확대카드 상단에 없다. 현재 매퍼의 `badges` 는 신뢰배지 계산과 같은 값이라 차이 없음.
- 브라우저 화면 확인은 하지 않았다(확대카드는 로그인 필요, 운영 접속 금지).
