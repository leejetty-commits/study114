<?php
use Study114\Auth\RegisterEnums;

/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
$lessonFormat = (string) study114_old($old, 'lesson_format', 'one_on_one');
$isGroup = $lessonFormat === 'group';
?>
<form method="post" action="/auth/signup/basic" class="basic-register" data-basic-form="student">
  <input type="hidden" name="role_ui" value="student">
  <p class="auth-section-title">검색 핵심축 (14장 §4-1)</p>

  <div class="form-group">
    <span class="form-label form-label--required">희망 유형</span>
    <?= study114_chip_group('preferred_lesson_type', RegisterEnums::preferredLessonTypes(), (string) study114_old($old, 'preferred_lesson_type', 'tutor')) ?>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="region_id">희망 지역</label>
    <select class="form-input" id="region_id" name="region_id" required>
      <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '')) ?>
    </select>
    <input class="form-input mt-4" name="preferred_region_note" value="<?= study114_e(study114_old($old, 'preferred_region_note', '')) ?>" placeholder="지역 보조 메모 (선택)">
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="subject_names">희망 과목</label>
    <input class="form-input" id="subject_names" name="subject_names" value="<?= study114_e(study114_old($old, 'subject_names', '수학')) ?>" placeholder="쉼표 구분 · 첫 과목이 주력">
  </div>

  <div class="form-row">
    <div class="form-group">
      <span class="form-label form-label--required">학교급</span>
      <?= study114_chip_group('school_level', RegisterEnums::schoolLevels(), (string) study114_old($old, 'school_level', 'middle')) ?>
    </div>
    <div class="form-group">
      <label class="form-label form-label--required" for="grade_level">학년</label>
      <input class="form-input" id="grade_level" name="grade_level" value="<?= study114_e(study114_old($old, 'grade_level', '중2')) ?>" required>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <span class="form-label form-label--required">학생 성별</span>
      <?= study114_chip_group('gender', [
          ['value' => 'male', 'label' => '남'],
          ['value' => 'female', 'label' => '여'],
      ], (string) study114_old($old, 'gender', 'male')) ?>
    </div>
    <div class="form-group">
      <label class="form-label form-label--required" for="birth_year">출생연도</label>
      <input class="form-input" type="number" id="birth_year" name="birth_year" min="1990" max="2025" step="1" value="<?= study114_e(study114_old($old, 'birth_year', 2012)) ?>" placeholder="예: 2012" required>
    </div>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">희망 수업장소</span>
    <?= study114_chip_group(
        'lesson_places',
        RegisterEnums::studentPlaces(),
        study114_old($old, 'lesson_places', ['student_home']) ?: ['student_home'],
        true
    ) ?>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">수업형태</span>
    <?= study114_chip_group('lesson_format', RegisterEnums::lessonFormats(), $lessonFormat) ?>
  </div>

  <div class="form-group" data-student-group-only<?= $isGroup ? '' : ' hidden' ?>>
    <span class="form-label form-label--required">그룹 구성</span>
    <?= study114_chip_group('student_gender_group', RegisterEnums::genderGroups(), (string) study114_old($old, 'student_gender_group', 'mixed')) ?>
  </div>

  <div class="form-group" data-student-count-group<?= $isGroup ? '' : ' hidden' ?>>
    <span class="form-label form-label--required">희망 수업인원</span>
    <?= study114_chip_group(
        'preferred_student_count_group',
        array_values(array_filter(RegisterEnums::studentCountGroups(), static fn ($o) => $o['value'] !== 'solo')),
        (string) study114_old($old, 'preferred_student_count_group', 'two')
    ) ?>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label class="form-label form-label--required" for="lessons_per_week">주 횟수</label>
      <input class="form-input" type="number" id="lessons_per_week" name="lessons_per_week" min="1" max="7" value="<?= study114_e(study114_old($old, 'lessons_per_week', 2)) ?>" required>
    </div>
    <div class="form-group">
      <label class="form-label form-label--required" for="minutes_per_lesson">1회 시간(분)</label>
      <input class="form-input" type="number" id="minutes_per_lesson" name="minutes_per_lesson" min="30" step="10" value="<?= study114_e(study114_old($old, 'minutes_per_lesson', 90)) ?>" required>
    </div>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">희망 강의스타일</span>
    <?= study114_chip_group(
        'teaching_style_badges',
        RegisterEnums::teachingStyles(),
        study114_old($old, 'teaching_style_badges', ['meticulous']) ?: ['meticulous'],
        true
    ) ?>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label class="form-label form-label--required" for="preferred_fee_amount">수업예산 (과외)</label>
      <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="<?= study114_e(study114_old($old, 'preferred_fee_amount', 550000)) ?>" required>
    </div>
    <div class="form-group">
      <label class="form-label" for="preferred_studyroom_fee_amount">수업예산 (공부방)</label>
      <input class="form-input" type="number" id="preferred_studyroom_fee_amount" name="preferred_studyroom_fee_amount" value="<?= study114_e(study114_old($old, 'preferred_studyroom_fee_amount', 420000)) ?>">
    </div>
  </div>

  <div class="form-group">
    <label class="form-label" for="public_display_name">블라인드 표시명</label>
    <input class="form-input" id="public_display_name" name="public_display_name" value="<?= study114_e(study114_old($old, 'public_display_name', '맑은하늘')) ?>">
  </div>

  <div class="form-group">
    <label class="form-label" for="request_summary">요청문 (선택)</label>
    <textarea class="form-input form-textarea" id="request_summary" name="request_summary" rows="2"><?= study114_e(study114_old($old, 'request_summary', '')) ?></textarea>
    <span class="form-label mt-4">요청문 공개</span>
    <?= study114_chip_group('request_summary_visibility', RegisterEnums::visibilities(), (string) study114_old($old, 'request_summary_visibility', 'private')) ?>
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">기본등록 완료</button>
  </div>
</form>
<script>
document.querySelector('[data-basic-form="student"]')?.addEventListener('change', (e) => {
  if (e.target.name !== 'lesson_format') return;
  const isGroup = e.target.value === 'group';
  document.querySelector('[data-student-group-only]')?.toggleAttribute('hidden', !isGroup);
  document.querySelector('[data-student-count-group]')?.toggleAttribute('hidden', !isGroup);
});
</script>
