# 166 · Strong-review ACCEPT · 모드점검 P2 N11–N21 (카피·표시) · rework 재심사

- 일시: 2026-09-28 ~08:06–08:10 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 `D:\work\study114` 소스/diff 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- HEAD: `fa3762d6da16a3e47ae5a53ff600831d7facad93` (150–151–161) · 166 커밋 **없음** · dirty WIP (164+165+166 혼재)
- push / `build:dothome` / Notion: **없음** (준수)
- SSOT: `/workspace/study114-ds/docs/166-mode-audit-p2-copy-terms-ticket.md`
- 증거: `/workspace/166-review/` · 머신 `D:\work\study114\docs\`
- 판정: **ACCEPT** · next=**167**
- 직전: REJECT (유저 UI 영문 잔존 3종 + N18 프로모 미게이트) → rework 1–4 **전부 PASS**

---

## 0. 한 줄

Prior REJECT 필수 4항을 실머신에서 재검증했다. `PAID PRODUCTS` / `Solved stories` / UI `Prime·Pick` / tutor·parent(학생) 공부방 프로모 노출이 모두 교정됐고, 164/165 마커는 intact.

---

## 1. 실측 상태

| 항목 | 값 |
|------|-----|
| HEAD | `fa3762d` — 166 커밋 아님 |
| dirty | tracked **67** · `+441/−225` (164+165+166 혼재) · porcelain ~82 (docs/exports untracked 포함) |
| 해시 라우트 rename | **없음** |
| `dist/` | stale 가능 — **src 기준 심사** · build 금지 준수 |
| 164 N4 | `studyRoomMypageEntry` · `auth-role.js`/`noteAuthRoleType` **유지** |
| 165 | login `/#/guest` · plans→`#/parent` · support hub path · `학생 의뢰` UI **0** (docs md만) |

---

## 2. Rework 1–4 재검증 (필수)

| # | 요구 | 결과 | 증거 |
|---|------|------|------|
| 1 | `plans/screens.js` PAID PRODUCTS → 유료 안내 · grep 0 | **PASS** | `:1103` · `:1240` `eyebrow: '유료 안내'` · `git grep PAID PRODUCTS` → 0 |
| 2 | `concern/screens.js` Solved stories → 해결됨 · grep 0 | **PASS** | `:362` `해결됨` chip · `git grep Solved stories` → 0 |
| 3 | UI Prime/Pick → 프라임/픽 (3파일) · comments OK | **PASS** | `store-ui.js:233,274` `프라임/픽` · `right-rail.js:306` `프라임/픽` · `layout.js:363` `픽/프라임` · 잔존 `store-ui.js:214` **JSDoc comment only** |
| 4 | N18: tutor/student(parent) hide `#/promo/study-room` + 소개 CTA · study-room/guest may keep | **PASS** | `studyRoomTeaserLanding`: tutor\|parent → `null` · `renderMediaTeaserSlot` early `''` · `landingPath`/`소개 페이지에서 보기` **제거** · parent 전용 CTA 분기 · guest fallthrough `STUDY_ROOM_PROMO` |

### 인용 (file:line)

```
plans/screens.js:1103  eyebrow: '유료 안내',
plans/screens.js:1240  eyebrow: '유료 안내',
concern/screens.js:362  ...>해결됨</span>
store-ui.js:233         ...배지는 프라임/픽 최초 구매 또는 연장 시에만...
store-ui.js:274         ...금액은 프라임/픽과 함께 서버가 재계산합니다.
store-ui.js:214         * 홍보 배지 장착 — Prime/Pick 종속 · ...  (comment OK)
right-rail.js:26-30     studyRoomTeaserLanding: tutor|parent → null; else /promo/study-room
right-rail.js:306       desc: '상세등록 이후 프라임/픽'
right-rail.js:317-322   parent early-return (찜·비교·쪽지 / 안전과외) — promo 미부착
right-rail.js:376-378   if (!landingSpec) return '';
layout.js:363           ...상세·쪽지·픽/프라임과 무관합니다...
```

---

## 3. N별 판정 (재심사 후)

| ID | 결과 | 근거 |
|----|------|------|
| N11 | **PASS** | positions/access storefront eyebrow `유료 안내` · PAID PRODUCTS 0 |
| N12 | **PASS** | Solved chip `해결됨` · Solved stories 0 |
| N13 | **PASS** | (직전) guide START/Go use 한국어 |
| N14 | **PASS** | UI 본문 프라임/픽 · comment Prime/Pick 허용 |
| N15–N17 | **PASS** | 직전 유지 |
| N18 | **PASS** | 역할 게이트 + 라벨 `공부방 소개 보기` · 「소개 페이지에서 보기」 0 |
| N19–N21 | **PASS** | 직전 유지 |
| 회귀 「학생 의뢰」 | **PASS** | preview `*.js` 0 · DOC-CHECKLIST/GUEST-REDESIGN md만 |
| 164/165 | **intact** | 아래 스팟 |

---

## 4. 164/165 스팟체크

| 마커 | 상태 |
|------|------|
| `state.js` `studyRoomMypageEntry` | 유지 (`:686+`) |
| `auth-role.js` `noteAuthRoleType` / `isStudyRoomAuth` | 신규 파일 유지 |
| `login-stage.js` `/#/guest` | `:61` |
| `plans/index.js` parent → `#/parent` | `:43` · `:105` |
| `support/nav.js` hub path | `/support` → `'hub'` |
| `학생 의뢰` in preview JS | **0** |

---

## 5. Residual greps (재심사)

| 문자열 | 결과 |
|--------|------|
| `PAID PRODUCTS` | **0** |
| `Solved stories` | **0** |
| `소개 페이지에서 보기` | **0** |
| `landingPath` in right-rail.js | **0** |
| UI `Prime/Pick` in store-ui / right-rail / layout | **0** (comment `:214` only) |
| `학생 의뢰` in preview `*.js` | **0** |

허용 잔존: `EXPOSURE_*` consts · comments의 Prime/Pick · `state.js` myshop meta · value `'N수'` · `dist/` stale · docs md의 「학생 의뢰」장 제목.

---

## 6. 스모크

브라우저 로그인 스모크 **미실행** (코드 검증만). S1–S3 residual은 소스상 **해소**. dist는 빌드 전이라 브라우저가 dist를 쓰면 옛 영문이 보일 수 있음 — build 금지 유지.

---

## 7. 다음

- **ACCEPT** · next=**167** (P3)
- 164+165+166 묶음 「배포」는 사용자 지시 시
- 167 paste / Notion / commit / push / build: **이 문서에서 하지 않음**
