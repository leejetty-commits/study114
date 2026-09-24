<?php
$labels = study114_role_labels();
$user = is_array($user ?? null) ? $user : [];
$old = is_array($old ?? null) ? $old : [];
$isStudent = ($role ?? '') === 'student';
?>
<?php if ($isStudent): ?>
<div class="student-basic-screen">
  <?php
  $steps = ['약관', '회원구분', '가입', '기본등록', '완료'];
  $current = 4;
  require __DIR__ . '/../partials/step-indicator.php';
  ?>
  <h1 class="auth-heading">학생 기본정보</h1>
  <p class="auth-subheading">학생 Basic 카드에 먼저 보일 핵심 정보를 입력합니다.</p>
  <?php
  require __DIR__ . '/../partials/errors.php';
  require __DIR__ . '/partials/basic-student.php';
  ?>
</div>
<?php else: ?>
<h1 class="auth-heading">기본등록</h1>
<p class="auth-subheading mb-6">검색·비교에 필요한 핵심 정보</p>

<?php
$steps = ['약관', '회원구분', '가입', '기본등록', '완료'];
$current = 4;
require __DIR__ . '/../partials/step-indicator.php';
require __DIR__ . '/../partials/role-badge.php';
require __DIR__ . '/../partials/errors.php';
?>

<p class="form-note mb-6">
  <strong><?= study114_e($user['email'] ?? '') ?></strong> · <?= study114_e($labels[$role] ?? $role) ?>
</p>

<?php
if ($role === 'study_room') {
    require __DIR__ . '/partials/basic-study-room.php';
} else {
    require __DIR__ . '/partials/basic-tutor.php';
}
?>
<?php endif; ?>
