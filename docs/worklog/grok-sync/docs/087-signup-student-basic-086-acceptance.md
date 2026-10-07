# 087 · 수락 — 086 가입 학생 기본정보 아홉 칸 (로컬)

- 작성일: 2026-09-24 (KST)
- 티켓: [086](086-signup-student-basic-nine-fields-ticket.md) · 소견 [085](085-signup-student-basic-nine-fields-findings.md)
- 상태: **로컬 기능 수락** · push/`build:dothome` **금지** (배포는 「배포」 후에만)

---

## 0. 판정

**수락.** 보완지시문 없음(잔여는 차단 아님).

| 항목 | 결과 |
|------|------|
| 아홉 칸 UI (프리뷰 `role=student`) | 통과 |
| 대표/부족/공개완료·상세 미포함 | 통과 |
| 1:1 → 수업인원 단독 잠금 · 390px 칩 | 통과(보고) |
| 희망지역 f6b5400 유지 · 은마/대치 없음 | 통과 |
| Allowlist 8파일 · C 미손 · push 안 함 | 통과 |
| 기존 컬럼만 · 스키마 대수술 없음 | 통과(보고) |
| 실제 INSERT 스모크 | **유보** (환경 mysqli 차단) |

---

## 1. 저장 매핑 (Cursor 보고)

| 칸 | 저장 |
|----|------|
| 표시명 | `students.public_display_name` |
| 학년 | `students.grade_level` |
| 학교급 | 과목 있을 때만 `student_subject_targets.school_level` |
| 희망 유형 | `preferred_lesson_type` |
| 희망지역 | 과외 `preferred_tutor_region_id` · 공부방 행정동·단지 |
| 희망과목 | `student_subject_targets.subject_name` |
| 수업형태·인원 | `lesson_format`, `preferred_student_count_group` |
| 예산 | `preferred_fee_amount` / `preferred_studyroom_fee_amount` |
| 한 줄 요청문 | `request_summary` |

메모: 학교급만 고르고 과목 없으면 subject 필수 때문에 school_level enum 미기록 · 학년 문자는 grade_level에 남음. 마이페이지와 의미 충돌 여부는 배포 전 한 번 더 보면 좋음(수락 차단 아님).

---

## 2. 파일

`signup-basic.js` · `student-basic.css` · `main.js` · `layout.js` · `mvc.css` · `basic-student.php` · `signup-basic.php` · `BasicRegisterService.php`

---

## 3. 다음

- 사용자 「배포」 시 allowlist 배포 티켓.
- 실제 DB INSERT는 배포 전후 운영/로컬 PHP에서 1회.
- 메일 대기탭 자동 이어가기(BroadcastChannel 등)는 **별 정책** — [070](070-signup-mail-tab-student-hope-region-findings.md) 후순위였음 · 사용자 재질문(2026-09-24) → 채팅에서 선택.

---

## 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-24 22:15 | Cursor 086 보고 대조 · 로컬 수락 |
