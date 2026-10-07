# 015 · 학생 마이페이지 리뉴얼 C — 수락 검토

- 작성일: 2026-09-23 (KST)
- 선행: [014](014-student-mypage-renewal-ticket-c-basic.md)
- 대상: Cursor C 보고 (미커밋)
- 상태: **로컬 수락** (push / `build:dothome` 대기)

---

## 0. 한 줄 결론

014 기준으로 **기본정보 9종 + `request_summary` 기존 PATCH 저장 + 마이프로필 카드 일치**는 로컬에서 닫혔다.  
추가 보완지시문은 없다. 다음 티켓은 **D(상세정보)** 만 연다.

---

## 1. 파일

| 파일 | 역할 |
|------|------|
| `preview/home-ui/src/student-reg/screens.js` | `renderBasicForm` 9종 · 대표/부족/공개 카피 제거 · basic sync |
| `src/Registration/StudentHubRepository.php` | 기존 update allowlist·지역 id·과목·요청문 검증 · 예산 숫자 상한을 컬럼 범위에 맞춤 (스키마 미변경) |

새 엔드포인트 없음. `PATCH …/students.php` `action: update`만.

---

## 2. 014 체크

| 잠금 | 결과 |
|------|------|
| 필드 9종 (학교급+학년 포함) | 예 |
| 상세 전용 미유입 | 예 (보고·detail 폼 유지) |
| 대표*/부족/공개 게이트 카피 기본정보에서 제거 | 예 |
| `request_summary` 저장 | 예 (allowlist + 저장 전후 카드 표) |
| 카드 일치 후 원문 복구 | 예 |
| A/B 라우팅·탭·좌측 유지 | 예 |
| 스키마·push/build·auth WIP | 미손 |

예산: PHP가 SMALLINT식 65535로 막아 550,000이 거절되던 것을, **스키마 변경 없이** fee 컬럼용 검증 상한만 맞춤. 로컬 문서에 메모.

---

## 3. 잔여 (C 미완료 아님)

1. `preferred_lesson_type`에 HTML `required` 잔존 가능 → 카피성 「필수」와 별개. E/F 또는 후속 톤 정리.
2. `renderNotFound` 「자녀」·publish UI 잔재 → E.
3. 쪽지설정 저장 → 별도.
4. 커밋 시 A+B+C 관련만, auth WIP 분리.

---

## 4. 다음

- **D**: [016](016-student-mypage-renewal-ticket-d-detail.md)
