# 108 · 105 로컬 수락 — ROI 과외쌤 lifetime_views

- 작성일: 2026-09-25 (KST)
- 대상: [105](105-tutor-roi-lifetime-views-no-room-ticket.md) · 선행 프론트 [103](103-tutor-home-views-real-lifetime-ticket.md)/[104](104-tutor-home-views-103-acceptance.md)
- 판정: **로컬 수락** (코드 대조 · **DB 실행 스모크는 PC에 MySQL 없어 미실시 → 배포 시 운영 확인**)
- push: **안 함**

---

## 1. 받은 것

| 잠금 | 결과 |
|------|------|
| room id 있음 | 기존 `countLifetimeViewsForProvider` · 공부방 1건 · 본인 열람 제외 |
| room id 없음 | 신설 `countLifetimeViewsForTutor` · `target_type=tutor` · 소유 프로필 · 기간 없음 · 본인 제외 · **0**(null 아님) |
| metrics.views | 미변경 |
| 103 프론트 | 유지 · 숫자/0 표시 · —는 null/실패만 |
| 파일 | `ProviderRoiService.php` · `ProviderRoiRepository.php`만 |
| 축 분리 | 106 검색·홈 UI 미포함 |

---

## 2. 배포 시 묶음 후보 (아직 지시 안 함)

워킹트리에 아직 미푸시:

- **103** 조회 프론트: `tutor.js` · `tutor-home-seed.js`
- **105** ROI 서버: 위 2 PHP
- **106** 학생찾기: `search-page.js` · `search-find-surface.js`

→ 배포할 때 **커밋을 축별로 나누거나**, 사용자가 한 배치를 명시하면 allowlist로 잠근다.

---

## 3. 결론

**105 로컬 닫음.** 운영에서 `roi?days=7`(room 없음) → `lifetime_views` 숫자 · 과외쌤 박스 조회 반영을 배포 스모크에 넣을 것.
