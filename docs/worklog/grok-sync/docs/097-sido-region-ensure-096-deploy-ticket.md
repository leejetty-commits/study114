# 097 · 배포 — 096 cities 시드에 군=시 동급

- 작성일: 2026-09-25 (KST)
- 사용자 허가: 「배포」의사 → 「ㅇㅋ」(2026-09-25 00:06경) → push · `build:dothome` / Actions **Deploy to dothome** **허가** (**B 1파일만**)
- 로컬 구현 보고: Cursor 096 · `SidoRegionEnsure.php`만 · 군 76개 · 강화·옹진 없음 · push 안 함 · 로컬 MySQL 연결 거부로 DB INSERT 미실행(운영에서 ensure 시 id 생성)
- 선행: [096](096-sido-region-ensure-si-gun-seed-ticket.md) · UI는 [092](092-tutor-region-sido-then-si-gun-ticket.md)/[095](095-signup-094-deploy-acceptance.md) 이미 운영
- 기준 HEAD: `4660fd8` (=094 운영 · `origin/main`) — Cursor가 `git log -1` · tracking 재확인
- 상태: **지시 잠금** · 운영 수락은 Cursor 보고 후
- 인프라: CF/닷홈 간헐 525·522 가능. **앱 배포와 축 분리**

---

## 0. 한 줄 (화면 이름)

워킹트리 dirty를 **통째로 올리지 말고**, 아래 **B 1경로만** stage → **커밋 1개** → `origin/main` push → dothome.

올릴 기능(사용자가 보는 이름):
- **과외쌤 가입 · 활동지역** / **학생 가입 · 과외 희망** — 목록에 가평군 등 **군**이 시와 같이 저장용 번호(id)를 갖게 함
- 공부방 **홍보지역 주소검색** · 화면 JS · `korea-sidos` → **이번 배치에 넣지 않음**(이미 092로 화면 군 라벨 있음)

`git add -A` / `git commit -a` **거부.**

---

## 1. 게이트

1. `git status -sb` · `git diff --name-only` 전량 보고(커밋 전)
2. 아래 **B만** `git add -- src/Region/SidoRegionEnsure.php`
3. `git diff --cached --name-only`가 **그 1경로만**인지 확인 후 커밋
4. `origin/main` push (브랜치명이 `feat/…`여도 tracking이 main이면 동일 관례)
5. Actions **Deploy to dothome** 대기(또는 `npm run build:dothome` 후 동일)
6. Actions 성공 · SHA · 스모크 증거 보고

**중단:** C 경로가 stage에 **하나라도** 있으면 즉시 중단·보고.

---

## 2. Allowlist (B) — 1경로

```
src/Region/SidoRegionEnsure.php
```

로컬 diff 예상(2026-09-25 확인): `+18 / -5` · HEAD `4660fd8`.

### 절대 제외 (C) — 지금 dirty에 있어도 stage 금지

```
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
public/assets/teaser-*
.tmp* · _verify/ · docs/* (레포 untracked)
preview/home-ui/_verify/ · preview/study-room-ui/_verify/
과외쌤 홈 UI 수정(히어로·멤버박스·프라임/픽 빈칸) — **별도 티켓 · 이번 금지**
git add -A
```

번들·teaser 산출물 **커밋 금지**.

---

## 3. 커밋 메시지 (1개)

```
fix(region): seed province cities with gun labels (si/gun parity)

Local 096: 76 guns in PROVINCE_CITIES same arrays as si. No UI. Allowlist one file.
```

---

## 4. 운영 스모크 (증거 · 사이트 열린 창)

화면·동작 이름으로만.

| # | 확인 |
|---|------|
| 1 | cities / 지역 목록 API(또는 가입 화면이 부르는 목록)에 **가평군** label + **숫자 id** (배포 후 첫 ensure 호출로 생길 수 있음 · id 숫자면 OK) |
| 2 | **과외쌤 가입 · 활동지역**: 경기 → **가평군** 선택 → 「매핑된 지역이 없습니다」 **없음** · 저장 id 숫자 |
| 3 | **의정부시** 기존처럼 선택·매핑 유지 |
| 4 | **서울특별시** 등 광역시 = 1차로 종료 · 2차 없음 유지 |
| 5 | **공부방 홍보지역** 주소검색 회귀 없음(이번 파일과 무관 · 스모크만) |
| 6 | cached/커밋에 C **0** · B **1파일만** |

참고: 로컬 MySQL이 없어 개발 PC에 INSERT id가 없어도, **운영에서 ensure가 돌면** 군 행이 생김. 스모크 1이 id를 못 받으면 ensure 호출 경로·에러를 보고.

강화군·옹진군은 **시드에 없음**(의도).

---

## 5. 완료 보고 형식

1. base HEAD · 새 SHA · Deploy to dothome # · Board/Shop gate
2. `git diff --cached --name-only` (커밋 직전) — **B 1줄만**
3. 스모크 1~6 짧게 · 가평군 id 있으면 숫자 한 줄
4. C dirty **미포함** 한 줄

---

## 6. 붙여넣기

```
[티켓 097 · 배포 096 cities 군=시 동급 · allowlist 1 · 커밋1]

사용자 「배포」허가(ㅇㅋ). base≈4660fd8=origin/main 재확인. git add -A 거부.

로컬 096: SidoRegionEnsure.php만 · 군76 · 강화/옹진 없음 · UI/JS 변경 없음.
push + Actions Deploy to dothome(또는 npm run build:dothome) 허가.
커밋 1개.

B만 stage (1):
src/Region/SidoRegionEnsure.php

C 절대 stage 금지(지금 dirty여도):
provider-status.js · study-room-reg/** · location-display.js · ProviderUsageService.php
teaser-* · .tmp* · _verify · 레포 docs untracked · 과외쌤 홈 UI 수정분

커밋 메시지:
fix(region): seed province cities with gun labels (si/gun parity)

Local 096: 76 guns in PROVINCE_CITIES same arrays as si. No UI. Allowlist one file.

스모크: 가평군 label+숫자id · 활동지역 가평군 매핑OK · 의정부시/서울 유지 · 공부방 주소검색 회귀없음 · cached=B만.
CF 5xx면 재시도·스킵 표기. SHA·Actions # 보고.
```
