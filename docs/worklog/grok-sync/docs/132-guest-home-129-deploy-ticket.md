# 132 · 배포 — 게스트 홈 허수 걷어내기 (129 · fb3bbf5)

- 작성: 2026-09-25 05:12 KST
- 사용자 허가: 「배포」(2026-09-25) → push · Actions **Deploy to dothome** **허가**
- 로컬 수락: [131](131-guest-home-129-acceptance.md) (조건부 · 재코딩 없음)
- 정책: [129](129-guest-home-122-cursor-ticket.md) · [122](122-guest-home-remove-fake-numbers-backlog.md)
- 현재: `origin/main` = `8eaf74d` · 로컬 HEAD = `fb3bbf5` · 브랜치 `feat/student-mypage-a-g` ahead 1
- **새 커밋·새 stage 없음.** `git add` 자체 금지. force 금지.
- 배포 결과: **조건부 수락** → [133](133-guest-home-132-deploy-acceptance.md) · #336 · 지도 500은 [134](134-region-stats-pdo-named-param-fixup.md)
- DB 마이그레이션 **없음** (새 테이블 없음 · live COUNT만)

---

## 0. 한 줄

이미 있는 로컬 커밋 **`fb3bbf5` 하나만** `origin/main`에 fast-forward push → Actions Deploy to dothome.  
워킹트리 dirty(`study-room-reg/screens.js`, repo `docs/046`·`047`·`README`)는 **건드리지 말 것**.

올릴 화면(사이트 이름):
- 손님 홈 `#/guest` — 대치동 지도 실숫자 · 샘플/빈칸 · 프라임 크기
- 공부방찾기 · 과외쌤찾기 · 학생찾기 — 게스트 첫 화면 베이직 샘플+빈

---

## 1. 게이트 (반드시)

1. `git fetch origin`
2. `origin/main`이 **`8eaf74d113efa0d096d7b64aeb2b0f5c8f4d3229`** 인지 확인. 다르면 **중단·보고**.
3. `git rev-parse HEAD` = **`fb3bbf531917d1d49c2d671971be500f5f964602`**. 다르면 중단.
4. `git log --oneline origin/main..HEAD` = **정확히 1줄**:  
   `fb3bbf5 fix(guest): replace dummy guest counts and seed cards with live slots`
5. `git diff --name-only origin/main..HEAD` = **아래 10경로만**. 하나라도 더 있으면 중단.
6. 워킹트리 dirty는 **stash·reset·clean·commit 금지**. 그대로 두고 push만.
7. `git push origin HEAD:main` (**fast-forward만**. `--force` / `--force-with-lease` **금지**).
8. Actions **Deploy to dothome** 완료 대기. 로컬 `npm run build:dothome` **실행하지 않음**.

---

## 2. Allowlist (B) — 커밋에 이미 들어 있는 10경로

```
preview/home-ui/src/data.js
preview/home-ui/src/exposure-render.js
preview/home-ui/src/guest-sections.js
preview/home-ui/src/home-basic-live.js
preview/home-ui/src/plans/runtime-config.js
preview/home-ui/src/screens/guest.js
preview/home-ui/src/styles/home-listings.css
preview/search-ui/src/search-tier-render.js
public/api/search/region-stats.php
src/Search/SearchService.php
```

신규 API: `POST /api/search/region-stats.php` (스키마 변경 없음).

---

## 3. Forbidden (C)

```
git add · 새 커밋 · amend · rebase · force push
preview/home-ui/src/study-room-reg/screens.js
docs/046-* · docs/047-* · docs/README.md (워킹트리 dirty)
로컬 npm run build:dothome
Notion 쓰기
로그인 홈 UX 추가 변경 · 127 숨김 잔재 청소
```

---

## 4. 운영 스모크 (배포 후)

| # | 확인 |
|---|---|
| 1 | `POST /api/search/region-stats.php` body `{}` → 200 · `ok:true` · `studyRooms`/`tutors`/`studentRequests` 숫자(0 허용) · axes 대치동/서울시/서울시. **47/62/128 아님** |
| 2 | 손님 홈 `#/guest` 지도 박스 = API와 동일(또는 로딩 중 「—」 후 실수). 실패해도 옛 허수 금지 |
| 3 | 현재위치: 공부방 대치동 · 과외/학생 서울시 |
| 4 | 하드 새로고침 첫 화면: 프라임 카드 크기 정상(작았다가 커지지 않음) |
| 5 | 실등록 0인 구간: 프라임 샘플1+빈2 · 픽 샘플1+빈4(1행) · 베이직/학생 샘플1+빈1 「등록하면 여기에 나와요」 |
| 6 | 찾기 3곳(게스트) 첫 진입: 베이직 샘플1+빈1만 · 프라임/픽 블록 없음 |
| 7 | (선택) 로그인 공부방·과외쌤 홈 vacant 회귀 없음 |
| 8 | CF 5xx는 앱 버그로 단정 금지 · 재시도 |

---

## 5. 보고 형식

1. push 전·후 `origin/main` SHA
2. Actions Deploy to dothome 번호 · 결과
3. `git diff --name-only 8eaf74d..HEAD` (또는 origin/main 전후) = 10경로
4. 스모크 1~7
5. dirty 잔여 미커밋 확인
