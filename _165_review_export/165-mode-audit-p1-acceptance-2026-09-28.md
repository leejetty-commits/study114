# 165 · Strong-review ACCEPT · 모드점검 P1 N5–N10

- 일시: 2026-09-28 ~07:38 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 diff/소스 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 경로: `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- HEAD: `fa3762d6da16a3e47ae5a53ff600831d7facad93` (`feat(guest,tutor,member): tickets 150-151-161 …`)
- 165 커밋: **없음** (워킹트리 dirty · push/build 없음 — 164 WIP와 동일 수용)
- 증거 복사: `/workspace/165-review/` · 머신 `D:\work\study114\_165_review_export\`
- 선행: 164 ACCEPT (`docs/164-mode-audit-p0-acceptance-2026-09-28.md` · N4 rework)
- Notion: 미사용
- 판정: **ACCEPT** · next=**166**

---

## 0. 한 줄

N5–N10 전부 소스 게이트로 충족. ACL/PHP 개방 없음. 164 N4(`studyRoomMypageEntry`·screens belt) 유지. claim의 `state.js`는 support hub 부분만 165, 나머지는 164 WIP.

---

## 1. 실측 상태

| 항목 | 값 |
|------|-----|
| HEAD | `fa3762d` (150–151–161) — 165 커밋 아님 |
| dirty | tracked 27 · `+223/−59` (164 WIP + 165 claim 혼재) |
| push / `build:dothome` | 없음 |
| PHP / ACL 파일 | **diff 0** (개방 없음) |
| 무관 dirty | `?? docs/046…` `?? docs/047…` `?? docs/README.md` `?? public/assets/teaser-…` · `_164/_165_review_export` |

### Claim vs actual (165 범위)

| Claim | Actual | Result |
|-------|--------|--------|
| `login-stage.js` N5 | `HOME_UI_BASE` strip + `/#/guest` | **OK** |
| `registrations-backend.js` N6 | `registrationListForRole(authRoleType())` 단일 게이트 | **OK** |
| `board-backend.js` N7 | `resolveHydrateNavRole` → blocked면 GET 생략 | **OK** |
| `plans/index.js` N8 A | parent → chrome+안내+`#/parent` | **OK** |
| `search-find-surface.js` N9 | hope set 시 기존 query merge · role 보존 | **OK** |
| `site-chrome.js` N10 | GNB support → `HOME/#/support` 허브 | **OK** |
| support `router/screens/nav` N10 | default `/support` · hub 렌더 · active=hub | **OK** |
| `state.js` support hub only | `bootstrapSupportRoute` hub 유지; N4 블록은 164 | **OK** |

의존(claim 밖 · 164 WIP 유지): `auth-role.js` · `auth-session.js`(`noteAuthRoleType`) — N6/N7 게이트가 세션 `role_type` 스냅을 읽음.

---

## 2. N별 판정

### N5 · 둘러보기 슬래시 — PASS

```js
// login-stage.js
const guestUrl = `${String(HOME_UI_BASE).replace(/\/$/, '')}/#/guest`;
```

- BEFORE: `` `${HOME_UI_BASE}#/guest` `` → `study114.net#/guest` (슬래시 누락)
- `preview-links.js` `envBase`도 trailing `/` 제거 → 결과 `…/#/guest`
- 로그인 폼·다른 카피 미접촉 · href만

### N6 · registrations fetch 게이트 — PASS (ACL 미개방)

```js
function registrationListForRole(roleType) {
  if (roleType === 'guardian_student') return 'students';
  if (roleType === 'study_room_owner') return 'studyRooms';
  if (roleType === 'tutor') return 'tutors';
  return '';
}
```

- 게스트/`''` → 세 API 모두 **호출 안 함** (캐시만 비움)
- 공부방→study-rooms만 · 과외→tutors만 · 학생→students만
- `listStudents|listStudyRooms|listTutors` 호출부는 **src 기준 `registrations-backend.js`만**
- `activateRegistrationsApi`는 로그인 세션 hydrate 경로; `applyRoleContext`→`noteAuthRoleType` 이후
- **PHP ACL diff 없음** · 「누구나 200」 개방 없음

### N7 · submission 게이트 — PASS

```js
function resolveHydrateNavRole(explicit) {
  const given = String(explicit || '').trim();
  if (given) return given;
  return authRoleType() || 'guest';
}
// hydrate: getBoardAccess(...).access === 'blocked' → fetch 생략
```

- BEFORE: `navRole` 빈 문자열이면 게이트 스킵 → submission 과호출
- AFTER: 세션 `role_type`/`guest`로 판정. `mapNavRoleToBoardRole`가 `study_room_owner`→`supply-room`, `guardian_student`→`demand` 인식
- submission LIST = `supply-tutor|admin`만 → 공부방·학생·게스트 **GET 0**; 과외는 유지
- 게스트 부트는 계속 `activateBoardApi({ navRole: 'guest' })`
- ACL 매트릭스/PHP **미수정**

