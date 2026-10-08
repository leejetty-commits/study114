# 048-acceptance · 044 보완 수락 (hub 폴백·단방 조회)

- 작성일: 2026-09-24 (KST)
- 대상: Cursor 048 로컬 보고
- 판정: **수락**
- 선행: [044](044-studyroom-home-promo1-memberbox-ticket.md) 조건부수락 · [048](048-studyroom-home-044-fixup-hub-views.md)
- 상태: 로컬만 · push/`build:dothome` **금지** (별도 배포 지시 전)

## 증거 (보고·요구 대조)

| 요구 | 결과 |
|------|------|
| 홈=홍보1 only (개설 아님) | 티켓0040: 개설 삼성1동(92) / 홍보1 논현1동(91) → 화면·우리동네·지도·현재위치 **논현1동만**. 삼성·대치 0 |
| `studyRoomPromo1Label` hub 폴백 삭제 | primary.`promo_label`만. 슬롯/개설 `region_label` 미사용. 없으면 `—` |
| `lifetime_views` 단방 COUNT | SQL: `target_type=study_room` AND `target_id=?` (+ 소유·본인열람제외). 방1+tutor1 비교 시 신=1/구=2. room4=0 · roi `study_room_id` 필수 |
| 논현 coords (선택) | location-display / naver-map만 |
| 범위 | 046·047·가입·043·prime·지도재구성·상세검색 **미포함**. commit/push/build 없음 |

## 잔여 (다른 티켓)

- 046 맵박스·상세검색 제거 · 047 프라임 점유 · 050 홈학생/찾기 차등
- 044+048 커밋 시 dirty(signup 등) 분리

044 상태: **로컬 수락 완료**(048 포함).
