# 164 · Strong-review ACCEPT · 모드점검 P0 N1–N4 (N4 rework)

- 일시: 2026-09-28 ~07:15 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 diff/소스 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- HEAD: `fa3762d6da16a3e47ae5a53ff600831d7facad93` (`feat(guest,tutor,member): tickets 150-151-161 …`)
- 164 커밋: **없음** (워킹트리 dirty · push/build 없음 — 150/151/161과 동일 WIP 수용)
- 증거 복사: `/workspace/164-review-rework/`
- 선행 REJECT: `/workspace/164-review/164-mode-audit-p0-REJECT-2026-09-28.md` (N4 microtask chase)
- Notion: 미사용
- 판정: **ACCEPT** · next=**165**

---

## 0. 한 줄

N4 밴드에이드(학생 페인트 후 `queueMicrotask` chase)를 제거하고, `auth-role` + `studyRoomMypageEntry`로 **렌더 전** resolve · screens는 students URL이어도 **study-room 등록만** 그린다. N1–N3 유지.

---

## 1. 실측 상태

| 항목 | 값 |
|------|-----|
| HEAD | `fa3762d` (150–151–161) — 164 커밋 아님 |
| 164 변경 | dirty 18 tracked + untracked `auth-role.js` · `+122/−38` |
| push / `build:dothome` | 없음 |
| 무관 dirty | `?? docs/046…` `?? docs/047…` `?? docs/README.md` `?? public/assets/teaser-…` |

### 변경 파일 (실제)

```
preview/home-ui/src/auth-role.js            (NEW · leaf snap)
preview/home-ui/src/auth-session.js         (noteAuthRoleType)
preview/home-ui/src/state.js                (studyRoomMypageEntry · bootstrap · getMypagePath)
preview/home-ui/src/main.js                 (render 전 bootstrapMypageRoute)
preview/home-ui/src/mypage/screens.js       (students → study-room 즉시 렌더 · sync replace)
preview/home-ui/src/mypage/shell.js
preview/home-ui/src/layout.js
preview/shared/site-nav-config.js           (memberHomeHashPath = roleHomeHashPath)
preview/home-ui/src/nav-config.js
preview/search-ui/src/student-hope-type.js
preview/home-ui/src/{support,guide,concern,promo,plans,policy,library,messages}/shell*
preview/home-ui/src/home-marketing-banner.js
```

`mypage/index.js` · `mypage/router.js` **미수정** (index의 parent-only microtask는 HEAD 기존).

---

## 2. Claim vs actual

| Claim | Actual | Result |
|-------|--------|--------|
| `studyRoomMypageEntry` + `auth-role` | `state.js` L683–696 · `auth-role.js` `isStudyRoomAuth()` | **OK** |
| bootstrap/getMypagePath resolve before render | `main.js` L126–127 bootstrap before `renderScreen`; `getMypagePath` L856–864 roomEntry first; mypage `shouldPaintBeforeSession` → false | **OK** |
| screens.js no student paint | study_room + students → `renderStudyRoomRegScreen` sync; `isStudentRegPath` 이전에 return | **OK** |
| no microtask (N4) | study_room 블록 sync `location.replace`; index study_room chase 없음. 잔존 microtask = tutor/parent **기존** | **OK** |
| N1–N3 kept | 헤딩「등록」· shells `memberHomeHashPath(getAuthUser())` | **OK** |
| `memberHomeHashPath=roleHomeHashPath` | thin alias + 주석 | **OK** |
| no first-paint student empty | mypage waits session; auth snap set in `applyRoleContext`; path remapped before paint; screens belt | **OK** |
| tutor/student entry untouched | tutor block still `getTutorEntryPath`+기존 microtask; router helpers no diff; parent index microtask unchanged | **OK** |

---

## 3. N별 판정

### N1 · 「의뢰」→「등록」 — PASS

```js
// student-hope-type.js L51
<h2 class="search-hope-gate__title">어떤 학생 등록을 볼까요?</h2>
```

- `preview/search-ui/src/**/*.js` 「의뢰」 **0건** (실머신 Select-String)
- API/DB rename 없음

### N2 · 「메인 홈」「홈으로」→ 역할 홈 — PASS

```js
// site-nav-config.js
export function memberHomeHashPath(user) {
  return roleHomeHashPath(user);
}
```

- support/guide/concern/promo/plans/policy/library/messages + 배너「홈으로」에 `memberHomeHashPath(getAuthUser())`

### N3 · 게스트 커뮤니티 → `#/guest` — PASS

- `concern/shell.js`: `memberHomeHashPath(getAuthUser())` · 비로그인 → `/guest`

### N4 · 공부방 mypage → study-rooms/{id} — PASS (rework)

**루트 수정 (선행 REJECT 해소):**

1. `auth-role.js` leaf — 세션 `role_type` 스냅 (`study_room_owner`)
2. `auth-session.applyRoleContext` → `noteAuthRoleType` (로그인/하이드레이트와 동기)
3. `studyRoomMypageEntry` — `/mypage`·home·registrations·**registrations/students** → `getStudyRoomEntryPath()`
4. `bootstrapMypageRoute` / `getMypagePath`가 entry를 **우선**
5. `main.render`: mypage면 bootstrap **후** `renderScreen`
6. `shouldPaintBeforeSession`: mypage는 session 전 페인트 **금지**
7. `screens.js`: students 경로도 study_room이면 **즉시** `renderStudyRoomRegScreen` (sync replace · microtask 없음)

