# 272 과외쌤 상세정보 — 상세등록 화면과 마이페이지 상세정보 탭을 한 벌로 통일

> **상태: 확정됨 (2026-10-20 종현 확정).** 이 문서에 적힌 것만 한다. 아래 「허용 파일」 밖은 손대지 않는다.
> 이 문서는 저장소에 올라가 있어도 **시작 조건(1장)을 지키기 전에는 시작하지 않는다.** 범위 밖 수정이 필요하면 고치지 말고 멈추고 보고한다(8장).

- 작업 번호: 272 (248-1 묶음 12, L-20 = X-3)
- 날짜: 2026-10-20
- 브랜치 이름: `cursor/272-tutor-detail-unify`
- 박스 사본: `/workspace/study114/handoffs/272-cursor-directive-tutor-detail-unify.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/272-cursor-directive-tutor-detail-unify.md`
- 기준 코드: `origin/main` `addd3f6a`. 시작할 때 최신 `origin/main`에서 다시 확인한다(1장).
- 모델: **grok-4.7 high만** 쓴다. fast 모델 금지.
- 요약: 과외쌤 상세정보 입력이 두 벌이다. 상세등록(`tutor-ui` step-lesson·step-contact, 라디오 카드)과 마이페이지 상세정보 탭(`home-ui/src/tutor-reg/screens.js` `renderDetailForm`, 셀렉트)이 같은 필드를 따로 그린다. **공부방이 c3f8edb9에서 한 방식 그대로**, 마이페이지 탭이 `tutor-ui` 화면을 불러다 쓰게 바꾸고 중복 코드를 지운다.

> 쉬운 말 안내: 같은 내용을 적는 종이가 두 장이라서 모양도 이름도 조금씩 다릅니다. 가입 때 쓰는 종이 한 장만 남기고, 마이페이지에서도 그 종이를 그대로 펼쳐 보이게 합니다. 공부방은 이미 이렇게 되어 있습니다.

---

## 0. 결정 확인 (2026-10-20 종현 확정, 임의로 바꾸지 말 것)

| # | 항목 | 확정값 |
|---|---|---|
| 1 | 정본(한 벌) | **`preview/tutor-ui/src/screens/step-lesson.js`(상세1)·`step-contact.js`(상세2)**. 마이페이지가 이것을 재사용한다. |
| 2 | 본뜰 모양 | 공부방 `preview/home-ui/src/study-room-reg/embedded-panels.js` (c3f8edb9, 6d00d433). 마이페이지 안에서 그대로 보이고, 다른 화면으로 보내지 않는다(리다이렉트 금지). |
| 3 | 지울 것 | `tutor-reg/screens.js`의 `renderDetailForm`, `inline-save.js`의 `saveTutorDetailInline`, `screens.js:395-420` 부근 중복 목록(`FEE_BASIS_OPTS`·`GENDER_GROUP_OPTS`·`STUDENT_COUNT_OPTS`). |
| 4 | 남길 것 | 상세정보 탭 하단 **프로필 사진**(`profile-photos.js`)은 그대로 아래에 붙인다. 기본정보 탭(`renderBasicForm`·`saveTutorBasicInline`)은 이번 범위 아님. |
| 5 | 서버 | `/api/tutor/register.php`는 **바꾸지 않는다.** 이미 양쪽이 같은 `action:'save'`·step(lesson/career/contact)을 쓴다. |
| 6 | 디자인 | 마이페이지 틀·폼 디자인이 **깨지거나 나빠지면 실패**(5장). |

### 0-1. 선행 조건 확인 결과 (묶음 6 라벨)

- 248-1은 「묶음 6(L-09·L-10) 뒤에 할 것」이라고 적었다.
- git 확인: **L-10은 끝남** — 264 지시서(`docs/worklog/grok-sync/docs/264-cursor-directive-label-unify.md`), 커밋 `1427e662` 「264 fix(copy): 지도 성별·수업시간·산정방식 표시…」. 이어서 `a2b612cb`(269-1, 상세등록 라디오 한 줄) 반영.
- **L-09(천원 표기)는 264에서 「현행 유지」로 확정**되어 작업 대상이 아니다. 따라서 선행 조건은 충족됐다고 본다.
- 이번 작업에서 라벨 문구는 **`tutor-ui` 쪽 값을 그대로** 쓴다. 새 라벨을 만들지 않는다.

---

## 1. 시작 조건

1. `git fetch` 후 `addd3f6a`가 최신 `origin/main`의 조상인지 확인한다. 아니면 시작하지 말고 보고한다.
2. 최신 `origin/main`에서 새 브랜치 `cursor/272-tutor-detail-unify`를 만든다. 같은 이름 브랜치가 이미 있으면 멈추고 보고한다.
3. `git status`가 깨끗한지 확인한다.
4. **push까지만 한다. `main` 병합·배포·force-push 금지.**

