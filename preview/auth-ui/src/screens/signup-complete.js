import { signupState, ROLE_LABELS, resetSignupState } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi } from '../auth-api.js';
import { resolveAfterAuthUrl } from '../../../shared/auth-redirect.js';
import {
  HOME_UI_BASE,
  STUDY_ROOM_UI_BASE,
  TUTOR_UI_BASE,
  homeUiUrl,
} from '../../../shared/preview-links.js';

function maskEmail(email) {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at < 1) return '확인됨';
  return `${e.slice(0, Math.min(2, at))}***${e.slice(at)}`;
}

function summarizeBasic(role, data) {
  if (!data) return '—';
  if (role === 'student') {
    return [
      data.preferred_lesson_type && `희망유형: ${data.preferred_lesson_type}`,
      data.region_label && `희망지역 seed: ${data.region_label}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (role === 'study_room') {
    const promo1 = Array.isArray(data.saved_regions) ? data.saved_regions[0] || {} : {};
    const promoLabel =
      promo1.region_label ||
      promo1.complex_name ||
      promo1.complex_address ||
      (promo1.region_id ? `region#${promo1.region_id}` : '');
    return [data.study_room_name, data.main_subject_note, promoLabel && `홍보지역1: ${promoLabel}`]
      .filter(Boolean)
      .join(' · ');
  }
  return [data.tutor_display_name, data.main_subject_note, data.region_label || data.activity_city]
    .filter(Boolean)
    .join(' · ');
}

/** 공부방 기본등록 완료 기준: 홍보지역 1 (사업장 region_id와 별개) */
function studyRoomHasPromoSlot1(basic) {
  const slot = Array.isArray(basic?.saved_regions) ? basic.saved_regions[0] || {} : {};
  if (String(slot.region_id || '').trim()) return true;
  if (String(slot.complex_id || '').trim()) return true;
  if (String(slot.region_label || '').trim()) return true;
  if (String(slot.address_sido || '').trim() || String(slot.address_bname || '').trim()) return true;
  if (slot.region_basis_type === 'complex') {
    return !!(
      String(slot.complex_name || '').trim() ||
      String(slot.complex_address || '').trim() ||
      String(slot.address_text || '').trim()
    );
  }
  return false;
}

export function renderSignupComplete() {
  const role = signupState.role || 'student';
  const roleLabel = ROLE_LABELS[role];
  const saved = signupState.lastSignup;
  const basic = signupState.basicRegister?.[role];
  const profile = signupState.basicRegisterResult;

  const content = `
    ${renderStepIndicator(5, 5)}
    <div class="panel success-message">
      <div class="success-icon">✓</div>
      <h1 class="auth-heading">가입 · 기본등록 완료</h1>
      <p class="auth-subheading">
        계정과 기본등록이 완료되었습니다.<br />
        아직 검색·리스트에 <strong>공개되지 않습니다</strong>.<br />
        검색/공개에 쓰이는 항목은 <strong>상세등록</strong>에서 완성합니다.
      </p>

      <dl class="success-info">
        <dt>회원 ID (DB)</dt>
        <dd>${saved?.userId ?? '—'}</dd>
        <dt>로그인 계정</dt>
        <dd>${maskEmail(saved?.email)}</dd>
        <dt>역할 (DB role_type)</dt>
        <dd>${saved?.roleType ?? '—'}</dd>
        <dt>기본등록 프로필</dt>
        <dd>${profile ? `${profile.kind} #${profile.id}` : '—'}</dd>
        <dt>기본등록 seed</dt>
        <dd>${summarizeBasic(role, basic)}</dd>
      </dl>

      <div class="detail-cta panel panel--muted mt-6">
        <p class="auth-section-title">다음 · 상세등록 (선택)</p>
        <p class="form-note">
          기본등록만으로도 가입은 완료되었습니다. 상세등록은 나중에 마이페이지에서 이어갈 수 있습니다.
          검색·목록 공개에 쓰이는 항목은 상세등록에서 완성합니다. (${roleLabel})
        </p>
      </div>

      <div class="actions-stack">
        <button type="button" class="btn btn--primary btn--block" data-action="go-detail-register">
          상세등록 이어하기
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-action="go-home">
          나중에 상세등록 (홈으로)
        </button>
        <button type="button" class="btn btn--ghost btn--block" data-nav="/login">로그인하기</button>
      </div>
    </div>
  `;

  return renderAuthShell(content);
}

export function bindSignupCompleteEvents(root) {
  bindGlobalEvents(root);

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (!me.email_verified || me.needs_account_contact) {
        window.location.href = resolveAfterAuthUrl(me);
      }
    })
    .catch(() => navigate('/login'));

  root.querySelector('[data-action="go-detail-register"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    if (role === 'study_room') {
      window.open(STUDY_ROOM_UI_BASE, '_blank');
      return;
    }
    if (role === 'tutor') {
      window.open(TUTOR_UI_BASE, '_blank');
      return;
    }
    window.open(`${HOME_UI_BASE}/#/mypage/registrations/students`, '_blank');
  });

  root.querySelector('[data-action="go-home"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    const basic = signupState.basicRegister?.[role];
    const savedOk =
      !!signupState.basicRegisterResult?.id &&
      (role === 'study_room'
        ? signupState.basicRegisterResult?.kind === 'study_room'
        : role === 'tutor'
          ? signupState.basicRegisterResult?.kind === 'tutor'
          : signupState.basicRegisterResult?.kind === 'student');
    const hasSeed =
      !!basic &&
      (role === 'student'
        ? !!(basic.region_id || basic.complex_id || basic.activity_city || basic.region_label)
        : role === 'study_room'
          ? studyRoomHasPromoSlot1(basic) || savedOk
          : !!(basic.region_id || basic.activity_city));

    if (role === 'study_room' && hasSeed) {
      // 잘못된 「지역 없음」 경고 대신 완료 안내만
      window.alert('기본등록이 완료되었습니다. 상세등록은 마이페이지에서 이어갈 수 있습니다.');
    } else if (!hasSeed) {
      const proceed = window.confirm(
        '홍보지역(기본등록) 정보가 없습니다. 그래도 홈으로 이동할까요?\n마이페이지에서 기본·상세등록을 이어갈 수 있습니다.',
      );
      if (!proceed) return;
    }

    // 학생 찾기 기본값 seed (공부방 홍보지역과 무관)
    try {
      if (basic?.region_label || basic?.activity_city) {
        const hope =
          role === 'student' && basic.preferred_lesson_type === 'study_room'
            ? 'study_room'
            : role === 'student'
              ? 'tutor'
              : null;
        if (hope) {
          const key = 'study114.studentFind.lastRegionByHope';
          const prev = JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || '{}');
          prev[hope] = basic.region_label || basic.activity_city;
          localStorage.setItem(key, JSON.stringify(prev));
        }
      }
    } catch {
      /* ignore */
    }

    const home =
      role === 'study_room' ? homeUiUrl('study-room') : role === 'tutor' ? homeUiUrl('tutor') : homeUiUrl('parent');
    window.open(home, '_blank');
  });

  root.querySelector('[data-nav="/login"]')?.addEventListener('click', () => {
    resetSignupState();
  });
}
