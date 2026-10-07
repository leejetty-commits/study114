# 185 REJECT · 분포 막대 카드 실수치 재작업

- 2026-09-29 · 우동공과2
- PASS: no-route 칩·분포, 가이드 2종, getDefaultMypagePath, 빈대표→서울시, 우리동네 제거
- FAIL: tutor-activity-chart.js 시드(EXPOSURE_/MOCK) + 「예시」고지 → 제품 잠금 **카드기준 실수치**

## Must
1. 막대 숫자 = 카드(등록) 기준 실수치
2. DEMO/MOCK 집계 제거
3. 예시 고지 삭제
4. 집계 소스 주석 1줄

## Forbid
PASS UI 되돌리기 · 186 저장 재리팩터 · push/build:dothome
