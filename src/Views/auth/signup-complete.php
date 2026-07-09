<?php
$labels = study114_role_labels();
$user = is_array($user ?? null) ? $user : [];
$roleLabel = $labels[$role] ?? $role;
$authCfg = study114_config('auth');
$homeUi = rtrim((string) ($authCfg['home_ui'] ?? ''), '/');
$authUi = rtrim((string) ($authCfg['auth_ui'] ?? ''), '/');
?>
<h1 class="auth-heading">가입 완료</h1>
<p class="auth-subheading mb-8">환영합니다, <?= study114_e($user['name'] ?? '') ?>님!</p>

<?php
$steps = ['약관', '회원구분', '가입', '기본등록', '완료'];
$current = 5;
require __DIR__ . '/../partials/step-indicator.php';
?>

<p class="mb-6">이메일 <strong><?= study114_e($user['email'] ?? '') ?></strong> · <?= study114_e($roleLabel) ?></p>

<?php if (!empty($basic_register) && is_array($basic_register)): ?>
  <p class="form-note mb-6" role="status">
    기본등록 저장 완료 —
    <?php if ($basic_register['kind'] === 'student'): ?>
      학생 ID <?= (int) $basic_register['id'] ?> (exposure_status=draft)
    <?php elseif ($basic_register['kind'] === 'study_room'): ?>
      공부방 ID <?= (int) $basic_register['id'] ?> (profile_status=draft)
    <?php else: ?>
      과외쌤 ID <?= (int) $basic_register['id'] ?> (profile_status=draft)
    <?php endif; ?>
  </p>
<?php endif; ?>

<div class="actions-stack">
  <a href="<?= study114_e($homeUi) ?>/" class="btn btn--primary btn--block">메인 홈으로 (home-ui)</a>
  <a href="<?= study114_e($authUi) ?>#/signup/basic" class="btn btn--secondary btn--block"><?= study114_e($roleLabel) ?> 상세등록 (auth-ui 프리뷰)</a>
</div>

<form method="post" action="/auth/logout" class="mt-6">
  <button type="submit" class="btn btn--secondary btn--block">로그아웃</button>
</form>
