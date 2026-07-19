<?php
/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
$complexes = is_array($complexes ?? null) ? $complexes : [];
$basis = (string) study114_old($old, 'region_basis', 'dong');
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="study_room">
  <p class="auth-section-title">기본등록 · 노출지역 seed (10-6)</p>
  <p class="form-note">공부방명 · 노출지역 1. 가입 기본주소와 분리. 나머지는 상세등록입니다.</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="study_room_name">공부방명</label>
    <input class="form-input" id="study_room_name" name="study_room_name" value="<?= study114_e(study114_old($old, 'study_room_name', '')) ?>" required>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">노출지역 기준</span>
    <?= study114_chip_group('region_basis', ['dong' => '행정동 기준', 'complex' => '아파트단지 기준'], $basis) ?>
  </div>

  <div class="form-group" data-basis-panel="dong" <?= $basis === 'complex' ? 'hidden' : '' ?>>
    <label class="form-label form-label--required" for="region_id">노출 행정동 1번</label>
    <select class="form-input" id="region_id" name="region_id">
      <option value="">선택</option>
      <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '')) ?>
    </select>
  </div>

  <div class="form-group" data-basis-panel="complex" <?= $basis === 'complex' ? '' : 'hidden' ?>>
    <label class="form-label form-label--required" for="complex_id">노출 아파트단지 1번</label>
    <select class="form-input" id="complex_id" name="complex_id">
      <option value="">선택</option>
      <?php foreach ($complexes as $c): ?>
        <?php
          $cid = (string) ($c['id'] ?? '');
          $clabel = (string) ($c['label'] ?? $c['name'] ?? '');
          $caddr = (string) ($c['address'] ?? '');
          $sel = (string) study114_old($old, 'complex_id', '') === $cid ? 'selected' : '';
        ?>
        <option value="<?= study114_e($cid) ?>" <?= $sel ?>><?= study114_e($clabel . ($caddr ? " — {$caddr}" : '')) ?></option>
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
