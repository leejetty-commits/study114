<?php if (!empty($errors)): ?>
  <ul class="form-errors" role="alert">
    <?php foreach ($errors as $error): ?>
      <li><?= study114_e($error) ?></li>
    <?php endforeach; ?>
  </ul>
<?php endif; ?>
