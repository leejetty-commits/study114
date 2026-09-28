# 167 · Strong-review ACCEPT · 모드점검 P3 N22–N28 (내비·IA)

- 일시: 2026-09-28 14:17–14:35 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 `D:\work\study114` 소스/diff 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- HEAD: `9ee8454c858bfd69b97f38a9fa5555ec666366ee` — `fix(mode-audit): ship P0–P2 routing, gates, and Korean copy (164–166)`
- 167 커밋: **없음** · dirty WIP 16 tracked (`+73/−49`) · 기대 상태와 일치
- branch: `feat/student-mypage-a-g` (tracks `origin/main`, ahead not required for this review)
- push / `build:dothome` / Notion / commit: **없음** (준수)
- SSOT: `/workspace/study114-ds/docs/167-mode-audit-p3-nav-ia-ticket.md`
- 증거 staging: `/workspace/167-review/` · 머신 `D:\work\study114\docs\`
- 판정: **ACCEPT**
- Next note: evening **#342 gate fix** still pending separately (본 티켓 범위 밖)

---

## 0. 한 줄

N22–N28 MUST를 실머신 dirty WIP에서 소스 대조로 전부 PASS. 게스트 결제·등록 폼 개방 없음 · 공부방 GNB 과외쌤찾기 없음 유지 · 「학생 의뢰」 UI 0 · 해시 라우트 rename 0.

---

## 1. 실측 상태

| 항목 | 값 |
|------|-----|
| HEAD | `9ee8454` (P0–P2 ship) · 167 커밋 아님 |
| dirty tracked | 16 files · `+73/−49` (claimed allowlist와 일치) |
| untracked noise | `_164/_165/_166_review_export/`, docs 046/047/README/_166-*, `public/assets/teaser-…` — 167 범위 외 |
| 해시 라우트 rename | **없음** (`/mypage/wishlist`, `/mypage/student-review`, `/mypage/contact` path 유지 · 라벨만 변경) |
| `dist/` | stale 가능 — **src 기준 심사** · build 금지 준수 |
| 게스트 등록·결제 | 폼/계정결제 **미개방** (`guardRegisterAccess`→intro · `canAccessRegisterForms` guest false · plans login_gate) |

### Claimed files (전부 dirty 확인)

```
preview/home-ui/src/concern/shell.js
preview/study-room-ui/src/main.js
preview/tutor-ui/src/main.js
preview/home-ui/src/mypage/router.js
preview/home-ui/src/mypage/screens.js
preview/home-ui/src/mypage/plans-catalog.js
preview/home-ui/src/study-room-reg/format.js
preview/home-ui/src/study-room-reg/registration-check-model.js
preview/home-ui/src/study-room-reg/study-room-reg-copy.js
preview/home-ui/src/tutor-reg/registration-check-model.js
preview/home-ui/src/tutor-reg/registration-check-render.js
preview/home-ui/src/handoff-copy.js
preview/home-ui/src/guide/copy.js
preview/home-ui/src/guide/screens.js
preview/home-ui/src/home-marketing-banner.js
preview/search-ui/src/screens/search-page.js
```

---

## 2. N별 판정

| ID | 결과 | MUST | 근거·증거 |
|----|------|------|-----------|
| N22 | **PASS** | 게스트 `#/community` GNB ⊇ 게스트 홈의 공부방찾기·공부방상세정보 | `concern/shell.js`: `headerRole = isLoggedIn() ? role : 'guest'` → `renderHeader(headerRole)`. 비로그인 시 stale `ACTIVE_ROLE`(tutor 등)로 커뮤니티 GNB가 축소되던 경로를 차단. `site-nav-config.js` `GNB_VISIBILITY.guest` = ALL_SHOW (`find_room`·`register_room` show). |
| N23 | **PASS** | 게스트 상세등록·유료 = 소개+로그인 CTA · 빈 차단만 금지 · 실기능 미개방 | `study-room-ui`/`tutor-ui` `resolveRegisterMode`: `!isChromeLoggedIn()` → `'intro'` → `renderRegisterIntroGate` (title/lead/bullets + 로그인·회원가입). `plans/index.js` `renderPlansLoginGate` (유료 소개+로그인 CTA). `canAccessRegisterForms` guest false · `guardPlansAccess` guest → login_gate. **노트:** 티켓 카피 초안 문구와 기존 gate 카피는 다름 — MUST(소개+CTA)는 충족. |
| N24 | **PASS** | 학생 LNB 「내 문의 내역」→ `#/mypage/contact` | `mypage/router.js`: `CONTACT_HISTORY_PATH` roles `['parent','study_room','tutor']` · `PARENT_NAV_PATHS`에 추가 · `isParentLockedMypagePath`가 contact를 잠그지 않음. `mypage/shell.js` parent는 `PARENT_NAV_PATHS` 순서로 LNB 구성. |
| N25 | **PASS** | 관심 학생 / 찜한 공부방·과외쌤 구분 · path rename 금지 | `찜한학생`→`관심 학생` · `찜 목록`→`찜한 공부방·과외쌤` (router/screens/format/reg-copy/handoff/guide/plans-catalog). parent wishlist 라벨 `찜·비교` 유지. preview src `찜한학생`/`찜 목록` **0**. path `/mypage/student-review`·`/mypage/wishlist` 불변. |
| N26 | **PASS** | 공부방 GNB 과외쌤찾기 **없음** 유지 · 가이드는 가드 또는 메모 | `GNB_VISIBILITY.study_room.find_tutor: 'hide'` 유지(추가 없음). `guide/screens.js` `finderStartLinks`: `role === 'study_room'`이면 과외쌤 찾기 CTA 숨김 (146 본문 대수술 없이 역할 가드 1곳 — 범위 내 가산). |
| N27 | **PASS** | 「부족 n」+「모든 필수 완료」동시 표시 금지 | `registration-check-model` (study-room + tutor): `shortage = requiredMissing.length` · line/sub **상호 배타** (shortage>0 → filledLine/부족 라벨만 · shortage==0 → `모든 필수…`만, line에 부족 없음). 시뮬: req0+opt7 → `완료 19/26 · 모든 필수 항목 입력 완료` (부족 없음). render는 `line · sub` 접합. |
| N28 | **PASS** | parent 학생찾기 배너 유료상품 링크 0 | `home-marketing-banner.js` `renderSearchMarketingBanner(tab, role)`: `tab==='student' && role==='parent'` 시 CTA에서 label에 `유료상품` 포함 항목 filter. `search-page.js`가 `previewState.role` 전달. study_room/tutor 동일 배너는 유료 CTA 유지(역할 분기). |

