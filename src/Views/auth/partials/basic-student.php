<?php
use Study114\Auth\RegisterEnums;

/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$regions = is_array($regions ?? null) ? $regions : [];
$complexes = is_array($complexes ?? null) ? $complexes : [];
$hope = (string) study114_old($old, 'preferred_lesson_type', 'tutor');
$basis = (string) study114_old($old, 'region_basis', 'dong');
$schoolLevel = (string) study114_old($old, 'school_level', '');
$lessonFormat = (string) study114_old($old, 'lesson_format', '');
$countGroup = $lessonFormat === 'one_on_one'
    ? 'solo'
    : (string) study114_old($old, 'preferred_student_count_group', '');
$subjects = ['국어', '영어', '수학', '과학', '사회', '국영수', '국영수사과', '과학탐구', '사회탐구', '물리', '화학', '생명과학', '지구과학', '한국사', '한문', '일본어', '중국어', '독일어', '프랑스어', '스페인어', '코딩', '논술', '예체능', '기타'];
$subjectSelected = (string) study114_old($old, 'subject_names', '');
?>
<form method="post" action="/auth/signup/basic" class="basic-register student-basic" data-basic-form="student">
  <input type="hidden" name="role_ui" value="student">
  <div class="student-basic__field">
    <label class="form-label" for="public_display_name">표시명</label>
    <input class="form-input" id="public_display_name" name="public_display_name" value="<?= study114_e((string) study114_old($old, 'public_display_name', '')) ?>" maxlength="40" autocomplete="nickname">
    <p class="form-hint">Basic 카드에 보이는 이름입니다.</p>
  </div>

  <div class="student-basic__field">
    <span class="form-label">학교급 / 학년</span>
    <?= study114_chip_group('school_level', RegisterEnums::schoolLevels(), $schoolLevel, false, false) ?>
    <div class="student-basic__sub">
      <label class="form-label" for="grade_level">학년</label>
      <input class="form-input" id="grade_level" name="grade_level" value="<?= study114_e((string) study114_old($old, 'grade_level', '')) ?>" maxlength="20" placeholder="예: 중2">
    </div>
    <p class="form-hint">학교급을 고르고, 학년은 중2처럼 적습니다.</p>
  </div>

  <div class="student-basic__field">
    <span class="form-label form-label--required">희망 유형</span>
    <?= study114_chip_group('preferred_lesson_type', [
      ['value' => 'tutor', 'label' => '과외쌤 찾기'],
      ['value' => 'study_room', 'label' => '공부방 찾기'],
    ], $hope) ?>
    <p class="form-hint">과외쌤과 공부방 중 먼저 찾을 쪽을 고릅니다.</p>
  </div>

  <div class="student-basic__field" data-student-studyroom-block <?= $hope === 'study_room' ? '' : 'hidden' ?>>
    <span class="form-label form-label--required">희망지역</span>
    <?= study114_chip_group('region_basis', [
      ['value' => 'dong', 'label' => '행정동 기준'],
      ['value' => 'complex', 'label' => '아파트단지 기준'],
    ], $basis) ?>
    <div class="student-basic__sub" data-basis-panel="dong" <?= $basis === 'complex' ? 'hidden' : '' ?>>
      <label class="form-label form-label--required" for="region_id">행정동</label>
      <select class="form-input" id="region_id" name="region_id">
        <option value="">선택</option>
        <?= study114_select_options($regions, (string) study114_old($old, 'region_id', '')) ?>
      </select>
    </div>
    <div class="student-basic__sub" data-basis-panel="complex" <?= $basis === 'complex' ? '' : 'hidden' ?>>
      <label class="form-label form-label--required" for="complex_id">아파트단지</label>
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
    <p class="form-hint">공부방을 찾을 행정동 또는 단지를 고릅니다.</p>
  </div>

  <div class="student-basic__field" data-student-tutor-block <?= $hope === 'tutor' ? '' : 'hidden' ?>>
    <label class="form-label form-label--required" for="region_id_city">희망지역</label>
    <select class="form-input" id="region_id_city" name="region_id" <?= $hope === 'tutor' ? '' : 'disabled' ?>>
      <option value="">시·도 선택</option>
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
    <p class="form-hint">과외쌤을 찾을 시·도를 고릅니다.</p>
  </div>

  <div class="student-basic__field">
    <label class="form-label" for="subject_names">희망과목</label>
    <select class="form-input" id="subject_names" name="subject_names">
      <option value="">과목 선택</option>
      <?php foreach ($subjects as $subject): ?>
        <option value="<?= study114_e($subject) ?>" <?= $subjectSelected === $subject ? 'selected' : '' ?>><?= study114_e($subject) ?></option>
      <?php endforeach; ?>
    </select>
    <p class="form-hint">Basic 카드에 먼저 보일 과목입니다.</p>
  </div>

  <div class="student-basic__field">
    <span class="form-label">수업형태</span>
    <?= study114_chip_group('lesson_format', RegisterEnums::lessonFormats(), $lessonFormat, false, false) ?>
    <p class="form-hint">단독과외와 그룹과외 중 고릅니다. 단독과외는 수업인원이 단독으로 저장됩니다.</p>
  </div>

  <div class="student-basic__field">
    <span class="form-label">수업인원</span>
    <?= study114_chip_group('preferred_student_count_group', RegisterEnums::studentCountGroups(), $countGroup, false, false) ?>
    <p class="form-hint">함께 수업할 인원입니다.</p>
  </div>

  <div class="student-basic__field" data-student-tutor-budget <?= $hope === 'tutor' ? '' : 'hidden' ?>>
    <label class="form-label" for="preferred_fee_amount">예산</label>
    <input class="form-input" id="preferred_fee_amount" name="preferred_fee_amount" type="number" min="0" step="1" inputmode="numeric" value="<?= study114_e((string) study114_old($old, 'preferred_fee_amount', '')) ?>" <?= $hope === 'tutor' ? '' : 'disabled' ?>>
    <p class="form-hint">과외쌤 수업의 월 예산입니다.</p>
  </div>

  <div class="student-basic__field" data-student-studyroom-budget <?= $hope === 'study_room' ? '' : 'hidden' ?>>
    <label class="form-label" for="preferred_studyroom_fee_amount">예산</label>
    <input class="form-input" id="preferred_studyroom_fee_amount" name="preferred_studyroom_fee_amount" type="number" min="0" step="1" inputmode="numeric" value="<?= study114_e((string) study114_old($old, 'preferred_studyroom_fee_amount', '')) ?>" <?= $hope === 'study_room' ? '' : 'disabled' ?>>
    <p class="form-hint">공부방 수업의 월 예산입니다.</p>
  </div>

  <div class="student-basic__field">
    <label class="form-label" for="request_summary">한 줄 요청문</label>
    <input class="form-input" id="request_summary" name="request_summary" maxlength="200" value="<?= study114_e((string) study114_old($old, 'request_summary', '')) ?>">
    <p class="form-hint">카드에 한 줄로 보일 요청입니다.</p>
  </div>

  <div class="student-basic__actions">
    <button type="submit" class="btn btn--primary btn--block">다음</button>
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
    var tutorBudget = form.querySelector('[data-student-tutor-budget]');
    var studyBudget = form.querySelector('[data-student-studyroom-budget]');
    if (tutorBudget) tutorBudget.hidden = hope !== 'tutor';
    if (studyBudget) studyBudget.hidden = hope !== 'study_room';
    form.querySelectorAll('[data-student-tutor-budget] input').forEach(function (el) {
      el.disabled = hope !== 'tutor';
    });
    form.querySelectorAll('[data-student-studyroom-budget] input').forEach(function (el) {
      el.disabled = hope !== 'study_room';
    });
    var format = (form.querySelector('input[name="lesson_format"]:checked') || {}).value || '';
    var solo = format === 'one_on_one';
    form.querySelectorAll('input[name="preferred_student_count_group"]').forEach(function (el) {
      el.disabled = solo && el.value !== 'solo';
      if (solo && el.value === 'solo') el.checked = true;
    });
    var basis = (form.querySelector('input[name="region_basis"]:checked') || {}).value || 'dong';
    form.querySelectorAll('[data-basis-panel]').forEach(function (panel) {
      var on = panel.getAttribute('data-basis-panel') === basis && hope === 'study_room';
      panel.hidden = !on;
      panel.querySelectorAll('select,input').forEach(function (el) { el.disabled = !on; });
    });
  }
  form.querySelectorAll('input[name="preferred_lesson_type"], input[name="region_basis"], input[name="lesson_format"]').forEach(function (el) {
    el.addEventListener('change', sync);
  });
  sync();
})();
</script>
