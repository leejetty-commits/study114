<?php
use Study114\Auth\RegisterEnums;

/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
$complexes = is_array($complexes ?? null) ? $complexes : [];
$hope = (string) study114_old($old, 'preferred_lesson_type', 'tutor');
$basis = (string) study114_old($old, 'region_basis', 'dong');
?>
<form method="post" action="/auth/signup/basic" class="basic-register" data-basic-form="student">
  <input type="hidden" name="role_ui" value="student">
  <p class="auth-section-title">기본등록 · 지역 seed (10-6)</p>
  <p class="form-note">가입 기본주소와 탐색용 지역등록은 분리됩니다. 지역 1번은 필수입니다.</p>

  <div class="form-group">
    <span class="form-label form-label--required">무엇을 찾을까요?</span>
    <?= study114_chip_group('preferred_lesson_type', RegisterEnums::preferredLessonTypes(), $hope) ?>
  </div>

  <div class="form-group" data-student-studyroom-block <?= $hope === 'study_room' ? '' : 'hidden' ?>>
    <span class="form-label form-label--required">지역 기준</span>
    <?= study114_chip_group('region_basis', ['dong' => '행정동 기준', 'complex' => '아파트단지 기준'], $basis) ?>
    <div class="form-group" data-basis-panel="dong" <?= $basis === 'complex' ? 'hidden' : '' ?>>
      <label class="form-label form-label--required" for="region_id">행정동 1번</label>
      <select class="form-input" id="region_id" name="region_id">
        <option value="">선택</option>
        <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '')) ?>
      </select>
    </div>
    <div class="form-group" data-basis-panel="complex" <?= $basis === 'complex' ? '' : 'hidden' ?>>
      <label class="form-label form-label--required" for="complex_id">아파트단지 1번</label>
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
  </div>

  <div class="form-group" data-student-tutor-block <?= $hope === 'tutor' ? '' : 'hidden' ?>>
    <label class="form-label form-label--required" for="region_id_city">활동 시 1번</label>
    <select class="form-input" id="region_id_city" name="region_id" <?= $hope === 'tutor' ? '' : 'disabled' ?>>
      <option value="">선택</option>
      <?php
        $cities = [];
        foreach ($regions as $r) {
            $label = trim((string) ($r['label'] ?? ''));
            $sido = $label !== '' ? explode(' ', $label)[0] : '';
            if ($sido === '' || isset($cities[$sido])) {
                continue;
            }
            $cities[$sido] = (string) ($r['id'] ?? '');
        }
        $oldRegion = (string) study114_old($old, 'region_id', '');
        foreach ($cities as $sido => $cid):
      ?>
        <option value="<?= study114_e($cid) ?>" <?= $oldRegion === $cid ? 'selected' : '' ?>><?= study114_e($sido) ?></option>
      <?php endforeach; ?>
    </select>
    <p class="form-note">시 단위만 · 구/동/단지 선택 없음</p>
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">지역등록 · draft 저장</button>
  </div>
</form>
<script>
(function () {
  var form = document.querySelector('[data-basic-form="student"]');
  if (!form) return;
  function sync() {
    var hope = (form.querySelector('input[name="preferred_lesson_type"]:checked') || {}).value || 'tutor';
    var study = form.querySelector('[data-student-studyroom-block]');
    var tutor = form.querySelector('[data-student-tutor-block]');
    if (study) study.hidden = hope !== 'study_room';
    if (tutor) tutor.hidden = hope !== 'tutor';
    form.querySelectorAll('[data-student-studyroom-block] select, [data-student-studyroom-block] input').forEach(function (el) {
      el.disabled = hope !== 'study_room';
    });
    form.querySelectorAll('[data-student-tutor-block] select').forEach(function (el) {
      el.disabled = hope !== 'tutor';
    });
    var basis = (form.querySelector('input[name="region_basis"]:checked') || {}).value || 'dong';
    form.querySelectorAll('[data-basis-panel]').forEach(function (panel) {
      var on = panel.getAttribute('data-basis-panel') === basis && hope === 'study_room';
      panel.hidden = !on;
      panel.querySelectorAll('select,input').forEach(function (el) { el.disabled = !on; });
    });
  }
  form.querySelectorAll('input[name="preferred_lesson_type"], input[name="region_basis"]').forEach(function (el) {
    el.addEventListener('change', sync);
  });
  sync();
})();
</script>