```bash
git fetch origin
git rev-parse origin/main
git merge-base --is-ancestor addd3f6a origin/main && echo ANCESTOR-OK
git status --short
git checkout -b cursor/272-tutor-detail-unify origin/main
```

---

## 2. 문제 (`addd3f6a` 기준, 작업자가 줄 번호 다시 확인)

| 구분 | 상세등록 (정본) | 마이페이지 상세정보 탭 (지울 쪽) |
|---|---|---|
| 화면 | `preview/tutor-ui/src/screens/step-lesson.js`, `step-contact.js` | `preview/home-ui/src/tutor-reg/screens.js` `renderDetailForm` (497행~) |
| 모양 | 라디오 카드 (`radios()` 25행) | 셀렉트 (515·523·527행) |
| 선택지 목록 | `preview/tutor-ui/src/state.js` (`GENDER_GROUP_OPTIONS` 등) | `screens.js:395-420` 따로 정의 |
| 검사 | `form-collect.js` `validateLessonState` | `inline-save.js` 자체 |
| 저장 | `save-flow.js` → `register-api.js` `saveStep` | `inline-save.js` `saveTutorDetailInline` → `postRegisterSave('lesson'/'career'/'contact')` |
| API | `/api/tutor/register.php` | 같음 |

- 갈라진 시점: `ca075c50` (2026-08-04)에서 마이페이지 인페이지 수정을 **새로 그려서** 만들었다. 둘로 둔다는 결정 기록은 없다.
- 공부방은 `c3f8edb9`·`6d00d433` (2026-08-21)에서 `embedded-panels.js`로 이미 한 벌이다.

---

## 3. 수정

### 3-1. `tutor-ui` 화면을 끼워 쓸 수 있게 (정본 쪽, 동작 변경 없음)

- `step-lesson.js`·`step-contact.js`에 공부방 `renderLessonFormHtml({ includeStepNav, includeFooterActions })`와 같은 **옵션형 HTML 함수**를 export한다.
- 기본값은 지금 상세등록 화면과 **완전히 같은 결과**가 나와야 한다(상세등록 화면은 바뀌지 않음).
- 마이페이지용으로는 단계 표시(1/2)·「이전/다음」 대신 「저장」 바닥줄을 쓴다.

### 3-2. 마이페이지 끼워 넣기

- 새 파일 `preview/home-ui/src/tutor-reg/embedded-panels.js`: 공부방 `embedded-panels.js` 구조를 본뜬다.
  - `loadTutor`/`fetchMasters`로 `registerState`를 채우고, 3-1 함수로 그리고, `saveAndNavigate`/`withSaving`으로 저장한다.
  - 저장 성공 뒤 `hydrateRegistrationsCache`로 마이페이지 캐시를 갱신한다.
  - 「등록점검으로 돌아가기」 배너(`renderReturnToRegistrationCheckBanner`)를 지금처럼 위에 둔다.
  - 아래에 `renderTutorProfilePhotoEditor`/`bindTutorProfilePhotos`를 지금과 같은 위치에 붙인다.
- `preview/home-ui/vite.config.js`: `@study-room-ui`와 같은 방식으로 `@tutor-ui` 별칭을 하나 추가한다.
- `screens.js`: `sec === 'detail'`와 `renderDetailBridge`가 새 패널을 쓰게 바꾼다.

### 3-3. 지우기

- `screens.js`: `renderDetailForm`, 상세 전용 바인딩(782행 부근 `fee_basis_type` 수집 등), `FEE_BASIS_OPTS`·`GENDER_GROUP_OPTS`·`STUDENT_COUNT_OPTS`.
- `inline-save.js`: `saveTutorDetailInline`과 그것만 쓰는 도우미. `saveTutorBasicInline`과 홍보 채널 보존 규칙(`promoFieldsIfPresent`의 「없는 키를 빈 값으로 보내지 않음」)은 **새 경로에서도 지켜져야 한다** — 지키지 못하면 멈추고 보고.

### 3-4. 하지 않는 것

- 서버(PHP)·DB·`register.php` 변경 금지.
- 기본정보 탭, 공부방·학생 화면, 라벨 문구 새로 만들기 금지.
- 토큰 값 변경·새 토큰 추가 금지.

---

## 4. 수정 후 (기대 결과)

- 마이페이지 상세정보 탭과 상세등록 1·2단계가 **같은 칸·같은 모양(라디오 카드)·같은 라벨·같은 검사**를 쓴다.
- 상세등록 화면의 모양·동작은 고치기 전과 같다.
- 프로필 사진 칸은 탭 하단에 그대로 있다.
- 중복 목록·`renderDetailForm`·`saveTutorDetailInline`은 저장소에 없다(`rg`로 0건).

