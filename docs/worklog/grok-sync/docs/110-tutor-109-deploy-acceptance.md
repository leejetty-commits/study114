# 110 · 109 배포 수락 — 조회 실연결 + 학생찾기 현재위치

- 작성일: 2026-09-25 (KST)
- 대상: [109](109-tutor-103-105-106-deploy-ticket.md) (=로컬 [104](104-tutor-home-views-103-acceptance.md)/[108](108-tutor-roi-lifetime-105-acceptance.md)/[107](107-tutor-student-find-106-acceptance.md))
- 판정: **운영 수락**
- HEAD: `5c12a5dc68b2b76b2bd949db6d5b019cb1ccdde9` (짧은 `5c12a5d`)
- base: `0456459` → `5c12a5d` on `origin/main` (커밋 2개)
- Actions: Deploy to dothome **#334** (run `36028840510`) 성공. ShopPage gate #167 · Board ACL gate #269도 success.
- 로컬 `build:dothome` 미실행(허용)

---

## 1. 커밋·Allowlist

### 커밋1 · `8940522ea3ad6c2dce83223b64df3028a0889df8`
메시지: `fix(paid,home): tutor lifetime_views without room id + home box`

- `preview/home-ui/src/screens/tutor.js`
- `preview/home-ui/src/tutor-home-seed.js`
- `src/Paid/ProviderRoiRepository.php`
- `src/Paid/ProviderRoiService.php`

### 커밋2 · `5c12a5dc68b2b76b2bd949db6d5b019cb1ccdde9`
메시지: `fix(search): tutor student-find current location = primary region`

- `preview/search-ui/src/screens/search-page.js`
- `preview/search-ui/src/search-find-surface.js`

금지(C) · teaser · .tmp · _verify · provider-status · location-display · ProviderUsage · study-room-reg · SidoRegionEnsure · signup · 레포 `docs/*` — **커밋 없음.** 작업 트리 잔여 = untracked docs 3개뿐(046·047·README) → 109 게이트 충족.

---

## 2. 스모크 (보고)

| # | 확인 | 결과 |
|---|------|------|
| 1–3 | 조회 / ROI room 유무 / 공부방 회귀 | **코드 잠금 유지** (room 있으면 방 1건 · 없으면 소유 과외 누적·없으면 0 · `metrics.views` 유지 · 홈은 `lifetime_views`) |
| 4–5 | GNB 학생찾기 · 현재위치=대표 · 공부방 회귀 | **코드 기준 OK** |
| 6 | 홈 우리동네 학생·프라임/픽·히어로 | 보고상 회귀 없음(이 배치 범위 밖 변경 없음) |
| 7 | C 미포함 | **충족** |

운영에서 **로그인 없이** `roi.php` room-없는 `lifetime_views` 실숫자는 미확인(세션 필요) → **오후 로그인 스모크로 유보.** 코드·allowlist·Actions로 수락.

---

## 3. 결론

과외쌤 홈 조회 실연결(103+105)과 GNB 학생찾기 현재위치=대표(106)가 `5c12a5d` / 닷홈 **#334**로 올라갔다. **109 닫음.**

다음 후보: 홈 팝업 **053**(관리자 먼저 아님 · 홈 모달 껍데기 Phase1). 로그인 운영 스모크(조회 실숫자)는 별도.
