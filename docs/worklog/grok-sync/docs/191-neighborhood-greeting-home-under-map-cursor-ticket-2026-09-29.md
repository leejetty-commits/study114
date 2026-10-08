# 191 · Cursor — 동네인사 홈 목록 (배너 아래 · 5줄 · 팝업)

- 작성: 2026-09-29 · 우동공과2 · 위치 잠금: **전 역할 상단 마케팅 배너 바로 아래**(지도 아래 아님)
- 선행: 173 · 190 · 190b · push/build:dothome/Notion **금지**

## Must
1. 손님·학생·과외쌤·공부방 홈 **동일 슬롯**: 상단 마케팅 배너 바로 아래
2. 최근순 세로 약 5줄 (표시명 + 인사 요약)
3. 표시명 → 베이직카드 팝업
4. 줄 나머지/더보기 → 전문 팝업 · 최근순 **5개씩** 페이지
5. 카드 없음 → 「카드를 볼 수 없어요」
6. 손님은 읽기만(남기기 UX 없음). 남기기는 마이(공부방·과외쌤·학생) · **강제 아님**
7. 용어 「학생」(학부모 지양) · 190/190b/173 회귀 금지

## Allowlist
- neighborhood-greeting-ui.js · neighborhood-greeting.css
- guest/parent(student)/tutor/study-room 홈 mount 위치만

## Forbid
강제 독촉 · 공개블록 · 대학 · commit/push/build:dothome
