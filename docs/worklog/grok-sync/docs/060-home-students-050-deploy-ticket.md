# 060 · 배포 — 050 홈 우리동네학생 · 학생찾기 홍보1

- 작성일: 2026-09-24 (KST)
- 사용자 허가: 「배포 지시문을 줘. 이상이 없으면」(2026-09-24) → 본 티켓이 push·dothome 허가
- 로컬 수락: [059](059-home-neighborhood-students-050-acceptance.md) (=050·050-add)
- 기획·카피: 빈목록 = **짧은 동이름** 잠금 · 과외쌤 홈 = **후순위 제외**
- 기준 HEAD(예상): `2c09da856a257556966c4c15e3c4c866e9cc4938` (= A배치 056/057) — Cursor가 `git log -1`·`origin/main` 재확인
- 상태: **운영 수락** → [061](061-home-students-050-deploy-acceptance.md) · SHA `5d4e3b1` · dothome run 35912509124
- **제외 트랙:** 과외쌤 홈 학생탭 · 팝업 053 · signup dirty · 실시간매칭 058 · student-basic WIP

---

## 0. 한 줄

워킹트리 dirty를 **통째로 올리지 말고**, **050(홈 우리동네 학생 ≠ 학생찾기 · 기본=홍보1)** 로컬 수락분만 stage → 커밋 1개 → push → dothome.  
`git add -A` / `git commit -a` **거부.**

---

## 1. 게이트

1. `git status` · `git diff --name-only` · 가능하면 `git diff --name-only 2c09da8` 로 dirty/변경 전량 보고(커밋 전)
2. 아래 **B allowlist만** stage (`git add -- path…`)
3. `git diff --cached --name-only`가 B만인지 **재확인** 후 커밋
4. `origin/main` push (기존 study114 관례)
5. `npm run build:dothome` **또는** Actions Deploy to dothome 자동 트리거 대기
6. Actions 성공 · SHA · 운영 스모크 증거 보고

**중단:** signup/auth/student-basic/팝업/058/tmp가 stage에 섞이면 즉시 중단·보고.  
allowlist에 없어도 **050 증상(홈학생 스냅샷·찾기 시드·PDO region placeholder)에만** 쓰인 의존이면 보고 후 포함 가능. 애매하면 **빼고 보고**.

---

## 2. Allowlist (B — 050 후보)

경로 기준 레포 루트. unchanged·없으면 skip. **실제 cached 목록을 보고에 그대로.**

### 예상 (050 티켓·보고 기준)
```
preview/home-ui/src/provider-home.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/screens/search-page.js
preview/search-ui/src/search-region-feed.js
preview/search-ui/src/search-role-access.js
src/Search/SearchService.php
```
(+ `bootStudyRoomStudentDemand`·홈 학생탭 카피·CTA·050-add 현재위치가 들어간 **실제** home-ui/search-ui 파일)
(+ 학생 탭/찾기 시드 헬퍼가 분리 파일이면 그 경로)

### 조건부
동일 파일에 A배치와 무관한 WIP·signup이 섞이면 `git add -p`로 **050 hunk만**. 분리 불가 → 제외 후 보고.

### 절대 제외 (C)
```
preview/auth-ui/** · src/Auth/** · src/Views/auth/**
student-basic · study-room-reg · provider-status.js (050 무관)
홈 팝업 053 · docs(레포에 없다면 skip) · .tmp* · _verify/ · teaser-*
과외쌤 홈 전용 미수락 작업
git add -A
```

---

## 3. 커밋 메시지

```
fix(home): neighborhood students tab + find default promo1

Local accept 050/059. Short empty copy; tutor home deferred. Allowlist only.
```

브랜치: main 직푸시 관례(043·056과 동일).

---

## 4. 운영 스모크 (증거 필수)

공부방 로그인 · 홍보1=논현1동(또는 가능동) · 개설동≠홍보1 계정:

| # | 확인 |
|---|------|
| 1 | 홈 → 우리동네 학생: 상세·유형·티어 스트립 **0** · 동=홍보1 · 짧은 빈목록(또는 카드) |
| 2 | 학생찾기: 희망유형=공부방 · 현재위치·희망지역=홍보1동 · 검색 전=홈과 같은 스냅샷 |
| 3 | 검색 → 필터 결과 · 초기화 → 다시 홍보1 스냅샷 |
| 4 | 프라임/픽/베이직(있으면) 현재위치=홍보1 |
| 5 | 우리동네 **공부방** 탭 회귀 OK(맵·홍보1) |
| 6 | 게스트 `#/guest`: 대치 데모 유지 |
| 7 | 번들에 050 카피 흔적(예: `우리동네 학생 수요`) 또는 동등 확인 |

회귀: A배치(056) 홈 맵·프라임 EMPTY·찾기 맵 깨짐 없음 · 이번 커밋 auth signup **0**.

무과금 로그인 세션이 운영에 없으면 **로컬 050 스모크는 이미 059**로 인정하고, 운영은 게스트(6)+번들(7)+가능 시 로그인(1~5) 보고.

---

## 5. 완료 보고 형식

1. base HEAD · 새 SHA · Actions (Deploy to dothome # · Board/Shop gate)
2. `git diff --cached --name-only` (커밋 직전) 전체
3. 운영 번들 경로(js/css)
4. 스모크 표 결과(로그인 불가 시 명시)
5. stage에 넣지 않은 dirty(남긴 WIP)

---

## 6. Cursor 붙여넣기 블록

```
[티켓 060 · 050 배포 · 홈학생≠찾기 홍보1]

허가: 배포 지시(060). 로컬 수락 059. 기준 HEAD 예상 2c09da8(A배치) — git log·origin/main 확인.
050만 allowlist stage → 커밋 1 · push main · dothome. git add -A 거부.
빈목록=짧은 동이름 유지. 과외쌤 홈 제외. signup·053·058·student WIP 혼합 금지.

게이트:
1) dirty 전량 보고
2) B만 git add -- path (provider-home / search-find-surface / search-page / region-feed / role-access / SearchService.php + 050 실제 파일)
3) cached = B만 재확인
4) commit 메시지:
   fix(home): neighborhood students tab + find default promo1
5) push · Deploy to dothome 성공 대기
6) 운영 스모크: 홈학생 상세0·홍보1 · 찾기 진입홍보1·검색/초기화 · 공부방탭 · 게스트대치
   (로그인 세션 없으면 게스트+번들+불가 명시)

중단: auth/signup/팝업이 stage에 있으면.
보고: base·SHA·Actions#·cached 목록·번들·스모크·남긴 dirty.
```
