<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= study114_e($title ?? '우동공과 — 인증') ?></title>
  <link rel="icon" type="image/png" href="/assets/brand/logo-wordmark.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/auth/base.css">
  <link rel="stylesheet" href="/assets/css/auth/theme-v1.css">
  <link rel="stylesheet" href="/assets/css/auth/mvc.css">
</head>
<body data-theme="v1">
  <div class="auth-shell">
    <header class="auth-shell__header">
      <a href="/auth/login" class="auth-shell__logo" aria-label="우동공과 홈">
        <img class="auth-shell__logo-img" src="/assets/brand/logo-wordmark.png" alt="우동공과">
      </a>
    </header>
    <main class="auth-shell__card<?= !empty($wide) ? ' auth-shell__card--wide' : '' ?>">
      <?= $content ?>
    </main>
    <footer class="auth-shell__footer">
      <p>study114 MVC · 2·14장 SSOT</p>
    </footer>
  </div>
</body>
</html>
