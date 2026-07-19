<?php
/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];

/** 시(도) 단위 옵션 — 라벨 첫 토큰 기준 중복 제거 */
$cities = [];
foreach ($regions as $r) {
    $label = trim((string) ($r['label'] ?? ''));
    $sido = $label !== '' ? explode(' ', $label)[0] : '';
    if ($sido === '' || isset($cities[$sido])) {
        continue;
    }
    $cities[$sido] = [
        'id' => (string) ($r['id'] ?? ''),
        'label' => $sido,
    ];
}
$oldRegion = (string) study114_old($old, 'region_id', '');
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="tutor">
  <p class="auth-section-title">기본등록 · 활동 시 seed (10-6)</p>
  <p class="form-note">표시명 · 활동 시 1 · 주력과목 1. 행정동/단지 선택 없음.</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="tutor_display_name">표시명</label>
    <input class="form-input" id="tutor_display_name" name="tutor_display_name" value="<?= study114_e(study114_old($old, 'tutor_display_name', '')) ?>" required>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="region_id">활동 시 1번</label>
    <select class="form-input" id="region_id" name="region_id" required>
      <option value="">선택</option>
      <?php foreach ($cities as $city): ?>
        <option value="<?= study114_e($city['id']) ?>" <?= $oldRegion === $city['id'] ? 'selected' : '' ?>><?= study114_e($city['label']) ?></option>
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
