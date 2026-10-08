# 135 · 134 PDO 이름 분리 — 로컬 수락

- 작성: 2026-09-25 05:26 KST
- 선행: [134](134-region-stats-pdo-named-param-fixup.md) · [133](133-guest-home-132-deploy-acceptance.md)
- 상태: **로컬 수락** · 배포 허가 → [136](136-region-stats-pdo-134-deploy-ticket.md).
- 커밋: `db4cde227b030b195a723c7ae7811302694dabe9`
- 부모: `fb3bbf5` (= 현재 `origin/main`)
- 메시지: `fix(search): give each region LIKE placeholder its own PDO name`
- 파일: `src/Search/SearchService.php` **만** (+22/−19)

---

## 판정

134 잠금과 일치. LIKE 값·토큰·컬럼 의미 불변, PDO 이름만 공부방 `_aN` 패턴으로 분리.

| 축 | 새 이름 |
|----|---------|
| 과외 | `tutor_region_like_a0`~`a3` (시·구·동·라벨) |
| 학생 공부방 희망 | `preferred_region_like_ps_a0`~`a2` |
| 학생 과외 희망 | `preferred_region_like_pt_a0`~`a2` |
| 공부방 대치동 | 기존 고유 이름 유지(미변경) |

dirty(`study-room-reg/screens.js`, docs/046·047·README) 미포함. push 안 함.

운영은 아직 `fb3bbf5`라 서울시 필터·지도 집계 500 유지 — **이 커밋 배포 후** 스모크.

---

## 배포 후 스모크 (136 예정)

1. `POST /api/search/region-stats.php` `{}` → 200 · 세 숫자
2. search tutor/student `서울시` → 200
3. `#/guest` 지도 박스 = 실수(「—」/47·62·128 아님)
