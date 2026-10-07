# 069 · 배포 — 063 멤버박스·프라임/픽 샘플 + 067 맵 핀0 center

- 작성일: 2026-09-24 (KST)
- 사용자 허가: 「배포」(2026-09-24) → 본 티켓이 push·`build:dothome` **허가** (allowlist만)
- 로컬 수락: [065](065-home-memberbox-prime-pick-063-acceptance.md)(=063) · [068](068-home-find-map-067-acceptance.md)(=067)
- 기준 HEAD(예상): `5d4e3b1` (=050 운영 061) — Cursor가 `git log -1`·`origin/main` 재확인
- 상태: **운영 수락** → [074](074-home-063-067-deploy-acceptance.md) · SHA `f6b8498` · dothome Run 328
- **제외 트랙:** auth/signup dirty · `provider-status.js` · `study-room-reg` · `location-display.js` · `ProviderUsageService` · `helpers.php` · 팝업 053 · 058 매칭 · student-basic · teaser · `.tmp*` · `_verify/`

---

## 0. 한 줄

워킹트리 dirty를 **통째로 올리지 말고**, **063+067 로컬 수락분 9파일만** stage → 커밋 1개 → push → dothome.  
`git add -A` / `git commit -a` **거부.**

---

## 1. 게이트

1. `git status` · `git diff --name-only` 전량 보고(커밋 전)
2. 아래 **B allowlist만** `git add -- path…`
3. `git diff --cached --name-only`가 **B 9경로와 일치**하는지 재확인 후 커밋
4. `origin/main` push (study114 관례)
5. `npm run build:dothome` **또는** Actions Deploy to dothome 자동 트리거 대기
6. Actions 성공 · SHA · 운영 스모크 증거 보고

**중단:** auth/signup/`ProviderUsage`/`helpers`/`provider-status`/`study-room-reg`/`location-display`/teaser/tmp가 stage에 섞이면 즉시 중단·보고.  
allowlist 외 의존이 꼭 필요하면 **빼고 보고**(포함 금지가 기본).

---

## 2. Allowlist (B — 063+067)

경로 기준 레포 루트. unchanged면 skip. **실제 cached를 보고에 그대로.**

### 063 (멤버박스 · 프라임/픽 샘플) — [065](065-home-memberbox-prime-pick-063-acceptance.md)
```
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/exposure-render.js
preview/search-ui/src/search-tier-render.js
preview/home-ui/src/styles/home-marketing-banner.css
preview/home-ui/src/styles/udx-std-apply.css
preview/home-ui/src/styles/home-listings.css
```

### 067 (맵 핀0 center) — [068](068-home-find-map-067-acceptance.md)
```
preview/shared/naver-map.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-find-surface.js
```

### 절대 제외 (C) — 현재 dirty에 있으나 **이번 커밋 금지**
```
preview/auth-ui/**
src/Auth/** · src/Views/auth/** · public/assets/css/auth/**
preview/home-ui/src/provider-status.js
preview/home-ui/src/study-room-reg/**
preview/shared/location-display.js
src/Paid/ProviderUsageService.php
src/helpers.php
public/assets/teaser-*
.tmp* · _verify/ · docs(레포) · student-basic WIP
git add -A
```

배포 직전 확인(2026-09-24 ljh_work): allowlist 9파일 `+156/−27` · 제외 dirty 12파일 `+504/−53` → **섞으면 안 됨**.

---

## 3. 커밋 메시지

```
fix(home): memberbox/prime-pick samples + map center without pins

Local accept 063/065 + 067/068. Allowlist only; no auth/signup.
```

브랜치: main 직푸시 관례(043·056·060과 동일).

---

## 4. 운영 스모크 (증거 필수)

공부방 로그인 · 홍보1=가능동(또는 논현1동) · 가능하면 프라임0/픽0 계정:

| # | 확인 |
|---|------|
| 1 | 멤버박스: 배지「쪽지 후기함」∥마이페이지 · 악센트바·테두리·tint · 풀블리드 사진 없음 |
| 2 | 프라임 실0: 샘플1+EMPTY2 · CTA 중앙 · `data-provider-id` 없는 샘플 |
| 3 | 픽 실0: 한 줄 샘플(붕괴/「후보 없음」만 금지) |
| 4 | 홈 맵: 목록 0·핀 0이어도 **네이버 타일** · 「표시할 위치 정보가 없습니다」로 맵 포기 **없음** · center≈홍보1 |
| 5 | 공부방찾기: 다른 동 검색(또는 지역 변경) → 핀 0이어도 맵 center 이동 |
| 6 | 게스트 `#/guest`: 대치 맵·데모 유지 |
| 7 | 번들에 063/067 흔적(또는 동등) · 이번 커밋 auth/signup **0** |

로컬 API 없이도 운영에서는 PHP API가 살아 있으므로 **로그인 스모크를 우선**. 세션 없으면 게스트(6)+번들(7)+가능 시 1~5.

회귀: 050 홈학생 탭 · A배치 프라임 EMPTY(실방 있을 때) · 047 자기방 프라임0.

---

## 5. 완료 보고 형식

1. base HEAD · 새 SHA · Actions (Deploy to dothome # · Board/Shop gate)
2. `git diff --cached --name-only` (커밋 직전) 전체 — **B만**
3. 운영 번들 경로(js/css) 또는 해시
4. 스모크 표 1~7 결과(짧게)
5. 제외 dirty가 stage에 **안 들어갔음** 확인 한 줄

---

## 6. 붙여넣기

```
[티켓 069 · 배포 063+067 · allowlist만]

사용자 「배포」허가. base≈5d4e3b1 재확인. git add -A 거부.

수락: 063/065 + 067/068. push + build:dothome(또는 Actions dothome) 허가.

B만 stage (9):
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/exposure-render.js
preview/search-ui/src/search-tier-render.js
preview/home-ui/src/styles/home-marketing-banner.css
preview/home-ui/src/styles/udx-std-apply.css
preview/home-ui/src/styles/home-listings.css
preview/shared/naver-map.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-find-surface.js

C 절대제외: auth/signup · provider-status · study-room-reg · location-display · ProviderUsage · helpers · teaser · tmp · _verify

커밋 1개 → origin/main → dothome.
메시지: fix(home): memberbox/prime-pick samples + map center without pins

스모크: 멤버박스·프라임샘플·픽샘플·홈맵타일(핀0)·찾기 center·게스트대치 · auth0.
cached= B만 보고.
```
