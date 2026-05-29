# 지역·단지 정책

## 우선순위

1. **단지(complex)** — 아파트·주상복합·타운하우스 단지 등 이름·코드가 있는 경우
2. **동(dong)** — 단지 정보가 없거나 미입력 시

검색·노출·필터 모두 동일 규칙:

```
display_location =
  IF complex_id IS NOT NULL → complexes.name (+ 선택적으로 dong)
  ELSE → regions.dong_name (또는 full_address 요약)
```

## 테이블 관계

```
regions (시/구/동 마스터)
    ↑
complexes (단지, dong_id FK)
    ↑
study_rooms.complex_id (nullable)
study_rooms.region_id (dong level, required when no complex)

tutors — 동일 패턴 (희망 지역·활동 지역)
```

## 공부방 등록 UI (1차 설계)

1. 시/구 선택 → 동 목록
2. **「우리 단지에서 찾기」** (선택): 단지 검색·선택
3. 단지 미선택 시 **동만**으로 등록
4. 상세 주소(동·호 등)는 `address_detail` — 공개 범위는 운영 정책 (1차: 비공개 또는 마스킹)

## 과외쌤 지역

- **활동 가능 지역**: 다중 선택 (dong 또는 complex)
- `tutor_regions` junction 테이블
- 검색: 사용자 위치(단지 우선)와 매칭

## 인덱스·검색

- `study_rooms`: `(region_id)`, `(complex_id)`, `(status, region_id)`
- `complexes`: `(region_id, name)` fulltext 또는 name prefix
- 홈 공부방 리스트: 단지 ID 또는 dong ID 필터

## 데이터 적재

- `regions`: 행정동 코드 기반 시드 (추후 `sql/seeds/regions.sql`)
- `complexes`: 점진적 수집·운영자 입력·크롤/API (1차는 수동 등록 API)
