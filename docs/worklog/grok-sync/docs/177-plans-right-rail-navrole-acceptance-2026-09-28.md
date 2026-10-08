# 177 · Strong-review ACCEPT · plans 우측 레일 navRole (RR1)

- 일시: 2026-09-28 ~23:39–23:42 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 `D:\work\study114` `git show c377511` / shell·right-rail 코드 경로 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 커밋: `c3775110fcbd66ad1fc70de16c8b68bc02a2c6d1` (로컬 · `feat/student-mypage-a-g` · **origin/main ahead 4 · 미푸시**)
- 형제 커밋 175: `6da8050` — **파일 겹침 0** (177은 `plans/shell.js`만 · 175는 state/guide/support/banner)
- push / `build:dothome` / Notion / 추가 커밋: **없음** (심사 준수)
- SSOT: [177](177-plans-right-rail-navrole-ticket-2026-09-27.md) · [177 Cursor](177-plans-right-rail-navrole-cursor-ticket-2026-09-28.md) · 근거 [176](176-right-rail-mode-audit-2026-09-27.md) RR1
- 사용자 주장(코드 검증 · **브라우저 스모크 미실시**): study_room→유료 노출+공부방 고민 · tutor→프로필+과외쌤 고민 · guest→찜·안전 유지

---

## 0. 판정

**ACCEPT.**

Must 충족. allowlist 밖 파일 0. `state.js` 미터치(175와 충돌 없음). `right-rail.js` 시그니처 변경 불필요(기존 `opts.navRole` 수용). Forbid(카피 전면·promo CTA 일반화·guestFilter SQL·커뮤니티 ACL·promo-sidebar·배포) 터치 없음.

---

## 1. 커밋·파일

| 항목 | 값 |
|------|-----|
| 메시지 | `fix(plans): pass the live session role into the plans right rail.` |
| 통계 | **1 file** · +12 / −2 |
| 원격 | **미포함** (`feat/student-mypage-a-g...origin/main [ahead 4]`) |

### 터치 파일 (전부 · allowlist 내)

1. `preview/home-ui/src/plans/shell.js` — 필수 · **유일**

미터치(allowlist 허용·이번 불필요): `right-rail.js` (이미 `resolveNavRole(opts)` + `actionCtasForContext` 역할 분기 보유).

미터치(금지·175 보호): `state.js` · guestFilter · community ACL · promo-sidebar.

---

## 2. Must

| # | Must | 결과 | 증거 |
|---|------|------|------|
| 1 | `/#/plans` Quiet Rails에 실세션 navRole 전달 | **PASS** | `plans/shell.js` `plansRailNavRole()` → `navRoleFromAuthUser(getAuthUser())` · whitelist `study_room\|tutor\|parent\|guest` · else `guest`. paid 트랙 레일: `renderPromoWithRightRail('plans_right_rail', { navRole: plansRailNavRole() })`. |
| 2 | plans에서 `getNavRole()`이 guest 고정이어도 레일만 실세션 | **PASS** | `state.js` `getNavRole`: `isPlansRoute()` → `'guest'` (GNB용·유지). 레일은 `getNavRole` 우회·`opts.navRole` 우선 (`right-rail.js` `resolveNavRole`). |
| 3 | study_room/tutor ≠ 게스트 찜·비교·쪽지 / 안전가이드 CTA | **PASS** | `actionCtasForContext` (`right-rail.js`): `study_room`+`plans_right_rail` → `유료 노출 안내`(`#/plans`, tone paid) + `시즌 모집 준비`(`#/community/director`). `tutor` → `프로필 보완`(`#/guide/registration`) + `학생 접근 흐름`(`#/community/tutor`). 찜(`#/guide/saved-contact`)·안전(`#/guide/safety`)은 parent/guest 분기·기본값만. |
| 4 | guest @ plans 기존 비회원 허브 유지 | **PASS** | `plans/index.js` 게스트 → `renderPlansLoginGate` · `home-body--no-promo`(우측 레일 없음). 레일 seed의 guest 기본 CTA(찜·안전)는 코드 경로 유지·카피 미개작. |
| 5 | 새 API 금지 · diff plans/shell 중심 | **PASS** | 기존 `navRoleFromAuthUser` + 기존 `renderPromoWithRightRail(..., opts)`만 사용. 파일 1개. |

---

## 3. 역할별 CTA 코드 경로 (사용자 주장 ↔ 소스)

`actionCtasForContext(slotKey, ctx)` · `ctx.navRole` · `slotKey === 'plans_right_rail'`:

| 세션 (`plansRailNavRole`) | 1번 CTA | 2번 CTA | 게스트 찜/안전? |
|---------------------------|---------|---------|-----------------|
| `study_room` (`study_room_owner` 매핑) | 유료 노출 안내 → `#/plans` (paid) | 시즌 모집 준비 → `#/community/director` | **아니오** |
| `tutor` | 프로필 보완 → `#/guide/registration` | 학생 접근 흐름 → `#/community/tutor` | **아니오** |
| `parent` | 찜·비교·쪽지 → `#/guide/saved-contact` | 안전과외 가이드 → `#/guide/safety` | (학생 허브·plans 게이트로 레일 미진입이 일반) |
| `guest` / 기타→guest | 찜·비교·쪽지 | 안전과외 가이드 | **예(seed 유지)** |

`navRoleFromAuthUser`: `study_room_owner`→`study_room`, `tutor`→`tutor`, 무세션→`guest`. `admin`은 whitelist 밖 → `plansRailNavRole`가 `guest`로 폴백(허용).

**라이브 브라우저 스모크는 본 심사에서 재실증하지 않음** (사용자 미검증 상태 유지).

---

## 4. Allowlist · Forbid · 175 분리

| 점검 | 결과 |
|------|------|
| allowlist 밖 파일 | **0** (1/1 = `plans/shell.js`) |
| `right-rail.js` 시그니처 변경 | **없음** (기존 `opts.navRole` 충분) |
| `state.js` | **미터치** · 175 `6da8050`와 파일 교집합 **∅** |
| 카피 전면 수정 | 없음 |
| promo CTA study-room→tutor 일반화 | 없음 |
| guestFilter SQL / 커뮤니티 ACL | 없음 |
| promo-sidebar 부활 | 없음 |
| push / build / 추가 커밋 | 없음 |

---

## 5. 잔여(ACCEPT 저해 아님)

- **비-paid 트랙** `renderAppShellWithPromo({ slotKey: 'plans_right_rail' })` 경로는 여전히 `navRole` 미전달 → `getNavRole()`=guest 폴백.  
  현재 `PAID_TRACK_PATHS` = `/plans` · `/plans/positions` · `/plans/access`(허브·스토어프론트 = RR1 대상)는 paid 인라인 레일로 **수정됨**.  
  `checkout`/`result`는 `hideNav` → `slotKey: null`(레일 없음).  
  → 후속 정리 후보일 뿐, 티켓 Min·수락 범위 밖 잔여.
- 브라우저: study_room/tutor로 `/#/plans` 우측 CTA 육안 스모크(배포 전 수동).

---

## 6. 판정 한 줄

**ACCEPT** — shell만으로 레일에 실세션 navRole 전달 · room/tutor ≠ guest CTA seed · 175와 분리 · 미푸시 `c377511`.
