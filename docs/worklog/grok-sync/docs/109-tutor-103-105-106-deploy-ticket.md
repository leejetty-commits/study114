# 109 · 배포 — 103·105·106 전체 (조회 실연결 + 학생찾기 현재위치)

- 작성일: 2026-09-25 (KST)
- 사용자 허가: 「배포. 작업한 전체 배포」(2026-09-25) → push · Actions **Deploy to dothome** **허가**
- 로컬 수락: [104](104-tutor-home-views-103-acceptance.md)/[108](108-tutor-roi-lifetime-105-acceptance.md)/[107](107-tutor-student-find-106-acceptance.md)
- 기준 HEAD: `0456459` = `origin/main` — Cursor가 `git log -1` 재확인
- 상태: **운영 수락** → [110](110-tutor-109-deploy-acceptance.md) · HEAD `5c12a5d` · dothome #334
- `git add -A` **거부**

---

## 0. 한 줄

워킹트리 dirty를 통째로 올리지 말고, 아래 **B 6경로만** stage → **커밋 2개**(축 분리) → `origin/main` push → dothome.

올릴 기능(화면 이름):
1. **과외쌤 로그인 홈 · 조회** — 실제 누적 조회(103 화면 + 105 서버)
2. **상단 메뉴 · 학생찾기(과외쌤)** — 공부방과 동일 동작 · **현재위치=지역대표**만(106)

레포 `docs/*` untracked · teaser · .tmp — **절대 커밋 금지.**

---

## 1. 게이트

1. `git status -sb` · `git diff --name-only` 전량 보고
2. 커밋1: B-조회만 `git add --` → cached 확인 → 커밋
3. 커밋2: B-학생찾기만 `git add --` → cached 확인 → 커밋
4. push `origin/main` (tracking 관례 동일)
5. Actions **Deploy to dothome** 대기 (로컬 `build:dothome` 강제 아님)
6. 스모크·SHA·Actions # 보고

**중단:** C가 stage에 하나라도 있으면 즉시 중단.

---

## 2. Allowlist (B) — 6경로

### 커밋1 · 조회 (103+105)

```
preview/home-ui/src/screens/tutor.js
preview/home-ui/src/tutor-home-seed.js
src/Paid/ProviderRoiService.php
src/Paid/ProviderRoiRepository.php
```

(`tutor-home-seed.js`는 **untracked 신설** — 반드시 add)

### 커밋2 · 학생찾기 (106)

```
preview/search-ui/src/screens/search-page.js
preview/search-ui/src/search-find-surface.js
```

### 절대 제외 (C)

```
docs/** (레포 untracked 046·047·README 등)
public/assets/teaser-*
.tmp* · _verify/
provider-status.js · location-display.js · ProviderUsageService.php · study-room-reg/**
SidoRegionEnsure.php · 가입·signup
git add -A
```

---

## 3. 커밋 메시지

**커밋1**
```
fix(paid,home): tutor lifetime_views without room id + home box

103+105: ROI counts owned tutor profile views when no study_room_id;
member box shows lifetime_views (no dummy). Allowlist four paths.
```

**커밋2**
```
fix(search): tutor student-find current location = primary region

106: GNB student find matches study-room flow; current-location label
pinned to representative activity region. Allowlist two files.
```

---

## 4. 운영 스모크

| # | 확인 |
|---|------|
| 1 | 과외쌤 로그인 홈 **조회**: 허수 64 아님 · 숫자 또는 0 (—는 실패 시에만) |
| 2 | `roi` · study_room_id **없음**: `lifetime_views` 숫자(0 포함) |
| 3 | 공부방 홈 조회(room id 있음) 회귀 없음 |
| 4 | 과외쌤 GNB **학생찾기**: 희망유형 기본 과외 · 게이트 없음 · **현재위치=지역대표** |
| 5 | 공부방 GNB 학생찾기 회귀 없음 |
| 6 | 홈 「우리동네 학생」·프라임/픽·히어로 회귀 없음 |
| 7 | cached/각 커밋에 C **0** · B만 |

CF 5xx면 앱 버그로 단정 금지 · 재시도.

---

## 5. 완료 보고

1. base · 커밋2개 SHA · Deploy to dothome #
2. 각 커밋 `diff --cached --name-only` (커밋 직전)
3. 스모크 1~7
4. C 미포함 · docs untracked 미커밋

---

## 6. 붙여넣기

```
[티켓 109 · 배포 103+105+106 전체 · allowlist 6 · 커밋2]

사용자 「배포·작업한 전체」허가. base≈0456459=origin/main. git add -A 거부.
push + Actions Deploy to dothome 허가. 로컬 build:dothome 강제 아님.

커밋1 (조회 103+105) B만:
preview/home-ui/src/screens/tutor.js
preview/home-ui/src/tutor-home-seed.js
src/Paid/ProviderRoiService.php
src/Paid/ProviderRoiRepository.php

메시지:
fix(paid,home): tutor lifetime_views without room id + home box

103+105: ROI counts owned tutor profile views when no study_room_id;
member box shows lifetime_views (no dummy). Allowlist four paths.

커밋2 (학생찾기 106) B만:
preview/search-ui/src/screens/search-page.js
preview/search-ui/src/search-find-surface.js

메시지:
fix(search): tutor student-find current location = primary region

106: GNB student find matches study-room flow; current-location label
pinned to representative activity region. Allowlist two files.

C 절대 금지: docs untracked · teaser · .tmp · _verify · provider-status · location-display · ProviderUsage · study-room-reg · SidoRegionEnsure · signup

스모크: 과외쌤 홈 조회 숫자·roi room없이 lifetime_views·공부방 조회 회귀·GNB 학생찾기 현재위치=대표·공부방 학생찾기 회귀·홈 스냅샷/프라임 회귀·C0.
보고: SHA×2 · Actions # · cached 목록 · C미포함.
```
