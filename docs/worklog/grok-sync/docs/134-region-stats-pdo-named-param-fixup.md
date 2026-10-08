# 134 · 보완 — 검색 지역 LIKE PDO 이름 파라미터 중복 (지도 숫자 500)

- 작성: 2026-09-25 05:22 KST
- 선행: [133](133-guest-home-132-deploy-acceptance.md) · 운영 #336 스모크
- 상태: **로컬 수락** → [135](135-region-stats-pdo-134-acceptance.md) (`db4cde2`). 배포는 「배포」 후.
- 기준 HEAD: `fb3bbf5` (`origin/main`)
- push / `build:dothome` **이번 티켓 본문에 허가 문구 없으면 금지**

---

## 0. 목표 (화면)

손님 홈 지도 「대치동」 박스의 공부방·과외쌤·학생 숫자가 운영에서 **실수(또는 0)** 로 나오게.  
지금은 API 500이라 「—」만 보임(허수는 없음).

---

## 1. 원인 (확정)

`src/Search/SearchService.php` 지역 라벨 필터 SQL이 **같은 PDO 이름**을 여러 번 사용.

| 축 | 자리표시자 | 횟수 |
|----|------------|------|
| 과외쌤 | `:tutor_region_like` | 4 (sido/sigungu/dong/label) |
| 학생 | `:preferred_region_like_ps` | 3 |
| 학생 | `:preferred_region_like_pt` | 3 |

닷홈 PDO는 이름 파라미터를 한 번만 바인딩 → 과외·학생 `search()` 500.  
공부방 `applyRegionLabelMatch`는 `_a0`/`_b0`처럼 **이미 고유 이름** → 대치동 200·total 1.

`region-stats.php` → `guestAxisCounts()`가 세 축을 연속 호출하므로 **전체 500**.

---

## 2. 수정 (최소)

파일 **1개만**: `src/Search/SearchService.php`

1. 과외 `tutor_region_label` 분기: `:tutor_region_like` → `:tutor_region_like_0` … `_3` (또는 sido/sigungu/dong/label 접미사). `$params`도 각각 같은 값으로 넣기.
2. 학생 `preferred_region_label` 분기: `:preferred_region_like_ps` → `_ps_0`…`_ps_2`, `_pt_0`…`_pt_2` 동일.
3. **필터 의미·토큰·LIKE `%token%` 변경 금지.** 이름만 고유하게.
4. 다른 탭·정렬·스키마 변경 금지.

가설: emulate prepares / `?` 위치 파라미터로 바꿔도 되나, **기존 공부방 패턴(고유 이름)에 맞추는 쪽 선호.**

---

## 3. Allowlist (B)

```
src/Search/SearchService.php
```

필요 시만(보고 후): 해당 축 단위 테스트가 있으면 그 파일만.

---

## 4. Forbidden (C)

```
git push · build:dothome (사용자가 「배포」하기 전)
UI/CSS · region-stats.php 불필요 변경
스키마 SQL
dirty study-room-reg/screens.js · docs/046·047
git add -A
```

---

## 5. 스모크 (로컬 또는 배포 후 운영)

1. `search.php` tutor + `tutor_region_label=서울시` → 200 (total ≥0)
2. `search.php` student + `preferred_region_label=서울시` → 200
3. `search.php` room + `region_label=대치동` → 200 유지
4. `POST /api/search/region-stats.php` `{}` → 200 · 세 숫자 · axes
5. `#/guest` 지도 박스 = API 숫자 (「—」/47·62·128 아님)

---

## 6. 보고

SHA · diff(SearchService만) · 스모크 1~5 · push 여부.

---

## 붙여넣기

```
[티켓 134 · 보완 · PDO 이름 파라미터 중복 · 지도 region-stats 500 · 로컬만 · push 금지(배포 말 전까지)]

※ HEAD fb3bbf5 · D:\work\study114 · git -c safe.directory=D:/work/study114
※ allowlist: src/Search/SearchService.php 만
※ 원인: :tutor_region_like ×4, :preferred_region_like_ps×3, :preferred_region_like_pt×3 — 닷홈 PDO 중복 이름 바인딩 실패
※ 수정: 자리표시자·$params 키만 고유하게 (공부방 _a0/_b0 패턴). LIKE 의미·토큰·스키마·UI 변경 금지
※ 스모크: search tutor/student 서울시 200, room 대치동 유지, POST region-stats 200, #/guest 박스=실수
※ dirty·Notion·push·build:dothome 금지. 커밋 1개 로컬만.
※ 정본: docs/134 (box study114-ds)
```
