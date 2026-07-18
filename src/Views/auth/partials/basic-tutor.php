<?php
/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="tutor">
  <p class="auth-section-title">기본등록 · draft seed (14장)</p>
  <p class="form-note">표시명 · 활동지역 1 · 주력과목 1. 나머지는 상세등록입니다.</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
    <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="<?= study114_e(study114_old($old, 'tutor_display_name', '')) ?>" required>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="region_id">활동 지역 1번</label>
    <select class="form-input" id="region_id" name="region_id" required>
      <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '')) ?>
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