### N8 · 학생 `#/plans` 크롬 A — PASS

- `guardPlansAccess('parent')` → `ok:false` (`GNB_VISIBILITY.parent.plans === 'hide'` 유지 → 유료상품 GNB 재노출 없음)
- `renderPlansStudentNotice()`: `renderHeader`+`renderFooter` + 안내 + `#/parent` 「학생 홈으로 이동」
- 카피: 「유료상품은 공부방·과외쌤 회원용이에요.」(제안문 후반 「홈으로 돌아가 주세요」는 버튼으로 대체 — MUST 충족)
- `canAccessPlansHub`인 study_room/tutor 분기는 기존 셸·카탈로그 경로 유지 (S9/S10 회귀 없음 · 소스)

### N9 · hope+role merge — PASS

```js
params.set('hope', hope);
if (!params.get('role')) {
  const role = state().role;
  if (role && role !== 'guest') params.set('role', role);
}
window.location.hash = `#/search/student?${params.toString()}`;
```

- BEFORE: `` `#/search/student?hope=…` `` 통째 교체 → `role` 유실
- AFTER: 기존 query merge · URL에 `role=parent` 있으면 유지 → `role=parent&hope=tutor`
- 해시 라우트 rename 없음 (`parent` 토큰 유지)

### N10 · 검색 GNB → `#/support` 허브 — PASS

- `site-chrome.js`: `supportHubUrl()` = `HOME_UI_BASE/#/support`; GNB href·click 모두 허브 (notice 직행 제거)
- search-ui `layout.js`가 `renderSiteHeader`/`bindSiteChrome` 사용 → 검색 GNB 적용
- `getDefaultSupportPath()` = `/support`; `normalizeSupportPath`가 hub 유지
- `bootstrapSupportRoute`: hub가 `/support`면 redirect 안 함 (구: 무조건 notice로 replace)
- `screens.js`: `/support` → hero+quick cards; `nav.js` active=`hub`

---

## 3. 164 N4 회귀 · MUST NOT

| 검사 | 결과 |
|------|------|
| `state.js` `studyRoomMypageEntry` + `isStudyRoomAuth` | **유지** (165 claim 밖 · 164 WIP) |
| `mypage/screens.js` study_room+students → 즉시 `renderStudyRoomRegScreen` | **유지** |
| `auth-role.js` leaf snap | **유지** |
| registrations/board PHP ACL 개방 | **없음** |
| 학생 GNB `plans: 'hide'` | **유지** |
| push / build:dothome / Notion | **없음** |
| 해시 라우트 rename | **없음** |

---

## 4. MUST / MUST NOT 체크

### MUST

| # | 요구 | 판정 |
|---|------|------|
| N5 | `…/#/guest` 슬래시 | PASS |
| N6 | 권한 없는 registrations GET 0 | PASS (소스 게이트) |
| N7 | 권한 없는 submission GET 0 | PASS |
| N8 | 학생 plans 크롬 또는 redirect | PASS (A) |
| N9 | `role=parent&hope=tutor` | PASS |
| N10 | 검색 GNB → `#/support` | PASS |

### MUST NOT

| 금지 | 판정 |
|------|------|
| ACL 완화로 403 침묵 | PASS (미개방) |
| 학생 GNB 유료상품 재노출 | PASS |
| push / 배포 / Notion | PASS |
| 164 N4 회귀 | PASS |

---

## 5. 스모크 매트릭스 (소스 기준 · 브라우저 Network 미실행)

| # | 기대 | 소스 판정 |
|---|------|-----------|
| S1 | 둘러보기 `/#/guest` | PASS |
| S2–S5 | 역할별 registrations/submission 과호출 제거 | PASS (게이트) |
| S6 | 학생 plans 크롬+안내 | PASS |
| S7 | hope+role | PASS |
| S8 | 검색 GNB support 허브 | PASS |
| S9–S10 | 공부방/과외 plans 회귀 없음 | PASS (분기 분리) |

실기기 Network 스모크는 배포/프리뷰 기동 후 운영 확인 권장(이번 심사 범위: 소스·diff).

---

## 6. 잔여 메모 (ACCEPT 감점 아님)

1. 로컬 커밋 1개 없음 — 164와 동일 WIP 수용. 코딩 완료 커밋은 운영 타이밍에.
2. N8 카피 제안 전문 중 「홈으로 돌아가 주세요」문장은 버튼 라벨로 대체.
3. `auth:role-change` 시 `activateBoardApi()`는 세션 `authRoleType` 기준(프리뷰 ACTIVE_ROLE 아님) — 서버 ACL과 일치, 403 스팸 방지에 유리.
4. dist 번들은 build 금지로 구코드 잔존 가능 — 배포 전 rebuild (티켓 Forbidden과 일치).

---

## 7. 판정

**ACCEPT** · next ticket **166** (모드점검 P2 카피·약관).

증거: `/workspace/165-review/` · 머신 `_165_review_export/` · 본 문서 → `docs/165-mode-audit-p1-acceptance-2026-09-28.md`
