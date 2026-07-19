# 10-6 가입 후 지역등록 구현 체크리스트

**기준:** 가입은 가볍게 / 기본등록은 최소 seed / 검색·공개 본체는 상세등록  
**원칙:** 기본주소 ≠ 탐색·노출 지역 · 행정동|단지 **선선택 후 일관 유지** · 단지에는 **주소 보유·노출**

---

## A. 마스터 · 주소

- [x] A1. `complexes.address` 시드/백필 (웹에 뿌릴 단지마다 주소) — `037_*.sql` + `012` 시드
- [x] A2. regions/complexes API가 `address` 포함 반환 — `regions.php` · `StudyRoomRegisterService::getMasters`
- [x] A3. 학생·공부방 UI에서 단지 선택 시 주소 표시
- [x] A4. 프리뷰 fallback 단지에도 `address` 필드

## B. 서버 · DB

- [x] B1. `students.preferred_studyroom_region_basis` (`dong`|`complex`) 추가 — 037
- [x] B2. `study_rooms.region_basis_type` / `study_room_regions.region_basis_type` 추가 — 037
- [x] B3. `BasicRegisterService` — `default_region_id` 폴백 제거
- [x] B4. 학생 기본등록 — 희망유형·(공부방이면)기준·지역1 필수 저장
- [x] B5. 공부방 기본등록 — 기준·노출지역1(+단지면 complex_id) 저장
- [x] B6. 과외 PHP 기본등록 — 시(city) 단위로 프리뷰와 통일

## C. 학생/학부모 UI

- [x] C1. 기본등록: 희망유형 → (공부방) 행정동|단지 선선택 → 지역1 필수
- [x] C2. 과외쌤찾기: 시 1 필수 (행정동/단지 UI 없음)
- [x] C3. 상세: 선택한 기준만 입력 컴포넌트 전환 (동시 병행 제거)
- [x] C4. 기준 타입 저장·재진입 시 동일 문법
- [x] C5. 미선택 축을 공개 readiness에서 강제하지 않음
- [x] C6. 기본 seed와 상세가 같은 최종 필드 수정/확장 (상세 중복 텍스트 seed 제거)

## D. 공부방 UI

- [x] D1. 기본등록: 행정동|단지 선선택 → 노출지역 1 seed
- [x] D2. 단지 마스터 없으면 행정동만 허용
- [x] D3. 상세 location: 「단지 우선」 카피/문법 제거, 기준 일관
- [x] D4. 노출 2~3·세부 확장은 상세 책임 유지

## E. 홈 · 게이트

- [x] E1. 홈/찾기 기본값 = 지역등록 값(+기준), 기본주소 사용 금지 (기존 파이프 유지 + seed 라벨 기록)
- [x] E2. 지역등록 없으면 완성 홈 진입 금지 → 이어하기 (가입완료 CTA)
- [x] E3. 가입완료 「메인 홈」도 미등록 시 이어하기로

## F. 검증 · 배포

- [x] F1. 건물 동(101동) 단위 입력 없음 (단지명+주소만)
- [x] F2. `build:dothome` 완료 · `git status` 확인 (public 산출물은 gitignore)
- [x] F2b. `037` 마이그레이션 — 운영 DB 적용 완료 (2026-07-19 · ready=true · 단지 주소 2건)
- [x] F3. commit / push / Actions **success** · 사이트 auth·regions API 확인

---

## 진행 순서 (완료)

1. ~~A + B (스키마·API·폴백 제거)~~
2. ~~C 학생 기본/상세~~
3. ~~D 공부방 기본/상세~~
4. ~~E 홈 게이트~~
5. ~~B6·C5 (P1)~~
6. ~~F 빌드·커밋·푸시~~ / **DB 037은 서버에서 SOURCE 필요**

## 운영 시 필수

```sql
-- 로컬/서버 DB에 적용
SOURCE sql/schema/037_region_basis_and_complex_address.sql;
```

단지 주소가 비어 있으면 UI에 `(주소 미등록)` 또는 빈 힌트가 나옵니다. 신규 단지는 `complexes.address`를 반드시 채우세요.
