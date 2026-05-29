# 과외쌤 DB (미확정)

> **현재 상태**: `sql/schema/001_init.sql` 에 과외쌤 테이블 **미포함**.  
> DDL 하단 TODO 주석만 존재. 본 문서는 **참고용 초안**이며, 스키마 확정 시 DDL·문서를 함께 갱신한다.

## 예약된 연동

- `user_roles.role = 'tutor'` — 역할 enum 만 DDL에 포함
- 한 회원이 `study_room_owner` + `tutor` 동시 보유 가능 (설계 원칙)

## 예상 테이블 (TODO)

| 테이블 | 용도 |
|--------|------|
| tutors | 과외쌤 프로필 (users 1:1 권장) |
| tutor_subjects | 과목·학교급 |
| tutor_regions | 활동 지역 (단지 우선 / 동 fallback) |

## 1차 방향 (확정 전)

- 등록 + 기본 검색
- 홈 핵심은 공부방 우선
- 지역 정책은 공부방과 동일: 단지 우선, 없으면 동

## 확정 시 할 일

1. `sql/schema/002_tutors.sql` (또는 001 병합) 작성
2. 본 문서를 DDL 컬럼·인덱스 수준으로 상세화
3. [README.md](README.md) ER·테이블 목록 갱신

## URL (추후)

- `/tutors` — 목록·검색
- `/tutors/{id}` — 상세
- `/tutors/register` — 등록·수정
