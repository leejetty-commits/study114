<?php
use Study114\Auth\RegisterEnums;

/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
?>
<form method="post" action="/auth/signup/basic" class="basic-register" data-basic-form="student">
  <input type="hidden" name="role_ui" value="student">
  <p class="auth-section-title">기본등록 · draft seed (14장)</p>
  <p class="form-note">검색/공개 항목은 상세등록에서 완성합니다.</p>

  <div class="form-group">
    <span class="form-label form-label--required">희망 유형</span>
    <?= study114_chip_group('preferred_lesson_type', RegisterEnums::preferredLessonTypes(), (string) study114_old($old, 'preferred_lesson_type', 'tutor')) ?>
  </div>

  <div class="form-group">
    <label class="form-label" for="region_id">1차 희망지역 seed (선택)</label>
    <select class="form-input" id="region_id" name="region_id">
      <option value="">선택 안 함</option>
      <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '')) ?>
    </select>
    <p class="form-note">축별 희망지역 1~3은 상세등록에서 받습니다.</p>
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">draft 저장 · 다음</button>
  </div>
</form>
