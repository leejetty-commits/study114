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

<form method="post" action="/auth/signup/form" class="mt-8" id="signup-form-php">
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
  <div class="form-group form-address">
    <span class="form-label form-label--required">주소</span>
    <p class="form-hint">주소 검색으로 입력하세요. 지번을 골라도 도로명 주소로 저장됩니다.</p>
    <div class="form-address__zip-row">
      <input class="form-input" type="text" id="signup-address-zip" name="address_zip" value="<?= study114_e($old['address_zip'] ?? '') ?>" placeholder="우편번호" readonly required>
      <button type="button" class="btn btn--secondary" id="signup-search-address">주소 검색</button>
    </div>
    <input class="form-input" type="text" id="signup-address" name="address" value="<?= study114_e($old['address'] ?? '') ?>" placeholder="도로명 주소" readonly required>
    <input class="form-input" type="text" id="signup-address-line2" name="address_line2" value="<?= study114_e($old['address_line2'] ?? '') ?>" placeholder="상세주소 (동·호수 등)">
  </div>
  <div class="form-consent-group">
    <p class="auth-section-title">수신 동의</p>
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="sms_consent" value="1"<?= !empty($old['sms_consent']) ? ' checked' : '' ?>>
      <span class="form-check__label">문자 수신 동의 (선택)</span>
    </label>
    <label class="form-check">
      <input class="form-check__input" type="checkbox" name="email_consent" value="1" required<?= !empty($old['email_consent']) ? ' checked' : '' ?>>
      <span class="form-check__label">이메일 수신 동의 (필수)</span>
    </label>
    <p class="form-consent-note">아이디 찾기·비밀번호 재설정 안내 메일을 위해 이메일 수신 동의가 필요합니다.</p>
  </div>
  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">가입하기</button>
    <a href="/auth/signup/role" class="btn btn--secondary btn--block">이전</a>
  </div>
</form>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
(function () {
  var btn = document.getElementById('signup-search-address');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var Postcode = (window.kakao && window.kakao.Postcode) || (window.daum && window.daum.Postcode);
    if (!Postcode) {
      alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    new Postcode({
      oncomplete: function (data) {
        var road = data.roadAddress || data.autoRoadAddress || data.address || '';
        document.getElementById('signup-address-zip').value = data.zonecode || '';
        document.getElementById('signup-address').value = road;
        document.getElementById('signup-address-line2').focus();
      }
    }).open({ popupTitle: '주소 검색' });
  });
})();
</script>
