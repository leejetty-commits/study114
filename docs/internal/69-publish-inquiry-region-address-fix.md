# 69 · 공개 / 쪽지 / Pick·Prime / 주소 persistence 재정렬

기준일: 2026-09-19  
계정 실측 대상: `leejetty+room@gmail.com`  
정본 SSOT: [20장](../ssot/20-study-room-registration-management.md) §4-3~§5-2 (본 문서로 교체)

---

## 1. 확정 정책

| 축 | 영향 |
|---|---|
| 공개 (`profile_status`) | 원장 스위치만. 입력 완성도·쪽지 **무관** |
| 쪽지 (`inquiry_status`) | 카드 CTA만. 기본값 **open**. 공개 **무관** |
| 베이직 노출 | `published` 만으로 가능 (빈 상세 허용) |
| Pick/Prime | 상세 완성 + 홍보지역 ID. 공개와 별개 자격 |
| 주소/우편번호 | 저장·조회·hydrate 동일 필드. 빈값 overwrite 금지 |

---

## 2. 코드 원인 (확정)

1. `StudyRoomHubService::publishMissing` 가 `contact_time_note`·완성도를 공개 게이트로 사용 → **제거**
2. `hydrateRoom` 이 `address_zip` 미반환 + `study_rooms.address_zip` 컬럼 없음 → 재진입 시 우편번호 공란
3. Hub `saved_regions` 와 `study_rooms.region_id` 불일치 시 positions 후보 0개 → Hub 합성 + `ensurePrimaryRegionRow`

---

## 3. 스키마

- `sql/schema/067_publish_inquiry_split_address_zip.sql`
- 운영: phpMyAdmin 적용 필수 (Actions는 SQL 미실행)

---

## 5. 운영 실측 (2026-09-19)

`GET https://study114.net/api/health/db.php?email=leejetty%2Broom%40gmail.com`

| 항목 | 실측 |
|---|---|
| schema `study_rooms.address_zip` | 적용 후 **true** (`apply_067=1`) |
| schema `inquiry_status` DEFAULT | 적용 후 **open** |
| study_room_id | **7** |
| profile_status | `draft` |
| detail_completion_status | `expanded_complete` |
| inquiry_status (기존 행) | `paused` (일괄 미변경) |
| top_region_id_set | true |
| study_room_regions_rows | **3** |
| study_room_regions_with_id | **3** |
| positions_region_ready | **true** |
| address_text_set | true |
| address_zip_set | **false** (컬럼 신설 직후 · 재저장 필요) |

배포 JS (`/assets/index-CnBvfavv.js`): `canPublish:!0` 확인.

