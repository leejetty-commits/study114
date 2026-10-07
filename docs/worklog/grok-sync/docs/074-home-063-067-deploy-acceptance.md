# 074 · 069 수락 — 063+067 운영 배포

- 작성일: 2026-09-24 (KST)
- 배포 티켓: [069](069-home-063-067-deploy-ticket.md)
- 로컬 수락: [065](065-home-memberbox-prime-pick-063-acceptance.md)(=063) · [068](068-home-find-map-067-acceptance.md)(=067)
- 상태: **운영 수락** (로그인 홈 멤버박스·프라임/픽·핀0 타일 운영 육안은 세션 없어 **유보** — 배포 전 렌더 스모크 + 게스트 운영 맵으로 갈음)
- SHA: `f6b84980f056ccca9dfb13b646396afb0fd37bfc`
- base: `5d4e3b1af0f0dc9be177c94cb9b44b3276def30a` (=050/061)

---

## 0. 판정

**수락.** 069 B allowlist **9파일만** `origin/main`·dothome에 반영됨. auth/signup·C 제외 목록 stage **0**.  
`git add -A` 미사용 · 로컬 `build:dothome` 미실행(Actions Deploy로 갈음) — 게이트 충족.

| 항목 | 결과 |
|------|------|
| base `5d4e3b1` → `f6b8498` | 통과 |
| cached = B 9경로 일치 | 통과 (`git diff 5d4e3b1..f6b8498` 대조) |
| C(auth·provider-status·helpers 등) 미포함 | 통과 |
| Deploy to dothome · Shop · Board gate | 통과 (보고 Run **328**) |
| 게스트 `#/guest` 대치 맵 | 통과 (운영) |
| 로그인 홈 운영 육안 | 유보(세션) — 배포 전 렌더 스모크로 갈음 |

보완지시문 없음.

---

## 1. 배포 증거

| 항목 | 값 |
|------|-----|
| 커밋 | `fix(home): memberbox/prime-pick samples + map center without pins` |
| push | `5d4e3b1..f6b8498` → `origin/main` |
| Deploy to dothome | success · Run **328** (보고) |
| ShopPage / Board ACL gate | success (보고) |
| 로컬 build:dothome | 미실행(허용) |

### cached (9) = B
```
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/exposure-render.js
preview/search-ui/src/search-tier-render.js
preview/home-ui/src/styles/home-marketing-banner.css
preview/home-ui/src/styles/udx-std-apply.css
preview/home-ui/src/styles/home-listings.css
preview/shared/naver-map.js
preview/search-ui/src/search-map.js
preview/search-ui/src/search-find-surface.js
```

워킹트리: auth/signup 등 dirty **잔존**(의도 · 미배포).

---

## 2. 스모크

| # | 확인 | 결과 |
|---|------|------|
| 1–3 | 멤버박스 배지 · 프라임 샘플1+EMPTY2 · 픽 한 줄 | 배포 전 렌더 OK |
| 4–5 | 핀0 center · 찾기 좌표 전달 | 배포 전 렌더 OK |
| 6 | 게스트 대치 마운트 / 운영 `#/guest` 대치 맵 | OK |
| 7 | auth 0 | OK |
| — | 로그인 홈 운영 멤버박스·프라임/픽·핀0 타일 | **유보** |

---

## 3. 잔여

- 공부방 로그인 운영 1회(가능동/홍보1): 멤버박스 · 프라임0/픽0 · 맵 타일 — 오후 스모크에 묶어도 됨
- 학생 가입 통합 [073](073-signup-student-mail-guidance-hope-region-unified-ticket.md)는 **별 트랙**(로컬 · 본 SHA와 무관)
- dirty auth/signup은 계속 로컬만 · 「배포해」 없는 한 push 금지

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 | 069 운영 수락 · `f6b8498` · dothome #328 |
