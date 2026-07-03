<?php
$old = is_array($old ?? null) ? $old : [];
?>
<h1 class="auth-heading">로그인</h1>
<p class="auth-subheading mb-8">우리 동네 공부방·과외 정보, 우동공과에서 확인하세요.</p>

<?php require __DIR__ . '/../partials/errors.php'; ?>

<form method="post" action="/auth/login">
  <div class="form-group">
    <label class="form-label form-label--required" for="login-email">이메일(ID)</label>
    <input class="form-input" type="email" id="login-email" name="email" value="<?= study114_e($old['email'] ?? '') ?>" autocomplete="email" required>
  </div>
  <div class="form-group">
    <label class="form-label form-label--required" for="login-password">비밀번호</label>
    <input class="form-input" type="password" id="login-password" name="password" autocomplete="current-password" required>
  </div>
  <div class="form-group">
    <label class="form-check form-check--inline">
      <input class="form-check__input" type="checkbox" name="remember" value="1">
      <span class="form-check__label">로그인 상태 유지</span>
    </label>
  </div>
  <button type="submit" class="btn btn--primary btn--block">로그인</button>
</form>

<div class="auth-links mt-6">
  <a href="/auth/find-id">아이디 찾기</a>
  <span class="auth-links__sep">|</span>
  <a href="/auth/find-password">비밀번호 찾기</a>
</div>

<p class="text-center mt-8" style="font-size: var(--text-sm); color: var(--gray-500);">
  아직 회원이 아니신가요?
  <a href="/auth/signup/terms" style="color: var(--link-color); font-weight: 600;">회원가입</a>
</p>

<p class="form-note mt-6">dev 시드 계정: <code>guardian1@dev.local</code> / <code>password</code></p>