---

## 3. MUST NOT / 잠금

| 잠금 | 결과 | 증거 |
|------|------|------|
| 게스트 등록·결제 실기능 개방 | **없음** | register intro only · plans login_gate · `canAccessPlansAccountRoutes`/`canBrowsePlansCatalog` = study_room\|tutor\|admin only |
| 「학생 의뢰」용어 | **UI 0** | preview `*.js` 0 · docs md(`DOC-CHECKLIST`/`GUEST-REDESIGN`)만 |
| 공부방 GNB에 과외쌤찾기 추가 | **없음** | `find_tutor: 'hide'` 유지 |
| 해시 라우트 rename | **없음** | path 상수 불변 · 라벨만 |
| push / build:dothome / Notion / commit | **없음** | status dirty WIP · HEAD 9ee8454 |

---

## 4. 스모크 매트릭스 (소스 대응 · 브라우저 실클릭 미실시)

| # | 기대 | 소스 판정 |
|---|------|-----------|
| S1 | guest community GNB = guest home | PASS (N22) |
| S2 | 상세등록·유료 소개+CTA | PASS (N23) |
| S3 | 학생 LNB 내 문의 내역 | PASS (N24) |
| S4 | 과외 찜 라벨 쌍 | PASS (N25) |
| S5 | 공부방 GNB 과외쌤찾기 없음 | PASS (N26) |
| S6 | 등록점검 요약 모순 0 | PASS (N27) |
| S7 | parent 학생찾기 유료 링크 0 | PASS (N28) |
| S8–S10 | 회귀/로그인/contact 로드 | 소스상 회귀 위험 낮음 · **실브라우저 스모크는 커밋 전 권장** |

---

## 5. 약점·후속 (ACCEPT 유지 · 차단 아님)

1. N23 gate 카피가 티켓 「초안」문장과 불일치 — MUST 충족이나 정돈 여지.
2. `tutor-reg/registration-check-render.js` `publishSummaryText`: `left===0`일 때 `badges.publishNeed`(`아직 공개 불가`) 반환 — N27 모순과 무관한 엣지 카피; 공개 요약 문장 정리는 선택.
3. `dist/` 미재빌드 — 티켓 금지 준수. 프리뷰는 src/vite 기준.
4. **Evening #342 gate fix** — 별도 pending (본 ACCEPT와 무관).

---

## 6. 판정

**ACCEPT** — N22–N28 MUST 전부 PASS. 로컬 커밋 1개·push 금지는 구현/배포 단계에서 유지.

