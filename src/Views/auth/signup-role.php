<?php
$labels = study114_role_labels();
$descriptions = study114_role_descriptions();
$icons = study114_role_icons();
$roles = ['student', 'study_room', 'tutor'];
?>
<h1 class="auth-heading">회원 구분 선택</h1>
<p class="auth-subheading mb-8">가입 후에도 공부방·과외쌤 역할을 추가할 수 있어요.</p>

<?php
$steps = ['약관', '회원구분', '가입', '기본등록', '완료'];
$current = 2;
require __DIR__ . '/../partials/step-indicator.php';
require __DIR__ . '/../partials/errors.php';
?>

<form method="post" action="/auth/signup/role" class="mt-8">
  <div class="role-grid mb-8">
    <?php foreach ($roles as $roleKey): ?>
      <label class="role-card<?= ($selected ?? '') === $roleKey ? ' is-selected' : '' ?>">
        <input type="radio" name="role" value="<?= study114_e($roleKey) ?>" class="role-card__input"<?= ($selected ?? '') === $roleKey ? ' checked' : '' ?> required>
        <span class="role-card__icon"><?= $icons[$roleKey] ?></span>
        <span class="role-card__body">
          <span class="role-card__title"><?= study114_e($labels[$roleKey]) ?></span>
          <span class="role-card__desc"><?= study114_e($descriptions[$roleKey]) ?></span>
        </span>
      </label>
    <?php endforeach; ?>
  </div>
  <button type="submit" class="btn btn--primary btn--block">다음</button>
</form>
