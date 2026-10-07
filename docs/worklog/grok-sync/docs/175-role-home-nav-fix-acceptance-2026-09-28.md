# 175 · Strong-review ACCEPT · 역할 홈 네비 통일 (role home nav fix)

- 일시: 2026-09-28 ~23:29–23:35 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 `D:\work\study114` `git show 6da8050` / 소스·grep 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 커밋: `6da8050df186a833d97c0f9e003e4a1d6774f9fd` (로컬 · `feat/student-mypage-a-g` · **origin/main ahead 3 · 미푸시**)
- push / `build:dothome` / Notion / 추가 커밋: **없음** (심사 준수)
- SSOT: [175](175-role-home-nav-fix-ticket-2026-09-27.md) · [175 Cursor](175-role-home-nav-fix-cursor-ticket-2026-09-28.md) · 근거 [174](174-in-page-nav-stay-policy-2026-09-27.md)
- 사용자 테이블 주장: guest→`#/guest` · study-room→`#/study-room` · tutor→`#/tutor` · parent→`#/parent`. **브라우저 클릭 미검증(사용자)** — 본 심사는 **코드 경로만** 검증.

---

## 0. 판정

**ACCEPT.**

Must A–C 코드 경로 PASS. D는 커밋에 미포함(허용 — role= 조립이 3파일+면 생략 OK). allowlist 밖 파일 0. Forbid(마이 breadcrumb·promo CTA 오링크·찜/쪽지·배너 카피·라우터 재설계) 터치 없음.

---

## 1. 커밋·파일

| 항목 | 값 |
|------|-----|
| 메시지 | `fix(nav): open role home from the live session instead of a hardcoded guest.` |
| 통계 | 4 files · +43 / −20 |
| 원격 | **미포함** (`feat/student-mypage-a-g...origin/main [ahead 3]`) |

### 터치 파일 (전부 · allowlist 내)

1. `preview/home-ui/src/home-marketing-banner.js`
2. `preview/home-ui/src/state.js`
3. `preview/home-ui/src/guide/shell.js`
4. `preview/home-ui/src/support/shell.js`

미터치(allowlist 허용·이번 불필요): `promo/shell.js`, `concern/shell.js`, `site-nav-config.js`, (D) role= 조립기.

---

## 2. Must A–D

| # | Must | 결과 | 증거 (file:line) |
|---|------|------|------------------|
| A | search_room/search_tutor 「홈으로」 — `HOME_GUEST` 하드코딩 제거 · `homeHashUrl`/`roleHomeHashPath(session)` | **PASS** | `HOME_GUEST` 상수·참조 **0** (`preview/home-ui/src` grep). CTA placeholder `href:''` (`home-marketing-banner.js:176`, `:185`). 렌더 시 `homeHashUrl(roleHomeHashPath(getAuthUser()))` (`:269–270`). import `:8`. |
| B | guide/support 「메인 홈으로」 — 실세션 우선 · stale guest/타역할 context가 로그인 홈 덮지 말 것 | **PASS** | `guide/shell.js:8` · `support/shell.js:12` → `sessionMainHomePath(getAuthUser())`. 구현 `state.js:146–150`: `user?.role_type` → `roleHomeHashPath` · 없으면 `authRoleType()` 스냅 · 없으면 `'/guest'`. GUIDE_CTX/SUPPORT_CTX/`ACTIVE_ROLE` **미참조**. `getNavRole` guide/support도 `sessionNavRole()` 우선 (`:162–165`). |
| C | 비로그인 community/promo `getNavRole` 무조건 guest · `#/parent` via `ACTIVE_ROLE` 금지 | **PASS** | `state.js:168–170`: `isCommunityRoute() \|\| isPromoRoute()` → `sessionNavRole() \|\| 'guest'`. 비로그인 시 `authRoleType()`=`''` → `sessionNavRole`=`''` → **`guest`**. 구 ACTIVE_ROLE 분기는 community/promo에서 **분리 제거**(myshop/library만 유지 `:174–177`). |
| D | 비로그인 찾기 `role=parent` 강제 | **SKIP(허용)** | 커밋 미포함. Cursor 생략 · 파일 3+면 제외 OK. 후속. |

---

## 3. 역할 홈 URL 코드 경로 (사용자 테이블 ↔ 소스)

`roleHomeHashPath` (`preview/shared/site-nav-config.js:230–235`) + `homeHashUrl` 폴스루 (`:291` → `` `${HOME_UI_BASE}/#${p}` ``):

| 세션 | `roleHomeHashPath` | 최종 hash |
|------|-------------------|-----------|
| 비로그인 / `!user` | `/guest` | `#/guest` |
| `study_room_owner` | `/study-room` | `#/study-room` |
| `tutor` | `/tutor` | `#/tutor` |
| 그 외(학생·parent) | `/parent` | `#/parent` |
| `admin` | `/admin` | `#/admin` (테이블 외·기존 동작) |

호출 경로:

- 검색 배너 「홈으로」: `home-marketing-banner.js:270` → `homeHashUrl(roleHomeHashPath(getAuthUser()))`
- guide/support 「메인 홈으로」: `sessionMainHomePath` → 동일 `roleHomeHashPath` / fallback `/guest` · 앵커 `href="#${sub}"` (`guide/shell.js:21`, `support/shell.js:25`)

**라이브 클릭은 본 심사에서 재실증하지 않음** (사용자 미검증 상태 유지).

---

## 4. Allowlist · Forbid

| 점검 | 결과 |
|------|------|
| allowlist 밖 파일 | **0** (4/4 in-list) |
| 마이페이지 breadcrumb | 미터치 |
| promo CTA study-room 오링크 | 미터치 |
| 찜/쪽지 인페이지 | 미터치 |
| 배너 카피·디자인 | CTA href만 · 카피/레이아웃 불변 |
| 라우터 재설계 | 없음 (`getNavRole` 분기·홈 경로 헬퍼만) |

참고(ACCEPT 저해 아님): `promo/shell.js`·`concern/shell.js`는 여전히 `memberHomeHashPath(getAuthUser())`(`memberHomeHashPath`≡`roleHomeHashPath`). 비로그인 → `/guest`. C의 GNB/`getNavRole` 수정은 `state.js`만으로 충족. B 범위는 guide/support만.

---

## 5. Grep 요약

| 심볼 | 결과 |
|------|------|
| `HOME_GUEST` | `preview/home-ui/src` **0** |
| `sessionMainHomePath` | `state.js` 정의 · `guide/shell.js` · `support/shell.js` |
| `sessionNavRole` | `state.js` private · guide/support/community/promo `getNavRole` |
| `roleHomeHashPath` / `homeHashUrl` | banner · `sessionMainHomePath` · shared SSOT |

---

## 6. 후속(이번 제외)

- D: 비로그인 찾기 `role=parent` 조립 강제(별도)
- promo/concern 「메인 홈으로」를 `sessionMainHomePath`로 정렬(선택·일관성) — 현재 memberHomeHashPath로 비로그인 `#/guest`는 이미 성립
- 브라우저 클릭 스모크(수락표 §3.1–6) — 배포 전 수동

---

## 7. 판정 한 줄

**ACCEPT** — A/B/C 코드 PASS · D skip OK · allowlist 준수 · 미푸시 `6da8050`.
