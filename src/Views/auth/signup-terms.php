<h1 class="auth-heading">약관 동의</h1>
<p class="auth-subheading mb-8">[임시] SSOT 2장 §3.2 — 법무 확정 전 변경 가능</p>

<?php
$steps = ['약관', '회원구분', '가입', '기본등록', '완료'];
$current = 1;
require __DIR__ . '/../partials/step-indicator.php';
require __DIR__ . '/../partials/errors.php';
?>

<form method="post" action="/auth/signup/terms" class="mt-8">
  <div class="form-group">
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="service" value="1" required>
      <span class="form-check__label">서비스 이용약관 (필수)</span>
    </label>
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="privacy" value="1" required>
      <span class="form-check__label">개인정보 수집·이용 (필수)</span>
    </label>
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="location" value="1" required>
      <span class="form-check__label">위치기반 서비스 이용약관 (필수)</span>
    </label>
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="marketing" value="1">
      <span class="form-check__label">마케팅 정보 수신 (선택)</span>
    </label>
  </div>
  <button type="submit" class="btn btn--primary btn--block">동의하고 계속</button>
</form>
