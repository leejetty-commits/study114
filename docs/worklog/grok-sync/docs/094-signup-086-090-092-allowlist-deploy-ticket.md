# 094 · 배포 — 086 학생기본9칸 + 090 메일원래탭 + 092 과외도→시·군

- 작성일: 2026-09-24 (KST)
- 사용자 허가: 「배포」(2026-09-24 23:30경) → push · `build:dothome` / Actions **Deploy to dothome** **허가** (**B allowlist만**)
- 로컬 수락: [087](087-signup-student-basic-086-acceptance.md)(=086) · [091](091-signup-verify-090-acceptance.md)(=090) · [093](093-tutor-region-092-acceptance.md)(=092)
- 기준 HEAD: `f6b5400` (=083 운영 · `origin/main`) — Cursor가 `git log -1` · `origin/main` 재확인
- 상태: **지시 잠금** · 운영 수락은 Cursor 보고 후
- 인프라: CF/닷홈 간헐 525·522 가능. **앱 배포와 축 분리** — 522≠앱 롤백 사유

---

## 0. 한 줄 (화면 이름)

워킹트리 dirty를 **통째로 올리지 말고**, 아래 **B 14경로만** stage → **커밋 1개** → `origin/main` push → dothome.

올릴 기능(사용자가 보는 이름):
1. **학생 가입 · 기본정보** — 아홉 칸 (086)
2. **가입 메일확인** — 원래 탭에서 이어가기 · 메일 탭은 확인만 (090)
3. **과외쌤 가입 · 활동지역** / **학생 과외 희망** — 1차 광역시·도 → (도면) 시·군 (092)

`git add -A` / `git commit -a` **거부.**

공부방 가입 · 홍보지역 주소검색은 **이미 운영·유지** · 이번 B에 넣지 않음.

---

## 1. 게이트

1. `git status -sb` · `git diff --name-only` 전량 보고(커밋 전)
2. 아래 **B만** `git add -- <path>…` (경로 명시)
3. `git diff --cached --name-only`가 **B 14경로와 일치**하는지 확인 후 커밋
4. `origin/main` push (study114 직푸시 관례 · 로컬 브랜치명이 `feat/…`여도 tracking이 main이면 동일)
5. Actions **Deploy to dothome** 대기(또는 `npm run build:dothome` 후 동일 결과)
6. Actions 성공 · SHA · 운영 스모크 증거 보고

**중단:** C 경로가 stage에 **하나라도** 있으면 즉시 중단·보고.  
`add -p`로 086/090/092를 파일 단위 분리하려다 실패하면 **한 커밋(권장)**으로 가고, 분리 실패를 보고만 할 것(기능은 한 배치로 이미 수락됨).

---

## 2. Allowlist (B) — 14경로

경로 = 레포 루트. unchanged면 skip·보고. **실제 cached를 보고에 그대로.**

```
preview/shared/korea-sidos.js
preview/shared/tutor-region-slots.js
preview/shared/email-verify-tab.js
preview/auth-ui/src/screens/signup-basic.js
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/styles/student-basic.css
preview/auth-ui/src/main.js
preview/auth-ui/src/layout.js
public/assets/css/auth/mvc.css
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
src/Auth/BasicRegisterService.php
src/Auth/EmailVerificationService.php
src/helpers.php
```

### 왜 helpers.php가 들어갔나
`basic-student.php`(086)가 `study114_chip_group(..., false)` **5번째 인자**를 씀. 086 원 allowlist에는 없었으나, PHP 086을 올리면 helpers 시그니처(+기본값 true 유지)가 **필수**. 빼면 운영에서 chip 호출 깨짐.

### 파일 ↔ 티켓 (참고 · 커밋은 1개)
| 깨끗(단일) | 티켓 |
|------------|------|
| korea-sidos.js · tutor-region-slots.js | 092 |
| signup-verify-email.js · email-verify-tab.js · EmailVerificationService.php | 090 |
| student-basic.css · main.js · mvc.css · basic-student.php · signup-basic.php | 086 |
| **혼재** signup-basic.js | 086+092 |
| **혼재** layout.js | 086+090 |
| **혼재** BasicRegisterService.php | 086+090 |
| helpers.php | 086 지원 |

