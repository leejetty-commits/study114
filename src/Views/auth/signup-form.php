<?php
$old = is_array($old ?? null) ? $old : [];
$gender = $old['gender'] ?? 'female';
$genderLabels = [
    'student'    => '학부모 성별',
    'study_room' => '원장 성별',
    'tutor'      => '과외쌤 성별',
];
$genderLabel = $genderLabels[$role ?? ''] ?? '성별';
?>
<h1 class="auth-heading">회원가입</h1>
<p class="auth-subheading mb-6">공통 회원 정보를 입력해 주세요.</p>

<?php
$steps = ['약관', '회원구분', '가입', '기본등록', '완료'];
$current = 3;
require __DIR__ . '/../partials/step-indicator.php';
require __DIR__ . '/../partials/role-badge.php';
require __DIR__ . '/../partials/errors.php';
?>

<form method="post" action="/auth/signup/form" class="mt-8">
  <div class="form-group">
    <label class="form-label form-label--required" for="signup-email">이메일(ID)</label>
    <input class="form-input" type="email" id="signup-email" name="email" value="<?= study114_e($old['email'] ?? '') ?>" autocomplete="username" required>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label form-label--required" for="signup-password">비밀번호</label>
      <input class="form-input" type="password" id="signup-password" name="password" autocomplete="new-password" required minlength="8">
    </div>
    <div class="form-group">
      <label class="form-label form-label--required" for="signup-password-confirm">비밀번호 확인</label>
      <input class="form-input" type="password" id="signup-password-confirm" name="password_confirm" autocomplete="new-password" required>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label form-label--required" for="signup-name">이름</label>
    <input class="form-input" type="text" id="signup-name" name="name" value="<?= study114_e($old['name'] ?? '') ?>" autocomplete="name" required>
  </div>
  <div class="form-group">
    <span class="form-label form-label--required"><?= study114_e($genderLabel) ?></span>
    <p class="form-note">매칭·검색 needs에 사용 · <span class="field-db-name">user_profiles.gender</span></p>
    <div class="form-radio-group">
      <label class="form-radio">
        <input class="form-radio__input" type="radio" name="gender" value="male"<?= $gender === 'male' ? ' checked' : '' ?> required>
        <span class="form-radio__label">남</span>
      </label>
      <label class="form-radio">
        <input class="form-radio__input" type="radio" name="gender" value="female"<?= $gender === 'female' ? ' checked' : '' ?>>
        <span class="form-radio__label">여</span>
      </label>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label form-label--required" for="signup-phone">휴대폰</label>
    <input class="form-input" type="tel" id="signup-phone" name="phone" value="<?= study114_e($old['phone'] ?? '') ?>" autocomplete="tel" required>
  </div>
  <div class="form-group">
    <label class="form-label form-label--required" for="signup-address">주소</label>
    <input class="form-input" type="text" id="signup-address" name="address" value="<?= study114_e($old['address'] ?? '') ?>" required>
  </div>
  <div class="form-group">
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="sms_consent" value="1"<?= !empty($old['sms_consent']) ? ' checked' : '' ?>>
      <span class="form-check__label">문자 수신 동의</span>
    </label>
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="email_consent" value="1"<?= !empty($old['email_consent']) ? ' checked' : '' ?>>
      <span class="form-check__label">이메일 수신 동의</span>
    </label>
  </div>
  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">가입하기</button>
    <a href="/auth/signup/role" class="btn btn--secondary btn--block">이전</a>
  </div>
</form>