---

## 5. 검수 (필수 — 하나라도 실패면 멈추고 보고)

### 5-1. 디자인 (깨지거나 나빠지면 실패)

1. 화면 폭 **1280px(PC)·390px(모바일)** 에서 **고치기 전/고친 후** 를 찍는다.
   - 마이페이지 → 내 등록 → 상세정보 탭 (위·아래 전체, 프로필 사진 포함)
   - 상세등록 1단계, 2단계
   - → 3화면 × 2폭 × 전/후 = **12장**. 보고 때 **전/후를 나란히 붙인 비교 이미지**로 낸다.
2. 확인 항목:
   - 마이페이지 틀(좌측 메뉴·탭 바·가운데 칸 폭)이 그대로다.
   - 칸 사이 간격이 일정하다(같은 종류 칸끼리 간격 차이 0px, `getBoundingClientRect()`로 잰다. 눈대중 금지).
   - 버튼은 **디자인통일매뉴얼 003 §2·§2-1** 기준: 최종 저장만 강한 Primary(`#266BC4`, 44, 16px), 그 밖은 톤다운(일반 30 / 작은 26, 14px/600, 바탕 `#729FD9`·글자 `#0B2545`, radius 6). 근거: 265 지시서 0장·2-0.
   - 모바일 390에서 가로 넘침·글자 잘림이 없다.

### 5-2. 전체 과정 확인 — **두 번** (서로 독립된 2회)

- 1회차와 2회차는 **각각 새 시험 계정**으로 처음부터 끝까지 따로 돈다(기존 계정·데이터는 지우지 않는다). 1회차 결과를 2회차에 이어 쓰지 않는다.
- **고치기 전**에도 같은 과정을 한 번 돌아 기준값을 남긴다(비교용).
- 과정:
  1. 가입 → 기본등록 → **상세등록 1** → **상세등록 2** → **등록점검** → **마이페이지 상세정보 탭 수정** → **저장** → **새로고침(F5) 후 다시 열기** → 값 확인.
  2. 이동 버튼: 상세 1·2의 **「이전」「다음」「다음에 하기」** 를 각각 눌러 본다.
  3. **L-02 재확인**: 상세 1에 값을 넣고 「다음」 없이 「이전」으로 나갔다가 다시 들어오면 값이 남아 있어야 한다(48ca4858 동작 유지). 마이페이지 탭에서도 입력 뒤 다른 탭으로 갔다 오기를 확인한다.
  4. 등록점검의 「상세정보로 이동」 등 각 링크가 마이페이지 상세정보 탭(또는 지금과 같은 목적지)으로 가고, 「등록점검으로 돌아가기」가 동작한다.
- **라우팅 기록**: 화면이 바뀔 때마다 URL·해시(`#/...`)를 적고, 브라우저 **뒤로 가기**를 눌러 앞 화면으로 바르게 돌아가는지 적는다.
- **API 기록**: 개발자 도구 네트워크에서 `/api/tutor/register.php` 요청마다 `action`(load/save/masters)·`step`·보낸 값·응답(`ok`, 상태 코드)을 적는다. 저장 뒤 `load` 응답(또는 DB)에서 **저장한 값이 실제로 남아 있는지** 확인한다(홍보 채널 값이 지워지지 않았는지 포함).
- 결과는 아래 표로 **회차마다 따로** 보고한다.

| 단계 | 이동 전→후 URL/해시 | 뒤로 가기 | API 요청(action/step) | 응답 | 저장값 유지 | 1회차 | 2회차 |
|---|---|---|---|---|---|---|---|
| 상세1 다음 | ? | ? | ? | ? | ? | 통과/실패 | 통과/실패 |
| … | | | | | | | |

- **어느 회차든 하나라도 실패하면 거기서 멈추고 그 값 그대로 보고**한다(8장). 고쳐서 다시 돌리기 전에 보고가 먼저다.

### 5-3. CI·빌드

- `.github/workflows/tutor-mypage-frame-ia.yml` (`npm run verify:tutor-mypage-frame-ia`, `npm run build`) 통과.
- `.github/workflows/tutor-lesson-step-gate.yml` (`npm run verify:tutor-lesson-optional-step`, `npm run build`) 통과.
- `home-ui`·`tutor-ui` 각각 `npm run build` 통과. e2e `e2e/core-flow-mypage.spec.js`가 있으면 돌려 결과 첨부.

---

## 6. 금지 범위

1. **허용 파일(7장) 밖 수정 금지.**
2. 서버·DB·토큰 변경 금지.
3. 상세등록 화면 모양·동작 변경 금지(끼워 쓰기 옵션 추가만).
4. 기본정보 탭·공부방·학생 화면 금지.
5. `git add -A` 금지(파일 이름으로 add), **force-push 금지**, `main` 병합·배포 금지.

