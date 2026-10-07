# 081 · 배포 — 073 메일·공부방희망지역 + 079 픽 vacant(샘플1+EMPTY4)

- 작성일: 2026-09-24 (KST)
- 사용자 허가: 「현재까지 작업한 것을 전체 배포하자」(2026-09-24) → 본 티켓이 push·`build:dothome` **허가** (**B allowlist만**)
- 로컬 수락: [077](077-signup-073-mail-guidance-hope-region-acceptance.md)(=073) · [080](080-home-pick-vacant-079-acceptance.md)(=079)
- 기준 HEAD: `f6b8498` (=069/074 운영) — Cursor가 `git log -1`·`origin/main` 재확인
- 상태: **운영 수락** → [082](082-073-079-deploy-081-acceptance.md) · SHA `4dae030` · dothome Run **329**
- 인프라: CF/닷홈 간헐 525·522 가능. **앱 배포와 축 분리** — 522를 앱 실패로 쓰지 말 것. 사이트 간헐 열림이면 스모크는 열린 창에서.

---

## 0. 한 줄

워킹트리 dirty를 **통째로 올리지 말고**, 아래 **B 6파일만** stage → 커밋 1개 → `origin/main` push → dothome.  
`git add -A` / `git commit -a` **거부.**

**이번 배치에 넣지 않는 것(의도적):** `signup-basic.js` 및 학생 Basic **9축 WIP** 전 트랙(PHP·뷰·css). 073 Part B 중 **공부방** 희망지역(`study-room-basic-form.js`)만 포함. **학생 Basic** 희망지역 UI는 9축과 같은 파일에 섞여 있어 **다음 selective 커밋**으로 남김.

---

## 1. 게이트

1. `git status -sb` · `git diff --name-only` 전량 보고(커밋 전)
2. 아래 **B만** `git add -- <path>…` (한 줄에 경로 명시)
3. `git diff --cached --name-only`가 **B 6경로와 일치**하는지 재확인 후 커밋
4. `origin/main` push (study114 직푸시 관례)
5. `npm run build:dothome` **또는** Actions Deploy to dothome 자동 트리거 대기
6. Actions 성공 · SHA · 운영 스모크 증거 보고

**중단:** C(제외) 경로가 stage에 **하나라도** 있으면 즉시 중단·보고.  
`signup-basic.js`를 “희망지역만”이라며 **통째 stage 금지**(9축 혼입).

---

## 2. Allowlist (B)

경로 기준 레포 루트. unchanged면 skip·보고. **실제 cached를 보고에 그대로.**

### 079 픽 vacant — [080](080-home-pick-vacant-079-acceptance.md)
```
preview/home-ui/src/exposure-render.js
preview/home-ui/src/styles/udx-std-apply.css
```

### 073 Part A 메일 새탭 안내 — [077](077-signup-073-mail-guidance-hope-region-acceptance.md)
```
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/styles/base.css
src/Auth/EmailVerificationService.php
```

### 073 Part B 공부방 희망지역만
```
preview/shared/study-room-basic-form.js
```

### 절대 제외 (C) — 현재 dirty에 있어도 **이번 커밋 금지**
```
preview/auth-ui/src/screens/signup-basic.js
preview/auth-ui/src/layout.js
preview/auth-ui/src/main.js
preview/auth-ui/src/styles/student-basic.css
public/assets/css/auth/mvc.css
src/Auth/BasicRegisterService.php
src/Views/auth/partials/basic-student.php
src/Views/auth/signup-basic.php
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
src/helpers.php
public/assets/teaser-*
.tmp* · _verify/ · docs(레포 안) · git add -A
```

배포 직전 확인(2026-09-24 ljh_work · `feat/student-mypage-a-g` @ `f6b8498` = `origin/main`):  
B 후보 6파일 dirty · C에 signup-basic(+245줄급)·BasicRegister·mvc 등 대량 WIP 혼재 → **섞으면 안 됨**.

---

## 3. 커밋 메시지

```
fix: mail new-tab copy, study-room hope region, pick vacant 1+EMPTY4

Local accept 073/077 (mail+study-room hope) + 079/080. Allowlist only;
no student-basic 9-axis / signup-basic.js.
```

브랜치: main 직푸시 관례(043·056·060·069와 동일). 현재 체크아웃이 `feat/student-mypage-a-g`여도 **tracking이 origin/main**이면 동일 푸시 관례 유지(로컬 브랜치명만 다를 수 있음 — `git status -sb` 보고).

---

## 4. 운영 스모크 (증거 필수 · 사이트 열린 창에서)

| # | 확인 |
|---|------|
| 1 | 가입 메일확인(`verify-email?send=1`): 새 창/탭 안내 카피 노출 |
| 2 | 공부방 기본정보 희망지역: 샘플 주소/은마·대치 하드코드 **없음** · 검색 칸 |
| 3 | 공부방 로그인 홈 · 픽 실0: **샘플1 + EMPTY 4** (샘플5 전면 금지) |
| 4 | 프라임 실0: 샘플1+EMPTY2 **회귀** (079 미변경) |
| 5 | 게스트 `#/guest`: 대치·데모 픽 유지(vacantSamples 미적용) |
| 6 | 번들에 079/073A·공부방희망 흔적 · **cached에 signup-basic/9축 0** |

CF 5xx면 해당 항목 **재시도·스킵 표기** 후 Actions·SHA는 그대로 보고. 522≠앱 롤백 사유.

회귀: 069 멤버박스·맵 핀0 center · 050 홈학생 탭.

---

## 5. 완료 보고 형식

1. base HEAD · 새 SHA · Actions (Deploy to dothome # · Board/Shop gate)
2. `git diff --cached --name-only` (커밋 직전) 전체 — **B만**
3. 운영 번들 경로(js/css) 또는 해시
4. 스모크 표 1~6 결과(짧게) · 5xx면 명시
5. 제외 dirty(특히 `signup-basic.js`) stage **미포함** 한 줄

---

## 6. 붙여넣기

```
[티켓 081 · 배포 073(메일+공부방희망) + 079(픽1+EMPTY4) · allowlist만]

사용자 「전체 배포」허가. base≈f6b8498 재확인. git add -A 거부.

수락: 073/077 + 079/080. push + build:dothome(또는 Actions dothome) 허가.

B만 stage (6):
preview/home-ui/src/exposure-render.js
preview/home-ui/src/styles/udx-std-apply.css
preview/auth-ui/src/screens/signup-verify-email.js
preview/auth-ui/src/styles/base.css
src/Auth/EmailVerificationService.php
preview/shared/study-room-basic-form.js

C 절대제외: signup-basic.js · student-basic 9축(layout/main/mvc/BasicRegister/basic-student/signup-basic.php/student-basic.css) · provider-status · study-room-reg · location-display · ProviderUsage · helpers · teaser · tmp · _verify

커밋 1개 → origin/main → dothome.
메시지: fix: mail new-tab copy, study-room hope region, pick vacant 1+EMPTY4

스모크: 메일새탭카피 · 공부방희망검색칸(샘플주소없음) · 픽샘플1+EMPTY4 · 프라임1+EMPTY2회귀 · 게스트대치 · signup-basic stage0.
CF 525/522면 앱실패 아님·열린창에서만 스모크. cached=B만 보고.
```
