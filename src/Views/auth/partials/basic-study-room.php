<?php
/** @var array<string, mixed>|null $old */
$old = is_array($old ?? null) ? $old : [];
$profileGender = (string) ($profileGender ?? study114_old($old, 'gender', ''));
?>
<form method="post" action="/auth/signup/basic" class="basic-register">
  <input type="hidden" name="role_ui" value="study_room">
  <p class="auth-section-title">기본등록</p>
  <p class="form-note">필수: 교습형태 · 이름 · 주대상 · 주력과목 · 원장성별 · 슬로건 · 집주소 · 사업장주소 · 홍보지역 1번. 홍보 2·3번은 선택입니다. (정본 입력은 가입 SPA 폼)</p>

  <div class="form-group">
    <label class="form-label form-label--required" for="study_room_name">공부방명</label>
    <input class="form-input" id="study_room_name" name="study_room_name" value="<?= study114_e(study114_old($old, 'study_room_name', '')) ?>" required>
  </div>

  <div class="form-group">
    <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
    <input class="form-input" id="main_subject_note" name="main_subject_note" value="<?= study114_e(study114_old($old, 'main_subject_note', '')) ?>" required>
  </div>

  <div class="form-group">
    <span class="form-label form-label--required">원장 성별</span>
    <div class="form-radio-group" role="radiogroup">
      <label class="form-radio">
        <input type="radio" name="gender" value="male" <?= $profileGender === 'male' ? 'checked' : '' ?> required>
        <span class="form-radio__label">남</span>
      </label>
      <label class="form-radio">
        <input type="radio" name="gender" value="female" <?= $profileGender === 'female' ? 'checked' : '' ?> required>
        <span class="form-radio__label">여</span>
      </label>
    </div>
  </div>

  <div class="form-group form-address">
    <label class="form-label">집주소 (선택)</label>
    <div class="form-address__zip-row">
      <input class="form-input" type="text" id="home_address_zip" name="home_address_zip" value="<?= study114_e(study114_old($old, 'home_address_zip', '')) ?>" placeholder="우편번호" readonly>
      <button type="button" class="btn btn--secondary" data-php-address="home">주소 검색</button>
    </div>
    <input class="form-input" type="text" id="home_address" name="home_address" value="<?= study114_e(study114_old($old, 'home_address', '')) ?>" placeholder="도로명 주소 (검색으로 입력)" readonly>
  </div>

  <div class="form-group form-address">
    <label class="form-label form-label--required">사업장주소</label>
    <div class="form-address__zip-row">
      <input class="form-input" type="text" id="address_zip" name="address_zip" value="<?= study114_e(study114_old($old, 'address_zip', '')) ?>" placeholder="우편번호" readonly required>
      <button type="button" class="btn btn--secondary" data-php-address="business">주소 검색</button>
    </div>
    <input class="form-input" type="text" id="address_text" name="address_text" value="<?= study114_e(study114_old($old, 'address_text', '')) ?>" placeholder="도로명 주소 (검색으로 입력)" readonly required>
    <p class="form-hint">사업장주소가 지도에 나타납니다.</p>
    <input type="hidden" id="address_sido" name="address_sido" value="<?= study114_e(study114_old($old, 'address_sido', '')) ?>">
    <input type="hidden" id="address_sigungu" name="address_sigungu" value="<?= study114_e(study114_old($old, 'address_sigungu', '')) ?>">
    <input type="hidden" id="address_bname" name="address_bname" value="<?= study114_e(study114_old($old, 'address_bname', '')) ?>">
    <input type="hidden" id="region_basis_type" name="region_basis_type" value="dong">
    <input type="hidden" name="saved_regions[0][region_basis_type]" value="dong">
    <input type="hidden" name="saved_regions[0][is_primary]" value="1">
    <input type="hidden" id="promo_bname" name="saved_regions[0][address_bname]" value="">
  </div>

  <div class="actions-stack">
    <button type="submit" class="btn btn--primary btn--block">저장 · 다음</button>
  </div>
</form>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
(function () {
  function openPost(onComplete) {
    var Postcode = (window.kakao && window.kakao.Postcode) || (window.daum && window.daum.Postcode);
    if (!Postcode) {
      alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    new Postcode({ oncomplete: onComplete }).open({ popupTitle: '주소 검색' });
  }
  function roadOf(data) {
    return (data.roadAddress || data.autoRoadAddress || data.address || '').trim();
  }
  document.querySelectorAll('[data-php-address]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-php-address');
      openPost(function (data) {
        var road = roadOf(data);
        if (kind === 'home') {
          document.getElementById('home_address_zip').value = data.zonecode || '';
          document.getElementById('home_address').value = road;
          return;
        }
        document.getElementById('address_zip').value = data.zonecode || '';
        document.getElementById('address_text').value = road;
        document.getElementById('address_sido').value = data.sido || '';
        document.getElementById('address_sigungu').value = data.sigungu || '';
        document.getElementById('address_bname').value = data.bname || '';
        document.getElementById('promo_bname').value = data.bname || '';
      });
    });
  });
})();
</script>
