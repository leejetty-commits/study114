<?php
$labels = study114_role_labels();
$user = is_array($user ?? null) ? $user : [];
$roleLabel = $labels[$role] ?? $role;
$authCfg = study114_config('auth');
$homeUi = rtrim((string) ($authCfg['home_ui'] ?? ''), '/');
$authUi = rtrim((string) ($authCfg['auth_ui'] ?? ''), '/');
?>
<h1 class="auth-heading">가입 · 기본등록 완료</h1>
<p class="auth-subheading mb-8">
  계정과 <strong>공개 전 draft</strong>가 만들어졌습니다.<br>
  아직 검색·리스트에 공개되지 않습니다. 검색/공개 항목은 <strong>상세등록</strong>에서 완성합니다.
</p>

<?php
$steps = ['약관', '가입', '역할', '기본등록', '완료'];
$current = 5;
require __DIR__ . '/../partials/step-indicator.php';
?>

<p class="mb-6">이메일 <strong><?= study114_e($user['email'] ?? '') ?></strong> · <?= study114_e($roleLabel) ?></p>

<?php if (!empty($basic_register) && is_array($basic_register)): ?>
  <p class="form-note mb-6" role="status">
    draft 저장 완료 —
    <?php if ($basic_register['kind'] === 'student'): ?>
      학생 ID <?= (int) $basic_register['id'] ?> (exposure_status=draft)
    <?php elseif ($basic_register['kind'] === 'study_room'): ?>
      공부방 ID <?= (int) $basic_register['id'] ?> (profile_status=draft)
    <?php else: ?>
      과외쌤 ID <?= (int) $basic_register['id'] ?> (profile_status=draft)
    <?php endif; ?>
  </p>
<?php endif; ?>

<div class="mypage-info-box mb-6">
  <strong>다음 · 상세등록</strong>
  <p class="form-note">상세등록을 마친 뒤 일반 리스트/검색에 등록할 수 있습니다. Prime / Pick / 접근권은 그다음 구매 단계입니다.</p>
</div>

<div class="actions-stack">
  <a href="<?= study114_e($homeUi) ?>/" class="btn btn--primary btn--block">메인 홈 · 상세등록 이어하기</a>
  <a href="<?= study114_e($authUi) ?>#/login" class="btn btn--secondary btn--block">로그인하기</a>
</div>

<form method="post" action="/auth/logout" class="mt-6">
  <button type="submit" class="btn btn--secondary btn--block">로그아웃</button>
</form>
