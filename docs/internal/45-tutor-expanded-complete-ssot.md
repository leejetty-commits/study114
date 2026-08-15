# 과외쌤 expanded_complete · 검색 노출 SSOT

작성: 2026-08-16  
관련: [21장](../ssot/21-tutor-registration-management.md) · [44 런북](44-list-sort-ops-runbook.md) · 진단 SQL `sql/schema/041_ops_tutor_exposure_diagnose.sql`

---

## 1. 근본 원인 (운영 tutor total=0)

| 항목 | 내용 |
|------|------|
| 직접 원인 | 검색 WHERE = `published` **AND** `expanded_complete` 인데, 운영 `expanded_complete` = **0** |
| 구조 원인 | `TutorRegisterService::refreshDetailStatus` 가 **스텝 통과**만으로 상태를 올림 (`contact` → 무조건 complete). 시드/기본등록·부분공개 경로는 contact를 안 타서 **필드가 채워져도 `basic_only`에 고정** |
| 금지 대응 | 특정 row `UPDATE ... detail_completion_status='expanded_complete'` 수동 승격 |

---

## 2. expanded_complete 정의 (코드 SSOT)

**최종 판정 클래스:** `src/Tutor/TutorDetailCompletionEvaluator.php`

| 항목 | 내용 |
|------|------|
| 판정 시점 | **저장 시** (`saveStep` → `refreshDetailStatus` → `apply`) · **공개 직전** (TutorHub `publish`) · **관리자 전수 재계산** |
| 판정 방식 | DB에 저장된 **필수 필드** (스텝명 무시) |
| 조회 시점 | load/hydrate 시 `detail_missing` 계산 (표시용). 상태 컬럼은 저장/재계산 때 갱신 |

### 필수 필드 → DB

| 필수 | DB |
|------|-----|
| 표시명 | `tutors.tutor_display_name` |
| 대표 활동 시 | `tutor_regions` (`is_primary=1`) |
| 주력과목 | `tutors.main_subject_note` 또는 `tutor_subject_targets` |
| 강의장소 | `tutor_lesson_places` ≥1 |
| 과외비 | `tutors.preferred_fee_amount` > 0 |
| 산정방식 | `tutors.fee_basis_type` |
| 주/월 횟수 | `lessons_per_week` 또는 `monthly_session_count` (산정방식에 따름) |
| 1회 시간 | `tutors.minutes_per_lesson` > 0 |
| 소개문 | `intro_short` 또는 `intro_long` |
| 학교명 | `tutors.university_name` |

**공개(publish)만 추가:** 프로필 이미지 (`tutor_images`) — expanded_complete 에는 포함하지 않음.

### 상태 전이

```
basic_only
  → (상세 필드 일부) expanded_in_progress
  → (필수 전부) expanded_complete
  → (허브 publish + 이미지) published
  → 검색 노출 (published ∩ expanded_complete)
```

---

## 3. published vs expanded_complete

| 축 | 역할 |
|----|------|
| `detail_completion_status` | 상세등록 **완성도** (검색·Prime 후보 게이트) |
| `profile_status` | **공개/비공개** (draft / published / hidden) |

검색·Home Basic 노출: **둘 다** 필요.  
`published` 만으로는 검색에 안 나옴 (의도).

공부방(room): 동일 enum·검색 필터 철학. 완료 승격은 아직 `facility` 스텝 기반 (`StudyRoomRegisterService`) — tutor와 달리 **필드 Evaluator 미도입**.  
학생(student): `detail_completion_status` 없음 · `exposure_status` 사용.

---

## 4. 저장 경로

| 단계 | UI | API | 주요 컬럼 |
|------|----|-----|-----------|
| basic | tutor-ui / 기본등록 | `action=save` step=basic | 이름·소개·구성 |
| regions | tutor-ui | step=regions | `tutor_regions` |
| lesson | tutor-ui / home 인라인 | step=lesson | 과외비·장소·횟수 |
| career | tutor-ui / home 인라인 | step=career | 학교·전공·배지 |
| contact | tutor-ui / home 인라인 | step=contact | SNS·이미지·(intro 보강)·공개 |

매 저장 후 Evaluator가 `detail_completion_status` 재기록.  
응답에 `detail_missing` / `detail_checks` 포함.

---

## 5. 진단

1. SQL: `sql/schema/041_ops_tutor_exposure_diagnose.sql` (miss_* 컬럼)
2. Owner API: `POST /api/tutor/register.php` `{"action":"recompute_detail","tutor_id":N}`
3. Admin: `POST /api/admin/content/migrate.php` `{"confirm":"recompute-tutor-detail"}`  
   → **필드 기준 전수 재계산** (임의 complete 승격 아님)
4. Hub list/get: `detail_missing` 필드

---

## 6. 운영 데이터 정합화

코드 배포 후:

1. Admin `recompute-tutor-detail` 실행
2. diagnose SQL로 `miss_*` 확인
3. **필드가 이미 충족된 row만** complete로 바뀜
4. 시드형 published+basic_only 중 intro/`fee_basis_type` 등이 비면 **소유자가 상세등록으로 보강** (수동 status UPDATE 금지)

---

## 7. UI ↔ 검색 일치

| 표면 | 기준 |
|------|------|
| 마이페이지 「상세 완료」 | `detail_completion_status === expanded_complete` |
| 공개 가능 | Hub `publishMissing` = complete + 이미지 + 소개 등 |
| SearchService tutor | `published` + `expanded_complete` |
| Home Basic live | 동일 검색 API |

서로 어긋나면 Evaluator·Hub·Search 중 어디가 다른지 이 문서를 기준으로 맞춤.
