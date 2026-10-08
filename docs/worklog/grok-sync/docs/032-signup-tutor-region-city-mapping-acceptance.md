# 032 · 가입 티켓 1(030) 수락 — 과외쌤 시·군 매핑

- 작성일: 2026-09-24 (KST)
- 대상: [030](030-signup-tutor-region-city-mapping-ticket.md)
- 상태: **로컬 수락** (push / `build:dothome` / 커밋 없음 — Cursor 보고와 동일)
- 검수: Cursor 보고 + `korea-sidos.js` diff 대조. 운영 스모크는 사용자 확인 권장.

---

## 0. 한 줄

원인(화면 라벨 `경기도 의정부시` ≠ API `의정부시` + 행정동 폴백 오매칭)과 수정(시 단위 `region_id` 해석)이 030에 맞다. **수락.**

---

## 1. 대조

| 030 요구 | 결과 |
|----------|------|
| alert 「선택한 시에 매핑된 지역이 없습니다」 해소 | `regionIdFromActivityLabel`로 시 단위 id 해석 |
| 의정부시 → region_id | **29** (cities: label 의정부시, sido_name 경기도, kind city) |
| 과외쌤 슬롯 시·군 | 경기도 + 의정부시 → 29 |
| 학생 희망유형=과외 공유 레이어 | 같은 해석 → 29 (허용) |
| 공부방 행정동 미매핑 | 경기 의정부시 가능동 **매핑 안 함** (올바름) |
| 파일 | `preview/shared/korea-sidos.js` (+42/−3) · `signup-basic.js`의 매핑 호출 교체 |
| push/빌드/커밋 | 안 함 |

핵심 API (`korea-sidos.js`):

- `activityLabelForUnit` — 도 시 화면 라벨
- `regionIdFromActivityLabel` — 화면 라벨 → 숫자 region_id (행정동 라벨 미사용)
- `activityLabelFromRegionId` — 역변환
- `numericRegionId` — 정적 프리뷰 id 저장 제외
- `regionIdFromSelection` — 숫자 id만 반환

---

## 2. 주의 (수락은 유지)

워킹트리에 auth/mypage 외 **다른 dirty**가 많다 (`layout.js`, `study-room-reg`, PHP 뷰, `BasicRegisterService` 등).  
030 커밋을 나중에 할 때는 **시·군 매핑 관련만** 스테이징할 것. `signup-basic.js` 안의 학생 기본 9필드/CSS 클래스 대규모 WIP와 **한 커밋으로 섞지 말 것.**

---

## 3. 사용자 스모크 (로컬·프리뷰)

1. 과외쌤 가입 → 활동지역 경기도 → 의정부시 → 다음/저장 → alert 없음 · payload `region_id=29`
2. (선택) 학생 희망유형 과외 → 동일
3. 공부방 동·단지 화면 회귀 없음

---

## 다음

티켓 2 — 완료 화면 `—` / 디버그 칸 → [033](033-signup-complete-blank-debug-ticket.md)
