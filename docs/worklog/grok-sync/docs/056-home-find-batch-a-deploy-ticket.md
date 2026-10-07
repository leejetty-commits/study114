# 056 · A배치 배포 — 공부방 홈/찾기 (044·048·046·051·047)

- 작성일: 2026-09-24 (KST)
- 사용자 허가: 「지금 A배치 배포해」(2026-09-24)
- 로컬 수락: [048-acc](048-studyroom-home-044-fixup-acceptance.md) · [052](052-studyroom-home-mapbox-046-acceptance.md)=046 · [054](054-studyroom-find-051-acceptance.md)=051 · [055](055-studyroom-home-047-acceptance.md)=047 · 044는 048에 포함
- 기준 HEAD(예상): `6bf408a` (= 043 가입 QA 이미 배포) — Cursor가 `git log -1`·`origin/main` 재확인
- 상태: **운영 수락** → [057](057-home-find-batch-a-deploy-acceptance.md) · SHA `2c09da8` · Actions #326
- **제외 트랙:** 050(미수락) · 팝업 053 · signup dirty · student-basic WIP

---

## 0. 한 줄

워킹트리 dirty를 **통째로 올리지 말고**, 공부방 **홈/찾기 위치·맵·프라임** 로컬 수락분만 stage → 커밋 1개 → push → dothome.  
`git add -A` / `git commit -a` **거부.**

---

## 1. 게이트

1. `git status` · `git diff --name-only` 로 dirty 전량 보고(커밋 전)  
2. 아래 **A allowlist만** stage (`git add -- path…`)  
3. `git diff --cached --name-only`가 A만인지 **재확인** 후 커밋  
4. `origin/main` push (기존 study114 관례와 동일)  
5. `npm run build:dothome` **또는** Actions Deploy to dothome 자동 트리거 대기  
6. Actions 성공 · SHA · 운영 스모크 증거 보고  

**중단:** signup/student/050/팝업/tmp가 stage에 섞이면 즉시 중단·보고. 무리한 전체 stage 금지.  
파일이 allowlist에 없더라도 **044~047·051 증상 수정에만 쓰인 의존 파일**이면 보고 후 포함 가능(예: hub fetch 헬퍼). 애매하면 **빼고 보고**.

---

## 2. Allowlist (A — 반드시 후보)

경로 기준 레포 루트. 존재하지 않거나 unchanged면 skip.

### home-ui
```
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/data.js
preview/home-ui/src/study-room-home-seed.js
preview/home-ui/src/exposure-rules.js
preview/home-ui/src/auth-session.js
preview/home-ui/src/provider-home.js
```
(+ 044에서 연 실제 hub/ROI 호출 헬퍼가 다른 파일이면 그 경로 포함·보고)

### search-ui
```
preview/search-ui/src/search-provider-self.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-region-feed.js
preview/search-ui/src/search-role-access.js
preview/search-ui/src/search-exposure-mapper.js
preview/search-ui/src/screens/search-page.js
preview/search-ui/vite.config.js
```

### PHP
```
src/Search/SearchService.php
src/…/ProviderRoiRepository.php   # 실제 경로 Cursor가 locate · lifetime_views 단방 COUNT (048)
```

### 조건부 (hunk 분리)
동일 파일에 signup/student WIP가 섞이면 `git add -p`로 **홈/찾기·프라임·맵·홍보1·views** hunk만.  
분리 불가 → 그 파일 **제외 후 스모크**; 실패 시 중단·보고 (WIP 억지 포함 금지).

---

## 3. 절대 제외 (C)

```
preview/auth-ui/** (signup WIP)
src/Auth/** · src/Views/auth/**
public/assets/css/auth/**
preview/home-ui/src/study-room-reg/**
050·학생찾기 전용 미수락 작업 (있다면)
홈 팝업 시안/053 구현
.tmp* · _verify/ · teaser-* · plans UI 실험
git add -A
```

050 미착수·미수락이면 050 파일 stage **0**.

---

## 4. 커밋 메시지

```
fix(home): studyroom promo1 find/home map, prime from paid sku

Local accept 044+048+046+051+047. Allowlist only; no signup/050.
```

브랜치: 기존 main 직푸시 관례 유지(043과 동일). 새 장기 브랜치 불필요.

