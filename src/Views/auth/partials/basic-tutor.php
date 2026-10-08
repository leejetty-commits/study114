<?php
/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
/** 과외 단위(광역시 / 도의 시·군). BasicRegisterService::listTutorUnits */
$tutorUnits = is_array($tutorUnits ?? null) ? $tutorUnits : [];
$oldRegion = (string) study114_old($old, 'region_id', '');
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="tutor">
  <p class="auth-section-title">기본등록 · 과외지역 seed (10-6)</p>
  <p class="form-note">표시명 · 과외지역 1 · 주력과목 1. 행정동/단지 선택 없음.</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
    <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="<?= study114_e(study114_old($old, 'tutor_display_name', '')) ?>" required>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="region_id">과외지역 1번</label>
    <select class="form-input" id="region_id" name="region_id" required>
      <option value="">선택</option>
      <?php foreach ($tutorUnits as $unit): $uid = (string) ($unit['id'] ?? ''); ?>
        <option value="<?= study114_e($uid) ?>" <?= $oldRegion === $uid ? 'selected' : '' ?>><?= study114_e((string) ($unit['label'] ?? '')) ?></option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
    <input class="form-input" id="main_subject_note" name="main_subject_note" value="<?= study114_e(study114_old($old, 'main_subject_note', '수학')) ?>" required>
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">draft 저장 · 다음</button>
  </div>
</form>
