<?php
use Study114\Auth\RegisterEnums;

/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
$profileGenderDefault = (string) study114_old($old, 'gender', $profileGender ?? 'male');
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="tutor">
  <p class="auth-section-title">검색 핵심축 (14장 §4-3)</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
    <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="<?= study114_e(study114_old($old, 'tutor_display_name', '김수학')) ?>" required>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">과외쌤 성별</span>
    <p class="form-note">매칭·검색 needs · <span class="field-db-name">user_profiles.gender</span></p>
    <?= study114_chip_group('gender', RegisterEnums::personalGenders(), $profileGenderDefault) ?>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="region_id">대표 활동 지역</label>
    <select class="form-input" id="region_id" name="region_id" required>
      <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '1')) ?>
    </select>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="main_subject_note">주력과목</label>
    <input class="form-input" id="main_subject_note" name="main_subject_note" value="<?= study114_e(study114_old($old, 'main_subject_note', '수학')) ?>" required>
  </div>

  <div class="form-row">
    <div class="form-group">
      <span class="form-label form-label--required">지도 대상 성별</span>
      <?= study114_chip_group('student_gender_group', RegisterEnums::tutorGenderGroups(), (string) study114_old($old, 'student_gender_group', 'mixed')) ?>
    </div>
    <div class="form-group">
      <span class="form-label form-label--required">수업인원</span>
      <?= study114_chip_group('student_count_group', RegisterEnums::studentCountGroups(), (string) study114_old($old, 'student_count_group', 'solo')) ?>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label class="form-label form-label--required" for="preferred_fee_amount">대표 과외비 (월)</label>
      <input class="form-input" type="number" id="preferred_fee_amount" name="preferred_fee_amount" value="<?= study114_e(study114_old($old, 'preferred_fee_amount', 480000)) ?>" required>
    </div>
    <div class="form-group">
      <span class="form-label form-label--required">산정방식</span>
      <?= study114_chip_group('fee_basis_type', RegisterEnums::feeBasisTypes(), (string) study114_old($old, 'fee_basis_type', 'monthly_by_weekly_schedule')) ?>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label class="form-label" for="lessons_per_week">주 횟수</label>
      <input class="form-input" type="number" name="lessons_per_week" value="<?= study114_e(study114_old($old, 'lessons_per_week', 2)) ?>">
    </div>
    <div class="form-group">
      <label class="form-label" for="minutes_per_lesson">1회 시간(분)</label>
      <input class="form-input" type="number" name="minutes_per_lesson" value="<?= study114_e(study114_old($old, 'minutes_per_lesson', 90)) ?>">
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label class="form-label" for="university_name">출신대학명</label>
      <input class="form-input" name="university_name" value="<?= study114_e(study114_old($old, 'university_name', '서울대학교')) ?>">
    </div>
    <div class="form-group">
      <label class="form-label" for="major_name">전공명</label>
      <input class="form-input" name="major_name" value="<?= study114_e(study114_old($old, 'major_name', '수학과')) ?>">
    </div>
  </div>

  <div class="form-group">
    <span class="form-label">학적상태</span>
    <?= study114_chip_group('university_status', RegisterEnums::universityStatuses(), (string) study114_old($old, 'university_status', 'graduated')) ?>
  </div>

  <div class="form-group">
    <span class="form-label">경력구간</span>
    <?= study114_chip_group('career_year_band', RegisterEnums::careerYearBands(), (string) study114_old($old, 'career_year_band', 'y7_10')) ?>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">강의장소</span>
    <?= study114_chip_group(
        'lesson_places',
        RegisterEnums::tutorPlaces(),
        study114_old($old, 'lesson_places', ['student_home_visit']) ?: ['student_home_visit'],
        true
    ) ?>
  </div>

  <div class="form-group">
    <span class="form-label">강의스타일 배지</span>
    <?= study114_chip_group(
        'teaching_style_badges',
        RegisterEnums::teachingStyles(),
        study114_old($old, 'teaching_style_badges', ['concept_focus']) ?: ['concept_focus'],
        true
    ) ?>
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">기본등록 완료</button>
  </div>
</form>
