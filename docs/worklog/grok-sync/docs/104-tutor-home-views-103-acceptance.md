# 104 · 103 로컬 부분 수락 — 과외쌤 홈 조회 화면 연결

- 작성일: 2026-09-25 (KST)
- 대상: [103](103-tutor-home-views-real-lifetime-ticket.md)
- 판정: **로컬 부분 수락** (화면·허수제거·C되돌림 OK · **서버 lifetime_views는 미완 → [105](105-tutor-roi-lifetime-views-no-room-ticket.md)**)
- push: **안 함**

---

## 1. 받은 것

| 항목 | 결과 |
|------|------|
| 표시 | `fetchRoiSummary(7)` → `lifetime_views` · 숫자 또는 **—** · `MY_TUTOR.views`(64) **미사용** |
| 파일 | `screens/tutor.js` 수정 · `tutor-home-seed.js` 신설 · `paid-api` 무변경 |
| 되돌림 | study-room-reg · location-display · ProviderUsage · provider-status **restore** |
| 삭제 | teaser-* · .tmp* · _verify |
| 회귀 보고 | 히어로·쪽지 후기함·활동형 없음 유지 |
| push | 안 함 |

로컬에서 응답에 12가 오면 12로 바뀐 증거 OK(허수 경로 제거 증명).

---

## 2. 막힌 원인 (운영)

`ProviderRoiService::getSummary`:  
`lifetime_views`는 **`study_room_id`가 있을 때만** 공부방 1건 COUNT.  
없으면 **항상 null**.

과외쌤은 공부방 번호 없이 부르므로, **지금 서버면 운영 박스는 조회가 쌓여도 —** 이다.  
→ 103 화면 지시만으로는 「실제 조회」제품 목표 미달. **서버 보완 105 필수.**

---

## 3. 결론

103의 **프론트·청소**는 수락. **배포 보류** — 105와 묶거나 105 수락 후 같이 배포.
