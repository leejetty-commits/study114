# 공부방 DB

> **SSOT 5장 최우선**  
> [ssot/05-study-room-db.md](../ssot/05-study-room-db.md)

## 핵심 테이블

| 테이블 | 5장 |
|--------|-----|
| study_rooms | §4 |
| study_room_subject_targets | §5 |
| study_room_images | §6 |
| study_room_regions | §7 |
| facility_masters | §8 |
| study_room_facilities | §9 |

## DDL

```bash
mysql -u root -p < sql/schema/001_init.sql
mysql -u root -p study114 < sql/schema/005_study_room_ssot_align.sql
mysql -u root -p study114 < sql/schema/006_facility_masters_seed.sql
```

> `003_study_room_fields.sql` **폐기** → **005** 사용

## 잠금 요약

- 샵 **상세** 수준 · 1차 **핵심 축**
- 가격 `price_amount`(월·원) + `price_description`
- 시설 체크 ~5 + `facility_note`
- **기본 위치** vs **저장 지역**(max 3, 대표 1) **분리**
- 단지 우선 / 없으면 동
- 이미지 0~5 · 후기는 §11-4 방향(TODO)
- 광고/노출권 ↔ 정보 **분리**

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | Notion 5장 원문 반영 |
