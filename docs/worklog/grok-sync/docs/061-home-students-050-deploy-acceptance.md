# 061 · 060 수락 — 050 운영 배포

- 작성일: 2026-09-24 (KST)
- 배포 티켓: [060](060-home-students-050-deploy-ticket.md)
- 로컬 수락: [059](059-home-neighborhood-students-050-acceptance.md)
- 상태: **운영 수락** (로그인 스모크는 세션 없어 **유보** — 로컬 059로 갈음)
- SHA: `5d4e3b1af0f0dc9be177c94cb9b44b3276def30a`
- base: `2c09da856a257556966c4c15e3c4c866e9cc4938` (= A배치)

---

## 0. 판정

**수락.** 050 allowlist만 main·dothome에 반영됨. auth/signup/팝업 stage **0**.  
게스트·번들 카피 확인 OK. 공부방 로그인 운영 스모크는 세션 부재로 미실시 → **059 로컬 + 번들 문자열**로 갈음(056/057과 동일 패턴).

---

## 1. 배포 증거

| 항목 | 값 |
|------|-----|
| 커밋 | `fix(home): neighborhood students tab + find default promo1` |
| push | `2c09da8..5d4e3b1` → main |
| Deploy to dothome | success · run `35912509124` |
| Board ACL | success · `35912509046` |
| ShopPage | success · `35912508597` |

### cached (8)
```
preview/home-ui/src/provider-home.js
preview/home-ui/src/screens/study-room.js
preview/home-ui/src/study-room-home-seed.js
preview/search-ui/src/screens/search-page.js
preview/search-ui/src/search-find-surface.js
preview/search-ui/src/search-region-feed.js
preview/search-ui/src/search-tier-render.js
src/Search/SearchService.php
```
`search-role-access.js` — diff 없어 제외(정상).

### 번들
- 홈: `/assets/index-Dnca0Erj.js` · CSS `index-Dss9eNVR.css`
- 찾기: `/search/assets/index-wUkHYwvp.js` · CSS `index-BgaJRG88.css`
- 두 JS에 `우리동네 학생 수요` · `학생 목록을 불러오는 중입니다.` · `에 공개 중인 학생이 없습니다` 포함(짧은 빈목록 잠금과 정합)

---

## 2. 운영 스모크

| # | 결과 |
|---|------|
| 게스트 `#/guest` | 대치동 제목 · 로그인 링크 — **통과** |
| 게스트 학생찾기 | 상세검색 있음 · 희망유형 과외쌤 · 현재위치 서울(게스트 기본) — **통과**(로그인 홍보1 분기 아님) |
| 로그인 홈학생·찾기·검색/초기화·공부방탭 | **미실시**(운영 세션 없음) → 059 로컬 인정 |

---

## 3. 남긴 dirty (의도적 미포함 · 정상)

auth signup · provider-status · study-room-reg · location-display · naver-map · ProviderUsageService · helpers · `.tmp*` · `_verify` · teaser · 로컬 docs 일부 등 — **이번 커밋 밖**. 다음 트랙과 섞지 말 것.

---

## 4. 잔여

- 운영 **공부방 로그인**으로 060 §4 표 1~5 한 번(오후 스모크에 포함 가능)
- 과외쌤 홈 학생탭: 후순위
- 공개 학생 샘플 ≥1 시 홈=찾기 카드 육안

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 | 060 운영 수락. 5d4e3b1 · cached 8 · 로그인 스모크 유보. |