```js
// state.js
function studyRoomMypageEntry(path) {
  if (!isStudyRoomAuth()) return null;
  const p = String(path || '').split('?')[0];
  if (
    p === '/mypage' || p === '/mypage/' ||
    p === '/mypage/home' || p === '/mypage/registrations' ||
    p === '/mypage/registrations/students'
  ) {
    return getStudyRoomEntryPath();
  }
  return null;
}

export function getMypagePath() {
  // ...
  const roomEntry = studyRoomMypageEntry(pathOnly);
  if (roomEntry) return roomEntry;
  // ...
}
```

```js
// main.js
function render() {
  if (isMypageRoute()) bootstrapMypageRoute();
  // then renderScreen()
}
function shouldPaintBeforeSession() {
  if (isAdminRoute() || isMypageRoute() || /* ... */) return false;
  // ...
}
```

```js
// screens.js — no student first paint
const r =
  sessionRole === 'study_room' || isStudyRoomAuth()
    ? 'study_room'
    : role === 'guest' ? 'parent' : role;

if (
  r === 'study_room' &&
  (path === '/mypage/home' ||
    path === '/mypage/registrations' ||
    path === '/mypage/registrations/students')
) {
  const entry = getStudyRoomEntryPath();
  // sync replace (not queueMicrotask)
  if (p !== entry) window.location.replace(`#${entry}`);
  if (isStudyRoomRegPath(entry)) return renderStudyRoomRegScreen(entry);
  return renderStudyRoomRegScreen('/mypage/registrations/study-rooms');
}
// isStudentRegPath 는 이 블록 이후에만 도달
```

```js
// auth-role.js
export function isStudyRoomAuth() {
  return roleType === 'study_room_owner';
}
```

**id:** `getStudyRoomEntryPath()` → `getStudyRooms()[0].id` · `7` 하드코딩 없음.

**tutor/student 미접촉:**

```js
// screens.js tutor — 기존 패턴 유지 (N4 비대상)
if (r === 'tutor' && (path === '/mypage/home' || path === '/mypage/registrations')) {
  const entry = getTutorEntryPath();
  queueMicrotask(() => { /* hash chase */ });
  return renderTutorRegScreen(...);
}

// index.js — parent only (HEAD 기존 · study_room chase 없음)
if (getNavRole() === 'parent') {
  // queueMicrotask bare /mypage → parent default
}
```

`mypage/router.js` getTutorEntryPath / getStudyRoomEntryPath / getDefaultMypagePath **diff 없음**.

---

## 4. MUST / MUST NOT

| MUST | 결과 |
|------|------|
| N1 헤딩 「등록」 | PASS |
| N1 search-ui src 「의뢰」0 | PASS |
| N2 역할 홈 | PASS |
| N3 guest community→guest | PASS |
| N4 study-rooms/{id} 첫 진입 · 학생 빈화면 미페인트 | **PASS** |
| 로컬 커밋 1개 | **WIP** (150/151/161과 동일 · parent stage 시 커밋) |

| MUST NOT | 결과 |
|----------|------|
| 학생 0명 첫 페인트 후 chase | **해소** |
| id `7` 하드코딩 | 없음 |
| tutor/student 진입 수술 | 미접촉 |
| API/DB rename · push · Notion · 146–148 / 165–167 | 없음 |

---

## 5. 스모크 S1–S10 (코드 정적 · 브라우저 미실행)

| # | 기대 | 정적 판정 |
|---|------|-----------|
| S1 | 헤딩 등록 · 의뢰 없음 | PASS |
| S2–S5 | support/배너 역할 홈 | PASS |
| S6 | guest community→guest | PASS |
| S7 | 공부방 mypage→study-rooms/{id} | **PASS** — resolve-before-render + screens 즉시 study-room |
| S8–S9 | tutor/student 진입 | PASS (미수정) |
| S10 | guest 메인 홈 | PASS |

---

## 6. 증거 경로

- Box: `/workspace/164-review-rework/` (auth-role/state/screens/main/… · `164-full.diff` · HEAD/status)
- Prior REJECT: `/workspace/164-review/164-mode-audit-p0-REJECT-2026-09-28.md`

---

## 7. ACCEPT 붙여넣기 (부모/티켓 · next=165)

```
ACCEPT 164 P0 N1–N4 rework (2026-09-28 KST)

HEAD fa3762d · dirty WIP (+122/−38 · auth-role.js NEW) · 164 커밋 없음(WIP OK) · push/build/Notion 없음
증거 /workspace/164-review-rework/

PASS N1: 「어떤 학생 등록을 볼까요?」 · search-ui/src「의뢰」0
PASS N2/N3: memberHomeHashPath ≡ roleHomeHashPath · shells+배너
PASS N4: studyRoomMypageEntry+auth-role · bootstrap/getMypagePath 렌더 전 resolve
  · main mypage bootstrap→render · shouldPaintBeforeSession=false(mypage)
  · screens students→renderStudyRoomRegScreen sync (no microtask chase / no student empty paint)
  · tutor/student entry·router 미접촉 · id 7 없음
선행 REJECT(N4 microtask chase) 해소

next=165
acceptance: docs/164-mode-audit-p0-acceptance-2026-09-28.md
```
