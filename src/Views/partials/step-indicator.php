<?php
$steps = $steps ?? [];
$current = $current ?? 1;
?>
<ol class="step-indicator" aria-label="가입 단계">
  <?php foreach ($steps as $i => $label): ?>
    <?php $n = $i + 1; ?>
    <li class="step-indicator__item<?= $n <= $current ? ' is-active' : '' ?><?= $n === $current ? ' is-current' : '' ?>">
      <span class="step-indicator__num"><?= $n ?></span>
      <span class="step-indicator__label"><?= study114_e($label) ?></span>
    </li>
  <?php endforeach; ?>
</ol>