### 절대 제외 (C)
```
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
public/assets/teaser-*
.tmp* · _verify/ · .tmp-home-card-invest/ · .tmp-rc-deploy/ · .tmp-student-*
레포 안 untracked docs/*
home vacant / exposure / map 소스
git add -A
```

번들: **소스만** stage. teaser·해시 산출물 **커밋 금지**. push 후 Actions가 auth/shared 번들 재생성.

---

## 3. 커밋 메시지 (1개)

```
fix(signup): student basic 9 fields, original-tab verify, tutor sido→si/gun

Local accept 086/087 + 090/091 + 092/093. Allowlist only; no home/provider/teaser.
```

---

## 4. 운영 스모크 (증거 필수 · 사이트 열린 창)

화면 이름으로만 확인.

| # | 확인 |
|---|------|
| 1 | **학생 가입 · 기본정보**: 아홉 칸 노출 · 대표/부족/공개완료·상세 **없음** |
| 2 | 같은 화면 · 과외 희망: **광역시 또는 도** → (도) **시·군** · 1차에 시·군 라벨 없음 · 서울 선택 시 2차 없음 |
| 3 | 같은 화면 · 공부방 희망: **주소검색** 유지(은마·대치 하드코드 없음) |
| 4 | **과외쌤 가입 · 활동지역** 1~3: 동일 도→시·군 · 경기 2차에 의정부시·가평군 등 |
| 5 | **가입 메일확인**: 대기(원래) 탭에서만 기본정보로 이어감 · 메일 연 탭은 성공/폴백만 · 자동으로 기본정보 이중 작성 없음 |
| 6 | cached/커밋에 C(provider·teaser·study-room-reg·location-display 등) **0** |
| 7 | 군(가평군) 저장: API에 행 없으면 「매핑 없음」 가능 — **이번 배치 데이터 시드 아님** · 보고만 |

CF 5xx면 해당 항목 재시도·스킵 표기. Actions·SHA는 그대로 보고.

회귀: 083 학생 공부방 희망 UI · 081 메일 카피 축은 090이 카피 톤을 **원래탭**으로 교체한 점 확인.

---

## 5. 완료 보고 형식

1. base HEAD · 새 SHA · Actions Deploy to dothome # · Board/Shop gate
2. `git diff --cached --name-only` (커밋 직전) 전체 — **B만**
3. 운영 번들(js/css) 경로 또는 해시(있으면)
4. 스모크 1~7 짧게 · 5xx면 명시
5. C dirty stage **미포함** 한 줄 · helpers 포함 여부

---

## 6. 붙여넣기

```
[티켓 094 · 배포 086+090+092 · allowlist 14 · 커밋1]

사용자 「배포」허가. base≈f6b5400=origin/main 재확인. git add -A 거부.

로컬수락: 086/087 학생기본9칸 · 090/091 메일원래탭 writer · 092/093 과외도→시·군.
push + Actions Deploy to dothome(또는 npm run build:dothome) 허가.
커밋 1개(파일 혼재로 분리 비권장).

B만 stage (14):
preview/shared/korea-sidos.js
preview/shared/tutor-region-slots.js
preview/shared/email-verify-tab.js
preview/auth-ui/src/screens/signup-basic.js
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/styles/student-basic.css
preview/auth-ui/src/main.js
preview/auth-ui/src/layout.js
public/assets/css/auth/mvc.css
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
src/Auth/BasicRegisterService.php
src/Auth/EmailVerificationService.php
src/helpers.php

C절대제외: provider-status · study-room-reg · location-display · ProviderUsage · teaser · tmp · _verify · untracked docs · home vacant/map · git add -A
소스만. teaser/해시 번들 커밋 금지.

커밋메시지:
fix(signup): student basic 9 fields, original-tab verify, tutor sido→si/gun

Local accept 086/087 + 090/091 + 092/093. Allowlist only; no home/provider/teaser.

origin/main push → Deploy to dothome.

스모크(화면이름): 학생기본9칸 · 과외희망 L1/L2 · 공부방희망주소검색유지 · 과외쌤활동지역 L1/L2 · 메일원래탭이어가기 · C stage0 · 가평군API없으면저장유보보고

보고: base·SHA·Actions# · cached전체 · 스모크 · C미포함
```