---

## 7. 허용 파일과 예상 크기

| # | 파일 | 바뀔 것 |
|---|---|---|
| 1 | `preview/home-ui/src/tutor-reg/embedded-panels.js` (새 파일) | 상세1·2 끼워 쓰기 + 사진 칸 |
| 2 | `preview/home-ui/src/tutor-reg/screens.js` | `detail` 연결 교체, `renderDetailForm`·중복 목록·상세 바인딩 삭제 |
| 3 | `preview/home-ui/src/tutor-reg/inline-save.js` | `saveTutorDetailInline` 삭제 |
| 4 | `preview/tutor-ui/src/screens/step-lesson.js` | 옵션형 HTML 함수 export |
| 5 | `preview/tutor-ui/src/screens/step-contact.js` | 옵션형 HTML 함수 export |
| 6 | `preview/tutor-ui/src/form-collect.js` | 끼워 쓸 때 필요한 export만 (필요할 때만) |
| 7 | `preview/tutor-ui/src/state.js` | 마이페이지에서 상태 초기화용 export만 (필요할 때만) |
| 8 | `preview/home-ui/vite.config.js` | `@tutor-ui` 별칭 1줄 |
| 9 | `e2e/helpers/mypage-flow.js` | 셀렉트→라디오 바뀐 선택자만 (필요할 때만) |

- 허용 밖 파일(예: CSS, `profile-photos.js`, `registration-check-*`, `scripts/verify-*`, PHP)이 필요하면 **멈추고 보고**(8장).

---

## 8. 멈추고 보고할 때

1. 허용 파일 밖을 고쳐야 할 때.
2. 상세등록 화면 모양·동작이 조금이라도 바뀔 때.
3. 5-1 디자인 확인에서 고치기 전보다 나빠졌을 때.
4. 5-2 과정 확인에서 **어느 회차든** 하나라도 실패했을 때.
5. 홍보 채널 등 저장값이 지워지거나, 저장 뒤 캐시가 갱신되지 않을 때.
6. CI(5-3)가 실패할 때.
7. 시작 조건(1장)이 안 맞을 때.

---

## 9. 작업 순서와 커밋 나누기

1. 시작 조건(1장) → 브랜치 생성.
2. **고치기 전** 스크린샷 12장(5-1) + 기준 과정 기록 1회(5-2).
3. 커밋을 **논리 단위로 나눈다** (예시):
   - `272-1 refactor(tutor-ui): 상세1·2 폼 HTML을 끼워 쓸 수 있게 옵션 함수로 낸다` (4·5·6·7번 파일)
   - `272-2 feat(mypage): 과외쌤 상세정보 탭이 상세등록 화면을 그대로 쓴다` (1·2·8번 파일)
   - `272-3 chore(mypage): 쓰지 않는 상세 폼·저장 함수·중복 선택지 목록을 지운다` (2·3번 파일)
   - (필요할 때만) `272-4 test(e2e): 마이페이지 상세 탭 선택자를 맞춘다` (9번 파일)
4. 빌드 → **고친 후** 스크린샷(5-1) → 과정 확인 **1회차·2회차**(5-2) → CI(5-3).
5. 파일 이름으로 `git add` → 커밋 → `git push origin cursor/272-tutor-detail-unify`.
6. **push 후 멈춤.**

---

## 10. 확인 방법

```bash
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
rg -n "renderDetailForm|saveTutorDetailInline|FEE_BASIS_OPTS|GENDER_GROUP_OPTS|STUDENT_COUNT_OPTS" preview/home-ui/src/tutor-reg
```

- 기대: 바뀐 파일은 7장 목록 안. `rg` 결과 0건. PHP 변경 0건.

---

## 11. 완료 보고 형식

1. **커밋**: 브랜치 이름, 커밋 해시 전부(순서대로), 시작 기준 `origin/main` 해시.
2. **바뀐 파일:줄**: 파일별 추가/삭제 줄 수.
3. **디자인 비교**(5-1): 전/후 나란히 비교 이미지 6쌍, 간격 실측값, 버튼 크기·색 확인.
4. **과정 확인 표**(5-2): 고치기 전 기준 1회 + 고친 후 **1회차·2회차 따로**. 라우팅(URL·해시·뒤로 가기), API(요청·응답·저장값), L-02, 등록점검 링크.
5. **CI 결과**(5-3): 두 워크플로 통과 링크 또는 로그.
6. 범위 확인 문장: 「7장 밖 파일, 서버·DB, 토큰, 기본정보 탭, 공부방·학생 화면은 건드리지 않았습니다.」
7. 상태: push까지 했고 병합·배포는 하지 않았다.
