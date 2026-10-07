# 186 REJECT · 재작업 — #/tutor MOCK 잔여

- 2026-09-29 · 우동공과2
- 저장 Must 1–4: PASS (코드)
- Must 5: **FAIL** — 칩 텍스트만 saved_regions, 클릭·현재위치·탭·학생스냅샷은 MOCK

## Must (재작업)
1. 칩 클릭 / getTutorRegionLabel 경로 → readTutorHomeRegions()[idx].label
2. renderTutorRegionTabs → saved_regions 또는 과외쌤 홈에서 숨김
3. search-tier-render pinTutorPrimary → tutorHomePrimaryLabel (MOCK 금지)
4. provider-home tutorPrimaryPlace → 동일

## Forbid
- 분포 차트 이번 범위 확장 강제
- 저장 폼 재리팩터
- commit/push/build:dothome
