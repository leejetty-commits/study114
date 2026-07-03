<?php
use Study114\Auth\RegisterEnums;

/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
$profileGenderDefault = (string) study114_old($old, 'gender', $profileGender ?? 'male');
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="study_room">
  <p class="auth-section-title">검색 핵심축 (14장 §4-2)</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="study_room_name">공부방명</label>
    <input class="form-input" id="study_room_name" name="study_room_name" value="<?= study114_e(study114_old($old, 'study_room_name', '대치 우등생 공부방')) ?>" required>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">원장 성별</span>
    <p class="form-note">매칭·검색 needs · <span class="field-db-name">user_profiles.gender</span></p>
    <?= study114_chip_group('gender', RegisterEnums::personalGenders(), $profileGenderDefault) ?>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="region_id">대표지역</label>
    <select class="form-input" id="region_id" name="region_id" required>
      <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '1')) ?>
    </select>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="main_subject_note">주력과목</label>
    <input class="form-input" id="main_subject_note" name="main_subject_note" value="<?= study114_e(study114_old($old, 'main_subject_note', '수학')) ?>" required>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">대상 학교급</span>
    <?= study114_chip_group(
        'school_levels',
        RegisterEnums::schoolLevels(),
        study114_old($old, 'school_levels', ['middle']) ?: ['middle'],
        true
    ) ?>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="price_amount">대표 가격 (월)</label>
    <input class="form-input" type="number" id="price_amount" name="price_amount" value="<?= study114_e(study114_old($old, 'price_amount', 420000)) ?>" required>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">수업장소</span>
    <?= study114_chip_group('lesson_place_type', RegisterEnums::studyRoomPlaces(), (string) study114_old($old, 'lesson_place_type', 'study_room')) ?>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">수업운영형태</span>
    <?= study114_chip_group('lesson_operation_type', RegisterEnums::lessonOperations(), (string) study114_old($old, 'lesson_operation_type', 'group_by_time_slot')) ?>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">타임별 원생수</span>
    <?= study114_chip_group('capacity_per_time', RegisterEnums::capacityPerTime(), (string) study114_old($old, 'capacity_per_time', 'one_to_four')) ?>
  </div>

  <div class="form-group">
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="education_office_registered" value="1"<?= study114_old($old, 'education_office_registered', true) ? ' checked' : '' ?>>
      <span class="form-check__label">교육청 등록</span>
    </label>
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">기본등록 완료</button>
  </div>
</form>