---

## 5. 운영 스모크 (증거 필수)

공부방 로그인 · 홍보1=논현1동(또는 가능동) · **무과금** 계정(예: id4 티켓0040):

| # | 확인 |
|---|------|
| 1 | 홈 멤버박스: 실명·홍보1 수업지역·쪽지/조회 (044/048). 대치·개설동 아님 |
| 2 | 홈 맵: `{홍보1동} 공부방 현황입니다` · 상태 dl 없음 · N=베이직 total · 상세검색 **없음** (046) |
| 3 | 홈 프라임: 자기 방 **0** · EMPTY 홍보 · 자기 방=베이직 (047). 맵 N=베이직과 일치 |
| 4 | 공부방찾기: 현재위치·맵·상세검색 기본·베이직 헤더=홍보1 · 대치 **0** · 헤더=카드 지역 (051) |
| 5 | 찾기 상세검색 폼 **유지** · 검색/초기화→홍보1 |
| 6 | 게스트 홈·찾기: 대치 데모 유지 · 게스트 프라임 데모 채움 유지 |
| 7 | (가능 시) 유료 프라임 구독 방 API `position_sku=prime` |

회귀: 가입 QA(043) 화면 깨짐 없음 · 이번 커밋에 auth signup 파일 **0**.

---

## 6. 완료 보고 형식

1. 커밋 전 dirty 요약 + `git diff --cached --name-only`  
2. commit SHA · message  
3. push · Actions 런 # · 성공/실패  
4. 운영 assets 반영 증거  
5. 스모크 표  
6. **안 올린 것** (C군 · signup · 050 · tmp)

---

## 7. Cursor 붙여넣기

```
[티켓 056 · A배치 배포 · 044+048+046+051+047 allowlist만]

사용자 「지금 A배치 배포해」= 이 티켓이 commit·push·build:dothome 실행 허가.
로컬 수락분: 044+048(멤버박스·홍보1·단방조회) · 046(맵·홈상세검색hide) · 051(찾기=홍보1) · 047(프라임=유료sku).
050·팝업·signup dirty 제외. git add -A 금지.
기준 HEAD 재확인(예상 6bf408a = 043 배포분).

순서:
1) git status / diff --name-only 전량 보고
2) 아래 A만 git add -- path (없거나 unchanged면 skip)
3) cached name-only = A만 재확인 → commit → push origin(main 관례) → build:dothome 또는 Deploy Actions
4) 성공 SHA·Actions#·운영 스모크 보고. 섞이면 중단.

【A home-ui】
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/data.js
preview/home-ui/src/study-room-home-seed.js
preview/home-ui/src/exposure-rules.js
preview/home-ui/src/auth-session.js
preview/home-ui/src/provider-home.js
(+ 044 hub/ROI 헬퍼 실제 경로 있으면 포함·보고)

【A search-ui】
preview/search-ui/src/search-provider-self.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-region-feed.js
preview/search-ui/src/search-role-access.js
preview/search-ui/src/search-exposure-mapper.js
preview/search-ui/src/screens/search-page.js
preview/search-ui/vite.config.js

【A PHP】
src/Search/SearchService.php
ProviderRoiRepository.php (실제 경로 locate · 048 lifetime_views)

【조건부】 같은 파일에 signup/student WIP 섞이면 add -p로 홈/찾기·프라임 hunk만.
분리 불가 → 제외 후 스모크; 실패 시 중단(WIP 넣지 말 것).

【절대 제외】
auth signup WIP, Auth/Views/auth, student-basic, study-room-reg,
050 미수락, 팝업053, .tmp* _verify teaser, git add -A

커밋 메시지:
fix(home): studyroom promo1 find/home map, prime from paid sku

Local accept 044+048+046+051+047. Allowlist only; no signup/050.

운영 스모크(무과금 공부방·홍보1):
- 홈 멤버박스=홍보1 · 맵046 · 상세검색0 · 프라임0/EMPTY · 베이직에 자기방 · 맵N=베이직
- 찾기=홍보1(대치0) · 헤더=카드 · 상세검색유지 · 검색/초기화
- 게스트 대치·데모프라임 유지 · 커밋에 auth signup 0

보고: cached 목록, SHA, Actions#, assets, 스모크, 안 올린 것.
```
