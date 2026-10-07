# 101 · 배포 — 098 과외쌤 로그인 홈 UI

- 작성일: 2026-09-25 (KST)
- 사용자 허가: 「배포해도 되는거지? 지시문을 줘」(2026-09-25) → push · Actions **Deploy to dothome** **허가** (**B 6파일만**)
- 로컬 수락: [100](100-tutor-home-login-ui-098-acceptance.md) ← [098](098-tutor-home-login-ui-fix-ticket.md)
- 기준 HEAD: `353d616` (=097 운영 · `origin/main`) — Cursor가 `git log -1` · tracking 재확인
- 상태: **운영 수락** → [102](102-tutor-home-101-deploy-acceptance.md) · SHA `0456459` · dothome #333
- 인프라: CF/닷홈 간헐 525·522 가능. **앱 배포와 축 분리**
- 쪽지 상태 기본값: **받음** (사용자 잠금)

---

## 0. 한 줄 (화면 이름)

워킹트리 dirty를 **통째로 올리지 말고**, 아래 **B 6경로만** stage → **커밋 1개** → `origin/main` push → dothome.

올릴 화면: **과외쌤 로그인 홈**
- 히어로 줄바꿈 · 「우리동네 교육플랫폼」
- 과외쌤 박스(쪽지 후기함·마이페이지 · 과외등록·메모 없음 · 쪽지 받음)
- 활동형 배지 제거
- 프라임 3칸 · 픽 샘플1+빈칸4
- 현재위치 = 대표 활동지역
- 「우리동네 학생」= 동네 스냅샷(검색폼 없음)

`git add -A` / `git commit -a` **거부.**  
가입·cities·공부방등록·좌표·ROI와 **섞지 말 것.**

---

## 1. 게이트

1. `git status -sb` · `git diff --name-only` 전량 보고(커밋 전)
2. 아래 **B만** `git add --` (6경로)
3. `git diff --cached --name-only`가 **그 6경로만**인지 확인 후 커밋
4. `origin/main` push (브랜치 `feat/student-mypage-a-g`여도 tracking이 main이면 동일 관례)
5. Actions **Deploy to dothome** 대기(또는 `npm run build:dothome` 후 동일 — 로컬 빌드 강제 아님)
6. Actions 성공 · SHA · 스모크 증거 보고

**중단:** C 경로가 stage에 **하나라도** 있으면 즉시 중단·보고.

---

## 2. Allowlist (B) — 6경로

```
preview/home-ui/src/home-marketing-banner.js
preview/home-ui/src/screens/tutor.js
preview/home-ui/src/provider-home.js
preview/home-ui/src/exposure-render.js
preview/search-ui/src/search-tier-render.js
preview/search-ui/src/search-find-surface.js
```

로컬 diff 예상(2026-09-25 확인, HEAD `353d616`): **6 files · +71 / −31**.

### 절대 제외 (C) — 지금 dirty에 있어도 stage 금지

```
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
src/Region/SidoRegionEnsure.php          # 이미 097로 운영 · 재터치 금지
public/assets/teaser-*
.tmp* · _verify/ · docs/* (레포 untracked)
preview/home-ui/_verify/ · preview/study-room-ui/_verify/
가입·signup* · cities 시드 · 공부방개설
git add -A
```

번들·teaser 산출물 **커밋 금지**.

---

## 3. 커밋 메시지 (1개)

```
fix(home): tutor login home UI (hero, box, prime/pick, primary region)

Local 098 accepted (100): member box, vacant pick sample1+EMPTY4,
current-location=primary activity region, neighborhood students snapshot.
Allowlist six files only.
```

---

## 4. 운영 스모크 (증거 · 과외쌤 로그인 홈)

화면 이름으로만. CF 5xx면 재시도·앱 버그로 단정 금지.

| # | 확인 |
|---|------|
| 1 | 히어로: 두 줄 · 둘째 「우리동네 교육플랫폼」(앞 공백 없음) |
| 2 | 과외쌤 박스: 쪽지 후기함∥마이페이지 · 과외등록 없음 · 쪽지 받음(+미확인) · 조회→등록 · 메모/보낸메모 없음 |
| 3 | 활동지역 분포: 「활동형」배지 없음 · 막대 유지 |
| 4 | 프라임: 칸 3 (실이 3칸 미만이면 빈칸 채움) |
| 5 | 픽 실0(또는 vacant): 샘플1+빈칸4 · 「후보 없습니다」만/샘플5 아님 |
| 6 | 활동지역 다른 탭 클릭 후에도 **현재위치** = 대표 활동지역 |
| 7 | 「우리동네 학생」: 상세검색 폼 없음 · 동네 스냅샷 |
| 8 | 공부방 로그인 홈 · 게스트 홈 큰 깨짐 없음(짧은 회귀) |
| 9 | cached/커밋에 C **0** · B **6파일만** |

---

## 5. 완료 보고 형식

1. base HEAD · 새 SHA · Deploy to dothome #
2. `git diff --cached --name-only` (커밋 직전) — **B 6줄만**
3. 스모크 1~9 짧게
4. C dirty **미포함** 한 줄 · push 후 index 비움 여부

---

## 6. 붙여넣기

```
[티켓 101 · 배포 098 과외쌤 로그인 홈 UI · allowlist 6 · 커밋1]

사용자 「배포」허가. base≈353d616=origin/main 재확인. git add -A 거부.

로컬 098 수락(100): 히어로·과외쌤박스·활동형제거·프라임3칸·픽샘플1+EMPTY4·현재위치=대표·우리동네학생스냅샷.
쪽지 기본값=받음. push + Actions Deploy to dothome 허가. 커밋 1개.
로컬 build:dothome 강제 아님(Actions면 OK).

B만 stage (6):
preview/home-ui/src/home-marketing-banner.js
preview/home-ui/src/screens/tutor.js
preview/home-ui/src/provider-home.js
preview/home-ui/src/exposure-render.js
preview/search-ui/src/search-tier-render.js
preview/search-ui/src/search-find-surface.js

C 절대 stage 금지(지금 dirty여도):
provider-status.js · study-room-reg/** · location-display.js · ProviderUsageService.php
SidoRegionEnsure.php · teaser-* · .tmp* · _verify · 레포 docs untracked · 가입/cities

커밋 메시지:
fix(home): tutor login home UI (hero, box, prime/pick, primary region)

Local 098 accepted (100): member box, vacant pick sample1+EMPTY4,
current-location=primary activity region, neighborhood students snapshot.
Allowlist six files only.

스모크(과외쌤 로그인 홈): 히어로2줄·박스·활동형없음·프라임3·픽1+EMPTY4·현재위치=대표·우리동네학생스냅샷·공부방/게스트 짧은회귀·B6만.
보고: SHA · Actions # · cached 6줄 · C미포함.
```
